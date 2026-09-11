-- Turn off the admin "new signup pending approval" notification.
--
-- Disabled rather than dropped so it can be switched back on with a single
-- statement, keeping the trigger function, Vault secrets and the deployed
-- edge function untouched.
--
-- To re-enable:
--   ALTER TABLE public.profiles ENABLE TRIGGER notify_admin_on_signup;
--   (and make sure SIGNUP_HOOK_SECRET is set on the request-pending function)

ALTER TABLE public.profiles DISABLE TRIGGER notify_admin_on_signup;
