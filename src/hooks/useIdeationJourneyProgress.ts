import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface JourneyProgress {
  step1Complete: boolean; // Device defined (intended_use + general_description)
  step2Complete: boolean; // Business case (viability scorecard exists with score)
  step3Complete: boolean; // Investor share active
  currentStep: 1 | 2 | 3 | 4; // 4 = all complete
  overallProgress: number; // 0-100
  isLoading: boolean;
}

export function useIdeationJourneyProgress(productId: string, companyId: string): JourneyProgress {
  // Check Step 1: Device Info defined
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['journey-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('intended_use, description')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Check Step 2: Viability Inputs (auto-calculated from clinical evidence, reimbursement, or hazards)
  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ['journey-evidence', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_clinical_evidence_plan')
        .select('regulator_requirements, payer_requirements, physician_requirements, study_design, kol_strategy, pmcf_plan')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { data: reimbursementData, isLoading: reimbursementLoading } = useQuery({
    queryKey: ['journey-reimbursement', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reimbursement_strategy')
        .select('target_codes, coverage_status, payer_mix')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const { data: hazardsData, isLoading: hazardsLoading } = useQuery({
    queryKey: ['journey-hazards', productId],
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
  });

  // Check Step 3: Investor share active
  const { data: shareData, isLoading: shareLoading } = useQuery({
    queryKey: ['journey-share', companyId],
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
  });

  const isLoading = productLoading || evidenceLoading || reimbursementLoading || hazardsLoading || shareLoading;

  // Evaluate completion
  const step1Complete = Boolean(
    productData?.intended_use?.trim() && 
    productData?.description?.trim()
  );
  
  // Step 2: Viability is auto-calculated from Blueprint inputs
  const hasEvidenceContent = Boolean(
    (typeof evidenceData?.regulator_requirements === 'string' && evidenceData.regulator_requirements.trim()) ||
    (typeof evidenceData?.payer_requirements === 'string' && evidenceData.payer_requirements.trim()) ||
    (typeof evidenceData?.physician_requirements === 'string' && evidenceData.physician_requirements.trim()) ||
    (typeof evidenceData?.study_design === 'string' && evidenceData.study_design.trim()) ||
    (typeof evidenceData?.kol_strategy === 'string' && evidenceData.kol_strategy.trim()) ||
    (typeof evidenceData?.pmcf_plan === 'string' && evidenceData.pmcf_plan.trim())
  );
  const hasReimbursement = Boolean(
    (Array.isArray(reimbursementData?.target_codes) && reimbursementData.target_codes.length > 0) ||
    (typeof reimbursementData?.coverage_status === 'string' && reimbursementData.coverage_status.trim()) ||
    (reimbursementData?.payer_mix && Object.keys(reimbursementData.payer_mix as object).length > 0)
  );
  const hasRiskAnalysis = (hazardsData?.length ?? 0) > 0;
  const step2Complete = hasEvidenceContent || hasReimbursement || hasRiskAnalysis;
  
  const step3Complete = Boolean(
    shareData?.is_active && 
    shareData?.featured_product_id === productId
  );

  // Calculate current step
  let currentStep: 1 | 2 | 3 | 4 = 1;
  if (step1Complete && step2Complete && step3Complete) {
    currentStep = 4; // All complete
  } else if (step1Complete && step2Complete) {
    currentStep = 3;
  } else if (step1Complete) {
    currentStep = 2;
  }

  // Calculate progress
  const completedSteps = [step1Complete, step2Complete, step3Complete].filter(Boolean).length;
  const overallProgress = Math.round((completedSteps / 3) * 100);

  return {
    step1Complete,
    step2Complete,
    step3Complete,
    currentStep,
    overallProgress,
    isLoading,
  };
}
