import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAvailableMarkets(companyId: string | undefined) {
  return useQuery({
    queryKey: ['available-markets', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      

      // Fetch all products with markets for this company
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, markets')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (error) {
        console.warn('[useAvailableMarkets] Failed to fetch markets:', error);
        return [];
      }

      // Extract unique market codes from all products
      const marketSet = new Set<string>();

      products?.forEach(product => {
        if (!product.markets) return;

        

        // Handle different formats of markets data
        let markets: any[] = [];
        
        if (Array.isArray(product.markets)) {
          markets = product.markets;
        } else if (typeof product.markets === 'string') {
          // Handle comma-separated string format
          try {
            markets = JSON.parse(product.markets);
          } catch {
            markets = product.markets.split(',').map(m => m.trim());
          }
        } else if (typeof product.markets === 'object') {
          // Handle object format
          markets = [product.markets];
        }

        markets.forEach(market => {
          if (typeof market === 'string') {
            marketSet.add(market.toUpperCase());
          } else if (market?.code) {
            marketSet.add(market.code.toUpperCase());
          } else if (market?.name) {
            marketSet.add(market.name.toUpperCase());
          } else if (market?.market) {
            marketSet.add(market.market.toUpperCase());
          }
        });
      });

      const availableMarkets = Array.from(marketSet).sort();
      

      return availableMarkets;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}