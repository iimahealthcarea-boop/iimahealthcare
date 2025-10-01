-- Complete organizations table setup with RLS policies
-- This script handles both creating the table and adding RLS policies

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on organization name (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organizations_name_unique'
    ) THEN
        ALTER TABLE public.organizations 
        ADD CONSTRAINT organizations_name_unique UNIQUE (name);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can delete organizations" ON public.organizations;

-- Create RLS policies for organizations table

-- Policy 1: Allow admins to view all organizations
CREATE POLICY "Admins can view all organizations"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy 2: Allow admins to insert organizations
CREATE POLICY "Admins can insert organizations"
ON public.organizations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy 3: Allow admins to update organizations
CREATE POLICY "Admins can update organizations"
ON public.organizations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy 4: Allow admins to delete organizations
CREATE POLICY "Admins can delete organizations"
ON public.organizations
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_is_verified ON public.organizations(is_verified);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- Create function to automatically set created_by and updated_at
CREATE OR REPLACE FUNCTION public.set_organizations_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_at = now();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set audit fields
DROP TRIGGER IF EXISTS set_organizations_audit_fields ON public.organizations;
CREATE TRIGGER set_organizations_audit_fields
  BEFORE INSERT OR UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organizations_audit_fields();

-- Add comments to document the table and policies
COMMENT ON TABLE public.organizations IS 'Organizations table with RLS policies allowing admin CRUD operations';
COMMENT ON COLUMN public.organizations.name IS 'Unique organization name';
COMMENT ON COLUMN public.organizations.domain IS 'Organization website domain (optional)';
COMMENT ON COLUMN public.organizations.is_verified IS 'Whether the organization is verified by admin';
COMMENT ON COLUMN public.organizations.created_by IS 'User who created this organization (auto-set)';

-- Test the setup by checking if policies exist
DO $$
BEGIN
    -- Check if all policies were created successfully
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' 
        AND policyname = 'Admins can view all organizations'
    ) THEN
        RAISE EXCEPTION 'Failed to create SELECT policy for organizations';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' 
        AND policyname = 'Admins can insert organizations'
    ) THEN
        RAISE EXCEPTION 'Failed to create INSERT policy for organizations';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' 
        AND policyname = 'Admins can update organizations'
    ) THEN
        RAISE EXCEPTION 'Failed to create UPDATE policy for organizations';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' 
        AND policyname = 'Admins can delete organizations'
    ) THEN
        RAISE EXCEPTION 'Failed to create DELETE policy for organizations';
    END IF;
    
    RAISE NOTICE 'Organizations table and RLS policies setup completed successfully!';
END $$;
