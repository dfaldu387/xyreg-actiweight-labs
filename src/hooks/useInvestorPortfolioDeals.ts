import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { DealStatus } from "./useInvestorDealNotes";

export interface PortfolioDeal {
  id: string;
  investor_profile_id: string;
  share_settings_id: string;
  rating: number | null;
  status: DealStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined data from share settings
  share_settings: {
    id: string;
    company_id: string;
    featured_product_id: string | null;
    current_phase: string | null;
    mp_funding_amount: number | null;
    mp_funding_currency: string | null;
    mp_funding_stage: string | null;
    companies: {
      id: string;
      name: string;
      logo_url: string | null;
    };
    products: {
      id: string;
      name: string;
      class: string | null;
      current_lifecycle_phase: string | null;
      images: any[] | null;
      markets: any | null;
      device_category: string | null;
    } | null;
  };
}

export function useInvestorPortfolioDeals() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["investor-portfolio-deals", user?.id],
    queryFn: async () => {
      if (!user) return { invested: [], interested: [], watching: [] };

      // First get investor profile
      const { data: profile } = await supabase
        .from("investor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return { invested: [], interested: [], watching: [] };

      // Fetch all deal notes for this investor with joined data
      const { data: dealNotes, error } = await supabase
        .from("investor_deal_notes")
        .select(`
          id,
          investor_profile_id,
          share_settings_id,
          rating,
          status,
          tags,
          created_at,
          updated_at,
          company_investor_share_settings (
            id,
            company_id,
            featured_product_id,
            current_phase,
            mp_funding_amount,
            mp_funding_currency,
            mp_funding_stage,
            companies (
              id,
              name,
              logo_url
            ),
            products!featured_product_id (
              id,
              name,
              class,
              current_lifecycle_phase,
              images,
              markets,
              device_category
            )
          )
        `)
        .eq("investor_profile_id", profile.id)
        .in("status", ["invested", "interested", "watching"]);

      if (error) {
        console.error("Error fetching portfolio deals:", error);
        throw error;
      }

      // Transform and categorize by status
      const transformedDeals = (dealNotes || [])
        .filter((note: any) => note.company_investor_share_settings) // Filter out notes without share settings
        .map((note: any) => ({
          id: note.id,
          investor_profile_id: note.investor_profile_id,
          share_settings_id: note.share_settings_id,
          rating: note.rating,
          status: note.status as DealStatus,
          tags: note.tags || [],
          created_at: note.created_at,
          updated_at: note.updated_at,
          share_settings: {
            id: note.company_investor_share_settings.id,
            company_id: note.company_investor_share_settings.company_id,
            featured_product_id: note.company_investor_share_settings.featured_product_id,
            current_phase: note.company_investor_share_settings.current_phase,
            mp_funding_amount: note.company_investor_share_settings.mp_funding_amount,
            mp_funding_currency: note.company_investor_share_settings.mp_funding_currency,
            mp_funding_stage: note.company_investor_share_settings.mp_funding_stage,
            companies: note.company_investor_share_settings.companies,
            products: note.company_investor_share_settings.products,
          },
        })) as PortfolioDeal[];

      // Categorize by status
      const invested = transformedDeals.filter(d => d.status === 'invested');
      const interested = transformedDeals.filter(d => d.status === 'interested');
      const watching = transformedDeals.filter(d => d.status === 'watching');

      return { invested, interested, watching };
    },
    enabled: !!user,
  });

  return {
    invested: data?.invested || [],
    interested: data?.interested || [],
    watching: data?.watching || [],
    allDeals: [...(data?.invested || []), ...(data?.interested || []), ...(data?.watching || [])],
    isLoading,
    error,
    refetch,
  };
}
