import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClinicalEvidence(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["clinical-evidence", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_clinical_evidence_plan")
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
        const { error } = await supabase.from("product_clinical_evidence_plan").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_clinical_evidence_plan").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-evidence", productId] });
      // Also invalidate funnel progress query so checklist updates
      queryClient.invalidateQueries({ queryKey: ["funnel-evidence", productId] });
    },
  });

  return { data, isLoading, save: mutation.mutateAsync, isSaving: mutation.isPending };
}
