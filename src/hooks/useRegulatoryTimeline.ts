import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRegulatoryTimeline(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["regulatory-timeline", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_regulatory_timeline")
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
        const { error } = await supabase.from("product_regulatory_timeline").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_regulatory_timeline").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["regulatory-timeline", productId] }),
  });

  return { data, isLoading, save: mutation.mutateAsync, isSaving: mutation.isPending };
}
