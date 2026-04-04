import { supabase } from '@/integrations/supabase/client';

/**
 * Updates existing legacy products that don't have launch dates
 * Sets their actual_launch_date to their inserted_at date
 */
export async function backfillLegacyProductLaunchDates(): Promise<{
  success: boolean;
  updatedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  
  try {
    console.log('[LegacyProductMigrationService] Starting backfill of legacy product launch dates...');
    
    // Find legacy products without launch dates
    const { data: legacyProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, name, inserted_at, project_types')
      .is('actual_launch_date', null)
      .contains('project_types', ['Legacy Device']);
    
    if (fetchError) {
      console.error('[LegacyProductMigrationService] Error fetching legacy products:', fetchError);
      return { success: false, updatedCount: 0, errors: [fetchError.message] };
    }
    
    if (!legacyProducts || legacyProducts.length === 0) {
      console.log('[LegacyProductMigrationService] No legacy products need launch date backfill');
      return { success: true, updatedCount: 0, errors: [] };
    }
    
    console.log(`[LegacyProductMigrationService] Found ${legacyProducts.length} legacy products to update`);
    
    let updatedCount = 0;
    
    // Update each product's launch date
    for (const product of legacyProducts) {
      try {
        const launchDate = new Date(product.inserted_at).toISOString().split('T')[0];
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ actual_launch_date: launchDate })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`[LegacyProductMigrationService] Error updating product ${product.id}:`, updateError);
          errors.push(`Failed to update ${product.name}: ${updateError.message}`);
        } else {
          console.log(`[LegacyProductMigrationService] Updated launch date for product ${product.name} to ${launchDate}`);
          updatedCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[LegacyProductMigrationService] Unexpected error updating product ${product.id}:`, error);
        errors.push(`Unexpected error for ${product.name}: ${errorMessage}`);
      }
    }
    
    console.log(`[LegacyProductMigrationService] Completed: ${updatedCount} products updated, ${errors.length} errors`);
    
    return {
      success: updatedCount > 0 || errors.length === 0,
      updatedCount,
      errors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[LegacyProductMigrationService] Unexpected error during backfill:', error);
    return { success: false, updatedCount: 0, errors: [errorMessage] };
  }
}