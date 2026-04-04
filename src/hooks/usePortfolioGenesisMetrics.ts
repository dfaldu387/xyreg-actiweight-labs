import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeviceGenesisMetrics {
  productId: string;
  productName: string;
  deviceClass: string | null;
  lifecyclePhase: string | null;
  readinessPercentage: number;
  viabilityScore: number | null;
  tamValue: number | null;
  checklistCompletion: {
    deviceDescription: boolean;
    viabilityScorecard: boolean;
    ventureBlueprint: boolean;
    businessCanvas: boolean;
    teamProfile: boolean;
    essentialGates: boolean;
    clinicalEvidence: boolean;
    marketSizing: boolean;
    reimbursementStrategy: boolean;
  };
}

export interface PortfolioGenesisMetrics {
  totalDevices: number;
  averageReadiness: number;
  investorReadyCount: number;
  needsAttentionCount: number;
  devices: DeviceGenesisMetrics[];
  checklistTotals: {
    deviceDescription: number;
    viabilityScorecard: number;
    ventureBlueprint: number;
    businessCanvas: number;
    teamProfile: number;
    essentialGates: number;
    clinicalEvidence: number;
    marketSizing: number;
    reimbursementStrategy: number;
  };
}

const INVESTOR_RELEVANT_STEPS = [1, 2, 3, 4, 5, 6, 7, 8];
const REQUIRED_INVESTOR_STEPS = 4;

export function usePortfolioGenesisMetrics(companyId: string | null) {
  return useQuery({
    queryKey: ['portfolio-genesis-metrics', companyId],
    queryFn: async (): Promise<PortfolioGenesisMetrics> => {
      if (!companyId) throw new Error('No company ID');

      // Fetch all products for company
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, class, intended_use, description, intended_purpose_data')
        .eq('company_id', companyId);

      if (productsError) throw productsError;
      if (!products || products.length === 0) {
        return {
          totalDevices: 0,
          averageReadiness: 0,
          investorReadyCount: 0,
          needsAttentionCount: 0,
          devices: [],
          checklistTotals: {
            deviceDescription: 0,
            viabilityScorecard: 0,
            ventureBlueprint: 0,
            businessCanvas: 0,
            teamProfile: 0,
            essentialGates: 0,
            clinicalEvidence: 0,
            marketSizing: 0,
            reimbursementStrategy: 0,
          },
        };
      }

      const productIds = products.map(p => p.id);

      // Batch fetch all related data (viability now auto-calculated from Blueprint inputs)
      const [
        blueprints,
        canvases,
        teamMembers,
        readinessGates,
        evidencePlans,
        marketSizing,
        reimbursement,
        hazards,
        phases
      ] = await Promise.all([
        supabase.from('product_venture_blueprints').select('product_id, activity_notes').in('product_id', productIds),
        supabase.from('business_canvas').select('product_id, customer_segments, value_propositions, channels, customer_relationships, revenue_streams, key_resources, key_activities, key_partnerships, cost_structure').in('product_id', productIds),
        supabase.from('team_members').select('product_id').in('product_id', productIds),
        supabase.from('product_readiness_gates').select('product_id, gates').in('product_id', productIds),
        supabase.from('product_clinical_evidence_plan').select('product_id, regulator_requirements, payer_requirements, physician_requirements, study_design, kol_strategy, pmcf_plan').in('product_id', productIds),
        supabase.from('product_market_sizing').select('product_id, tam_value, sam_value, som_value').in('product_id', productIds),
        supabase.from('product_reimbursement_strategy').select('product_id, target_codes, coverage_status, payer_mix').in('product_id', productIds),
        supabase.from('hazards').select('product_id').in('product_id', productIds),
        supabase.from('lifecycle_phases').select('product_id, name, status').in('product_id', productIds).eq('status', 'In Progress')
      ]);

      // Create lookup maps
      const blueprintMap = new Map(blueprints.data?.map(b => [b.product_id, b]) || []);
      const canvasMap = new Map(canvases.data?.map(c => [c.product_id, c]) || []);
      const teamMap = new Map<string, number>();
      teamMembers.data?.forEach(t => teamMap.set(t.product_id, (teamMap.get(t.product_id) || 0) + 1));
      const gatesMap = new Map(readinessGates.data?.map(g => [g.product_id, g]) || []);
      const evidenceMap = new Map(evidencePlans.data?.map(e => [e.product_id, e]) || []);
      const marketMap = new Map(marketSizing.data?.map(m => [m.product_id, m]) || []);
      const reimbursementMap = new Map(reimbursement.data?.map(r => [r.product_id, r]) || []);
      const hazardMap = new Map<string, boolean>();
      hazards.data?.forEach(h => hazardMap.set(h.product_id, true));
      const phaseMap = new Map(phases.data?.map(p => [p.product_id, p.name]) || []);

      // Calculate metrics for each device
      const devices: DeviceGenesisMetrics[] = products.map(product => {
        const intendedPurposeData = product.intended_purpose_data as { clinicalPurpose?: string } | null;
        const hasIntendedUse = Boolean(product.intended_use?.trim() || intendedPurposeData?.clinicalPurpose?.trim());
        const hasDescription = Boolean(product.description?.trim());
        const deviceDescription = hasIntendedUse && hasDescription;

        // Viability is now auto-calculated from Blueprint inputs
        const evidence = evidenceMap.get(product.id);
        const hasEvidenceContent = Boolean(
          (typeof evidence?.regulator_requirements === 'string' && evidence.regulator_requirements.trim()) ||
          (typeof evidence?.payer_requirements === 'string' && evidence.payer_requirements.trim()) ||
          (typeof evidence?.physician_requirements === 'string' && evidence.physician_requirements.trim()) ||
          (typeof evidence?.study_design === 'string' && evidence.study_design.trim()) ||
          (typeof evidence?.kol_strategy === 'string' && evidence.kol_strategy.trim()) ||
          (typeof evidence?.pmcf_plan === 'string' && evidence.pmcf_plan.trim())
        );
        const reimburse = reimbursementMap.get(product.id);
        const hasReimbursement = Boolean(
          (Array.isArray(reimburse?.target_codes) && reimburse.target_codes.length > 0) ||
          (typeof reimburse?.coverage_status === 'string' && reimburse.coverage_status.trim()) ||
          (reimburse?.payer_mix && Object.keys(reimburse.payer_mix as object).length > 0)
        );
        const hasRiskAnalysis = hazardMap.has(product.id);
        const viabilityScorecard = hasEvidenceContent || hasReimbursement || hasRiskAnalysis;

        const blueprint = blueprintMap.get(product.id);
        const blueprintNotes = blueprint?.activity_notes as Record<string, string> | null;
        const investorNotesCount = blueprintNotes
          ? Object.entries(blueprintNotes).filter(([stepId, note]) =>
              INVESTOR_RELEVANT_STEPS.includes(parseInt(stepId)) && note?.trim()
            ).length
          : 0;
        const ventureBlueprint = investorNotesCount >= REQUIRED_INVESTOR_STEPS;

        const canvas = canvasMap.get(product.id);
        const canvasSections = canvas ? [
          canvas.customer_segments,
          canvas.value_propositions,
          canvas.channels,
          canvas.customer_relationships,
          canvas.revenue_streams,
          canvas.key_resources,
          canvas.key_activities,
          canvas.key_partnerships,
          canvas.cost_structure,
        ].filter(section => section?.trim()).length : 0;
        const businessCanvas = canvasSections >= 3;

        const teamProfile = (teamMap.get(product.id) || 0) > 0;

        const gates = gatesMap.get(product.id);
        const gatesArray = (gates?.gates as any[]) || [];
        const essentialGates = gatesArray.some(g =>
          g.decision || g.startDate || g.endDate || (g.status && g.status !== 'not_started')
        );

        // Clinical evidence uses the same evidence data
        const clinicalEvidence = hasEvidenceContent;

        const market = marketMap.get(product.id);
        const marketSizingComplete = Boolean(market?.tam_value || market?.sam_value || market?.som_value);

        // Reimbursement strategy uses the same reimbursement data
        const reimbursementStrategy = hasReimbursement;

        const checklistCompletion = {
          deviceDescription,
          viabilityScorecard,
          ventureBlueprint,
          businessCanvas,
          teamProfile,
          essentialGates,
          clinicalEvidence,
          marketSizing: marketSizingComplete,
          reimbursementStrategy,
        };

        const completedCount = Object.values(checklistCompletion).filter(Boolean).length;
        const readinessPercentage = Math.round((completedCount / 9) * 100);

        return {
          productId: product.id,
          productName: product.name,
          deviceClass: product.class,
          lifecyclePhase: phaseMap.get(product.id) || null,
          readinessPercentage,
          viabilityScore: viabilityScorecard ? 100 : 0, // Auto-calculated: 100 if complete, 0 otherwise
          tamValue: market?.tam_value || null,
          checklistCompletion,
        };
      });

      // Calculate aggregates
      const totalDevices = devices.length;
      const averageReadiness = totalDevices > 0
        ? Math.round(devices.reduce((sum, d) => sum + d.readinessPercentage, 0) / totalDevices)
        : 0;
      const investorReadyCount = devices.filter(d => d.readinessPercentage >= 80).length;
      const needsAttentionCount = devices.filter(d => d.readinessPercentage < 50).length;

      const checklistTotals = {
        deviceDescription: devices.filter(d => d.checklistCompletion.deviceDescription).length,
        viabilityScorecard: devices.filter(d => d.checklistCompletion.viabilityScorecard).length,
        ventureBlueprint: devices.filter(d => d.checklistCompletion.ventureBlueprint).length,
        businessCanvas: devices.filter(d => d.checklistCompletion.businessCanvas).length,
        teamProfile: devices.filter(d => d.checklistCompletion.teamProfile).length,
        essentialGates: devices.filter(d => d.checklistCompletion.essentialGates).length,
        clinicalEvidence: devices.filter(d => d.checklistCompletion.clinicalEvidence).length,
        marketSizing: devices.filter(d => d.checklistCompletion.marketSizing).length,
        reimbursementStrategy: devices.filter(d => d.checklistCompletion.reimbursementStrategy).length,
      };

      return {
        totalDevices,
        averageReadiness,
        investorReadyCount,
        needsAttentionCount,
        devices,
        checklistTotals,
      };
    },
    enabled: !!companyId,
    staleTime: 30000,
  });
}
