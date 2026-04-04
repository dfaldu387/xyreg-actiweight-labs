import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CleanupAnalysis {
  totalDocuments: number;
  duplicateGroups: Array<{
    name: string;
    count: number;
    documents: any[];
    suggestedAction: 'merge' | 'keep_newest' | 'manual_review';
  }>;
  orphanedDocuments: any[];
  scopeInconsistencies: any[];
  templateInstances: {
    total: number;
    withoutProducts: number;
    crossProductDuplicates: number;
  };
}

export interface CleanupOptions {
  removeDuplicates: boolean;
  fixOrphans: boolean;
  consolidateTemplates: boolean;
  archiveOldVersions: boolean;
  dryRun: boolean;
}

export interface CleanupReport {
  analysis: CleanupAnalysis;
  actions: Array<{
    type: string;
    description: string;
    count: number;
    items: string[];
  }>;
  summary: {
    documentsProcessed: number;
    duplicatesRemoved: number;
    orphansFixed: number;
    templatesConsolidated: number;
    errors: string[];
  };
}

export class EnhancedDocumentCleanupService {
  
  /**
   * Perform comprehensive analysis of company documents
   */
  static async analyzeCompanyDocuments(companyId: string): Promise<CleanupAnalysis> {
    console.log('[EnhancedCleanup] Starting document analysis for company:', companyId);
    
    try {
      // Fetch all documents for the company
      const { data: allDocs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .order('name')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const documents = allDocs || [];
      console.log('[EnhancedCleanup] Analyzing', documents.length, 'documents');

      // Group documents by name to identify duplicates
      const documentGroups = new Map<string, any[]>();
      documents.forEach(doc => {
        const key = doc.name.toLowerCase().trim();
        if (!documentGroups.has(key)) {
          documentGroups.set(key, []);
        }
        documentGroups.get(key)!.push(doc);
      });

      // Identify duplicate groups
      const duplicateGroups = Array.from(documentGroups.entries())
        .filter(([_, docs]) => docs.length > 1)
        .map(([name, docs]) => ({
          name,
          count: docs.length,
          documents: docs,
          suggestedAction: this.determineSuggestedAction(docs)
        }));

      // Find orphaned documents (missing company_id or product references)
      const orphanedDocuments = documents.filter(doc => 
        !doc.company_id || 
        (doc.document_scope === 'product_document' && !doc.product_id)
      );

      // Find scope inconsistencies
      const scopeInconsistencies = documents.filter(doc => 
        (doc.document_scope === 'product_document' && !doc.product_id) ||
        (doc.document_scope === 'company_template' && doc.product_id) ||
        (doc.template_source_id && doc.document_scope !== 'product_document')
      );

      // Analyze template instances
      const templateInstances = documents.filter(doc => doc.template_source_id);
      const templateWithoutProducts = templateInstances.filter(doc => !doc.product_id);
      
      // Find cross-product template duplicates
      const templateGroups = new Map<string, any[]>();
      templateInstances.forEach(doc => {
        const key = `${doc.template_source_id}_${doc.product_id}`;
        if (!templateGroups.has(key)) {
          templateGroups.set(key, []);
        }
        templateGroups.get(key)!.push(doc);
      });
      
      const crossProductDuplicates = Array.from(templateGroups.values())
        .filter(group => group.length > 1)
        .reduce((sum, group) => sum + group.length - 1, 0);

      return {
        totalDocuments: documents.length,
        duplicateGroups,
        orphanedDocuments,
        scopeInconsistencies,
        templateInstances: {
          total: templateInstances.length,
          withoutProducts: templateWithoutProducts.length,
          crossProductDuplicates
        }
      };

    } catch (error) {
      console.error('[EnhancedCleanup] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Execute cleanup based on options
   */
  static async executeCleanup(
    companyId: string, 
    options: CleanupOptions
  ): Promise<CleanupReport> {
    console.log('[EnhancedCleanup] Starting cleanup with options:', options);
    
    const analysis = await this.analyzeCompanyDocuments(companyId);
    const actions: CleanupReport['actions'] = [];
    const summary = {
      documentsProcessed: 0,
      duplicatesRemoved: 0,
      orphansFixed: 0,
      templatesConsolidated: 0,
      errors: [] as string[]
    };

    try {
      // Remove duplicates
      if (options.removeDuplicates) {
        for (const group of analysis.duplicateGroups) {
          if (group.suggestedAction === 'keep_newest') {
            const toRemove = group.documents
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(1);

            if (!options.dryRun) {
              for (const doc of toRemove) {
                const { error } = await supabase
                  .from('documents')
                  .delete()
                  .eq('id', doc.id);
                
                if (error) {
                  summary.errors.push(`Failed to remove duplicate ${doc.name}: ${error.message}`);
                } else {
                  summary.duplicatesRemoved++;
                }
              }
            }

            actions.push({
              type: 'remove_duplicates',
              description: `Remove ${toRemove.length} duplicate copies of "${group.name}"`,
              count: toRemove.length,
              items: toRemove.map(doc => doc.id)
            });
          }
        }
      }

      // Fix orphaned documents
      if (options.fixOrphans) {
        for (const doc of analysis.orphanedDocuments) {
          if (!doc.company_id && !options.dryRun) {
            const { error } = await supabase
              .from('documents')
              .update({ company_id: companyId })
              .eq('id', doc.id);
            
            if (error) {
              summary.errors.push(`Failed to fix orphan ${doc.name}: ${error.message}`);
            } else {
              summary.orphansFixed++;
            }
          }

          actions.push({
            type: 'fix_orphan',
            description: `Fix orphaned document "${doc.name}"`,
            count: 1,
            items: [doc.id]
          });
        }
      }

      // Consolidate templates
      if (options.consolidateTemplates) {
        const templateGroups = new Map<string, any[]>();
        analysis.duplicateGroups
          .filter(group => group.documents.some(doc => doc.template_source_id))
          .forEach(group => {
            group.documents.forEach(doc => {
              if (doc.template_source_id) {
                const key = `${doc.template_source_id}_${doc.product_id}`;
                if (!templateGroups.has(key)) {
                  templateGroups.set(key, []);
                }
                templateGroups.get(key)!.push(doc);
              }
            });
          });

        for (const [key, templates] of templateGroups.entries()) {
          if (templates.length > 1) {
            const toRemove = templates.slice(1);
            
            if (!options.dryRun) {
              for (const template of toRemove) {
                const { error } = await supabase
                  .from('documents')
                  .delete()
                  .eq('id', template.id);
                
                if (error) {
                  summary.errors.push(`Failed to consolidate template ${template.name}: ${error.message}`);
                } else {
                  summary.templatesConsolidated++;
                }
              }
            }

            actions.push({
              type: 'consolidate_templates',
              description: `Consolidate ${templates.length} template instances`,
              count: toRemove.length,
              items: toRemove.map(t => t.id)
            });
          }
        }
      }

      summary.documentsProcessed = analysis.totalDocuments;

      if (!options.dryRun && (summary.duplicatesRemoved > 0 || summary.orphansFixed > 0 || summary.templatesConsolidated > 0)) {
        toast.success(`Cleanup completed: ${summary.duplicatesRemoved} duplicates removed, ${summary.orphansFixed} orphans fixed, ${summary.templatesConsolidated} templates consolidated`);
      }

      return {
        analysis,
        actions,
        summary
      };

    } catch (error) {
      console.error('[EnhancedCleanup] Cleanup execution failed:', error);
      summary.errors.push(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Determine suggested action for duplicate group
   */
  private static determineSuggestedAction(documents: any[]): 'merge' | 'keep_newest' | 'manual_review' {
    // If all documents have the same content and scope, keep newest
    const uniqueScopes = new Set(documents.map(doc => doc.document_scope));
    const uniqueTypes = new Set(documents.map(doc => doc.document_type));
    
    if (uniqueScopes.size === 1 && uniqueTypes.size === 1) {
      return 'keep_newest';
    }
    
    // If mixed scopes or types, manual review needed
    if (uniqueScopes.size > 1 || uniqueTypes.size > 1) {
      return 'manual_review';
    }
    
    return 'merge';
  }

  /**
   * Get document hierarchy for visualization
   */
  static async getDocumentHierarchy(companyId: string): Promise<{
    companyTemplates: any[];
    productDocuments: Map<string, any[]>;
    templateInstances: Map<string, any[]>;
  }> {
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        *,
        products(name)
      `)
      .eq('company_id', companyId);

    if (error) throw error;

    const companyTemplates = documents?.filter(doc => 
      doc.document_scope === 'company_template' && !doc.template_source_id
    ) || [];

    const productDocuments = new Map<string, any[]>();
    const templateInstances = new Map<string, any[]>();

    documents?.forEach(doc => {
      if (doc.document_scope === 'product_document') {
        if (doc.template_source_id) {
          // Template instance
          const key = doc.products?.name || 'Unknown Product';
          if (!templateInstances.has(key)) {
            templateInstances.set(key, []);
          }
          templateInstances.get(key)!.push(doc);
        } else {
          // Product-specific document
          const key = doc.products?.name || 'Unknown Product';
          if (!productDocuments.has(key)) {
            productDocuments.set(key, []);
          }
          productDocuments.get(key)!.push(doc);
        }
      }
    });

    return {
      companyTemplates,
      productDocuments,
      templateInstances
    };
  }
}
