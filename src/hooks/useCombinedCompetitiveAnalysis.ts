import { useQuery } from '@tanstack/react-query';
import { combinedCompetitiveAnalysisService, type CombinedCompetitiveAnalysis } from '@/services/combinedCompetitiveAnalysisService';

interface UseCombinedCompetitiveAnalysisOptions {
  enabled?: boolean;
}

export function useCombinedCompetitiveAnalysis(
  emdnCode?: string,
  fdaProductCode?: string,
  searchQuery?: string,
  options: UseCombinedCompetitiveAnalysisOptions = {}
) {
  return useQuery<CombinedCompetitiveAnalysis>({
    queryKey: ['combined-competitive-analysis', emdnCode, fdaProductCode, searchQuery],
    queryFn: async (): Promise<CombinedCompetitiveAnalysis> => {
      console.log('[useCombinedCompetitiveAnalysis] Starting combined analysis:', {
        emdnCode,
        fdaProductCode,
        searchQuery
      });
      
      // Add timeout wrapper to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000);
      });
      
      const analysisPromise = combinedCompetitiveAnalysisService.analyzeCombinedMarket(
        emdnCode, 
        fdaProductCode, 
        searchQuery
      );
      
      const result = await Promise.race([analysisPromise, timeoutPromise]);
      
      console.log('[useCombinedCompetitiveAnalysis] Analysis completed:', {
        totalCompetitors: result.totalCompetitors,
        euDevices: result.market_sources.eu,
        usDevices: result.market_sources.us,
        globalCompetitors: result.cross_market_insights.global_competitors.length
      });
      
      return result;
    },
    enabled: Boolean(emdnCode || fdaProductCode) && (options.enabled !== false),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 1, // Reduced from 2 to fail faster
    retryDelay: 1000, // Wait 1 second before retry
  });
}