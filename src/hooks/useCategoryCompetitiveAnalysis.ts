import { useQuery } from '@tanstack/react-query';
import { categoryCompetitiveAnalysisService, type CategoryAnalysisResults } from '@/services/categoryCompetitiveAnalysisService';

interface UseCategoryAnalysisOptions {
  enabled?: boolean;
}

export function useCategoryCompetitiveAnalysis(
  categoryCode: string | undefined,
  options: UseCategoryAnalysisOptions = {}
) {
  return useQuery<CategoryAnalysisResults>({
    queryKey: ['category-competitive-analysis', categoryCode],
    queryFn: async (): Promise<CategoryAnalysisResults> => {
      if (!categoryCode) {
        throw new Error('Category code is required for analysis');
      }
      console.log('[useCategoryCompetitiveAnalysis] Starting analysis for category:', categoryCode);
      const result = await categoryCompetitiveAnalysisService.analyzeByCategoryCode(categoryCode);
      console.log('[useCategoryCompetitiveAnalysis] Analysis completed:', {
        isValidCode: result.isValidCode,
        euCompetitors: result.summary.uniqueEuCompanies,
        usCompetitors: result.summary.uniqueUsCompanies,
        globalPlayers: result.summary.globalPlayers.length
      });
      return result;
    },
    enabled: Boolean(categoryCode) && (options.enabled !== false),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
  });
}