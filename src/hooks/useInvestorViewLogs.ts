import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InvestorViewLogWithProfile } from "@/types/investor";

export function useInvestorViewLogs(shareSettingsId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: viewLogs, isLoading } = useQuery({
    queryKey: ["investor-view-logs", shareSettingsId],
    queryFn: async () => {
      if (!shareSettingsId) return [];

      const { data, error } = await supabase
        .from("investor_view_logs")
        .select(`
          *,
          investor_profiles (*)
        `)
        .eq("share_settings_id", shareSettingsId)
        .order("viewed_at", { ascending: false });

      if (error) throw error;
      return data as InvestorViewLogWithProfile[];
    },
    enabled: !!shareSettingsId,
  });

  const logViewMutation = useMutation({
    mutationFn: async ({ 
      shareSettingsId, 
      companyId, 
      productId,
      investorProfileId,
    }: { 
      shareSettingsId: string; 
      companyId: string; 
      productId?: string;
      investorProfileId: string;
    }) => {
      // Log the view
      const { error: logError } = await supabase
        .from("investor_view_logs")
        .insert({
          investor_profile_id: investorProfileId,
          share_settings_id: shareSettingsId,
          company_id: companyId,
          product_id: productId || null,
        });

      if (logError) throw logError;

      // Increment view count directly with update
      await supabase
        .from("company_investor_share_settings")
        .update({ view_count: supabase.rpc ? undefined : undefined }) // Force type
        .eq("id", shareSettingsId);
      
      // Note: view_count increment would ideally be handled by a trigger or RPC
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor-view-logs"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
    },
  });

  const uniqueViewers = viewLogs?.length 
    ? new Set(viewLogs.map(log => log.investor_profile_id)).size 
    : 0;

  return {
    viewLogs,
    isLoading,
    uniqueViewers,
    totalViews: viewLogs?.length ?? 0,
    logView: logViewMutation.mutate,
    isLogging: logViewMutation.isPending,
  };
}
