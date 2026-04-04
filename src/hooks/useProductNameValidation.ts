
import { useState, useEffect, useCallback } from 'react';
import { checkProductNameExists } from '@/services/duplicateNameValidation';
import { useDebounce } from '@/hooks/useDebounce';

interface UseProductNameValidationProps {
  companyId: string;
  productName: string;
  excludeProductId?: string;
  enabled?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  isChecking: boolean;
  error?: string;
  message?: string;
}

export function useProductNameValidation({
  companyId,
  productName,
  excludeProductId,
  enabled = true
}: UseProductNameValidationProps): ValidationResult {
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  // Debounce the product name to avoid excessive API calls
  const debouncedProductName = useDebounce(productName, 500);

  const validateName = useCallback(async (name: string) => {
    if (!enabled || !name.trim() || !companyId) {
      setIsValid(true);
      setError(undefined);
      setMessage(undefined);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const result = await checkProductNameExists(companyId, name.trim(), excludeProductId);
      
      if (result.error) {
        setError(result.error);
        setIsValid(false);
        setMessage('Unable to validate product name');
      } else if (result.exists) {
        setIsValid(false);
        setMessage(`A product named "${name.trim()}" already exists in this company`);
      } else {
        setIsValid(true);
        setMessage('Product name is available');
      }
    } catch (error) {
      console.error('[useProductNameValidation] Validation error:', error);
      setError(error instanceof Error ? error.message : 'Validation failed');
      setIsValid(false);
      setMessage('Unable to validate product name');
    } finally {
      setIsChecking(false);
    }
  }, [companyId, excludeProductId, enabled]);

  useEffect(() => {
    validateName(debouncedProductName);
  }, [debouncedProductName, validateName]);

  return {
    isValid,
    isChecking,
    error,
    message
  };
}
