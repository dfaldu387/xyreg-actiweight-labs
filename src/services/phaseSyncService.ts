
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhaseDocument {
  id?: string | null;
  name: string;
  document_type?: string;
  tech_applicability?: string;
  document_scope?: string;
}

export interface PhaseData {
  id?: string | null;
  name: string;
  description?: string;
  position: number;
  category_id?: string | null;
  is_active: boolean;
  documents?: PhaseDocument[];
}

export interface SyncPayload {
  company_id: string;
  phases: PhaseData[];
}

export interface SyncResult {
  success: boolean;
  phases: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  documents: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  active_phases: {
    activated: number;
    deactivated: number;
  };
  errors: string[];
}

export class PhaseSyncService {
  /**
   * Sync company phases and documents using the new reconciliation API
   */
  static async syncCompanyPhases(payload: SyncPayload): Promise<SyncResult> {
    try {
      const { data, error } = await supabase.functions.invoke('sync-company-phases', {
        body: payload
      });

      if (error) {
        console.error('[PhaseSyncService] Edge function error:', error);
        throw new Error(`Sync failed: ${error.message}`);
      }

      const result = data as SyncResult;

      // Show user-friendly notifications
      if (result.success) {
        const changes = [];
        if (result.phases.inserted > 0) changes.push(`${result.phases.inserted} phases added`);
        if (result.phases.updated > 0) changes.push(`${result.phases.updated} phases updated`);
        if (result.phases.deleted > 0) changes.push(`${result.phases.deleted} phases removed`);
        if (result.documents.inserted > 0) changes.push(`${result.documents.inserted} documents added`);
        if (result.documents.updated > 0) changes.push(`${result.documents.updated} documents updated`);
        if (result.documents.deleted > 0) changes.push(`${result.documents.deleted} documents removed`);

        if (changes.length > 0) {
          toast.success(`Sync completed: ${changes.join(', ')}`);
        } else {
          toast.info('Sync completed - no changes needed');
        }
      } else {
        toast.error(`Sync completed with ${result.errors.length} errors`);
        result.errors.forEach(error => {
          console.error('[PhaseSyncService] Sync error:', error);
        });
      }

      return result;
    } catch (error) {
      console.error('[PhaseSyncService] Service error:', error);
      toast.error('Failed to sync phases and documents');
      throw error;
    }
  }

  /**
   * Convert existing phase data to sync payload format
   */
  static convertToSyncPayload(
    companyId: string,
    phases: any[],
    documents: any[] = []
  ): SyncPayload {
    const convertedPhases: PhaseData[] = phases.map(phase => {
      const phaseDocuments = documents.filter(doc => doc.company_phase_id === phase.id || doc.phase_id === phase.id);
      
      return {
        id: phase.id,
        name: phase.name,
        description: phase.description,
        position: phase.position || 0,
        category_id: phase.category_id,
        is_active: phase.is_active !== false, // Default to true if not specified
        documents: phaseDocuments.map(doc => ({
          id: doc.id,
          name: doc.name,
          document_type: doc.document_type || 'Standard',
          tech_applicability: doc.tech_applicability || 'All device types',
          document_scope: doc.document_scope || 'company_template'
        }))
      };
    });

    return {
      company_id: companyId,
      phases: convertedPhases
    };
  }

  /**
   * Helper to create a new phase in sync payload format
   */
  static createNewPhase(
    name: string,
    description: string = '',
    position: number = 0,
    categoryId?: string,
    isActive: boolean = true,
    documents: PhaseDocument[] = []
  ): PhaseData {
    return {
      id: null, // null indicates new phase
      name,
      description,
      position,
      category_id: categoryId,
      is_active: isActive,
      documents
    };
  }

  /**
   * Helper to create a new document in sync payload format
   */
  static createNewDocument(
    name: string,
    documentType: string = 'Standard',
    techApplicability: string = 'All device types',
    documentScope: string = 'company_template'
  ): PhaseDocument {
    return {
      id: null, // null indicates new document
      name,
      document_type: documentType,
      tech_applicability: techApplicability,
      document_scope: documentScope
    };
  }
}
