/**
 * Server-side/async viability score calculator
 * Fetches all required inputs and calculates the score
 * Used by InvestorViewPage and Preview Drawer to show true calculated scores
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateViabilityScore, ViabilityScoreInputs, ViabilityScoreResult } from '@/services/calculateViabilityScore';

export async function getCalculatedViabilityScore(productId: string): Promise<ViabilityScoreResult> {
  // Fetch all required data in parallel
    const [
      productResult,
      clinicalResult,
      reimbursementResult,
      hazardsResult,
      competitorsResult,
      marketSizingResult,
      businessCanvasResult,
      teamMembersResult,
      highLevelRisksResult,
    ] = await Promise.all([
      supabase
        .from('products')
        .select('class, device_type, intended_use, markets, description, intended_purpose_data')
        .eq('id', productId)
        .single(),
     supabase
       .from('product_clinical_evidence_plan')
       .select('study_design, pmcf_plan, pmcf_required, supporting_literature, regulator_requirements')
       .eq('product_id', productId)
       .maybeSingle(),
     supabase
       .from('product_reimbursement_strategy')
       .select('target_codes, coverage_status, payer_mix')
       .eq('product_id', productId)
       .maybeSingle(),
     supabase
       .from('hazards')
       .select('id')
       .eq('product_id', productId),
     supabase
       .from('product_manual_competitors')
       .select('regulatory_status, phase')
       .eq('product_id', productId),
     supabase
       .from('product_market_sizing')
       .select('som_value, lives_impacted_annually')
       .eq('product_id', productId)
       .maybeSingle(),
     supabase
       .from('business_canvas')
       .select('value_propositions')
       .eq('product_id', productId)
       .maybeSingle(),
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

  // Extract target markets and derive highest risk class from markets array
  const targetMarkets: string[] = [];
  let derivedDeviceClass: string | null = null;
  
  if (product?.markets && Array.isArray(product.markets)) {
    // Risk class hierarchy (highest risk first)
    const riskHierarchy: Record<string, number> = {
      'iii': 4, 'class iii': 4, 'class-iii': 4,
      'iib': 3, 'class iib': 3, 'class-iib': 3,
      'ii': 2, 'iia': 2, 'class ii': 2, 'class iia': 2, 'class-ii': 2, 'class-iia': 2,
      'i': 1, 'class i': 1, 'class-i': 1,
    };
    
    let highestRiskLevel = 0;
    let highestRiskClass = '';
    
    interface MarketEntry {
      code?: string;
      market_code?: string;
      riskClass?: string;
      selected?: boolean;
      componentClassification?: {
        overallRiskClass?: string;
        components?: Array<{ riskClass?: string }>;
      };
    }
    
    (product.markets as MarketEntry[]).forEach(m => {
      // Only count SELECTED markets for complexity scoring
      if (m.selected !== true) return;
      
      const code = m.code || m.market_code;
      if (code) targetMarkets.push(code);
      
      // Extract risk class from either componentClassification (SiMD/complex) or riskClass (standard)
      let riskClass: string | null = null;
      
      if (m.componentClassification?.overallRiskClass) {
        riskClass = m.componentClassification.overallRiskClass;
      } else if (m.componentClassification?.components?.length) {
        // Find highest class among components
        m.componentClassification.components.forEach(comp => {
          if (comp.riskClass) {
            const normalized = comp.riskClass.toLowerCase().trim();
            const level = riskHierarchy[normalized] || 0;
            if (level > highestRiskLevel) {
              highestRiskLevel = level;
              highestRiskClass = comp.riskClass;
            }
          }
        });
      } else if (m.riskClass) {
        riskClass = m.riskClass;
      }
      
      if (riskClass) {
        const normalized = riskClass.toLowerCase().trim();
        const level = riskHierarchy[normalized] || 0;
        if (level > highestRiskLevel) {
          highestRiskLevel = level;
          highestRiskClass = riskClass;
        }
      }
    });
    
    if (highestRiskClass) {
      // Normalize to scoring engine format (e.g., "Class IIa" -> "class-iia")
      derivedDeviceClass = highestRiskClass.toLowerCase().replace(/\s+/g, '-');
    }
  }

  // Determine reimbursement code status
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

  const hasCoverageStrategy = reimbursement?.payer_mix && 
    typeof reimbursement.payer_mix === 'object' && 
    Object.keys(reimbursement.payer_mix).length > 0;

  // Extract study design
  let studyDesignStr: string | null = null;
  if (clinical?.study_design) {
    if (typeof clinical.study_design === 'string') {
      studyDesignStr = clinical.study_design;
    } else if (typeof clinical.study_design === 'object') {
      const design = clinical.study_design as Record<string, unknown>;
      studyDesignStr = (design.type as string) || (design.name as string) || JSON.stringify(design);
    }
  }

  const hasLiterature = clinical?.supporting_literature && 
    ((Array.isArray(clinical.supporting_literature) && clinical.supporting_literature.length > 0) ||
     (typeof clinical.supporting_literature === 'object' && Object.keys(clinical.supporting_literature).length > 0));

  // Analyze competitor data
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

  const hasSolutionConcept = !!(product?.description && 
    product.description.trim().length > 20);

  const inputs: ViabilityScoreInputs = {
    deviceClass: derivedDeviceClass || product?.class || null,
    deviceType: product?.device_type || null,
    targetMarkets,
    hasPredicate: false,
    intendedUse: product?.intended_use || null,
    studyDesign: studyDesignStr,
    sampleSize: null,
    pmcfRequired: !!clinical?.pmcf_required || !!clinical?.pmcf_plan,
    hasLiterature: !!hasLiterature,
    reimbursementCodeStatus,
    hasCoverageStrategy: !!hasCoverageStrategy,
    hazardCount: hazards.length,
    hasRiskAnalysis: hazards.length > 0,
    competitorApproved,
    literatureScore,
    literatureCount,
    // Values in product_market_sizing are stored in $M (e.g. 40 == $40M)
    somValue: marketSizing?.som_value == null ? null : marketSizing.som_value * 1_000_000,
    livesImpacted: marketSizing?.lives_impacted_annually || null,
    hasSolutionConcept,
    hasValueProposition,
    teamMemberCount: teamMembers.length,
    // High-level risk assessment metrics
    categoriesAssessed,
    totalRiskCount,
    mitigatedRiskCount,
    noneKnownCount,
    risksWithMitigation,
    categoriesWithRealRisks,
  };

  return calculateViabilityScore(inputs);
}
