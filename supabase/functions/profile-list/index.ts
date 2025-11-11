import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Check if user is admin using the is_admin function
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin', {
      user_id: user.id
    });

    if (adminCheckError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const status = url.searchParams.get('status') || null; // 'pending', 'approved', 'rejected', or null for all
    const searchTerm = url.searchParams.get('search') || null;
    const experienceLevel = url.searchParams.get('experience_level') || null;
    const organizationType = url.searchParams.get('organization_type') || null;
    
    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('approval_status', status);
    }

    // Apply experience level filter
    if (experienceLevel && experienceLevel !== 'all') {
      query = query.eq('experience_level', experienceLevel);
    }

    // Apply organization type filter
    if (organizationType && organizationType !== 'all') {
      query = query.eq('organization_type', organizationType);
    }

    // Apply search filter - search across multiple fields
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      // Escape special characters for PostgreSQL ILIKE
      const escapedSearch = searchLower.replace(/%/g, '\\%').replace(/_/g, '\\_');
      // PostgREST OR syntax requires single line, comma-separated, no spaces after commas
      // Note: approval_status is excluded from search as it's an enum and already filtered by status parameter
      const orQuery = `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%,organization.ilike.%${escapedSearch}%,position.ilike.%${escapedSearch}%,program.ilike.%${escapedSearch}%,city.ilike.%${escapedSearch}%,country.ilike.%${escapedSearch}%,address.ilike.%${escapedSearch}%,bio.ilike.%${escapedSearch}%,linkedin_url.ilike.%${escapedSearch}%,website_url.ilike.%${escapedSearch}%`;
      query = query.or(orQuery);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For array fields (skills, interests), we need to handle them separately in search
    // The above query handles most fields, but for array fields we might need post-processing
    // For now, the basic search should work for most cases

    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNextPage: (count || 0) > offset + limit,
          hasPreviousPage: page > 1,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in profile-list function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

