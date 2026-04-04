import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInvestorProfile } from "./useInvestorProfile";

export function useInvitedDeals() {
  const { profile } = useInvestorProfile();

  return useQuery({
    queryKey: ["invited-deals", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { shareSettingsIds: [], companyIds: [] };

      // Get deals where investor has approved monitor access
      const { data: monitorAccess, error: monitorError } = await supabase
        .from("investor_monitor_access")
        .select("share_settings_id, company_id")
        .eq("investor_profile_id", profile.id)
        .eq("status", "approved");

      if (monitorError) {
        console.error("Error fetching monitor access:", monitorError);
      }

      // Get data rooms investor has access to (via company_id)
      const { data: dataRoomAccess, error: dataRoomError } = await supabase
        .from("data_room_access")
        .select("data_room_id, data_rooms!inner(company_id)")
        .eq("investor_email", profile.email || "")
        .eq("status", "approved");

      if (dataRoomError) {
        console.error("Error fetching data room access:", dataRoomError);
      }

      // Collect unique share_settings_ids and company_ids
      const shareSettingsIds = new Set<string>();
      const companyIds = new Set<string>();
      
      monitorAccess?.forEach((item) => {
        if (item.share_settings_id) shareSettingsIds.add(item.share_settings_id);
        if (item.company_id) companyIds.add(item.company_id);
      });
      
      dataRoomAccess?.forEach((item: any) => {
        if (item.data_rooms?.company_id) companyIds.add(item.data_rooms.company_id);
      });

      return {
        shareSettingsIds: Array.from(shareSettingsIds),
        companyIds: Array.from(companyIds),
      };
    },
    enabled: !!profile?.id,
  });
}
