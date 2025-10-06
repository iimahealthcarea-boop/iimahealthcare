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
      const { name, country, state_province } = await req.json();
      
      if (!name) {
        return new Response(
          JSON.stringify({ success: false, error: 'City name is required' }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      if (!country) {
        return new Response(
          JSON.stringify({ success: false, error: 'Country is required' }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      console.log('Adding city:', name, 'in', country);

      // Check if city already exists
      const { data: existing, error: checkError } = await supabaseClient
        .from('cities')
        .select('id, name, country')
        .eq('name', name.trim())
        .eq('country', country)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing city:', checkError);
        throw checkError;
      }

      if (existing) {
        console.log('City already exists:', existing.name);
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: existing,
            message: 'City already exists'
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // Add new city
      const { data, error } = await supabaseClient
        .from('cities')
        .insert([{
          name: name.trim(),
          country: country.trim(),
          state_province: state_province?.trim() || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding city:', error);
        throw error;
      }

      console.log('Successfully added city:', data.name);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data,
          message: 'City added successfully'
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
    console.error('Error in cities-add function:', error);
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
