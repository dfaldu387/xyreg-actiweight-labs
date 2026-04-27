import { supabase } from '@/integrations/supabase/client';
import { showNoCreditDialog } from '@/context/AiCreditContext';

export interface UsabilityTestSuggestion {
  hazard_id: string;
  name: string;
  description: string;
  test_level: 'formative' | 'summative';
  category: string;
  test_steps: Array<{ step: string; expected: string }>;
  acceptance_criteria: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface GenerateTestCasesRequest {
  hazards: Array<{
    hazard_id: string;
    description: string;
    hazardous_situation?: string;
    potential_harm?: string;
    risk_control_measure?: string;
    initial_risk?: string;
    severity?: string;
  }>;
  productContext?: string;
}

export interface GenerateTestCasesResponse {
  success: boolean;
  suggestions?: UsabilityTestSuggestion[];
  error?: string;
}

export async function generateUsabilityTestCases(
  request: GenerateTestCasesRequest
): Promise<GenerateTestCasesResponse> {
  const { data, error } = await supabase.functions.invoke('ai-usability-test-generator', {
    body: request,
  });

  if (error) {
    console.error('[usabilityTestAIService] Error:', error);
    throw new Error(error.message || 'Failed to generate test cases');
  }

  if (data?.error === 'NO_CREDITS') {
    showNoCreditDialog();
    throw new Error('NO_CREDITS');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'AI generation failed');
  }

  return data as GenerateTestCasesResponse;
}
