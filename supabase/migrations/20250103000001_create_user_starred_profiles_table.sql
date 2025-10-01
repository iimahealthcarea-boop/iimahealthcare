-- Create user_starred_profiles table to track which profiles each user has starred
CREATE TABLE IF NOT EXISTS public.user_starred_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    starred_profile_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure a user can only star a profile once
    UNIQUE(user_id, starred_profile_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_starred_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own starred profiles" 
ON public.user_starred_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own starred profiles" 
ON public.user_starred_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own starred profiles" 
ON public.user_starred_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_starred_profiles_user_id ON public.user_starred_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_starred_profiles_starred_profile_id ON public.user_starred_profiles(starred_profile_id);

-- Add comment to document the table
COMMENT ON TABLE public.user_starred_profiles IS 'Tracks which profiles each user has starred';
COMMENT ON COLUMN public.user_starred_profiles.user_id IS 'The user who starred the profile';
COMMENT ON COLUMN public.user_starred_profiles.starred_profile_id IS 'The profile that was starred (references profiles.user_id)';
