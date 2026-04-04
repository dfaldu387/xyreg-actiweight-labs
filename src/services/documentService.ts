
import { supabase } from "@/integrations/supabase/client";
import { DatabasePhaseService } from "./databasePhaseService";
import { EnhancedPhaseService } from "./enhancedPhaseService";

export interface DocumentWithPhases {
  id?: string;
  name: string;
  type: string;
  description?: string;
  phases: string[];
  status?: string;
  techApplicability?: string;
  markets?: string[];
  classes?: string[];
}

/**
 * Database-driven document service - replaces static documentMatrix dependencies
 */
export class DocumentService {
  /**
   * Get all documents with their phase assignments from database
   */
  static async getDocumentsWithPhases(companyId: string): Promise<DocumentWithPhases[]> {
    try {
      // Get company phases
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      const phaseMap = new Map(phasesData.activePhases.map(p => [p.id, p.name]));

      // Get phase assigned documents
      const { data: phaseDocuments, error } = await supabase
        .from('phase_assigned_documents')
        .select(`
          *,
          phases!phase_assigned_documents_phase_id_fkey(id, name, company_id)
        `)
        .eq('phases.company_id', companyId);

      if (error) throw error;

      // Group documents by name
      const documentMap = new Map<string, DocumentWithPhases>();

      for (const doc of phaseDocuments || []) {
        const phaseName = doc.phases && typeof doc.phases === 'object' && 'name' in doc.phases ? doc.phases.name : undefined;
        
        if (phaseName && documentMap.has(doc.name)) {
          const existing = documentMap.get(doc.name)!;
          if (!existing.phases.includes(phaseName)) {
            existing.phases.push(phaseName);
          }
        } else if (phaseName) {
          documentMap.set(doc.name, {
            id: doc.id,
            name: doc.name,
            type: doc.document_type || 'Standard',
            phases: [phaseName],
            status: doc.status || 'Not Started',
            techApplicability: doc.tech_applicability || 'All device types',
            markets: Array.isArray(doc.markets) ? doc.markets.map(String) : [],
            classes: Array.isArray(doc.classes) ? doc.classes.map(String) : []
          });
        }
      }

      return Array.from(documentMap.values());
    } catch (error) {
      console.error('Error getting documents with phases:', error);
      throw error;
    }
  }

  /**
   * Get documents for a specific phase
   */
  static async getDocumentsForPhase(phaseId: string): Promise<DocumentWithPhases[]> {
    try {
      const documents = await DatabasePhaseService.getPhaseDocuments(phaseId);
      return documents.map(doc => ({
        name: doc.name,
        type: doc.type,
        phases: [], // Will be populated by caller if needed
        status: 'Not Started'
      }));
    } catch (error) {
      console.error('Error getting documents for phase:', error);
      throw error;
    }
  }

  /**
   * Get recommended documents from enhanced phase service
   */
  static async getRecommendedDocuments(companyId: string, phaseName?: string): Promise<DocumentWithPhases[]> {
    try {
      const phases = await EnhancedPhaseService.getCompanyPhases(companyId);
      
      if (phaseName) {
        const phase = phases.find(p => p.name === phaseName);
        if (phase) {
          return phase.recommended_docs.map(doc => ({
            name: doc.name,
            type: doc.type,
            phases: [phaseName],
            status: 'Not Started'
          }));
        }
      }

      // Return all recommended documents across all phases
      const allDocs = new Map<string, DocumentWithPhases>();
      
      for (const phase of phases) {
        for (const doc of phase.recommended_docs) {
          if (allDocs.has(doc.name)) {
            const existing = allDocs.get(doc.name)!;
            if (!existing.phases.includes(phase.name)) {
              existing.phases.push(phase.name);
            }
          } else {
            allDocs.set(doc.name, {
              name: doc.name,
              type: doc.type,
              phases: [phase.name],
              status: 'Not Started'
            });
          }
        }
      }

      return Array.from(allDocs.values());
    } catch (error) {
      console.error('Error getting recommended documents:', error);
      throw error;
    }
  }

  /**
   * Update document phase assignments
   */
  static async updateDocumentPhases(
    companyId: string,
    documentName: string,
    phases: string[],
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
      // Get phase IDs
      const { data: phaseData, error: phaseError } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId)
        .in('name', phases);

      if (phaseError) throw phaseError;

      // Remove existing assignments
      const allCompanyPhases = await DatabasePhaseService.getPhases(companyId);
      const allPhaseIds = allCompanyPhases.activePhases.map(p => p.id);
      
      await supabase
        .from('phase_assigned_documents')
        .delete()
        .eq('name', documentName)
        .in('phase_id', allPhaseIds);

      // Add new assignments
      if (phaseData && phaseData.length > 0) {
        // Use passed document properties or fallback to defaults
        const docProps = documentProperties || {
          document_type: 'Standard',
          file_path: '',
          file_name: '',
          file_size: 0,
          file_type: '',
          public_url: null
        };
        
        const assignments = phaseData.map(phase => ({
          phase_id: phase.id,
          name: documentName,
          document_type: docProps.document_type,
          file_path: docProps.file_path,
          file_name: docProps.file_name,
          file_size: docProps.file_size,
          file_type: docProps.file_type,
          public_url: docProps.public_url,
          status: 'Not Started'
        }));

        const { error: insertError } = await supabase
          .from('phase_assigned_documents')
          .insert(assignments);

        if (insertError) throw insertError;
      }

      return true;
    } catch (error) {
      console.error('Error updating document phases:', error);
      return false;
    }
  }

  /**
   * Synchronize document catalog
   */
  static async synchronizeDocumentCatalog(): Promise<boolean> {
    try {
      // Get all companies and ensure they have standardized phases
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('is_archived', false);

      if (companies) {
        for (const company of companies) {
          await DatabasePhaseService.ensureStandardizedPhases(company.id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error synchronizing document catalog:', error);
      return false;
    }
  }
}
