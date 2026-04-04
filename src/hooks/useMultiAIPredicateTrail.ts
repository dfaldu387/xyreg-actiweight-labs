import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AIPredicateDevice {
  kNumber: string;
  deviceName: string;
  manufacturer: string;
  clearanceDate: string;
  predicateDevices?: AIPredicateDevice[];
  isTerminal?: boolean;
  notes?: string;
}

interface AIPredicateTrail {
  targetDevice: AIPredicateDevice;
  branches: AIPredicateDevice[][];
  summary: string;
  analysisDate: string;
  provider: string;
  confidence?: number;
}

interface MultiAIResponse {
  success: boolean;
  data?: {
    trails: AIPredicateTrail[];
    consensus?: {
      commonFindings: string[];
      conflicts: string[];
      recommendedProvider?: string;
    };
  };
  error?: string;
  message?: string;
}

interface UseMultiAIPredicateTrailOptions {
  enabled?: boolean;
  providers?: string[]; // Optional array to specify which providers to use
}

export function useMultiAIPredicateTrail(
  kNumber: string | undefined,
  companyId: string | undefined,
  options: UseMultiAIPredicateTrailOptions = {}
) {
  return useQuery<MultiAIResponse>({
    queryKey: ['multi-ai-predicate-trail', kNumber, companyId, options.providers],
    queryFn: async () => {
      if (!kNumber || !companyId) {
        throw new Error('K-number and company ID are required');
      }

      const { data, error } = await supabase.functions.invoke('multi-ai-predicate-trail', {
        body: { 
          kNumber, 
          companyId,
          providers: options.providers 
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze predicate trail');
      }

      return data as MultiAIResponse;
    },
    enabled: Boolean(kNumber && companyId) && (options.enabled !== false),
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 45 * 60 * 1000, // Keep in cache for 45 minutes
    retry: 1, // Reduce retries since this is expensive
  });
}

export type { AIPredicateTrail, MultiAIResponse };