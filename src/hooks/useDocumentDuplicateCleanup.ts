
import { useState, useCallback } from 'react';
import { DocumentDuplicateCleanupService, DuplicateCleanupResult } from '@/services/documentDuplicateCleanupService';

export function useDocumentDuplicateCleanup() {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<DuplicateCleanupResult | null>(null);
  const [duplicatesReport, setDuplicatesReport] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const cleanupDuplicates = useCallback(async (companyId: string): Promise<DuplicateCleanupResult> => {
    setIsCleaningUp(true);
    try {
      const result = await DocumentDuplicateCleanupService.cleanupDuplicatePhaseAssignments(companyId);
      setLastCleanupResult(result);
      return result;
    } finally {
      setIsCleaningUp(false);
    }
  }, []);

  const getDuplicatesReport = useCallback(async (companyId: string) => {
    setIsLoadingReport(true);
    try {
      const report = await DocumentDuplicateCleanupService.getDuplicateAssignmentsReport(companyId);
      setDuplicatesReport(report);
      return report;
    } finally {
      setIsLoadingReport(false);
    }
  }, []);

  return {
    isCleaningUp,
    lastCleanupResult,
    duplicatesReport,
    isLoadingReport,
    cleanupDuplicates,
    getDuplicatesReport
  };
}
