-- Four more tables reference auth.users in the migration files but have no
-- foreign key in the live database, same as profiles.user_id did. Verified with
-- pg_constraint (information_schema hides auth.users, since it is owned by
-- supabase_auth_admin rather than postgres).
--
-- Missing: user_roles.user_id, user_starred_profiles.user_id,
-- profile_update_requests.{profile_user_id,submitted_by,reviewed_by},
-- profile_changes.{profile_user_id,changed_by}
--
-- Each set of orphans is cleared first so ADD CONSTRAINT can validate.

BEGIN;

-- user_roles ----------------------------------------------------------------
DELETE FROM public.user_roles r
 WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.user_id);

ALTER TABLE public.user_roles
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_starred_profiles -------------------------------------------------------
-- (starred_profile_id -> profiles already exists and cascades)
DELETE FROM public.user_starred_profiles s
 WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = s.user_id);

ALTER TABLE public.user_starred_profiles
    DROP CONSTRAINT IF EXISTS user_starred_profiles_user_id_fkey;
ALTER TABLE public.user_starred_profiles
    ADD CONSTRAINT user_starred_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- profile_update_requests -----------------------------------------------------
-- Without these, a deleted member's pending request stays in the admin queue
-- forever with no profile behind it.
DELETE FROM public.profile_update_requests r
 WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.profile_user_id)
    OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.submitted_by);

UPDATE public.profile_update_requests r SET reviewed_by = NULL
 WHERE r.reviewed_by IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = r.reviewed_by);

ALTER TABLE public.profile_update_requests
    DROP CONSTRAINT IF EXISTS profile_update_requests_profile_user_id_fkey;
ALTER TABLE public.profile_update_requests
    ADD CONSTRAINT profile_update_requests_profile_user_id_fkey
    FOREIGN KEY (profile_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profile_update_requests
    DROP CONSTRAINT IF EXISTS profile_update_requests_submitted_by_fkey;
ALTER TABLE public.profile_update_requests
    ADD CONSTRAINT profile_update_requests_submitted_by_fkey
    FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profile_update_requests
    DROP CONSTRAINT IF EXISTS profile_update_requests_reviewed_by_fkey;
ALTER TABLE public.profile_update_requests
    ADD CONSTRAINT profile_update_requests_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- profile_changes -------------------------------------------------------------
-- changed_by becomes nullable and SET NULL rather than CASCADE. The original
-- migration cascades, which would erase an admin's approve/reject records from
-- OTHER members' history the moment that admin is deleted. The readable name is
-- kept in changed_by_name, so nulling the id preserves the timeline intact.
DELETE FROM public.profile_changes c
 WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.profile_user_id);

ALTER TABLE public.profile_changes
    ALTER COLUMN changed_by DROP NOT NULL;

UPDATE public.profile_changes c SET changed_by = NULL
 WHERE c.changed_by IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = c.changed_by);

ALTER TABLE public.profile_changes
    DROP CONSTRAINT IF EXISTS profile_changes_profile_user_id_fkey;
ALTER TABLE public.profile_changes
    ADD CONSTRAINT profile_changes_profile_user_id_fkey
    FOREIGN KEY (profile_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profile_changes
    DROP CONSTRAINT IF EXISTS profile_changes_changed_by_fkey;
ALTER TABLE public.profile_changes
    ADD CONSTRAINT profile_changes_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;
