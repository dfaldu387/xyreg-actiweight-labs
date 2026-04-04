import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhaseCleanupResult {
  action_taken: string;
  old_phase_name: string;
  new_phase_name: string;
  documents_moved: number;
}

export interface ComprehensiveCleanupResult {
  success: boolean;
  duplicatesFound: number;
  duplicatesResolved: number;
  companiesProcessed: number;
  errors: string[];
  details: Array<{
    companyName: string;
    action: string;
    phaseName: string;
    duplicateCount: number;
  }>;
}

export class PhaseCleanupService {
  /**
   * Clean up duplicate phases for a company
   */
  static async cleanupDuplicatePhases(companyId: string): Promise<PhaseCleanupResult[]> {
    try {
      console.log('[PhaseCleanupService] Cleaning up duplicate phases for company:', companyId);
      
      const { data, error } = await supabase.rpc('cleanup_duplicate_phases', {
        target_company_id: companyId
      });

      if (error) {
        console.error('[PhaseCleanupService] Error cleaning up duplicates:', error);
        throw error;
      }

      const results = data as PhaseCleanupResult[];
      
      if (results && results.length > 0) {
        const totalDocuments = results.reduce((sum, result) => sum + result.documents_moved, 0);
        toast.success(`Cleaned up ${results.length} duplicate phases and moved ${totalDocuments} documents`);
        console.log('[PhaseCleanupService] Cleanup results:', results);
      } else {
        toast.info('No duplicate phases found to clean up');
      }

      return results || [];
    } catch (error) {
      console.error('[PhaseCleanupService] Error in cleanup:', error);
      toast.error('Failed to clean up duplicate phases');
      throw error;
    }
  }

  /**
   * Clean up all company phases (comprehensive cleanup)
   */
  static async cleanupAllCompanyPhases(): Promise<ComprehensiveCleanupResult> {
    try {
      console.log('[PhaseCleanupService] Starting comprehensive phase cleanup');
      
      // Get all companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_archived', false);

      if (companiesError) throw companiesError;

      let totalDuplicatesFound = 0;
      let totalDuplicatesResolved = 0;
      const errors: string[] = [];
      const details: Array<{
        companyName: string;
        action: string;
        phaseName: string;
        duplicateCount: number;
      }> = [];

      // Process each company
      for (const company of companies || []) {
        try {
          const results = await this.cleanupDuplicatePhases(company.id);
          
          if (results.length > 0) {
            totalDuplicatesFound += results.length;
            totalDuplicatesResolved += results.length;
            
            results.forEach(result => {
              details.push({
                companyName: company.name,
                action: result.action_taken,
                phaseName: result.old_phase_name,
                duplicateCount: 1
              });
            });
          }
        } catch (error) {
          const errorMessage = `Failed to cleanup phases for ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      return {
        success: errors.length === 0,
        duplicatesFound: totalDuplicatesFound,
        duplicatesResolved: totalDuplicatesResolved,
        companiesProcessed: companies?.length || 0,
        errors,
        details
      };
    } catch (error) {
      console.error('[PhaseCleanupService] Error in comprehensive cleanup:', error);
      return {
        success: false,
        duplicatesFound: 0,
        duplicatesResolved: 0,
        companiesProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        details: []
      };
    }
  }

  /**
   * Transfer documents from one phase to another
   */
  static async transferDocuments(sourcePhaseId: string, targetPhaseId: string): Promise<number> {
    try {
      console.log('[PhaseCleanupService] Transferring documents from', sourcePhaseId, 'to', targetPhaseId);
      
      const { data, error } = await supabase.rpc('transfer_phase_documents', {
        source_phase_id: sourcePhaseId,
        target_phase_id: targetPhaseId
      });

      if (error) {
        console.error('[PhaseCleanupService] Error transferring documents:', error);
        throw error;
      }

      const documentsTransferred = data as number;
      
      if (documentsTransferred > 0) {
        toast.success(`Transferred ${documentsTransferred} documents successfully`);
      } else {
        toast.info('No documents to transfer');
      }

      console.log('[PhaseCleanupService] Documents transferred:', documentsTransferred);
      return documentsTransferred;
    } catch (error) {
      console.error('[PhaseCleanupService] Error transferring documents:', error);
      toast.error('Failed to transfer documents');
      throw error;
    }
  }

  /**
   * Get phases with document counts for a company
   */
  static async getPhasesWithDocumentCounts(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('company_phases')
        .select(`
          id,
          name,
          created_at,
          phase_assigned_documents(id)
        `)
        .eq('company_id', companyId)
        .order('created_at');

      if (error) throw error;

      return data?.map(phase => ({
        ...phase,
        document_count: Array.isArray(phase.phase_assigned_documents) 
          ? phase.phase_assigned_documents.length 
          : 0
      })) || [];
    } catch (error) {
      console.error('[PhaseCleanupService] Error fetching phases with counts:', error);
      throw error;
    }
  }
}
