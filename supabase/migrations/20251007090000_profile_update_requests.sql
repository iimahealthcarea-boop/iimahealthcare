-- Profile Update Requests feature
-- Creates a table to store user-submitted profile update requests and RPCs for submission and admin actions

-- Enum for request status
DO $$ BEGIN
  CREATE TYPE public.profile_update_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table to hold profile update requests
CREATE TABLE IF NOT EXISTS public.profile_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_payload JSONB NOT NULL,
  status public.profile_update_request_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profile_update_requests_updated_at ON public.profile_update_requests;
CREATE TRIGGER update_profile_update_requests_updated_at
  BEFORE UPDATE ON public.profile_update_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.profile_update_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Users can insert requests for their own profile
DROP POLICY IF EXISTS "Users can insert their own profile update requests" ON public.profile_update_requests;
CREATE POLICY "Users can insert their own profile update requests"
ON public.profile_update_requests
FOR INSERT
WITH CHECK (submitted_by = auth.uid() AND profile_user_id = auth.uid());

-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view their own profile update requests" ON public.profile_update_requests;
CREATE POLICY "Users can view their own profile update requests"
ON public.profile_update_requests
FOR SELECT
USING (submitted_by = auth.uid() OR profile_user_id = auth.uid());

-- Admins can view and update all requests
DROP POLICY IF EXISTS "Admins can view all profile update requests" ON public.profile_update_requests;
CREATE POLICY "Admins can view all profile update requests"
ON public.profile_update_requests
FOR SELECT
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profile update requests" ON public.profile_update_requests;
CREATE POLICY "Admins can update all profile update requests"
ON public.profile_update_requests
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RPC: submit_profile_update_request(payload)
CREATE OR REPLACE FUNCTION public.submit_profile_update_request(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id UUID;
BEGIN
  -- Only authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.profile_update_requests (
    profile_user_id,
    submitted_by,
    submitted_payload,
    status
  ) VALUES (
    auth.uid(),
    auth.uid(),
    payload,
    'pending'
  ) RETURNING id INTO request_id;

  RETURN request_id;
END;
$$;

-- RPC: approve_profile_update_request(request_id, override_payload)
-- Applies the payload to profiles, marks request approved, and records change by the submitting user
CREATE OR REPLACE FUNCTION public.approve_profile_update_request(
  request_id UUID,
  override_payload JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
  final_payload JSONB;
  current_profile RECORD;
  merged_profile JSONB;
BEGIN
  -- Only admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can approve requests';
  END IF;

  SELECT * INTO req FROM public.profile_update_requests WHERE id = request_id;
  IF req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  final_payload := COALESCE(override_payload, req.submitted_payload);

  -- Fetch current profile row for diff purposes
  SELECT * INTO current_profile FROM public.profiles WHERE user_id = req.profile_user_id FOR UPDATE;
  IF current_profile IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user';
  END IF;

  -- Apply update
  UPDATE public.profiles p
  SET
    first_name = COALESCE(final_payload->>'first_name', p.first_name),
    last_name = COALESCE(final_payload->>'last_name', p.last_name),
    email = COALESCE(final_payload->>'email', p.email),
    phone = COALESCE(final_payload->>'phone', p.phone),
    country_code = COALESCE(final_payload->>'country_code', p.country_code),
    gender = COALESCE(final_payload->>'gender', p.gender),
    program = COALESCE(final_payload->>'program', p.program),
    graduation_year = COALESCE((final_payload->>'graduation_year')::INT, p.graduation_year),
    organization = COALESCE(final_payload->>'organization', p.organization),
    organization_type = COALESCE((final_payload->>'organization_type')::public.organization_type, p.organization_type),
    position = COALESCE(final_payload->>'position', p.position),
    experience_level = COALESCE((final_payload->>'experience_level')::public.experience_level, p.experience_level),
    location = COALESCE(final_payload->>'location', p.location),
    city = COALESCE(final_payload->>'city', p.city),
    country = COALESCE(final_payload->>'country', p.country),
    pincode = COALESCE(final_payload->>'pincode', p.pincode),
    linkedin_url = COALESCE(final_payload->>'linkedin_url', p.linkedin_url),
    website_url = COALESCE(final_payload->>'website_url', p.website_url),
    bio = COALESCE(final_payload->>'bio', p.bio),
    interests = COALESCE(ARRAY(SELECT jsonb_array_elements_text(final_payload->'interests')), p.interests),
    skills = COALESCE(ARRAY(SELECT jsonb_array_elements_text(final_payload->'skills')), p.skills),
    show_contact_info = COALESCE((final_payload->>'show_contact_info')::BOOLEAN, p.show_contact_info),
    show_location = COALESCE((final_payload->>'show_location')::BOOLEAN, p.show_location),
    is_public = COALESCE((final_payload->>'is_public')::BOOLEAN, p.is_public),
    avatar_url = COALESCE(final_payload->>'avatar_url', p.avatar_url),
    date_of_birth = COALESCE((final_payload->>'date_of_birth')::DATE, p.date_of_birth),
    address = COALESCE(final_payload->>'address', p.address),
    emergency_contact_name = COALESCE(final_payload->>'emergency_contact_name', p.emergency_contact_name),
    emergency_contact_phone = COALESCE(final_payload->>'emergency_contact_phone', p.emergency_contact_phone),
    preferred_mode_of_communication = COALESCE(ARRAY(SELECT jsonb_array_elements_text(final_payload->'preferred_mode_of_communication')), p.preferred_mode_of_communication),
    organizations = COALESCE(final_payload->'organizations', p.organizations)
  WHERE p.user_id = req.profile_user_id;

  -- Mark request approved
  UPDATE public.profile_update_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = request_id;

  -- Record change in timeline as initiated by user
  PERFORM public.add_profile_change(
    req.profile_user_id,
    req.submitted_by,
    (SELECT coalesce((SELECT email FROM auth.users WHERE id = req.submitted_by), 'User')),
    final_payload,
    'update'
  );

END;
$$;

-- RPC: reject_profile_update_request(request_id, reason)
-- Marks request rejected and records in timeline (initiated by user)
CREATE OR REPLACE FUNCTION public.reject_profile_update_request(
  request_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req RECORD;
BEGIN
  -- Only admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can reject requests';
  END IF;

  SELECT * INTO req FROM public.profile_update_requests WHERE id = request_id;
  IF req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  UPDATE public.profile_update_requests
  SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), admin_notes = reason
  WHERE id = request_id;

  -- Record rejection in timeline (no profile changes applied)
  PERFORM public.add_profile_change(
    req.profile_user_id,
    req.submitted_by,
    (SELECT coalesce((SELECT email FROM auth.users WHERE id = req.submitted_by), 'User')),
    jsonb_build_object('approval_status', jsonb_build_object('oldValue', 'pending', 'newValue', 'rejected'), 'rejection_reason', jsonb_build_object('oldValue', NULL, 'newValue', reason)),
    'reject'
  );

END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_profile_update_request(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_profile_update_request(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_profile_update_request(UUID, TEXT) TO authenticated;


