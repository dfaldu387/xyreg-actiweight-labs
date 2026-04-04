import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMarketSizing(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["market-sizing", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_market_sizing")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = { ...values, product_id: productId, company_id: companyId };
      if (data?.id) {
        const { error } = await supabase.from("product_market_sizing").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_market_sizing").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-sizing", productId] });
      // Also invalidate funnel progress query so checklist updates
      queryClient.invalidateQueries({ queryKey: ["funnel-market-sizing", productId] });
    },
  });

  return { data, isLoading, save: mutation.mutateAsync, isSaving: mutation.isPending };
}
