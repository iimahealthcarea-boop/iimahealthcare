-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.gender IS 'Gender identity of the user';

-- Update the member_directory view to include gender
DROP VIEW IF EXISTS public.member_directory;

CREATE VIEW public.member_directory AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.gender,
    p.program,
    p.graduation_year,
    p.organization,
    p.organization_type,
    p.position,
    p.experience_level,
    CASE WHEN p.show_location THEN p.location ELSE NULL END as location,
    CASE WHEN p.show_location THEN p.city ELSE NULL END as city,
    CASE WHEN p.show_location THEN p.country ELSE NULL END as country,
    CASE WHEN p.show_contact_info THEN p.email ELSE NULL END as email,
    CASE WHEN p.show_contact_info THEN p.phone ELSE NULL END as phone,
    CASE WHEN p.show_contact_info THEN p.linkedin_url ELSE NULL END as linkedin_url,
    p.website_url,
    p.bio,
    p.interests,
    p.skills,
    p.status,
    p.avatar_url
FROM public.profiles p
WHERE p.is_public = true AND p.status = 'Active';

-- Grant access to the view
GRANT SELECT ON public.member_directory TO authenticated, anon;
