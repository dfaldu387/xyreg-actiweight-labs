import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompanyPhase {
  id: string;
  company_id: string;
  category_id?: string;
  name: string;
  description?: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhaseDocumentTemplate {
  id: string;
  company_phase_id: string;
  name: string;
  document_type: string;
  status: string;
  tech_applicability: string;
  markets: string[];
  classes_by_market: Record<string, string[]>;
  document_scope: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyPhaseCategory {
  id: string;
  company_id: string;
  name: string;
  position: number;
  created_at: string;
}

/**
 * Refactored Phase Service using the new simplified schema
 */
export class RefactoredPhaseService {
  /**
   * Get all active phases for a company
   */
  static async getCompanyPhases(companyId: string): Promise<CompanyPhase[]> {
    try {
      // console.log('[RefactoredPhaseService] Loading phases for company:', companyId);

      const { data, error } = await supabase
        .from('company_phases')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('position');

      if (error) {
        console.error('[RefactoredPhaseService] Error loading phases:', error);
        throw error;
      }

      // console.log(`[RefactoredPhaseService] Loaded ${data?.length || 0} phases`);
      return data || [];
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in getCompanyPhases:', error);
      toast.error('Failed to load company phases');
      return [];
    }
  }

  /**
   * Get phase document templates for a specific phase
   */
  static async getPhaseDocuments(companyPhaseId: string): Promise<PhaseDocumentTemplate[]> {
    try {
      // console.log('[RefactoredPhaseService] Loading documents for phase:', companyPhaseId);

      const { data, error } = await supabase
        .from('phase_document_templates')
        .select('*')
        .eq('company_phase_id', companyPhaseId)
        .order('name');

      if (error) {
        console.error('[RefactoredPhaseService] Error loading phase documents:', error);
        throw error;
      }

      // Transform data to match our interface
      const transformedData = (data || []).map(doc => ({
        id: doc.id,
        company_phase_id: doc.company_phase_id,
        name: doc.name,
        document_type: doc.document_type || 'Standard',
        status: doc.status || 'Not Started',
        tech_applicability: doc.tech_applicability || 'All device types',
        markets: Array.isArray(doc.markets) ? doc.markets as string[] : [],
        classes_by_market: (doc.classes_by_market as Record<string, string[]>) || {},
        document_scope: doc.document_scope || 'company_template',
        deadline: doc.deadline || undefined,
        created_at: doc.created_at || new Date().toISOString(),
        updated_at: doc.updated_at || new Date().toISOString()
      }));

      // console.log(`[RefactoredPhaseService] Loaded ${transformedData.length} documents`);
      return transformedData;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in getPhaseDocuments:', error);
      toast.error('Failed to load phase documents');
      return [];
    }
  }

  /**
   * Get all documents for a company across all phases
   */
  static async getAllCompanyDocuments(companyId: string): Promise<(PhaseDocumentTemplate & { phase_name: string })[]> {
    try {
      // console.log('[RefactoredPhaseService] Loading all documents for company:', companyId);

      const { data, error } = await supabase
        .from('phase_document_templates')
        .select(`
          *,
          company_phases!inner(name, company_id)
        `)
        .eq('company_phases.company_id', companyId)
        .order('company_phases.position');

      if (error) {
        console.error('[RefactoredPhaseService] Error loading company documents:', error);
        throw error;
      }

      // Transform data to match our interface
      const documents = (data || []).map(doc => ({
        id: doc.id,
        company_phase_id: doc.company_phase_id,
        name: doc.name,
        document_type: doc.document_type || 'Standard',
        status: doc.status || 'Not Started',
        tech_applicability: doc.tech_applicability || 'All device types',
        markets: Array.isArray(doc.markets) ? doc.markets as string[] : [],
        classes_by_market: (doc.classes_by_market as Record<string, string[]>) || {},
        document_scope: doc.document_scope || 'company_template',
        deadline: doc.deadline || undefined,
        created_at: doc.created_at || new Date().toISOString(),
        updated_at: doc.updated_at || new Date().toISOString(),
        phase_name: (doc.company_phases as any).name
      }));

      // console.log(`[RefactoredPhaseService] Loaded ${documents.length} total documents`);
      return documents;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in getAllCompanyDocuments:', error);
      toast.error('Failed to load company documents');
      return [];
    }
  }

  /**
   * Create a new phase for a company
   */
  static async createPhase(
    companyId: string,
    name: string,
    description?: string,
    categoryId?: string
  ): Promise<CompanyPhase | null> {
    try {
      // console.log('[RefactoredPhaseService] Creating phase:', { companyId, name });

      // Get the next position
      const { data: maxPositionData, error: posError } = await supabase
        .from('company_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      if (posError) {
        throw posError;
      }

      const nextPosition = (maxPositionData?.[0]?.position || -1) + 1;

      const { data, error } = await supabase
        .from('company_phases')
        .insert({
          company_id: companyId,
          name,
          description,
          category_id: categoryId,
          position: nextPosition,
          duration_days: 30, // Default duration
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('[RefactoredPhaseService] Error creating phase:', error);
        throw error;
      }

      // console.log('[RefactoredPhaseService] Successfully created phase:', data.id);
      toast.success(`Phase "${name}" created successfully`);
      return data;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in createPhase:', error);
      toast.error('Failed to create phase');
      return null;
    }
  }

  /**
   * Update a phase
   */
  static async updatePhase(
    phaseId: string,
    updates: { name?: string; description?: string; category_id?: string | null; position?: number }
  ): Promise<boolean> {
    try {
      // console.log('[RefactoredPhaseService] Updating phase:', { phaseId, updates });

      const { error } = await supabase
        .from('company_phases')
        .update(updates)
        .eq('id', phaseId);

      if (error) {
        console.error('[RefactoredPhaseService] Error updating phase:', error);
        throw error;
      }

      // console.log('[RefactoredPhaseService] Successfully updated phase');
      toast.success('Phase updated successfully');
      return true;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in updatePhase:', error);
      toast.error('Failed to update phase');
      return false;
    }
  }

  /**
   * Delete a phase
   */
  static async deletePhase(phaseId: string): Promise<boolean> {
    try {
      // console.log('[RefactoredPhaseService] Deleting phase:', phaseId);

      // First delete associated document templates
      const { error: deleteDocsError } = await supabase
        .from('phase_document_templates')
        .delete()
        .eq('company_phase_id', phaseId);

      if (deleteDocsError) {
        throw deleteDocsError;
      }

      // Then delete the phase
      const { error } = await supabase
        .from('company_phases')
        .delete()
        .eq('id', phaseId);

      if (error) {
        console.error('[RefactoredPhaseService] Error deleting phase:', error);
        throw error;
      }

      // console.log('[RefactoredPhaseService] Successfully deleted phase');
      toast.success('Phase deleted successfully');
      return true;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in deletePhase:', error);
      toast.error('Failed to delete phase');
      return false;
    }
  }

  /**
   * Update phase order by reordering positions
   */
  static async reorderPhases(companyId: string, phaseIds: string[]): Promise<boolean> {
    try {
      // console.log('[RefactoredPhaseService] Reordering phases for company:', companyId);

      // Update positions in batch
      for (let i = 0; i < phaseIds.length; i++) {
        const { error } = await supabase
          .from('company_phases')
          .update({ position: i })
          .eq('id', phaseIds[i])
          .eq('company_id', companyId);

        if (error) {
          console.error('[RefactoredPhaseService] Error updating phase position:', error);
          throw error;
        }
      }

      // console.log('[RefactoredPhaseService] Successfully reordered phases');
      toast.success('Phase order updated successfully');
      return true;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in reorderPhases:', error);
      toast.error('Failed to reorder phases');
      return false;
    }
  }

  /**
   * Add document template to a phase
   */
  static async addDocumentToPhase(
    companyPhaseId: string,
    documentData: Partial<PhaseDocumentTemplate>
  ): Promise<PhaseDocumentTemplate | null> {
    try {
      // console.log('[RefactoredPhaseService] Adding document to phase:', companyPhaseId);

      // Ensure document_scope is a valid enum value with proper type checking
      let validDocumentScope: 'company_template' | 'company_document' | 'product_document' = 'company_template';
      
      if (documentData.document_scope) {
        if (documentData.document_scope === 'company_template' || 
            documentData.document_scope === 'company_document' || 
            documentData.document_scope === 'product_document') {
          validDocumentScope = documentData.document_scope;
        }
      }

      const { data, error } = await supabase
        .from('phase_document_templates')
        .insert({
          company_phase_id: companyPhaseId,
          name: documentData.name || 'New Document',
          document_type: documentData.document_type || 'Standard',
          status: documentData.status || 'Not Started',
          tech_applicability: documentData.tech_applicability || 'All device types',
          markets: documentData.markets || [],
          classes_by_market: documentData.classes_by_market || {},
          document_scope: validDocumentScope,
          deadline: documentData.deadline
        })
        .select()
        .single();

      if (error) {
        console.error('[RefactoredPhaseService] Error adding document:', error);
        throw error;
      }

      // Transform the returned data
      const transformedData = {
        id: data.id,
        company_phase_id: data.company_phase_id,
        name: data.name,
        document_type: data.document_type || 'Standard',
        status: data.status || 'Not Started',
        tech_applicability: data.tech_applicability || 'All device types',
        markets: Array.isArray(data.markets) ? data.markets as string[] : [],
        classes_by_market: (data.classes_by_market as Record<string, string[]>) || {},
        document_scope: data.document_scope || 'company_template',
        deadline: data.deadline || undefined,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

      // console.log('[RefactoredPhaseService] Successfully added document:', transformedData.id);
      toast.success('Document added successfully');
      return transformedData;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in addDocumentToPhase:', error);
      toast.error('Failed to add document');
      return null;
    }
  }

  /**
   * Update document template
   */
  static async updateDocumentTemplate(
    documentId: string,
    updates: Partial<PhaseDocumentTemplate>
  ): Promise<boolean> {
    try {
      // console.log('[RefactoredPhaseService] Updating document template:', { documentId, updates });

      // Create a clean updates object with only database fields
      const cleanUpdates: any = {};
      
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.document_type !== undefined) cleanUpdates.document_type = updates.document_type;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.tech_applicability !== undefined) cleanUpdates.tech_applicability = updates.tech_applicability;
      if (updates.markets !== undefined) cleanUpdates.markets = updates.markets;
      if (updates.classes_by_market !== undefined) cleanUpdates.classes_by_market = updates.classes_by_market;
      if (updates.deadline !== undefined) cleanUpdates.deadline = updates.deadline;
      
      // Handle document_scope with type validation
      if (updates.document_scope !== undefined) {
        if (updates.document_scope === 'company_template' || 
            updates.document_scope === 'company_document' || 
            updates.document_scope === 'product_document') {
          cleanUpdates.document_scope = updates.document_scope;
        }
      }

      const { error } = await supabase
        .from('phase_document_templates')
        .update(cleanUpdates)
        .eq('id', documentId);

      if (error) {
        console.error('[RefactoredPhaseService] Error updating document template:', error);
        throw error;
      }

      // console.log('[RefactoredPhaseService] Successfully updated document template');
      toast.success('Document template updated successfully');
      return true;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in updateDocumentTemplate:', error);
      toast.error('Failed to update document template');
      return false;
    }
  }

  /**
   * Delete document template
   */
  static async deleteDocumentTemplate(documentId: string): Promise<boolean> {
    try {
      // console.log('[RefactoredPhaseService] Deleting document template:', documentId);

      const { error } = await supabase
        .from('phase_document_templates')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('[RefactoredPhaseService] Error deleting document template:', error);
        throw error;
      }

      // console.log('[RefactoredPhaseService] Successfully deleted document template');
      toast.success('Document template deleted successfully');
      return true;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in deleteDocumentTemplate:', error);
      toast.error('Failed to delete document template');
      return false;
    }
  }

  /**
   * Update document status
   */
  static async updateDocumentStatus(
    documentId: string,
    status: string
  ): Promise<boolean> {
    try {
      // console.log('[RefactoredPhaseService] Updating document status:', { documentId, status });

      const { error } = await supabase
        .from('phase_document_templates')
        .update({ status })
        .eq('id', documentId);

      if (error) {
        console.error('[RefactoredPhaseService] Error updating document status:', error);
        throw error;
      }

      // console.log('[RefactoredPhaseService] Successfully updated document status');
      toast.success('Document status updated');
      return true;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in updateDocumentStatus:', error);
      toast.error('Failed to update document status');
      return false;
    }
  }

  /**
   * Get company phase categories
   */
  static async getCompanyCategories(companyId: string): Promise<CompanyPhaseCategory[]> {
    try {
      // console.log('[RefactoredPhaseService] Loading categories for company:', companyId);

      const { data, error } = await supabase
        .from('phase_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        console.error('[RefactoredPhaseService] Error loading categories:', error);
        throw error;
      }

      // console.log(`[RefactoredPhaseService] Loaded ${data?.length || 0} categories`);
      return data || [];
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in getCompanyCategories:', error);
      toast.error('Failed to load categories');
      return [];
    }
  }

  /**
   * Get phase statistics for a company
   */
  static async getPhaseStatistics(companyId: string): Promise<{
    totalPhases: number;
    activePhases: number;
    totalDocuments: number;
    completedDocuments: number;
  }> {
    try {
      // console.log('[RefactoredPhaseService] Getting statistics for company:', companyId);

      // Get phase count
      const { data: phases, error: phasesError } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId);

      if (phasesError) throw phasesError;

      // Get active phase count
      const { data: activePhases, error: activePhasesError } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (activePhasesError) throw activePhasesError;

      // Get document statistics
      const { data: documents, error: documentsError } = await supabase
        .from('phase_document_templates')
        .select(`
          id,
          status,
          company_phases!inner(company_id)
        `)
        .eq('company_phases.company_id', companyId);

      if (documentsError) throw documentsError;

      const completedDocuments = documents?.filter(doc => doc.status === 'Completed').length || 0;

      const stats = {
        totalPhases: phases?.length || 0,
        activePhases: activePhases?.length || 0,
        totalDocuments: documents?.length || 0,
        completedDocuments
      };

      // console.log('[RefactoredPhaseService] Statistics:', stats);
      return stats;
    } catch (error) {
      console.error('[RefactoredPhaseService] Error in getPhaseStatistics:', error);
      return {
        totalPhases: 0,
        activePhases: 0,
        totalDocuments: 0,
        completedDocuments: 0
      };
    }
  }
}
