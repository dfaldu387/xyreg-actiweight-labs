
import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OptimizedFetchOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useOptimizedCompanyData(companyId: string, options: OptimizedFetchOptions = {}) {
  return useQueries({
    queries: [
      {
        queryKey: ['company', companyId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();
          
          if (error) throw error;
          return data;
        },
        enabled: !!companyId && (options.enabled ?? true),
        staleTime: options.staleTime ?? 1000 * 60 * 5,
        gcTime: options.gcTime ?? 1000 * 60 * 10,
      },
      {
        queryKey: ['company-products', companyId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_archived', false);
          
          if (error) throw error;
          return data;
        },
        enabled: !!companyId && (options.enabled ?? true),
        staleTime: options.staleTime ?? 1000 * 60 * 3,
        gcTime: options.gcTime ?? 1000 * 60 * 10,
      },
      {
        queryKey: ['company-phases', companyId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('company_chosen_phases')
            .select(`
              *,
              phases (*)
            `)
            .eq('company_id', companyId)
            .order('position');
          
          if (error) throw error;
          return data;
        },
        enabled: !!companyId && (options.enabled ?? true),
        staleTime: options.staleTime ?? 1000 * 60 * 5,
        gcTime: options.gcTime ?? 1000 * 60 * 10,
      }
    ]
  });
}

export function useOptimizedProductData(productId: string, options: OptimizedFetchOptions = {}) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          companies (*),
          lifecycle_phases (*),
          documents (*),
          audits (*)
        `)
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId && (options.enabled ?? true),
    staleTime: options.staleTime ?? 1000 * 60 * 5,
    gcTime: options.gcTime ?? 1000 * 60 * 10,
  });
}
