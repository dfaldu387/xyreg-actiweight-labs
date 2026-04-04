import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChangelogEntry {
  version: string;
  release_date: string;
  changelog: string | null;
  impacted_module_groups: string[] | null;
}

export function useCumulativeChangelog(fromReleaseDate: string | null, toReleaseDate: string | null) {
  return useQuery({
    queryKey: ['cumulative-changelog', fromReleaseDate, toReleaseDate],
    queryFn: async (): Promise<ChangelogEntry[]> => {
      if (!fromReleaseDate || !toReleaseDate) return [];

      const { data, error } = await (supabase as any)
        .from('xyreg_releases')
        .select('version, release_date, changelog, impacted_module_groups')
        .eq('status', 'published')
        .gt('release_date', fromReleaseDate)
        .lte('release_date', toReleaseDate)
        .order('release_date', { ascending: true });

      if (error || !data) return [];
      return data;
    },
    enabled: !!fromReleaseDate && !!toReleaseDate,
    staleTime: 5 * 60 * 1000,
  });
}
