-- Add constraint to ensure users can only star profiles that are in their directory
-- This function checks if a profile is in the user's directory
CREATE OR REPLACE FUNCTION is_profile_in_user_directory(
  p_user_id UUID,
  p_starred_profile_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_directory 
    WHERE user_id = p_user_id 
    AND member_id = p_starred_profile_id
  );
END;
$$ LANGUAGE plpgsql;

-- Add check constraint to user_starred_profiles table
ALTER TABLE public.user_starred_profiles 
ADD CONSTRAINT check_profile_in_directory 
CHECK (is_profile_in_user_directory(user_id, starred_profile_id));

-- Add comment to document the constraint
COMMENT ON CONSTRAINT check_profile_in_directory ON public.user_starred_profiles 
IS 'Ensures users can only star profiles that are in their directory';
