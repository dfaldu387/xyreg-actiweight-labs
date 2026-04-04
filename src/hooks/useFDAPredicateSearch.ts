import { useQuery } from '@tanstack/react-query';
import { FDAPredicateService } from '@/services/fdaPredicateService';
import {
  DocumentSearchParams,
  DocumentSearchResult,
  DocumentIntelligence,
  PredicateTrail,
  EUUSBridge
} from '@/types/fdaPredicateTrail';

interface UseFDAPredicateSearchOptions {
  enabled?: boolean;
}

export function useFDAPredicateSearch(
  params: DocumentSearchParams,
  options: UseFDAPredicateSearchOptions = {}
) {
  return useQuery<{
    results: DocumentSearchResult[];
    totalResults: number;
    intelligence: DocumentIntelligence;
  }>({
    queryKey: ['fda-predicate-search', params],
    queryFn: () => FDAPredicateService.searchDocuments(params),
    enabled: Boolean(
      params.query || params.kNumber || params.productCode || params.applicant
    ) && (options.enabled !== false),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
  });
}

export function useFDAPredicateTrail(
  kNumber: string | undefined,
  maxDepth: number = 3,
  options: UseFDAPredicateSearchOptions = {}
) {
  return useQuery<PredicateTrail>({
    queryKey: ['fda-predicate-trail', kNumber, maxDepth],
    queryFn: () => FDAPredicateService.buildPredicateTrail(kNumber!, maxDepth),
    enabled: Boolean(kNumber) && (options.enabled !== false),
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 45 * 60 * 1000, // Keep in cache for 45 minutes
    retry: 2,
  });
}

export function useFDAEUUSBridge(
  eudamedDeviceId: string | undefined,
  options: UseFDAPredicateSearchOptions = {}
) {
  return useQuery<EUUSBridge>({
    queryKey: ['fda-eu-us-bridge', eudamedDeviceId],
    queryFn: () => FDAPredicateService.generateEUUSBridge(eudamedDeviceId!),
    enabled: Boolean(eudamedDeviceId) && (options.enabled !== false),
    staleTime: 20 * 60 * 1000, // Cache for 20 minutes - longer for complex analysis
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 2,
  });
}

export function useFDAPredicateRecommendations(
  deviceName: string | undefined,
  deviceClass?: string,
  productCode?: string,
  options: UseFDAPredicateSearchOptions = {}
) {
  return useQuery<Array<{ kNumber: string; confidence: number; reasoning: string }>>({
    queryKey: ['fda-predicate-recommendations', deviceName, deviceClass, productCode],
    queryFn: () => FDAPredicateService.getPredicateRecommendations(deviceName!, deviceClass, productCode),
    enabled: Boolean(deviceName) && (options.enabled !== false),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 2,
  });
}