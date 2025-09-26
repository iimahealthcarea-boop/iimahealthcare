-- Add new fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_mode_of_communication TEXT[],
ADD COLUMN IF NOT EXISTS organizations JSONB;

-- Update the program column to use the new enum values
-- First, let's create a new column with the correct type
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS program_new TEXT;

-- Update existing data to map to new program values
UPDATE profiles 
SET program_new = CASE 
  WHEN program ILIKE '%MBA%' AND program ILIKE '%PGDBM%' THEN 'MBA-PGDBM'
  WHEN program ILIKE '%MBA%' AND program ILIKE '%FABM%' THEN 'MBA-FABM'
  WHEN program ILIKE '%MBA%' AND program ILIKE '%PGPX%' THEN 'MBA-PGPX'
  WHEN program ILIKE '%PhD%' OR program ILIKE '%phd%' THEN 'PhD'
  WHEN program ILIKE '%MBA%' AND program ILIKE '%FPGP%' THEN 'MBA-FPGP'
  WHEN program ILIKE '%ePGD%' AND program ILIKE '%ABA%' THEN 'ePGD-ABA'
  WHEN program ILIKE '%FDP%' THEN 'FDP'
  WHEN program ILIKE '%AFP%' THEN 'AFP'
  WHEN program ILIKE '%SMP%' THEN 'SMP'
  ELSE 'Other'
END
WHERE program IS NOT NULL;

-- Drop the old program column and rename the new one
ALTER TABLE profiles DROP COLUMN IF EXISTS program;
ALTER TABLE profiles RENAME COLUMN program_new TO program;

-- Add constraints for the new fields
ALTER TABLE profiles 
ADD CONSTRAINT check_preferred_communication 
CHECK (
  preferred_mode_of_communication IS NULL OR 
  preferred_mode_of_communication <@ ARRAY['Phone', 'Email', 'WhatsApp', 'LinkedIn']::TEXT[]
);

-- Add index for better performance on organizations JSONB field
CREATE INDEX IF NOT EXISTS idx_profiles_organizations ON profiles USING GIN (organizations);

-- Add comment to document the new fields
COMMENT ON COLUMN profiles.preferred_mode_of_communication IS 'Array of preferred communication methods: Phone, Email, WhatsApp, LinkedIn';
COMMENT ON COLUMN profiles.organizations IS 'JSONB array of organization objects with fields: currentOrg, orgType, experience, description, role';
COMMENT ON COLUMN profiles.program IS 'Program type: MBA-PGDBM, MBA-FABM, MBA-PGPX, PhD, MBA-FPGP, ePGD-ABA, FDP, AFP, SMP, Other';
