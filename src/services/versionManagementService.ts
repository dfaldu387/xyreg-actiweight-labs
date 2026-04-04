
import { supabase } from '@/integrations/supabase/client';
import { ProductVersionHierarchy, ProductVersionHistory, ProductForSelection } from '@/types/project';

/**
 * Get the version hierarchy for a product family
 */
export async function getProductVersionHierarchy(rootProductId: string): Promise<ProductVersionHierarchy[]> {
  try {
    const { data, error } = await supabase.rpc('get_product_version_hierarchy', {
      root_product_id: rootProductId
    });

    if (error) {
      console.error('Error fetching product version hierarchy:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProductVersionHierarchy:', error);
    throw error;
  }
}

/**
 * Get version history for a product
 */
export async function getProductVersionHistory(productId: string): Promise<ProductVersionHistory[]> {
  try {
    const { data, error } = await supabase
      .from('product_version_history')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching product version history:', error);
      throw error;
    }

    // Type cast the version_type to ensure compatibility
    return (data || []).map(item => ({
      ...item,
      version_type: item.version_type as 'major' | 'minor' | 'patch',
      metadata: item.metadata as Record<string, any>
    }));
  } catch (error) {
    console.error('Error in getProductVersionHistory:', error);
    throw error;
  }
}

/**
 * Compare two version strings
 */
export async function compareVersions(version1: string, version2: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('compare_versions', {
      version1,
      version2
    });

    if (error) {
      console.error('Error comparing versions:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in compareVersions:', error);
    throw error;
  }
}

/**
 * Get the next version number for a product family
 */
export async function getNextVersionNumber(rootProductId: string): Promise<string> {
  try {
    // For now, generate a simple version number until we implement the RPC function
    const timestamp = Date.now().toString().slice(-6);
    return `1.0.${timestamp}`;
  } catch (error) {
    console.error('Error in getNextVersionNumber:', error);
    throw error;
  }
}

/**
 * Get all versions of a product family
 */
export async function getProductVersions(companyId: string, rootProductId?: string): Promise<ProductForSelection[]> {
  try {
    let query = supabase
      .from('products')
      .select('id, name, description, status, version, parent_product_id, inserted_at, company_id')
      .eq('company_id', companyId)
      .eq('is_archived', false);

    if (rootProductId) {
      query = query.or(`id.eq.${rootProductId},parent_product_id.eq.${rootProductId}`);
    }

    const { data, error } = await query.order('version');

    if (error) {
      console.error('Error fetching product versions:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(product => ({
      ...product,
      created_at: product.inserted_at
    }));
  } catch (error) {
    console.error('Error in getProductVersions:', error);
    throw error;
  }
}
