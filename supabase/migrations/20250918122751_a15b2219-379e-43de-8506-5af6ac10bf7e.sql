-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'normal_user');

-- Create profile status enum  
CREATE TYPE public.profile_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'normal_user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Update profiles table to add approval status and more detailed fields
ALTER TABLE public.profiles 
ADD COLUMN approval_status profile_approval_status DEFAULT 'pending',
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN address TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN emergency_contact_name TEXT,
ADD COLUMN emergency_contact_phone TEXT;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_roles.user_id = $1 LIMIT 1;
$$;

-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = $1 AND role = 'admin'
    );
$$;

-- Function to handle new user signup (assign normal_user role by default)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert into profiles table
    INSERT INTO public.profiles (
        user_id,
        email,
        first_name,
        last_name,
        approval_status
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        'pending'
    );
    
    -- Insert into user_roles table (default normal_user)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'normal_user');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles" ON public.user_roles
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Update profiles RLS policies
DROP POLICY IF EXISTS "Public profiles viewable with privacy controls" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- New RLS policies for profiles with approval system
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id AND approval_status = 'pending');

CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Function to approve user profile
CREATE OR REPLACE FUNCTION public.approve_user_profile(profile_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can approve profiles';
    END IF;
    
    -- Update profile status
    UPDATE public.profiles 
    SET 
        approval_status = 'approved',
        approved_by = auth.uid(),
        approved_at = now(),
        updated_at = now()
    WHERE user_id = profile_user_id;
END;
$$;

-- Function to reject user profile
CREATE OR REPLACE FUNCTION public.reject_user_profile(profile_user_id UUID, reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only admins can reject profiles';
    END IF;
    
    -- Update profile status
    UPDATE public.profiles 
    SET 
        approval_status = 'rejected',
        approved_by = auth.uid(),
        approved_at = now(),
        rejection_reason = reason,
        updated_at = now()
    WHERE user_id = profile_user_id;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user_profile(UUID, TEXT) TO authenticated;

-- Create an admin user (you'll need to update this with actual admin email)
-- This is a placeholder - you'll need to run this manually with real email
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role) 
-- VALUES ('admin@example.com', crypt('adminpassword', gen_salt('bf')), now(), 'authenticated');

-- Add trigger to update timestamp
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();