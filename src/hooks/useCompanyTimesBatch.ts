import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/context/AuthContext';

export interface CompanyTimeData {
  totalSeconds: number;
  weeklySeconds: number;
}

const EMPTY_TIME: CompanyTimeData = { totalSeconds: 0, weeklySeconds: 0 };

/**
 * Batch-fetches time tracking data for all given company IDs in just 2 queries
 * instead of 2 queries per company (N+1 → 2).
 */
export function useCompanyTimesBatch(companyIds: string[]) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['company-times-batch', userId, companyIds.length],
    queryFn: async (): Promise<Map<string, CompanyTimeData>> => {
      if (!userId || companyIds.length === 0) return new Map();

      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);
      weekStart.setHours(0, 0, 0, 0);

      // Single query: fetch all time entries for all companies at once
      const { data, error } = await (supabase as any)
        .from('user_company_time_entries')
        .select('company_id, duration_seconds, started_at')
        .eq('user_id', userId)
        .in('company_id', companyIds)
        .not('duration_seconds', 'is', null);

      if (error || !data) return new Map();

      // Aggregate in memory
      const result = new Map<string, CompanyTimeData>();
      for (const entry of data as any[]) {
        const cid = entry.company_id;
        const dur = entry.duration_seconds || 0;
        const existing = result.get(cid) || { totalSeconds: 0, weeklySeconds: 0 };
        existing.totalSeconds += dur;
        if (new Date(entry.started_at) >= weekStart) {
          existing.weeklySeconds += dur;
        }
        result.set(cid, existing);
      }

      return result;
    },
    enabled: !!userId && companyIds.length > 0,
    staleTime: 60 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function getCompanyTime(
  timesMap: Map<string, CompanyTimeData> | undefined,
  companyId: string
): CompanyTimeData {
  return timesMap?.get(companyId) || EMPTY_TIME;
}
