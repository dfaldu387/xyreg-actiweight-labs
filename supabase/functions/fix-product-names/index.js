import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EudamedDevice {
  udi_di: string;
  device_name: string;
  trade_names: string;
  organization: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { companyId } = await req.json();
    
    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FixProductNames] Starting name correction for company: ${companyId}`);

    // Get all products with UDI-DI for this company
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('id, name, udi_di')
      .eq('company_id', companyId)
      .not('udi_di', 'is', null);

    if (productsError) {
      console.error('[FixProductNames] Error fetching products:', productsError);
      throw productsError;
    }

    console.log(`[FixProductNames] Found ${products?.length || 0} products with UDI-DI`);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No products with UDI-DI found',
          updatedProducts: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique UDI-DIs to fetch from EUDAMED
    const udiDIs = [...new Set(products.map(p => p.udi_di))];
    console.log(`[FixProductNames] Fetching EUDAMED data for ${udiDIs.length} unique UDI-DIs`);

    // Fetch EUDAMED devices in batches
    const batchSize = 50;
    const eudamedDevices: EudamedDevice[] = [];
    
    for (let i = 0; i < udiDIs.length; i += batchSize) {
      const batch = udiDIs.slice(i, i + batchSize);
      const { data: batchData, error: eudamedError } = await supabaseClient
        .from('medical_devices')
        .select('udi_di, device_name, trade_names, organization')
        .in('udi_di', batch);

      if (eudamedError) {
        console.error('[FixProductNames] Error fetching EUDAMED data:', eudamedError);
        throw eudamedError;
      }

      if (batchData) {
        eudamedDevices.push(...batchData);
      }
    }

    console.log(`[FixProductNames] Retrieved ${eudamedDevices.length} EUDAMED devices`);

    // Find products that need name updates
    const nameUpdates: Array<{ productId: string; oldName: string; newName: string; }> = [];
    
    for (const product of products) {
      if (!product.udi_di) continue;
      
      // Find exact UDI match in EUDAMED
      const matchingDevice = eudamedDevices.find(device => device.udi_di === product.udi_di);
      if (!matchingDevice) {
        console.log(`[FixProductNames] No EUDAMED match for UDI-DI: ${product.udi_di}`);
        continue;
      }
      
      // Get the correct name - ONLY use device_name, never trade_names for product naming
      const correctName = matchingDevice.device_name;
      if (!correctName || correctName.trim() === '') {
        console.log(`[FixProductNames] No device_name for UDI-DI: ${product.udi_di}`);
        continue;
      }
      
      // Check if current product name is different from the correct EUDAMED name
      // Also check if the current name contains trade names patterns
      const currentName = product.name;
      const correctNameTrimmed = correctName.trim();
      const tradeName = matchingDevice.trade_names;
      
      // Determine if update is needed
      let needsUpdate = false;
      let reason = '';
      
      if (currentName !== correctNameTrimmed) {
        // Check if current name contains trade name
        if (tradeName && currentName.includes(tradeName)) {
          needsUpdate = true;
          reason = `Current name contains trade name "${tradeName}"`;
        } else if (!currentName.includes(correctNameTrimmed)) {
          needsUpdate = true;
          reason = `Current name doesn't match device name`;
        }
      }
      
      if (needsUpdate) {
        console.log(`[FixProductNames] Product ${product.id} needs update: ${reason}`);
        console.log(`  Current: "${currentName}"`);
        console.log(`  Correct: "${correctNameTrimmed}"`);
        console.log(`  Trade Name: "${tradeName}"`);
        
        nameUpdates.push({
          productId: product.id,
          oldName: currentName,
          newName: correctNameTrimmed
        });
      }
    }

    console.log(`[FixProductNames] Found ${nameUpdates.length} products that need name updates`);

    // Update product names
    let updatedCount = 0;
    const errors: string[] = [];

    for (const update of nameUpdates) {
      try {
        const { error: updateError } = await supabaseClient
          .from('products')
          .update({ 
            name: update.newName,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.productId);

        if (updateError) {
          console.error(`[FixProductNames] Error updating product ${update.productId}:`, updateError);
          errors.push(`Failed to update product ${update.productId}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`[FixProductNames] Updated product ${update.productId}: "${update.oldName}" → "${update.newName}"`);
        }
      } catch (error) {
        console.error(`[FixProductNames] Exception updating product ${update.productId}:`, error);
        errors.push(`Exception updating product ${update.productId}: ${error}`);
      }
    }

    console.log(`[FixProductNames] Successfully updated ${updatedCount} products`);

    return new Response(
      JSON.stringify({
        success: true,
        updatedProducts: updatedCount,
        totalCandidates: nameUpdates.length,
        errors: errors,
        details: nameUpdates.map(u => ({
          productId: u.productId,
          oldName: u.oldName,
          newName: u.newName
        }))
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FixProductNames] Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});