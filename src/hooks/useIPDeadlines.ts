import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type IPDeadlineRow = Database['public']['Tables']['ip_deadlines']['Row'];
type IPDeadlineInsert = Database['public']['Tables']['ip_deadlines']['Insert'];
type IPDeadlineUpdate = Database['public']['Tables']['ip_deadlines']['Update'];

export type IPDeadline = IPDeadlineRow & {
  ip_asset?: {
    title: string;
    ip_type: string;
    company_id: string;
  } | null;
};

export function useIPDeadlines(companyId: string | undefined) {
  return useQuery({
    queryKey: ['ip-deadlines', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('ip_deadlines')
        .select(`
          *,
          ip_asset:ip_assets!inner(title, ip_type, company_id)
        `)
        .eq('ip_asset.company_id', companyId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as IPDeadline[];
    },
    enabled: !!companyId,
  });
}

export function useUpcomingDeadlines(companyId: string | undefined, days: number = 90) {
  return useQuery({
    queryKey: ['ip-deadlines-upcoming', companyId, days],
    queryFn: async () => {
      if (!companyId) return [];
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const { data, error } = await supabase
        .from('ip_deadlines')
        .select(`
          *,
          ip_asset:ip_assets!inner(title, ip_type, company_id)
        `)
        .eq('ip_asset.company_id', companyId)
        .eq('status', 'upcoming')
        .lte('due_date', futureDate.toISOString())
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as IPDeadline[];
    },
    enabled: !!companyId,
  });
}

export function useCreateIPDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: IPDeadlineInsert) => {
      const { data, error } = await supabase
        .from('ip_deadlines')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['ip-deadlines-upcoming'] });
    },
  });
}

export function useUpdateIPDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: IPDeadlineUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ip_deadlines')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['ip-deadlines-upcoming'] });
    },
  });
}
