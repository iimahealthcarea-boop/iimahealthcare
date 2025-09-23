import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { name, domain } = await req.json();
      
      if (!name) {
        return new Response(
          JSON.stringify({ success: false, error: 'Organization name is required' }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      console.log('Adding organization:', name);

      // Check if organization already exists
      const { data: existing, error: checkError } = await supabaseClient
        .from('organizations')
        .select('id, name')
        .ilike('name', name)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing organization:', checkError);
        throw checkError;
      }

      if (existing) {
        console.log('Organization already exists:', existing.name);
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: existing,
            message: 'Organization already exists'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // Add new organization
      const { data, error } = await supabaseClient
        .from('organizations')
        .insert([{
          name: name.trim(),
          domain: domain?.trim() || null,
          is_verified: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding organization:', error);
        throw error;
      }

      console.log('Successfully added organization:', data.name);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data,
          message: 'Organization added successfully'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in organizations-add function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});