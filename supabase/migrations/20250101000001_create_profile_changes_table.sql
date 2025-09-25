-- Create profile_changes table to track all profile modifications
CREATE TABLE public.profile_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    changed_by_name TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'approve', 'reject', 'admin_edit')),
    changed_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_profile_changes_profile_user_id ON public.profile_changes(profile_user_id);
CREATE INDEX idx_profile_changes_changed_at ON public.profile_changes(changed_at DESC);
CREATE INDEX idx_profile_changes_change_type ON public.profile_changes(change_type);

-- Enable RLS
ALTER TABLE public.profile_changes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile changes" 
ON public.profile_changes 
FOR SELECT 
USING (profile_user_id = auth.uid());

CREATE POLICY "Admins can view all profile changes" 
ON public.profile_changes 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile changes" 
ON public.profile_changes 
FOR INSERT 
WITH CHECK (profile_user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Create function to add a profile change
CREATE OR REPLACE FUNCTION public.add_profile_change(
    profile_user_id UUID,
    changed_by UUID,
    changed_by_name TEXT,
    changed_fields JSONB,
    change_type TEXT DEFAULT 'update'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    change_id UUID;
BEGIN
    -- Insert the change record
    INSERT INTO public.profile_changes (
        profile_user_id,
        changed_by,
        changed_by_name,
        change_type,
        changed_fields
    ) VALUES (
        profile_user_id,
        changed_by,
        changed_by_name,
        change_type,
        changed_fields
    ) RETURNING id INTO change_id;
    
    RETURN change_id;
END;
$$;

-- Create function to get profile changes for a user
CREATE OR REPLACE FUNCTION public.get_profile_changes(profile_user_id UUID)
RETURNS TABLE (
    id UUID,
    changed_by UUID,
    changed_by_name TEXT,
    changed_at TIMESTAMP WITH TIME ZONE,
    change_type TEXT,
    changed_fields JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user can view these changes
    IF NOT (profile_user_id = auth.uid() OR public.is_admin(auth.uid())) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        pc.id,
        pc.changed_by,
        pc.changed_by_name,
        pc.changed_at,
        pc.change_type,
        pc.changed_fields
    FROM public.profile_changes pc
    WHERE pc.profile_user_id = get_profile_changes.profile_user_id
    ORDER BY pc.changed_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_profile_change(UUID, UUID, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_changes(UUID) TO authenticated;

-- Add comment
COMMENT ON TABLE public.profile_changes IS 'Tracks all changes made to user profiles with detailed change information';

