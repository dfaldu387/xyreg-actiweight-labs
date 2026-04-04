import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdoptedRelease {
  id: string;
  release_id: string;
  version: string;
  release_date: string;
  adopted_at: string;
  status: string;
}

export function useCompanyAdoptedRelease(companyId: string) {
  return useQuery({
    queryKey: ['company-adopted-release', companyId],
    queryFn: async (): Promise<AdoptedRelease | null> => {
      if (!companyId) return null;

      const { data, error } = await (supabase as any)
        .from('company_release_adoptions')
        .select(`
          id,
          release_id,
          adopted_at,
          status,
          xyreg_releases (version, release_date)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        release_id: data.release_id,
        version: data.xyreg_releases?.version ?? '',
        release_date: data.xyreg_releases?.release_date ?? '',
        adopted_at: data.adopted_at,
        status: data.status,
      };
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdoptRelease(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (releaseId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('company_release_adoptions')
        .insert({
          company_id: companyId,
          release_id: releaseId,
          adopted_by: userData?.user?.id ?? null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-adopted-release', companyId] });
    },
  });
}
