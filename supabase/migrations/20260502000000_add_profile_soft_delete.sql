ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

ALTER TABLE public.profile_changes
    DROP CONSTRAINT IF EXISTS profile_changes_change_type_check;

ALTER TABLE public.profile_changes
    ADD CONSTRAINT profile_changes_change_type_check
    CHECK (change_type IN ('create', 'update', 'approve', 'reject', 'admin_edit', 'resubmit', 'delete'));
