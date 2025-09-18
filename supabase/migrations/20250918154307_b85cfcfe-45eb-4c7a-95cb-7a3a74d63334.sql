-- Add RLS policy to allow approved users to view other approved public profiles
CREATE POLICY "Approved users can view other approved public profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- User must be approved to see other profiles
  EXISTS (
    SELECT 1 FROM public.profiles current_user_profile
    WHERE current_user_profile.user_id = auth.uid() 
    AND current_user_profile.approval_status = 'approved'
  )
  -- And can only see profiles that are approved and public
  AND approval_status = 'approved' 
  AND is_public = true
);