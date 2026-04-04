import { useMemo } from 'react';
import { useEmdnCodesByPrefix, findEmdnCodeInData } from './useEmdnCodesByPrefix';

interface EmdnCodeDetails {
  code: string;
  description: string;
}

/**
 * Hook to get details for a specific EMDN code.
 * Uses the prefix-cached hook internally so multiple codes starting with
 * the same letter share the same cached API response.
 */
export function useEmdnCodeDetails(emdnCode: string | undefined) {
  // Get the prefix letter for caching
  const prefixLetter = emdnCode?.charAt(0)?.toUpperCase();

  // Use the prefix-cached hook - all codes with same first letter share this cache
  const { data: prefixData, isLoading, error } = useEmdnCodesByPrefix(prefixLetter);

  // Find the specific code in the cached prefix data
  const data = useMemo((): EmdnCodeDetails | null => {
    if (!emdnCode || !prefixData) return null;
    const match = findEmdnCodeInData(prefixData, emdnCode);
    return match || null;
  }, [emdnCode, prefixData]);

  return {
    data,
    isLoading,
    error,
  };
}