/* eslint-disable */
// This file runs in Deno on Supabase Edge; type errors in local tooling are expected.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROFILE_PICTURES_BUCKET = 'profile-pictures'

interface DeleteUserRequest {
  user_id: string;
}

const json = (body: unknown, status: number) =>
  new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'No authorization header' }, 401)
    }

    // Verify the caller is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return json({ error: 'Invalid token' }, 401)
    }

    // Check the caller is an admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      return json({ error: 'Unauthorized - Admin access required' }, 403)
    }

    const { user_id }: DeleteUserRequest = await req.json()

    if (!user_id) {
      return json({ error: 'Missing user_id' }, 400)
    }

    if (user_id === user.id) {
      return json({ error: 'You cannot permanently delete your own account' }, 400)
    }

    // Only profiles that were already soft-deleted can be permanently removed.
    // This keeps permanent deletion a deliberate second step.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, deleted_at')
      .eq('user_id', user_id)
      .maybeSingle()

    if (profileError) {
      console.error('Error loading profile:', profileError)
      return json({ error: 'Failed to load profile' }, 500)
    }

    if (!profile) {
      return json({ error: 'Profile not found' }, 404)
    }

    if (!profile.deleted_at) {
      return json({ error: 'Profile must be deleted before it can be permanently removed' }, 400)
    }

    // Every dependent row is removed explicitly below rather than relying on
    // ON DELETE CASCADE. The live schema has drifted from the migration files,
    // and a missing cascade fails in two different ways depending on the
    // constraint: it either blocks the auth delete or silently orphans the row.
    const cleanupErrors: string[] = []

    const purge = async (table: string, column: string, value: string) => {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, value)
      if (error) {
        console.error(`Error clearing ${table}.${column}:`, error)
        cleanupErrors.push(`${table}.${column}: ${error.message}`)
      }
    }

    const detach = async (table: string, column: string, value: string) => {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ [column]: null })
        .eq(column, value)
      if (error) {
        console.error(`Error detaching ${table}.${column}:`, error)
        cleanupErrors.push(`${table}.${column}: ${error.message}`)
      }
    }

    // Remove avatars — uploads live under `${userId}/` in the bucket and are not
    // covered by any database cascade.
    const { data: avatarFiles, error: listError } = await supabaseAdmin.storage
      .from(PROFILE_PICTURES_BUCKET)
      .list(user_id)

    if (listError) {
      console.error('Error listing avatar files:', listError)
    } else if (avatarFiles?.length) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(PROFILE_PICTURES_BUCKET)
        .remove(avatarFiles.map((file: { name: string }) => `${user_id}/${file.name}`))

      if (removeError) {
        console.error('Error removing avatar files:', removeError)
      }
    }

    // otp_codes is keyed by email with no foreign key, so stale codes would
    // survive and follow the address into the next signup.
    if (profile.email) {
      const { error: otpError } = await supabaseAdmin
        .from('otp_codes')
        .delete()
        .eq('email', profile.email)

      if (otpError) {
        console.error('Error clearing OTP codes:', otpError)
        cleanupErrors.push(`otp_codes.email: ${otpError.message}`)
      }
    }

    // Rows pointing at this user, in dependency order: things that reference the
    // profile first, then things that reference the auth user.
    await purge('user_starred_profiles', 'starred_profile_id', user_id)
    await purge('user_starred_profiles', 'user_id', user_id)
    await purge('user_directory', 'member_id', user_id)
    await purge('user_directory', 'user_id', user_id)
    await purge('profile_update_requests', 'profile_user_id', user_id)
    await purge('profile_update_requests', 'submitted_by', user_id)
    await purge('profile_changes', 'profile_user_id', user_id)
    await purge('user_roles', 'user_id', user_id)

    // Records that survive the user but must stop referencing them.
    // profile_changes.changed_by is detached rather than deleted: these rows are
    // this user's actions on OTHER members' profiles, and changed_by_name keeps
    // the timeline readable without the id.
    await detach('profile_changes', 'changed_by', user_id)
    await detach('profile_update_requests', 'reviewed_by', user_id)
    await detach('organizations', 'created_by', user_id)
    await detach('cities', 'created_by', user_id)
    await detach('profiles', 'approved_by', user_id)
    await detach('profiles', 'deleted_by', user_id)

    if (cleanupErrors.length) {
      return json(
        { error: `Could not clear related records: ${cleanupErrors.join('; ')}` },
        500
      )
    }

    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', user_id)

    if (profileDeleteError) {
      console.error('Error deleting profile row:', profileDeleteError)
      return json({ error: `Could not delete profile: ${profileDeleteError.message}` }, 500)
    }

    // Finally the credentials, which is what actually frees the email address.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    // A missing auth user is not a failure: it means the account was already
    // removed (e.g. by hand in the Supabase dashboard) and this call has just
    // cleaned up the profile row it left behind.
    const authUserAlreadyGone =
      deleteError &&
      ((deleteError as { status?: number }).status === 404 ||
        /not found/i.test(deleteError.message))

    if (deleteError && !authUserAlreadyGone) {
      console.error('Error deleting auth user:', deleteError)
      return json({ error: deleteError.message }, 400)
    }

    console.log(
      `Admin ${user.id} permanently deleted user ${user_id}` +
      (authUserAlreadyGone ? ' (auth user was already removed)' : '')
    )

    return json(
      {
        success: true,
        user_id,
        email: profile.email,
        auth_user_already_removed: Boolean(authUserAlreadyGone),
      },
      200
    )

  } catch (error) {
    console.error('Error in admin-delete-user function:', error)
    return json({ error: 'Internal server error' }, 500)
  }
})
