import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CMOPartner {
  name: string;
  status: string;
  notes?: string;
}

export interface SingleSourceComponent {
  component: string;
  supplier: string;
  risk_level: "low" | "medium" | "high";
}

interface Manufacturing {
  id: string;
  product_id: string;
  company_id: string;
  current_stage: string | null;
  commercial_location: string | null;
  commercial_model: string | null;
  cmo_partners: CMOPartner[];
  cogs_at_scale: number | null;
  cogs_at_scale_currency: string;
  single_source_components: SingleSourceComponent[];
  supply_chain_risks: string | null;
  notes: string | null;
}

export function useManufacturing(productId: string, companyId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["manufacturing", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_manufacturing")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          cmo_partners: (data.cmo_partners as CMOPartner[]) || [],
          single_source_components: (data.single_source_components as SingleSourceComponent[]) || [],
        } as Manufacturing;
      }
      return null;
    },
    enabled: !!productId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<Manufacturing>) => {
      const payload = { ...updates, product_id: productId, company_id: companyId };

      // Use upsert to handle both insert and update in one operation
      // This avoids race conditions when rapid saves happen before query refetch
      const { error } = await supabase
        .from("product_manufacturing")
        .upsert(payload, { onConflict: 'product_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing", productId] });
      queryClient.invalidateQueries({ queryKey: ["funnel-manufacturing", productId] });
    },
  });

  return {
    data,
    isLoading,
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
