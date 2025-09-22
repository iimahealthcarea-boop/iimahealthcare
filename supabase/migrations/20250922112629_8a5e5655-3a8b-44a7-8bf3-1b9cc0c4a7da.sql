-- Add foreign key constraint to user_directory table
ALTER TABLE public.user_directory 
ADD CONSTRAINT user_directory_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;