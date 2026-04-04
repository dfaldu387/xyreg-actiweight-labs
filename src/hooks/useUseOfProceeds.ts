import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseOfProceeds {
  id: string;
  product_id: string;
  company_id: string;
  rd_percent: number | null;
  rd_activities: string | null;
  regulatory_percent: number | null;
  regulatory_activities: string | null;
  team_percent: number | null;
  team_activities: string | null;
  commercial_percent: number | null;
  commercial_activities: string | null;
  operations_percent: number | null;
  operations_activities: string | null;
  total_raise_amount: number | null;
  raise_currency: string;
}

export function useUseOfProceeds(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["use-of-proceeds", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_use_of_proceeds")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return data as UseOfProceeds | null;
    },
    enabled: !!productId,
    refetchOnMount: 'always', // Always refetch when component mounts to get latest data
    staleTime: 0, // Consider data always stale to ensure fresh fetch
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<UseOfProceeds>) => {
      const payload = { ...updates, product_id: productId, company_id: companyId };

      // Use upsert to handle both insert and update in one operation
      // This avoids race conditions when rapid saves happen before query refetch
      const { error } = await supabase
        .from("product_use_of_proceeds")
        .upsert(payload, { onConflict: 'product_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["use-of-proceeds", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-use-of-proceeds", productId] });
    },
  });

  return {
    data,
    isLoading,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
