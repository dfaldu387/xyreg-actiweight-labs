import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DuplicateCleanupResult {
  success: boolean;
  duplicatesRemoved: number;
  documentsProcessed: number;
  errors: string[];
  cleanupDetails: Array<{
    documentName: string;
    phasesFound: string[];
    duplicatesRemoved: number;
    keptInPhase: string;
  }>;
}

/**
 * Service to clean up duplicate document assignments across phases
 */
export class DocumentDuplicateCleanupService {
  
  /**
   * Find and remove duplicate document assignments for a company
   */
  static async cleanupDuplicatePhaseAssignments(companyId: string): Promise<DuplicateCleanupResult> {
    console.log('[DocumentDuplicateCleanup] Starting cleanup for company:', companyId);
    
    try {
      const result: DuplicateCleanupResult = {
        success: true,
        duplicatesRemoved: 0,
        documentsProcessed: 0,
        errors: [],
        cleanupDetails: []
      };

      // Get all phase_assigned_documents for the company with phase information
      const { data: assignments, error: fetchError } = await supabase
        .from('phase_assigned_documents')
        .select(`
          id,
          name,
          phase_id,
          created_at,
          phases!inner(
            id,
            name,
            position,
            company_id
          )
        `)
        .eq('phases.company_id', companyId)
        .order('name')
        .order('phases.position');

      if (fetchError) {
        throw fetchError;
      }

      if (!assignments || assignments.length === 0) {
        return result;
      }

      // Group assignments by document name
      const documentGroups = new Map<string, typeof assignments>();
      
      assignments.forEach(assignment => {
        const docName = assignment.name;
        if (!documentGroups.has(docName)) {
          documentGroups.set(docName, []);
        }
        documentGroups.get(docName)!.push(assignment);
      });

      // Process each document group to find duplicates
      for (const [docName, docAssignments] of documentGroups.entries()) {
        if (docAssignments.length > 1) {
          // Found duplicates for this document
          console.log(`[DocumentDuplicateCleanup] Found ${docAssignments.length} assignments for "${docName}"`);
          
          // Sort by phase position to keep the earliest/most appropriate phase
          const sortedAssignments = docAssignments.sort((a, b) => 
            (a.phases as any).position - (b.phases as any).position
          );
          
          // Keep the first assignment (earliest phase), remove the rest
          const toKeep = sortedAssignments[0];
          const toRemove = sortedAssignments.slice(1);
          
          const phasesFound = sortedAssignments.map(a => (a.phases as any).name);
          
          // Remove duplicate assignments
          for (const assignment of toRemove) {
            const { error: deleteError } = await supabase
              .from('phase_assigned_documents')
              .delete()
              .eq('id', assignment.id);
              
            if (deleteError) {
              console.error(`Failed to remove duplicate assignment: ${assignment.id}`, deleteError);
              result.errors.push(`Failed to remove duplicate "${docName}" from phase "${(assignment.phases as any).name}": ${deleteError.message}`);
            } else {
              result.duplicatesRemoved++;
              console.log(`[DocumentDuplicateCleanup] Removed duplicate "${docName}" from phase "${(assignment.phases as any).name}"`);
            }
          }
          
          result.cleanupDetails.push({
            documentName: docName,
            phasesFound,
            duplicatesRemoved: toRemove.length,
            keptInPhase: (toKeep.phases as any).name
          });
          
          result.documentsProcessed++;
        }
      }
      
      console.log('[DocumentDuplicateCleanup] Cleanup completed:', result);
      
      if (result.duplicatesRemoved > 0) {
        toast.success(`Cleanup completed: ${result.duplicatesRemoved} duplicate assignments removed from ${result.documentsProcessed} documents`);
      } else if (result.documentsProcessed === 0) {
        toast.info('No duplicate document assignments found');
      }
      
      return result;
      
    } catch (error) {
      console.error('[DocumentDuplicateCleanup] Cleanup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast.error(`Cleanup failed: ${errorMessage}`);
      
      return {
        success: false,
        duplicatesRemoved: 0,
        documentsProcessed: 0,
        errors: [errorMessage],
        cleanupDetails: []
      };
    }
  }

  /**
   * Get duplicate assignments report without cleaning up
   */
  static async getDuplicateAssignmentsReport(companyId: string): Promise<{
    duplicates: Array<{
      documentName: string;
      phases: Array<{ id: string; name: string; position: number }>;
      assignmentCount: number;
    }>;
    totalDuplicates: number;
  }> {
    try {
      const { data: assignments, error: fetchError } = await supabase
        .from('phase_assigned_documents')
        .select(`
          id,
          name,
          phase_id,
          phases!inner(
            id,
            name,
            position,
            company_id
          )
        `)
        .eq('phases.company_id', companyId);

      if (fetchError || !assignments) {
        return { duplicates: [], totalDuplicates: 0 };
      }

      // Group by document name
      const documentGroups = new Map<string, typeof assignments>();
      
      assignments.forEach(assignment => {
        const docName = assignment.name;
        if (!documentGroups.has(docName)) {
          documentGroups.set(docName, []);
        }
        documentGroups.get(docName)!.push(assignment);
      });

      // Find duplicates
      const duplicates = [];
      let totalDuplicates = 0;
      
      for (const [docName, docAssignments] of documentGroups.entries()) {
        if (docAssignments.length > 1) {
          duplicates.push({
            documentName: docName,
            phases: docAssignments.map(a => ({
              id: (a.phases as any).id,
              name: (a.phases as any).name,
              position: (a.phases as any).position
            })).sort((a, b) => a.position - b.position),
            assignmentCount: docAssignments.length
          });
          totalDuplicates += docAssignments.length - 1; // Count extra assignments as duplicates
        }
      }

      return { duplicates, totalDuplicates };
      
    } catch (error) {
      console.error('Error getting duplicates report:', error);
      return { duplicates: [], totalDuplicates: 0 };
    }
  }
}
