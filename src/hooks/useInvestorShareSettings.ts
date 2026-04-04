import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateMarketplaceSlug } from "@/services/investorShareService";

export interface PhaseDateEntry {
  phaseId: string;
  startDate: string;
  endDate: string;
}

// Visibility settings that can be toggled on/off
export interface VisibilitySettings {
  show_viability_score: boolean;
  show_technical_specs: boolean;
  show_media_gallery: boolean;
  show_business_canvas: boolean;
  show_roadmap: boolean;
  show_team_profile: boolean;
  show_venture_blueprint: boolean;
  show_market_sizing: boolean;
  show_reimbursement_strategy: boolean;
  show_team_gaps: boolean;
  show_regulatory_timeline: boolean;
  show_clinical_evidence: boolean;
  show_readiness_gates: boolean;
  show_gtm_strategy: boolean;
  show_key_risks: boolean;
  show_manufacturing: boolean;
  show_unit_economics: boolean;
  show_use_of_proceeds: boolean;
  show_exit_strategy: boolean;
}

// Marketplace-specific visibility settings (mp_ prefix)
export interface MarketplaceVisibilitySettings {
  mp_show_viability_score: boolean;
  mp_show_technical_specs: boolean;
  mp_show_media_gallery: boolean;
  mp_show_business_canvas: boolean;
  mp_show_roadmap: boolean;
  mp_show_team_profile: boolean;
  mp_show_venture_blueprint: boolean;
  mp_show_market_sizing: boolean;
  mp_show_reimbursement_strategy: boolean;
  mp_show_team_gaps: boolean;
  mp_show_regulatory_timeline: boolean;
  mp_show_clinical_evidence: boolean;
  mp_show_readiness_gates: boolean;
  mp_show_gtm_strategy: boolean;
  mp_show_key_risks: boolean;
  mp_show_manufacturing: boolean;
  mp_show_unit_economics: boolean;
  mp_show_use_of_proceeds: boolean;
  mp_show_exit_strategy: boolean;
}

export interface InvestorShareSettings extends VisibilitySettings, MarketplaceVisibilitySettings {
  id: string;
  company_id: string;
  is_active: boolean;
  public_slug: string | null;
  access_code_hash: string | null;
  expires_at: string | null;
  // Monitor dashboard settings (post-investment, not for Genesis launch)
  show_rnpv: boolean;
  show_burn_rate: boolean;
  show_clinical_enrollment: boolean;
  show_regulatory_status_map: boolean;
  auto_grant_monitor_access: boolean;
  current_phase: string | null;
  featured_product_id: string | null;
  // Marketplace settings
  list_on_marketplace: boolean;
  marketplace_listed_at: string | null;
  marketplace_categories: string[];
  marketplace_expires_at: string | null;
  marketplace_slug: string | null;  // Separate slug for marketplace URL
  view_count: number;
  phase_dates: PhaseDateEntry[];
  timeline_auto_sync: boolean;
  // Funding requirements for investor sharing
  funding_amount: number | null;
  funding_currency: string | null;
  funding_stage: string | null;
  // Funding requirements for marketplace (separate from investor)
  mp_funding_amount: number | null;
  mp_funding_currency: string | null;
  mp_funding_stage: string | null;
  created_at: string;
  updated_at: string;
}

// Default values for investor sharing (more disclosure)
export const INVESTOR_VISIBILITY_DEFAULTS: VisibilitySettings = {
  show_viability_score: true,
  show_technical_specs: true,
  show_media_gallery: true,
  show_business_canvas: true,
  show_roadmap: true,
  show_team_profile: false,
  show_venture_blueprint: true,
  show_market_sizing: true,
  show_reimbursement_strategy: true,
  show_team_gaps: false,
  show_regulatory_timeline: true,
  show_clinical_evidence: true,
  show_readiness_gates: true,
  show_gtm_strategy: true,
  show_key_risks: false,
  show_manufacturing: false,
  show_unit_economics: false,
  show_use_of_proceeds: true,
  show_exit_strategy: true,
};

// Default values for marketplace listing (limited disclosure to protect IP)
export const MARKETPLACE_VISIBILITY_DEFAULTS: MarketplaceVisibilitySettings = {
  mp_show_viability_score: false,
  mp_show_technical_specs: false,
  mp_show_media_gallery: true,  // Photos help discovery
  mp_show_business_canvas: false,
  mp_show_roadmap: false,
  mp_show_team_profile: false,
  mp_show_venture_blueprint: false,
  mp_show_market_sizing: false,
  mp_show_reimbursement_strategy: false,
  mp_show_team_gaps: false,
  mp_show_regulatory_timeline: false,
  mp_show_clinical_evidence: false,
  mp_show_readiness_gates: false,
  mp_show_gtm_strategy: false,
  mp_show_key_risks: false,
  mp_show_manufacturing: false,
  mp_show_unit_economics: false,
  mp_show_use_of_proceeds: false,
  mp_show_exit_strategy: false,
};

export function useInvestorShareSettings(companyId: string | undefined, productId?: string | undefined) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["investor-share-settings", companyId, productId],
    queryFn: async () => {
      if (!companyId) return null;

      // If productId is provided, fetch settings for that specific product
      // Otherwise, fetch the first/default settings for the company
      let query = supabase
        .from("company_investor_share_settings")
        .select("*")
        .eq("company_id", companyId);

      if (productId) {
        query = query.eq("featured_product_id", productId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      
      // Parse phase_dates from JSON and set defaults for all settings
      const parsedData = data ? {
        ...data,
        phase_dates: Array.isArray(data.phase_dates)
          ? (data.phase_dates as unknown as PhaseDateEntry[])
          : [],
        timeline_auto_sync: data.timeline_auto_sync ?? true,

        // Investor visibility defaults (full disclosure)
        show_viability_score: (data as any).show_viability_score ?? INVESTOR_VISIBILITY_DEFAULTS.show_viability_score,
        show_technical_specs: (data as any).show_technical_specs ?? INVESTOR_VISIBILITY_DEFAULTS.show_technical_specs,
        show_media_gallery: (data as any).show_media_gallery ?? INVESTOR_VISIBILITY_DEFAULTS.show_media_gallery,
        show_business_canvas: (data as any).show_business_canvas ?? INVESTOR_VISIBILITY_DEFAULTS.show_business_canvas,
        show_roadmap: (data as any).show_roadmap ?? INVESTOR_VISIBILITY_DEFAULTS.show_roadmap,
        show_team_profile: (data as any).show_team_profile ?? INVESTOR_VISIBILITY_DEFAULTS.show_team_profile,
        show_venture_blueprint: (data as any).show_venture_blueprint ?? INVESTOR_VISIBILITY_DEFAULTS.show_venture_blueprint,
        show_market_sizing: (data as any).show_market_sizing ?? INVESTOR_VISIBILITY_DEFAULTS.show_market_sizing,
        show_reimbursement_strategy: (data as any).show_reimbursement_strategy ?? INVESTOR_VISIBILITY_DEFAULTS.show_reimbursement_strategy,
        show_team_gaps: (data as any).show_team_gaps ?? INVESTOR_VISIBILITY_DEFAULTS.show_team_gaps,
        show_regulatory_timeline: (data as any).show_regulatory_timeline ?? INVESTOR_VISIBILITY_DEFAULTS.show_regulatory_timeline,
        show_clinical_evidence: (data as any).show_clinical_evidence ?? INVESTOR_VISIBILITY_DEFAULTS.show_clinical_evidence,
        show_readiness_gates: (data as any).show_readiness_gates ?? INVESTOR_VISIBILITY_DEFAULTS.show_readiness_gates,
        show_gtm_strategy: (data as any).show_gtm_strategy ?? INVESTOR_VISIBILITY_DEFAULTS.show_gtm_strategy,
        show_key_risks: (data as any).show_key_risks ?? INVESTOR_VISIBILITY_DEFAULTS.show_key_risks,
        show_manufacturing: (data as any).show_manufacturing ?? INVESTOR_VISIBILITY_DEFAULTS.show_manufacturing,
        show_unit_economics: (data as any).show_unit_economics ?? INVESTOR_VISIBILITY_DEFAULTS.show_unit_economics,
        show_use_of_proceeds: (data as any).show_use_of_proceeds ?? INVESTOR_VISIBILITY_DEFAULTS.show_use_of_proceeds,
        show_exit_strategy: (data as any).show_exit_strategy ?? INVESTOR_VISIBILITY_DEFAULTS.show_exit_strategy,

        // Marketplace visibility defaults (limited disclosure)
        mp_show_viability_score: (data as any).mp_show_viability_score ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_viability_score,
        mp_show_technical_specs: (data as any).mp_show_technical_specs ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_technical_specs,
        mp_show_media_gallery: (data as any).mp_show_media_gallery ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_media_gallery,
        mp_show_business_canvas: (data as any).mp_show_business_canvas ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_business_canvas,
        mp_show_roadmap: (data as any).mp_show_roadmap ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_roadmap,
        mp_show_team_profile: (data as any).mp_show_team_profile ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_team_profile,
        mp_show_venture_blueprint: (data as any).mp_show_venture_blueprint ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_venture_blueprint,
        mp_show_market_sizing: (data as any).mp_show_market_sizing ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_market_sizing,
        mp_show_reimbursement_strategy: (data as any).mp_show_reimbursement_strategy ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_reimbursement_strategy,
        mp_show_team_gaps: (data as any).mp_show_team_gaps ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_team_gaps,
        mp_show_regulatory_timeline: (data as any).mp_show_regulatory_timeline ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_regulatory_timeline,
        mp_show_clinical_evidence: (data as any).mp_show_clinical_evidence ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_clinical_evidence,
        mp_show_readiness_gates: (data as any).mp_show_readiness_gates ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_readiness_gates,
        mp_show_gtm_strategy: (data as any).mp_show_gtm_strategy ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_gtm_strategy,
        mp_show_key_risks: (data as any).mp_show_key_risks ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_key_risks,
        mp_show_manufacturing: (data as any).mp_show_manufacturing ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_manufacturing,
        mp_show_unit_economics: (data as any).mp_show_unit_economics ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_unit_economics,
        mp_show_use_of_proceeds: (data as any).mp_show_use_of_proceeds ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_use_of_proceeds,
        mp_show_exit_strategy: (data as any).mp_show_exit_strategy ?? MARKETPLACE_VISIBILITY_DEFAULTS.mp_show_exit_strategy,

        // Marketplace expiration and slug
        marketplace_expires_at: (data as any).marketplace_expires_at ?? null,
        marketplace_slug: (data as any).marketplace_slug ?? null,

        // Monitor settings (post-investment feature)
        show_rnpv: (data as any).show_rnpv ?? false,
        show_burn_rate: (data as any).show_burn_rate ?? false,
        show_clinical_enrollment: (data as any).show_clinical_enrollment ?? true,
        show_regulatory_status_map: (data as any).show_regulatory_status_map ?? true,
        auto_grant_monitor_access: (data as any).auto_grant_monitor_access ?? false,
      } as InvestorShareSettings : null;
      
      return parsedData;
    },
    enabled: !!companyId,
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (settingsData: Partial<InvestorShareSettings>) => {
      if (!companyId) throw new Error("Company ID is required");

      // Strip fields that don't exist in the database schema yet
      const { show_exit_strategy, mp_show_exit_strategy, ...cleanedSettings } = settingsData as any;

      // Determine the product ID to use (from settingsData or from hook parameter)
      const targetProductId = cleanedSettings.featured_product_id || productId;

      // Check if a record already exists for this company+product combination
      let existingRecord = null;
      if (targetProductId) {
        const { data: existing } = await supabase
          .from("company_investor_share_settings")
          .select("id")
          .eq("company_id", companyId)
          .eq("featured_product_id", targetProductId)
          .maybeSingle();
        existingRecord = existing;
      } else {
        // If no product ID, check for company-level record
        const { data: existing } = await supabase
          .from("company_investor_share_settings")
          .select("id")
          .eq("company_id", companyId)
          .is("featured_product_id", null)
          .maybeSingle();
        existingRecord = existing;
      }

      let data, error;

      if (existingRecord) {
        // Update existing record
        const result = await supabase
          .from("company_investor_share_settings")
          .update({
            ...cleanedSettings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRecord.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new record - set is_active to true by default for new marketplace listings
        const result = await supabase
          .from("company_investor_share_settings")
          .insert({
            company_id: companyId,
            featured_product_id: targetProductId || null,
            is_active: true, // Required for Deal Flow visibility
            ...cleanedSettings,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor-share-settings", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company-marketplace-listings", companyId] });
      toast.success("Share settings updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!companyId || !settings?.id) throw new Error("Settings not found");

      const { data, error } = await supabase
        .from("company_investor_share_settings")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: ["investor-share-settings", companyId] });
      toast.success(isActive ? "Investor share link activated" : "Investor share link deactivated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle share link: ${error.message}`);
    },
  });

  const toggleMarketplaceMutation = useMutation({
    mutationFn: async (listOnMarketplace: boolean) => {
      if (!companyId || !settings?.id) throw new Error("Settings not found");

      const updateData: any = {
        list_on_marketplace: listOnMarketplace,
        updated_at: new Date().toISOString(),
      };

      // Set marketplace_listed_at when first listing
      if (listOnMarketplace && !settings.marketplace_listed_at) {
        updateData.marketplace_listed_at = new Date().toISOString();
      }

      // Auto-generate marketplace_slug if missing when listing on marketplace
      if (listOnMarketplace && !settings.marketplace_slug) {
        updateData.marketplace_slug = generateMarketplaceSlug();
      }

      const { data, error } = await supabase
        .from("company_investor_share_settings")
        .update(updateData)
        .eq("id", settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, listOnMarketplace) => {
      queryClient.invalidateQueries({ queryKey: ["investor-share-settings", companyId] });
      toast.success(listOnMarketplace ? "Listed on marketplace" : "Removed from marketplace");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update marketplace listing: ${error.message}`);
    },
  });

  // Memoized helper to extract investor visibility settings
  const getInvestorVisibility = useCallback((): VisibilitySettings | null => {
    if (!settings) return null;
    return {
      show_viability_score: settings.show_viability_score,
      show_technical_specs: settings.show_technical_specs,
      show_media_gallery: settings.show_media_gallery,
      show_business_canvas: settings.show_business_canvas,
      show_roadmap: settings.show_roadmap,
      show_team_profile: settings.show_team_profile,
      show_venture_blueprint: settings.show_venture_blueprint,
      show_market_sizing: settings.show_market_sizing,
      show_reimbursement_strategy: settings.show_reimbursement_strategy,
      show_team_gaps: settings.show_team_gaps,
      show_regulatory_timeline: settings.show_regulatory_timeline,
      show_clinical_evidence: settings.show_clinical_evidence,
      show_readiness_gates: settings.show_readiness_gates,
      show_gtm_strategy: settings.show_gtm_strategy,
      show_key_risks: settings.show_key_risks,
      show_manufacturing: settings.show_manufacturing,
      show_unit_economics: settings.show_unit_economics,
      show_use_of_proceeds: settings.show_use_of_proceeds,
      show_exit_strategy: settings.show_exit_strategy,
    };
  }, [settings]);

  // Memoized helper to extract marketplace visibility settings (without mp_ prefix for easier use)
  const getMarketplaceVisibility = useCallback((): VisibilitySettings | null => {
    if (!settings) return null;
    return {
      show_viability_score: settings.mp_show_viability_score,
      show_technical_specs: settings.mp_show_technical_specs,
      show_media_gallery: settings.mp_show_media_gallery,
      show_business_canvas: settings.mp_show_business_canvas,
      show_roadmap: settings.mp_show_roadmap,
      show_team_profile: settings.mp_show_team_profile,
      show_venture_blueprint: settings.mp_show_venture_blueprint,
      show_market_sizing: settings.mp_show_market_sizing,
      show_reimbursement_strategy: settings.mp_show_reimbursement_strategy,
      show_team_gaps: settings.mp_show_team_gaps,
      show_regulatory_timeline: settings.mp_show_regulatory_timeline,
      show_clinical_evidence: settings.mp_show_clinical_evidence,
      show_readiness_gates: settings.mp_show_readiness_gates,
      show_gtm_strategy: settings.mp_show_gtm_strategy,
      show_key_risks: settings.mp_show_key_risks,
      show_manufacturing: settings.mp_show_manufacturing,
      show_unit_economics: settings.mp_show_unit_economics,
      show_use_of_proceeds: settings.mp_show_use_of_proceeds,
      show_exit_strategy: settings.mp_show_exit_strategy,
    };
  }, [settings]);

  return {
    settings,
    isLoading,
    createOrUpdate: createOrUpdateMutation.mutate,
    createOrUpdateAsync: createOrUpdateMutation.mutateAsync,
    isUpdating: createOrUpdateMutation.isPending,
    toggleActive: toggleActiveMutation.mutate,
    isTogglingActive: toggleActiveMutation.isPending,
    toggleMarketplace: toggleMarketplaceMutation.mutate,
    isTogglingMarketplace: toggleMarketplaceMutation.isPending,
    // Helpers
    getInvestorVisibility,
    getMarketplaceVisibility,
  };
}
