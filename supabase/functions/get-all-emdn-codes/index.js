import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// DIAGNOSTIC VERSION v4.0 - FORCED REDEPLOY - 2025-08-03

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== EMDN FETCH OPERATION START ===');
    console.log('Using NEW RPC function: get_all_eudamed_emdn_codes (should fetch ALL codes without limit)');
    console.log('Expected: 7385 codes with categories A-Z (22 total categories)');
    console.log('Previous issue: Only getting 1000 codes with 6 categories (A,B,C,D,F,G)');

    // Test RPC function exists first
    console.log('🔍 Testing RPC function accessibility...');
    
    // Use the new database function to get ALL EMDN codes (FORCE REDEPLOY v3 - DIAGNOSTIC)
    console.log('📞 Calling RPC: get_all_eudamed_emdn_codes()');
    const startTime = Date.now();
    const { data, error } = await supabase
      .rpc('get_all_eudamed_emdn_codes');
    const executionTime = Date.now() - startTime;

    console.log(`⏱️ RPC execution time: ${executionTime}ms`);

    if (error) {
      console.error('❌ Database query error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data) {
      console.error('❌ No data returned from RPC function');
      throw new Error('No data returned from get_all_eudamed_emdn_codes');
    }

    console.log(`✅ SUCCESS: Fetched ${data.length} EMDN codes from get_all_eudamed_emdn_codes in ${executionTime}ms`);
    
    // Detailed analysis
    console.log(`📏 Raw data type: ${typeof data}, Array: ${Array.isArray(data)}`);
    console.log(`📏 First 3 raw records:`, data.slice(0, 3));
    console.log(`📏 Last 3 raw records:`, data.slice(-3));
    
    // Analyze the data categories
    const categories = [...new Set(data?.map(row => row.code?.[0]) || [])].sort();
    console.log(`📊 Categories found: ${categories.join(', ')} (${categories.length} total)`);
    
    // Transform to the format expected by frontend
    const transformedData = data?.map(row => ({
      code: row.code || '',
      description: row.description || '',
      temp: row.temp || row.description || '',
      LEVEL: row.LEVEL || 1,
      parent_code: row.parent_code || ''
    })) || [];

    console.log(`🔄 Transformed data length: ${transformedData.length}`);
    console.log('📝 Sample transformed data (first 3):', transformedData.slice(0, 3));
    console.log('📝 Sample transformed data (last 3):', transformedData.slice(-3));
    console.log('=== EMDN FETCH OPERATION COMPLETE ===');

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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