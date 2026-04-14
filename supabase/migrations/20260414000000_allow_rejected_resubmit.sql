-- Allow rejected members to edit and resubmit their profile for review.
-- The existing policy "Users can update their own pending profile" only permitted
-- updates when approval_status = 'pending', which locked rejected members out.
--
-- New policy widens USING to pending OR rejected (so the target row can be either),
-- and adds a WITH CHECK that forces the resulting row back to 'pending'. This prevents
-- users from self-approving or setting arbitrary statuses.

DROP POLICY IF EXISTS "Users can update their own pending profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own pending or rejected profile" ON public.profiles;

CREATE POLICY "Users can update their own pending or rejected profile" ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = user_id
        AND approval_status IN ('pending', 'rejected')
    )
    WITH CHECK (
        auth.uid() = user_id
        AND approval_status = 'pending'
    );

-- Widen profile_changes.change_type to allow 'resubmit' so the history timeline
-- can record a dedicated entry when a rejected member resubmits their application.
ALTER TABLE public.profile_changes
    DROP CONSTRAINT IF EXISTS profile_changes_change_type_check;

ALTER TABLE public.profile_changes
    ADD CONSTRAINT profile_changes_change_type_check
    CHECK (change_type IN ('create', 'update', 'approve', 'reject', 'admin_edit', 'resubmit'));
