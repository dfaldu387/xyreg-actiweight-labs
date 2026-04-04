import { supabase } from "@/integrations/supabase/client";
import { getUsabilityEngineeringFile } from "@/services/usabilityEngineeringService";

export interface PrefillData {
  test_level?: string;
  category?: string;
  name?: string;
  description?: string;
  preconditions?: string;
  acceptance_criteria?: string;
  test_steps?: { step: string; expected: string }[];
  linked_requirements?: string[];
}

interface HazardRow {
  hazard_id: string;
  description: string;
  hazardous_situation?: string;
  potential_harm?: string;
}

export async function generateUeToVvPrefill(
  productId: string,
  testLevel: 'formative' | 'summative'
): Promise<PrefillData> {
  // Fetch UE file and HAZ-USE hazards in parallel
  const [uef, hazardsResult] = await Promise.all([
    getUsabilityEngineeringFile(productId),
    supabase
      .from('hazards')
      .select('hazard_id, description, hazardous_situation, potential_harm')
      .eq('product_id', productId)
      .or('hazard_id.ilike.HAZ-USE%,category.eq.human_factors')
      .order('created_at', { ascending: true }),
  ]);

  const hazards = (hazardsResult.data || []) as unknown as HazardRow[];

  // Build name
  const levelLabel = testLevel === 'formative' ? 'Formative' : 'Summative';
  const name = `${levelLabel} Usability Evaluation`;

  // Build description from UE data
  const descParts: string[] = [];
  if (uef?.intended_use) {
    descParts.push(`Intended Use: ${uef.intended_use}`);
  }
  if (uef?.intended_users && uef.intended_users.length > 0) {
    const profiles = uef.intended_users.map(u => u.profile).join(', ');
    descParts.push(`Intended Users: ${profiles}`);
  }
  if (uef?.use_environments && uef.use_environments.length > 0) {
    const envs = uef.use_environments.map(e => e.environment).join(', ');
    descParts.push(`Use Environments: ${envs}`);
  }
  const description = descParts.length > 0
    ? descParts.join('\n')
    : `${levelLabel} usability evaluation for this medical device.`;

  // Build preconditions from user profiles
  let preconditions = '';
  if (uef?.intended_users && uef.intended_users.length > 0) {
    preconditions = uef.intended_users
      .map(u => {
        const parts = [`Profile: ${u.profile}`];
        if (u.characteristics) parts.push(`Characteristics: ${u.characteristics}`);
        if (u.training_level) parts.push(`Training: ${u.training_level}`);
        return parts.join(' | ');
      })
      .join('\n');
  }

  // Build test steps from HAZ-USE hazards
  const test_steps = hazards.map(h => ({
    step: `Perform critical task: ${h.description || h.hazardous_situation || h.hazard_id}`,
    expected: `No use error occurs. ${h.potential_harm ? `Potential harm "${h.potential_harm}" is avoided.` : ''}`.trim(),
  }));

  // Category mapping
  const category = testLevel === 'formative' ? 'use_error_analysis' : 'simulated_use';

  // Acceptance criteria from plan text
  const planText = testLevel === 'formative' ? uef?.formative_plan : uef?.summative_plan;
  const acceptance_criteria = planText
    ? `Per evaluation plan: ${planText.slice(0, 500)}${planText.length > 500 ? '...' : ''}`
    : '';

  // Linked requirements: use hazard IDs for traceability
  const linked_requirements = hazards
    .filter(h => h.hazard_id)
    .map(h => h.hazard_id);

  return {
    test_level: testLevel,
    category,
    name,
    description,
    preconditions,
    acceptance_criteria,
    test_steps,
    linked_requirements,
  };
}
