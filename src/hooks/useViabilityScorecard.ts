import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ViabilityAnswers } from '@/components/product/business-case/viability/ViabilityWizard';
import {
  deriveAnswersFromGenesis,
  trackDerivedFields,
  mergeAnswers,
  type TechCharacteristics,
  type ClinicalEvidenceData,
  type ReimbursementStrategyData,
  type DerivedFieldsInfo,
} from '@/utils/scorecardDataMapper';

interface ViabilityScorecardData {
  id: string;
  product_id: string;
  company_id: string;
  regulatory_framework: string;
  device_class: string;
  has_predicate: string | null;
  clinical_strategy: string[];
  patient_count: number | null;
  reimbursement_code: string | null;
  technology_type: string | null;
  total_score: number;
  regulatory_score: number;
  clinical_score: number;
  reimbursement_score: number;
  technical_score: number;
  created_at: string;
  updated_at: string;
}

// Helper to validate UUID format
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export function useViabilityScorecard(productId: string, companyId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validate IDs before querying
  const hasValidIds = productId && companyId && 
    productId !== 'undefined' && companyId !== 'undefined' &&
    isValidUUID(productId) && isValidUUID(companyId);

  // Fetch existing scorecard
  const { data: scorecard, isLoading: scorecardLoading } = useQuery({
    queryKey: ['viability-scorecard', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_viability_scorecards')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching viability scorecard:', error);
        throw error;
      }

      return data as ViabilityScorecardData | null;
    },
    enabled: hasValidIds,
  });

  // Fetch Genesis data for auto-population
  const { data: genesisData, isLoading: genesisLoading } = useQuery({
    queryKey: ['genesis-scorecard-data', productId],
    queryFn: async () => {
      // Fetch product with markets and tech characteristics
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('markets, key_technology_characteristics')
        .eq('id', productId)
        .maybeSingle();

      if (productError) {
        console.error('Error fetching product for scorecard:', productError);
      }

      // Fetch clinical evidence plan
      const { data: clinicalEvidence, error: clinicalError } = await supabase
        .from('product_clinical_evidence_plan')
        .select('study_design')
        .eq('product_id', productId)
        .maybeSingle();

      if (clinicalError && clinicalError.code !== 'PGRST116') {
        console.error('Error fetching clinical evidence:', clinicalError);
      }

      // Fetch reimbursement strategy
      const { data: reimbursement, error: reimbursementError } = await supabase
        .from('product_reimbursement_strategy')
        .select('target_codes')
        .eq('product_id', productId)
        .maybeSingle();

      if (reimbursementError && reimbursementError.code !== 'PGRST116') {
        console.error('Error fetching reimbursement strategy:', reimbursementError);
      }

      return {
        markets: product?.markets as any[] | null,
        techCharacteristics: product?.key_technology_characteristics as TechCharacteristics | null,
        clinicalEvidence: clinicalEvidence as ClinicalEvidenceData | null,
        reimbursementStrategy: reimbursement as ReimbursementStrategyData | null,
      };
    },
    enabled: hasValidIds,
  });

  // Show loading state if IDs are not yet valid OR if queries are loading
  const isLoading = !hasValidIds || scorecardLoading || genesisLoading;

  // Derive answers from Genesis data
  const derivedAnswers = genesisData
    ? deriveAnswersFromGenesis(
        genesisData.markets,
        genesisData.techCharacteristics,
        genesisData.clinicalEvidence,
        genesisData.reimbursementStrategy
      )
    : {};

  // Track which fields were derived
  const derivedFieldsInfo: DerivedFieldsInfo = trackDerivedFields(derivedAnswers);

  // Convert database format to ViabilityAnswers
  const answersFromScorecard = scorecard
    ? ({
        regulatoryFramework: scorecard.regulatory_framework,
        deviceClass: scorecard.device_class,
        hasPredicate: scorecard.has_predicate || undefined,
        clinicalStrategy: scorecard.clinical_strategy || [],
        patientCount: scorecard.patient_count || undefined,
        reimbursementCode: scorecard.reimbursement_code || undefined,
        technologyType: scorecard.technology_type || undefined,
      } as Partial<ViabilityAnswers>)
    : null;

  // Merge derived answers with saved answers (saved takes precedence)
  const mergedAnswers = mergeAnswers(derivedAnswers, answersFromScorecard);

  // Save/update scorecard
  const saveMutation = useMutation({
    mutationFn: async ({
      answers,
      scores,
    }: {
      answers: ViabilityAnswers;
      scores: {
        total: number;
        regulatory: number;
        clinical: number;
        reimbursement: number;
        technical: number;
      };
    }) => {
      const scorecardData = {
        product_id: productId,
        company_id: companyId,
        regulatory_framework: answers.regulatoryFramework,
        device_class: answers.deviceClass,
        has_predicate: answers.hasPredicate || null,
        clinical_strategy: answers.clinicalStrategy || [],
        patient_count: answers.patientCount || null,
        reimbursement_code: answers.reimbursementCode || null,
        technology_type: answers.technologyType || null,
        total_score: scores.total,
        regulatory_score: scores.regulatory,
        clinical_score: scores.clinical,
        reimbursement_score: scores.reimbursement,
        technical_score: scores.technical,
      };

      const { data, error } = await supabase
        .from('product_viability_scorecards')
        .upsert(scorecardData, {
          onConflict: 'product_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['viability-scorecard', productId] });
      // Also invalidate funnel progress query so checklist updates
      queryClient.invalidateQueries({ queryKey: ['funnel-scorecard', productId] });
      toast({
        title: 'Viability Scorecard Saved',
        description: 'Your viability assessment has been saved successfully.',
      });
    },
    onError: (error) => {
      console.error('Error saving viability scorecard:', error);
      toast({
        title: 'Error',
        description: 'Failed to save viability scorecard. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    scorecard,
    answersFromScorecard: mergedAnswers,
    derivedAnswers,
    derivedFieldsInfo,
    isLoading,
    saveScorecard: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
