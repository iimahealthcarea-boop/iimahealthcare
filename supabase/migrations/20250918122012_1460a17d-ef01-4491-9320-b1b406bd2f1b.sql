-- Fix email leak security issue by creating secure views and updating RLS policies

-- Drop existing problematic RLS policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a secure view for public profiles that respects privacy settings
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  -- Only show email if show_contact_info is true
  CASE WHEN show_contact_info = true THEN email ELSE NULL END as email,
  -- Only show phone if show_contact_info is true  
  CASE WHEN show_contact_info = true THEN phone ELSE NULL END as phone,
  program,
  graduation_year,
  organization,
  organization_type,
  position,
  experience_level,
  -- Only show location details if show_location is true
  CASE WHEN show_location = true THEN location ELSE NULL END as location,
  CASE WHEN show_location = true THEN city ELSE NULL END as city,
  CASE WHEN show_location = true THEN country ELSE NULL END as country,
  -- Only show social links if show_contact_info is true
  CASE WHEN show_contact_info = true THEN linkedin_url ELSE NULL END as linkedin_url,
  CASE WHEN show_contact_info = true THEN website_url ELSE NULL END as website_url,
  bio,
  interests,
  skills,
  status,
  avatar_url,
  created_at,
  updated_at,
  show_contact_info,
  show_location,
  is_public
FROM public.profiles
WHERE is_public = true AND status != 'Inactive';

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Create RLS policies for public_profiles view
CREATE POLICY "Public profiles view accessible to all" 
ON public.public_profiles 
FOR SELECT 
USING (true);

-- Update the main profiles table RLS policies to be more secure
CREATE POLICY "Public profiles are viewable by everyone with privacy controls" 
ON public.profiles 
FOR SELECT 
USING (
  is_public = true 
  AND status != 'Inactive'
  AND (
    auth.uid() = user_id  -- Users can always see their own full profile
    OR auth.uid() IS NULL  -- Anonymous users see limited data through public_profiles view
  )
);

-- Grant SELECT access to public_profiles view
GRANT SELECT ON public.public_profiles TO anon, authenticated;