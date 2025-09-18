-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data validation
CREATE TYPE public.organization_type AS ENUM ('Corporate', 'Startup', 'Non-Profit', 'Government', 'Consulting', 'Education', 'Healthcare', 'Technology', 'Finance', 'Other');
CREATE TYPE public.experience_level AS ENUM ('Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Student', 'Recent Graduate');
CREATE TYPE public.profile_status AS ENUM ('Active', 'Alumni', 'Student', 'Faculty', 'Inactive');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    
    -- Professional Information
    program TEXT,
    graduation_year INTEGER,
    organization TEXT,
    organization_type organization_type,
    position TEXT,
    experience_level experience_level,
    
    -- Location
    location TEXT,
    city TEXT,
    country TEXT,
    
    -- Social/Contact
    linkedin_url TEXT,
    website_url TEXT,
    
    -- Profile Details
    bio TEXT,
    interests TEXT[],
    skills TEXT[],
    status profile_status DEFAULT 'Active',
    
    -- Privacy Settings
    show_contact_info BOOLEAN DEFAULT false,
    show_location BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    
    -- Metadata
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id,
        email,
        first_name,
        last_name
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_organization_type ON public.profiles(organization_type);
CREATE INDEX idx_profiles_graduation_year ON public.profiles(graduation_year);
CREATE INDEX idx_profiles_location ON public.profiles(location);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_is_public ON public.profiles(is_public);

-- Create a view for public member directory
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

-- Grant access to the view
GRANT SELECT ON public.member_directory TO authenticated, anon;