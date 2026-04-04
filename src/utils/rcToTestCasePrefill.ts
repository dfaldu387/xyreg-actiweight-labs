import { supabase } from '@/integrations/supabase/client';
import { vvService } from '@/services/vvService';
import { TraceabilityLinksService } from '@/services/traceabilityLinksService';
import { toast } from 'sonner';

interface RcTestCasePrefill {
  hazardId: string;
  hazardIdentifier: string;
  rcIdentifier: string;
  name: string;
  description: string;
  test_level: string;
  category: string;
  test_method: string;
  acceptance_criteria: string;
  test_steps: { step: string; expected: string }[];
  linked_requirements: string[];
}

/**
 * Infer test level/category from hazard ID prefix
 * HAZ-SWR -> software, HAZ-SYS -> system/hardware, HAZ-USE -> usability
 */
function inferCategoryFromHazardId(hazardId: string): { test_level: string; category: string } {
  if (hazardId.includes('SWR') || hazardId.includes('SW')) {
    return { test_level: 'system', category: 'software' };
  }
  if (hazardId.includes('HW') || hazardId.includes('HWR')) {
    return { test_level: 'system', category: 'hardware' };
  }
  if (hazardId.includes('USE')) {
    return { test_level: 'system', category: 'usability' };
  }
  // Default: system-level hardware/general
  return { test_level: 'system', category: 'hardware' };
}

/**
 * Fetch all hazards with risk controls and generate test case prefill data
 */
async function fetchRcPrefills(productId: string): Promise<RcTestCasePrefill[]> {
  const { data: hazards, error } = await supabase
    .from('hazards')
    .select('*')
    .eq('product_id', productId)
    .not('risk_control_measure', 'is', null)
    .neq('risk_control_measure', '');

  if (error) throw error;
  if (!hazards || hazards.length === 0) return [];

  return hazards.map((h) => {
    const hazId = h.hazard_id || `HAZ-${h.id.substring(0, 6)}`;
    const rcId = hazId.replace('HAZ-', 'RC-');
    const { test_level, category } = inferCategoryFromHazardId(hazId);
    const measure = h.risk_control_measure || '';
    const truncatedMeasure = measure.length > 60 ? measure.substring(0, 57) + '...' : measure;
    const residualRisk = h.residual_risk_level || h.residual_risk || 'acceptable';

    const linkedReqs = (h.linked_requirements || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    return {
      hazardId: h.id,
      hazardIdentifier: hazId,
      rcIdentifier: rcId,
      name: `Verify ${rcId} - ${truncatedMeasure}`,
      description: `Verify that risk control measure "${measure}" effectively mitigates hazard: ${h.description}`,
      test_level,
      category,
      test_method: 'test',
      acceptance_criteria: `Risk control ${rcId} is implemented and reduces residual risk to ${residualRisk} as documented in ${hazId}`,
      test_steps: [
        {
          step: `Execute risk control: ${measure}`,
          expected: `Residual risk at or below ${residualRisk}`,
        },
      ],
      linked_requirements: linkedReqs,
    };
  });
}

/**
 * Create a single RC verification test case for a hazard.
 * Idempotent: returns null if a verifies_control link already exists.
 */
export async function createRcTestCaseForHazard(
  hazard: { id: string; hazard_id?: string; description?: string; risk_control_measure?: string; residual_risk_level?: string; residual_risk?: string; linked_requirements?: string },
  productId: string,
  companyId: string
): Promise<any | null> {
  if (!hazard.risk_control_measure) return null;

  // Check 1: traceability link already exists
  const existingLinks = await TraceabilityLinksService.getByProduct(productId);
  const alreadyLinked = existingLinks.some(
    (l) => l.link_type === 'verifies_control' && l.source_type === 'hazard' && l.source_id === hazard.id
  );
  if (alreadyLinked) return null;

  // Check 2: test case with matching RC identifier already exists
  const existingRcId = (hazard.hazard_id || '').replace('HAZ-', 'RC-');
  if (existingRcId !== 'RC-') {
    const { data: existingTC } = await supabase
      .from('test_cases')
      .select('id')
      .eq('product_id', productId)
      .ilike('name', `Verify ${existingRcId}%`)
      .limit(1);
    if (existingTC && existingTC.length > 0) return null;
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get next TC number
  const { data: existingTCs, error: tcError } = await supabase
    .from('test_cases')
    .select('test_case_id')
    .eq('company_id', companyId)
    .like('test_case_id', 'TC-%')
    .order('test_case_id', { ascending: false })
    .limit(1);

  if (tcError) throw tcError;

  let nextNumber = 1;
  if (existingTCs && existingTCs.length > 0) {
    const lastNumber = parseInt(existingTCs[0].test_case_id.split('-')[1] || '0');
    nextNumber = lastNumber + 1;
  }

  const hazId = hazard.hazard_id || `HAZ-${hazard.id.substring(0, 6)}`;
  const rcId = hazId.replace('HAZ-', 'RC-');
  const { test_level, category } = inferCategoryFromHazardId(hazId);
  const measure = hazard.risk_control_measure || '';
  const truncatedMeasure = measure.length > 60 ? measure.substring(0, 57) + '...' : measure;
  const residualRisk = hazard.residual_risk_level || hazard.residual_risk || 'acceptable';

  const testCaseId = `TC-${nextNumber.toString().padStart(3, '0')}`;

  const testCase = await vvService.createTestCase({
    company_id: companyId,
    product_id: productId,
    test_case_id: testCaseId,
    name: `Verify ${rcId} - ${truncatedMeasure}`,
    description: `Verify that risk control measure "${measure}" effectively mitigates hazard: ${hazard.description}`,
    test_type: 'verification',
    test_level,
    category,
    test_method: 'test',
    acceptance_criteria: `Risk control ${rcId} is implemented and reduces residual risk to ${residualRisk} as documented in ${hazId}`,
    test_steps: [
      {
        step: `Execute risk control: ${measure}`,
        expected: `Residual risk at or below ${residualRisk}`,
      },
    ],
    priority: 'high',
    status: 'draft',
    created_by: user.id,
  });

  await TraceabilityLinksService.create({
    product_id: productId,
    company_id: companyId,
    source_type: 'hazard',
    source_id: hazard.id,
    target_type: 'test_case',
    target_id: testCase.id,
    link_type: 'verifies_control',
    rationale: `Auto-generated verification test for ${rcId}`,
  });

  return testCase;
}

/**
 * Generate and batch-create verification test cases for all risk controls.
 * Idempotent: skips RCs that already have a verifies_control link.
 */
export async function generateRcTestCases(
  productId: string,
  companyId: string
): Promise<number> {
  const prefills = await fetchRcPrefills(productId);
  if (prefills.length === 0) {
    toast.info('No risk controls found to generate test cases for');
    return 0;
  }

  // Fetch hazards to pass to the helper
  const { data: hazards, error } = await supabase
    .from('hazards')
    .select('*')
    .eq('product_id', productId)
    .not('risk_control_measure', 'is', null)
    .neq('risk_control_measure', '');

  if (error) throw error;
  if (!hazards || hazards.length === 0) return 0;

  let created = 0;
  for (const hazard of hazards) {
    try {
      const result = await createRcTestCaseForHazard(hazard, productId, companyId);
      if (result) created++;
    } catch (err) {
      const rcId = (hazard.hazard_id || '').replace('HAZ-', 'RC-');
      console.error(`Failed to create test case for ${rcId}:`, err);
    }
  }

  if (created === 0) {
    toast.info('All risk controls already have verification test cases');
  }

  return created;
}
