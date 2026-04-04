
import { useState, useEffect } from 'react';
import { EnhancedPhaseService, type PhaseTemplate, type PhaseConsistencyReport } from '@/services/enhancedPhaseService';
import { toast } from 'sonner';

/**
 * Hook for managing standardized phase templates
 */
export function useStandardizedPhases(companyId?: string) {
  const [phases, setPhases] = useState<PhaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStandardized, setIsStandardized] = useState(false);
  const [standardizing, setStandardizing] = useState(false);

  // Load company phases
  useEffect(() => {
    if (companyId) {
      loadPhases();
    }
  }, [companyId]);

  const loadPhases = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const [phasesData, standardizedStatus] = await Promise.all([
        EnhancedPhaseService.getCompanyPhases(companyId),
        EnhancedPhaseService.isCompanyStandardized(companyId)
      ]);

      setPhases(phasesData);
      setIsStandardized(standardizedStatus);
    } catch (error) {
      console.error('Error loading phases:', error);
      toast.error('Failed to load phases');
    } finally {
      setLoading(false);
    }
  };

  const standardizePhases = async () => {
    if (!companyId) return false;

    try {
      setStandardizing(true);
      const success = await EnhancedPhaseService.standardizeCompanyPhases(companyId);
      
      if (success) {
        await loadPhases(); // Reload phases after standardization
      }
      
      return success;
    } catch (error) {
      console.error('Error standardizing phases:', error);
      return false;
    } finally {
      setStandardizing(false);
    }
  };

  return {
    phases,
    loading,
    isStandardized,
    standardizing,
    standardizePhases,
    refreshPhases: loadPhases
  };
}

/**
 * Hook for validating phase consistency across companies
 */
export function usePhaseConsistencyValidation() {
  const [reports, setReports] = useState<PhaseConsistencyReport[]>([]);
  const [loading, setLoading] = useState(false);

  const validateConsistency = async () => {
    try {
      setLoading(true);
      const data = await EnhancedPhaseService.validatePhaseConsistency();
      setReports(data);
      return data;
    } catch (error) {
      console.error('Error validating consistency:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    reports,
    loading,
    validateConsistency
  };
}
