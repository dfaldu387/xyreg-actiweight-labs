import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EmdnCode {
  code: string;
  description: string;
}

/**
 * Hook to fetch and cache EMDN codes by prefix letter.
 * This caches all codes for a given prefix letter (e.g., 'A', 'B', 'C'),
 * so multiple lookups for codes starting with the same letter share the cache.
 */
export function useEmdnCodesByPrefix(prefixLetter: string | undefined) {
  return useQuery({
    queryKey: ['emdn-codes-by-prefix', prefixLetter?.toUpperCase()],
    queryFn: async (): Promise<EmdnCode[]> => {
      if (!prefixLetter) return [];

      const { data, error } = await supabase.rpc('get_eudamed_emdn_codes_by_prefix', {
        prefix_letter: prefixLetter.toUpperCase()
      });

      if (error) {
        console.warn(`[useEmdnCodesByPrefix] Error fetching EMDN codes for prefix ${prefixLetter}:`, error);
        return [];
      }

      return (data || []).map((item: any) => ({
        code: item.code,
        description: item.description
      }));
    },
    enabled: Boolean(prefixLetter),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour - EMDN codes rarely change
    gcTime: 2 * 60 * 60 * 1000, // Keep in cache for 2 hours
  });
}

/**
 * Helper function to find a specific EMDN code from the prefix-cached data
 */
export function findEmdnCodeInData(codes: EmdnCode[], targetCode: string): EmdnCode | undefined {
  return codes.find(item => item.code === targetCode);
}
