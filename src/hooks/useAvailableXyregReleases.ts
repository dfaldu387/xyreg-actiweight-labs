import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface XyregReleaseOption {
  id: string;
  version: string;
  release_date: string;
  changelog: string | null;
}

export function useAvailableXyregReleases() {
  return useQuery({
    queryKey: ['xyreg-available-releases'],
    queryFn: async (): Promise<XyregReleaseOption[]> => {
      const { data, error } = await (supabase as any)
        .from('xyreg_releases')
        .select('id, version, release_date, changelog')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error || !data) return [];
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
