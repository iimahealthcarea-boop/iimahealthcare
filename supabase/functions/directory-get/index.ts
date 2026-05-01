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

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's directory members with profile information
    const { data, error } = await supabase
      .from('user_directory')
      .select(`
        id,
        member_id,
        created_at,
        profiles!user_directory_member_id_fkey (
          id,
          user_id,
          first_name,
          last_name,
          email,
          phone,
          organization,
          position,
          city,
          country,
          program,
          graduation_year,
          linkedin_url,
          website_url,
          bio,
          interests,
          skills,
          avatar_url,
          experience_level,
          organization_type,
          show_contact_info,
          approval_status,
          is_public,
          deleted_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching directory:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch directory members' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out entries where the profile doesn't exist or isn't approved
    const filteredData = data?.filter(entry => 
      entry.profiles && 
      entry.profiles.approval_status === 'approved' && 
      entry.profiles.is_public &&
      !entry.profiles.deleted_at
    ) || [];

    return new Response(
      JSON.stringify({ success: true, data: filteredData }),
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
