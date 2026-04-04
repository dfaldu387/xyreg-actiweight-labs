
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a product name already exists for a company
 */
export async function checkProductNameExists(
  companyId: string, 
  productName: string, 
  excludeProductId?: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    console.log('[DuplicateNameValidation] Checking product name:', {
      companyId,
      productName,
      excludeProductId
    });

    let query = supabase
      .from('products')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('name', productName)
      .eq('is_archived', false);

    // Exclude the current product if we're updating
    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DuplicateNameValidation] Error checking product name:', error);
      return { exists: false, error: error.message };
    }

    const exists = data && data.length > 0;
    console.log('[DuplicateNameValidation] Name check result:', { exists, matchCount: data?.length });

    return { exists };
  } catch (error) {
    console.error('[DuplicateNameValidation] Unexpected error:', error);
    return { exists: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generate a unique product name by appending a number if needed
 */
export async function generateUniqueProductName(
  companyId: string, 
  baseName: string
): Promise<{ uniqueName: string; error?: string }> {
  try {
    console.log('[DuplicateNameValidation] Generating unique name for:', baseName);

    // First check if the base name is available
    const baseCheck = await checkProductNameExists(companyId, baseName);
    if (baseCheck.error) {
      return { uniqueName: baseName, error: baseCheck.error };
    }

    if (!baseCheck.exists) {
      return { uniqueName: baseName };
    }

    // If base name exists, try with incremental numbers
    for (let i = 2; i <= 100; i++) {
      const candidateName = `${baseName} (${i})`;
      const check = await checkProductNameExists(companyId, candidateName);
      
      if (check.error) {
        return { uniqueName: baseName, error: check.error };
      }

      if (!check.exists) {
        console.log('[DuplicateNameValidation] Generated unique name:', candidateName);
        return { uniqueName: candidateName };
      }
    }

    // Fallback if we can't find a unique name
    const timestampName = `${baseName} (${Date.now()})`;
    console.warn('[DuplicateNameValidation] Using timestamp fallback:', timestampName);
    return { uniqueName: timestampName };
  } catch (error) {
    console.error('[DuplicateNameValidation] Error generating unique name:', error);
    return { uniqueName: baseName, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
