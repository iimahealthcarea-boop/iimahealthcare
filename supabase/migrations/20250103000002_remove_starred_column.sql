-- Remove starred column from profiles table since we're using a separate table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS starred;
