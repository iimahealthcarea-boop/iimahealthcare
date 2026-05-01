import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { member_id } = await req.json();

    if (!member_id) {
      return new Response(
        JSON.stringify({ error: 'member_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if member already exists in directory
    const { data: existingEntry } = await supabase
      .from('user_directory')
      .select('id')
      .eq('user_id', user.id)
      .eq('member_id', member_id)
      .single();

    if (existingEntry) {
      return new Response(
        JSON.stringify({ error: 'User already exists in directory' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: memberProfile, error: memberError } = await supabase
      .from('profiles')
      .select('user_id, approval_status, is_public, deleted_at')
      .eq('user_id', member_id)
      .single();

    if (memberError || !memberProfile) {
      return new Response(
        JSON.stringify({ error: 'Member profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (
      memberProfile.deleted_at ||
      memberProfile.approval_status !== 'approved' ||
      !memberProfile.is_public
    ) {
      return new Response(
        JSON.stringify({ error: 'Member profile is not available for directory add' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add member to user's directory
    const { data, error } = await supabase
      .from('user_directory')
      .insert({
        user_id: user.id,
        member_id: member_id
      })
      .select();

    if (error) {
      console.error('Error adding to directory:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to add member to directory' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
