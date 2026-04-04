import { useState, useCallback } from 'react';
import { validatePhaseCompletionRequirements, PhaseClosureValidationResult } from '@/utils/phaseClosureValidation';

export function usePhaseClosureValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<PhaseClosureValidationResult | null>(null);

  const validatePhaseForClosure = useCallback(async (phaseId: string, productId: string) => {
    setIsValidating(true);
    try {
      const result = await validatePhaseCompletionRequirements(phaseId, productId);
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Error in phase closure validation:', error);
      const errorResult: PhaseClosureValidationResult = {
        canClose: false,
        incompleteItems: { documents: [], activities: [], audits: [] },
        message: 'Error validating phase closure requirements'
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    isValidating,
    validationResult,
    validatePhaseForClosure,
    clearValidation
  };
}