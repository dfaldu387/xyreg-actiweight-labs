import { supabase } from '@/integrations/supabase/client';
import { DesignReviewFinding, DesignReviewSignature } from '@/types/designReview';
import { isSignerEligibleForIndependent } from '@/services/reviewerEligibilityService';
import { upsertGovernanceStatus, GovernanceStatus } from '@/services/fieldGovernanceService';

/**
 * Check if a design review can be finalized:
 * 1. All major findings must be closed
 * 2. At least one independent reviewer must have signed
 * 3. All required roles must have signed (engineering_lead, quality_manager, independent_reviewer)
 */
export async function canFinalize(reviewId: string): Promise<{ canFinalize: boolean; blockers: string[] }> {
  const blockers: string[] = [];

  // Check findings
  const { data: findings } = await supabase
    .from('design_review_findings' as any)
    .select('*')
    .eq('design_review_id', reviewId);
  
  const openMajor = ((findings || []) as unknown as DesignReviewFinding[]).filter(
    f => f.severity === 'major' && f.status !== 'closed'
  );
  if (openMajor.length > 0) {
    blockers.push(`${openMajor.length} open major finding(s) must be closed`);
  }

  // Check signatures
  const { data: signatures } = await supabase
    .from('design_review_signatures' as any)
    .select('*')
    .eq('design_review_id', reviewId);
  
  const sigs = (signatures || []) as unknown as DesignReviewSignature[];
  const hasIndependent = sigs.some(s => s.is_independent);
  if (!hasIndependent) {
    blockers.push('Independent reviewer signature required');
  }

  const roles = new Set(sigs.map(s => s.signer_role));
  if (!roles.has('engineering_lead')) blockers.push('Engineering Lead signature required');
  if (!roles.has('quality_manager')) blockers.push('Quality Manager signature required');

  // Server-side "Clean Hands" guard: verify independent reviewer(s) have no manifest conflicts
  const independentSigs = sigs.filter(s => s.signer_role === 'independent_reviewer');
  for (const sig of independentSigs) {
    const eligible = await isSignerEligibleForIndependent(reviewId, sig.signer_id);
    if (!eligible) {
      blockers.push(`Independent reviewer (${sig.signer_id.slice(0, 8)}…) has conflicts with manifest objects`);
    }
  }

  return { canFinalize: blockers.length === 0, blockers };
}

/**
 * Finalize a design review:
 * - Set all manifest items to 'baselined'
 * - Set review status to 'completed'
 * - Record completion timestamp
 */
export async function finalizeReview(reviewId: string): Promise<void> {
  const check = await canFinalize(reviewId);
  if (!check.canFinalize) {
    throw new Error(`Cannot finalize: ${check.blockers.join(', ')}`);
  }

  // 1. Fetch manifest items
  const { data: manifestItems, error: fetchError } = await supabase
    .from('design_review_manifest_items' as any)
    .select('*')
    .eq('design_review_id', reviewId)
    .eq('status', 'included');

  if (fetchError) throw fetchError;
  const items = (manifestItems || []) as any[];

  // 2. Snapshot capture: fetch source data for each manifest item
  const TABLE_MAP: Record<string, { table: string }> = {
    user_need: { table: 'user_needs' },
    system_requirement: { table: 'system_requirements' },
    software_requirement: { table: 'software_requirements' },
    hardware_requirement: { table: 'hardware_requirements' },
    hazard: { table: 'hazards' },
    test_case: { table: 'test_cases' },
  };

  const snapshotStrings: string[] = [];
  for (const item of items) {
    const mapping = TABLE_MAP[item.object_type];
    let snapshotData: Record<string, any> = { object_id: item.object_id, object_type: item.object_type };
    if (mapping) {
      const { data: sourceRow } = await supabase
        .from(mapping.table as any)
        .select('*')
        .eq('id', item.object_id)
        .single();
      if (sourceRow) snapshotData = sourceRow as any;
    }
    const jsonStr = JSON.stringify(snapshotData);
    snapshotStrings.push(jsonStr);

    // Store snapshot on the manifest item
    await supabase
      .from('design_review_manifest_items' as any)
      .update({ snapshot_data: snapshotData } as any)
      .eq('id', item.id);
  }

  // 3. Baseline all manifest items
  const { error: manifestError } = await supabase
    .from('design_review_manifest_items' as any)
    .update({ status: 'baselined' } as any)
    .eq('design_review_id', reviewId)
    .eq('status', 'included');

  if (manifestError) throw manifestError;

  // 4. Generate SHA-256 hash of all snapshots
  let baselineHash = '';
  if (snapshotStrings.length > 0) {
    const combined = snapshotStrings.join('|');
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(combined));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    baselineHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 5. Complete the review with hash in metadata
  const { data: currentReview } = await supabase
    .from('design_reviews' as any)
    .select('metadata')
    .eq('id', reviewId)
    .single();

  const existingMeta = ((currentReview as any)?.metadata || {}) as Record<string, any>;
  const newMeta = { ...existingMeta, baseline_hash: baselineHash, baseline_item_count: items.length };

  const { error: reviewError } = await supabase
    .from('design_reviews' as any)
    .update({ status: 'completed', completed_at: new Date().toISOString(), metadata: newMeta } as any)
    .eq('id', reviewId);

  if (reviewError) throw reviewError;

  // 6. Post-finalization: write field governance records from discussion verdicts
  await writeGovernanceFromVerdicts(reviewId, newMeta);
}

/**
 * Map DR verdict values to GovernanceStatus values.
 * DR uses: approved | conditions | not_approved
 * Governance uses: approved | approved_with_conditions | rejected
 */
function mapVerdictToGovernance(verdict: string): GovernanceStatus | null {
  switch (verdict) {
    case 'approved': return 'approved';
    case 'conditions': return 'approved_with_conditions';
    case 'not_approved': return 'rejected';
    default: return null;
  }
}

/**
 * Governed section keys that can be discussed in a DR.
 * Maps object_type values used in discussion_items to governance section_keys.
 */
const GOVERNED_SECTION_TYPES = new Set([
  'intended_use',
  'device_description',
  'key_features',
  'device_summary',
  'user_instructions',
]);

/**
 * After finalizing a DR, scan discussion_verdicts for any governed section items
 * and upsert their governance status accordingly.
 */
async function writeGovernanceFromVerdicts(
  reviewId: string,
  metadata: Record<string, any>
): Promise<void> {
  const discussionItems: Array<{ object_id: string; object_type: string }> =
    metadata.discussion_items || [];
  const verdicts: Record<string, string> = metadata.discussion_verdicts || {};
  const comments: Record<string, string> = metadata.discussion_comments || {};

  // Get the product_id for this review
  const { data: review } = await supabase
    .from('design_reviews' as any)
    .select('product_id')
    .eq('id', reviewId)
    .single();

  if (!review) return;
  const productId = (review as any).product_id;

  for (const item of discussionItems) {
    const sectionKey = item.object_type;
    if (!GOVERNED_SECTION_TYPES.has(sectionKey)) continue;

    const verdict = verdicts[item.object_id];
    if (!verdict) continue;

    const govStatus = mapVerdictToGovernance(verdict);
    if (!govStatus) continue;

    await upsertGovernanceStatus(productId, sectionKey, govStatus, {
      design_review_id: reviewId,
      verdict_comment: comments[item.object_id] || null,
    });
  }
}
/**
 * Run a gaps check: verify traceability completeness for the product.
 * Returns warnings for broken chains.
 */
export interface ChangedObject {
  id: string;
  display_id: string;
  title: string;
  updated_at: string;
}

export interface ChangedObjectsResult {
  user_needs: ChangedObject[];
  system_requirements: ChangedObject[];
  software_requirements: ChangedObject[];
  hardware_requirements: ChangedObject[];
  hazards: ChangedObject[];
  test_cases: ChangedObject[];
}

const OBJECT_TYPE_LABELS: Record<keyof ChangedObjectsResult, string> = {
  user_needs: 'User Needs',
  system_requirements: 'System Requirements',
  software_requirements: 'Software Requirements',
  hardware_requirements: 'Hardware Requirements',
  hazards: 'Hazards',
  test_cases: 'Test Cases',
};

export { OBJECT_TYPE_LABELS };

/**
 * Get all objects changed since the last completed design review for this product.
 * Used to auto-populate the "Items to Discuss" OID tracker.
 */
export async function getChangedObjectsSinceLastReview(
  productId: string,
  currentReviewId: string
): Promise<ChangedObjectsResult> {
  // Find the most recent completed review before this one
  const { data: lastReview } = await supabase
    .from('design_reviews' as any)
    .select('completed_at')
    .eq('product_id', productId)
    .eq('status', 'completed')
    .neq('id', currentReviewId)
    .order('completed_at', { ascending: false })
    .limit(1);

  const since = (lastReview && lastReview.length > 0 && (lastReview[0] as any).completed_at)
    ? (lastReview[0] as any).completed_at
    : '1970-01-01T00:00:00Z';

  const queryTable = async (table: string, idField: string, titleField: string): Promise<ChangedObject[]> => {
    const { data } = await supabase
      .from(table as any)
      .select(`id, ${idField}, ${titleField}, updated_at`)
      .eq('product_id', productId)
      .gt('updated_at', since);
    return ((data || []) as any[]).map(row => ({
      id: row.id,
      display_id: row[idField] || row.id.slice(0, 8),
      title: row[titleField] || '—',
      updated_at: row.updated_at,
    }));
  };

  const [user_needs, system_requirements, software_requirements, hardware_requirements, hazards, test_cases] =
    await Promise.all([
      queryTable('user_needs', 'need_id', 'description'),
      queryTable('system_requirements', 'requirement_id', 'description'),
      queryTable('software_requirements', 'requirement_id', 'description'),
      queryTable('hardware_requirements', 'requirement_id', 'description'),
      queryTable('hazards', 'hazard_id', 'hazardous_situation'),
      queryTable('test_cases', 'test_id', 'title'),
    ]);

  return { user_needs, system_requirements, software_requirements, hardware_requirements, hazards, test_cases };
}

export async function runGapsCheck(productId: string): Promise<string[]> {
  const warnings: string[] = [];

  // Check for user needs without system requirements
  const { data: userNeeds } = await supabase
    .from('user_needs' as any)
    .select('id, need_id')
    .eq('product_id', productId);

  if (userNeeds && userNeeds.length === 0) {
    warnings.push('No User Needs found for this product');
  }

  // Check for requirements without test cases
  const { data: requirements } = await supabase
    .from('system_requirements')
    .select('id, requirement_id')
    .eq('product_id', productId);

  if (requirements && requirements.length === 0) {
    warnings.push('No System Requirements found for this product');
  }

  // Check for hazards without risk controls
  const { data: hazards } = await supabase
    .from('hazards' as any)
    .select('id, hazard_id, risk_control_measure')
    .eq('product_id', productId);

  const uncontrolledHazards = ((hazards || []) as any[]).filter(
    h => !h.risk_control_measure || h.risk_control_measure.trim() === ''
  );
  if (uncontrolledHazards.length > 0) {
    warnings.push(`${uncontrolledHazards.length} hazard(s) without risk control measures`);
  }

  return warnings;
}
