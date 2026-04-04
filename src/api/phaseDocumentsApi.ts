
import { DatabasePhaseService } from "@/services/databasePhaseService";
import { EnhancedPhaseService } from "@/services/enhancedPhaseService";

export interface PhaseDocumentResponse {
  name: string;
  type: string;
  status?: string;
  description?: string;
  techApplicability?: string;
  markets?: string[];
  classes?: string[];
}

/**
 * Database-driven Phase Documents API - replaces static lifecycle phases
 */

/**
 * Get all documents for a company's phases
 */
export async function fetchPhaseDocuments(companyId: string): Promise<Record<string, PhaseDocumentResponse[]>> {
  try {
    const phasesData = await DatabasePhaseService.getPhases(companyId);
    const result: Record<string, PhaseDocumentResponse[]> = {};

    for (const phase of phasesData.activePhases) {
      const documents = await DatabasePhaseService.getPhaseDocuments(phase.id);
      result[phase.name] = documents.map(doc => ({
        name: doc.name,
        type: doc.type,
        status: 'In Review',
        techApplicability: 'All device types'
      }));
    }

    return result;
  } catch (error) {
    throw new Error('Failed to fetch phase documents from database');
  }
}

/**
 * Get documents for a specific phase
 */
export async function fetchDocumentsForPhase(companyId: string, phaseName: string): Promise<PhaseDocumentResponse[]> {
  try {
    const phasesData = await DatabasePhaseService.getPhases(companyId);
    const phase = phasesData.activePhases.find(p => p.name === phaseName);
    
    if (!phase) {
      throw new Error(`Phase "${phaseName}" not found`);
    }

    const documents = await DatabasePhaseService.getPhaseDocuments(phase.id);
    return documents.map(doc => ({
      name: doc.name,
      type: doc.type,
      status: 'In Review',
      techApplicability: 'All device types'
    }));
  } catch (error) {
    // console.error(`Error fetching documents for phase ${phaseName}:`, error);
    throw error;
  }
}

/**
 * Get recommended documents from enhanced phase Service
 */
export async function fetchRecommendedDocuments(companyId: string, phaseName?: string): Promise<PhaseDocumentResponse[]> {
  try {
    if (phaseName) {
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      const phase = phasesData.activePhases.find(p => p.name === phaseName);
      
      if (phase) {
        const documents = await EnhancedPhaseService.getPhaseRecommendedDocuments(phase.id);
        return documents.map(doc => ({
          name: doc.name,
          type: doc.type,
          status: 'In Review',
          techApplicability: 'All device types'
        }));
      }
    }

    // Get all recommended documents
    const phases = await EnhancedPhaseService.getCompanyPhases(companyId);
    const allDocs: PhaseDocumentResponse[] = [];
    
    for (const phase of phases) {
      for (const doc of phase.recommended_docs) {
        allDocs.push({
          name: doc.name,
          type: doc.type,
          status: 'In Review',
          techApplicability: 'All device types'
        });
      }
    }

    return allDocs;
  } catch (error) {
    // console.error('Error fetching recommended documents:', error);
    throw error;
  }
}

/**
 * Get available phases for a company
 */
export async function fetchAvailablePhases(companyId: string): Promise<string[]> {
  try {
    const phasesData = await DatabasePhaseService.getPhases(companyId);
    return phasesData.activePhases.map(phase => phase.name);
  } catch (error) {
    // console.error('Error fetching available phases:', error);
    throw error;
  }
}

/**
 * Validate phase document structure
 */
export async function validatePhaseDocumentStructure(companyId: string): Promise<{
  isValid: boolean;
  missingPhases: string[];
  emptyPhases: string[];
  totalDocuments: number;
}> {
  try {
    const standardTemplate = EnhancedPhaseService.getStandardPhaseTemplate();
    const phasesData = await DatabasePhaseService.getPhases(companyId);
    
    const currentPhaseNames = phasesData.activePhases.map(p => p.name);
    const standardPhaseNames = standardTemplate.map(p => p.name);
    
    const missingPhases = standardPhaseNames.filter(
      standardName => !currentPhaseNames.includes(standardName)
    );

    const emptyPhases: string[] = [];
    let totalDocuments = 0;

    for (const phase of phasesData.activePhases) {
      const documents = await DatabasePhaseService.getPhaseDocuments(phase.id);
      if (documents.length === 0) {
        emptyPhases.push(phase.name);
      }
      totalDocuments += documents.length;
    }

    return {
      isValid: missingPhases.length === 0 && emptyPhases.length === 0,
      missingPhases,
      emptyPhases,
      totalDocuments
    };
  } catch (error) {
    return {
      isValid: false,
      missingPhases: [],
      emptyPhases: [],
      totalDocuments: 0
    };
  }
}
