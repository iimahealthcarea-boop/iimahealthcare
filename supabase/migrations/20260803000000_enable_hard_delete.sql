-- Make it possible to hard-delete a row from auth.users so the email is freed
-- for a fresh signup. Several FKs point at auth.users with no ON DELETE action
-- (defaulting to NO ACTION), which raises a foreign key violation instead.

-- profiles.approved_by: blocks deleting any admin who has ever approved/rejected
-- a profile, because every profile they actioned still references them.
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_approved_by_fkey;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_approved_by_fkey
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- profiles.deleted_by: same problem, via the soft-delete columns.
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_deleted_by_fkey;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- organizations.created_by: the earlier organizations migrations declared this
-- ON DELETE SET NULL, but 20250923125020 recreated the table without it.
ALTER TABLE public.organizations
    DROP CONSTRAINT IF EXISTS organizations_created_by_fkey;
ALTER TABLE public.organizations
    ADD CONSTRAINT organizations_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- user_directory.user_id never had a foreign key at all (only member_id got one,
-- in 20250922112629). Without this, deleting a user leaves their entire personal
-- directory behind as orphan rows. Clear existing orphans before adding it.
DELETE FROM public.user_directory ud
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = ud.user_id
);

ALTER TABLE public.user_directory
    DROP CONSTRAINT IF EXISTS user_directory_user_id_fkey;
ALTER TABLE public.user_directory
    ADD CONSTRAINT user_directory_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_directory_member_id ON public.user_directory(member_id);
