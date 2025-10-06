-- Add mentoring and contribution fields to profiles
-- Up
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS willing_to_mentor text CHECK (willing_to_mentor IN ('Yes','No','Maybe'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS areas_of_contribution text[];

-- Down
-- To rollback, uncomment below
-- ALTER TABLE profiles DROP COLUMN IF EXISTS areas_of_contribution;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS willing_to_mentor;
