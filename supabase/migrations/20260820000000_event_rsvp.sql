-- Temporary event announcements (e.g. "SIG Healthcare Meet 2026")
--
-- Three small tables:
--   events                  - the announcement itself, with a visibility window
--   event_responses         - one RSVP row per user per event
--   event_reminder_consents - explicit opt-in to reminders, kept separate from
--                             the RSVP so consent is auditable on its own
--
-- Attendee names/avatars are read through a SECURITY DEFINER RPC rather than a
-- direct join, because public.profiles is only SELECT-able when is_public = true.
-- A plain join would silently omit non-public attendees and make the visible
-- list disagree with the count.

-- ---------------------------------------------------------------- enums

DO $$ BEGIN
  CREATE TYPE public.event_rsvp_status AS ENUM ('going');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------- events

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  -- Human-readable date line shown in the UI (e.g. "March 14 - 15, 2026"),
  -- so the card doesn't have to reformat multi-day ranges client-side.
  date_label TEXT,
  -- Master switch. Flip to false to retire the event without deleting RSVPs.
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Optional visibility window; NULL means "no bound on that side".
  visible_from TIMESTAMP WITH TIME ZONE,
  visible_until TIMESTAMP WITH TIME ZONE,
  -- Whether the card should offer the reminder opt-in at all.
  reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------- event_responses

CREATE TABLE IF NOT EXISTS public.event_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.event_rsvp_status NOT NULL DEFAULT 'going',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- One RSVP per user per event; makes repeat clicks idempotent.
  CONSTRAINT event_responses_event_user_unique UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_responses_event_id_idx
  ON public.event_responses(event_id);

-- ----------------------------------------------- event_reminder_consents

CREATE TABLE IF NOT EXISTS public.event_reminder_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Explicit opt-in. Stored as a flag (rather than row-presence) so a
  -- withdrawal is recorded rather than erased.
  consented BOOLEAN NOT NULL DEFAULT true,
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT event_reminder_consents_event_user_unique UNIQUE (event_id, user_id)
);

DROP TRIGGER IF EXISTS update_event_reminder_consents_updated_at ON public.event_reminder_consents;
CREATE TRIGGER update_event_reminder_consents_updated_at
  BEFORE UPDATE ON public.event_reminder_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------ RLS

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminder_consents ENABLE ROW LEVEL SECURITY;

-- events: any signed-in user may read a currently-visible event.
DROP POLICY IF EXISTS "Authenticated users can view visible events" ON public.events;
CREATE POLICY "Authenticated users can view visible events"
ON public.events
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (visible_from IS NULL OR visible_from <= now())
  AND (visible_until IS NULL OR visible_until >= now())
);

DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- event_responses: users insert/read/delete only their own row. There is no
-- UPDATE policy — RSVP is single-valued ("going"), so there is nothing to change.
DROP POLICY IF EXISTS "Users can RSVP for themselves" ON public.event_responses;
CREATE POLICY "Users can RSVP for themselves"
ON public.event_responses
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
      AND e.is_active = true
      AND (e.visible_from IS NULL OR e.visible_from <= now())
      AND (e.visible_until IS NULL OR e.visible_until >= now())
  )
);

DROP POLICY IF EXISTS "Users can view their own RSVP" ON public.event_responses;
CREATE POLICY "Users can view their own RSVP"
ON public.event_responses
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can withdraw their own RSVP" ON public.event_responses;
CREATE POLICY "Users can withdraw their own RSVP"
ON public.event_responses
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all RSVPs" ON public.event_responses;
CREATE POLICY "Admins can view all RSVPs"
ON public.event_responses
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- event_reminder_consents: strictly self-managed.
DROP POLICY IF EXISTS "Users can create their own reminder consent" ON public.event_reminder_consents;
CREATE POLICY "Users can create their own reminder consent"
ON public.event_reminder_consents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own reminder consent" ON public.event_reminder_consents;
CREATE POLICY "Users can view their own reminder consent"
ON public.event_reminder_consents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reminder consent" ON public.event_reminder_consents;
CREATE POLICY "Users can update their own reminder consent"
ON public.event_reminder_consents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all reminder consents" ON public.event_reminder_consents;
CREATE POLICY "Admins can view all reminder consents"
ON public.event_reminder_consents
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- ----------------------------------------------------------------- RPCs

-- Returns the single event a user should currently be shown, together with
-- that user's own RSVP/consent state and the attendee count.
CREATE OR REPLACE FUNCTION public.get_active_event()
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  date_label TEXT,
  reminders_enabled BOOLEAN,
  attendee_count BIGINT,
  has_rsvped BOOLEAN,
  reminder_opted_in BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.slug,
    e.title,
    e.description,
    e.location,
    e.starts_at,
    e.ends_at,
    e.date_label,
    e.reminders_enabled,
    (SELECT count(*) FROM public.event_responses r WHERE r.event_id = e.id) AS attendee_count,
    EXISTS (
      SELECT 1 FROM public.event_responses r
      WHERE r.event_id = e.id AND r.user_id = auth.uid()
    ) AS has_rsvped,
    EXISTS (
      SELECT 1 FROM public.event_reminder_consents c
      WHERE c.event_id = e.id AND c.user_id = auth.uid() AND c.consented = true
    ) AS reminder_opted_in
  FROM public.events e
  WHERE auth.uid() IS NOT NULL
    AND e.is_active = true
    AND (e.visible_from IS NULL OR e.visible_from <= now())
    AND (e.visible_until IS NULL OR e.visible_until >= now())
  ORDER BY e.starts_at ASC
  LIMIT 1;
$$;

-- Attendee list for an event. SECURITY DEFINER so the roster stays complete
-- even for members whose profile is not public; only display-safe columns are
-- returned (no email/phone/address).
CREATE OR REPLACE FUNCTION public.get_event_attendees(
  p_event_id UUID,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  position TEXT,
  organization TEXT,
  responded_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.position,
    p.organization,
    r.created_at AS responded_at
  FROM public.event_responses r
  JOIN public.profiles p ON p.user_id = r.user_id
  JOIN public.events e ON e.id = r.event_id
  WHERE r.event_id = p_event_id
    AND auth.uid() IS NOT NULL
    -- Roster is only readable while the event itself is readable.
    AND e.is_active = true
    AND (e.visible_from IS NULL OR e.visible_from <= now())
    AND (e.visible_until IS NULL OR e.visible_until >= now())
    AND p.deleted_at IS NULL
  ORDER BY r.created_at ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 500)
  OFFSET GREATEST(p_offset, 0);
$$;

-- Idempotent RSVP. Repeat clicks are a no-op rather than an error.
CREATE OR REPLACE FUNCTION public.rsvp_to_event(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id
      AND e.is_active = true
      AND (e.visible_from IS NULL OR e.visible_from <= now())
      AND (e.visible_until IS NULL OR e.visible_until >= now())
  ) THEN
    RAISE EXCEPTION 'Event is not open for RSVP';
  END IF;

  INSERT INTO public.event_responses (event_id, user_id, status)
  VALUES (p_event_id, auth.uid(), 'going')
  ON CONFLICT (event_id, user_id) DO NOTHING;
END;
$$;

-- Explicit reminder opt-in / withdrawal.
CREATE OR REPLACE FUNCTION public.set_event_reminder_consent(
  p_event_id UUID,
  p_consented BOOLEAN DEFAULT true
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id
      AND e.is_active = true
      AND e.reminders_enabled = true
      AND (e.visible_from IS NULL OR e.visible_from <= now())
      AND (e.visible_until IS NULL OR e.visible_until >= now())
  ) THEN
    RAISE EXCEPTION 'Reminders are not available for this event';
  END IF;

  INSERT INTO public.event_reminder_consents (event_id, user_id, consented, consented_at)
  VALUES (p_event_id, auth.uid(), p_consented, now())
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET
    consented = EXCLUDED.consented,
    consented_at = now(),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_event() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_attendees(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rsvp_to_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_event_reminder_consent(UUID, BOOLEAN) TO authenticated;

-- ------------------------------------------------------- seed the event

INSERT INTO public.events (
  slug, title, description, location, starts_at, ends_at, date_label,
  is_active, visible_until, reminders_enabled
)
VALUES (
  'sig-healthcare-meet-2026',
  'SIG Healthcare Meet 2026',
  'Join alumni, share ideas, and shape the future of healthcare together.',
  'IIMA Campus, Ahmedabad',
  '2026-08-22 09:00:00+05:30',
  '2026-08-22 18:00:00+05:30',
  'August 22, 2026',
  true,
  -- Card disappears on its own the day after the event ends.
  '2026-08-23 23:59:59+05:30',
  true
)
ON CONFLICT (slug) DO NOTHING;
