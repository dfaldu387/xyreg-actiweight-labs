import { supabase } from '@/integrations/supabase/client';

export interface DuplicateCleanupResult {
  success: boolean;
  duplicatesFound: number;
  duplicatesRemoved: number;
  errors: string[];
  details: Array<{
    udiDi: string;
    duplicateCount: number;
    action: string;
  }>;
}

export class EudamedDuplicateCleanupService {
  /**
   * Clean up duplicate products for a company by merging duplicates with same UDI-DI
   */
  static async cleanupDuplicates(companyId: string): Promise<DuplicateCleanupResult> {
    try {
      console.log('Starting duplicate cleanup for company:', companyId);
      
      // Find products with duplicate UDI-DIs
      const { data: duplicateGroups, error: findError } = await supabase
        .from('products')
        .select('id, name, udi_di, inserted_at')
        .eq('company_id', companyId)
        .not('udi_di', 'is', null)
        .order('udi_di')
        .order('inserted_at');

      if (findError) throw findError;

      // Group products by UDI-DI
      const groupedByUdi = duplicateGroups?.reduce((groups, product) => {
        const key = product.udi_di;
        if (!groups[key]) groups[key] = [];
        groups[key].push(product);
        return groups;
      }, {} as Record<string, any[]>) || {};

      const result: DuplicateCleanupResult = {
        success: true,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        errors: [],
        details: []
      };

      // Process each group with duplicates
      for (const [udiDi, products] of Object.entries(groupedByUdi)) {
        if (products.length > 1) {
          result.duplicatesFound += products.length - 1;
          
          try {
            // Keep the oldest product (first created)
            const productToKeep = products.reduce((oldest, current) => {
              return new Date(current.inserted_at) < new Date(oldest.inserted_at) ? current : oldest;
            });

            const duplicateIds = products
              .filter(p => p.id !== productToKeep.id)
              .map(p => p.id);

            // Update document references to point to the kept product
            for (const duplicateId of duplicateIds) {
              await supabase
                .from('documents')
                .update({ product_id: productToKeep.id })
                .eq('product_id', duplicateId);

              // Update lifecycle phase references
              await supabase
                .from('lifecycle_phases')
                .update({ product_id: productToKeep.id })
                .eq('product_id', duplicateId);
            }

            // Delete duplicate products
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .in('id', duplicateIds);

            if (deleteError) {
              result.errors.push(`Failed to delete duplicates for UDI-DI ${udiDi}: ${deleteError.message}`);
            } else {
              result.duplicatesRemoved += duplicateIds.length;
              result.details.push({
                udiDi,
                duplicateCount: products.length,
                action: `Kept product ${productToKeep.id}, removed ${duplicateIds.length} duplicates`
              });
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Error processing duplicates for UDI-DI ${udiDi}: ${errorMsg}`);
          }
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      console.log('Duplicate cleanup result:', result);
      return result;
    } catch (error) {
      console.error('Duplicate cleanup failed:', error);
      return {
        success: false,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        details: []
      };
    }
  }

  /**
   * Get a report of duplicate products without cleaning them up
   */
  static async getDuplicatesReport(companyId: string) {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, udi_di, inserted_at')
        .eq('company_id', companyId)
        .not('udi_di', 'is', null)
        .order('udi_di');

      if (error) throw error;

      const groupedByUdi = products?.reduce((groups, product) => {
        const key = product.udi_di;
        if (!groups[key]) groups[key] = [];
        groups[key].push(product);
        return groups;
      }, {} as Record<string, any[]>) || {};

      const duplicates = Object.entries(groupedByUdi)
        .filter(([_, products]) => products.length > 1)
        .map(([udiDi, products]) => ({
          udiDi,
          count: products.length,
          products: products.map(p => ({ id: p.id, name: p.name, inserted_at: p.inserted_at }))
        }));

      return {
        totalProducts: products?.length || 0,
        duplicateGroups: duplicates.length,
        totalDuplicates: duplicates.reduce((sum, group) => sum + group.count - 1, 0),
        duplicates
      };
    } catch (error) {
      console.error('Failed to get duplicates report:', error);
      throw error;
    }
  }
}
