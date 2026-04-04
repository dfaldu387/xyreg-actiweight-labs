import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { capaAggregationService, AggregatedStats, PatternDetectionResult } from '@/services/capaAggregationService';
import { CAPARecord } from '@/types/capa';

/**
 * Hook to get aggregated CAPA statistics across all devices for a company
 */
export function useCAPAAggregatedStats(companyId: string | undefined, useMockData: boolean = true) {
  return useQuery({
    queryKey: ['capa-aggregated-stats', companyId, useMockData],
    queryFn: () => capaAggregationService.getAggregatedStats(companyId!, useMockData),
    enabled: !!companyId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to detect escalation patterns across device-level CAPAs
 */
export function useCAPAPatternDetection(companyId: string | undefined, useMockData: boolean = true) {
  return useQuery({
    queryKey: ['capa-pattern-detection', companyId, useMockData],
    queryFn: () => capaAggregationService.detectEscalationPatterns(companyId!, useMockData),
    enabled: !!companyId,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}

/**
 * Hook to get CAPAs escalated from devices
 */
export function useEscalatedCAPAs(companyId: string | undefined) {
  return useQuery({
    queryKey: ['escalated-capas', companyId],
    queryFn: () => capaAggregationService.getEscalatedCAPAs(companyId!),
    enabled: !!companyId,
    staleTime: 30000,
  });
}

/**
 * Hook to get open CAPAs for aggregation with mock fallback
 */
export function useOpenCAPAsForAggregation(companyId: string | undefined, useMockData: boolean = true) {
  return useQuery({
    queryKey: ['open-capas-aggregation', companyId, useMockData],
    queryFn: () => capaAggregationService.getOpenCAPAsForAggregation(companyId!, useMockData),
    enabled: !!companyId,
    staleTime: 30000,
  });
}

/**
 * Combined hook for company CAPA node aggregation display
 */
export function useCAPACompanyAggregation(companyId: string | undefined, useMockData: boolean = true) {
  const statsQuery = useCAPAAggregatedStats(companyId, useMockData);
  const patternsQuery = useCAPAPatternDetection(companyId, useMockData);
  const escalatedQuery = useEscalatedCAPAs(companyId);
  const openCAPAsQuery = useOpenCAPAsForAggregation(companyId, useMockData);

  return {
    stats: statsQuery.data,
    patterns: patternsQuery.data,
    escalatedCAPAs: escalatedQuery.data,
    openCAPAs: openCAPAsQuery.data,
    isLoading: statsQuery.isLoading || patternsQuery.isLoading || escalatedQuery.isLoading,
    isError: statsQuery.isError || patternsQuery.isError || escalatedQuery.isError,
    refetch: () => {
      statsQuery.refetch();
      patternsQuery.refetch();
      escalatedQuery.refetch();
      openCAPAsQuery.refetch();
    },
  };
}

/**
 * Hook to navigate to CAPA detail page
 */
export function useCAPANavigation() {
  const navigate = useNavigate();

  const navigateToCAPA = (capaId: string) => {
    navigate(`/app/capa/${capaId}`);
  };

  const navigateToCompanyCAPAList = (companyName: string) => {
    navigate(`/app/company/${encodeURIComponent(companyName)}/capa`);
  };

  const navigateToProductCAPAList = (productId: string) => {
    navigate(`/app/product/${productId}/capa`);
  };

  return {
    navigateToCAPA,
    navigateToCompanyCAPAList,
    navigateToProductCAPAList,
  };
}
