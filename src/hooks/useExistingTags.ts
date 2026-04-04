import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useExistingTags(companyId: string | undefined) {
  return useQuery({
    queryKey: ["existing-tags", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("phase_assigned_document_template")
        .select("tags")
        .eq("company_id", companyId)
        .not("tags", "is", null);

      if (error) {
        console.error("Error fetching existing tags:", error);
        return [];
      }

      const tagSet = new Set<string>();
      data?.forEach((row: any) => {
        if (Array.isArray(row.tags)) {
          row.tags.forEach((tag: string) => tagSet.add(tag));
        }
      });

      return Array.from(tagSet).sort();
    },
    enabled: !!companyId,
    staleTime: 30000,
  });
}
