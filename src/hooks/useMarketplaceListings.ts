import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MarketplaceListing } from "@/types/investor";

export type DealCategory = 'public' | 'invited' | 'all' | 'portfolio';
export type InvestorStatus = 'invested' | 'watching' | 'interested' | 'passed';

export type TimeFilter = 'all' | 'last7days' | 'last30days';

export interface MarketplaceFilters {
  deviceClass?: string;
  targetMarkets?: string[];
  deviceCategory?: string;
  developmentPhase?: string;
  viabilityScoreMin?: number;
  viabilityScoreMax?: number;
  dealCategory?: DealCategory;
  investorStatus?: InvestorStatus;
  fundingStage?: string;
  timeFilter?: TimeFilter;
}

interface ListingsOptions {
  invitedShareSettingsIds?: string[];
  invitedCompanyIds?: string[];
  investorProfileId?: string;
}

export function useMarketplaceListings(
  filters: MarketplaceFilters = {}, 
  options: ListingsOptions = {}
) {
  const { invitedShareSettingsIds = [], invitedCompanyIds = [], investorProfileId } = options;

  return useQuery({
    queryKey: ["marketplace-listings", filters, invitedShareSettingsIds, invitedCompanyIds, investorProfileId],
    queryFn: async () => {
      // Determine which listings to fetch based on deal category
      const dealCategory = filters.dealCategory || 'public';
      
      let allListings: any[] = [];

      // Fetch public listings if category is 'public', 'all', or 'portfolio'
      if (dealCategory === 'public' || dealCategory === 'all' || dealCategory === 'portfolio') {
        const { data: publicSettings, error: publicError } = await supabase
          .from("company_investor_share_settings")
          .select(`
            id,
            company_id,
            public_slug,
            is_active,
            list_on_marketplace,
            marketplace_listed_at,
            marketplace_categories,
            marketplace_expires_at,
            marketplace_slug,
            view_count,
            current_phase,
            featured_product_id,
            funding_amount,
            funding_currency,
            funding_stage,
            mp_funding_amount,
            mp_funding_currency,
            mp_funding_stage,
            mp_show_viability_score,
            mp_show_technical_specs,
            mp_show_media_gallery,
            mp_show_business_canvas,
            mp_show_roadmap,
            mp_show_team_profile,
            mp_show_venture_blueprint,
            mp_show_market_sizing,
            mp_show_reimbursement_strategy,
            mp_show_team_gaps,
            mp_show_regulatory_timeline,
            mp_show_clinical_evidence,
            mp_show_readiness_gates,
            mp_show_gtm_strategy,
            mp_show_key_risks,
            mp_show_manufacturing,
            mp_show_unit_economics,
            mp_show_use_of_proceeds,
            companies!inner (
              id,
              name,
              logo_url,
              description
            )
          `)
          .eq("is_active", true)
          .eq("list_on_marketplace", true)
          .not("marketplace_slug", "is", null)
          .order("marketplace_listed_at", { ascending: false, nullsFirst: false });

        if (publicError) throw publicError;

        // Filter out expired marketplace listings
        const now = new Date();
        const activeListings = (publicSettings || []).filter(listing => {
          if (!listing.marketplace_expires_at) return true;
          return new Date(listing.marketplace_expires_at) > now;
        });

        allListings = [...activeListings];
      }

      // Fetch invited-only listings if category is 'invited', 'all', or 'portfolio'
      if ((dealCategory === 'invited' || dealCategory === 'all' || dealCategory === 'portfolio') &&
          (invitedShareSettingsIds.length > 0 || invitedCompanyIds.length > 0)) {
        
        // Fetch by share settings IDs
        if (invitedShareSettingsIds.length > 0) {
          const { data: invitedBySettings, error: invitedError } = await supabase
            .from("company_investor_share_settings")
            .select(`
              id,
              company_id,
              public_slug,
              is_active,
              list_on_marketplace,
              marketplace_listed_at,
              marketplace_categories,
              marketplace_expires_at,
              marketplace_slug,
              view_count,
              current_phase,
              featured_product_id,
              funding_amount,
              funding_currency,
              funding_stage,
              mp_funding_amount,
              mp_funding_currency,
              mp_funding_stage,
              mp_show_viability_score,
              mp_show_technical_specs,
              mp_show_media_gallery,
              mp_show_business_canvas,
              mp_show_roadmap,
              mp_show_team_profile,
              mp_show_venture_blueprint,
              mp_show_market_sizing,
              mp_show_reimbursement_strategy,
              mp_show_team_gaps,
              mp_show_regulatory_timeline,
              mp_show_clinical_evidence,
              mp_show_readiness_gates,
              mp_show_gtm_strategy,
              mp_show_key_risks,
              mp_show_manufacturing,
              mp_show_unit_economics,
              mp_show_use_of_proceeds,
              companies!inner (
                id,
                name,
                logo_url,
                description
              )
            `)
            .eq("is_active", true)
            .in("id", invitedShareSettingsIds);

          if (invitedError) {
            console.error("Error fetching invited settings:", invitedError);
          } else if (invitedBySettings) {
            // Add invited listings, avoiding duplicates
            const existingIds = new Set(allListings.map(l => l.id));
            invitedBySettings.forEach(listing => {
              if (!existingIds.has(listing.id)) {
                allListings.push({ ...listing, isInvited: true });
              }
            });
          }
        }

        // Fetch by company IDs
        if (invitedCompanyIds.length > 0) {
          const { data: invitedByCompany, error: companyError } = await supabase
            .from("company_investor_share_settings")
            .select(`
              id,
              company_id,
              public_slug,
              is_active,
              list_on_marketplace,
              marketplace_listed_at,
              marketplace_categories,
              marketplace_expires_at,
              marketplace_slug,
              view_count,
              current_phase,
              featured_product_id,
              funding_amount,
              funding_currency,
              funding_stage,
              mp_funding_amount,
              mp_funding_currency,
              mp_funding_stage,
              mp_show_viability_score,
              mp_show_technical_specs,
              mp_show_media_gallery,
              mp_show_business_canvas,
              mp_show_roadmap,
              mp_show_team_profile,
              mp_show_venture_blueprint,
              mp_show_market_sizing,
              mp_show_reimbursement_strategy,
              mp_show_team_gaps,
              mp_show_regulatory_timeline,
              mp_show_clinical_evidence,
              mp_show_readiness_gates,
              mp_show_gtm_strategy,
              mp_show_key_risks,
              mp_show_manufacturing,
              mp_show_unit_economics,
              mp_show_use_of_proceeds,
              companies!inner (
                id,
                name,
                logo_url,
                description
              )
            `)
            .eq("is_active", true)
            .in("company_id", invitedCompanyIds);

          if (companyError) {
            console.error("Error fetching by company:", companyError);
          } else if (invitedByCompany) {
            const existingIds = new Set(allListings.map(l => l.id));
            invitedByCompany.forEach(listing => {
              if (!existingIds.has(listing.id)) {
                allListings.push({ ...listing, isInvited: true });
              }
            });
          }
        }
      }

      // For 'invited' category only, filter to just invited listings
      if (dealCategory === 'invited') {
        const invitedIdSet = new Set([...invitedShareSettingsIds]);
        const invitedCompanySet = new Set([...invitedCompanyIds]);
        allListings = allListings.filter(l => 
          invitedIdSet.has(l.id) || invitedCompanySet.has(l.company_id)
        );
      }

      const settings = allListings;

      // Fetch products and viability scores for each listing
      const listingsWithProducts = await Promise.all(
        (settings || []).map(async (setting) => {
          let productData = null;
          let viabilityScore = null;
          let businessCanvas = null;

          if (setting.featured_product_id) {
            // Fetch product details
            const { data: product, error: productError } = await supabase
              .from("products")
              .select("id, name, description, device_category, markets, images")
              .eq("id", setting.featured_product_id)
              .maybeSingle();
            
            if (productError) {
              console.error('Failed to fetch product:', setting.featured_product_id, productError);
            }
            productData = product;

            // Fetch viability scorecard
            const { data: scorecard, error: scorecardError } = await supabase
              .from("product_viability_scorecards")
              .select("total_score")
              .eq("product_id", setting.featured_product_id)
              .maybeSingle();
            
            if (scorecardError) {
              console.error('Failed to fetch scorecard:', setting.featured_product_id, scorecardError);
            }
            viabilityScore = scorecard;

            // Fetch business canvas
            const { data: canvas, error: canvasError } = await supabase
              .from("business_canvas")
              .select("value_propositions")
              .eq("product_id", setting.featured_product_id)
              .maybeSingle();
            
            if (canvasError) {
              console.error('Failed to fetch canvas:', setting.featured_product_id, canvasError);
            }
            businessCanvas = canvas;
          }

          return {
            ...setting,
            products: productData,
            product_viability_scorecards: viabilityScore ? [viabilityScore] : [],
            business_canvas: businessCanvas,
          } as MarketplaceListing;
        })
      );

      // Apply client-side filters
      // First, filter out listings without product data (broken/inaccessible)
      let filteredListings = listingsWithProducts.filter(l => l.products !== null);

      if (filters.deviceClass) {
        filteredListings = filteredListings.filter(
          (l) => l.products?.device_category?.toLowerCase().includes(filters.deviceClass!.toLowerCase())
        );
      }

      if (filters.deviceCategory) {
        filteredListings = filteredListings.filter(
          (l) => l.products?.device_category?.toLowerCase().includes(filters.deviceCategory!.toLowerCase())
        );
      }

      if (filters.developmentPhase) {
        filteredListings = filteredListings.filter(
          (l) => l.current_phase === filters.developmentPhase
        );
      }

      if (filters.viabilityScoreMin !== undefined) {
        filteredListings = filteredListings.filter(
          (l) => (l.product_viability_scorecards?.[0]?.total_score ?? 0) >= filters.viabilityScoreMin!
        );
      }

      if (filters.viabilityScoreMax !== undefined) {
        filteredListings = filteredListings.filter(
          (l) => (l.product_viability_scorecards?.[0]?.total_score ?? 100) <= filters.viabilityScoreMax!
        );
      }

      if (filters.targetMarkets && filters.targetMarkets.length > 0) {
        console.log('🔍 Target Market Filter Active:', filters.targetMarkets);
        
        filteredListings = filteredListings.filter((l) => {
          const markets = l.products?.markets;
          console.log('📦 Product:', l.products?.name, 'Markets:', markets);
          
          if (!markets) {
            console.log('  ❌ No markets data');
            return false;
          }
          
          if (Array.isArray(markets)) {
            // Only match markets that are selected (selected: true) AND code matches exactly
            const result = filters.targetMarkets!.some((targetMarket) => {
              const match = markets.some((m: any) => {
                const isSelected = m.selected === true;
                const codeMatches = m.code === targetMarket;
                console.log(`  Checking filter=${targetMarket} vs market=${m.code}: selected=${isSelected}, codeMatch=${codeMatches}`);
                return isSelected && codeMatches;
              });
              return match;
            });
            console.log('  Final result:', result ? '✅ SHOW' : '❌ HIDE');
            return result;
          }
          
          return false;
        });
      }

      // Filter for portfolio tab (only deals marked as interested, watching, or invested)
      if (dealCategory === 'portfolio' && investorProfileId) {
        const { data: portfolioNotes, error: portfolioError } = await supabase
          .from("investor_deal_notes")
          .select("share_settings_id, status")
          .eq("investor_profile_id", investorProfileId)
          .in("status", ["interested", "watching", "invested"]);

        if (portfolioError) {
          console.error("Error fetching portfolio deals:", portfolioError);
        } else if (portfolioNotes) {
          const portfolioShareIds = new Set(portfolioNotes.map(n => n.share_settings_id));
          filteredListings = filteredListings.filter(l => portfolioShareIds.has(l.id));
        }
      }

      // Filter by investor status if specified (requires fetching deal notes)
      if (filters.investorStatus && investorProfileId) {
        const { data: dealNotes, error: notesError } = await supabase
          .from("investor_deal_notes")
          .select("share_settings_id, status")
          .eq("investor_profile_id", investorProfileId)
          .eq("status", filters.investorStatus);

        if (notesError) {
          console.error("Error fetching deal notes for status filter:", notesError);
        } else if (dealNotes) {
          const matchingShareIds = new Set(dealNotes.map(n => n.share_settings_id));
          filteredListings = filteredListings.filter(l => matchingShareIds.has(l.id));
        }
      }

      // Filter by funding stage (ticket size) - use marketplace funding if available
      if (filters.fundingStage) {
        filteredListings = filteredListings.filter(
          (l) => ((l as any).mp_funding_stage ?? l.funding_stage) === filters.fundingStage
        );
      }

      // Filter by time (recently added)
      if (filters.timeFilter && filters.timeFilter !== 'all') {
        const now = new Date();
        let cutoffDate: Date;

        if (filters.timeFilter === 'last7days') {
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (filters.timeFilter === 'last30days') {
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
          cutoffDate = new Date(0); // epoch - show all
        }

        filteredListings = filteredListings.filter((l) => {
          const listedAt = l.marketplace_listed_at;
          if (!listedAt) return false;
          return new Date(listedAt) >= cutoffDate;
        });
      }

      return filteredListings;
    },
  });
}
