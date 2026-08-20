-- Correct the SIG Healthcare Meet 2026 date to 22 August 2026.
-- The original seed uses ON CONFLICT DO NOTHING, so it will not update a row
-- that already exists; this migration sets the date explicitly.

UPDATE public.events
SET
  starts_at     = '2026-08-22 09:00:00+05:30',
  ends_at       = '2026-08-22 18:00:00+05:30',
  date_label    = 'August 22, 2026',
  -- Card retires itself the day after the event.
  visible_until = '2026-08-23 23:59:59+05:30'
WHERE slug = 'sig-healthcare-meet-2026';
