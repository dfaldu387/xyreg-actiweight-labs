import { useQuery } from '@tanstack/react-query';
import { competitiveAnalysisService, type CompetitiveAnalysis } from '@/services/competitiveAnalysisService';

interface UseCompetitiveAnalysisOptions {
  enabled?: boolean;
}

export function useCompetitiveAnalysis(
  emdnCode: string | undefined,
  options: UseCompetitiveAnalysisOptions = {}
) {
  return useQuery({
    queryKey: ['competitive-analysis', emdnCode],
    queryFn: async (): Promise<CompetitiveAnalysis> => {
      if (!emdnCode) {
        throw new Error('EMDN code is required for competitive analysis');
      }
      console.log('[useCompetitiveAnalysis] Starting analysis for EMDN:', emdnCode);
      const result = await competitiveAnalysisService.analyzeCompetitiveLandscape(emdnCode);
      console.log('[useCompetitiveAnalysis] Analysis completed:', {
        totalCompetitors: result.totalCompetitors,
        uniqueOrganizations: Object.keys(result.competitorsByOrganization || {}).length
      });
      return result;
    },
    enabled: Boolean(emdnCode) && (options.enabled !== false),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
  });
}