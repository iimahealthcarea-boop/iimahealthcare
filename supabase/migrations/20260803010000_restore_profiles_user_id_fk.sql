-- The live database has no foreign key from profiles.user_id to auth.users,
-- even though 20250918115836 declares one with ON DELETE CASCADE. This project
-- was not built by replaying these migration files, so the constraint never
-- existed here.
--
-- Confirmed by querying information_schema.table_constraints for public.profiles,
-- which returns only profiles_approved_by_fkey and profiles_deleted_by_fkey.
--
-- Consequence: deleting a row from auth.users leaves the profile row behind with
-- no cascade and no error, which is why deleted members kept appearing in the
-- admin lists.

BEGIN;

-- 1. Remove rows whose auth user is already gone. This has to happen before the
--    constraint is added, otherwise validation fails against the existing orphans.
--
--    The orphan set is derived from public.profiles each time rather than held in
--    a temp table, so the DELETE from profiles itself must stay last -- once those
--    rows are gone the set is empty.

DELETE FROM public.user_starred_profiles
 WHERE user_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id))
    OR starred_profile_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

DELETE FROM public.user_directory
 WHERE user_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id))
    OR member_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

DELETE FROM public.profile_update_requests
 WHERE profile_user_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id))
    OR submitted_by IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

UPDATE public.profile_update_requests SET reviewed_by = NULL
 WHERE reviewed_by IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

DELETE FROM public.profile_changes
 WHERE profile_user_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id))
    OR changed_by IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

DELETE FROM public.user_roles
 WHERE user_id IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

UPDATE public.profiles SET approved_by = NULL
 WHERE approved_by IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

UPDATE public.profiles SET deleted_by = NULL
 WHERE deleted_by IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

UPDATE public.organizations SET created_by = NULL
 WHERE created_by IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

UPDATE public.cities SET created_by = NULL
 WHERE created_by IN (
        SELECT p.user_id FROM public.profiles p
        WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id));

-- Must be last: this empties the orphan set the statements above depend on.
DELETE FROM public.profiles p
 WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.user_id);

-- 2. Add the constraint that should have been there all along.
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;
