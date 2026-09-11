-- Correct the program label typo: MBA-FPGP -> MBA-BPGP, and record AGMP.
--
-- This only refreshes the column's documentation comment. profiles.program is
-- a plain TEXT column with no enum or CHECK constraint, and a check confirmed
-- zero rows currently store 'MBA-FPGP', so no data migration is required.
--
-- The historical migration 20241220_add_profile_fields.sql still mentions
-- MBA-FPGP. That file is a record of a one-time backfill that already ran and
-- is deliberately left untouched; this migration supersedes its comment.

COMMENT ON COLUMN public.profiles.program IS
  'Program type: MBA-PGDBM, MBA-FABM, MBA-PGPX, PhD, MBA-BPGP, ePGD-ABA, FDP, AFP, SMP, AGMP, Other';

-- Safety net: if any row ever did hold the old misspelling, correct it.
-- (Matched 0 rows when this was applied.)
UPDATE public.profiles
SET program = 'MBA-BPGP'
WHERE program = 'MBA-FPGP';
