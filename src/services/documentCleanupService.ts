import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CleanupResult {
  success: boolean;
  duplicatesRemoved: number;
  orphansFixed: number;
  errors: string[];
  details: Array<{
    action: string;
    documentName: string;
    count: number;
  }>;
}

/**
 * Document cleanup and duplicate prevention service
 */
export class DocumentCleanupService {
  
  /**
   * Run comprehensive cleanup for a specific product
   */
  static async cleanupProductDocuments(productId: string): Promise<CleanupResult> {
    console.log('[DocumentCleanupService] Starting cleanup for product:', productId);
    
    try {
      const result: CleanupResult = {
        success: true,
        duplicatesRemoved: 0,
        orphansFixed: 0,
        errors: [],
        details: []
      };

      // Step 1: Manual duplicate cleanup (since constraints might fail)
      await this.removeDuplicatesManually(productId, result);
      
      // Step 2: Fix orphaned documents
      await this.fixOrphanedDocuments(productId, result);
      
      // Step 3: Clean up phase inconsistencies
      await this.cleanupPhaseInconsistencies(productId, result);
      
      console.log('[DocumentCleanupService] Cleanup completed:', result);
      
      if (result.duplicatesRemoved > 0 || result.orphansFixed > 0) {
        toast.success(`Cleanup completed: ${result.duplicatesRemoved} duplicates removed, ${result.orphansFixed} orphans fixed`);
      } else {
        toast.info('No cleanup needed - documents are already clean');
      }
      
      return result;
      
    } catch (error) {
      console.error('[DocumentCleanupService] Cleanup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast.error(`Cleanup failed: ${errorMessage}`);
      
      return {
        success: false,
        duplicatesRemoved: 0,
        orphansFixed: 0,
        errors: [errorMessage],
        details: []
      };
    }
  }

  /**
   * Manual duplicate removal to handle constraint violations
   */
  private static async removeDuplicatesManually(productId: string, result: CleanupResult): Promise<void> {
    try {
      // Find duplicates in product documents
      const { data: duplicates, error: findError } = await supabase
        .from('documents')
        .select('name, product_id, company_id, document_scope, id, inserted_at')
        .eq('product_id', productId)
        .eq('document_scope', 'product_document')
        .order('name')
        .order('inserted_at', { ascending: false });

      if (findError) {
        throw findError;
      }

      if (!duplicates || duplicates.length === 0) {
        return;
      }

      // Group by name to find duplicates
      const duplicateGroups = new Map<string, typeof duplicates>();
      
      duplicates.forEach(doc => {
        const key = doc.name;
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key)!.push(doc);
      });

      // Remove duplicates (keep the most recent)
      for (const [docName, docs] of duplicateGroups.entries()) {
        if (docs.length > 1) {
          // Sort by inserted_at descending, keep first (most recent), remove rest
          const sortedDocs = docs.sort((a, b) => 
            new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
          );
          
          const toRemove = sortedDocs.slice(1); // Remove all but the first (most recent)
          
          for (const doc of toRemove) {
            const { error: deleteError } = await supabase
              .from('documents')
              .delete()
              .eq('id', doc.id);
              
            if (deleteError) {
              console.error(`Failed to remove duplicate: ${doc.id}`, deleteError);
              result.errors.push(`Failed to remove duplicate ${docName}: ${deleteError.message}`);
            } else {
              result.duplicatesRemoved++;
              result.details.push({
                action: 'removed_duplicate',
                documentName: docName,
                count: 1
              });
            }
          }
        }
      }
      
    } catch (error) {
      console.error('[DocumentCleanupService] Error removing duplicates:', error);
      result.errors.push(`Duplicate removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fix documents with missing company_id
   */
  private static async fixOrphanedDocuments(productId: string, result: CleanupResult): Promise<void> {
    try {
      // Get product's company_id
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('company_id')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Product not found');
      }

      // Fix orphaned documents
      const { error: updateError } = await supabase
        .from('documents')
        .update({ company_id: product.company_id })
        .eq('product_id', productId)
        .is('company_id', null);

      if (updateError) {
        throw updateError;
      }

      result.details.push({
        action: 'fixed_orphaned_documents',
        documentName: 'Multiple documents',
        count: 1
      });
      
    } catch (error) {
      console.error('[DocumentCleanupService] Error fixing orphaned documents:', error);
      result.errors.push(`Orphan fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up lifecycle phase inconsistencies
   */
  private static async cleanupPhaseInconsistencies(productId: string, result: CleanupResult): Promise<void> {
    try {
      // Remove duplicate lifecycle_phases entries
      const { data: phases, error: phasesError } = await supabase
        .from('lifecycle_phases')
        .select('id, inserted_at')
        .eq('product_id', productId)
        .order('inserted_at', { ascending: false });

      if (phasesError) {
        throw phasesError;
      }

      if (phases && phases.length > 1) {
        // Keep the most recent, remove others
        const toRemove = phases.slice(1);
        
        for (const phase of toRemove) {
          const { error: deleteError } = await supabase
            .from('lifecycle_phases')
            .delete()
            .eq('id', phase.id);
            
          if (deleteError) {
            console.error(`Failed to remove duplicate lifecycle phase: ${phase.id}`, deleteError);
          }
        }
        
        result.details.push({
          action: 'cleaned_phase_duplicates',
          documentName: 'Lifecycle phases',
          count: toRemove.length
        });
      }
      
    } catch (error) {
      console.error('[DocumentCleanupService] Error cleaning phase inconsistencies:', error);
      result.errors.push(`Phase cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prevent duplicates when creating new documents
   */
  static async createDocumentSafely(documentData: {
    name: string;
    product_id: string;
    company_id: string;
    document_scope: 'product_document' | 'company_template' | 'company_document';
    document_type?: string;
    phase_id?: string;
    template_source_id?: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
  }): Promise<{ success: boolean; document?: any; error?: string }> {
    try {
      // Check if document already exists
      const { data: existing, error: checkError } = await supabase
        .from('documents')
        .select('id')
        .eq('name', documentData.name)
        .eq('product_id', documentData.product_id)
        .eq('company_id', documentData.company_id)
        .eq('document_scope', documentData.document_scope)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existing) {
        return {
          success: false,
          error: `Document "${documentData.name}" already exists for this product`
        };
      }

      // Create the document
      const { data: newDocument, error: createError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return {
        success: true,
        document: newDocument
      };
      
    } catch (error) {
      console.error('[DocumentCleanupService] Error creating document safely:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run cleanup for all products in a company
   */
  static async cleanupCompanyDocuments(companyId: string): Promise<CleanupResult> {
    console.log('[DocumentCleanupService] Starting company-wide cleanup for:', companyId);
    
    try {
      // Get all products for the company
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) {
        throw productsError;
      }

      if (!products || products.length === 0) {
        return {
          success: true,
          duplicatesRemoved: 0,
          orphansFixed: 0,
          errors: [],
          details: []
        };
      }

      const totalResult: CleanupResult = {
        success: true,
        duplicatesRemoved: 0,
        orphansFixed: 0,
        errors: [],
        details: []
      };

      // Clean up each product
      for (const product of products) {
        const productResult = await this.cleanupProductDocuments(product.id);
        
        totalResult.duplicatesRemoved += productResult.duplicatesRemoved;
        totalResult.orphansFixed += productResult.orphansFixed;
        totalResult.errors.push(...productResult.errors);
        totalResult.details.push(...productResult.details);
        
        if (!productResult.success) {
          totalResult.success = false;
        }
      }

      console.log('[DocumentCleanupService] Company cleanup completed:', totalResult);
      
      if (totalResult.duplicatesRemoved > 0 || totalResult.orphansFixed > 0) {
        toast.success(`Company cleanup completed: ${totalResult.duplicatesRemoved} duplicates removed, ${totalResult.orphansFixed} orphans fixed across ${products.length} products`);
      }
      
      return totalResult;
      
    } catch (error) {
      console.error('[DocumentCleanupService] Company cleanup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        duplicatesRemoved: 0,
        orphansFixed: 0,
        errors: [errorMessage],
        details: []
      };
    }
  }
}
