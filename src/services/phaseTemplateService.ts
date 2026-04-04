
import { supabase } from '@/integrations/supabase/client';

export interface PhaseTemplate {
  id: string;
  name: string;
  description?: string;
  position: number;
  documents: any[];
  document_type?: string;
  phase_name?: string;
  status?: string;
  is_assigned?: boolean;
}

export interface PhaseTemplateAnalysis {
  totalTemplates: number;
  assignedTemplates: number;
  unassignedTemplates: number;
  duplicateGroups: number;
  orphanedTemplates: number;
}

export class PhaseTemplateService {
  static async getPhaseTemplates(companyId: string): Promise<PhaseTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name, description)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (error) throw error;

      // For each phase, get its template documents
      const templates: PhaseTemplate[] = [];
      
      for (const cp of data || []) {
        const { data: docs, error: docsError } = await supabase
          .from('phase_assigned_documents')
          .select('*')
          .eq('phase_id', cp.company_phases.id);

        if (docsError) {
          console.error('Error fetching documents for phase:', docsError);
          continue;
        }

        templates.push({
          id: cp.company_phases.id,
          name: cp.company_phases.name,
          description: cp.company_phases.description,
          position: cp.position,
          documents: docs || [],
          document_type: 'Standard',
          phase_name: cp.company_phases.name,
          status: 'Active',
          is_assigned: (docs || []).length > 0
        });
      }

      return templates;
    } catch (error) {
      console.error('Error fetching phase templates:', error);
      throw error;
    }
  }

  static async getCompanyPhaseTemplates(companyId: string): Promise<PhaseTemplate[]> {
    return this.getPhaseTemplates(companyId);
  }

  static async analyzePhaseTemplates(companyId: string): Promise<PhaseTemplateAnalysis> {
    try {
      const templates = await this.getPhaseTemplates(companyId);
      const assignedTemplates = templates.filter(t => t.documents.length > 0).length;
      
      return {
        totalTemplates: templates.length,
        assignedTemplates,
        unassignedTemplates: templates.length - assignedTemplates,
        duplicateGroups: 0,
        orphanedTemplates: 0
      };
    } catch (error) {
      console.error('Error analyzing phase templates:', error);
      return {
        totalTemplates: 0,
        assignedTemplates: 0,
        unassignedTemplates: 0,
        duplicateGroups: 0,
        orphanedTemplates: 0
      };
    }
  }

  static async addPhaseTemplate(companyId: string, templateData: {
    name: string;
    document_type: string;
    tech_applicability?: string;
    markets?: string[];
    classes_by_market?: Record<string, string[]>;
    phase_id?: string;
  }): Promise<PhaseTemplate> {
    try {
      if (templateData.phase_id) {
        const { error } = await supabase
          .from('phase_assigned_documents')
          .insert({
            phase_id: templateData.phase_id,
            name: templateData.name,
            document_type: templateData.document_type,
            tech_applicability: templateData.tech_applicability || 'All device types',
            markets: templateData.markets || [],
            classes_by_market: templateData.classes_by_market || {},
            status: 'Not Started',
            document_scope: 'company_template'
          });

        if (error) throw error;
      }

      return {
        id: crypto.randomUUID(),
        name: templateData.name,
        description: templateData.tech_applicability,
        position: 0,
        documents: [],
        document_type: templateData.document_type,
        phase_name: '',
        status: 'Not Started',
        is_assigned: false
      };
    } catch (error) {
      console.error('Error adding phase template:', error);
      throw error;
    }
  }

  static async updateTemplatePhaseAssignment(templateId: string, newPhaseId: string | null): Promise<void> {
    try {
      if (newPhaseId) {
        const { error } = await supabase
          .from('phase_assigned_documents')
          .update({ phase_id: newPhaseId })
          .eq('id', templateId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('phase_assigned_documents')
          .delete()
          .eq('id', templateId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating template assignment:', error);
      throw error;
    }
  }

  static async deletePhaseTemplate(templateId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting phase template:', error);
      throw error;
    }
  }

  static async cleanupPhaseTemplates(companyId: string): Promise<{ duplicatesRemoved: number; assignmentsFixed: number }> {
    // Placeholder implementation
    return { duplicatesRemoved: 0, assignmentsFixed: 0 };
  }

  static async syncTemplateToProduct(templateId: string, productId: string): Promise<void> {
    try {
      // Get template documents
      const { data: templateDocs, error: templateError } = await supabase
        .from('phase_assigned_documents')
        .select('*')
        .eq('phase_id', templateId);

      if (templateError) throw templateError;

      // Create product documents based on templates
      const productDocs = (templateDocs || []).map(doc => ({
        name: doc.name,
        document_type: doc.document_type,
        status: 'Not Started',
        product_id: productId,
        phase_id: templateId,
        template_source_id: doc.id
      }));

      if (productDocs.length > 0) {
        const { error: insertError } = await supabase
          .from('documents')
          .insert(productDocs);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error syncing template to product:', error);
      throw error;
    }
  }
}

export async function getPhaseTemplates(companyId: string): Promise<PhaseTemplate[]> {
  return PhaseTemplateService.getPhaseTemplates(companyId);
}

export async function syncTemplateToProduct(templateId: string, productId: string): Promise<void> {
  return PhaseTemplateService.syncTemplateToProduct(templateId, productId);
}
