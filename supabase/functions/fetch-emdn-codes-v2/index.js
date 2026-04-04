import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NEW EDGE FUNCTION v3.0 - CATEGORY-BASED FETCHING - 2025-08-03

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('=== NEW EMDN FETCH V3 START - CATEGORY BASED ===');
    
    // Define all expected EMDN categories (A-Z, excluding some letters not used in EMDN)
    const expectedCategories = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    
    console.log(`🔍 Fetching EMDN codes by category to bypass 1000-row RPC limit...`);
    console.log(`📊 Expected categories: ${expectedCategories.join(', ')}`);
    
    const startTime = Date.now();
    const allCodes = [];
    const failedCategories = [];
    let successfulCategories = 0;
    
    // Fetch codes for each category separately
    for (const category of expectedCategories) {
      try {
        console.log(`🔄 Fetching category ${category}...`);
        const { data: categoryData, error: categoryError } = await supabase
          .rpc('get_eudamed_emdn_codes_by_prefix', { prefix_letter: category });
        
        if (categoryError) {
          console.error(`❌ Error fetching category ${category}:`, categoryError);
          failedCategories.push(category);
          continue;
        }
        
        if (categoryData && categoryData.length > 0) {
          allCodes.push(...categoryData);
          console.log(`✅ Category ${category}: ${categoryData.length} codes`);
          successfulCategories++;
        } else {
          console.log(`⚠️ Category ${category}: No codes found`);
        }
      } catch (error) {
        console.error(`❌ Exception for category ${category}:`, error);
        failedCategories.push(category);
      }
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`⏱️ Total execution time: ${executionTime}ms`);
    console.log(`📊 Successful categories: ${successfulCategories}/${expectedCategories.length}`);
    console.log(`❌ Failed categories: ${failedCategories.join(', ') || 'None'}`);
    console.log(`✅ Total codes fetched: ${allCodes.length}`);
    
    // Analyze the final data
    const finalCategories = [...new Set(allCodes?.map(row => row.code?.[0]) || [])].sort();
    console.log(`📊 Final categories found: ${finalCategories.join(', ')} (${finalCategories.length} total)`);
    
    // Transform to the format expected by frontend
    const transformedData = allCodes?.map(row => ({
      code: row.code || '',
      description: row.description || '',
      temp: row.temp || row.description || '',
      LEVEL: row.LEVEL || 1,
      parent_code: row.parent_code || ''
    })) || [];

    console.log(`🔄 Transformed data length: ${transformedData.length}`);
    console.log('📝 Sample first 3 codes:', transformedData.slice(0, 3));
    console.log('📝 Sample last 3 codes:', transformedData.slice(-3));
    console.log('=== NEW EMDN FETCH V3 COMPLETE ===');

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
    console.error('New edge function v2 error:', error);
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