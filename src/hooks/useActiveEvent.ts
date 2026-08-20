import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  date_label: string | null;
  reminders_enabled: boolean;
  attendee_count: number;
  has_rsvped: boolean;
  reminder_opted_in: boolean;
}

export interface EventAttendee {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  position: string | null;
  organization: string | null;
  responded_at: string;
}

/**
 * Loads the currently-visible event (if any) plus this user's RSVP and reminder
 * state. Visibility/lifecycle is decided in the database, so retiring an event
 * needs no frontend change.
 */
export function useActiveEvent(enabled: boolean) {
  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpPending, setRsvpPending] = useState(false);
  const [reminderPending, setReminderPending] = useState(false);

  // Guards against double-submits from rapid repeat clicks.
  const inFlight = useRef({ rsvp: false, reminder: false });

  const fetchEvent = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_event');
      if (error) throw error;
      setEvent((data as ActiveEvent[] | null)?.[0] ?? null);
    } catch (err) {
      console.error('Error loading active event:', err);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchEvent();
  }, [enabled, fetchEvent]);

  /** Idempotent server-side; safe to call again after a failure. */
  const rsvp = useCallback(async (): Promise<boolean> => {
    if (!event || inFlight.current.rsvp || event.has_rsvped) return false;

    inFlight.current.rsvp = true;
    setRsvpPending(true);

    // Optimistic: reflect the RSVP immediately, roll back if the call fails.
    const previous = event;
    setEvent({
      ...event,
      has_rsvped: true,
      attendee_count: event.attendee_count + 1,
    });

    try {
      const { error } = await supabase.rpc('rsvp_to_event', { p_event_id: event.id });
      if (error) throw error;
      // Re-read so the count reflects other users' RSVPs too.
      await fetchEvent();
      return true;
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      setEvent(previous);
      return false;
    } finally {
      inFlight.current.rsvp = false;
      setRsvpPending(false);
    }
  }, [event, fetchEvent]);

  /** Records explicit reminder consent. Never called implicitly. */
  const enableReminder = useCallback(async (): Promise<boolean> => {
    if (!event || inFlight.current.reminder || event.reminder_opted_in) return false;

    inFlight.current.reminder = true;
    setReminderPending(true);

    const previous = event;
    setEvent({ ...event, reminder_opted_in: true });

    try {
      const { error } = await supabase.rpc('set_event_reminder_consent', {
        p_event_id: event.id,
        p_consented: true,
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error saving reminder consent:', err);
      setEvent(previous);
      return false;
    } finally {
      inFlight.current.reminder = false;
      setReminderPending(false);
    }
  }, [event]);

  return { event, loading, rsvp, rsvpPending, enableReminder, reminderPending, refresh: fetchEvent };
}

/** Fetches the attendee roster on demand (used by the preview row and "See all"). */
export function useEventAttendees(eventId: string | null | undefined, enabled: boolean) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchAttendees = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(false);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_event_attendees', {
        p_event_id: eventId,
        p_limit: 200,
        p_offset: 0,
      });
      if (rpcError) throw rpcError;
      setAttendees((data as EventAttendee[]) || []);
    } catch (err) {
      console.error('Error loading attendees:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!enabled || !eventId) return;
    fetchAttendees();
  }, [enabled, eventId, fetchAttendees]);

  return { attendees, loading, error, refresh: fetchAttendees };
}
