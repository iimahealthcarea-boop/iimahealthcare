-- Add country and country_code fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN country_code text,
ADD COLUMN country text;