import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TemplateInstantiationResult {
  success: boolean;
  created: number;
  existing: number;
  errors: string[];
  details?: any[];
}

/**
 * Service for instantiating company template documents into product-specific documents
 */
export class ProductDocumentInstantiationService {
  private productId: string;
  private companyId: string;

  constructor(productId: string, companyId: string) {
    this.productId = productId;
    this.companyId = companyId;
  }

  /**
   * Instantiate all phase template documents for this product
   */
  async instantiateAllTemplates(): Promise<TemplateInstantiationResult> {
    try {
      console.log(`[InstantiationService] Starting template instantiation for product ${this.productId}`);

      // First, get all company phases
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          phase_id,
          company_phases!inner(
            id,
            name,
            description
          )
        `)
        .eq('company_id', this.companyId)
        .order('position');

      if (phasesError) {
        console.error('[InstantiationService] Error fetching company phases:', phasesError);
        return { success: false, created: 0, existing: 0, errors: [phasesError.message] };
      }

      if (!companyPhases || companyPhases.length === 0) {
        console.warn('[InstantiationService] No company phases found');
        return { success: true, created: 0, existing: 0, errors: [], details: ['No phases configured for company'] };
      }

      let totalCreated = 0;
      let totalExisting = 0;
      const errors: string[] = [];
      const details: any[] = [];

      // For each phase, get templates and instantiate them
      for (const phaseData of companyPhases) {
        const phaseId = phaseData.phase_id;
        const phaseName = phaseData.company_phases.name;

        console.log(`[InstantiationService] Processing phase: ${phaseName} (${phaseId})`);

        // Get phase assigned document templates
        const { data: templates, error: templatesError } = await supabase
          .from('phase_assigned_document_template')
          .select('*')
          .eq('phase_id', phaseId);

        if (templatesError) {
          console.error(`[InstantiationService] Error fetching templates for phase ${phaseName}:`, templatesError);
          errors.push(`Failed to fetch templates for phase ${phaseName}: ${templatesError.message}`);
          continue;
        }

        if (!templates || templates.length === 0) {
          console.log(`[InstantiationService] No templates found for phase ${phaseName}`);
          details.push({ phase: phaseName, templates: 0, created: 0, existing: 0 });
          continue;
        }

        // Ensure lifecycle phase exists for this product
        const lifecyclePhaseId = await this.ensureLifecyclePhaseExists(phaseId, phaseName);
        if (!lifecyclePhaseId) {
          errors.push(`Failed to create lifecycle phase for ${phaseName}`);
          continue;
        }

        let phaseCreated = 0;
        let phaseExisting = 0;

        // Instantiate each template
        for (const template of templates) {
          const result = await this.instantiateTemplate(template, lifecyclePhaseId, phaseName);
          if (result.created) {
            phaseCreated++;
            totalCreated++;
          } else if (result.existing) {
            phaseExisting++;
            totalExisting++;
          } else if (result.error) {
            errors.push(`${phaseName}: ${result.error}`);
          }
        }

        details.push({
          phase: phaseName,
          templates: templates.length,
          created: phaseCreated,
          existing: phaseExisting
        });

        console.log(`[InstantiationService] Phase ${phaseName}: ${phaseCreated} created, ${phaseExisting} existing`);
      }

      console.log(`[InstantiationService] Instantiation complete: ${totalCreated} created, ${totalExisting} existing`);

      if (totalCreated > 0) {
        toast.success(`Created ${totalCreated} document instances from templates`);
      } else if (totalExisting > 0) {
        toast.info(`All ${totalExisting} document instances already exist`);
      }

      return {
        success: errors.length === 0,
        created: totalCreated,
        existing: totalExisting,
        errors,
        details
      };

    } catch (error) {
      console.error('[InstantiationService] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, created: 0, existing: 0, errors: [errorMessage] };
    }
  }

  /**
   * Instantiate templates for a specific phase
   */
  async instantiatePhaseTemplates(phaseId: string, phaseName: string): Promise<TemplateInstantiationResult> {
    try {
      console.log(`[InstantiationService] Instantiating templates for phase: ${phaseName}`);

      // Get phase assigned document templates
      const { data: templates, error: templatesError } = await supabase
        .from('phase_assigned_document_template')
        .select('*')
        .eq('phase_id', phaseId);

      if (templatesError) {
        return { success: false, created: 0, existing: 0, errors: [templatesError.message] };
      }

      if (!templates || templates.length === 0) {
        return { success: true, created: 0, existing: 0, errors: [], details: ['No templates found for phase'] };
      }

      // Ensure lifecycle phase exists
      const lifecyclePhaseId = await this.ensureLifecyclePhaseExists(phaseId, phaseName);
      if (!lifecyclePhaseId) {
        return { success: false, created: 0, existing: 0, errors: ['Failed to create lifecycle phase'] };
      }

      let created = 0;
      let existing = 0;
      const errors: string[] = [];

      // Instantiate each template
      for (const template of templates) {
        const result = await this.instantiateTemplate(template, lifecyclePhaseId, phaseName);
        if (result.created) {
          created++;
        } else if (result.existing) {
          existing++;
        } else if (result.error) {
          errors.push(result.error);
        }
      }

      return { success: errors.length === 0, created, existing, errors };

    } catch (error) {
      console.error('[InstantiationService] Error instantiating phase templates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, created: 0, existing: 0, errors: [errorMessage] };
    }
  }

  /**
   * Instantiate a single template as a product document
   */
  private async instantiateTemplate(template: any, lifecyclePhaseId: string, phaseName: string): Promise<{
    created?: boolean;
    existing?: boolean;
    error?: string;
  }> {
    try {
      // Check if document instance already exists
      const { data: existingDoc, error: checkError } = await supabase
        .from('documents')
        .select('id')
        .eq('product_id', this.productId)
        .eq('name', template.name)
        .eq('document_scope', 'product_document')
        .maybeSingle();

      if (checkError) {
        console.error('[InstantiationService] Error checking existing document:', checkError);
        return { error: `Check failed for ${template.name}: ${checkError.message}` };
      }

      if (existingDoc) {
        console.log(`[InstantiationService] Document instance already exists: ${template.name}`);
        return { existing: true };
      }

      // Create new product document instance
      const newDocument = {
        name: template.name,
        description: template.description || `Product instance of ${template.name}`,
        document_type: template.document_type || 'Standard',
        status: 'Not Started',
        product_id: this.productId,
        company_id: this.companyId,
        phase_id: lifecyclePhaseId,
        document_scope: 'product_document' as const,
        tech_applicability: template.tech_applicability || 'All device types',
        template_source_id: template.id,
        position: template.position || 0,
        sub_section: template.sub_section || null,
        section_ids: template.section_ids || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(newDocument as any)
        .select()
        .single();

      if (error) {
        console.error('[InstantiationService] Error creating document instance:', error);
        return { error: `Failed to create ${template.name}: ${error.message}` };
      }

      console.log(`[InstantiationService] Created document instance: ${template.name} (${data.id})`);
      return { created: true };

    } catch (error) {
      console.error('[InstantiationService] Unexpected error instantiating template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { error: `Failed to instantiate ${template.name}: ${errorMessage}` };
    }
  }

  /**
   * Ensure a lifecycle phase exists for the product and return its ID
   */
  private async ensureLifecyclePhaseExists(phaseId: string, phaseName: string): Promise<string | null> {
    try {
      // Check if lifecycle phase already exists
      const { data: existingPhase, error: checkError } = await supabase
        .from('lifecycle_phases')
        .select('id')
        .eq('product_id', this.productId)
        .eq('phase_id', phaseId)
        .maybeSingle();

      if (checkError) {
        console.error('[InstantiationService] Error checking lifecycle phase:', checkError);
        return null;
      }

      if (existingPhase) {
        return existingPhase.id;
      }

      // Create new lifecycle phase
      const { data: newPhase, error: createError } = await supabase
        .from('lifecycle_phases')
        .insert({
          product_id: this.productId,
          phase_id: phaseId,
          name: phaseName,
          is_current_phase: false, // Don't automatically set as current
          status: 'Not Started',
          progress: 0
        })
        .select('id')
        .single();

      if (createError || !newPhase) {
        console.error('[InstantiationService] Error creating lifecycle phase:', createError);
        return null;
      }

      console.log(`[InstantiationService] Created lifecycle phase: ${phaseName} (${newPhase.id})`);
      return newPhase.id;

    } catch (error) {
      console.error('[InstantiationService] Unexpected error ensuring lifecycle phase:', error);
      return null;
    }
  }

  /**
   * Get instantiation status summary
   */
  async getInstantiationStatus(): Promise<{
    templateCount: number;
    instanceCount: number;
    missingCount: number;
    phases: Array<{ name: string; templates: number; instances: number; missing: number }>;
  }> {
    try {
      // Get company phases and their templates
      const { data: companyPhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          phase_id,
          company_phases!inner(name)
        `)
        .eq('company_id', this.companyId);

      if (phasesError || !companyPhases) {
        return { templateCount: 0, instanceCount: 0, missingCount: 0, phases: [] };
      }

      let totalTemplates = 0;
      let totalInstances = 0;
      const phaseStatus = [];

      for (const phase of companyPhases) {
        // Count templates for this phase
        const { count: templateCount } = await supabase
          .from('phase_assigned_document_template')
          .select('*', { count: 'exact', head: true })
          .eq('phase_id', phase.phase_id);

        // Count existing instances for this phase
        const { count: instanceCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', this.productId)
          .eq('document_scope', 'product_document')
          .in('phase_id', [
            // Get lifecycle phase IDs for this product and phase
            await supabase
              .from('lifecycle_phases')
              .select('id')
              .eq('product_id', this.productId)
              .eq('phase_id', phase.phase_id)
              .then(({ data }) => data?.map(lp => lp.id) || [])
          ].flat());

        const templates = templateCount || 0;
        const instances = instanceCount || 0;
        const missing = Math.max(0, templates - instances);

        totalTemplates += templates;
        totalInstances += instances;

        phaseStatus.push({
          name: phase.company_phases.name,
          templates,
          instances,
          missing
        });
      }

      return {
        templateCount: totalTemplates,
        instanceCount: totalInstances,
        missingCount: totalTemplates - totalInstances,
        phases: phaseStatus
      };

    } catch (error) {
      console.error('[InstantiationService] Error getting instantiation status:', error);
      return { templateCount: 0, instanceCount: 0, missingCount: 0, phases: [] };
    }
  }
}