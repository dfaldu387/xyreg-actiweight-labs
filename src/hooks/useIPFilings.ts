import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type IPFilingRow = Database['public']['Tables']['ip_filings']['Row'];
type IPFilingInsert = Database['public']['Tables']['ip_filings']['Insert'];
type IPFilingUpdate = Database['public']['Tables']['ip_filings']['Update'];

export type IPFiling = IPFilingRow & {
  ip_asset?: {
    title: string;
    ip_type: string;
    company_id: string;
  } | null;
};

export function useIPFilings(assetId: string | undefined) {
  return useQuery({
    queryKey: ['ip-filings', assetId],
    queryFn: async () => {
      if (!assetId) return [];
      
      const { data, error } = await supabase
        .from('ip_filings')
        .select('*')
        .eq('ip_asset_id', assetId)
        .order('filing_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!assetId,
  });
}

export function useCompanyIPFilings(companyId: string | undefined) {
  return useQuery({
    queryKey: ['ip-filings-company', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('ip_filings')
        .select(`
          *,
          ip_asset:ip_assets!inner(title, ip_type, company_id)
        `)
        .eq('ip_asset.company_id', companyId)
        .order('filing_date', { ascending: false });

      if (error) throw error;
      return data as IPFiling[];
    },
    enabled: !!companyId,
  });
}

export function useCreateIPFiling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: IPFilingInsert) => {
      const { data, error } = await supabase
        .from('ip_filings')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ip-filings', data.ip_asset_id] });
      queryClient.invalidateQueries({ queryKey: ['ip-filings-company'] });
    },
  });
}

export function useUpdateIPFiling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: IPFilingUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ip_filings')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-filings'] });
      queryClient.invalidateQueries({ queryKey: ['ip-filings-company'] });
    },
  });
}
