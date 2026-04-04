import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeImageArray } from '@/utils/imageDataUtils';
import { getCalculatedViabilityScore } from '@/services/viabilityScore/getCalculatedViabilityScore';
import { deriveBusinessModelCanvas } from '@/services/deriveBusinessModelCanvas';
import { InvestorHeader } from '@/components/investor-view/InvestorHeader';
import { MediaGallery } from '@/components/investor-view/MediaGallery';
import { ViabilitySnapshot } from '@/components/investor-view/ViabilitySnapshot';
import { TechnicalProfile } from '@/components/investor-view/TechnicalProfile';
import { InvestorBusinessCanvas } from '@/components/investor-view/InvestorBusinessCanvas';
import { ExecutionTimeline } from '@/components/investor-view/ExecutionTimeline';
import { InvestorVentureBlueprint } from '@/components/investor-view/InvestorVentureBlueprint';
import { InvestorTeamProfile } from '@/components/investor-view/InvestorTeamProfile';
import { InvestorFooter } from '@/components/investor-view/InvestorFooter';
import { InvestorDealTracker } from '@/components/investor-view/InvestorDealTracker';
import { MonitorAccessRequestCard } from '@/components/investor-view/MonitorAccessRequestCard';
import { InvestorMarketSizing } from '@/components/investor-view/InvestorMarketSizing';
import { InvestorReimbursementStrategy } from '@/components/investor-view/InvestorReimbursementStrategy';
import { InvestorTeamGaps } from '@/components/investor-view/InvestorTeamGaps';
import { InvestorRegulatoryTimeline } from '@/components/investor-view/InvestorRegulatoryTimeline';
import { InvestorClinicalEvidence } from '@/components/investor-view/InvestorClinicalEvidence';
import { InvestorReadinessGates } from '@/components/investor-view/InvestorReadinessGates';
import { InvestorUseOfProceeds } from '@/components/investor-view/InvestorUseOfProceeds';
import { InvestorManufacturing } from '@/components/investor-view/InvestorManufacturing';
import { InvestorExitStrategy } from '@/components/investor-view/InvestorExitStrategy';
import { InvestorRiskSummary } from '@/components/investor-view/InvestorRiskSummary';
import { InvestorStrategicPartners } from '@/components/investor-view/InvestorStrategicPartners';
import { InvestorPartHeader } from '@/components/investor-view/InvestorPartHeader';
import { InvestorStakeholderProfiles } from '@/components/investor-view/InvestorStakeholderProfiles';
import { InvestorTargetMarkets } from '@/components/investor-view/InvestorTargetMarkets';
import { InvestorCompetitorAnalysis } from '@/components/investor-view/InvestorCompetitorAnalysis';
import { InvestorIPStrategy } from '@/components/investor-view/InvestorIPStrategy';
import { InvestorHEOR } from '@/components/investor-view/InvestorHEOR';
import { InvestorGTMStrategy } from '@/components/investor-view/InvestorGTMStrategy';
import { EssentialLifecycleCashFlowChart } from '@/components/product/business-case/EssentialLifecycleCashFlowChart';
import { RiskRadarChart } from '@/components/product/business-case/viability/RiskRadarChart';
import { ViabilityScoreBreakdown, ScoreBreakdownItem } from '@/components/investor-view/ViabilityScoreBreakdown';
import { SemiCircleGauge } from '@/components/ui/semi-circle-gauge';
import { Loader2, ArrowLeft, Lock, Gauge, Monitor, Cpu, HardDrive, FileText, Sparkles, Info, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { verifyAccessCode } from '@/services/investorShareService';
import type { InvestorViewData, MediaItem, VentureBlueprintStep } from '@/types/investorView';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useAuth } from '@/context/AuthContext';

interface InvestorViewPageProps {
  isMarketplaceMode?: boolean;
}

export default function InvestorViewPage({ isMarketplaceMode = false }: InvestorViewPageProps) {
  const { shareId, slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile: investorProfile, isLoading: investorLoading } = useInvestorProfile();
  const { user } = useAuth();
  const monitorAccessRef = useRef<HTMLDivElement>(null);

  // Access code protection state
  const [accessCode, setAccessCode] = useState('');
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Use slug from deal-flow route or shareId from investor route
  const lookupSlug = isMarketplaceMode ? slug : shareId;

  // Check if coming from deal flow marketplace or preview
  const fromDealFlow = searchParams.get('from') === 'deal-flow';
  const fromPreview = searchParams.get('from') === 'preview';

  // Query to check if access code protection is enabled (only for investor links, not marketplace)
  // This only checks IF protection is enabled, verification fetches fresh hash
  const { data: accessCodeData, isLoading: accessCodeLoading } = useQuery({
    queryKey: ['investor-view-access-check', lookupSlug, isMarketplaceMode],
    queryFn: async () => {
      // Skip access code check for marketplace - marketplace is public
      if (!lookupSlug || isMarketplaceMode) {
        return { hasAccessCode: false };
      }

      const { data: shareSettings, error } = await supabase
        .from('company_investor_share_settings')
        .select('access_code_hash')
        .eq('public_slug', lookupSlug)
        .eq('is_active', true)
        .single();

      if (error || !shareSettings) {
        return { hasAccessCode: false };
      }

      return {
        hasAccessCode: !!shareSettings.access_code_hash,
      };
    },
    enabled: !!lookupSlug,
    staleTime: 30 * 1000, // Cache for 30 seconds (short for access code check)
  });

  // Handle access code verification - fetches fresh hash from DB to handle regenerated codes
  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsVerifying(true);
    setAccessError('');

    try {
      // Fetch fresh access code hash from DB (handles regenerated codes)
      const { data: freshSettings, error } = await supabase
        .from('company_investor_share_settings')
        .select('access_code_hash')
        .eq('public_slug', lookupSlug)
        .eq('is_active', true)
        .single();

      if (error || !freshSettings?.access_code_hash) {
        // No access code required or link not found
        setIsAccessGranted(true);
        return;
      }

      const isValid = await verifyAccessCode(accessCode, freshSettings.access_code_hash);
      if (isValid) {
        setIsAccessGranted(true);
        setAccessError('');
      } else {
        setAccessError('Invalid access code. Please try again.');
      }
    } catch {
      setAccessError('Error verifying access code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Check if current user is a member of THIS company (to hide deal tracker for owners)
  const { data: companyMembershipData } = useQuery({
    queryKey: ['company-membership-check', user?.id, lookupSlug, isMarketplaceMode],
    queryFn: async () => {
      if (!user?.id || !lookupSlug) return { isMember: false };

      // First get the company_id from the share settings
      // Use marketplace_slug for marketplace mode, public_slug for investor mode
      const slugField = (isMarketplaceMode ? 'marketplace_slug' : 'public_slug') as 'marketplace_slug' | 'public_slug';
      const { data: shareSettings, error: shareError } = await (supabase as any)
        .from('company_investor_share_settings')
        .select('company_id')
        .eq(slugField as string, lookupSlug as string)
        .single();

      if (shareError || !shareSettings?.company_id) return { isMember: false };

      // Check if user is a member of THIS specific company
      const { data, error } = await supabase
        .from('user_company_access')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', shareSettings.company_id)
        .limit(1);

      return { isMember: !error && data && data.length > 0 };
    },
    enabled: !!user?.id && !!lookupSlug,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  // Fetch investor share settings and associated data
  const { data, isLoading, error } = useQuery({
    queryKey: ['investor-view', lookupSlug, isMarketplaceMode],
    queryFn: async (): Promise<InvestorViewData | null> => {
      if (!lookupSlug) return null;

      // 1. Fetch share settings (required first - others depend on it)
      const slugField = (isMarketplaceMode ? 'marketplace_slug' : 'public_slug') as 'marketplace_slug' | 'public_slug';
      const activeField = (isMarketplaceMode ? 'list_on_marketplace' : 'is_active') as 'list_on_marketplace' | 'is_active';
      const { data: shareSettings, error: shareError } = await (supabase as any)
        .from('company_investor_share_settings')
        .select('*')
        .eq(slugField, lookupSlug as string)
        .eq(activeField, true)
        .single();

      if (shareError || !shareSettings) {
        throw new Error('Invalid or expired share link');
      }

      // 2. Fetch company and product in parallel (both depend only on shareSettings)
      const productQuery = shareSettings.featured_product_id
        ? supabase
            .from('products')
            .select('*')
            .eq('id', shareSettings.featured_product_id)
            .single()
        : supabase
            .from('products')
            .select('*')
            .eq('company_id', shareSettings.company_id)
            .eq('is_archived', false)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

      const [companyResult, productResult] = await Promise.all([
        supabase
          .from('companies')
          .select('id, name, email, logo_url')
          .eq('id', shareSettings.company_id)
          .single(),
        productQuery,
      ]);

      if (companyResult.error) throw companyResult.error;
      if (productResult.error) throw productResult.error;

      const company = companyResult.data;
      const product = productResult.data;

      // 3. Fetch ALL product-related data in parallel (all depend only on product.id)
      const [
        calculatedScore,
        gtmStrategyResult,
        blueprintResult,
        lifecyclePhasesResult,
        teamMembersResult,
        marketSizingResult,
        reimbursementResult,
        teamGapsResult,
        regulatoryTimelineResult,
        clinicalEvidenceResult,
        readinessGatesResult,
        npvAnalysisResult,
        useOfProceedsResult,
        manufacturingResult,
        exitStrategyResult,
        hazardsResult,
        businessCanvasResult,
        competitorsResult,
        ipAssetsResult,
      ] = await Promise.all([
        getCalculatedViabilityScore(product.id),
        supabase
          .from('product_gtm_strategy')
          .select('channels, territory_priority, buyer_persona, budget_cycle, sales_cycle_weeks')
          .eq('product_id', product.id)
          .maybeSingle(),
        supabase
          .from('product_venture_blueprints')
          .select('activity_notes')
          .eq('product_id', product.id)
          .maybeSingle(),
        supabase
          .from('lifecycle_phases')
          .select('id, name, start_date, end_date')
          .eq('product_id', product.id)
          .order('start_date', { ascending: true }),
        supabase
          .from('team_members')
          .select('id, name, role, bio, avatar_url, linkedin_url')
          .eq('product_id', product.id)
          .order('inserted_at', { ascending: true }),
        supabase
          .from('product_market_sizing')
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        supabase
          .from('product_reimbursement_strategy')
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        supabase
          .from('product_team_gaps')
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        supabase
          .from('product_regulatory_timeline')
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        supabase
          .from('product_clinical_evidence_plan')
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        supabase
          .from('product_readiness_gates')
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        supabase
          .from('product_npv_analyses')
          .select('*')
          .eq('product_id', product.id)
          .eq('scenario_name', 'Base Case')
          .maybeSingle(),
        // Step 20: Use of Proceeds
        supabase
          .from('product_use_of_proceeds')
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        // Step 24: Manufacturing
        supabase
          .from('product_manufacturing')
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        // Step 25: Exit Strategy
        supabase
          .from('product_exit_strategy' as any)
          .select('*')
          .eq('product_id', product.id)
          .maybeSingle(),
        // Hazards for risk summary (top 20 by severity)
        supabase
          .from('hazards')
          .select('id, description, category, initial_severity, residual_risk_level, residual_risk, mitigation_measure, risk_control_measure')
          .eq('product_id', product.id)
          .order('initial_severity', { ascending: false })
          .limit(20),
        // Business Canvas - user-edited content from Step 25
        supabase
          .from('business_canvas')
          .select('key_partnerships, key_activities, key_resources, value_propositions, customer_relationships, channels, customer_segments, cost_structure, revenue_streams')
          .eq('product_id', product.id)
          .maybeSingle(),
        // Competitors (Step 12)
        supabase
          .from('product_manual_competitors')
          .select('id, competitor_company, product_name, market, device_classification, regulatory_status, market_share_estimate, homepage_url')
          .eq('product_id', product.id),
        // IP Assets via junction table (Step 13)
        supabase
          .from('ip_asset_products')
          .select('ip_asset_id, ip_assets:ip_asset_id (id, ip_type, title, status, priority_date, notes)')
          .eq('product_id', product.id),
      ]);

      // Extract data from results
      const gtmStrategyData = gtmStrategyResult.data;
      const blueprintData = blueprintResult.data;
      const lifecyclePhases = lifecyclePhasesResult.data;
      const teamMembers = teamMembersResult.data;
      const marketSizingData = marketSizingResult.data;
      const reimbursementStrategyData = reimbursementResult.data;
      const teamGapsData = teamGapsResult.data;
      const regulatoryTimelineData = regulatoryTimelineResult.data;
      const clinicalEvidenceData = clinicalEvidenceResult.data;
      const readinessGatesData = readinessGatesResult.data;
      const npvAnalysisData = npvAnalysisResult.data;
      const useOfProceedsData = useOfProceedsResult.data;
      const manufacturingData = manufacturingResult.data;
      const exitStrategyData = exitStrategyResult.data;
      const hazardsData = hazardsResult.data || [];
      const businessCanvasData = businessCanvasResult.data;
      const competitorsData = competitorsResult.data || [];
      const ipAssetsData = ipAssetsResult.data || [];
      const STEP_TITLES: Record<number, { title: string; phaseId: number; phaseTitle: string }> = {
        1: { title: 'Clinical or User Need', phaseId: 1, phaseTitle: 'Opportunity & Definition' },
        2: { title: 'Market & Competitor Analysis', phaseId: 1, phaseTitle: 'Opportunity & Definition' },
        3: { title: 'Core Solution Concept', phaseId: 1, phaseTitle: 'Opportunity & Definition' },
        4: { title: 'User & Economic Buyer Profile', phaseId: 1, phaseTitle: 'Opportunity & Definition' },
        5: { title: 'Quantified Value Proposition', phaseId: 2, phaseTitle: 'Feasibility & Planning' },
        6: { title: 'Regulatory & Compliance Assessment', phaseId: 2, phaseTitle: 'Feasibility & Planning' },
        7: { title: 'Technical Feasibility & Risk', phaseId: 2, phaseTitle: 'Feasibility & Planning' },
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

      // Transform data to InvestorViewData format
      // Build media items - merge DB images + storage bucket images (same as drawer)
      const mediaItems: MediaItem[] = [];

      // Collect image URLs from both sources
      const dbImageUrls = sanitizeImageArray(product.images);
      const allImageUrls = new Set(dbImageUrls);

      // Also fetch images from Supabase storage bucket (some images only exist there)
      try {
        const { data: storageFiles } = await supabase.storage
          .from('product-images')
          .list('', { search: `${product.id}-`, limit: 100 });
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

      // Helper to parse device type (handles JSON strings stored in text column)
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

      // Helper to extract device type display string
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
        
        // Plain string value (not JSON)
        if (typeof deviceType === 'string' && !deviceType.trim().startsWith('{')) {
          return deviceType;
        }
        
        return 'Medical Device';
      };

      // Extract device characteristics for Technical Profile
      const extractDeviceCharacteristics = (deviceType: any) => {
        const parsed = parseDeviceType(deviceType);
        if (!parsed) {
          return {
            primaryRegulatoryType: 'Medical Device',
            coreDeviceNature: null as string | null,
            isActiveDevice: null as boolean | null,
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

        // Active Device status
        let isActiveDevice: boolean | null = null;
        if (parsed.isActive !== undefined) {
          isActiveDevice = parsed.isActive === true || parsed.isActive === 'active';
        } else if (parsed.activeStatus) {
          isActiveDevice = parsed.activeStatus === 'active';
        }

        return {
          primaryRegulatoryType,
          coreDeviceNature,
          isActiveDevice,
        };
      };

      const deviceCharacteristics = extractDeviceCharacteristics(product.device_type);

      // Generate device badges
      const deviceBadges: string[] = [];
      if (product.class) deviceBadges.push(`Class ${product.class}`);
      
      // Handle device_type - parse JSON strings and extract properties
      if (product.device_type) {
        const parsedDT = parseDeviceType(product.device_type);
        if (parsedDT?.invasivenessLevel) {
          deviceBadges.push(parsedDT.invasivenessLevel);
        } else if (typeof product.device_type === 'string' && !product.device_type.trim().startsWith('{')) {
          deviceBadges.push(product.device_type);
        }
      }
      if (product.regulatory_status) deviceBadges.push(product.regulatory_status);

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

      // Parse text fields to arrays
      const parseToArray = (text: string | null | undefined): string[] => {
        if (!text) return [];
        return text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
      };

      // Extract primary market
      const extractPrimaryMarket = (markets: any): string => {
        if (!markets) return 'Global';
        
        // Handle array format (current format)
        if (Array.isArray(markets)) {
          const selectedMarket = markets.find((m: any) => m.selected) || markets[0];
          if (selectedMarket) {
            return selectedMarket.name || selectedMarket.code?.toUpperCase() || 'Global';
          }
          return 'Global';
        }
        
        // Handle object format (legacy format)
        if (typeof markets === 'object') {
          const marketKeys = Object.keys(markets);
          return marketKeys.length > 0 ? marketKeys[0].toUpperCase() : 'Global';
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

      return {
        shareSettingsId: shareSettings.id,
        companyId: shareSettings.company_id,
        productId: product.id,
        companyName: company.name,
        companyLogo: company.logo_url || undefined,
        founderEmail: company.email || '',
        productName: product.name || 'Medical Device',
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
        intendedPurpose: product.intended_use || 'Medical device for healthcare applications',
        description: product.description || '',
        actualValueProposition: ((product as any).intended_purpose_data as any)?.valueProposition || '',
        keyFeatures: (() => {
          const kf = (product as any).key_features;
          if (Array.isArray(kf)) return kf.map((f: any) => typeof f === 'string' ? f : (f?.name || '')).filter((s: string) => s.trim());
          return [];
        })(),
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
        deviceBadges,
        primaryRegulatoryType: deviceCharacteristics.primaryRegulatoryType,
        coreDeviceNature: deviceCharacteristics.coreDeviceNature,
        isActiveDevice: deviceCharacteristics.isActiveDevice,
        targetMarket: extractPrimaryMarket(product.markets),
        classification: extractHighestClassification(product.markets, product.key_technology_characteristics),
        // Funding requirements from share settings
        fundingAmount: (shareSettings as any).funding_amount || null,
        fundingCurrency: (shareSettings as any).funding_currency || null,
        fundingStage: (shareSettings as any).funding_stage || null,
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
              ip_strategy_summary: product.ip_strategy_summary,
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
        currentPhase,
        // Phase dates: Use Essential Gates (product_readiness_gates) as single source of truth
        phaseDates: readinessGatesData?.gates && Array.isArray(readinessGatesData.gates) && readinessGatesData.gates.length > 0
          ? (readinessGatesData.gates as unknown as { phaseId: string; startDate?: string; endDate?: string }[]).map(gate => ({
              phaseId: gate.phaseId,
              startDate: gate.startDate || undefined,
              endDate: gate.endDate || undefined,
            }))
          : [], // Empty array if no gates configured - timeline will show without dates
        isVerified: true,
        generatedAt: new Date().toISOString(),
        // Venture Blueprint steps
        ventureBlueprintSteps,
        // Team members
        teamMembers: teamMembers || [],
        // Visibility settings from share configuration
        // Use mp_show_* for marketplace mode, show_* for investor mode
        showViabilityScore: isMarketplaceMode
          ? ((shareSettings as any).mp_show_viability_score ?? false)
          : (shareSettings.show_viability_score ?? true),
        showTechnicalSpecs: isMarketplaceMode
          ? ((shareSettings as any).mp_show_technical_specs ?? false)
          : (shareSettings.show_technical_specs ?? true),
        showMediaGallery: isMarketplaceMode
          ? ((shareSettings as any).mp_show_media_gallery ?? true)
          : (shareSettings.show_media_gallery ?? true),
        showBusinessCanvas: isMarketplaceMode
          ? ((shareSettings as any).mp_show_business_canvas ?? false)
          : (shareSettings.show_business_canvas ?? true),
        showRoadmap: isMarketplaceMode
          ? ((shareSettings as any).mp_show_roadmap ?? false)
          : (shareSettings.show_roadmap ?? true),
        showTeamProfile: isMarketplaceMode
          ? ((shareSettings as any).mp_show_team_profile ?? false)
          : (shareSettings.show_team_profile ?? true),
        showVentureBlueprint: isMarketplaceMode
          ? ((shareSettings as any).mp_show_venture_blueprint ?? false)
          : ((shareSettings as any).show_venture_blueprint ?? true),
        // Investor Deep Dive Modules
        showMarketSizing: isMarketplaceMode
          ? ((shareSettings as any).mp_show_market_sizing ?? false)
          : ((shareSettings as any).show_market_sizing ?? true),
        showReimbursementStrategy: isMarketplaceMode
          ? ((shareSettings as any).mp_show_reimbursement_strategy ?? false)
          : ((shareSettings as any).show_reimbursement_strategy ?? true),
        showTeamGaps: isMarketplaceMode
          ? ((shareSettings as any).mp_show_team_gaps ?? false)
          : ((shareSettings as any).show_team_gaps ?? true),
        showRegulatoryTimeline: isMarketplaceMode
          ? ((shareSettings as any).mp_show_regulatory_timeline ?? false)
          : ((shareSettings as any).show_regulatory_timeline ?? true),
        showClinicalEvidence: isMarketplaceMode
          ? ((shareSettings as any).mp_show_clinical_evidence ?? false)
          : ((shareSettings as any).show_clinical_evidence ?? true),
        showReadinessGates: isMarketplaceMode
          ? ((shareSettings as any).mp_show_readiness_gates ?? false)
          : ((shareSettings as any).show_readiness_gates ?? true),
        // Investor Deep Dive Data
        marketSizingData: marketSizingData as any,
        reimbursementStrategyData: reimbursementStrategyData as any,
        teamGapsData: teamGapsData as any,
        regulatoryTimelineData: regulatoryTimelineData as any,
        clinicalEvidenceData: clinicalEvidenceData as any,
        readinessGatesData: readinessGatesData as any,
        // Step 20, 24, 25: New Genesis sections
        showUseOfProceeds: isMarketplaceMode
          ? ((shareSettings as any).mp_show_use_of_proceeds ?? false)
          : ((shareSettings as any).show_use_of_proceeds ?? true),
        showManufacturing: isMarketplaceMode
          ? ((shareSettings as any).mp_show_manufacturing ?? false)
          : ((shareSettings as any).show_manufacturing ?? true),
        showExitStrategy: isMarketplaceMode
          ? ((shareSettings as any).mp_show_exit_strategy ?? false)
          : ((shareSettings as any).show_exit_strategy ?? true),
        useOfProceedsData: useOfProceedsData as any,
        manufacturingData: manufacturingData ? {
          ...(manufacturingData as any),
          cmo_partners: ((manufacturingData as any).cmo_partners as any[]) || [],
          single_source_components: ((manufacturingData as any).single_source_components as any[]) || [],
        } : null,
        exitStrategyData: exitStrategyData ? (() => {
          const data = exitStrategyData as any;
          return {
            potential_acquirers: (data.potential_acquirers as any[]) || [],
            comparable_transactions: (data.comparable_transactions as any[]) || [],
            strategic_rationale: data.strategic_rationale,
            exit_timeline_years: data.exit_timeline_years,
            preferred_exit_type: data.preferred_exit_type,
            selected_endgame: data.selected_endgame,
            endgame_metrics_focus: data.endgame_metrics_focus,
          };
        })() : null,
        // NPV/Revenue data for lifecycle chart
        launchDate: product.projected_launch_date || product.actual_launch_date || null,
        npvData: npvAnalysisData ? {
          npv: npvAnalysisData.total_portfolio_npv || 0,
          marketInputData: npvAnalysisData.market_input_data as Record<string, any> || undefined,
        } : null,
        // Risk Summary visibility and data
        showRiskSummary: isMarketplaceMode
          ? ((shareSettings as any).mp_show_risk_summary ?? false)
          : ((shareSettings as any).show_risk_summary ?? true),
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

        // Selected market code
        selectedMarketCode: (() => {
          const markets = (product as any).markets;
          if (!Array.isArray(markets)) return undefined;
          const selected = markets.find((m: any) => m.selected);
          return selected?.code || undefined;
        })(),

        // GTM Strategy visibility
        showGTMStrategy: isMarketplaceMode
          ? ((shareSettings as any).mp_show_gtm_strategy ?? false)
          : ((shareSettings as any).show_gtm_strategy ?? true),

        // Part II: Stakeholder Profiles (Steps 8-9)
        stakeholderProfilesData: (() => {
          const ipd = (product as any).intended_purpose_data as Record<string, any> | null;
          let patientPop: string[] = [];
          const rawPatientPop = ipd?.targetPopulation || ipd?.patient_population;
          if (rawPatientPop) {
            if (Array.isArray(rawPatientPop)) patientPop = rawPatientPop;
            else if (typeof rawPatientPop === 'string') patientPop = rawPatientPop.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          let envOfUse: string[] = [];
          const rawEnvOfUse = ipd?.useEnvironment || ipd?.environment_of_use;
          if (rawEnvOfUse) {
            if (Array.isArray(rawEnvOfUse)) envOfUse = rawEnvOfUse;
            else if (typeof rawEnvOfUse === 'string') envOfUse = rawEnvOfUse.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          let intendedUsers: string | undefined;
          const rawIntendedUsers = (product as any).intended_users || ipd?.intendedUsers;
          if (Array.isArray(rawIntendedUsers)) intendedUsers = rawIntendedUsers.join(', ');
          else if (typeof rawIntendedUsers === 'string') intendedUsers = rawIntendedUsers;

          const markets = (product as any).markets;
          let buyerType: string | undefined;
          let budgetType: string | undefined;
          if (Array.isArray(markets)) {
            const selectedMarket = markets.find((m: any) => m.selected && (m.buyerType || m.budgetType));
            if (selectedMarket) { buyerType = selectedMarket.buyerType; budgetType = selectedMarket.budgetType; }
          }
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
            code: m.code, name: m.name, selected: m.selected || false,
            riskClass: m.riskClass, regulatoryStatus: m.regulatoryStatus,
            marketLaunchStatus: m.marketLaunchStatus, launchDate: m.launchDate,
          }));
        })(),
        territoryPriority: (() => {
          const tp = gtmStrategyData?.territory_priority;
          if (!Array.isArray(tp)) return undefined;
          return tp.map((t: any) => ({ code: t.code, name: t.name, priority: t.priority, rationale: t.rationale }));
        })(),

        // Part II: Competitor Analysis (Step 12)
        competitorsData: (competitorsData || []).map((c: any) => ({
          id: c.id, competitor_company: c.competitor_company, product_name: c.product_name,
          market: c.market, device_classification: c.device_classification,
          regulatory_status: c.regulatory_status, market_share_estimate: c.market_share_estimate,
          homepage_url: c.homepage_url,
        })),

        // Part III: IP Strategy (Step 13)
        ipStrategyData: (() => {
          const rawAssets = (ipAssetsData || []) as any[];
          const assets = rawAssets.map((row: any) => row.ip_assets).filter(Boolean);
          const hasFTO = (product as any).fto_status || (product as any).fto_certainty;
          if (assets.length === 0 && !hasFTO) return null;
          return {
            assets: assets.map((a: any) => ({
              id: a.id, type: a.ip_type, title: a.title, status: a.status,
              filingDate: a.priority_date, expiryDate: null, jurisdiction: null,
            })),
            ftoStatus: (product as any).fto_status || null,
            ftoCertainty: (product as any).fto_certainty || null,
            ftoNotes: (product as any).fto_notes || null,
          };
        })(),

        // Part III: HEOR (Step 15)
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

        // Part III: GTM Strategy Data (Step 18)
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

        // Part V: Strategic Partners (Step 20)
        strategicPartnersData: (() => {
          const markets = (product as any).markets as any[] | null;
          if (!Array.isArray(markets)) return null;
          const selectedMarkets = markets.filter((m: any) => m.selected);
          if (selectedMarkets.length === 0) return null;

          const distributionMap = new Map<string, { name: string; markets: string[] }>();
          const clinicalMap = new Map<string, { name: string; markets: string[] }>();
          const regulatoryMap = new Map<string, { name: string; markets: string[] }>();
          const nbMap = new Map<string, { name: string; nbNumber: number; markets: string[] }>();
          let hasEuMarket = false;
          let euRiskClass: string | null = null;

          selectedMarkets.forEach((market: any) => {
            const marketLabel = market.name || market.code || 'Unknown';
            if (market.code === 'EU') { hasEuMarket = true; euRiskClass = market.riskClass || null; }
            if (Array.isArray(market.distributionPartners)) {
              market.distributionPartners.forEach((p: any) => {
                if (p.name) { const e = distributionMap.get(p.name); if (e) e.markets.push(marketLabel); else distributionMap.set(p.name, { name: p.name, markets: [marketLabel] }); }
              });
            }
            if (Array.isArray(market.clinicalPartners)) {
              market.clinicalPartners.forEach((p: any) => {
                if (p.name) { const e = clinicalMap.get(p.name); if (e) e.markets.push(marketLabel); else clinicalMap.set(p.name, { name: p.name, markets: [marketLabel] }); }
              });
            }
            if (Array.isArray(market.regulatoryPartners)) {
              market.regulatoryPartners.forEach((p: any) => {
                if (p.name) { const e = regulatoryMap.get(p.name); if (e) e.markets.push(marketLabel); else regulatoryMap.set(p.name, { name: p.name, markets: [marketLabel] }); }
              });
            }
            if (market.notifiedBody?.name) {
              const nbName = market.notifiedBody.name;
              const e = nbMap.get(nbName);
              if (e) e.markets.push(marketLabel); else nbMap.set(nbName, { name: nbName, nbNumber: market.notifiedBody.nb_number || 0, markets: [marketLabel] });
            }
          });

          let notifiedBodyStatus: 'not_needed' | 'not_defined' | 'assigned' | null = null;
          if (hasEuMarket) {
            if (nbMap.size > 0) notifiedBodyStatus = 'assigned';
            else if (euRiskClass) {
              const normalized = euRiskClass.toLowerCase().replace(/^class[\s_-]*/i, '');
              notifiedBodyStatus = (normalized === 'i' || normalized === '1') ? 'not_needed' : 'not_defined';
            }
          }
          const distributionPartners = Array.from(distributionMap.values());
          const clinicalPartners = Array.from(clinicalMap.values());
          const regulatoryPartners = Array.from(regulatoryMap.values());
          const notifiedBodies = Array.from(nbMap.values());
          const hasAnyData = distributionPartners.length > 0 || clinicalPartners.length > 0 || regulatoryPartners.length > 0 || notifiedBodies.length > 0 || notifiedBodyStatus !== null;
          if (!hasAnyData) return null;
          return { distributionPartners, clinicalPartners, regulatoryPartners, notifiedBodies, hasNotifiedBodyRequirement: hasEuMarket && notifiedBodyStatus !== 'not_needed', notifiedBodyStatus };
        })(),

        // Target population & use environment (for device description section)
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
      };
    },
    enabled: !!lookupSlug,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  if (isLoading || accessCodeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold">Share Link Not Found</h1>
          <p className="text-muted-foreground">
            This investor view link is invalid, expired, or has been disabled.
          </p>
        </div>
      </div>
    );
  }

  // Show access code screen if required and not yet granted
  if (accessCodeData?.hasAccessCode && !isAccessGranted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Protected Content</h2>
              <p className="text-muted-foreground">
                Enter the access code to view this investor portfolio.
              </p>
            </div>
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 6-digit access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
              {accessError && (
                <p className="text-destructive text-sm text-center">{accessError}</p>
              )}
              <Button type="submit" className="w-full" disabled={isVerifying || !accessCode}>
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Access Content'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRequestMonitorAccess = () => {
    if (!investorProfile) {
      // Not logged in - redirect to investor registration
      navigate(`/investor/register?returnTo=/investor/${shareId}`);
    } else if (monitorAccessRef.current) {
      // Logged in - scroll to the monitor access card
      monitorAccessRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Return to Deal Flow Banner */}
      {fromDealFlow && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white py-2 sm:py-2.5 px-3 sm:px-4 sticky top-0 z-50 border-b border-slate-600/50">
          <div className="max-w-[1800px] w-full mx-auto px-2 lg:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <button
              onClick={() => navigate('/investor/deal-flow')}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Deal Flow</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
              <span className="text-slate-300 hidden sm:inline">Viewing from Deal Flow</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-white font-medium truncate max-w-[150px] sm:max-w-none">{data.productName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 truncate max-w-[100px] sm:max-w-none">{data.companyName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Return to Preview Banner */}
      {fromPreview && (
        <div className="bg-gradient-to-r from-primary/90 to-primary text-white py-2 sm:py-2.5 px-3 sm:px-4 sticky top-0 z-50 border-b border-primary/50">
          <div className="max-w-[1800px] w-full mx-auto px-2 lg:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-xs sm:text-sm text-white/90 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Marketplace Preview</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="text-white/80">Preview Mode</span>
              <span className="text-white/50">•</span>
              <span className="text-white font-medium truncate max-w-[150px] sm:max-w-none">{data.productName}</span>
            </div>
          </div>
        </div>
      )}

      <InvestorHeader
        companyName={data.companyName}
        companyLogo={data.companyLogo}
        founderEmail={data.founderEmail}
        isVerified={data.isVerified}
        productName={data.productName}
        onRequestMonitorAccess={handleRequestMonitorAccess}
      />

      <main className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 space-y-8 sm:space-y-12 lg:space-y-16">
        {/* Executive Summary: 3 cards in a row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Viability Scorecard */}
          {data.showViabilityScore && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Viability Scorecard
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Overall product readiness assessment
              </p>
              <div className="mt-[100px] transform scale-[0.6] origin-top -mb-24">
                <ViabilityScoreBreakdown
                  totalScore={data.viabilityScore}
                  regulatory={data.scoreBreakdown?.regulatory || { score: data.regulatoryScore, maxScore: 30, source: 'Device Definition' }}
                  clinical={data.scoreBreakdown?.clinical || { score: data.clinicalScore, maxScore: 30, source: 'Clinical Evidence Plan' }}
                  reimbursement={data.scoreBreakdown?.reimbursement || { score: data.reimbursementScore, maxScore: 20, source: 'Reimbursement Strategy' }}
                  technical={data.scoreBreakdown?.technical || { score: data.technicalScore, maxScore: 20, source: 'Risk Analysis' }}
                  missingInputs={data.scoreBreakdown?.missingInputs || []}
                >
                  <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors group" aria-label="View score breakdown">
                    <Info className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </ViabilityScoreBreakdown>
                <SemiCircleGauge score={data.viabilityScore} variant="investor" />
              </div>
            </div>
          )}

          {/* Product Lifecycle Cash Flow */}
          {data.npvData && (
            <EssentialLifecycleCashFlowChart
              productId={data.productId}
              launchDate={data.launchDate}
              marketInputData={data.npvData.marketInputData}
              selectedMarketCode={data.selectedMarketCode}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          )}

          {/* Risk Profile Analysis */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Risk Profile Analysis
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Compare device risk profile against industry benchmarks
            </p>
            <RiskRadarChart
              regulatoryScore={data.regulatoryScore}
              clinicalScore={data.clinicalScore}
              reimbursementScore={data.reimbursementScore}
              technicalScore={data.technicalScore}
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            PART I: PRODUCT & TECHNOLOGY FOUNDATION
        ═══════════════════════════════════════════════════════════════ */}
        <InvestorPartHeader
          partNumber="I"
          title="Product & Technology Foundation"
          subtitle="The 'What' and the 'How.'"
        />

        {/* Hero Section: Media Gallery + Device Description */}
          <section>
            <div>
              {data.showMediaGallery && (
                data.mediaItems.length > 0 ? (
                  <MediaGallery mediaItems={data.mediaItems} />
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                    <p className="text-muted-foreground text-sm">No media uploaded yet</p>
                  </div>
                )
              )}
              {/* Device Description + Intended Use + Value Proposition + Key Features + Target Population + Use Environment */}
              {(data.description || data.intendedPurpose || data.actualValueProposition || data.keyFeatures.length > 0) && (
                <div className="mt-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                  {data.description && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Device Description
                      </h3>
                      <p className="text-foreground leading-relaxed">{data.description}</p>
                    </>
                  )}
                  {data.intendedPurpose && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                        <FileText className="h-4 w-4" />
                        Intended Use
                      </h3>
                      <p className="text-foreground leading-relaxed">{data.intendedPurpose}</p>
                    </>
                  )}
                  {data.actualValueProposition && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                        <Sparkles className="h-4 w-4" />
                        Value Proposition
                      </h3>
                      <p className="text-foreground leading-relaxed">{data.actualValueProposition}</p>
                    </>
                  )}
                  {data.keyFeatures.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                        <Sparkles className="h-4 w-4" />
                        Key Features
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {data.keyFeatures.map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                  {data.targetPopulation && data.targetPopulation.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                        <Users className="h-4 w-4" />
                        Target Population
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {data.targetPopulation.map((pop: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                            {pop}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                  {data.useEnvironment && data.useEnvironment.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 pt-2 border-t">
                        <Building2 className="h-4 w-4" />
                        Use Environment
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {data.useEnvironment.map((env: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                            {env}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>

        {/* TRL & System Architecture */}
        {(data.trlLevel || data.systemArchitecture) && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Technology Readiness
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.trlLevel && (
                <Card className="p-6 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Gauge className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-1">Technology Readiness Level</div>
                      <div className="text-lg font-semibold text-foreground">{data.trlLabel}</div>
                      {data.trlDescription && <p className="text-sm text-muted-foreground mt-1">{data.trlDescription}</p>}
                      {data.trlNotes && <p className="text-sm text-muted-foreground mt-2 italic border-t pt-2">{data.trlNotes}</p>}
                      <div className="mt-3 flex gap-1">
                        {[3, 4, 5, 6, 7, 8].map(level => (
                          <div key={level} className={cn("h-2 flex-1 rounded-full transition-colors", level <= data.trlLevel! ? "bg-primary" : "bg-muted")} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">TRL 3</span>
                        <span className="text-[10px] text-muted-foreground">TRL 8</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
              {data.systemArchitecture && (
                <Card className="p-6 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                      {data.systemArchitecture === 'samd' ? <Monitor className="h-6 w-6 text-accent-foreground" /> : data.systemArchitecture === 'simd' ? <Cpu className="h-6 w-6 text-accent-foreground" /> : <HardDrive className="h-6 w-6 text-accent-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-muted-foreground mb-1">System Architecture</div>
                      <div className="text-lg font-semibold text-foreground">
                        {data.systemArchitecture === 'samd' ? 'Software as a Medical Device (SaMD)' : data.systemArchitecture === 'simd' ? 'Software in a Medical Device (SiMD)' : 'No Software Used'}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {data.systemArchitecture === 'samd' ? 'Standalone software intended for medical purposes' : data.systemArchitecture === 'simd' ? 'Software embedded within a hardware medical device' : 'Pure hardware device without software components'}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Technical Profile (Classification) */}
        {data.showTechnicalSpecs && (
          <TechnicalProfile
            primaryRegulatoryType={data.primaryRegulatoryType}
            coreDeviceNature={data.coreDeviceNature}
            isActiveDevice={data.isActiveDevice}
            targetMarket={data.targetMarket}
            classification={data.classification}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PART II: MARKET & STAKEHOLDER ANALYSIS
        ═══════════════════════════════════════════════════════════════ */}
        <InvestorPartHeader
          partNumber="II"
          title="Market & Stakeholder Analysis"
          subtitle="The 'Who' and the 'Why.'"
        />

        {/* Stakeholder Profiles (Steps 8-9) */}
        {data.stakeholderProfilesData && (
          <InvestorStakeholderProfiles data={data.stakeholderProfilesData} />
        )}

        {/* Target Markets (Step 10) */}
        {data.marketsData && data.marketsData.length > 0 && (
          <InvestorTargetMarkets
            markets={data.marketsData}
            territoryPriority={data.territoryPriority}
          />
        )}

        {/* Market Sizing (Step 11) */}
        {data.showMarketSizing && data.marketSizingData && (
          <InvestorMarketSizing data={data.marketSizingData} />
        )}

        {/* Competitor Analysis (Step 12) */}
        {data.competitorsData && data.competitorsData.length > 0 && (
          <InvestorCompetitorAnalysis competitors={data.competitorsData} />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PART III: STRATEGY & EVIDENCE
        ═══════════════════════════════════════════════════════════════ */}
        <InvestorPartHeader
          partNumber="III"
          title="Strategy & Evidence"
          subtitle="The 'Barriers' and the 'Validation.'"
        />

        {/* IP Strategy (Step 13) */}
        {data.ipStrategyData && (
          <InvestorIPStrategy data={data.ipStrategyData} />
        )}

        {/* Regulatory Timeline */}
        {data.showRegulatoryTimeline && data.regulatoryTimelineData && (
          <InvestorRegulatoryTimeline data={data.regulatoryTimelineData} />
        )}

        {/* Clinical Evidence */}
        {data.showClinicalEvidence && data.clinicalEvidenceData && (
          <InvestorClinicalEvidence data={data.clinicalEvidenceData} deviceClass={data.classification} />
        )}

        {/* Health Economics (Step 15) */}
        {data.heorData && (
          <InvestorHEOR data={data.heorData} />
        )}

        {/* Reimbursement Strategy */}
        {data.showReimbursementStrategy && data.reimbursementStrategyData && (
          <InvestorReimbursementStrategy data={data.reimbursementStrategyData} />
        )}

        {/* Executive Risk Summary */}
        {data.showRiskSummary && data.riskSummaryData && (
          <InvestorRiskSummary data={data.riskSummaryData} />
        )}

        {/* Go-to-Market Strategy (Step 18) */}
        {data.showGTMStrategy && data.gtmData && (
          <InvestorGTMStrategy data={data.gtmData} />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PART V: OPERATIONAL EXECUTION & LOGISTICS
        ═══════════════════════════════════════════════════════════════ */}
        <InvestorPartHeader
          partNumber="V"
          title="Operational Execution & Logistics"
          subtitle="The 'Action Plan.'"
        />

        {/* Team Profile */}
        {data.showTeamProfile && data.teamMembers.length > 0 && (
          <InvestorTeamProfile teamMembers={data.teamMembers} />
        )}

        {/* Team Gaps */}
        {data.showTeamGaps && data.teamGapsData && (
          <InvestorTeamGaps data={data.teamGapsData} />
        )}

        {/* Strategic Partners (Step 20) */}
        {data.strategicPartnersData && (
          <InvestorStrategicPartners data={data.strategicPartnersData} />
        )}

        {/* Manufacturing */}
        {data.showManufacturing && data.manufacturingData && (
          <InvestorManufacturing data={data.manufacturingData} />
        )}

        {/* Execution Timeline */}
        {data.showRoadmap && (
          <ExecutionTimeline currentPhase={data.currentPhase} phaseDates={data.phaseDates} />
        )}

        {/* Readiness Gates */}
        {data.showReadinessGates && data.readinessGatesData && (
          <InvestorReadinessGates data={data.readinessGatesData} />
        )}

        {/* Use of Proceeds */}
        {data.showUseOfProceeds && data.useOfProceedsData && (
          <InvestorUseOfProceeds data={data.useOfProceedsData} />
        )}

        {/* Business Model Canvas */}
        {data.showBusinessCanvas && (
          <InvestorBusinessCanvas
            keyPartners={data.keyPartners}
            keyActivities={data.keyActivities}
            keyResources={data.keyResources}
            valuePropositions={data.valuePropositions}
            customerRelationships={data.customerRelationships}
            channels={data.channels}
            customerSegments={data.customerSegments}
            costStructure={data.costStructure}
            revenueStreams={data.revenueStreams}
            showEmptyBlocks={true}
          />
        )}

        {/* Strategic Blueprint (Venture Blueprint) */}
        {data.showVentureBlueprint && data.ventureBlueprintSteps.length > 0 && (
          <InvestorVentureBlueprint steps={data.ventureBlueprintSteps} />
        )}

        {/* Exit Strategy */}
        {data.showExitStrategy && data.exitStrategyData && (
          <InvestorExitStrategy data={data.exitStrategyData} />
        )}
      </main>

      {/* Investor Deal Tracker - Only show for authenticated investors who are NOT company owners */}
      {investorProfile && !companyMembershipData?.isMember && (
        <InvestorDealTracker shareSettingsId={data.shareSettingsId} />
      )}

      <InvestorFooter />
    </div>
  );
}
