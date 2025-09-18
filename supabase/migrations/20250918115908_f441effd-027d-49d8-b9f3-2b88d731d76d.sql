-- Drop the existing view
DROP VIEW IF EXISTS public.member_directory;

-- Recreate the view without security definer
CREATE VIEW public.member_directory AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
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