import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';
import { isValidUUID } from '@/utils/uuidValidation';
import { formatDisplayDate, DEFAULT_DATE_FORMAT } from '@/lib/dateFormat';
import { useCallback } from 'react';

interface CompanyDateFormatData {
  date_format: string | null;
}

/**
 * Hook to access and manage company date format settings
 * @param explicitCompanyId - Optional company ID (uses context if not provided)
 */
export function useCompanyDateFormat(explicitCompanyId?: string) {
  const { companyId: contextCompanyId } = useCompany();
  const companyId = explicitCompanyId || contextCompanyId;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['company-date-format', companyId],
    queryFn: async (): Promise<CompanyDateFormatData | null> => {
      if (!isValidUUID(companyId)) return null;

      const { data, error } = await supabase
        .from('companies')
        .select('date_format')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error('[useCompanyDateFormat] Error fetching date format:', error);
        // Return default on error rather than throwing
        return { date_format: DEFAULT_DATE_FORMAT };
      }

      return {
        date_format: data?.date_format || DEFAULT_DATE_FORMAT
      };
    },
    enabled: isValidUUID(companyId),
    staleTime: 10 * 60 * 1000, // 10 minutes - date format rarely changes
  });

  // Mutation to update the date format
  const updateMutation = useMutation({
    mutationFn: async (newFormat: string) => {
      if (!isValidUUID(companyId)) {
        throw new Error('Invalid company ID');
      }

      const { error } = await supabase
        .from('companies')
        .update({ date_format: newFormat })
        .eq('id', companyId);

      if (error) throw error;
      return newFormat;
    },
    onSuccess: (newFormat) => {
      // Update the cache
      queryClient.setQueryData(['company-date-format', companyId], {
        date_format: newFormat
      });
    }
  });

  // Get the current date format (with fallback to default)
  const dateFormat = query.data?.date_format || DEFAULT_DATE_FORMAT;

  // Helper function to format a date using the company's format
  const formatDate = useCallback(
    (date: string | Date | null | undefined): string => {
      return formatDisplayDate(date, dateFormat);
    },
    [dateFormat]
  );

  return {
    // The current date format string
    dateFormat,
    // Helper function to format dates
    formatDate,
    // Loading state
    isLoading: query.isLoading,
    // Error state
    error: query.error,
    // Mutation to update the date format
    updateDateFormat: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
