import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StandardVersionStatus {
  id: string;
  framework_key: string;
  standard_name: string;
  status: string;
  successor_name: string | null;
  iso_url: string | null;
  last_checked_at: string;
}

export function useStandardVersionStatus() {
  return useQuery({
    queryKey: ["standard-version-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standard_version_status" as any)
        .select("*");
      if (error) throw error;
      return (data || []) as unknown as StandardVersionStatus[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - rarely changes
  });
}

export function useStandardStatus(frameworkKey: string | undefined) {
  const { data: allStatuses, isLoading } = useStandardVersionStatus();

  const status = frameworkKey
    ? allStatuses?.find((s) => s.framework_key === frameworkKey)
    : undefined;

  return { status, isLoading };
}
