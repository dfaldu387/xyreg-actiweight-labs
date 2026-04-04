
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InstanceCreationResult {
  success: boolean;
  created: number;
  skipped: number;
  errors: string[];
}

export class AutomaticInstanceService {
  /**
   * Create document instances for a product based on company templates
   */
  static async createDocumentInstances(
    productId: string,
    companyId: string,
    phaseId?: string
  ): Promise<InstanceCreationResult> {
    const result: InstanceCreationResult = {
      success: false,
      created: 0,
      skipped: 0,
      errors: []
    };

    try {
      console.log(`[AutoInstance] Creating instances for product ${productId}, company ${companyId}`);

      // Get company phases - FIXED: Use company_phases
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        result.errors.push(`Failed to fetch company phases: ${phasesError.message}`);
        return result;
      }

      if (!companyPhases || companyPhases.length === 0) {
        result.errors.push('No active phases found for company');
        return result;
      }

      // Filter to specific phase if provided
      const targetPhases = phaseId 
        ? companyPhases.filter(cp => cp.company_phases.id === phaseId)
        : companyPhases;

      for (const phaseData of targetPhases) {
        const phase = phaseData.company_phases;
        
        // Get templates for this phase
        const { data: templates, error: templatesError } = await supabase
          .from('phase_assigned_documents')
          .select('*')
          .eq('phase_id', phase.id)
          .eq('document_scope', 'company_template');

        if (templatesError) {
          result.errors.push(`Failed to fetch templates for phase ${phase.name}: ${templatesError.message}`);
          continue;
        }

        for (const template of templates || []) {
          // Check if instance already exists
          const { data: existingInstance } = await supabase
            .from('documents')
            .select('id')
            .eq('product_id', productId)
            .eq('template_source_id', template.id)
            .eq('name', template.name)
            .single();

          if (existingInstance) {
            result.skipped++;
            continue;
          }

          // Create new instance
          const { error: createError } = await supabase
            .from('documents')
            .insert({
              product_id: productId,
              phase_id: phase.id,
              name: template.name,
              document_type: template.document_type,
              status: template.status || 'Not Started',
              document_scope: 'product_document',
              template_source_id: template.id,
              company_id: companyId
            });

          if (createError) {
            result.errors.push(`Failed to create instance for ${template.name}: ${createError.message}`);
          } else {
            result.created++;
          }
        }
      }

      result.success = result.errors.length === 0 || result.created > 0;
      
      if (result.success) {
        toast.success(`Created ${result.created} document instances`);
      }

      return result;

    } catch (error) {
      console.error('[AutoInstance] Unexpected error:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Sync all products for a company with latest templates
   */
  static async syncAllCompanyProducts(companyId: string): Promise<InstanceCreationResult> {
    const result: InstanceCreationResult = {
      success: false,
      created: 0,
      skipped: 0,
      errors: []
    };

    try {
      // Get all active products for company
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) {
        result.errors.push(`Failed to fetch products: ${productsError.message}`);
        return result;
      }

      // Process each product
      for (const product of products || []) {
        const productResult = await this.createDocumentInstances(product.id, companyId);
        
        result.created += productResult.created;
        result.skipped += productResult.skipped;
        result.errors.push(...productResult.errors);
      }

      result.success = result.created > 0 || result.errors.length === 0;
      return result;

    } catch (error) {
      console.error('[AutoInstance] Error syncing all products:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Get sync status for a product
   */
  static async getSyncStatus(productId: string, companyId: string) {
    try {
      // Get company phases - FIXED: Use company_phases
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        throw phasesError;
      }

      // Count total templates vs instances
      let totalTemplates = 0;
      let totalInstances = 0;

      for (const phaseData of companyPhases || []) {
        const phase = phaseData.company_phases;
        
        // Count templates
        const { data: templates } = await supabase
          .from('phase_assigned_documents')
          .select('id')
          .eq('phase_id', phase.id)
          .eq('document_scope', 'company_template');

        totalTemplates += templates?.length || 0;

        // Count instances
        const { data: instances } = await supabase
          .from('documents')
          .select('id')
          .eq('product_id', productId)
          .eq('phase_id', phase.id)
          .eq('document_scope', 'product_document');

        totalInstances += instances?.length || 0;
      }

      return {
        totalTemplates,
        totalInstances,
        syncPercentage: totalTemplates > 0 ? Math.round((totalInstances / totalTemplates) * 100) : 100,
        needsSync: totalInstances < totalTemplates
      };

    } catch (error) {
      console.error('[AutoInstance] Error getting sync status:', error);
      return {
        totalTemplates: 0,
        totalInstances: 0,
        syncPercentage: 0,
        needsSync: false
      };
    }
  }
}
