import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';

type FlagRow = { feature_key: string; is_enabled: boolean };

const fetchFlagsForCompany = async (companyId: string): Promise<Record<string, boolean>> => {
  const { data, error } = await (supabase as any)
    .from('customer_feature_flags')
    .select('feature_key, is_enabled')
    .eq('company_id', companyId);

  if (error) {
    // Table missing or RLS blocked — treat as "no overrides" so everything stays ON.
    return {};
  }

  const map: Record<string, boolean> = {};
  ((data ?? []) as FlagRow[]).forEach(row => {
    map[row.feature_key] = row.is_enabled;
  });
  return map;
};

export function useCustomerFeatureFlags(): Record<string, boolean> | undefined {
  const { companyId } = useCurrentCompany();

  const { data: flags } = useQuery({
    queryKey: ['customer-feature-flags', companyId],
    queryFn: () => fetchFlagsForCompany(companyId!),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  return flags;
}

export function useCustomerFeatureFlag(featureKey: string): boolean {
  const { companyId } = useCurrentCompany();

  const { data: flags } = useQuery({
    queryKey: ['customer-feature-flags', companyId],
    queryFn: () => fetchFlagsForCompany(companyId!),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  if (!flags) return true;
  return flags[featureKey] !== false;
}
