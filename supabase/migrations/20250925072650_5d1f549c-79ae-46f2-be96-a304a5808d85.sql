-- Add change_history column to profiles table to track all profile updates
ALTER TABLE public.profiles 
ADD COLUMN change_history JSONB DEFAULT '[]'::jsonb;

-- Create an index on the change_history column for better query performance
CREATE INDEX idx_profiles_change_history ON public.profiles USING GIN (change_history);

-- Create a trigger function to automatically track profile changes
CREATE OR REPLACE FUNCTION public.track_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_record JSONB;
    changed_fields TEXT[];
    field_name TEXT;
    old_value TEXT;
    new_value TEXT;
BEGIN
    -- Only track changes on UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        changed_fields := ARRAY[]::TEXT[];
        
        -- Check each field for changes (excluding metadata fields)
        IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
            changed_fields := array_append(changed_fields, 'first_name');
        END IF;
        IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN
            changed_fields := array_append(changed_fields, 'last_name');
        END IF;
        IF OLD.email IS DISTINCT FROM NEW.email THEN
            changed_fields := array_append(changed_fields, 'email');
        END IF;
        IF OLD.phone IS DISTINCT FROM NEW.phone THEN
            changed_fields := array_append(changed_fields, 'phone');
        END IF;
        IF OLD.organization IS DISTINCT FROM NEW.organization THEN
            changed_fields := array_append(changed_fields, 'organization');
        END IF;
        IF OLD.organization_type IS DISTINCT FROM NEW.organization_type THEN
            changed_fields := array_append(changed_fields, 'organization_type');
        END IF;
        IF OLD.position IS DISTINCT FROM NEW.position THEN
            changed_fields := array_append(changed_fields, 'position');
        END IF;
        IF OLD.experience_level IS DISTINCT FROM NEW.experience_level THEN
            changed_fields := array_append(changed_fields, 'experience_level');
        END IF;
        IF OLD.bio IS DISTINCT FROM NEW.bio THEN
            changed_fields := array_append(changed_fields, 'bio');
        END IF;
        IF OLD.location IS DISTINCT FROM NEW.location THEN
            changed_fields := array_append(changed_fields, 'location');
        END IF;
        IF OLD.city IS DISTINCT FROM NEW.city THEN
            changed_fields := array_append(changed_fields, 'city');
        END IF;
        IF OLD.country IS DISTINCT FROM NEW.country THEN
            changed_fields := array_append(changed_fields, 'country');
        END IF;
        IF OLD.linkedin_url IS DISTINCT FROM NEW.linkedin_url THEN
            changed_fields := array_append(changed_fields, 'linkedin_url');
        END IF;
        IF OLD.website_url IS DISTINCT FROM NEW.website_url THEN
            changed_fields := array_append(changed_fields, 'website_url');
        END IF;
        IF OLD.interests IS DISTINCT FROM NEW.interests THEN
            changed_fields := array_append(changed_fields, 'interests');
        END IF;
        IF OLD.skills IS DISTINCT FROM NEW.skills THEN
            changed_fields := array_append(changed_fields, 'skills');
        END IF;
        IF OLD.program IS DISTINCT FROM NEW.program THEN
            changed_fields := array_append(changed_fields, 'program');
        END IF;
        IF OLD.graduation_year IS DISTINCT FROM NEW.graduation_year THEN
            changed_fields := array_append(changed_fields, 'graduation_year');
        END IF;
        IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
            changed_fields := array_append(changed_fields, 'avatar_url');
        END IF;
        IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
            changed_fields := array_append(changed_fields, 'approval_status');
        END IF;
        
        -- Only create a change record if there are actual changes
        IF array_length(changed_fields, 1) > 0 THEN
            change_record := jsonb_build_object(
                'updatedBy', COALESCE(auth.uid()::text, 'system'),
                'updatedAt', now(),
                'changedFields', to_jsonb(changed_fields),
                'isAdmin', public.is_admin(auth.uid())
            );
            
            -- Append the change record to the change_history array
            NEW.change_history := COALESCE(NEW.change_history, '[]'::jsonb) || change_record;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on the profiles table
CREATE TRIGGER track_profile_changes_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.track_profile_changes();