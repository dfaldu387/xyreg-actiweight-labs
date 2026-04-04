import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CURRENT_XYREG_RELEASE } from '@/config/xyregRelease';

export interface XyregRelease {
  id: string;
  version: string;
  release_date: string;
  changelog: string | null;
  status: string;
  published_at: string | null;
}

export function useLatestXyregRelease() {
  return useQuery({
    queryKey: ['xyreg-latest-release'],
    queryFn: async (): Promise<{ version: string; date: string }> => {
      const { data, error } = await (supabase as any)
        .from('xyreg_releases')
        .select('version, release_date')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // Fallback to hardcoded config
        return { version: CURRENT_XYREG_RELEASE.version, date: CURRENT_XYREG_RELEASE.date };
      }

      return { version: data.version, date: data.release_date };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
