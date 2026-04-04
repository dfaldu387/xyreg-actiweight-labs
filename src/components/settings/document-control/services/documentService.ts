import { supabase } from "@/integrations/supabase/client";
import { DatabasePhaseService } from "@/services/databasePhaseService";
import { EnhancedPhaseService } from "@/services/enhancedPhaseService";
import { toast } from "sonner";

export interface DocumentServiceDocument {
  id?: string;
  name: string;
  type: string;
  description?: string;
  phases: string[];
  status?: string;
  techApplicability?: string;
  markets?: string[];
  deviceClasses?: Record<string, string[]>;
}

/**
 * Database-driven document service that replaces static document matrix
 */
export class DocumentService {
  /**
   * Get all documents for a company from database - FIXED to include ALL company template documents
   */
  static async getCompanyDocuments(companyId: string): Promise<DocumentServiceDocument[]> {
    try {
      console.log('[DocumentService] Fetching all company documents for:', companyId);
      
      // Get company phases first
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      const phaseMap = new Map(phasesData.activePhases.map(p => [p.id, p.name]));
      
      console.log('[DocumentService] Found phases:', Array.from(phaseMap.values()));
      
      // Get ALL phase assigned documents for this company (including company_template scope)
      // Filter out excluded documents
      const { data: phaseDocuments, error } = await supabase
        .from('phase_assigned_documents')
        .select(`
          *,
          phases!phase_assigned_documents_phase_id_fkey(id, name, company_id)
        `)
        .eq('phases.company_id', companyId)
        .eq('document_scope', 'company_template') // Only get company template documents
        .neq('is_excluded', true); // Filter out excluded documents

      if (error) {
        console.error('[DocumentService] Error fetching phase documents:', error);
        throw error;
      }

      console.log('[DocumentService] Found phase documents:', phaseDocuments?.length || 0);

      // Also get any company document templates that might not be in phase_assigned_documents
      const { data: templateDocuments, error: templateError } = await supabase
        .from('company_document_templates')
        .select('*')
        .eq('company_id', companyId);

      if (templateError) {
        console.error('[DocumentService] Error fetching template documents:', templateError);
        // Don't throw here, just log and continue with phase documents
      }

      console.log('[DocumentService] Found template documents:', templateDocuments?.length || 0);

      // Group documents by name and collect phases - ENHANCED LOGIC
      const documentMap = new Map<string, DocumentServiceDocument>();

      // Process phase-assigned documents first
      for (const doc of phaseDocuments || []) {
        const phaseName = doc.phases && typeof doc.phases === 'object' && 'name' in doc.phases ? doc.phases.name : undefined;
        
        if (documentMap.has(doc.name)) {
          // Document already exists, add this phase if not already included
          const existing = documentMap.get(doc.name)!;
          if (phaseName && !existing.phases.includes(phaseName)) {
            existing.phases.push(phaseName);
          }
        } else {
          // New document
          documentMap.set(doc.name, {
            id: doc.id,
            name: doc.name,
            type: doc.document_type || 'Standard',
            phases: phaseName ? [phaseName] : [], // Allow empty phases for unassigned documents
            status: doc.status || 'Not Started',
            techApplicability: doc.tech_applicability || 'All device types',
            markets: Array.isArray(doc.markets) ? doc.markets.map(String) : [],
            deviceClasses: typeof doc.classes_by_market === 'object' && doc.classes_by_market !== null 
              ? Object.fromEntries(
                  Object.entries(doc.classes_by_market).map(([key, value]) => [
                    key, 
                    Array.isArray(value) ? value.map(String) : []
                  ])
                ) 
              : {}
          });
        }
      }

      // Process company template documents (these might not have phase assignments yet)
      for (const template of templateDocuments || []) {
        if (!documentMap.has(template.name)) {
          // Add template document that doesn't have phase assignments yet
          documentMap.set(template.name, {
            id: template.id,
            name: template.name,
            type: template.document_type || 'Standard',
            phases: [], // No phases assigned yet
            status: 'Not Started',
            techApplicability: template.tech_applicability || 'All device types',
            markets: Array.isArray(template.markets) ? template.markets.map(String) : [],
            deviceClasses: typeof template.classes_by_market === 'object' && template.classes_by_market !== null 
              ? Object.fromEntries(
                  Object.entries(template.classes_by_market).map(([key, value]) => [
                    key, 
                    Array.isArray(value) ? value.map(String) : []
                  ])
                ) 
              : {}
          });
        }
      }

      const result = Array.from(documentMap.values());
      console.log('[DocumentService] Final document count:', result.length);
      console.log('[DocumentService] Documents by phase assignment:', {
        assigned: result.filter(d => d.phases.length > 0).length,
        unassigned: result.filter(d => d.phases.length === 0).length
      });

      return result;
    } catch (error) {
      console.error('[DocumentService] Error fetching company documents:', error);
      throw error;
    }
  }

  /**
   * Add or update a document in the database
   */
  static async saveDocument(
    companyId: string,
    document: DocumentServiceDocument
  ): Promise<boolean> {
    try {
      // Get phase IDs for the selected phases
      const { data: phases, error: phaseError } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId)
        .in('name', document.phases);

      if (phaseError) throw phaseError;

      const phaseIds = phases?.map(p => p.id) || [];

      if (phaseIds.length === 0) {
        toast.error('No valid phases found for this document');
        return false;
      }

      // Remove existing assignments for this document
      await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', document.name)
        .in('phase_id', phaseIds);

      // Insert new assignments one by one to avoid array type issues
      for (const phaseId of phaseIds) {
        const { error: insertError } = await supabase
          .from('phase_assigned_documents')
          .insert({
            phase_id: phaseId,
            name: document.name,
            document_type: document.type,
            status: document.status || 'Not Started',
            tech_applicability: document.techApplicability || 'All device types',
            markets: document.markets || [],
            classes_by_market: document.deviceClasses || {},
            document_scope: 'company_template' as const
          });

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error saving document:', error);
      return false;
    }
  }

  /**
   * Delete a document from all phases
   */
  static async deleteDocument(companyId: string, documentName: string): Promise<boolean> {
    try {
      // Get company phase IDs
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      const phaseIds = phasesData.activePhases.map(p => p.id);

      // Remove document from all company phases
      const { error } = await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', documentName)
        .in('phase_id', phaseIds);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  /**
   * Get documents for a specific phase
   */
  static async getPhaseDocuments(phaseId: string): Promise<DocumentServiceDocument[]> {
    const documents = await DatabasePhaseService.getPhaseDocuments(phaseId);
    return documents.map(doc => ({
      name: doc.name,
      type: doc.type,
      phases: [],
      status: 'Not Started'
    }));
  }

  /**
   * Update document phases assignment
   */
  static async updateDocumentPhases(
    companyId: string,
    documentName: string,
    newPhases: string[],
    documentProperties?: {
      document_type: string;
      file_path: string;
      file_name: string;
      file_size: number;
      file_type: string;
      public_url: string | null;
    }
  ): Promise<boolean> {
    try {
      // Get phase IDs for the new phases
      const { data: phases, error: phaseError } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId)
        .in('name', newPhases);

      if (phaseError) throw phaseError;

      // Remove all existing assignments for this document in this company
      const companyPhases = await DatabasePhaseService.getPhases(companyId);
      const companyPhaseIds = companyPhases.activePhases.map(p => p.id);
      
      await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', documentName)
        .in('phase_id', companyPhaseIds);

      // Insert new assignments one by one
      if (phases && phases.length > 0) {
        // Use passed document properties or fallback to defaults
        const docProps = documentProperties || {
          document_type: 'Standard',
          file_path: '',
          file_name: '',
          file_size: 0,
          file_type: '',
          public_url: null
        };
        
        console.log('[DocumentControlService] Using document properties:', docProps);
        
        for (const phase of phases) {
          const { error: insertError } = await supabase
            .from('phase_assigned_documents')
            .insert({
              phase_id: phase.id,
              name: documentName,
              document_type: docProps.document_type,
              file_path: docProps.file_path,
              file_name: docProps.file_name,
              file_size: docProps.file_size,
              file_type: docProps.file_type,
              public_url: docProps.public_url,
              status: 'Not Started',
              document_scope: 'company_template' as const
            });

          if (insertError) throw insertError;
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating document phases:', error);
      return false;
    }
  }

  /**
   * Sync company documents with standard template
   */
  static async syncWithStandardTemplate(companyId: string): Promise<boolean> {
    try {
      await DatabasePhaseService.ensureStandardizedPhases(companyId);
      return true;
    } catch (error) {
      console.error('Error syncing with standard template:', error);
      return false;
    }
  }

  /**
   * Fetch company documents (alias for getCompanyDocuments)
   */
  static async fetchCompanyDocuments(companyId: string): Promise<DocumentServiceDocument[]> {
    return this.getCompanyDocuments(companyId);
  }
}

/**
 * Export the fetchCompanyDocuments function for compatibility
 */
export const fetchCompanyDocuments = DocumentService.fetchCompanyDocuments;
