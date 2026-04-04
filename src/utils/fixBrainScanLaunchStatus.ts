import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to fix BrainScan 2000's launch status from 'launched' to 'pre_launch'
 * This should only be run once to fix the data inconsistency
 */
export async function fixBrainScanLaunchStatus() {
  const productId = 'fe979f56-c572-471b-815f-3e300365fa9e';
  
  console.log('[FixLaunchStatus] Updating BrainScan 2000 launch_status to pre_launch...');
  
  const { data, error } = await supabase
    .from('products')
    .update({ launch_status: 'pre_launch' })
    .eq('id', productId)
    .select('id, name, launch_status, current_lifecycle_phase');
  
  if (error) {
    console.error('[FixLaunchStatus] Error:', error);
    return { success: false, error };
  }
  
  console.log('[FixLaunchStatus] Success:', data);
  return { success: true, data };
}
