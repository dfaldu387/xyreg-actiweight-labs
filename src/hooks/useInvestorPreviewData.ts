import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCalculatedViabilityScore } from '@/services/viabilityScore/getCalculatedViabilityScore';
import { deriveBusinessModelCanvas } from '@/services/deriveBusinessModelCanvas';
import type { MediaItem, VentureBlueprintStep, TeamMember } from '@/types/investorView';
import type { ScoreBreakdownItem } from '@/services/calculateViabilityScore';
import { sanitizeImageArray } from '@/utils/imageDataUtils';

interface CategoryScoreWithBreakdown {
  score: number;
  maxScore: number;
  source: string;
  breakdown?: ScoreBreakdownItem[];
}

export interface InvestorPreviewData {
  productName: string;
  companyName: string;
  companyLogo?: string;
  founderEmail: string;
  isVerified: boolean;

  // Media Gallery
  mediaItems: MediaItem[];

  // Viability Scores
  viabilityScore: number;
  regulatoryScore: number;
  clinicalScore: number;
  reimbursementScore: number;
  technicalScore: number;

  // Score breakdown for popup
  scoreBreakdown: {
    regulatory: CategoryScoreWithBreakdown;
    clinical: CategoryScoreWithBreakdown;
    reimbursement: CategoryScoreWithBreakdown;
    technical: CategoryScoreWithBreakdown;
    missingInputs: string[];
  };

  // Core Product Info
  intendedPurpose: string;
  description: string;
  deviceBadges: string[];
  actualValueProposition: string;

  // Technical Profile - Device Characteristics
  primaryRegulatoryType: string;
  coreDeviceNature: string | null; // Only for Medical Devices
  isActiveDevice: boolean | null;
  targetMarket: string;
  classification: string;

  // Business Canvas (all 9 sections)
  keyPartners: string;
  keyActivities: string;
  keyResources: string;
  valuePropositions: string;
  customerRelationships: string;
  channels: string;
  customerSegments: string;
  costStructure: string;
  revenueStreams: string;

  // Venture Blueprint
  ventureBlueprintSteps: VentureBlueprintStep[];

  // Timeline
  currentPhase: 'concept-planning' | 'design-inputs' | 'design-development' | 'verification-validation' | 'transfer-production' | 'market-surveillance';
  phaseDates?: {
    phaseId: string;
    startDate?: string;
    endDate?: string;
  }[];

  // Team
  teamMembers: TeamMember[];

  // Market Sizing
  tamValue: number | null;
  samValue: number | null;
  somValue: number | null;

  // Part II: Stakeholder Profiles (Steps 8-9)
  stakeholderProfilesData: {
    intendedPatientPopulation?: string[];
    environmentOfUse?: string[];
    intendedUsers?: string;
    clinicalBenefits?: string;
    buyerType?: string;
    budgetType?: string;
    salesCycleWeeks?: number;
  } | null;

  // Part II: Target Markets (Step 10)
  marketsData: {
    code: string;
    name: string;
    selected: boolean;
    riskClass?: string;
    regulatoryStatus?: string;
    marketLaunchStatus?: string;
    launchDate?: string;
  }[];
  territoryPriority?: {
    code: string;
    name: string;
    priority: number;
    rationale?: string;
  }[];

  // Part II: Competitors (Step 12)
  competitorsData: {
    id: string;
    competitor_company: string;
    product_name?: string;
    market?: string;
    device_classification?: string;
    regulatory_status?: string;
    market_share_estimate?: number | string;
    homepage_url?: string;
  }[];

  // Deep Dive Module Data (synced with full investor view)
  marketSizingData: any;
  reimbursementStrategyData: any;
  teamGapsData: any;
  regulatoryTimelineData: any;
  clinicalEvidenceData: any;
  readinessGatesData: any;

  // TRL (Technology Readiness Level)
  trlLevel: number | null;
  trlLabel: string | null;
  trlDescription: string | null;
  trlNotes: string | null;

  // System Architecture
  systemArchitecture: 'samd' | 'simd' | 'no_software' | null;

  // Key Features
  keyFeatures: string[];

  // User Profile (Step 11)
  targetPopulation: string[];
  useEnvironment: string[];

  // Economic Buyer (Step 12) - legacy, replaced by stakeholderProfilesData
  economicBuyerInfo?: { market: string; budgetType: string; buyerType: string }[];

  // Competitor Analysis (Step 10) - legacy, replaced by competitorsData
  competitors?: { company: string; productName?: string; market?: string; regulatoryStatus?: string }[];

  // GTM Strategy (Step 23) - legacy, replaced by gtmData
  gtmStrategyData?: {
    channels: { name: string; enabled: boolean; details?: string }[];
    territories: { code: string; name: string; priority: number }[];
    buyerPersona: string | null;
    salesCycleWeeks: number | null;
  } | null;

  // Risk Assessment (Step 16) - legacy, replaced by riskSummaryData
  riskSummary?: {
    totalHazards: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    topRisks: { description: string; riskLevel: string; harm?: string }[];
  } | null;

  // IP Strategy (Step 18) - legacy, replaced by ipStrategyData
  ipAssets?: { title: string; ipType: string; status: string; protectionType?: string }[];

  // Use of Proceeds
  useOfProceedsData: any;

  // Manufacturing
  manufacturingData: any;

  // Exit Strategy
  exitStrategyData: any;

  // Risk Summary (Executive level)
  riskSummaryData: {
    categoryCounts: { category: string; mitigated: number; inProgress: number; open: number; total: number; }[];
    topRisks: { id: string; description: string; severity: string; severityLevel: number; category: string; mitigation: string; mitigationStatus: 'mitigated' | 'in_progress' | 'open'; }[];
    totalRisks: number;
    mitigatedCount: number;
    openCount: number;
  } | null;

  // For "Open Full Investor View" link
  publicSlug?: string;
  
  // Revenue/NPV Data for Lifecycle Chart
  launchDate?: string | null;
  npvData?: {
    npv: number;
    marketInputData?: Record<string, any>;
  } | null;
  
  // Selected market code from product.markets for chart selection
  selectedMarketCode?: string;

  // IP Strategy Data (Step 13)
  ipStrategyData?: {
    assets: { id: string; type: string; title: string; status: string; filingDate?: string; expiryDate?: string; jurisdiction?: string; }[];
    ftoStatus: string | null;
    ftoCertainty: string | null;
    ftoNotes: string | null;
  } | null;

  // HEOR Data (Step 15)
  heorData?: {
    healthEconomicsEvidence: string | null;
    heorAssumptions: string | null;
    heorByMarket: Record<string, any> | null;
  } | null;

  // GTM Strategy Data (Step 18)
  gtmData?: {
    channels: any[];
    buyerPersona: string | null;
    salesCycleWeeks: number | null;
    budgetCycle: string | null;
  } | null;

  // Strategic Partners Data (Step 20)
  strategicPartnersData?: {
    distributionPartners: { name: string; markets: string[] }[];
    clinicalPartners: { name: string; markets: string[] }[];
    regulatoryPartners: { name: string; markets: string[] }[];
    notifiedBodies: { name: string; nbNumber: number; markets: string[] }[];
    hasNotifiedBodyRequirement: boolean;
    notifiedBodyStatus: 'not_needed' | 'not_defined' | 'assigned' | null;
  } | null;
}

/**
 * Fetches investor preview data for the CURRENT product being edited.
 * This shows exactly how this product would appear in the investor view.
 */
export function useInvestorPreviewData(productId: string, isOpen?: boolean) {
  const queryClient = useQueryClient();
  const prevOpenRef = useRef(false);

  // Invalidate cache when drawer opens (false → true) so user always sees fresh data
  useEffect(() => {
    if (isOpen && !prevOpenRef.current && productId) {
      queryClient.invalidateQueries({
        queryKey: ['investor-preview-data', productId],
      });
    }
    prevOpenRef.current = !!isOpen;
  }, [isOpen, productId, queryClient]);

  return useQuery({
    queryKey: ['investor-preview-data', productId],
    queryFn: async (): Promise<InvestorPreviewData | null> => {
      if (!productId) return null;

      // Get the company_id for this product to fetch share settings for the public slug
      const { data: productCompany, error: productCompanyError } = await supabase
        .from('products')
        .select('company_id')
        .eq('id', productId)
        .single();

      if (productCompanyError || !productCompany) return null;

      // Get share settings just for the public_slug (for "Open Full Investor View" link)
      const { data: shareSettings } = await supabase
        .from('company_investor_share_settings')
        .select('public_slug')
        .eq('company_id', productCompany.company_id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Always use the CURRENT product - this is a preview of the product being edited
      const targetProductId = productId;

      // Step 4: Fetch the target product with company (include launch dates)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          id, name, description, intended_use, class,
          regulatory_status, current_lifecycle_phase, images, markets, device_type,
          videos_array, models_3d, key_technology_characteristics,
          projected_launch_date, actual_launch_date,
          trl_level, trl_notes, key_features, intended_purpose_data,
          fto_status, fto_certainty, fto_notes,
          company:companies(id, name, logo_url, email)
        `)
        .eq('id', targetProductId)
        .single();

      if (productError || !product) return null;

      // Parallel fetches - split into chunks to avoid tuple depth issues
      const calculatedScore = await getCalculatedViabilityScore(targetProductId);

      // Use individual fetches with any cast to avoid excessive type depth
      const gtmResult = await supabase.from('product_gtm_strategy').select('channels, territory_priority, buyer_persona, sales_cycle_weeks, budget_cycle').eq('product_id', targetProductId).maybeSingle();
      const marketSizingResult = await supabase.from('product_market_sizing').select('*').eq('product_id', targetProductId).maybeSingle();
      const teamMembersResult = await supabase.from('team_members').select('id, name, role, bio, avatar_url, linkedin_url').eq('product_id', targetProductId).order('inserted_at', { ascending: true });
      const blueprintResult = await supabase.from('product_venture_blueprints').select('activity_notes').eq('product_id', targetProductId).maybeSingle();
      const readinessGatesResult = await supabase.from('product_readiness_gates').select('*').eq('product_id', targetProductId).maybeSingle();
      const reimbursementResult = await supabase.from('product_reimbursement_strategy').select('*').eq('product_id', targetProductId).maybeSingle();
      const teamGapsResult = await supabase.from('product_team_gaps').select('*').eq('product_id', targetProductId).maybeSingle();
      const regulatoryResult = await supabase.from('product_regulatory_timeline').select('*').eq('product_id', targetProductId).maybeSingle();
      const clinicalResult = await supabase.from('product_clinical_evidence_plan').select('*').eq('product_id', targetProductId).maybeSingle();
      const npvResult = await supabase.from('product_npv_analyses').select('total_portfolio_npv, market_input_data, market_calculations').eq('product_id', targetProductId).eq('scenario_name', 'Base Case').maybeSingle();
      const useOfProceedsResult = await supabase.from('product_use_of_proceeds').select('*').eq('product_id', targetProductId).maybeSingle();
      const manufacturingResult = await supabase.from('product_manufacturing').select('*').eq('product_id', targetProductId).maybeSingle();
      const exitResult = await (supabase.from('product_exit_strategy' as any).select('*').eq('product_id', targetProductId).maybeSingle() as any);
      const hazardsResult = await supabase.from('hazards').select('id, description, category, initial_severity, residual_risk_level, residual_risk, mitigation_measure, risk_control_measure').eq('product_id', targetProductId).order('initial_severity', { ascending: false }).limit(20);
      const canvasResult = await supabase.from('business_canvas').select('key_partnerships, key_activities, key_resources, value_propositions, customer_relationships, channels, customer_segments, cost_structure, revenue_streams').eq('product_id', targetProductId).maybeSingle();
      const competitorsResult = await supabase.from('product_manual_competitors').select('id, competitor_company, product_name, market, device_classification, regulatory_status, market_share_estimate, homepage_url').eq('product_id', targetProductId);
      // Lifecycle phases for timeline dates
      const lifecyclePhasesResult = await supabase
        .from('lifecycle_phases')
        .select('id, name, start_date, end_date')
        .eq('product_id', targetProductId)
        .order('start_date', { ascending: true });
      // IP Assets via junction table
      const ipResult = await supabase
        .from('ip_asset_products')
        .select(`
          ip_asset_id,
          ip_assets:ip_asset_id (
            id, ip_type, title, status, priority_date, notes
          )
        `)
        .eq('product_id', targetProductId);

      // Extract data
      const gtmStrategyData = gtmResult.data;
      const marketSizingData = marketSizingResult.data;
      const teamMembers = teamMembersResult.data;
      const blueprintData = blueprintResult.data;
      const readinessGatesData = readinessGatesResult.data;
      const reimbursementStrategyData = reimbursementResult.data;
      const teamGapsData = teamGapsResult.data;
      const regulatoryTimelineData = regulatoryResult.data;
      const clinicalEvidenceData = clinicalResult.data;
      const npvAnalysisData = npvResult.data;
      const useOfProceedsData = useOfProceedsResult.data;
      const manufacturingData = manufacturingResult.data;
      const exitStrategyData = exitResult?.data;
      const hazardsData = hazardsResult.data;
      const businessCanvasData = canvasResult.data;
      const competitorsData = competitorsResult.data;
      const ipAssetsData = ipResult.data;
      const lifecyclePhasesData = lifecyclePhasesResult.data;
      // FTO data is now on the product itself (fetched above)

      const company = product.company as { id: string; name: string; logo_url: string | null; email: string | null } | null;

      // Build media items - merge DB images + storage bucket images
      const mediaItems: MediaItem[] = [];

      // Collect image URLs from both sources
      const dbImageUrls = sanitizeImageArray(product.images);
      const allImageUrls = new Set(dbImageUrls);

      // Also fetch images from Supabase storage bucket (some images only exist there)
      try {
        const { data: storageFiles } = await supabase.storage
          .from('product-images')
          .list('', { search: `${targetProductId}-`, limit: 100 });
        if (storageFiles && storageFiles.length > 0) {
          storageFiles.forEach(file => {
            const publicUrl = supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl;
            if (publicUrl) allImageUrls.add(publicUrl);
          });
        }
      } catch {
        // Storage listing failed, continue with DB images only
      }

      allImageUrls.forEach((url: string) => {
        mediaItems.push({
          type: 'image',
          url,
          label: 'Product Image',
          thumbnailUrl: url,
        });
      });

      // Add videos
      if (product.videos_array && Array.isArray(product.videos_array)) {
        product.videos_array.forEach((vid: any) => {
          mediaItems.push({
            type: 'video',
            url: vid.url || vid,
            label: vid.caption || 'Product Video',
            thumbnailUrl: vid.thumbnail || vid.url,
          });
        });
      }

      // Add 3D models
      if (product.models_3d && Array.isArray(product.models_3d)) {
        product.models_3d.forEach((model: any) => {
          mediaItems.push({
            type: '3d',
            url: model.url || model,
            label: model.caption || '3D Model',
            thumbnailUrl: model.thumbnail,
          });
        });
      }

      // Parse device type - EXACT same logic as InvestorViewPage
      const parseDeviceType = (deviceType: any): Record<string, any> | null => {
        if (!deviceType) return null;
        if (typeof deviceType === 'object') return deviceType;
        if (typeof deviceType === 'string') {
          const trimmed = deviceType.trim();
          if (trimmed.startsWith('{')) {
            try {
              return JSON.parse(trimmed);
            } catch {
              return null;
            }
          }
        }
        return null;
      };

      const extractDeviceType = (deviceType: any): string => {
        if (!deviceType) return 'Medical Device';
        const parsed = parseDeviceType(deviceType);
        if (parsed) {
          const parts: string[] = [];
          if (parsed.invasivenessLevel) parts.push(parsed.invasivenessLevel);
          if (parsed.deviceCategory) parts.push(parsed.deviceCategory);
          if (parsed.contactType) parts.push(parsed.contactType);
          if (parsed.duration) parts.push(parsed.duration);
          return parts.length > 0 ? parts.join(' • ') : 'Medical Device';
        }
        if (typeof deviceType === 'string' && !deviceType.trim().startsWith('{')) {
          return deviceType;
        }
        return 'Medical Device';
      };

      // Extract device characteristics for Technical Profile
      const extractDeviceCharacteristics = (deviceType: any, keyTechChars: any) => {
        const parsed = parseDeviceType(deviceType);
        if (!parsed) {
          return {
            primaryRegulatoryType: 'Medical Device',
            coreDeviceNature: null,
            isActiveDevice: keyTechChars?.isActive ?? null,
          };
        }

        // Primary Regulatory Type
        let primaryRegulatoryType = 'Medical Device';
        if (parsed.primaryRegulatoryType) {
          primaryRegulatoryType = parsed.primaryRegulatoryType === 'ivd' 
            ? 'In Vitro Diagnostic (IVD)'
            : 'Medical Device (MDR)';
        } else if (parsed.deviceCategory === 'IVD') {
          primaryRegulatoryType = 'In Vitro Diagnostic (IVD)';
        }

        // Core Device Nature (invasiveness) - only for Medical Devices
        let coreDeviceNature: string | null = null;
        if (primaryRegulatoryType.includes('Medical Device')) {
          coreDeviceNature = parsed.invasivenessLevel || parsed.coreDeviceNature || null;
        }

        // Active Device status - check key_technology_characteristics first, then device_type
        let isActiveDevice: boolean | null = keyTechChars?.isActive ?? null;
        if (isActiveDevice === null) {
          if (parsed.isActive !== undefined) {
            isActiveDevice = parsed.isActive === true || parsed.isActive === 'active';
          } else if (parsed.activeStatus) {
            isActiveDevice = parsed.activeStatus === 'active';
          }
        }

        return {
          primaryRegulatoryType,
          coreDeviceNature,
          isActiveDevice,
        };
      };

      const deviceCharacteristics = extractDeviceCharacteristics(product.device_type, product.key_technology_characteristics);

      // Generate device badges
      const deviceBadges: string[] = [];
      if (product.class) deviceBadges.push(`Class ${product.class}`);
      if (product.device_type) {
        const parsedDT = parseDeviceType(product.device_type);
        if (parsedDT?.invasivenessLevel) {
          deviceBadges.push(parsedDT.invasivenessLevel);
        } else if (typeof product.device_type === 'string' && !product.device_type.trim().startsWith('{')) {
          deviceBadges.push(product.device_type);
        }
      }
      if (product.regulatory_status) deviceBadges.push(product.regulatory_status);

      // Extract primary market
      const extractPrimaryMarket = (markets: any): string => {
        if (!markets) return 'Global';
        if (Array.isArray(markets)) {
          const selectedMarket = markets.find((m: any) => m.selected) || markets[0];
          if (selectedMarket) {
            return selectedMarket.name || selectedMarket.code?.toUpperCase() || 'Global';
          }
        }
        return 'Global';
      };

      // Extract highest risk classification from markets/components
      const extractHighestClassification = (markets: any, techCharacteristics: any): string => {
        if (!markets || !Array.isArray(markets)) return 'Not Classified';
        
        const selectedMarkets = markets.filter((m: any) => m.selected);
        if (selectedMarkets.length === 0) return 'Not Classified';
        
        // Check if SiMD/System Pack (uses component classification)
        const isSiMD = typeof techCharacteristics === 'object' && techCharacteristics !== null &&
          (techCharacteristics.isSoftwareMobileApp === true || techCharacteristics.isSoftwareAsaMedicalDevice === true);
        
        // Risk class hierarchy (highest = III)
        const riskHierarchy = ['I', 'Ia', 'Ib', 'II', 'IIa', 'IIb', 'III'];
        
        const isRealClass = (cls: string | null | undefined): boolean => {
          if (!cls) return false;
          const normalized = cls.replace(/class[\s-]*/i, '').trim().toLowerCase();
          // Accept I, II, III, IIa, IIb, and numeric 1, 2, 3
          return ['i', 'ia', 'ib', 'ii', 'iia', 'iib', 'iii', '1', '2', '3'].includes(normalized);
        };
        
        const normalizeClass = (cls: string): string => {
          const cleaned = cls.replace(/class[\s-]*/i, '').trim();
          // Map FDA numeric to Roman, preserve case for IIa/IIb
          if (cleaned === '1') return 'I';
          if (cleaned === '2') return 'II';
          if (cleaned === '3') return 'III';
          // Normalize case: I, II, III, IIa, IIb
          const lower = cleaned.toLowerCase();
          if (lower === 'i') return 'I';
          if (lower === 'ia') return 'Ia';
          if (lower === 'ib') return 'Ib';
          if (lower === 'ii') return 'II';
          if (lower === 'iia') return 'IIa';
          if (lower === 'iib') return 'IIb';
          if (lower === 'iii') return 'III';
          return cleaned;
        };
        
        let highestIndex = -1;
        let highestClass = '';
        
        if (isSiMD) {
          // For SiMD: find highest across all components first
          selectedMarkets.forEach((market: any) => {
            const components = market.componentClassification?.components || [];
            components.forEach((comp: any) => {
              if (comp.riskClass && isRealClass(comp.riskClass)) {
                const normalized = normalizeClass(comp.riskClass);
                const idx = riskHierarchy.indexOf(normalized);
                if (idx > highestIndex) {
                  highestIndex = idx;
                  highestClass = normalized;
                }
              }
            });
          });
          
          // FALLBACK: If no component classes found, check market-level riskClass
          if (highestIndex < 0) {
            selectedMarkets.forEach((market: any) => {
              if (market.riskClass && isRealClass(market.riskClass)) {
                const normalized = normalizeClass(market.riskClass);
                const idx = riskHierarchy.indexOf(normalized);
                if (idx > highestIndex) {
                  highestIndex = idx;
                  highestClass = normalized;
                }
              }
            });
          }
        } else {
          // For standard devices: find highest across selected markets
          selectedMarkets.forEach((market: any) => {
            if (market.riskClass && isRealClass(market.riskClass)) {
              const normalized = normalizeClass(market.riskClass);
              const idx = riskHierarchy.indexOf(normalized);
              if (idx > highestIndex) {
                highestIndex = idx;
                highestClass = normalized;
              }
            }
          });
        }
        
        return highestClass ? `Class ${highestClass}` : 'Not Classified';
      };

      // Map lifecycle phase
      const phaseMapping: Record<string, any> = {
        'Concept & Planning': 'concept-planning',
        'Design Inputs': 'design-inputs',
        'Design & Development': 'design-development',
        'Verification & Validation': 'verification-validation',
        'Transfer to Production': 'transfer-production',
        'Production': 'transfer-production',
        'Post-Market Surveillance': 'market-surveillance',
      };

      const currentPhase = phaseMapping[product.current_lifecycle_phase || ''] || 'concept-planning';

      // Build venture blueprint steps
      const STEP_TITLES: Record<number, { title: string; phaseId: number; phaseTitle: string }> = {
        1: { title: 'Clinical or User Need', phaseId: 1, phaseTitle: 'Opportunity & Definition' },
        2: { title: 'Market & Competitor Analysis', phaseId: 1, phaseTitle: 'Opportunity & Definition' },
        3: { title: 'Core Solution Concept', phaseId: 1, phaseTitle: 'Opportunity & Definition' },
        4: { title: 'User & Economic Buyer Profile', phaseId: 1, phaseTitle: 'Opportunity & Definition' },
        5: { title: 'Quantified Value Proposition', phaseId: 2, phaseTitle: 'Feasibility & Planning' },
        6: { title: 'Regulatory & Compliance Assessment', phaseId: 2, phaseTitle: 'Feasibility & Planning' },
        7: { title: 'Risk Assessment', phaseId: 2, phaseTitle: 'Feasibility & Planning' },
        8: { title: 'Project & Resource Plan', phaseId: 2, phaseTitle: 'Feasibility & Planning' },
      };

      const ventureBlueprintSteps: VentureBlueprintStep[] = [];
      if (blueprintData?.activity_notes && typeof blueprintData.activity_notes === 'object') {
        const notes = blueprintData.activity_notes as Record<string, string>;
        for (let stepId = 1; stepId <= 8; stepId++) {
          const note = notes[String(stepId)] || notes[stepId as any];
          if (note && note.trim()) {
            const stepInfo = STEP_TITLES[stepId];
            ventureBlueprintSteps.push({
              id: stepId,
              title: stepInfo.title,
              notes: note,
              phaseId: stepInfo.phaseId,
              phaseTitle: stepInfo.phaseTitle,
            });
          }
        }
      }

      // Phase dates from lifecycle_phases - map phase names to ISO phase IDs
      const phaseDates = (() => {
        if (!lifecyclePhasesData || lifecyclePhasesData.length === 0) return [];
        
        // Map phase names to ISO phase IDs
        const phaseNameToId: Record<string, string> = {
          'concept-planning': 'concept-planning',
          'design-inputs': 'design-inputs',
          'design-development': 'design-development',
          'verification-validation': 'verification-validation',
          'transfer-production': 'transfer-production',
          'market-surveillance': 'market-surveillance',
        };
        
        // Keywords to match phase names to ISO phases
        const phaseKeywords: Record<string, string[]> = {
          'concept-planning': ['concept', 'planning', '§7.1', '7.1'],
          'design-inputs': ['design inputs', 'inputs', '§7.3.3', '7.3.3'],
          'design-development': ['design & development', 'development', '§7.3.4', '7.3.4'],
          'verification-validation': ['verification', 'validation', 'v&v', '§7.3.5', '7.3.5', '7.3.6'],
          'transfer-production': ['transfer', 'production', '§7.3.8', '7.3.8', '§7.5', '7.5'],
          'market-surveillance': ['market', 'surveillance', '§8.2', '8.2.1'],
        };
        
        const matchPhaseToId = (phaseName: string): string | null => {
          const lowerName = phaseName.toLowerCase();
          for (const [phaseId, keywords] of Object.entries(phaseKeywords)) {
            if (keywords.some(kw => lowerName.includes(kw.toLowerCase()))) {
              return phaseId;
            }
          }
          return null;
        };
        
        return lifecyclePhasesData
          .map((phase: any) => {
            const phaseId = matchPhaseToId(phase.name);
            if (!phaseId) return null;
            return {
              phaseId,
              startDate: phase.start_date || undefined,
              endDate: phase.end_date || undefined,
            };
          })
          .filter(Boolean) as { phaseId: string; startDate?: string; endDate?: string }[];
      })();

      return {
        productName: product.name || 'Medical Device',
        companyName: company?.name || 'Company',
        companyLogo: company?.logo_url || undefined,
        founderEmail: company?.email || '',
        isVerified: true,
        
        mediaItems,
        
        viabilityScore: calculatedScore.totalScore,
        regulatoryScore: calculatedScore.categoryScores.regulatory.score,
        clinicalScore: calculatedScore.categoryScores.clinical.score,
        reimbursementScore: calculatedScore.categoryScores.reimbursement.score,
        technicalScore: calculatedScore.categoryScores.technical.score,
        
        scoreBreakdown: {
          regulatory: {
            score: calculatedScore.categoryScores.regulatory.score,
            maxScore: calculatedScore.categoryScores.regulatory.maxScore,
            source: calculatedScore.categoryScores.regulatory.source,
            breakdown: calculatedScore.categoryScores.regulatory.breakdown,
          },
          clinical: {
            score: calculatedScore.categoryScores.clinical.score,
            maxScore: calculatedScore.categoryScores.clinical.maxScore,
            source: calculatedScore.categoryScores.clinical.source,
            breakdown: calculatedScore.categoryScores.clinical.breakdown,
          },
          reimbursement: {
            score: calculatedScore.categoryScores.reimbursement.score,
            maxScore: calculatedScore.categoryScores.reimbursement.maxScore,
            source: calculatedScore.categoryScores.reimbursement.source,
            breakdown: calculatedScore.categoryScores.reimbursement.breakdown,
          },
          technical: {
            score: calculatedScore.categoryScores.technical.score,
            maxScore: calculatedScore.categoryScores.technical.maxScore,
            source: calculatedScore.categoryScores.technical.source,
            breakdown: calculatedScore.categoryScores.technical.breakdown,
          },
          missingInputs: calculatedScore.missingInputs,
        },
        
        intendedPurpose: product.intended_use || '',
        description: product.description || '',
        deviceBadges,
        actualValueProposition: ((product as any).intended_purpose_data as any)?.valueProposition || '',
        
        primaryRegulatoryType: deviceCharacteristics.primaryRegulatoryType,
        coreDeviceNature: deviceCharacteristics.coreDeviceNature,
        isActiveDevice: deviceCharacteristics.isActiveDevice,
        targetMarket: extractPrimaryMarket(product.markets),
        classification: extractHighestClassification(product.markets, product.key_technology_characteristics),
        
        // Business Canvas: Prefer saved user edits from business_canvas table, fallback to derived
        ...(() => {
          // Check if user has saved any content in the business_canvas table
          const hasSavedCanvas = businessCanvasData && (
            businessCanvasData.key_partnerships ||
            businessCanvasData.key_activities ||
            businessCanvasData.key_resources ||
            businessCanvasData.value_propositions ||
            businessCanvasData.customer_relationships ||
            businessCanvasData.channels ||
            businessCanvasData.customer_segments ||
            businessCanvasData.cost_structure ||
            businessCanvasData.revenue_streams
          );

          if (hasSavedCanvas) {
            // Use saved user edits from Step 25
            return {
              keyPartners: businessCanvasData.key_partnerships || '',
              keyActivities: businessCanvasData.key_activities || '',
              keyResources: businessCanvasData.key_resources || '',
              valuePropositions: businessCanvasData.value_propositions || '',
              customerRelationships: businessCanvasData.customer_relationships || '',
              channels: businessCanvasData.channels || '',
              customerSegments: businessCanvasData.customer_segments || '',
              costStructure: businessCanvasData.cost_structure || '',
              revenueStreams: businessCanvasData.revenue_streams || '',
            };
          }

          // Fallback: Auto-derive from existing product data sources
          return deriveBusinessModelCanvas({
            product: {
              intended_use: product.intended_use,
              description: product.description,
              ip_strategy_summary: (product as any).ip_strategy_summary,
              markets: product.markets,
            },
            gtmStrategyData,
            blueprintData,
            reimbursementStrategyData,
            teamMembers,
            npvData: npvAnalysisData ? (() => {
              const marketInputs = npvAnalysisData.market_input_data as Record<string, any> | null;
              if (!marketInputs) return { npv: npvAnalysisData.total_portfolio_npv || 0 };
              const firstMarket = Object.values(marketInputs)[0] as any;
              if (!firstMarket) return { npv: npvAnalysisData.total_portfolio_npv || 0 };
              const monthlyUnits = firstMarket.monthlySalesForecast || 0;
              const unitPrice = firstMarket.initialUnitPrice || 0;
              const cogsPerUnit = firstMarket.initialVariableCost || 0;
              const annualGrowthPercent = firstMarket.annualSalesForecastChange || 0;
              const developmentCosts = firstMarket.rndWorkCosts || 0;
              const discountRate = firstMarket.discountRate || 10;
              const forecastDurationYears = Math.floor((firstMarket.forecastDuration || 60) / 12);
              const annualUnits = monthlyUnits * 12;
              let cumulativeCashFlow = -developmentCosts;
              let npv = -developmentCosts;
              let peakRevenue = 0;
              let breakEvenYear: number | null = null;
              let totalRevenue = 0;
              let totalCosts = 0;
              for (let year = 1; year <= forecastDurationYears; year++) {
                const growthMultiplier = Math.pow(1 + annualGrowthPercent / 100, year - 1);
                const yearlyUnits = annualUnits * growthMultiplier;
                const yearlyRevenue = yearlyUnits * unitPrice;
                const yearlyCogs = yearlyUnits * cogsPerUnit;
                const yearlyProfit = yearlyRevenue - yearlyCogs;
                totalRevenue += yearlyRevenue;
                totalCosts += yearlyCogs;
                const discountFactor = Math.pow(1 + discountRate / 100, year);
                npv += yearlyProfit / discountFactor;
                cumulativeCashFlow += yearlyProfit;
                if (yearlyRevenue > peakRevenue) peakRevenue = yearlyRevenue;
                if (breakEvenYear === null && cumulativeCashFlow >= 0) breakEvenYear = year;
              }
              const grossMargin = unitPrice > 0 ? ((unitPrice - cogsPerUnit) / unitPrice) * 100 : 0;
              return {
                npv: Math.round(npv),
                peakRevenue: peakRevenue > 0 ? Math.round(peakRevenue) : undefined,
                grossMargin: grossMargin > 0 ? grossMargin : undefined,
                breakEvenYear,
                totalRevenue: totalRevenue > 0 ? Math.round(totalRevenue) : undefined,
                totalCosts: totalCosts > 0 ? Math.round(totalCosts) : undefined,
                developmentCosts: developmentCosts > 0 ? Math.round(developmentCosts) : undefined,
              };
            })() : null,
          });
        })(),
        
        ventureBlueprintSteps,
        
        currentPhase,
        phaseDates,
        
        teamMembers: (teamMembers || []).map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          bio: m.bio,
          avatar_url: m.avatar_url,
          linkedin_url: m.linkedin_url,
        })),
        
        tamValue: marketSizingData?.tam_value ?? null,
        samValue: marketSizingData?.sam_value ?? null,
        somValue: marketSizingData?.som_value ?? null,

        // Part II: Stakeholder Profiles (Steps 8-9)
        stakeholderProfilesData: (() => {
          const ipd = (product as any).intended_purpose_data as Record<string, any> | null;
          
          // Parse targetPopulation (camelCase in DB) - could be string or array
          let patientPop: string[] = [];
          const rawPatientPop = ipd?.targetPopulation || ipd?.patient_population;
          if (rawPatientPop) {
            if (Array.isArray(rawPatientPop)) {
              patientPop = rawPatientPop;
            } else if (typeof rawPatientPop === 'string') {
              patientPop = rawPatientPop.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          
          // Parse useEnvironment (camelCase in DB) - could be string or array
          let envOfUse: string[] = [];
          const rawEnvOfUse = ipd?.useEnvironment || ipd?.environment_of_use;
          if (rawEnvOfUse) {
            if (Array.isArray(rawEnvOfUse)) {
              envOfUse = rawEnvOfUse;
            } else if (typeof rawEnvOfUse === 'string') {
              envOfUse = rawEnvOfUse.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          
          // Parse intended_users from product root or ipd
          let intendedUsers: string | undefined = undefined;
          const rawIntendedUsers = (product as any).intended_users || ipd?.intendedUsers;
          if (Array.isArray(rawIntendedUsers)) {
            intendedUsers = rawIntendedUsers.join(', ');
          } else if (typeof rawIntendedUsers === 'string') {
            intendedUsers = rawIntendedUsers;
          }
          
          // Extract economic buyer data from selected market(s)
          const markets = (product as any).markets;
          let buyerType: string | undefined = undefined;
          let budgetType: string | undefined = undefined;
          
          if (Array.isArray(markets)) {
            // Find the first selected market with buyer data
            const selectedMarket = markets.find((m: any) => m.selected && (m.buyerType || m.budgetType));
            if (selectedMarket) {
              buyerType = selectedMarket.buyerType;
              budgetType = selectedMarket.budgetType;
            }
          }
          
          // Fallback to GTM strategy if no market-level data
          if (!buyerType) buyerType = gtmStrategyData?.buyer_persona || undefined;
          if (!budgetType) budgetType = gtmStrategyData?.budget_cycle || undefined;
          
          return {
            intendedPatientPopulation: patientPop.length > 0 ? patientPop : undefined,
            environmentOfUse: envOfUse.length > 0 ? envOfUse : undefined,
            intendedUsers,
            clinicalBenefits: (product as any).clinical_benefits || undefined,
            buyerType,
            budgetType,
            salesCycleWeeks: gtmStrategyData?.sales_cycle_weeks || undefined,
          };
        })(),

        // Part II: Target Markets (Step 10)
        marketsData: (() => {
          const markets = (product as any).markets;
          if (!Array.isArray(markets)) return [];
          return markets.map((m: any) => ({
            code: m.code,
            name: m.name,
            selected: m.selected || false,
            riskClass: m.riskClass,
            regulatoryStatus: m.regulatoryStatus,
            marketLaunchStatus: m.marketLaunchStatus,
            launchDate: m.launchDate,
          }));
        })(),
        territoryPriority: (() => {
          const tp = gtmStrategyData?.territory_priority;
          if (!Array.isArray(tp)) return undefined;
          return tp.map((t: any) => ({
            code: t.code,
            name: t.name,
            priority: t.priority,
            rationale: t.rationale,
          }));
        })(),

        // Part II: Competitors (Step 12)
        competitorsData: (competitorsData || []).map((c: any) => ({
          id: c.id,
          competitor_company: c.competitor_company,
          product_name: c.product_name,
          market: c.market,
          device_classification: c.device_classification,
          regulatory_status: c.regulatory_status,
          market_share_estimate: c.market_share_estimate,
          homepage_url: c.homepage_url,
        })),

        // Deep Dive Module Data (synced with full investor view)
        marketSizingData: marketSizingData as any,
        reimbursementStrategyData: reimbursementStrategyData as any,
        teamGapsData: teamGapsData as any,
        regulatoryTimelineData: regulatoryTimelineData as any,
        clinicalEvidenceData: clinicalEvidenceData as any,
        readinessGatesData: readinessGatesData as any,

        // TRL
        trlLevel: (product as any).trl_level ?? null,
        trlLabel: (() => {
          const trlMap: Record<number, string> = {
            3: 'TRL 3: Proof of Concept',
            4: 'TRL 4: Lab Validation',
            5: 'TRL 5: Technology Validation',
            6: 'TRL 6: Clinical Pilot',
            7: 'TRL 7: Clinical Pivotal',
            8: 'TRL 8: Market Ready',
          };
          return trlMap[(product as any).trl_level] || null;
        })(),
        trlDescription: (() => {
          const descMap: Record<number, string> = {
            3: 'Bench-top validation complete',
            4: 'Design Freeze 1 achieved',
            5: 'Design Freeze 2, V&V plan',
            6: 'First-in-human testing',
            7: 'Pivotal trial complete',
            8: 'Regulatory clearance obtained',
          };
          return descMap[(product as any).trl_level] || null;
        })(),
        trlNotes: (product as any).trl_notes || null,

        // System Architecture
        systemArchitecture: (() => {
          const ktc = product.key_technology_characteristics as Record<string, any> | null;
          if (!ktc) return null;
          if (ktc.isSoftwareAsaMedicalDevice) return 'samd' as const;
          if (ktc.isSoftwareMobileApp) return 'simd' as const;
          if (ktc.noSoftware) return 'no_software' as const;
          return null;
        })(),

        // Key Features
        keyFeatures: (() => {
          const kf = (product as any).key_features;
          if (Array.isArray(kf)) return kf.filter((f: any) => typeof f === 'string' && f.trim());
          return [];
        })(),

        targetPopulation: (() => {
          const ipd = (product as any).intended_purpose_data as Record<string, any> | null;
          const raw = ipd?.targetPopulation || ipd?.patient_population;
          if (Array.isArray(raw)) return raw;
          if (typeof raw === 'string') return raw.split(',').map((s: string) => s.trim()).filter(Boolean);
          return [];
        })(),

        useEnvironment: (() => {
          const ipd = (product as any).intended_purpose_data as Record<string, any> | null;
          const raw = ipd?.useEnvironment || ipd?.environment_of_use;
          if (Array.isArray(raw)) return raw;
          if (typeof raw === 'string') return raw.split(',').map((s: string) => s.trim()).filter(Boolean);
          return [];
        })(),

        useOfProceedsData: useOfProceedsData as any,

        manufacturingData: manufacturingData ? {
          ...(manufacturingData as any),
          cmo_partners: ((manufacturingData as any).cmo_partners as any[]) || [],
          single_source_components: ((manufacturingData as any).single_source_components as any[]) || [],
        } : null,

        exitStrategyData: exitStrategyData ? {
          potential_acquirers: ((exitStrategyData as any).potential_acquirers as any[]) || [],
          comparable_transactions: ((exitStrategyData as any).comparable_transactions as any[]) || [],
          strategic_rationale: (exitStrategyData as any).strategic_rationale || null,
          exit_timeline_years: (exitStrategyData as any).exit_timeline_years || null,
          preferred_exit_type: (exitStrategyData as any).preferred_exit_type || null,
          selected_endgame: (exitStrategyData as any).selected_endgame || null,
          endgame_metrics_focus: (exitStrategyData as any).endgame_metrics_focus || null,
        } : null,

        // Risk Summary Data - transform hazards into executive format
        riskSummaryData: (() => {
          if (!hazardsData || hazardsData.length === 0) return null;

          const RISK_CATEGORIES = ['Clinical', 'Technical', 'Regulatory', 'Commercial'];

          // Infer category from hazard description if not set
          const inferCategory = (description: string): string => {
            const lower = description.toLowerCase();
            if (lower.includes('regulatory') || lower.includes('approval') || lower.includes('fda') || lower.includes('ce mark')) return 'Regulatory';
            if (lower.includes('clinical') || lower.includes('patient') || lower.includes('harm') || lower.includes('injury')) return 'Clinical';
            if (lower.includes('commercial') || lower.includes('market') || lower.includes('sale') || lower.includes('revenue')) return 'Commercial';
            return 'Technical';
          };

          // Determine mitigation status from residual risk
          const getMitigationStatus = (hazard: any): 'mitigated' | 'in_progress' | 'open' => {
            const residualRisk = hazard.residual_risk_level || hazard.residual_risk;
            const hasMitigation = !!(hazard.mitigation_measure || hazard.risk_control_measure);
            if (residualRisk === 'Low' && hasMitigation) return 'mitigated';
            if (hasMitigation) return 'in_progress';
            return 'open';
          };

          // Severity label from level
          const getSeverityLabel = (level: number): string => {
            const labels: Record<number, string> = { 1: 'Negligible', 2: 'Minor', 3: 'Serious', 4: 'Major', 5: 'Catastrophic' };
            return labels[level] || 'Unknown';
          };

          // Calculate category counts
          const categoryCounts = RISK_CATEGORIES.map(category => {
            const categoryHazards = hazardsData.filter((h: any) => (h.category || inferCategory(h.description)) === category);
            const mitigated = categoryHazards.filter((h: any) => getMitigationStatus(h) === 'mitigated').length;
            const inProgress = categoryHazards.filter((h: any) => getMitigationStatus(h) === 'in_progress').length;
            const open = categoryHazards.filter((h: any) => getMitigationStatus(h) === 'open').length;
            return { category, mitigated, inProgress, open, total: categoryHazards.length };
          });

          // Build top risks (top 5 by severity)
          const topRisks = hazardsData
            .slice(0, 5)
            .map((h: any) => ({
              id: h.id,
              description: h.description,
              severity: getSeverityLabel(h.initial_severity || 1),
              severityLevel: h.initial_severity || 1,
              category: h.category || inferCategory(h.description),
              mitigation: h.risk_control_measure || h.mitigation_measure || '',
              mitigationStatus: getMitigationStatus(h),
            }));

          const mitigatedCount = hazardsData.filter((h: any) => getMitigationStatus(h) === 'mitigated').length;
          const openCount = hazardsData.filter((h: any) => getMitigationStatus(h) === 'open').length;

          return {
            categoryCounts,
            topRisks,
            totalRisks: hazardsData.length,
            mitigatedCount,
            openCount,
          };
        })(),

        publicSlug: shareSettings?.public_slug || undefined,
        
        // Revenue/NPV Data for Lifecycle Chart - only include if meaningful revenue data exists
        launchDate: (product as any).projected_launch_date || (product as any).actual_launch_date || null,
        npvData: (() => {
          if (!npvAnalysisData) return null;
          const mid = npvAnalysisData.market_input_data as Record<string, any> | null;
          if (!mid) return null;
          // Check if any market has meaningful revenue inputs (units > 0 AND price > 0)
          const hasRevenue = Object.values(mid).some((m: any) =>
            (m?.monthlySalesForecast || 0) > 0 && (m?.initialUnitPrice || 0) > 0
          );
          if (!hasRevenue) return null;
          return {
            npv: npvAnalysisData.total_portfolio_npv || 0,
            marketInputData: mid,
          };
        })(),
        
        // Extract selected market code from product.markets
        selectedMarketCode: (() => {
          const markets = (product as any).markets;
          if (!Array.isArray(markets)) return undefined;
          const selected = markets.find((m: any) => m.selected);
          return selected?.code || undefined;
        })(),

        // IP Strategy Data (Step 13)
        ipStrategyData: (() => {
          // Extract IP assets from junction table result
          const rawAssets = (ipAssetsData || []) as any[];
          const assets = rawAssets
            .map((row: any) => row.ip_assets)
            .filter(Boolean);
          
          // FTO data is on the product directly
          const hasFTO = product.fto_status || product.fto_certainty;
          
          if (assets.length === 0 && !hasFTO) return null;
          
          return {
            assets: assets.map((a: any) => ({
              id: a.id,
              type: a.ip_type,
              title: a.title,
              status: a.status,
              filingDate: a.priority_date,
              expiryDate: null, // Not stored currently
              jurisdiction: null, // Not stored currently
            })),
            ftoStatus: product.fto_status || null,
            ftoCertainty: product.fto_certainty || null,
            ftoNotes: product.fto_notes || null,
          };
        })(),

        // HEOR Data (Step 15)
        heorData: (() => {
          const rs = reimbursementStrategyData as any;
          if (!rs) return null;
          const heorByMarket = rs.heor_by_market as Record<string, any> | null;
          const hasHeor = !!(rs.health_economics_evidence || (heorByMarket && Object.keys(heorByMarket).length > 0));
          if (!hasHeor) return null;
          return {
            healthEconomicsEvidence: rs.health_economics_evidence || null,
            heorAssumptions: rs.heor_assumptions || null,
            heorByMarket: heorByMarket || null,
          };
        })(),

        // GTM Strategy Data (Step 18)
        gtmData: (() => {
          if (!gtmStrategyData) return null;
          const channels = gtmStrategyData.channels as any[] | null;
          const tp = gtmStrategyData.territory_priority as any[] | null;
          if (!channels && !tp) return null;
          return {
            channels: channels || [],
            buyerPersona: gtmStrategyData.buyer_persona || null,
            salesCycleWeeks: gtmStrategyData.sales_cycle_weeks || null,
            budgetCycle: gtmStrategyData.budget_cycle || null,
          };
        })(),

        // Strategic Partners Data (Step 20) - extracted from market JSONB
        strategicPartnersData: (() => {
          const markets = (product as any).markets as any[] | null;
          if (!Array.isArray(markets)) return null;
          
          const selectedMarkets = markets.filter((m: any) => m.selected);
          if (selectedMarkets.length === 0) return null;
          
          // Aggregate partners across all selected markets
          const distributionMap = new Map<string, { name: string; markets: string[] }>();
          const clinicalMap = new Map<string, { name: string; markets: string[] }>();
          const regulatoryMap = new Map<string, { name: string; markets: string[] }>();
          const nbMap = new Map<string, { name: string; nbNumber: number; markets: string[] }>();
          
          let hasEuMarket = false;
          let euRiskClass: string | null = null;
          
          selectedMarkets.forEach((market: any) => {
            const marketLabel = market.name || market.code || 'Unknown';
            
            // Check for EU market and risk class for NB requirement
            if (market.code === 'EU') {
              hasEuMarket = true;
              euRiskClass = market.riskClass || null;
            }
            
            // Distribution partners
            if (Array.isArray(market.distributionPartners)) {
              market.distributionPartners.forEach((p: any) => {
                if (p.name) {
                  const existing = distributionMap.get(p.name);
                  if (existing) {
                    existing.markets.push(marketLabel);
                  } else {
                    distributionMap.set(p.name, { name: p.name, markets: [marketLabel] });
                  }
                }
              });
            }
            
            // Clinical partners
            if (Array.isArray(market.clinicalPartners)) {
              market.clinicalPartners.forEach((p: any) => {
                if (p.name) {
                  const existing = clinicalMap.get(p.name);
                  if (existing) {
                    existing.markets.push(marketLabel);
                  } else {
                    clinicalMap.set(p.name, { name: p.name, markets: [marketLabel] });
                  }
                }
              });
            }
            
            // Regulatory partners
            if (Array.isArray(market.regulatoryPartners)) {
              market.regulatoryPartners.forEach((p: any) => {
                if (p.name) {
                  const existing = regulatoryMap.get(p.name);
                  if (existing) {
                    existing.markets.push(marketLabel);
                  } else {
                    regulatoryMap.set(p.name, { name: p.name, markets: [marketLabel] });
                  }
                }
              });
            }
            
            // Notified Body
            if (market.notifiedBody && typeof market.notifiedBody === 'object' && market.notifiedBody.name) {
              const nbName = market.notifiedBody.name;
              const nbNumber = market.notifiedBody.nb_number || 0;
              const existing = nbMap.get(nbName);
              if (existing) {
                existing.markets.push(marketLabel);
              } else {
                nbMap.set(nbName, { name: nbName, nbNumber, markets: [marketLabel] });
              }
            }
          });
          
          // Determine NB status for EU
          let notifiedBodyStatus: 'not_needed' | 'not_defined' | 'assigned' | null = null;
          if (hasEuMarket) {
            if (nbMap.size > 0) {
              notifiedBodyStatus = 'assigned';
            } else if (euRiskClass) {
              const normalized = euRiskClass.toLowerCase().replace(/^class[\s_-]*/i, '');
              const isClassI = normalized === 'i' || normalized === '1';
              notifiedBodyStatus = isClassI ? 'not_needed' : 'not_defined';
            }
          }
          
          const distributionPartners = Array.from(distributionMap.values());
          const clinicalPartners = Array.from(clinicalMap.values());
          const regulatoryPartners = Array.from(regulatoryMap.values());
          const notifiedBodies = Array.from(nbMap.values());
          
          // Only return if there's any partner data
          const hasAnyData = distributionPartners.length > 0 || 
                             clinicalPartners.length > 0 || 
                             regulatoryPartners.length > 0 || 
                             notifiedBodies.length > 0 ||
                             notifiedBodyStatus !== null;
          
          if (!hasAnyData) return null;
          
          return {
            distributionPartners,
            clinicalPartners,
            regulatoryPartners,
            notifiedBodies,
            hasNotifiedBodyRequirement: hasEuMarket && notifiedBodyStatus !== 'not_needed',
            notifiedBodyStatus,
          };
        })(),
      };
    },
    enabled: !!productId,
    staleTime: 0, // Always refetch to show latest Genesis data
    gcTime: 0, // Don't cache stale data
    refetchOnMount: 'always', // Refetch when drawer opens
    refetchOnWindowFocus: true,
  });
}
