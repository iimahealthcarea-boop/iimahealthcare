-- Make organization names searchable in the admin panel.
--
-- Background: profiles has two organization stores.
--   * profiles.organization  (TEXT)  - legacy, no UI writes to it. Verified empty
--                                      in every active row (0/76).
--   * profiles.organizations (JSONB) - the array the OrganizationSelector actually
--                                      writes, shape [{currentOrg, orgType, ...}].
--
-- The admin search (supabase/functions/profile-list) was searching the legacy
-- TEXT column, so organization searches never matched anything. PostgREST cannot
-- apply ilike to a jsonb column inside an .or() chain, so this migration exposes
-- the org names as a derived TEXT column that ilike can target directly.
--
-- All organizations are flattened, not just the first, so a member who lists
-- several employers is found by any of them.

BEGIN;

-- Trigram index support for substring/partial matching. Verified available on
-- this project (pg_available_extensions) and not yet installed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- jsonb_path_query_array is IMMUTABLE, which a STORED generated column requires.
-- The ::text cast yields e.g. ["Novartis", "Zydus"] — the surrounding brackets
-- and quotes are harmless for ilike '%term%' matching.
--
-- The jsonb_typeof guard matters: organizations is nullable and, if any row ever
-- held a non-array value, jsonb_path_query_array would raise and the generated
-- column expression would fail for that row.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organizations_search_text TEXT
  GENERATED ALWAYS AS (
    CASE
      WHEN jsonb_typeof(organizations) = 'array'
      THEN jsonb_path_query_array(organizations, '$[*].currentOrg')::text
      ELSE NULL
    END
  ) STORED;

COMMENT ON COLUMN public.profiles.organizations_search_text IS
  'Derived from organizations JSONB: flattened currentOrg names for admin search. Maintained automatically; do not write to it.';

CREATE INDEX IF NOT EXISTS idx_profiles_org_search_trgm
  ON public.profiles USING gin (organizations_search_text gin_trgm_ops);

COMMIT;
