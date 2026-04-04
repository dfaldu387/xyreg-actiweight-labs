import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTeamGaps(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["team-gaps", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_team_gaps")
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
        const { error } = await supabase.from("product_team_gaps").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_team_gaps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-gaps", productId] }),
  });

  return { data, isLoading, save: mutation.mutateAsync, isSaving: mutation.isPending };
}
