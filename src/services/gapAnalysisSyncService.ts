import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SyncResult {
  success: boolean;
  itemsCleared: number;
  itemsCreated: number;
  templatesProcessed: number;
  errors: string[];
}

export class GapAnalysisSyncService {
  /**
   * Regenerate gap analysis items for a company based on enabled templates
   */
  static async regenerateCompanyGapItems(companyId: string, clearExisting: boolean = true): Promise<SyncResult> {
    try {
      
      
      // Implement the regeneration logic
      let itemsCleared = 0;
      let itemsCreated = 0;
      let templatesProcessed = 0;

      if (clearExisting) {
        // Clear existing items
        const { count: cleared, error: clearError } = await supabase
          .from('gap_analysis_items')
          .delete()
          .is('product_id', null);
        
        if (clearError) throw clearError;
        itemsCleared = cleared || 0;
      }

      // Get enabled templates for the company
      const { data: templates, error: templatesError } = await supabase
        .from('company_gap_templates')
        .select(`
          template_id,
          gap_analysis_templates!inner(
            id,
            framework,
            gap_template_items(*)
          )
        `)
        .eq('company_id', companyId)
        .eq('is_enabled', true);

      if (templatesError) throw templatesError;

      // Create items for each enabled template
      for (const templateAssoc of templates || []) {
        const template = templateAssoc.gap_analysis_templates;
        if (!template) continue;
        
        templatesProcessed++;
        
        for (const item of template.gap_template_items || []) {
          const { error: insertError } = await supabase
            .from('gap_analysis_items')
            .insert({
              product_id: null,
              requirement: item.requirement_text,
              framework: template.framework,
              section: item.clause_reference,
              clause_id: item.item_number,
              clause_summary: item.requirement_text,
              category: item.category,
              status: 'non_compliant',
              priority: item.priority,
              action_needed: '',
              associated_standards: (item as any).associated_standards || item.applicable_standards || null,
              recommended_teams: (item as any).recommended_teams || null
            });

          if (!insertError) {
            itemsCreated++;
          }
        }
      }

      

      return {
        success: true,
        itemsCleared,
        itemsCreated,
        templatesProcessed,
        errors: []
      };
    } catch (error) {
      console.error('[GapAnalysisSyncService] Error during regeneration:', error);
      return {
        success: false,
        itemsCleared: 0,
        itemsCreated: 0,
        templatesProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Check synchronization status between templates and gap analysis items
   */
  static async checkSyncStatus(companyId: string): Promise<{
    templatesEnabled: number;
    totalTemplateItems: number;
    gapAnalysisItems: number;
    isInSync: boolean;
  }> {
    try {
      // Get enabled templates and their item counts
      const { data: templateData, error: templateError } = await supabase
        .from('company_gap_templates')
        .select(`
          template_id,
          gap_analysis_templates!inner(
            framework,
            gap_template_items(count)
          )
        `)
        .eq('company_id', companyId)
        .eq('is_enabled', true);

      if (templateError) throw templateError;

      const templatesEnabled = templateData?.length || 0;
      const totalTemplateItems = templateData?.reduce((total, template: any) => {
        const itemCount = template.gap_analysis_templates?.gap_template_items?.[0]?.count || 0;
        return total + itemCount;
      }, 0) || 0;

      // Get company gap analysis items count
      const { count: gapAnalysisItems, error: itemsError } = await supabase
        .from('gap_analysis_items')
        .select('*', { count: 'exact', head: true })
        .is('product_id', null);

      if (itemsError) throw itemsError;

      const actualGapItems = gapAnalysisItems || 0;
      const isInSync = totalTemplateItems === actualGapItems;

      return {
        templatesEnabled,
        totalTemplateItems,
        gapAnalysisItems: actualGapItems,
        isInSync
      };
    } catch (error) {
      console.error('[GapAnalysisSyncService] Error checking sync status:', error);
      return {
        templatesEnabled: 0,
        totalTemplateItems: 0,
        gapAnalysisItems: 0,
        isInSync: false
      };
    }
  }

  /**
   * Sync gap analysis items for all company products when templates are updated
   */
  static async syncAfterTemplateChange(companyId: string, templateId: string, isEnabled: boolean, onProgress?: (current: number, total: number, meta?: { devices: number; requirements: number }) => void): Promise<void> {
    try {
      
      
      if (isEnabled) {
        // When enabling a template, create new items based on scope
        const { data: template, error: templateError } = await supabase
          .from('gap_analysis_templates')
          .select(`
            *,
            gap_template_items(*)
          `)
          .eq('id', templateId)
          .single();

        if (templateError) throw templateError;

        if (template?.gap_template_items) {
          if (template.scope === 'product') {
            // Product-scoped: create items for each product
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('id')
              .eq('company_id', companyId)
              .eq('is_archived', false);

            if (productsError) throw productsError;

            if (products) {
              const numDevices = products.length;
              const numRequirements = template.gap_template_items.length;
              const totalItems = numDevices * numRequirements;
              let completedItems = 0;
              const meta = { devices: numDevices, requirements: numRequirements };
              onProgress?.(0, totalItems, meta);
              for (const product of products) {
                for (const item of template.gap_template_items) {
                  await supabase
                    .from('gap_analysis_items')
                    .insert({
                      product_id: product.id,
                      requirement: item.requirement_text,
                      framework: template.framework,
                      section: item.clause_reference,
                      clause_id: item.item_number,
                      clause_summary: item.requirement_text,
                      category: item.category,
                      status: 'non_compliant',
                      priority: item.priority,
                      action_needed: '',
                      associated_standards: (item as any).associated_standards || item.applicable_standards || null,
                      recommended_teams: (item as any).recommended_teams || null
                    });
                  completedItems++;
                  onProgress?.(completedItems, totalItems, meta);
                }
              }
            }
          } else {
            // Company-scoped: create items with product_id = null
            const totalItems = template.gap_template_items.length;
            let completedItems = 0;
            const meta = { devices: 1, requirements: totalItems };
            onProgress?.(0, totalItems, meta);
            for (const item of template.gap_template_items) {
              await supabase
                .from('gap_analysis_items')
                .insert({
                  product_id: null,
                  requirement: item.requirement_text,
                  framework: template.framework,
                  section: item.clause_reference,
                  clause_id: item.item_number,
                  clause_summary: item.requirement_text,
                  category: item.category,
                  status: 'non_compliant',
                  priority: item.priority,
                  action_needed: '',
                  associated_standards: (item as any).associated_standards || item.applicable_standards || null,
                  recommended_teams: (item as any).recommended_teams || null
                });
              completedItems++;
              onProgress?.(completedItems, totalItems, meta);
            }
          }
        }
      } else {
        // When disabling a template, remove items for that framework
        const { data: template } = await supabase
          .from('gap_analysis_templates')
          .select('framework, scope')
          .eq('id', templateId)
          .single();

        if (template) {
          if (template.scope === 'product') {
            // Product-scoped: delete items linked to company products
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('id')
              .eq('company_id', companyId);

            if (productsError) throw productsError;

            if (products && products.length > 0) {
              const productIds = products.map(p => p.id);

              await supabase
                .from('gap_analysis_items')
                .delete()
                .in('product_id', productIds)
                .eq('framework', template.framework);
            }
          } else {
            // Company-scoped: delete items where product_id is null for this framework
            await supabase
              .from('gap_analysis_items')
              .delete()
              .is('product_id', null)
              .eq('framework', template.framework);
          }
        }
      }

      
    } catch (error) {
      console.error('[GapAnalysisSyncService] Error syncing after template change:', error);
      throw error; // Re-throw to let the calling code handle the error display
    }
  }
}