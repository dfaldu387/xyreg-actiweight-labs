import { supabase } from '@/integrations/supabase/client';

export interface CreateProductVersionParams {
  baseProductId: string;
  companyId: string; // Add the missing companyId parameter
  projectName?: string;
  projectDescription?: string;
  projectCategory?: string;
  projectTypes?: string[];
}

export interface VersionCreationResult {
  success: boolean;
  project_id?: string;
  product_id?: string;
  version?: string;
  product_name?: string;
  message?: string;
}

/**
 * Create a new product version based on an existing product
 */
export async function createProductVersion(params: CreateProductVersionParams): Promise<VersionCreationResult> {
  try {
    console.log('[ProductVersionService] Creating product version with params:', params);
    
    // Use the correct database function with proper parameter names
    const { data, error } = await supabase.rpc('create_project_for_existing_product', {
      p_project_name: params.projectName || 'New Version Project',
      p_project_category: params.projectCategory || 'EXISTING PRODUCT',
      p_project_types: JSON.stringify(params.projectTypes || ['Device Improvement / Feature Enhancement']),
      p_company_id: params.companyId,
      p_selected_product_id: params.baseProductId, // This is the correct parameter name
      p_description: params.projectDescription || ''
    });

    if (error) {
      console.error('[ProductVersionService] Database error:', error);
      return {
        success: false,
        message: `Database error: ${error.message}`
      };
    }

    // The function returns a UUID directly, not a JSON object
    if (!data) {
      console.error('[ProductVersionService] No project ID returned');
      return {
        success: false,
        message: 'No project ID returned from database function'
      };
    }

    console.log('[ProductVersionService] Product version created successfully, project_id:', data);
    
    return {
      success: true,
      project_id: data,
      message: 'Product version created successfully'
    };
  } catch (error) {
    console.error('[ProductVersionService] Error creating product version:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get the next version number for a product
 */
export async function getNextVersionNumber(rootProductId: string): Promise<string> {
  try {
    // Simple version numbering logic - get existing products with same parent
    const { data: existingProducts, error } = await supabase
      .from('products')
      .select('version')
      .or(`parent_product_id.eq.${rootProductId},id.eq.${rootProductId}`)
      .order('version', { ascending: false });

    if (error) {
      console.error('[ProductVersionService] Error getting versions:', error);
      return '1.1';
    }

    if (!existingProducts || existingProducts.length === 0) {
      return '1.1';
    }

    // Find the highest version and increment
    const versions = existingProducts
      .map(p => p.version || '1.0')
      .filter(v => /^\d+\.\d+$/.test(v))
      .map(v => {
        const [major, minor] = v.split('.').map(Number);
        return { major, minor, original: v };
      })
      .sort((a, b) => a.major - b.major || a.minor - b.minor);

    if (versions.length === 0) {
      return '1.1';
    }

    const latest = versions[versions.length - 1];
    return `${latest.major}.${latest.minor + 1}`;
  } catch (error) {
    console.error('[ProductVersionService] Error in getNextVersionNumber:', error);
    return '1.1';
  }
}

/**
 * Get product version hierarchy
 */
export async function getProductVersionHierarchy(rootProductId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, version, parent_product_id, created_at')
      .or(`parent_product_id.eq.${rootProductId},id.eq.${rootProductId}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ProductVersionService] Error fetching hierarchy:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[ProductVersionService] Error in getProductVersionHierarchy:', error);
    throw error;
  }
}
