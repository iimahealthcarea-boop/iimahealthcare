-- Enforce that profiles.linkedin_url holds a personal LinkedIn profile URL.
--
-- Mirrors the client-side helper in src/utils/linkedinUrl.ts. This is a backstop:
-- it also covers writes that bypass the UI, notably the
-- approve_profile_update_request() RPC in 20251007090000_profile_update_requests.sql.
--
-- Audit taken before this migration (76 active profiles):
--   25 blank/NULL, 51 non-blank, of which 18 already valid and 33 invalid.
--   Of the 33 invalid: 10 recoverable by normalization, 23 unrecoverable junk.
--
-- Step 1 normalizes the recoverable values, step 2 nulls the junk, step 3 adds
-- the constraint as NOT VALID so any row missed by steps 1-2 (e.g. soft-deleted
-- profiles) does not block the migration.

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1: normalize recoverable URLs.
--
-- These are real profile links carrying mobile-share tracking params, and one
-- with stray spaces from a bad paste. Whitespace is stripped first, then the
-- query string/fragment, then the URL is rewritten to canonical form. The
-- profile slug — including LinkedIn's hash-style suffixes (e.g. -510aaa120) —
-- is preserved exactly.
--
-- Pre-cleanup values (recorded here in lieu of a backup column; 10 rows):
--   .../in/sariha-s-49727279?utm_source=share_via&utm_content=profile&utm_medium=member_android
--   .../in/abhishekmthw?utm_source=share_via&...
--   .../in/balamurugan-m-714678248?utm_source=share_via&...
--   .../in/kali-mullah-khan-6823a3147?utm_source=share_via&...
--   .../in/mohammed-ashraf-k-014512141?utm_source=share_via&...
--   .../in/pooja-k-842245292?utm_source=share_via&...
--   .../in/shang-tika-48bb74206?utm_source=share_via&...
--   .../in/vijaya-kumar-d-5760aa19a?utm_source=share_via&...
--   .../in/johndoe123?utm_source=chatgpt.com
--   'https://www.linkedin.com/ in/rajashree-rajkumar- 166021222'  (stray spaces)
-- ---------------------------------------------------------------------------
UPDATE public.profiles
SET linkedin_url = 'https://www.linkedin.com/in/' ||
  substring(
    split_part(split_part(regexp_replace(linkedin_url, '\s', '', 'g'), '#', 1), '?', 1)
    FROM '(?i)linkedin\.com/in/([^/?#]+?)/?$'
  )
WHERE linkedin_url IS NOT NULL
  AND btrim(linkedin_url) <> ''
  -- not already canonical
  AND linkedin_url !~ '^https://www\.linkedin\.com/in/[^/?#[:space:]]+$'
  -- but does resolve to a profile slug once cleaned
  AND substring(
        split_part(split_part(regexp_replace(linkedin_url, '\s', '', 'g'), '#', 1), '?', 1)
        FROM '(?i)linkedin\.com/in/([^/?#]+?)/?$'
      ) IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Step 2: null out unrecoverable values.
--
-- These carry no profile information. NULL is permitted by the constraint, so
-- these members can continue editing other fields and will be asked for a
-- LinkedIn URL the next time they touch that field.
--
-- Pre-cleanup values (23 rows): 'na', 'Nil', 'N', 'No linked profile',
--   'Meena Janakiraman', 'Udhaykumar u', 'kushibabukoppula', 'Linkedin 123',
--   'LinkedIn.mnaikandan', 'nitin@medvol.in', 'Selvarani@medvol.in',
--   'www.chandra', 'www.Melvin.com', 'https://LinkedIn.sriharsha.puranik',
--   'https://www.linkedin.com/', 'https://in.linkedin.com/',
--   'https://www.linkedin.com/help/linkedin/topic/a64',
--   'https://youtube.com/shorts/c6jLIc-1kt0?si=9vKkNsE4AcPMbW_S', and similar.
-- ---------------------------------------------------------------------------
UPDATE public.profiles
SET linkedin_url = NULL
WHERE linkedin_url IS NOT NULL
  AND btrim(linkedin_url) <> ''
  AND linkedin_url !~ '^https://www\.linkedin\.com/in/[^/?#[:space:]]+$';

-- ---------------------------------------------------------------------------
-- Step 3: add the constraint.
--
-- NOT VALID skips the scan of existing rows; every INSERT/UPDATE is still
-- checked from here on. Blank and NULL remain allowed so that the field stays
-- optional at the database level (the UI enforces "required" at registration).
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_linkedin_url_format;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_linkedin_url_format CHECK (
    linkedin_url IS NULL
    OR btrim(linkedin_url) = ''
    OR linkedin_url ~ '^https://www\.linkedin\.com/in/[^/?#[:space:]]+$'
  ) NOT VALID;

COMMENT ON CONSTRAINT profiles_linkedin_url_format ON public.profiles IS
  'linkedin_url must be a canonical personal profile URL (https://www.linkedin.com/in/<slug>). Company/school/jobs/directory pages are rejected. Kept in sync with src/utils/linkedinUrl.ts.';

COMMIT;
