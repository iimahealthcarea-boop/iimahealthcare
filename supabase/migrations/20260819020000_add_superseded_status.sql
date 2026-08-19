-- Part 1 of 2: add the 'superseded' enum value.
--
-- This is deliberately a separate migration from the columns/RPCs/backfill.
-- PostgreSQL does not allow a newly added enum value to be *used* in the same
-- transaction that adds it, and the backfill in 20260819020100 needs to write
-- 'superseded' rows. Splitting the files guarantees the ADD VALUE has committed
-- before anything references the label.

ALTER TYPE public.profile_update_request_status ADD VALUE IF NOT EXISTS 'superseded';
