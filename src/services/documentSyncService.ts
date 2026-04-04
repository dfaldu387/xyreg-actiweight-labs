
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentSyncResult {
  success: boolean;
  documentId?: string;
  templateId?: string;
  error?: string;
  message?: string;
}

export interface MigrationResult {
  company_name: string;
  documents_migrated: number;
  success: boolean;
}

/**
 * Enhanced document synchronization service that manages both 
 * phase_assigned_documents and company_document_templates
 */
export class DocumentSyncService {
  
  /**
   * Create a document with automatic synchronization
   */
  static async createDocumentWithSync(
    phaseId: string,
    name: string,
    documentType: string = 'Standard',
    status: string = 'Not Started',
    techApplicability: string = 'All device types',
    markets: any[] = [],
    classesByMarket: any = {},
    documentScope: string = 'company_template'
  ): Promise<DocumentSyncResult> {
    
    try {
      const { data, error } = await supabase.rpc('create_phase_document_with_sync', {
        p_phase_id: phaseId,
        p_name: name,
        p_document_type: documentType,
        p_status: status,
        p_tech_applicability: techApplicability,
        p_markets: JSON.stringify(markets),
        p_classes_by_market: JSON.stringify(classesByMarket),
        p_document_scope: documentScope
      });

      if (error) {
        console.error('[DocumentSync] Error creating document:', error);
        return {
          success: false,
          error: error.message,
          message: `Failed to create document: ${error.message}`
        };
      }

      // Type guard and safe property access
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as Record<string, any>;
        if (result.success) {
          return {
            success: true,
            documentId: result.document_id,
            templateId: result.template_id,
            message: result.message
          };
        } else {
          console.error('[DocumentSync] Database function returned error:', data);
          return {
            success: false,
            error: result.error || 'Unknown error',
            message: result.message || 'Failed to create document'
          };
        }
      } else {
        return {
          success: false,
          error: 'Invalid response format',
          message: 'Database function returned unexpected response format'
        };
      }

    } catch (error) {
      console.error('[DocumentSync] Exception during document creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create document due to unexpected error'
      };
    }
  }

  /**
   * Migrate existing phase documents to company templates
   */
  static async migrateExistingDocuments(): Promise<MigrationResult[]> {
    try {
      const { data, error } = await supabase.rpc('migrate_existing_phase_documents_to_templates');

      if (error) {
        console.error('[DocumentSync] Migration error:', error);
        toast.error(`Migration failed: ${error.message}`);
        return [];
      }

      const results = (data || []).map((item: any) => ({
        company_name: item.company_name,
        documents_migrated: item.documents_migrated,
        success: item.success
      }));
      
      const totalMigrated = results.reduce((sum, result) => sum + result.documents_migrated, 0);
      if (totalMigrated > 0) {
        toast.success(`Successfully migrated ${totalMigrated} documents across ${results.length} companies`);
      }

      return results;
    } catch (error) {
      console.error('[DocumentSync] Migration exception:', error);
      toast.error('Failed to migrate existing documents');
      return [];
    }
  }

  /**
   * Sync a specific document to company templates
   */
  static async syncDocumentToTemplate(
    phaseId: string,
    documentName: string,
    documentType: string = 'Standard',
    techApplicability: string = 'All device types',
    markets: any[] = [],
    classesByMarket: any = {}
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('sync_document_to_company_templates', {
        p_phase_id: phaseId,
        p_document_name: documentName,
        p_document_type: documentType,
        p_tech_applicability: techApplicability,
        p_markets: JSON.stringify(markets),
        p_classes_by_market: JSON.stringify(classesByMarket)
      });

      if (error) {
        console.error('[DocumentSync] Sync error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[DocumentSync] Sync exception:', error);
      return false;
    }
  }

  /**
   * Get synchronized document status for a company
   */
  static async getDocumentSyncStatus(companyId: string): Promise<{
    phaseDocuments: number;
    templateDocuments: number;
    syncedDocuments: number;
    unsyncedDocuments: string[];
  }> {
    try {
      // First get phase IDs for the company
      const { data: phaseIds } = await supabase
        .from('phases')
        .select('id')
        .eq('company_id', companyId);

      const phaseIdArray = (phaseIds || []).map(p => p.id);

      if (phaseIdArray.length === 0) {
        return {
          phaseDocuments: 0,
          templateDocuments: 0,
          syncedDocuments: 0,
          unsyncedDocuments: []
        };
      }

      // Get phase documents count
      const { count: phaseDocsCount } = await supabase
        .from('phase_assigned_documents')
        .select('id', { count: 'exact', head: true })
        .eq('document_scope', 'company_template')
        .in('phase_id', phaseIdArray);

      // Get template documents count
      const { count: templateDocsCount } = await supabase
        .from('company_document_templates')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Get template document names for comparison
      const { data: templateDocs } = await supabase
        .from('company_document_templates')
        .select('name')
        .eq('company_id', companyId);

      const templateDocNames = (templateDocs || []).map(t => t.name);

      // Get documents that exist in phase_assigned_documents but not in templates
      const { data: unsyncedDocs } = await supabase
        .from('phase_assigned_documents')
        .select('name')
        .eq('document_scope', 'company_template')
        .in('phase_id', phaseIdArray)
        .not('name', 'in', `(${templateDocNames.map(name => `'${name}'`).join(',')})`);

      return {
        phaseDocuments: phaseDocsCount || 0,
        templateDocuments: templateDocsCount || 0,
        syncedDocuments: Math.min(phaseDocsCount || 0, templateDocsCount || 0),
        unsyncedDocuments: (unsyncedDocs || []).map(doc => doc.name)
      };
    } catch (error) {
      console.error('[DocumentSync] Error getting sync status:', error);
      return {
        phaseDocuments: 0,
        templateDocuments: 0,
        syncedDocuments: 0,
        unsyncedDocuments: []
      };
    }
  }
}
