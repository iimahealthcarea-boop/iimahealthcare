/* eslint-disable */
// This file runs in Deno on Supabase Edge; type errors in local tooling are expected.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: 'admin' | 'normal_user';
  phone?: string;
  country_code?: string;
}

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
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { first_name, last_name, email, password, role, phone, country_code }: CreateUserRequest = await req.json()

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the user using admin API
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name: first_name,
        last_name: last_name,
      }
    })

    if (authCreateError) {
      console.error('Error creating user:', authCreateError)
      return new Response(
        JSON.stringify({ error: authCreateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (authData.user) {
      // Upsert selected role (default to normal_user)
      const selectedRole = role === 'admin' ? 'admin' : 'normal_user'
      const { error: roleUpsertError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: authData.user.id, role: selectedRole }, { onConflict: 'user_id,role' })
      if (roleUpsertError) {
        console.error('Error assigning role:', roleUpsertError)
        return new Response(
          JSON.stringify({ error: 'User created but role assignment failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Update the profile to approved status
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          phone: phone || null,
          country_code: country_code || null,
        })
        .eq('user_id', authData.user.id)

      if (profileError) {
        console.error('Error updating profile status:', profileError)
        // Don't fail the entire operation if profile update fails
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: {
            id: authData.user.id,
            email: authData.user.email,
            first_name,
            last_name
          },
          role: selectedRole
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Failed to create user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in admin-create-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
