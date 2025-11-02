-- Add under_registration column to profiles table
ALTER TABLE profiles 
ADD COLUMN under_registration BOOLEAN DEFAULT FALSE;

-- Add comment for clarity
COMMENT ON COLUMN profiles.under_registration IS 'Tracks if user is currently in the registration process';

-- Update existing profiles to have under_registration = false
UPDATE profiles SET under_registration = FALSE WHERE under_registration IS NULL;


