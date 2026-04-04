
import { useState, useEffect } from 'react';
import { DocumentOrganizationService, DocumentAnalysis } from '@/services/documentOrganizationService';
import { toast } from 'sonner';

export function useDocumentOrganization(companyId: string) {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const analyzeDocuments = async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const result = await DocumentOrganizationService.analyzeDocumentOrganization(companyId);
      setAnalysis(result);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Document analysis failed:', error);
      toast.error('Failed to analyze documents');
    } finally {
      setIsLoading(false);
    }
  };

  const performCleanup = async () => {
    if (!companyId) return false;
    
    setIsLoading(true);
    try {
      const result = await DocumentOrganizationService.performComprehensiveCleanup(companyId);
      
      if (result.success) {
        setAnalysis(result.analysis);
        setLastAnalyzed(new Date());
        toast.success('Phase 3 document optimization completed successfully!');
        return true;
      } else {
        toast.error(`Phase 3 optimization failed: ${result.errors.join(', ')}`);
        return false;
      }
    } catch (error) {
      console.error('Phase 3 optimization failed:', error);
      toast.error('Failed to perform Phase 3 optimization');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      analyzeDocuments();
    }
  }, [companyId]);

  const getHealthScore = (): number => {
    if (!analysis) return 0;
    
    const totalIssues = 
      analysis.duplicateGroups.length + 
      analysis.orphanedDocuments.length + 
      analysis.incorrectScopes.length +
      analysis.phaseAssignmentIssues.testPhases.length +
      (analysis.phaseAssignmentIssues.templateConsolidationCandidates?.length || 0) +
      (analysis.phaseAssignmentIssues.overDistributed?.length || 0);
    
    const maxExpectedIssues = Math.max(analysis.totalDocuments * 0.1, 10);
    return Math.max(0, Math.min(100, 100 - (totalIssues / maxExpectedIssues) * 100));
  };

  const getIssueCount = (): number => {
    if (!analysis) return 0;
    return analysis.duplicateGroups.length + 
           analysis.orphanedDocuments.length + 
           analysis.incorrectScopes.length +
           analysis.phaseAssignmentIssues.testPhases.length +
           (analysis.phaseAssignmentIssues.templateConsolidationCandidates?.length || 0) +
           (analysis.phaseAssignmentIssues.overDistributed?.length || 0);
  };

  return {
    analysis,
    isLoading,
    lastAnalyzed,
    healthScore: getHealthScore(),
    issueCount: getIssueCount(),
    analyzeDocuments,
    performCleanup
  };
}
