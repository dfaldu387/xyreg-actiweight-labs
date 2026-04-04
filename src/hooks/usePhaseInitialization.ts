
import { useState, useEffect } from 'react';
import { CompanyPhaseInitializationService, PhaseInitializationResult } from '@/services/companyPhaseInitializationService';
import { CompanyInitializationService } from '@/services/companyInitializationService';
import { toast } from 'sonner';

export function usePhaseInitialization(companyId: string | null) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    totalPhases: number;
    activePhases: number;
    systemPhases: number;
    issues: string[];
  } | null>(null);

  const validatePhases = async () => {
    if (!companyId) return;

    try {
      const result = await CompanyPhaseInitializationService.validateCompanyPhases(companyId);
      setValidationResult(result);
      setIsValidated(true);

      if (!result.isValid) {
        console.log('[usePhaseInitialization] Validation issues found:', result.issues);
      }
    } catch (error) {
      console.error('[usePhaseInitialization] Validation error:', error);
      setValidationResult({
        isValid: false,
        totalPhases: 0,
        activePhases: 0,
        systemPhases: 0,
        issues: ['Failed to validate phases']
      });
      setIsValidated(true);
    }
  };

  const initializePhases = async (): Promise<PhaseInitializationResult> => {
    if (!companyId) {
      return {
        success: false,
        message: 'No company ID provided',
        phasesCreated: 0,
        phasesActivated: 0
      };
    }

    setIsInitializing(true);
    try {
      const initResult = await CompanyInitializationService.initializeCompany(companyId, 'Company');

      const result: PhaseInitializationResult = {
        success: initResult.success,
        message: initResult.message,
        phasesCreated: initResult.phasesCreated ?? 0,
        phasesActivated: 0
      };

      if (result.success) {
        await validatePhases();
      } else {
        toast.error(`Phase initialization failed: ${result.message}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Phase initialization error: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
        phasesCreated: 0,
        phasesActivated: 0
      };
    } finally {
      setIsInitializing(false);
    }
  };

  // Auto-validate when component mounts
  useEffect(() => {
    if (companyId && !isValidated) {
      validatePhases();
    }
  }, [companyId]);

  return {
    isInitializing,
    isValidated,
    validationResult,
    validatePhases,
    initializePhases
  };
}
