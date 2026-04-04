import { useQuery } from '@tanstack/react-query';
import { fdaCompetitiveAnalysisService, type FDASearchParams } from '@/services/fdaCompetitiveAnalysisService';
import { EnhancedCompetitiveAnalysis } from '@/types/fda';

interface UseFDASearchOptions {
  enabled?: boolean;
}

export function useFDADeviceSearch(
  params: FDASearchParams,
  options: UseFDASearchOptions = {}
) {
  return useQuery({
    queryKey: ['fda-device-search', params],
    queryFn: () => fdaCompetitiveAnalysisService.searchFDADevices(params),
    enabled: Boolean(params.searchQuery || params.productCode || params.applicant) && (options.enabled !== false),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
  });
}

export function useEnhancedCompetitiveAnalysis(
  emdnCode: string | undefined,
  searchQuery?: string,
  options: UseFDASearchOptions = {}
) {
  return useQuery<EnhancedCompetitiveAnalysis>({
    queryKey: ['enhanced-competitive-analysis', emdnCode, searchQuery],
    queryFn: async (): Promise<EnhancedCompetitiveAnalysis> => {
      if (!emdnCode) {
        throw new Error('EMDN code is required for enhanced competitive analysis');
      }
      console.log('[useEnhancedCompetitiveAnalysis] Starting analysis for EMDN:', emdnCode);
      const result = await fdaCompetitiveAnalysisService.enhancedCompetitiveAnalysis(emdnCode, searchQuery);
      console.log('[useEnhancedCompetitiveAnalysis] Analysis completed:', {
        euDevices: result.eu_data.total_competitors,
        usDevices: result.us_data.total_devices,
        crossReferences: result.cross_reference_matches.matched_companies.length
      });
      return result;
    },
    enabled: Boolean(emdnCode) && (options.enabled !== false),
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes - longer for enhanced analysis
    gcTime: 45 * 60 * 1000, // Keep in cache for 45 minutes
    retry: 2,
  });
}