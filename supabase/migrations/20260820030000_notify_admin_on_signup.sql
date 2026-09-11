-- Admin "new signup pending approval" notification.
--
-- Problem this fixes:
--   The browser used to call the `request-pending` edge function directly after
--   sign-up. That never worked: the function verifies a user JWT, but right
--   after sign-up the user has no session yet (email confirmation is pending),
--   so the call returned 401. The call site in Auth.tsx was commented out, so
--   in practice no admin notification was ever sent.
--
-- Approach:
--   Fire the notification from the database instead, when the profile row is
--   created. The edge function is then never called from the browser, so it
--   cannot be triggered or spoofed by anyone on the internet.
--
-- Notes:
--   * pg_net is async — the HTTP request is queued, so sign-up latency is
--     unaffected and a mail failure can never roll back the profile insert.
--   * Authenticated with a random shared secret generated in the DB and
--     stored in Vault; the service-role key is never used or exposed here.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_admin_new_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url    TEXT;
  v_secret TEXT;
BEGIN
  -- Only notify for brand-new pending registrations.
  IF NEW.approval_status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  -- Config comes from Vault; if it is missing we skip silently rather than
  -- break sign-up. (Sign-up must never fail because of a notification.)
  BEGIN
    SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;

    SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'signup_hook_secret' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  IF v_url IS NULL OR v_secret IS NULL THEN
    RETURN NEW;
  END IF;

  -- Async: queued and delivered outside this transaction.
  PERFORM net.http_post(
    url     := v_url || '/functions/v1/request-pending',
    headers := jsonb_build_object(
                 'Content-Type',    'application/json',
                 'x-signup-secret', v_secret
               ),
    body    := jsonb_build_object(
                 'firstName', COALESCE(NEW.first_name, ''),
                 'lastName',  COALESCE(NEW.last_name, ''),
                 'email',     COALESCE(NEW.email, '')
               ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification failure block a sign-up.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_on_signup ON public.profiles;
CREATE TRIGGER notify_admin_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_signup();

REVOKE EXECUTE ON FUNCTION public.notify_admin_new_signup() FROM anon, authenticated;
