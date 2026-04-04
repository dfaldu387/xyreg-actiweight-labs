import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SyncStatus {
  productId: string;
  companyId: string;
  lastSyncAt: string;
  syncStatus: 'in_sync' | 'out_of_sync' | 'syncing' | 'failed';
  documentsOutOfSync: number;
  totalDocuments: number;
  errors: string[];
}

export interface CompanySyncResult {
  success: boolean;
  productsUpdated: number;
  documentsCreated: number;
  documentsUpdated: number;
  documentsRemoved: number;
  errors: string[];
  details: any[];
}

export class CompanySyncService {
  static async detectCompanyChanges(companyId: string): Promise<{
    hasChanges: boolean;
    changedAreas: string[];
    affectedProducts: string[];
  }> {
    try {
      // Get all products for the company
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, current_lifecycle_phase')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) throw productsError;

      // Check company document templates changes
      const { data: templates, error: templatesError } = await supabase
        .from('company_document_templates')
        .select('id, name, updated_at')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Check company phases changes
      const { data: phases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          company_phases!inner(id, name, updated_at)
        `)
        .eq('company_id', companyId)
        .order('company_phases.updated_at', { ascending: false });

      if (phasesError) throw phasesError;

      // Simple change detection (can be enhanced with timestamps)
      const changedAreas: string[] = [];
      const affectedProducts = (products || []).map(p => p.id);

      // For now, we'll assume there are changes if we have data
      if (templates && templates.length > 0) {
        changedAreas.push('document_templates');
      }

      if (phases && phases.length > 0) {
        changedAreas.push('company_phases');
      }

      return {
        hasChanges: changedAreas.length > 0,
        changedAreas,
        affectedProducts
      };
    } catch (error) {
      console.error('Error detecting company changes:', error);
      return {
        hasChanges: false,
        changedAreas: [],
        affectedProducts: []
      };
    }
  }

  static async getSyncStatus(productId: string, companyId: string): Promise<SyncStatus> {
    try {
      // Get company phases
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          company_phases!inner(id, name)
        `)
        .eq('company_id', companyId);

      if (phasesError) throw phasesError;

      // Get product documents
      const { data: productDocs, error: docsError } = await supabase
        .from('documents')
        .select('id, name, phase_id, template_source_id, updated_at')
        .eq('product_id', productId);

      if (docsError) throw docsError;

      // Get company document templates  
      const { data: templates, error: templatesError } = await supabase
        .from('company_document_templates')
        .select('id, name, updated_at')
        .eq('company_id', companyId);

      if (templatesError) throw templatesError;

      const totalDocuments = productDocs?.length || 0;
      
      // Simple sync status determination
      // In a real implementation, this would compare timestamps and template versions
      const documentsOutOfSync = 0; // Placeholder - would need proper comparison logic

      return {
        productId,
        companyId,
        lastSyncAt: new Date().toISOString(),
        syncStatus: documentsOutOfSync > 0 ? 'out_of_sync' : 'in_sync',
        documentsOutOfSync,
        totalDocuments,
        errors: []
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        productId,
        companyId,
        lastSyncAt: new Date().toISOString(),
        syncStatus: 'failed',
        documentsOutOfSync: 0,
        totalDocuments: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  static async syncCompanyToProducts(companyId: string): Promise<CompanySyncResult> {
    try {
      console.log('Starting company-wide sync for company:', companyId);
      
      // Get all products for the company
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, current_lifecycle_phase')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        return {
          success: true,
          productsUpdated: 0,
          documentsCreated: 0,
          documentsUpdated: 0,
          documentsRemoved: 0,
          errors: [],
          details: []
        };
      }

      let totalProductsUpdated = 0;
      let totalDocumentsCreated = 0;
      let totalDocumentsUpdated = 0;
      let totalDocumentsRemoved = 0;
      const errors: string[] = [];
      const details: any[] = [];

      // Import the enhanced sync service
      const { enhancedSyncDocumentsToProduct } = await import('./enhancedDocumentSyncService');

      // Sync each product
      for (const product of products) {
        try {
          const result = await enhancedSyncDocumentsToProduct(
            product.id,
            companyId,
            product.current_lifecycle_phase
          );

          if (result.success) {
            totalProductsUpdated++;
            totalDocumentsCreated += result.created;
            totalDocumentsUpdated += result.updated;
            totalDocumentsRemoved += result.cleaned;
            
            details.push({
              productId: product.id,
              productName: product.name,
              documentsCreated: result.created,
              documentsUpdated: result.updated,
              documentsRemoved: result.cleaned
            });
          } else {
            errors.push(`Product ${product.name}: ${result.errors.join(', ')}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Product ${product.name}: ${errorMessage}`);
        }
      }

      console.log(`Company sync completed. Updated ${totalProductsUpdated} products`);
      
      if (totalProductsUpdated > 0) {
        toast.success(`Synced ${totalProductsUpdated} products with company settings`);
      }

      if (errors.length > 0) {
        toast.warning(`Sync completed with ${errors.length} errors`);
      }

      return {
        success: errors.length === 0,
        productsUpdated: totalProductsUpdated,
        documentsCreated: totalDocumentsCreated,
        documentsUpdated: totalDocumentsUpdated,
        documentsRemoved: totalDocumentsRemoved,
        errors,
        details
      };
    } catch (error) {
      console.error('Error in company-wide sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        productsUpdated: 0,
        documentsCreated: 0,
        documentsUpdated: 0,
        documentsRemoved: 0,
        errors: [errorMessage],
        details: []
      };
    }
  }

  static async syncProductToCompany(productId: string, companyId: string): Promise<CompanySyncResult> {
    try {
      console.log('Starting product sync for product:', productId);
      
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, current_lifecycle_phase')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Import the enhanced sync service
      const { enhancedSyncDocumentsToProduct } = await import('./enhancedDocumentSyncService');

      const result = await enhancedSyncDocumentsToProduct(
        productId,
        companyId,
        product.current_lifecycle_phase
      );

      if (result.success) {
        toast.success(`Product ${product.name} synced with company settings`);
      } else {
        toast.error(`Failed to sync product: ${result.errors.join(', ')}`);
      }

      return {
        success: result.success,
        productsUpdated: result.success ? 1 : 0,
        documentsCreated: result.created,
        documentsUpdated: result.updated,
        documentsRemoved: result.cleaned,
        errors: result.errors,
        details: [{
          productId,
          productName: product.name,
          documentsCreated: result.created,
          documentsUpdated: result.updated,
          documentsRemoved: result.cleaned
        }]
      };
    } catch (error) {
      console.error('Error in product sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        productsUpdated: 0,
        documentsCreated: 0,
        documentsUpdated: 0,
        documentsRemoved: 0,
        errors: [errorMessage],
        details: []
      };
    }
  }
}