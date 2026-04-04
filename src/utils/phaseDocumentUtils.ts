
import { DatabasePhaseService } from "@/services/databasePhaseService";
import { EnhancedPhaseService } from "@/services/enhancedPhaseService";

export interface PhaseDocument {
  name: string;
  type: string;
  status?: string;
  description?: string;
  phase?: string;
}

/**
 * Database-driven phase document utilities - replaces static dependencies
 */

/**
 * Get all documents for a company organized by phase
 */
export async function getPhaseDocuments(companyId: string): Promise<Record<string, PhaseDocument[]>> {
  try {
    const phasesData = await DatabasePhaseService.getPhases(companyId);
    const phaseDocuments: Record<string, PhaseDocument[]> = {};

    for (const phase of phasesData.activePhases) {
      const documents = await DatabasePhaseService.getPhaseDocuments(phase.id);
      phaseDocuments[phase.name] = documents.map(doc => ({
        name: doc.name,
        type: doc.type,
        status: 'Not Started',
        phase: phase.name
      }));
    }

    return phaseDocuments;
  } catch (error) {
    console.error('Error getting phase documents:', error);
    return {};
  }
}

/**
 * Get documents for a specific phase
 */
export async function getDocumentsForPhase(companyId: string, phaseName: string): Promise<PhaseDocument[]> {
  try {
    const phasesData = await DatabasePhaseService.getPhases(companyId);
    const phase = phasesData.activePhases.find(p => p.name === phaseName);
    
    if (!phase) {
      console.warn(`Phase "${phaseName}" not found for company ${companyId}`);
      return [];
    }

    const documents = await DatabasePhaseService.getPhaseDocuments(phase.id);
    return documents.map(doc => ({
      name: doc.name,
      type: doc.type,
      status: 'Not Started',
      phase: phaseName
    }));
  } catch (error) {
    console.error(`Error getting documents for phase ${phaseName}:`, error);
    return [];
  }
}

/**
 * Get recommended documents from phase templates
 */
export async function getRecommendedDocuments(companyId: string, phaseName?: string): Promise<PhaseDocument[]> {
  try {
    const phases = await EnhancedPhaseService.getCompanyPhases(companyId);
    
    if (phaseName) {
      const phase = phases.find(p => p.name === phaseName);
      return phase ? phase.recommended_docs.map(doc => ({
        name: doc.name,
        type: doc.type,
        status: 'Not Started',
        phase: phaseName
      })) : [];
    }

    // Return all recommended documents
    const allDocs: PhaseDocument[] = [];
    for (const phase of phases) {
      for (const doc of phase.recommended_docs) {
        allDocs.push({
          name: doc.name,
          type: doc.type,
          status: 'Not Started',
          phase: phase.name
        });
      }
    }

    return allDocs;
  } catch (error) {
    console.error('Error getting recommended documents:', error);
    return [];
  }
}

/**
 * Check if a document exists in a phase
 */
export async function isDocumentInPhase(companyId: string, phaseName: string, documentName: string): Promise<boolean> {
  try {
    const phaseDocuments = await getDocumentsForPhase(companyId, phaseName);
    return phaseDocuments.some(doc => doc.name === documentName);
  } catch (error) {
    console.error('Error checking document in phase:', error);
    return false;
  }
}

/**
 * Get document count by phase
 */
export async function getDocumentCountByPhase(companyId: string): Promise<Record<string, number>> {
  try {
    const phaseDocuments = await getPhaseDocuments(companyId);
    const counts: Record<string, number> = {};
    
    for (const [phaseName, documents] of Object.entries(phaseDocuments)) {
      counts[phaseName] = documents.length;
    }
    
    return counts;
  } catch (error) {
    console.error('Error getting document count by phase:', error);
    return {};
  }
}

/**
 * Clean phase name (remove numbering)
 */
export function cleanPhaseName(phaseName: string): string {
  return phaseName.replace(/^\(\d+\)\s*/, '').trim();
}

/**
 * Check if phase name has numbering
 */
export function isNumberedPhase(phaseName: string): boolean {
  return /^\(\d+\)\s*/.test(phaseName);
}
