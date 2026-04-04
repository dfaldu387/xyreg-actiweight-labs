import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FDAMultiSearchParams, FDAComprehensiveResults } from '@/types/fdaEnhanced';

interface UseFDAComprehensiveSearchOptions {
  enabled?: boolean;
}

export function useFDAComprehensiveSearch(
  params: FDAMultiSearchParams,
  options: UseFDAComprehensiveSearchOptions = {}
) {
  return useQuery<FDAComprehensiveResults>({
    queryKey: ['fda-comprehensive-search', params],
    queryFn: async (): Promise<FDAComprehensiveResults> => {
      console.log('[useFDAComprehensiveSearch] Starting comprehensive search:', params);
      
      const { data, error } = await supabase.functions.invoke('fda-comprehensive-search', {
        body: params
      });

      if (error) {
        console.error('[useFDAComprehensiveSearch] Error from search function:', error);
        throw new Error(`FDA comprehensive search failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('[useFDAComprehensiveSearch] Search returned error:', data.error);
        throw new Error(`FDA API error: ${data.error}`);
      }

      console.log('[useFDAComprehensiveSearch] Search completed:', {
        totalDevices: data.data.aggregatedStats.totalDevices,
        totalManufacturers: data.data.aggregatedStats.totalManufacturers,
        queryTime: data.data.searchMetadata.queryTime
      });

      return data.data;
    },
    enabled: Boolean(
      (params.keywords && params.keywords.length > 0) ||
      (params.productCodes && params.productCodes.length > 0) ||
      params.applicant ||
      params.brandName ||
      params.companyName ||
      params.emdnCode
    ) && (options.enabled !== false),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
  });
}