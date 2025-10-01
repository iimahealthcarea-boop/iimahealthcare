-- Remove constraints from user_starred_profiles table

-- Drop the check constraint that enforces directory membership
ALTER TABLE public.user_starred_profiles 
DROP CONSTRAINT IF EXISTS check_profile_in_directory;

-- Drop the unique constraint that prevents duplicate starring
ALTER TABLE public.user_starred_profiles 
DROP CONSTRAINT IF EXISTS user_starred_profiles_user_id_starred_profile_id_key;

-- Drop the function that was used for the check constraint
DROP FUNCTION IF EXISTS is_profile_in_user_directory(UUID, UUID);
