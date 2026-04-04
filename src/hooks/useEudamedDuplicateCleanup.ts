import { useState, useCallback } from 'react';
import { EudamedDuplicateCleanupService, DuplicateCleanupResult } from '@/services/eudamedDuplicateCleanupService';
import { toast } from 'sonner';

export function useEudamedDuplicateCleanup() {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [duplicatesReport, setDuplicatesReport] = useState<any>(null);

  const cleanupDuplicates = useCallback(async (companyId: string): Promise<DuplicateCleanupResult> => {
    setIsCleaningUp(true);
    
    try {
      const result = await EudamedDuplicateCleanupService.cleanupDuplicates(companyId);
      
      if (result.success) {
        if (result.duplicatesRemoved > 0) {
          toast.success(`Successfully removed ${result.duplicatesRemoved} duplicate products`);
        } else {
          toast.info('No duplicate products found to clean up');
        }
      } else {
        toast.error(`Cleanup completed with ${result.errors.length} errors`);
      }
      
      return result;
    } catch (error) {
      console.error('Duplicate cleanup failed:', error);
      toast.error(`Duplicate cleanup failed: ${error}`);
      throw error;
    } finally {
      setIsCleaningUp(false);
    }
  }, []);

  const getDuplicatesReport = useCallback(async (companyId: string) => {
    setIsLoadingReport(true);
    try {
      const report = await EudamedDuplicateCleanupService.getDuplicatesReport(companyId);
      setDuplicatesReport(report);
      return report;
    } catch (error) {
      console.error('Failed to get duplicates report:', error);
      toast.error('Failed to load duplicates report');
      throw error;
    } finally {
      setIsLoadingReport(false);
    }
  }, []);

  return {
    isCleaningUp,
    isLoadingReport,
    duplicatesReport,
    cleanupDuplicates,
    getDuplicatesReport
  };
}