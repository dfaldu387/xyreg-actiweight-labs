import { supabase } from "@/integrations/supabase/client";

export interface CompanyDocumentTemplate {
  id: string;
  name: string;
  document_type: string;
  tech_applicability: string;
  markets: string[];
  classes_by_market: Record<string, string[]>;
  phases: string[];
  company_id: string;
  created_at: string;
  updated_at: string;
  assignment_status: 'assigned' | 'unassigned';
  // File attachment fields
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  public_url?: string;
  // Enhanced fields from database joins
  phase_name?: string;
  phase_description?: string;
  category_name?: string;
  position?: number;
}

/**
 * Service for managing company document templates
 */
export class DocumentTemplateService {
  /**
   * Fetch ALL company document templates from both company_document_templates and phase_assigned_documents
   */
  static async fetchAllCompanyDocumentTemplates(companyId: string): Promise<CompanyDocumentTemplate[]> {
    try {
      // Fetch standalone templates from company_document_templates
      const { data: standaloneTemplates, error: standaloneError } = await supabase
        .from('company_document_templates')
        .select('*, file_path, file_name, file_size, file_type, public_url')
        .eq('company_id', companyId);

      if (standaloneError) {
        console.error('[DocumentTemplateService] Error fetching standalone templates:', standaloneError);
        throw standaloneError;
      }

      // Fetch phase-assigned templates from phase_assigned_document_template
      const { data: phaseDocuments, error: phaseError } = await supabase
        .from('phase_assigned_document_template')
        .select(`
          *, 
          file_path, 
          file_name, 
          file_size, 
          file_type, 
          public_url
        `)
        .eq('document_scope', 'company_template');

      if (phaseError) {
        console.error('[DocumentTemplateService] Error fetching phase documents:', phaseError);
        throw phaseError;
      }

      // Process standalone templates (unassigned)
      const standaloneTemplateMap = new Map<string, CompanyDocumentTemplate>();
      for (const template of standaloneTemplates || []) {
        const markets = Array.isArray(template.markets) ? template.markets.map(String) : [];
        const classesByMarket = typeof template.classes_by_market === 'object' && template.classes_by_market !== null 
          ? Object.fromEntries(
              Object.entries(template.classes_by_market).map(([key, value]) => [
                key, 
                Array.isArray(value) ? value.map(String) : []
              ])
            ) 
          : {};

        standaloneTemplateMap.set(template.name, {
          id: template.id,
          name: template.name,
          document_type: template.document_type || 'Standard',
          tech_applicability: template.tech_applicability || 'All device types',
          markets,
          classes_by_market: classesByMarket,
          phases: [], // No phases assigned
          company_id: companyId,
          created_at: template.created_at,
          updated_at: template.updated_at,
          assignment_status: 'unassigned',
          // Include file fields
          file_path: template.file_path,
          file_name: template.file_name,
          file_size: template.file_size,
          file_type: template.file_type,
          public_url: template.public_url
        });
      }

      // Process phase-assigned templates (assigned)
      const phaseTemplateMap = new Map<string, CompanyDocumentTemplate>();
      for (const doc of phaseDocuments || []) {
        const phaseName = doc.phases && typeof doc.phases === 'object' && 'name' in doc.phases ? doc.phases.name : undefined;
        
        if (phaseTemplateMap.has(doc.name)) {
          // Add phase to existing template
          const existing = phaseTemplateMap.get(doc.name)!;
          if (phaseName && !existing.phases.includes(phaseName)) {
            existing.phases.push(phaseName);
          }
        } else {
          // Create new template entry
          const markets = Array.isArray(doc.markets) ? doc.markets.map(String) : [];
          const classesByMarket = typeof doc.classes_by_market === 'object' && doc.classes_by_market !== null 
            ? Object.fromEntries(
                Object.entries(doc.classes_by_market).map(([key, value]) => [
                  key, 
                  Array.isArray(value) ? value.map(String) : []
                ])
              ) 
            : {};

          phaseTemplateMap.set(doc.name, {
            id: doc.id,
            name: doc.name,
            document_type: doc.document_type || 'Standard',
            tech_applicability: doc.tech_applicability || 'All device types',
            markets,
            classes_by_market: classesByMarket,
            phases: phaseName ? [phaseName] : [],
            company_id: companyId,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            assignment_status: 'assigned',
            // Include file fields
            file_path: doc.file_path,
            file_name: doc.file_name,
            file_size: doc.file_size,
            file_type: doc.file_type,
            public_url: doc.public_url
          });
        }
      }

      // Fetch global SaaS templates from default_document_templates
      const { data: saasTemplates, error: saasError } = await supabase
        .from('default_document_templates')
        .select('*');

      if (saasError) {
        console.error('[DocumentTemplateService] Error fetching SaaS templates:', saasError);
        // Non-fatal: continue without SaaS templates
      }

      // Process SaaS templates with lowest priority
      const saasTemplateMap = new Map<string, CompanyDocumentTemplate>();
      for (const doc of saasTemplates || []) {
        saasTemplateMap.set(doc.name, {
          id: doc.id,
          name: doc.name,
          document_type: doc.document_type || 'Standard',
          tech_applicability: 'All device types',
          markets: [],
          classes_by_market: {},
          phases: [],
          company_id: companyId,
          created_at: doc.created_at,
          updated_at: doc.updated_at || doc.created_at,
          assignment_status: 'unassigned',
          file_path: doc.file_path,
          file_name: doc.file_name,
          file_size: doc.file_size,
          file_type: doc.file_type,
          public_url: doc.public_url,
          // Tag as SaaS origin
          document_scope: 'saas_template' as any,
        } as any);
      }

      // Combine all maps: SaaS (lowest) → standalone → phase-assigned (highest priority)
      const finalTemplateMap = new Map<string, CompanyDocumentTemplate>();
      
      // Add SaaS templates first (lowest priority)
      for (const [name, template] of saasTemplateMap) {
        finalTemplateMap.set(name, template);
      }

      // Add standalone templates (override SaaS)
      for (const [name, template] of standaloneTemplateMap) {
        finalTemplateMap.set(name, template);
      }
      
      // Add or update with phase-assigned templates (highest priority)
      for (const [name, template] of phaseTemplateMap) {
        if (finalTemplateMap.has(name)) {
          const existing = finalTemplateMap.get(name)!;
          finalTemplateMap.set(name, {
            ...existing,
            ...template,
            phases: template.phases,
            assignment_status: 'assigned'
          });
        } else {
          finalTemplateMap.set(name, template);
        }
      }

      const result = Array.from(finalTemplateMap.values());
      return result;
    } catch (error) {
      console.error('[DocumentTemplateService] Error fetching all templates:', error);
      throw error;
    }
  }

  /**
   * Fetch all company document templates with their phase assignments (LEGACY - maintained for compatibility)
   */
  static async fetchCompanyDocumentTemplates(companyId: string): Promise<CompanyDocumentTemplate[]> {
    return this.fetchAllCompanyDocumentTemplates(companyId);
  }

  /**
   * Create a new company document template
   */
  static async createDocumentTemplate(
    companyId: string,
    templateData: Omit<CompanyDocumentTemplate, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> {
    try {
      // Get phase IDs for the assigned phases
      const { data: phases, error: phaseError } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId)
        .in('name', templateData.phases);

      if (phaseError) throw phaseError;

      const phaseIds = phases?.map(p => p.id) || [];

      if (phaseIds.length === 0 && templateData.phases.length > 0) {
        throw new Error('No valid phases found for template assignment');
      }

      // Create phase_assigned_documents entries one by one to avoid array type issues
      for (const phaseId of phaseIds) {
        const { error: insertError } = await supabase
          .from('phase_assigned_documents')
          .insert({
            phase_id: phaseId,
            name: templateData.name,
            document_type: templateData.document_type,
            tech_applicability: templateData.tech_applicability,
            markets: templateData.markets,
            classes_by_market: templateData.classes_by_market,
            document_scope: 'company_template' as const,
            status: 'Not Started'
          });

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('[DocumentTemplateService] Error creating template:', error);
      return false;
    }
  }

  /**
   * Update a company document template
   */
  static async updateDocumentTemplate(
    companyId: string,
    templateName: string,
    updatedData: Partial<CompanyDocumentTemplate>
  ): Promise<boolean> {
    try {
      // Get current company phases
      const { data: companyPhases, error: companyPhasesError } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId);

      if (companyPhasesError) throw companyPhasesError;

      const companyPhaseIds = companyPhases?.map(p => p.id) || [];

      // Remove existing assignments for this template
      await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', templateName)
        .in('phase_id', companyPhaseIds);

      // If phases are specified, create new assignments
      if (updatedData.phases && updatedData.phases.length > 0) {
        const { data: newPhases, error: newPhasesError } = await supabase
          .from('phases')
          .select('id, name')
          .eq('company_id', companyId)
          .in('name', updatedData.phases);

        if (newPhasesError) throw newPhasesError;

        const newPhaseIds = newPhases?.map(p => p.id) || [];

        if (newPhaseIds.length > 0) {
          for (const phaseId of newPhaseIds) {
            const { error: insertError } = await supabase
              .from('phase_assigned_documents')
              .insert({
                phase_id: phaseId,
                name: templateName,
                document_type: updatedData.document_type || 'Standard',
                tech_applicability: updatedData.tech_applicability || 'All device types',
                markets: updatedData.markets || [],
                classes_by_market: updatedData.classes_by_market || {},
                document_scope: 'company_template' as const,
                status: 'Not Started'
              });

            if (insertError) throw insertError;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[DocumentTemplateService] Error updating template:', error);
      return false;
    }
  }

  /**
   * Delete a company document template
   */
  static async deleteDocumentTemplate(companyId: string, templateName: string): Promise<boolean> {
    try {
      // Get company phase IDs
      const { data: companyPhases, error: companyPhasesError } = await supabase
        .from('phases')
        .select('id')
        .eq('company_id', companyId);

      if (companyPhasesError) throw companyPhasesError;

      const companyPhaseIds = companyPhases?.map(p => p.id) || [];

      // Remove all assignments for this template
      const { error } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', templateName)
        .in('phase_id', companyPhaseIds);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('[DocumentTemplateService] Error deleting template:', error);
      return false;
    }
  }
}

/**
 * Export function for fetching company document templates
 */
export const fetchCompanyDocumentTemplates = DocumentTemplateService.fetchAllCompanyDocumentTemplates;
