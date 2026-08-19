-- Part 2 of 2: superseding + concurrency control for profile update requests.
--
-- Problem being fixed
-- -------------------
-- submitted_payload is a SPARSE diff of new values only. Nothing recorded the
-- baseline the user edited against, and nothing prevented several pending
-- requests touching the same field. An admin approving an older request after a
-- newer one silently overwrote the newer value.
--
-- Invariant enforced from here on
-- ------------------------------
--   A newer user request for an overlapping field always wins over an older
--   request, regardless of the order in which admins review them.
--
-- Design notes
-- ------------
-- * Superseding is REQUEST-level, keyed on payload-key overlap (?| operator).
--   Requests touching disjoint field sets stay independently pending, so
--   phone and email edits do not interfere.
-- * A partial unique index on (profile_user_id) WHERE status='pending' is
--   deliberately NOT used: it would cap a user at one pending request total and
--   break independent-field updates. The real invariant ("no two pending
--   requests may share a payload key") is not expressible as a btree unique
--   index over JSONB keys, so it is enforced transactionally in the submit RPC
--   under row locks instead of via a misleading constraint.

BEGIN;

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
ALTER TABLE public.profile_update_requests
  ADD COLUMN IF NOT EXISTS superseded_by UUID
    REFERENCES public.profile_update_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMP WITH TIME ZONE,
  -- profiles.updated_at as observed when the user submitted. Gives approval a
  -- baseline to detect that the profile moved underneath a pending request.
  ADD COLUMN IF NOT EXISTS base_updated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.profile_update_requests.superseded_by IS
  'The newer request that replaced this one (overlapping payload keys).';
COMMENT ON COLUMN public.profile_update_requests.base_updated_at IS
  'profiles.updated_at at submission time; used to detect stale approvals.';

-- Supports the pending-lookup in the submit RPC and the admin list query.
CREATE INDEX IF NOT EXISTS idx_pur_user_status_created
  ON public.profile_update_requests (profile_user_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Backfill existing rows
-- ---------------------------------------------------------------------------
-- Conservative baseline for pre-existing requests: treat the submission time as
-- the baseline. Approval's staleness check tolerates NULL, so historical rows
-- are never blocked by a baseline they never had.
UPDATE public.profile_update_requests
SET base_updated_at = created_at
WHERE base_updated_at IS NULL;

-- Deterministically supersede older overlapping pending requests.
-- Ordering key is the (created_at, id) tuple so the result is stable even if
-- two rows share a timestamp -- never arbitrary row order.
WITH ranked AS (
  SELECT
    r.id,
    r.profile_user_id,
    r.created_at,
    ARRAY(SELECT jsonb_object_keys(r.submitted_payload) ORDER BY 1) AS keys
  FROM public.profile_update_requests r
  WHERE r.status = 'pending'
),
to_supersede AS (
  SELECT
    a.id AS older_id,
    (
      SELECT b.id
      FROM ranked b
      WHERE b.profile_user_id = a.profile_user_id
        AND (b.created_at, b.id) > (a.created_at, a.id)
        AND b.keys && a.keys           -- shares at least one field
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT 1
    ) AS newer_id
  FROM ranked a
)
UPDATE public.profile_update_requests r
SET status        = 'superseded',
    superseded_by = t.newer_id,
    superseded_at = now()
FROM to_supersede t
WHERE r.id = t.older_id
  AND t.newer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RPC: submit_profile_update_request
-- ---------------------------------------------------------------------------
-- Supersedes any pending request of the same user sharing >=1 payload key,
-- then inserts the new request. The lock makes concurrent submissions
-- serialize, so two overlapping submissions can never both remain pending.
CREATE OR REPLACE FUNCTION public.submit_profile_update_request(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id UUID;
  new_keys TEXT[];
  profile_updated_at TIMESTAMP WITH TIME ZONE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Payload must be a JSON object';
  END IF;

  -- An empty payload would supersede nothing and apply nothing.
  IF NOT EXISTS (SELECT 1 FROM jsonb_object_keys(payload)) THEN
    RAISE EXCEPTION 'Payload must contain at least one field';
  END IF;

  new_keys := ARRAY(SELECT jsonb_object_keys(payload) ORDER BY 1);

  -- Lock this user's pending requests for the rest of the transaction. A
  -- concurrent submit for the same user blocks here until we commit, so it
  -- observes our new row and supersedes it rather than racing alongside it.
  PERFORM 1
  FROM public.profile_update_requests
  WHERE profile_user_id = auth.uid()
    AND status = 'pending'
  FOR UPDATE;

  -- Capture the baseline the user edited against.
  SELECT p.updated_at INTO profile_updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  INSERT INTO public.profile_update_requests (
    profile_user_id, submitted_by, submitted_payload, status, base_updated_at
  ) VALUES (
    auth.uid(), auth.uid(), payload, 'pending', profile_updated_at
  ) RETURNING id INTO request_id;

  -- Supersede older pending requests that touch any of the same fields.
  -- ?| is "does the jsonb object have any of these keys", so disjoint requests
  -- (e.g. phone vs email) are left untouched and stay actionable.
  UPDATE public.profile_update_requests
  SET status        = 'superseded',
      superseded_by = request_id,
      superseded_at = now()
  WHERE profile_user_id = auth.uid()
    AND status = 'pending'
    AND id <> request_id
    AND submitted_payload ?| new_keys;

  RETURN request_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: approve_profile_update_request
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_profile_update_request(
  request_id UUID,
  override_payload JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  final_payload JSONB;
  current_profile RECORD;
  req_keys TEXT[];
  newer_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can approve requests';
  END IF;

  -- FOR UPDATE is the fix for the two-admins race: the second approval blocks
  -- here, then sees status <> 'pending' and aborts. Without the lock both
  -- transactions could read 'pending' and both apply.
  SELECT * INTO req
  FROM public.profile_update_requests
  WHERE id = request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF req.status = 'superseded' THEN
    RAISE EXCEPTION 'This request has been superseded by a newer profile update request.';
  END IF;

  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is no longer pending';
  END IF;

  req_keys := ARRAY(SELECT jsonb_object_keys(req.submitted_payload) ORDER BY 1);

  -- Defence in depth: even if a newer overlapping request somehow remained
  -- pending, refuse to let this older one overwrite it.
  SELECT id INTO newer_id
  FROM public.profile_update_requests
  WHERE profile_user_id = req.profile_user_id
    AND status = 'pending'
    AND id <> req.id
    AND (created_at, id) > (req.created_at, req.id)
    AND submitted_payload ?| req_keys
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF newer_id IS NOT NULL THEN
    RAISE EXCEPTION 'This request has been superseded by a newer profile update request.';
  END IF;

  SELECT * INTO current_profile
  FROM public.profiles
  WHERE user_id = req.profile_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user';
  END IF;

  -- Staleness guard: if the profile moved since submission, the sparse payload
  -- was computed against a baseline that no longer holds. NULL baseline means a
  -- pre-migration row, which is tolerated.
  IF req.base_updated_at IS NOT NULL
     AND current_profile.updated_at IS NOT NULL
     AND current_profile.updated_at > req.base_updated_at THEN
    RAISE EXCEPTION 'This request is stale: the profile changed after it was submitted. Ask the user to resubmit.';
  END IF;

  final_payload := COALESCE(override_payload, req.submitted_payload);

  UPDATE public.profiles p
  SET
    first_name = COALESCE(final_payload->>'first_name', p.first_name),
    last_name = COALESCE(final_payload->>'last_name', p.last_name),
    email = COALESCE(final_payload->>'email', p.email),
    phone = COALESCE(final_payload->>'phone', p.phone),
    country_code = COALESCE(final_payload->>'country_code', p.country_code),
    gender = COALESCE(final_payload->>'gender', p.gender),
    program = COALESCE(final_payload->>'program', p.program),
    graduation_year = COALESCE((final_payload->>'graduation_year')::INT, p.graduation_year),
    organization = COALESCE(final_payload->>'organization', p.organization),
    organization_type = COALESCE((final_payload->>'organization_type')::public.organization_type, p.organization_type),
    position = COALESCE(final_payload->>'position', p.position),
    experience_level = COALESCE((final_payload->>'experience_level')::public.experience_level, p.experience_level),
    location = COALESCE(final_payload->>'location', p.location),
    city = COALESCE(final_payload->>'city', p.city),
    country = COALESCE(final_payload->>'country', p.country),
    pincode = COALESCE(final_payload->>'pincode', p.pincode),
    linkedin_url = COALESCE(final_payload->>'linkedin_url', p.linkedin_url),
    website_url = COALESCE(final_payload->>'website_url', p.website_url),
    bio = COALESCE(final_payload->>'bio', p.bio),
    interests = COALESCE(ARRAY(SELECT jsonb_array_elements_text(final_payload->'interests')), p.interests),
    skills = COALESCE(ARRAY(SELECT jsonb_array_elements_text(final_payload->'skills')), p.skills),
    show_contact_info = COALESCE((final_payload->>'show_contact_info')::BOOLEAN, p.show_contact_info),
    show_location = COALESCE((final_payload->>'show_location')::BOOLEAN, p.show_location),
    is_public = COALESCE((final_payload->>'is_public')::BOOLEAN, p.is_public),
    avatar_url = COALESCE(final_payload->>'avatar_url', p.avatar_url),
    date_of_birth = COALESCE((final_payload->>'date_of_birth')::DATE, p.date_of_birth),
    address = COALESCE(final_payload->>'address', p.address),
    emergency_contact_name = COALESCE(final_payload->>'emergency_contact_name', p.emergency_contact_name),
    emergency_contact_phone = COALESCE(final_payload->>'emergency_contact_phone', p.emergency_contact_phone),
    preferred_mode_of_communication = COALESCE(ARRAY(SELECT jsonb_array_elements_text(final_payload->'preferred_mode_of_communication')), p.preferred_mode_of_communication),
    organizations = COALESCE(final_payload->'organizations', p.organizations)
  WHERE p.user_id = req.profile_user_id;

  UPDATE public.profile_update_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  PERFORM public.add_profile_change(
    req.profile_user_id,
    req.submitted_by,
    (SELECT coalesce((SELECT email FROM auth.users WHERE id = req.submitted_by), 'User')),
    final_payload,
    'update'
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: reject_profile_update_request
-- ---------------------------------------------------------------------------
-- Rejection is terminal for this request only. Later requests for the same
-- field stay actionable: the user's most recent intent should not be discarded
-- because an earlier attempt was refused.
CREATE OR REPLACE FUNCTION public.reject_profile_update_request(
  request_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can reject requests';
  END IF;

  SELECT * INTO req
  FROM public.profile_update_requests
  WHERE id = request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF req.status = 'superseded' THEN
    RAISE EXCEPTION 'This request has been superseded by a newer profile update request.';
  END IF;

  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is no longer pending';
  END IF;

  UPDATE public.profile_update_requests
  SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), admin_notes = reason
  WHERE id = request_id;

  PERFORM public.add_profile_change(
    req.profile_user_id,
    req.submitted_by,
    (SELECT coalesce((SELECT email FROM auth.users WHERE id = req.submitted_by), 'User')),
    jsonb_build_object(
      'approval_status', jsonb_build_object('oldValue', 'pending', 'newValue', 'rejected'),
      'rejection_reason', jsonb_build_object('oldValue', NULL, 'newValue', reason)
    ),
    'reject'
  );
END;
$$;

-- Permissions unchanged from 20251007090000: same three functions, same grantee.
GRANT EXECUTE ON FUNCTION public.submit_profile_update_request(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_profile_update_request(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_profile_update_request(UUID, TEXT) TO authenticated;

COMMIT;
