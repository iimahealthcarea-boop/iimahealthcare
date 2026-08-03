-- Run these in the Supabase SQL editor. Sections 1-3 are read-only diagnosis;
-- section 4 is the cleanup and is commented out until you have looked at 1-3.

-- 1. What is the ACTUAL foreign key on profiles.user_id in the live database?
--    Expect: delete_rule = 'CASCADE'. If this returns no rows, the constraint is
--    missing entirely, which is why deleting the auth user left the profile row.
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Profiles whose auth user no longer exists. Ashok Jain should show up here
--    if the account really was deleted and only the profile row survived.
SELECT p.user_id, p.email, p.first_name, p.last_name, p.deleted_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE u.id IS NULL
ORDER BY p.deleted_at DESC NULLS LAST;

-- 3. The opposite case: the account is still there but soft-deleted by Supabase
--    (auth.users.deleted_at set), which looks like a deletion in the dashboard
--    but leaves the row — and keeps the email address taken.
SELECT u.id, u.email, u.deleted_at AS auth_deleted_at, u.banned_until
FROM auth.users u
WHERE u.deleted_at IS NOT NULL
ORDER BY u.deleted_at DESC;


-- 4. CLEANUP — uncomment and run once you have confirmed the rows above.
--    Removes every profile whose auth user is gone, along with its dependants.

-- BEGIN;
--
-- CREATE TEMP TABLE orphans AS
-- SELECT p.user_id
-- FROM public.profiles p
-- LEFT JOIN auth.users u ON u.id = p.user_id
-- WHERE u.id IS NULL;
--
-- DELETE FROM public.user_starred_profiles
--  WHERE user_id IN (SELECT user_id FROM orphans)
--     OR starred_profile_id IN (SELECT user_id FROM orphans);
--
-- DELETE FROM public.user_directory
--  WHERE user_id IN (SELECT user_id FROM orphans)
--     OR member_id IN (SELECT user_id FROM orphans);
--
-- DELETE FROM public.profile_update_requests
--  WHERE profile_user_id IN (SELECT user_id FROM orphans)
--     OR submitted_by IN (SELECT user_id FROM orphans);
--
-- DELETE FROM public.profile_changes
--  WHERE profile_user_id IN (SELECT user_id FROM orphans)
--     OR changed_by IN (SELECT user_id FROM orphans);
--
-- DELETE FROM public.user_roles WHERE user_id IN (SELECT user_id FROM orphans);
--
-- UPDATE public.profiles SET approved_by = NULL
--  WHERE approved_by IN (SELECT user_id FROM orphans);
-- UPDATE public.profiles SET deleted_by = NULL
--  WHERE deleted_by IN (SELECT user_id FROM orphans);
-- UPDATE public.organizations SET created_by = NULL
--  WHERE created_by IN (SELECT user_id FROM orphans);
-- UPDATE public.cities SET created_by = NULL
--  WHERE created_by IN (SELECT user_id FROM orphans);
--
-- DELETE FROM public.profiles WHERE user_id IN (SELECT user_id FROM orphans);
--
-- COMMIT;


-- 5. Restore the cascade so this cannot happen again, whatever section 1 said.
--    Safe to run even if the constraint is already correct.

-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
-- ALTER TABLE public.profiles
--     ADD CONSTRAINT profiles_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
