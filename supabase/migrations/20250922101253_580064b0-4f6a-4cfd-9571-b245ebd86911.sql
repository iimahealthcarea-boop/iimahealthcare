-- Add policy to allow users to update their own avatar_url regardless of approval status
CREATE POLICY "Users can update their own avatar_url" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);