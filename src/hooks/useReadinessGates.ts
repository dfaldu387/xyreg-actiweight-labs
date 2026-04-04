import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReadinessGates(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["readiness-gates", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_readiness_gates")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId && !!companyId,
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      // Guard against undefined values
      if (!productId || !companyId) {
        throw new Error("Product ID and Company ID are required");
      }
      
      const payload = { ...values, product_id: productId, company_id: companyId };
      if (data?.id) {
        const { error } = await supabase.from("product_readiness_gates").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_readiness_gates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readiness-gates", productId] });
      // Also invalidate funnel progress query so checklist updates
      queryClient.invalidateQueries({ queryKey: ["funnel-gates", productId] });
    },
  });

  return { data, isLoading, save: mutation.mutateAsync, isSaving: mutation.isPending };
}
