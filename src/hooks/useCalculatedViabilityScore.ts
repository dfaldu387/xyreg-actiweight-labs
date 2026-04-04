import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateViabilityScore, ViabilityScoreInputs, ViabilityScoreResult } from '@/services/calculateViabilityScore';

interface UseCalculatedViabilityScoreResult {
  scoreResult: ViabilityScoreResult | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch data from various modules and calculate viability score
 * Now enriched with data from additional Blueprint steps:
 * - Step 1: Clinical Need (intended_use)
 * - Step 2: Competitor Analysis (regulatory_status, phase)
 * - Step 2: Market Sizing (som_value, lives_impacted_annually)
 * - Step 3: Core Solution (description)
 * - Step 5: Value Proposition (business_canvas.value_propositions)
 * - Step 8C: Team Composition (team_members count)
 */
export function useCalculatedViabilityScore(
  productId: string | undefined,
  companyId: string | undefined
): UseCalculatedViabilityScoreResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calculated-viability-score', productId],
    queryFn: async (): Promise<ViabilityScoreResult> => {
      if (!productId) throw new Error('Product ID required');
      
      // Fetch all required data in parallel using separate queries
      const [
        productResult,
        clinicalResult,
        reimbursementResult,
        hazardsResult,
        // NEW: Additional Blueprint data sources
        competitorsResult,
        marketSizingResult,
        businessCanvasResult,
        teamMembersResult,
        // Step 16: High-level risk assessment
        highLevelRisksResult,
      ] = await Promise.all([
        // Product data (class, device type, intended_use, description)
        supabase
          .from('products')
          .select('class, device_type, intended_use, markets, description, intended_purpose_data')
          .eq('id', productId)
          .single(),
        
        // Clinical evidence plan
        supabase
          .from('product_clinical_evidence_plan')
          .select('study_design, pmcf_plan, pmcf_required, supporting_literature, regulator_requirements')
          .eq('product_id', productId)
          .maybeSingle(),
        
        // Reimbursement strategy
        supabase
          .from('product_reimbursement_strategy')
          .select('target_codes, coverage_status, payer_mix')
          .eq('product_id', productId)
          .maybeSingle(),
        
        // Hazards for risk analysis
        supabase
          .from('hazards')
          .select('id')
          .eq('product_id', productId),
        
        // NEW: Competitor data (Step 2)
        supabase
          .from('product_manual_competitors')
          .select('regulatory_status, phase')
          .eq('product_id', productId),
        
        // NEW: Market sizing data (Step 2)
        supabase
          .from('product_market_sizing')
          .select('som_value, lives_impacted_annually')
          .eq('product_id', productId)
          .maybeSingle(),
        
        // NEW: Business canvas (Step 5)
        supabase
          .from('business_canvas')
          .select('value_propositions')
          .eq('product_id', productId)
          .maybeSingle(),
        
        // NEW: Team members count (Step 8C)
        supabase
          .from('team_members')
          .select('id')
          .eq('product_id', productId),
        
        // Step 16: High-level risk assessment
        supabase
          .from('product_high_level_risks')
          .select('category, risk_type, status, mitigation')
          .eq('product_id', productId),
      ]);
      
      // Extract data with type safety
      const product = productResult.data;
      const clinical = clinicalResult.data;
      const reimbursement = reimbursementResult.data;
      const hazards = hazardsResult.data || [];
      const competitors = competitorsResult.data || [];
      const marketSizing = marketSizingResult.data;
      const businessCanvas = businessCanvasResult.data;
      const teamMembers = teamMembersResult.data || [];
      const highLevelRisks = highLevelRisksResult.data || [];
      
      // Process high-level risk data for scoring
      const RISK_CATEGORIES = ['Clinical', 'Technical', 'Regulatory', 'Commercial'];
      const categoriesAssessed: string[] = [];
      const categoriesWithRealRisksSet = new Set<string>();
      let totalRiskCount = 0;
      let mitigatedRiskCount = 0;
      let noneKnownCount = 0;
      let risksWithMitigation = 0;
      
      highLevelRisks.forEach((risk: { category: string; risk_type: string; status: string; mitigation: string | null }) => {
        const isNoneKnown = risk.risk_type?.toLowerCase().includes('none_known') || 
                           risk.risk_type?.toLowerCase().includes('none known');
        
        if (!categoriesAssessed.includes(risk.category)) {
          categoriesAssessed.push(risk.category);
        }
        
        if (isNoneKnown) {
          noneKnownCount++;
        } else {
          totalRiskCount++;
          categoriesWithRealRisksSet.add(risk.category);
          if (risk.status === 'Mitigated') {
            mitigatedRiskCount++;
          }
          if (risk.mitigation && risk.mitigation.trim().length > 0) {
            risksWithMitigation++;
          }
        }
      });
      
      const categoriesWithRealRisks = categoriesWithRealRisksSet.size;
      
      // Extract target markets from product markets JSON - only count SELECTED markets
      const targetMarkets: string[] = [];
      if (product?.markets && Array.isArray(product.markets)) {
        (product.markets as Array<{ code?: string; market_code?: string; selected?: boolean }>).forEach(m => {
          // Only count markets that are explicitly selected
          if (m.selected !== true) return;
          const code = m.code || m.market_code;
          if (code) targetMarkets.push(code);
        });
      }
      
      // Determine reimbursement code status from target_codes
      let reimbursementCodeStatus: ViabilityScoreInputs['reimbursementCodeStatus'] = null;
      if (reimbursement?.target_codes) {
        const codes = reimbursement.target_codes as Array<{ code?: string; status?: string }>;
        if (codes.length > 0) {
          const statuses = codes.map(c => c.status?.toLowerCase() || '');
          if (statuses.some(s => s === 'existing' || s === 'active')) {
            reimbursementCodeStatus = 'existing';
          } else if (statuses.some(s => s === 'partial' || s === 'pending')) {
            reimbursementCodeStatus = 'partial';
          } else if (statuses.some(s => s === 'bundled')) {
            reimbursementCodeStatus = 'bundled';
          } else if (statuses.some(s => s === 'new' || s === 'new_needed')) {
            reimbursementCodeStatus = 'new_needed';
          }
        }
      }
      
      // Check if has coverage strategy (payer_mix filled in)
      const hasCoverageStrategy = reimbursement?.payer_mix && 
        typeof reimbursement.payer_mix === 'object' && 
        Object.keys(reimbursement.payer_mix).length > 0;
      
      // Extract study design as string
      let studyDesignStr: string | null = null;
      if (clinical?.study_design) {
        if (typeof clinical.study_design === 'string') {
          studyDesignStr = clinical.study_design;
        } else if (typeof clinical.study_design === 'object') {
          // If it's JSON, try to extract a type or name field
          const design = clinical.study_design as Record<string, unknown>;
          studyDesignStr = (design.type as string) || (design.name as string) || JSON.stringify(design);
        }
      }
      
      // Check if has literature
      const hasLiterature = clinical?.supporting_literature && 
        ((Array.isArray(clinical.supporting_literature) && clinical.supporting_literature.length > 0) ||
         (typeof clinical.supporting_literature === 'object' && Object.keys(clinical.supporting_literature).length > 0));
      
      // NEW: Analyze competitor data
      // Values from ManualCompetitorDialog: 'Approved', 'Marketed', 'Clinical Trials', 'Development', 'Pending', 'Unknown'
      const competitorApproved = competitors.some(c => {
        const status = (c.regulatory_status || '').toLowerCase();
        return status.includes('approved') || 
               status.includes('cleared') || 
               status.includes('marketed') ||
               status === 'on market';  // Also accept 'on market' if stored that way
      });
      
      // Calculate weighted literature score from supporting_literature
      let literatureScore = 0;
      let literatureCount = 0;
      
      if (clinical?.supporting_literature && Array.isArray(clinical.supporting_literature)) {
        literatureCount = clinical.supporting_literature.length;
        literatureScore = (clinical.supporting_literature as Array<{ relevance?: string }>).reduce((sum, lit) => {
          const relevance = (lit.relevance || '').toLowerCase();
          if (relevance === 'direct') return sum + 3;
          if (relevance === 'analogous') return sum + 2;
          if (relevance === 'supportive') return sum + 1;
          return sum + 1; // Default to supportive for legacy free-text values
        }, 0);
      }
      
      // Check for value proposition in intended_purpose_data (Statement of Use tab)
      // Note: Field is camelCase (valueProposition) in the DB
      let hasValueProposition = false;
      if (product?.intended_purpose_data) {
        const purposeData = product.intended_purpose_data as any;
        const valueProp = purposeData.valueProposition || purposeData.value_proposition;
        hasValueProposition = !!(valueProp && String(valueProp).trim().length > 10);
      }
      // Fallback to business_canvas if not found in intended_purpose_data (legacy support)
      if (!hasValueProposition && businessCanvas?.value_propositions) {
        hasValueProposition = businessCanvas.value_propositions.trim().length > 10;
      }
      
      // NEW: Check solution concept (product description)
      const hasSolutionConcept = !!(product?.description && 
        product.description.trim().length > 20);
      
      // Build inputs with all enrichment data
      const inputs: ViabilityScoreInputs = {
        deviceClass: product?.class || null,
        deviceType: product?.device_type || null,
        targetMarkets,
        hasPredicate: false, // Would need to add this field to products table
        intendedUse: product?.intended_use || null,
        
        studyDesign: studyDesignStr,
        sampleSize: null, // Not available in current schema
        pmcfRequired: !!clinical?.pmcf_required || !!clinical?.pmcf_plan,
        hasLiterature: !!hasLiterature,
        
        reimbursementCodeStatus,
        hasCoverageStrategy: !!hasCoverageStrategy,
        
        hazardCount: hazards.length,
        hasRiskAnalysis: hazards.length > 0,
        
        // NEW: Enrichment inputs
        competitorApproved,
        literatureScore,
        literatureCount,
        // Values in product_market_sizing are stored in $M (e.g. 40 == $40M)
        somValue: marketSizing?.som_value == null ? null : marketSizing.som_value * 1_000_000,
        livesImpacted: marketSizing?.lives_impacted_annually || null,
        hasSolutionConcept,
        hasValueProposition,
        teamMemberCount: teamMembers.length,
        // High-level risk assessment
        categoriesAssessed,
        totalRiskCount,
        mitigatedRiskCount,
        noneKnownCount,
        risksWithMitigation,
        categoriesWithRealRisks,
      };
      
      return calculateViabilityScore(inputs);
    },
    enabled: !!productId,
    staleTime: 30000, // Cache for 30 seconds
  });
  
  return {
    scoreResult: data || null,
    isLoading,
    error: error as Error | null,
  };
}
