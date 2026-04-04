import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RefactoredCleanupResult {
  success: boolean;
  orphanedPhasesRemoved: number;
  orphanedDocumentsRemoved: number;
  errors: string[];
}

/**
 * Cleanup service for the refactored phase schema
 */
export class RefactoredPhaseCleanupService {
  /**
   * Clean up orphaned phases (phases with no company_id or invalid company_id)
   */
  static async cleanupOrphanedPhases(): Promise<RefactoredCleanupResult> {
    try {
      console.log('[RefactoredPhaseCleanupService] Starting cleanup of orphaned phases');

      // Find orphaned phases in company_phases table
      const { data: orphanedPhases, error: orphanedError } = await supabase
        .from('company_phases')
        .select(`
          id, 
          name, 
          company_id,
          companies!inner(id)
        `)
        .is('companies.id', null); // This will find phases where company doesn't exist

      if (orphanedError) {
        console.error('[RefactoredPhaseCleanupService] Error finding orphaned phases:', orphanedError);
        return {
          success: false,
          orphanedPhasesRemoved: 0,
          orphanedDocumentsRemoved: 0,
          errors: [orphanedError.message]
        };
      }

      if (!orphanedPhases || orphanedPhases.length === 0) {
        console.log('[RefactoredPhaseCleanupService] No orphaned phases found');
        return {
          success: true,
          orphanedPhasesRemoved: 0,
          orphanedDocumentsRemoved: 0,
          errors: []
        };
      }

      console.log(`[RefactoredPhaseCleanupService] Found ${orphanedPhases.length} orphaned phases`);

      let orphanedDocumentsRemoved = 0;
      const errors: string[] = [];

      // Remove documents assigned to orphaned phases
      for (const phase of orphanedPhases) {
        try {
          const { data: orphanedDocs, error: docsError } = await supabase
            .from('phase_document_templates')
            .select('id')
            .eq('company_phase_id', phase.id);

          if (!docsError && orphanedDocs) {
            const { error: deleteDocsError } = await supabase
              .from('phase_document_templates')
              .delete()
              .eq('company_phase_id', phase.id);

            if (deleteDocsError) {
              errors.push(`Failed to delete documents for phase ${phase.name}: ${deleteDocsError.message}`);
            } else {
              orphanedDocumentsRemoved += orphanedDocs.length;
              console.log(`[RefactoredPhaseCleanupService] Removed ${orphanedDocs.length} documents from orphaned phase: ${phase.name}`);
            }
          }
        } catch (error) {
          console.error(`[RefactoredPhaseCleanupService] Error cleaning documents for phase ${phase.name}:`, error);
          errors.push(`Error cleaning documents for phase ${phase.name}`);
        }
      }

      // Remove the orphaned phases themselves
      const phaseIds = orphanedPhases.map(p => p.id);
      const { error: deletePhasesError } = await supabase
        .from('company_phases')
        .delete()
        .in('id', phaseIds);

      if (deletePhasesError) {
        console.error('[RefactoredPhaseCleanupService] Error deleting orphaned phases:', deletePhasesError);
        errors.push(`Failed to delete orphaned phases: ${deletePhasesError.message}`);
        return {
          success: false,
          orphanedPhasesRemoved: 0,
          orphanedDocumentsRemoved,
          errors
        };
      }

      console.log(`[RefactoredPhaseCleanupService] Successfully removed ${orphanedPhases.length} orphaned phases and ${orphanedDocumentsRemoved} orphaned documents`);

      return {
        success: true,
        orphanedPhasesRemoved: orphanedPhases.length,
        orphanedDocumentsRemoved,
        errors
      };

    } catch (error) {
      console.error('[RefactoredPhaseCleanupService] Cleanup failed:', error);
      return {
        success: false,
        orphanedPhasesRemoved: 0,
        orphanedDocumentsRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get cleanup statistics before running cleanup
   */
  static async getCleanupStats(): Promise<{
    orphanedPhases: number;
    orphanedDocuments: number;
    errors: string[];
  }> {
    try {
      // Count orphaned phases using left join to find missing companies
      const { data: allPhases, error: phasesError } = await supabase
        .from('company_phases')
        .select(`
          id,
          company_id,
          companies(id)
        `);

      if (phasesError) {
        return {
          orphanedPhases: 0,
          orphanedDocuments: 0,
          errors: [phasesError.message]
        };
      }

      // Filter for phases where company doesn't exist
      const orphanedPhases = (allPhases || []).filter(phase => !phase.companies);
      const orphanedPhaseCount = orphanedPhases.length;

      if (orphanedPhaseCount === 0) {
        return {
          orphanedPhases: 0,
          orphanedDocuments: 0,
          errors: []
        };
      }

      // Count orphaned documents
      const phaseIds = orphanedPhases.map(p => p.id);
      const { data: orphanedDocs, error: docsError } = await supabase
        .from('phase_document_templates')
        .select('id')
        .in('company_phase_id', phaseIds);

      if (docsError) {
        return {
          orphanedPhases: orphanedPhaseCount,
          orphanedDocuments: 0,
          errors: [docsError.message]
        };
      }

      return {
        orphanedPhases: orphanedPhaseCount,
        orphanedDocuments: orphanedDocs?.length || 0,
        errors: []
      };

    } catch (error) {
      console.error('[RefactoredPhaseCleanupService] Error getting cleanup stats:', error);
      return {
        orphanedPhases: 0,
        orphanedDocuments: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Clean up duplicate phases within companies
   */
  static async cleanupDuplicatePhases(companyId: string): Promise<RefactoredCleanupResult> {
    try {
      console.log(`[RefactoredPhaseCleanupService] Cleaning up duplicate phases for company: ${companyId}`);

      // Find duplicate phase names within the company
      const { data: phases, error: phasesError } = await supabase
        .from('company_phases')
        .select('id, name, created_at')
        .eq('company_id', companyId)
        .order('name, created_at');

      if (phasesError) {
        throw phasesError;
      }

      const phaseGroups = new Map<string, typeof phases>();
      (phases || []).forEach(phase => {
        const existing = phaseGroups.get(phase.name) || [];
        existing.push(phase);
        phaseGroups.set(phase.name, existing);
      });

      let duplicatesRemoved = 0;
      let documentsRemoved = 0;
      const errors: string[] = [];

      // For each group with duplicates, keep the oldest and remove the rest
      for (const [phaseName, phaseGroup] of phaseGroups) {
        if (phaseGroup.length > 1) {
          const [keepPhase, ...duplicates] = phaseGroup;
          
          for (const duplicate of duplicates) {
            try {
              // Count and remove documents from duplicate phases
              const { data: docs, error: docsCountError } = await supabase
                .from('phase_document_templates')
                .select('id')
                .eq('company_phase_id', duplicate.id);

              if (!docsCountError && docs) {
                const { error: deleteDocsError } = await supabase
                  .from('phase_document_templates')
                  .delete()
                  .eq('company_phase_id', duplicate.id);

                if (deleteDocsError) {
                  errors.push(`Failed to delete documents for duplicate phase ${phaseName}: ${deleteDocsError.message}`);
                } else {
                  documentsRemoved += docs.length;
                }
              }

              // Remove the duplicate phase
              const { error: deletePhaseError } = await supabase
                .from('company_phases')
                .delete()
                .eq('id', duplicate.id);

              if (deletePhaseError) {
                errors.push(`Failed to delete duplicate phase ${phaseName}: ${deletePhaseError.message}`);
              } else {
                duplicatesRemoved++;
                console.log(`[RefactoredPhaseCleanupService] Removed duplicate phase: ${phaseName}`);
              }

            } catch (error) {
              errors.push(`Error processing duplicate phase ${phaseName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }

      console.log(`[RefactoredPhaseCleanupService] Cleanup complete: ${duplicatesRemoved} duplicate phases removed`);

      return {
        success: errors.length === 0,
        orphanedPhasesRemoved: duplicatesRemoved,
        orphanedDocumentsRemoved: documentsRemoved,
        errors
      };

    } catch (error) {
      console.error('[RefactoredPhaseCleanupService] Error in cleanupDuplicatePhases:', error);
      return {
        success: false,
        orphanedPhasesRemoved: 0,
        orphanedDocumentsRemoved: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}
