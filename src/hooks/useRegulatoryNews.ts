import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RegulatoryNewsItem {
  id: string;
  source: string;
  source_name: string;
  title: string;
  summary: string | null;
  url: string | null;
  published_at: string | null;
  scraped_at: string;
  category: string;
  region: string | null;
  relevance_score: number;
  created_at: string;
}

export function useRegulatoryNews(region?: string) {
  return useQuery({
    queryKey: ["regulatory-news", region],
    queryFn: async () => {
      let query = supabase
        .from("regulatory_news_items" as any)
        .select("*")
        .order("published_at", { ascending: false })
        .limit(50);

      if (region && region !== "All") {
        query = query.eq("region", region);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to fetch regulatory news:", error);
        return [];
      }

      return (data || []) as unknown as RegulatoryNewsItem[];
    },
    staleTime: 1000 * 60 * 15,
  });
}
