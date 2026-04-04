import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { DealStatus } from "./useInvestorDealNotes";

export interface DealStatusMap {
  [shareSettingsId: string]: DealStatus;
}

export function useInvestorDealStatuses() {
  const { user } = useAuth();

  const { data: statusMap, isLoading, error } = useQuery({
    queryKey: ["investor-deal-statuses", user?.id],
    queryFn: async (): Promise<DealStatusMap> => {
      if (!user) return {};

      // First get investor profile
      const { data: profile } = await supabase
        .from("investor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return {};

      // Fetch all deal notes for this investor
      const { data: dealNotes, error } = await supabase
        .from("investor_deal_notes")
        .select("share_settings_id, status")
        .eq("investor_profile_id", profile.id);

      if (error) {
        console.error("Error fetching deal statuses:", error);
        return {};
      }

      // Create a map of share_settings_id -> status
      const map: DealStatusMap = {};
      (dealNotes || []).forEach((note: any) => {
        if (note.share_settings_id && note.status) {
          map[note.share_settings_id] = note.status as DealStatus;
        }
      });

      return map;
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  return {
    statusMap: statusMap || {},
    isLoading,
    error,
  };
}
