import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isRealRiskClass } from "@/utils/normalizeRiskClass";

export interface FunnelStep {
  step: number;
  title: string;
  description: string;
  isComplete: boolean;
  route: string;
  subTasks?: { label: string; complete: boolean }[];
}

interface FunnelProgress {
  steps: FunnelStep[];
  currentStep: number;
  overallProgress: number;
  isLoading: boolean;
  readinessChecklist: { label: string; labelKey?: string; complete: boolean; route: string }[];
  completionData: {
    hasDeviceName: boolean;
    hasDeviceType: boolean;
    hasPrimaryRegulatoryType: boolean;
    hasInvasivenessLevel: boolean;
    isIVD: boolean; // IVD devices don't require invasiveness
    hasActiveDevice: boolean;
    hasSystemArchitecture: boolean;
    hasTRL: boolean;
    hasIntendedUse: boolean;
    hasDescription: boolean;
    hasMedia: boolean;
    hasCompetitor: boolean;
    hasTAM: boolean;
    hasSAM: boolean;
    hasSOM: boolean;
    hasTargetPopulation: boolean;
    hasUseEnvironment: boolean;
    hasTargetMarkets: boolean;
    hasBuyerProfile: boolean;
    hasValueProposition: boolean;
    canvasSectionsFilled: number;
    hasTeamMembers: boolean;
    hasGatesProgress: boolean;
    hasPhasesWithDates: boolean;
    hasTimelineConfirmed: boolean;
    hasEvidenceContent: boolean;
    hasLiteratureComplete: boolean;
    hasReimbursementData: boolean;
    hasTargetCodes: boolean;
    hasCoverageStatus: boolean;
    hasPayerMix: boolean;
    hasRisks: boolean;
    blueprintNotesCount: number;
    hasRegulatoryPathway: boolean;
    hasGtmStrategy: boolean;
    hasUseOfProceeds: boolean;
    hasManufacturing: boolean;
    hasIPStrategy: boolean;
    hasIPAssessment: boolean;
    hasFTOAssessment: boolean;
    hasHealthEconomics: boolean;
    hasRevenueForecast: boolean;
    hasExitStrategy: boolean;
    hasStrategicPartners: boolean;
    hasKeyActivities: boolean;
  };
}

export function useViabilityFunnelProgress(productId: string, companyId: string): FunnelProgress {
  // Step 1: Device defined (intended_use + description + images + key_technology_characteristics for system architecture)
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['funnel-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name, intended_use, description, intended_purpose_data, images, markets, key_technology_characteristics, ip_strategy_completed, ip_protection_types, ip_ownership_status, fto_risk_level, fto_notes, fto_certainty, fto_status, no_ip_applicable, trl_level, device_type, primary_regulatory_type, timeline_confirmed')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 2: Viability Inputs Complete (auto-calculated from Blueprint data)
  // Now derived from: device class, clinical evidence, reimbursement, risk analysis

  // Step 3: Strategic Planning (at least 4 of the 8 investor-relevant steps with notes)
  // Investor-relevant steps are 1-8 (Phases 1-2: Opportunity & Feasibility)
  const INVESTOR_RELEVANT_STEPS = [1, 2, 3, 4, 5, 6, 7, 8];
  const REQUIRED_INVESTOR_STEPS = 4;
  
  const { data: blueprintData, isLoading: blueprintLoading } = useQuery({
    queryKey: ['funnel-blueprint', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_venture_blueprints')
        .select('activity_notes')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  // Step 4: Business Canvas has content (at least 3 sections filled)
  const { data: canvasData, isLoading: canvasLoading } = useQuery({
    queryKey: ['funnel-canvas', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_canvas')
        .select('customer_segments, value_propositions, channels, customer_relationships, revenue_streams, key_resources, key_activities, key_partnerships, cost_structure')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 5: Team members exist
  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['funnel-team', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id')
        .eq('product_id', productId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 6: Investor share active
  const { data: shareData, isLoading: shareLoading } = useQuery({
    queryKey: ['funnel-share', companyId, productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_investor_share_settings')
        .select('is_active, featured_product_id')
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 0,
  });

  // Step 7: Essential Gates (readiness gates with at least 1 gate configured)
  const { data: gatesData, isLoading: gatesLoading } = useQuery({
    queryKey: ['funnel-gates', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_readiness_gates')
        .select('gates, current_gate_id')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 18: Lifecycle Phases (milestones with dates) - exclude "No Phase" entries
  const { data: phasesData, isLoading: phasesLoading } = useQuery({
    queryKey: ['funnel-phases', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date')
        .eq('product_id', productId)
        .neq('name', 'No Phase');

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 8: Evidence Plan (clinical evidence planning with at least some content)
  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ['funnel-evidence', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_clinical_evidence_plan')
        .select('regulator_requirements, payer_requirements, physician_requirements, study_design, kol_strategy, pmcf_plan, study_start_date, study_end_date, study_budget, supporting_literature, no_literature_found')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Competition Analysis (at least one competitor added)
  const { data: competitorsData, isLoading: competitorsLoading } = useQuery({
    queryKey: ['funnel-competitors', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_manual_competitors')
        .select('id')
        .eq('product_id', productId)
        .limit(1);
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 9: Market Sizing (TAM/SAM/SOM with any values)
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['funnel-market-sizing', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_market_sizing')
        .select('tam_value, sam_value, som_value')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 10: Reimbursement Strategy (target codes, coverage, payer mix) + Economic Buyer fields
  const { data: reimbursementData, isLoading: reimbursementLoading } = useQuery({
    queryKey: ['funnel-reimbursement', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reimbursement_strategy')
        .select('target_codes, coverage_status, coverage_notes, reimbursement_timeline_months, payer_mix, value_dossier_status, primary_launch_market, budget_type, buyer_type, heor_model_type, heor_completed, heor_by_market')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 11: GTM Strategy
  const { data: gtmData, isLoading: gtmLoading } = useQuery({
    queryKey: ['funnel-gtm-strategy', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_gtm_strategy')
        .select('channels, territory_priority, buyer_persona')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 13: Use of Proceeds
  const { data: proceedsData, isLoading: proceedsLoading } = useQuery({
    queryKey: ['funnel-use-of-proceeds', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_use_of_proceeds')
        .select('rd_percent, regulatory_percent, team_percent, commercial_percent, operations_percent')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });


  // Step 15: Manufacturing
  const { data: manufacturingData, isLoading: manufacturingLoading } = useQuery({
    queryKey: ['funnel-manufacturing', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_manufacturing')
        .select('current_stage, commercial_model')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 23: Exit Strategy
  const { data: exitStrategyData, isLoading: exitStrategyLoading } = useQuery({
    queryKey: ['funnel-exit-strategy', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_exit_strategy' as any)
        .select('potential_acquirers, comparable_transactions, strategic_rationale, selected_endgame, endgame_checklist')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { potential_acquirers: any[]; comparable_transactions: any[]; strategic_rationale: string | null; selected_endgame: string | null; endgame_checklist: Record<string, boolean> | null } | null;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 16: Risk Analysis (hazards in Risk Management) - for detailed FMEA
  const { data: hazardsData, isLoading: hazardsLoading } = useQuery({
    queryKey: ['funnel-hazards', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hazards')
        .select('id')
        .eq('product_id', productId)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 16 (High-Level Risk Assessment): All 4 categories must have at least one entry (including "None known")
  const { data: highLevelRisksData, isLoading: highLevelRisksLoading } = useQuery({
    queryKey: ['funnel-high-level-risks', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_high_level_risks')
        .select('category')
        .eq('product_id', productId);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 17: IP Assets (linked to product via junction table)
  const { data: ipAssetsData, isLoading: ipAssetsLoading } = useQuery({
    queryKey: ['funnel-ip-assets', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ip_asset_products')
        .select('ip_asset_id')
        .eq('product_id', productId)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  // Step 19b: Revenue Forecast (NPV analysis with units and price)
  const { data: npvData, isLoading: npvLoading } = useQuery({
    queryKey: ['funnel-npv-analysis', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_npv_analyses')
        .select('market_input_data')
        .eq('product_id', productId)
        .eq('scenario_name', 'Base Case')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  const isLoading = productLoading || blueprintLoading || canvasLoading || teamLoading || shareLoading || gatesLoading || phasesLoading || evidenceLoading || marketLoading || competitorsLoading || reimbursementLoading || gtmLoading || proceedsLoading || manufacturingLoading || hazardsLoading || highLevelRisksLoading || exitStrategyLoading || ipAssetsLoading || npvLoading;

  // Evaluate completion for each step
  // Step 0a: Device Name (set during product creation)
  const hasDeviceName = Boolean(productData?.name?.trim());
  
  // Step 0b: System Architecture - uses key_technology_characteristics (source of truth in Technical Specs)
  const keyTechCharacteristics = productData?.key_technology_characteristics as { 
    isSoftwareAsaMedicalDevice?: boolean; 
    isSoftwareMobileApp?: boolean; 
    noSoftware?: boolean;
  } | null;
  const hasSystemArchitecture = Boolean(
    keyTechCharacteristics?.isSoftwareAsaMedicalDevice ||
    keyTechCharacteristics?.isSoftwareMobileApp ||
    keyTechCharacteristics?.noSoftware
  );

  // Step 2b: TRL (Technical Readiness Level) - complete if trl_level is set (3-8)
  const trlLevelValue = (productData as any)?.trl_level;
  const hasTRL = trlLevelValue !== null && trlLevelValue !== undefined && trlLevelValue >= 3;

  // Check ONLY intended_purpose_data.clinicalPurpose (the field displayed in UI)
  const intendedPurposeData = productData?.intended_purpose_data as { clinicalPurpose?: string; valueProposition?: string } | null;
  const hasIntendedUse = Boolean(intendedPurposeData?.clinicalPurpose?.trim());

  const hasValueProposition = Boolean(intendedPurposeData?.valueProposition?.trim());
  const hasDescription = Boolean(productData?.description?.trim());
  // Filter out empty strings, null, and undefined values from images array
  const validImages = Array.isArray(productData?.images)
    ? productData.images.filter((img: any) => img && typeof img === 'string' && img.trim())
    : [];
  const hasMedia = validImages.length > 0;
  const step1Complete = hasIntendedUse && hasDescription && hasMedia;
  
  // Count only investor-relevant blueprint notes (steps 1-8)
  const blueprintNotes = blueprintData?.activity_notes as Record<string, string> | null;
  const investorNotesCount = blueprintNotes 
    ? Object.entries(blueprintNotes)
        .filter(([stepId, note]) => 
          INVESTOR_RELEVANT_STEPS.includes(parseInt(stepId)) && note?.trim()
        ).length 
    : 0;
  const step3Complete = investorNotesCount >= REQUIRED_INVESTOR_STEPS;

  // Count filled canvas sections
  const canvasSections = canvasData ? [
    canvasData.customer_segments,
    canvasData.value_propositions,
    canvasData.channels,
    canvasData.customer_relationships,
    canvasData.revenue_streams,
    canvasData.key_resources,
    canvasData.key_activities,
    canvasData.key_partnerships,
    canvasData.cost_structure,
  ].filter(section => section?.trim()).length : 0;
  const step4Complete = canvasSections >= 3;
  
  // Key Activities - complete if key_activities field has content in business canvas
  const hasKeyActivities = Boolean(canvasData?.key_activities?.trim());

  const step5Complete = Boolean(teamData && teamData.length > 0);
  
  const step6Complete = Boolean(
    shareData?.is_active && 
    shareData?.featured_product_id === productId
  );

  // Check if at least 1 gate has BOTH start AND end dates set (legacy)
  const gatesArray = (gatesData?.gates as any[]) || [];
  const hasGatesProgress = gatesArray.some(g =>
    g.startDate && g.endDate
  );

  // Step 18: Check if ALL phases have BOTH start AND end dates set AND user has confirmed
  const phasesArray = phasesData || [];
  const hasPhasesWithDates = phasesArray.length > 0 && phasesArray.every((p: any) =>
    p.start_date && p.end_date
  );
  const hasTimelineConfirmed = Boolean(productData?.timeline_confirmed);
  const step7Complete = Boolean(hasPhasesWithDates && hasTimelineConfirmed);

  // Check if evidence plan has any content
  // Note: study_design is stored as JSON object, not string
  const studyDesign = evidenceData?.study_design as { type?: string; endpoints?: string[]; sample_size?: number; duration_months?: number; control?: string } | null;

  // Study Design complete when ALL fields are filled (including dates and budget)
  const hasStudyDesignContent = Boolean(
    studyDesign?.type &&
    (studyDesign?.endpoints && studyDesign.endpoints.length > 0) &&
    studyDesign?.sample_size &&
    studyDesign?.duration_months &&
    studyDesign?.control &&
    evidenceData?.study_start_date &&
    evidenceData?.study_end_date &&
    evidenceData?.study_budget
  );

  // Evidence Requirements complete when ALL THREE stakeholder fields are filled
  const hasAllEvidenceRequirements = Boolean(
    (typeof evidenceData?.regulator_requirements === 'string' && evidenceData.regulator_requirements.trim()) &&
    (typeof evidenceData?.payer_requirements === 'string' && evidenceData.payer_requirements.trim()) &&
    (typeof evidenceData?.physician_requirements === 'string' && evidenceData.physician_requirements.trim())
  );

  // Supporting Literature complete when citations exist OR "no literature found" is checked
  const supportingLiterature = evidenceData?.supporting_literature as any[] | null;
  const hasLiteratureComplete = Boolean(
    (Array.isArray(supportingLiterature) && supportingLiterature.length > 0) ||
    (evidenceData as any)?.no_literature_found
  );

  // Step 17 is complete if BOTH evidence requirements AND supporting literature are filled
  const hasEvidenceContent = hasAllEvidenceRequirements || hasStudyDesignContent;
  const step8Complete = hasEvidenceContent && hasLiteratureComplete;

  // Competition complete if at least one competitor added
  const competitionComplete = Boolean(competitorsData && competitorsData.length > 0);

  // Market Sizing complete if TAM, SAM, AND SOM all have values
  const step9Complete = Boolean(
    marketData?.tam_value && marketData?.sam_value && marketData?.som_value
  );

  // Reimbursement complete if ALL sections are filled: target codes + coverage status + payer mix at 100%
  const hasTargetCodes = Array.isArray(reimbursementData?.target_codes) && reimbursementData.target_codes.length > 0;
  // Coverage status requires: status dropdown + timeline + coverage notes
  const hasCoverageStatus = Boolean(
    reimbursementData?.coverage_status?.trim() &&
    reimbursementData?.reimbursement_timeline_months &&
    reimbursementData?.coverage_notes?.trim()
  );
  const hasPayerMixComplete = (() => {
    if (!reimbursementData?.payer_mix) return false;
    const payerMix = reimbursementData.payer_mix as Record<string, { medicare?: number; medicaid?: number; private?: number; self_pay?: number }>;
    return Object.values(payerMix).some(mix => {
      const total = (mix.medicare || 0) + (mix.medicaid || 0) + (mix.private || 0) + (mix.self_pay || 0);
      return total === 100;
    });
  })();
  const step10Complete = hasTargetCodes && hasCoverageStatus && hasPayerMixComplete;

  // GTM Strategy complete if at least one channel is enabled
  const gtmChannels = (gtmData?.channels as any[]) || [];
  const step11Complete = Boolean(
    gtmChannels.some((c: any) => c.enabled)
  );

  // Use of Proceeds complete if at least one allocation > 0
  const step12Complete = Boolean(
    proceedsData?.rd_percent ||
    proceedsData?.regulatory_percent ||
    proceedsData?.team_percent ||
    proceedsData?.commercial_percent ||
    proceedsData?.operations_percent
  );

  // Manufacturing complete if BOTH stage AND model are set
  const step13Complete = Boolean(
    manufacturingData?.current_stage?.trim() &&
    manufacturingData?.commercial_model?.trim()
  );

  // Risk Analysis complete if all 4 high-level risk categories have at least one entry (including "None known")
  // This requires Clinical, Technical, Regulatory, and Commercial categories to each have at least one risk
  const categoriesWithRisks = new Set(highLevelRisksData?.map(r => r.category) || []);
  const allCategoriesCovered = ['Clinical', 'Technical', 'Regulatory', 'Commercial'].every(
    cat => categoriesWithRisks.has(cat)
  );
  const step14Complete = allCategoriesCovered;

  // Hazard Traceability Matrix complete if at least 1 hazard exists in the hazards table
  const hasAtLeastOneHazard = Boolean(hazardsData && hazardsData.length > 0);

  // High Level Risk Assessment complete if at least 1 risk exists (any category)
  const hasAtLeastOneHighLevelRisk = Boolean(highLevelRisksData && highLevelRisksData.length > 0);

  // Step 23 Risk Assessment complete if EITHER tab has data
  const hasAnyRiskData = hasAtLeastOneHazard || hasAtLeastOneHighLevelRisk;

  // Markets data for regulatory pathway and economic buyer checks
  const marketsData = productData?.markets as any[] | null;

  // Target Markets complete if at least one market is selected
  const hasTargetMarkets = Boolean(
    marketsData?.some((market: any) => market.selected)
  );

  // Regulatory Pathway complete if selected markets have a REAL classification (not TBD, not empty)
  // For SiMD/System packs, check component classifications
  const techCharValue = productData?.key_technology_characteristics as {
    isSoftwareMobileApp?: boolean;
    isSoftwareAsaMedicalDevice?: boolean;
    noSoftware?: boolean;
  } | string | null;
  
  // Handle both object format and legacy string format
  const isSiMDorSystemPack = typeof techCharValue === 'object' && techCharValue !== null
    ? (techCharValue.isSoftwareMobileApp === true || techCharValue.isSoftwareAsaMedicalDevice === true)
    : (techCharValue === 'SiMD (Software in a Medical Device)' || 
       techCharValue === 'simd' ||
       techCharValue === 'System/Procedure Pack');
  
  const hasRegulatoryPathway = (() => {
    if (!marketsData) return false;

    const selectedMarkets = marketsData.filter((m: any) => m.selected);
    if (selectedMarkets.length === 0) return false;

    if (isSiMDorSystemPack) {
      // For SiMD/System Pack: check component classifications first, fall back to market-level riskClass
      return selectedMarkets.every((market: any) => {
        const components = market.componentClassification?.components as any[] | undefined;

        // If components exist and have selected items, validate them
        if (components && components.length > 0) {
          const selectedComponents = components.filter((c: any) => c.isSelected === true);
          if (selectedComponents.length > 0) {
            // All selected components must have a real risk class
            return selectedComponents.every((c: any) => isRealRiskClass(c.riskClass));
          }
        }

        // Fall back to market-level riskClass (e.g., from EUDAMED auto-population)
        return isRealRiskClass(market.riskClass);
      });
    } else {
      // For standard devices: check if all selected markets have a real risk class
      return selectedMarkets.every((market: any) => isRealRiskClass(market.riskClass));
    }
  })();

  // User Profile complete if intended_purpose_data has BOTH targetPopulation AND useEnvironment
  const purposeData = productData?.intended_purpose_data as { targetPopulation?: string[]; useEnvironment?: string[]; durationOfUse?: string } | null;
  const userProfileComplete = Boolean(
    (purposeData?.targetPopulation?.length ?? 0) > 0 &&
    (purposeData?.useEnvironment?.length ?? 0) > 0
  );

  // Economic Buyer complete if any selected market has budgetType and buyerType
  const economicBuyerComplete = Boolean(
    marketsData?.some((market: any) => 
      market.selected && market.budgetType && market.buyerType
    )
  );

  // Strategic Partners complete if selected markets have at least 2 partners total across all categories
  const hasStrategicPartners = (() => {
    if (!marketsData) return false;
    const totalPartners = marketsData.reduce((count: number, market: any) => {
      if (!market.selected) return count;
      return count + 
        (market.distributionPartners?.length || 0) +
        (market.clinicalPartners?.length || 0) +
        (market.regulatoryPartners?.length || 0);
    }, 0);
    return totalPartners >= 2;
  })();

  // HEOR complete if ANY ONE model type is complete for at least one market
  // User only needs to fill out one economic model to prove ROI
  const heorComplete = (() => {
    const heorByMarket = reimbursementData?.heor_by_market as Record<string, {
      heor_model_type?: string | null;
      cost_per_procedure_current?: number | null;
      cost_per_procedure_new?: number | null;
      procedure_volume_annual?: number | null;
      qaly_gain_estimate?: number | null;
      icer_value?: number | null;
      willingness_to_pay_threshold?: number | null;
      budget_impact_year1?: number | null;
      budget_impact_year2?: number | null;
      budget_impact_year3?: number | null;
      budget_impact_notes?: string | null;
      device_capital_cost?: number | null;
    }> | null;

    if (!heorByMarket) return false;

    // Check completion for each model type across all markets
    const hasCostSavingsComplete = Object.values(heorByMarket).some(marketData =>
      marketData?.cost_per_procedure_current &&
      marketData?.cost_per_procedure_new &&
      marketData?.procedure_volume_annual
    );

    const hasCostUtilityComplete = Object.values(heorByMarket).some(marketData =>
      marketData?.qaly_gain_estimate &&
      marketData?.icer_value &&
      marketData?.willingness_to_pay_threshold
    );

    const hasBudgetImpactComplete = Object.values(heorByMarket).some(marketData =>
      marketData?.budget_impact_year1 &&
      marketData?.budget_impact_year2 &&
      marketData?.budget_impact_year3 &&
      marketData?.budget_impact_notes?.trim()
    );

    // ROI/Payback complete if device capital cost is filled AND cost savings data exists
    const hasRoiPaybackComplete = Object.values(heorByMarket).some(marketData =>
      marketData?.device_capital_cost &&
      marketData?.cost_per_procedure_current &&
      marketData?.cost_per_procedure_new &&
      marketData?.procedure_volume_annual
    );

    // HEOR is complete when ANY ONE model type has data filled
    return hasCostSavingsComplete || hasCostUtilityComplete || hasBudgetImpactComplete || hasRoiPaybackComplete;
  })();

  // IP Strategy complete if: (no_ip_applicable OR has at least 1 IP asset) AND FTO assessment (certainty + status)
  const noIPApplicable = productData?.no_ip_applicable === true;
  const hasIPAssets = (ipAssetsData?.length ?? 0) > 0;
  const hasFTOAssessment = Boolean(productData?.fto_certainty && productData?.fto_status);
  const ipAssessmentDone = noIPApplicable || hasIPAssets;
  const hasIPStrategy = ipAssessmentDone && hasFTOAssessment;

  // Step 19b: Revenue Forecast complete if ALL essential fields are populated
  const revenueForecastComplete = (() => {
    const marketInputData = npvData?.market_input_data as Record<string, {
      monthlySalesForecast?: number;
      initialUnitPrice?: number;
      initialVariableCost?: number;
      rndWorkCosts?: number;
      discountRate?: number;
      marketLaunchDate?: string | Date;
      forecastDuration?: number;
    }> | null;
    if (!marketInputData) return false;
    return Object.values(marketInputData).some(market => {
      const hasMonthlyUnits = (market?.monthlySalesForecast ?? 0) > 0;
      const hasUnitPrice = (market?.initialUnitPrice ?? 0) > 0;
      const hasCogs = (market?.initialVariableCost ?? 0) > 0;
      const hasDevCosts = (market?.rndWorkCosts ?? 0) > 0;
      const hasDiscountRate = (market?.discountRate ?? 0) > 0;
      const hasLaunchDate = Boolean(market?.marketLaunchDate);
      const hasForecastDuration = (market?.forecastDuration ?? 0) > 0;
      // All 7 required fields must be filled (Annual Growth % is optional)
      return hasMonthlyUnits && hasUnitPrice && hasCogs && hasDevCosts && hasDiscountRate && hasLaunchDate && hasForecastDuration;
    });
  })();

  // Step 2: Viability is auto-calculated from Blueprint inputs being filled
  // Complete when: clinical evidence OR reimbursement OR risk analysis has data
  const step2Complete = hasEvidenceContent || step10Complete || step14Complete;

  // Build steps array
  const steps: FunnelStep[] = [
    {
      step: 1,
      title: "Define Device",
      description: "Add intended use, description & media",
      isComplete: step1Complete,
      route: `/app/product/${productId}/device-information?tab=purpose`,
      subTasks: [
        { label: "Add intended use", complete: hasIntendedUse },
        { label: "Add description", complete: hasDescription },
        { label: "Add media", complete: hasMedia },
      ],
    },
    {
      step: 2,
      title: "Viability Inputs",
      description: "Add clinical, reimbursement, or risk data",
      isComplete: step2Complete,
      route: `/app/product/${productId}/business-case?tab=venture-blueprint`,
      subTasks: [
        { label: "Clinical evidence plan", complete: hasEvidenceContent },
        { label: "Reimbursement strategy", complete: step10Complete },
        { label: "Risk analysis", complete: step14Complete },
      ],
    },
    {
      step: 3,
      title: "Strategic Planning",
      description: `Investor-relevant planning (${investorNotesCount}/${REQUIRED_INVESTOR_STEPS})`,
      isComplete: step3Complete,
      route: `/app/product/${productId}/business-case?tab=venture-blueprint`,
      subTasks: [
        { label: `Phase 1: Opportunity (4 steps)`, complete: investorNotesCount >= 4 },
        { label: `Phase 2: Feasibility (4 steps)`, complete: investorNotesCount >= 8 },
      ],
    },
    {
      step: 4,
      title: "Business Canvas",
      description: "Define business model",
      isComplete: step4Complete,
      route: `/app/product/${productId}/business-case?tab=business-canvas`,
      subTasks: [
        { label: `${canvasSections}/3 sections filled`, complete: step4Complete },
      ],
    },
    {
      step: 5,
      title: "Team Profile",
      description: "Add team members",
      isComplete: step5Complete,
      route: `/app/product/${productId}/business-case?tab=team-profile`,
      subTasks: [
        { label: "Add at least 1 team member", complete: step5Complete },
      ],
    },
    {
      step: 6,
      title: "Share with Investors",
      description: "Create & share investor link",
      isComplete: step6Complete,
      route: `/app/product/${productId}/business-case?tab=venture-blueprint`,
      subTasks: [
        { label: "Activate share link", complete: step6Complete },
      ],
    },
  ];

  // Calculate current step and progress dynamically from readinessChecklist (built below)
  // Note: We build the checklist first, then derive progress from it

  // Build readiness checklist for investor share page matching ALL_INVESTOR_STEPS from blueprintStepMapping.ts
  // 25 items: Phase 1 (11 items) + Phase 2 (10 items) + Phase 5 Investor (3 items) + Business Canvas (1)
  // Device Type completion check - reads from CORRECT database locations:
  // - primaryRegulatoryType: products.primary_regulatory_type (separate column)
  // - invasivenessLevel: products.device_type (TEXT containing JSON: { invasivenessLevel: "..." })
  // - isActiveDevice: products.key_technology_characteristics.isActive (JSONB field)
  const primaryRegulatoryTypeValue = (productData as any)?.primary_regulatory_type as string | null;

  // NOTE: products.device_type is a TEXT column. In Genesis we store JSON inside it.
  const deviceTypeRaw = (productData as any)?.device_type as unknown;
  const deviceTypeData = (() => {
    if (!deviceTypeRaw) return null;

    if (typeof deviceTypeRaw === 'string') {
      try {
        const parsed = JSON.parse(deviceTypeRaw);
        return parsed && typeof parsed === 'object' ? (parsed as any) : null;
      } catch {
        return null;
      }
    }

    // Defensive: if the backend ever changes this to JSONB, support object as well.
    if (typeof deviceTypeRaw === 'object') return deviceTypeRaw as any;

    return null;
  })() as { invasivenessLevel?: string } | null;

  const keyTechChars = (productData as any)?.key_technology_characteristics as { isActive?: boolean } | null;
  
  // Individual checks for sidebar "To Complete This Step" display
  const hasPrimaryRegulatoryType = Boolean(primaryRegulatoryTypeValue?.trim());
  // IVD devices don't require invasiveness level - it's N/A for in-vitro diagnostics
  const isIVD = primaryRegulatoryTypeValue === 'In Vitro Diagnostic (IVD)';
  const hasInvasivenessLevel = isIVD ? true : Boolean(deviceTypeData?.invasivenessLevel?.trim());
  // Use typeof check to correctly handle boolean false (user selected "No")
  const hasActiveDevice = typeof keyTechChars?.isActive === 'boolean';
  const hasDeviceType = hasPrimaryRegulatoryType && hasInvasivenessLevel && hasActiveDevice;

  const readinessChecklist = [
    // Phase 1: Foundation & Opportunity Definition
    // Step 1: Device Name
    {
      label: hasDeviceName ? "✓ Device Name" : "❌ Device Name",
      labelKey: 'genesis.steps.deviceName',
      complete: hasDeviceName,
      route: `/app/product/${productId}/device-information?tab=basics&subtab=definition&section=device-name`
    },
    // Step 2: Device Description
    {
      label: hasDescription ? "✓ Device Description" : "❌ Device Description",
      labelKey: 'genesis.steps.deviceDescription',
      complete: hasDescription,
      route: `/app/product/${productId}/device-information?tab=basics&subtab=definition&section=description`
    },
    // Step 3: Upload Device Image
    {
      label: hasMedia ? "✓ Upload Device Image" : "❌ Upload Device Image",
      labelKey: 'genesis.steps.uploadDeviceImage',
      complete: hasMedia,
      route: `/app/product/${productId}/device-information?tab=basics&subtab=media`
    },
    // Step 4: Intended Use and Value Proposition
    {
      label: (hasIntendedUse && hasValueProposition) ? "✓ Intended Use and Value Proposition" : "❌ Intended Use and Value Proposition",
      labelKey: 'genesis.steps.intendedUseAndValue',
      complete: hasIntendedUse && hasValueProposition,
      route: `/app/product/${productId}/device-information?tab=purpose&subtab=statement`
    },
    // Step 5: Device Type (3 required fields: Primary Regulatory Type, Core Device Nature, Active Device)
    {
      label: hasDeviceType ? "✓ Device Type" : "❌ Device Type",
      labelKey: 'genesis.steps.deviceType',
      complete: hasDeviceType,
      route: `/app/product/${productId}/device-information?tab=basics&subtab=classification`
    },
    // Step 6: TRL and System Architecture (2 sub-items)
    {
      label: (hasTRL && hasSystemArchitecture) ? "✓ TRL and System Architecture" : "❌ TRL and System Architecture",
      labelKey: 'genesis.steps.trlAndArchitecture',
      complete: hasTRL && hasSystemArchitecture,
      route: `/app/product/${productId}/device-information?tab=basics&subtab=technical&section=trl`,
      subItems: [
        { label: "TRL complete", complete: hasTRL },
        { label: "System Architecture complete", complete: hasSystemArchitecture }
      ]
    },
    // Step 7: Classify Device
    {
      label: hasRegulatoryPathway ? "✓ Classify Device" : "❌ Classify Device",
      labelKey: 'genesis.steps.classifyDevice',
      complete: hasRegulatoryPathway,
      route: `/app/product/${productId}/device-information?tab=markets-regulatory&section=classification`
    },
    // Step 8: Profile User
    {
      label: userProfileComplete ? "✓ Profile User" : "❌ Profile User",
      labelKey: 'genesis.steps.profileUser',
      complete: userProfileComplete,
      route: `/app/product/${productId}/device-information?tab=purpose&subtab=context`
    },
    // Step 9: Profile Economic Buyer
    {
      label: economicBuyerComplete ? "✓ Profile Economic Buyer" : "❌ Profile Economic Buyer",
      labelKey: 'genesis.steps.profileEconomicBuyer',
      complete: economicBuyerComplete,
      route: `/app/product/${productId}/device-information?tab=markets-regulatory&section=economic-buyer`
    },
    // Step 10: Select Target Markets
    {
      label: hasTargetMarkets ? "✓ Select Target Markets" : "❌ Select Target Markets",
      labelKey: 'genesis.steps.selectTargetMarkets',
      complete: hasTargetMarkets,
      route: `/app/product/${productId}/device-information?tab=markets-regulatory`
    },
    // Step 11: Market Sizing
    {
      label: step9Complete ? "✓ Market Sizing" : "❌ Market Sizing",
      labelKey: 'genesis.steps.marketSizing',
      complete: step9Complete,
      route: `/app/product/${productId}/business-case?tab=market-analysis&subtab=sizing`
    },
    // Step 12: Competitor Analysis
    {
      label: competitionComplete ? "✓ Competitor Analysis" : "❌ Competitor Analysis",
      labelKey: 'genesis.steps.competitorAnalysis',
      complete: competitionComplete,
      route: `/app/product/${productId}/business-case?tab=market-analysis&subtab=competition`
    },
    // Step 13: IP Strategy & Freedom to Operate
    {
      label: hasIPStrategy ? "✓ IP Strategy & Freedom to Operate" : "❌ IP Strategy & Freedom to Operate",
      labelKey: 'genesis.steps.ipStrategy',
      complete: hasIPStrategy,
      route: `/app/product/${productId}/business-case?tab=ip-strategy`
    },
    // Step 14: Clinical Evidence Strategy
    {
      label: step8Complete ? "✓ Clinical Evidence Strategy" : "❌ Clinical Evidence Strategy",
      labelKey: 'genesis.steps.clinicalEvidence',
      complete: step8Complete,
      route: `/app/product/${productId}/clinical-trials?tab=evidence-plan`
    },
    // Step 15: Health Economic Model (HEOR)
    {
      label: heorComplete ? "✓ Health Economic Model (HEOR)" : "❌ Health Economic Model (HEOR)",
      labelKey: 'genesis.steps.healthEconomics',
      complete: heorComplete,
      route: `/app/product/${productId}/business-case?tab=reimbursement&subtab=heor`
    },
    // Step 16: Reimbursement & Market Access
    {
      label: step10Complete ? "✓ Reimbursement & Market Access" : "❌ Reimbursement & Market Access",
      labelKey: 'genesis.steps.reimbursement',
      complete: step10Complete,
      route: `/app/product/${productId}/business-case?tab=reimbursement`
    },
    // Step 17: Revenue Forecast
    {
      label: revenueForecastComplete ? "✓ Revenue Forecast" : "❌ Revenue Forecast",
      labelKey: 'genesis.steps.revenueForecast',
      complete: revenueForecastComplete,
      route: `/app/product/${productId}/business-case?tab=rnpv&view=essential`
    },
    // Step 18: Go-to-Market Strategy
    {
      label: step11Complete ? "✓ Go-to-Market Strategy" : "❌ Go-to-Market Strategy",
      labelKey: 'genesis.steps.goToMarketStrategy',
      complete: step11Complete,
      route: `/app/product/${productId}/business-case?tab=gtm-strategy`
    },
    // Step 19: Strategic Partners (was Step 20)
    {
      label: hasStrategicPartners ? "✓ Strategic Partners" : "❌ Strategic Partners",
      labelKey: 'genesis.steps.strategicPartners',
      complete: hasStrategicPartners,
      route: `/app/product/${productId}/device-information?tab=markets-regulatory&section=partners`
    },
    // Step 20: Manufacturing & Supply Chain (was Step 21)
    {
      label: step13Complete ? "✓ Manufacturing & Supply Chain" : "❌ Manufacturing & Supply Chain",
      labelKey: 'genesis.steps.manufacturing',
      complete: step13Complete,
      route: `/app/product/${productId}/operations/manufacturing`
    },
    // Step 21: Team Composition (was Step 22)
    {
      label: step5Complete ? "✓ Team Composition" : "❌ Team Composition",
      labelKey: 'genesis.steps.teamComposition',
      complete: step5Complete,
      route: `/app/product/${productId}/business-case?tab=team-profile`
    },
    // Step 22: High-Level Project & Resource Plan (was Step 23)
    {
      label: step7Complete ? "✓ High-Level Project & Resource Plan" : "❌ High-Level Project & Resource Plan",
      labelKey: 'genesis.steps.essentialGates',
      complete: step7Complete,
      route: `/app/product/${productId}/milestones?openDates=true`
    },
    // Step 23: Risk Assessment (covers both High Level and Hazard Traceability Matrix)
    {
      label: hasAnyRiskData ? "✓ Risk Assessment" : "❌ Risk Assessment",
      labelKey: 'genesis.steps.riskAssessment',
      complete: hasAnyRiskData,
      route: `/app/product/${productId}/design-risk-controls?tab=risk-management`
    },
    // Step 24: Business Model Canvas (swapped with Funding)
    {
      label: hasKeyActivities ? "✓ Business Model Canvas" : "❌ Business Model Canvas",
      labelKey: 'genesis.steps.businessCanvas',
      complete: hasKeyActivities,
      route: `/app/product/${productId}/business-case?tab=business-canvas`
    },
    // Step 25: Strategic Horizon
    {
      label: exitStrategyData?.selected_endgame ? "✓ Strategic Horizon" : "❌ Strategic Horizon",
      labelKey: 'genesis.steps.strategicHorizon',
      complete: Boolean(exitStrategyData?.selected_endgame),
      route: `/app/product/${productId}/business-case?tab=exit-strategy`
    },
    // Step 26: Funding & Use of Proceeds (swapped with Business Model Canvas)
    {
      label: step12Complete ? "✓ Funding & Use of Proceeds" : "❌ Funding & Use of Proceeds",
      labelKey: 'genesis.steps.useOfProceeds',
      complete: step12Complete,
      route: `/app/product/${productId}/business-case?tab=use-of-proceeds`
    },
  ];

  // Calculate progress dynamically from readinessChecklist (single source of truth)
  const completedCount = readinessChecklist.filter(item => item.complete).length;
  const overallProgress = Math.round((completedCount / readinessChecklist.length) * 100);
  const currentStep = readinessChecklist.findIndex(item => !item.complete) + 1 || readinessChecklist.length;

  return {
    steps,
    currentStep,
    overallProgress,
    isLoading,
    readinessChecklist,
    completionData: {
      hasDeviceName,
      hasDeviceType,
      hasPrimaryRegulatoryType,
      hasInvasivenessLevel,
      isIVD,
      hasActiveDevice,
      hasSystemArchitecture,
      hasTRL,
      hasIntendedUse,
      hasDescription,
      hasMedia,
      hasCompetitor: competitionComplete,
      hasTAM: Boolean(marketData?.tam_value),
      hasSAM: Boolean(marketData?.sam_value),
      hasSOM: Boolean(marketData?.som_value),
      hasTargetPopulation: Boolean((purposeData?.targetPopulation?.length ?? 0) > 0),
      hasUseEnvironment: Boolean((purposeData?.useEnvironment?.length ?? 0) > 0),
      hasTargetMarkets,
      hasBuyerProfile: economicBuyerComplete,
      hasValueProposition,
      canvasSectionsFilled: canvasSections,
      hasTeamMembers: step5Complete,
      hasGatesProgress,
      hasPhasesWithDates,
      hasTimelineConfirmed,
      hasEvidenceContent,
      hasLiteratureComplete,
      hasReimbursementData: step10Complete,
      hasTargetCodes,
      hasCoverageStatus: Boolean(hasCoverageStatus),
      hasPayerMix: hasPayerMixComplete,
      hasRisks: hasAnyRiskData,
      blueprintNotesCount: investorNotesCount,
      hasRegulatoryPathway,
      hasGtmStrategy: step11Complete,
      hasUseOfProceeds: step12Complete,
      hasManufacturing: step13Complete,
      hasIPStrategy,
      hasIPAssessment: ipAssessmentDone,
      hasFTOAssessment,
      hasHealthEconomics: heorComplete,
      hasRevenueForecast: revenueForecastComplete,
      // Step 26 (Exit Strategy) completion: Just selecting an endgame is enough
      hasExitStrategy: Boolean(exitStrategyData?.selected_endgame),
      hasStrategicPartners,
      hasKeyActivities,
    },
  };
}
