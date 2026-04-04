import { supabase } from '@/integrations/supabase/client';

export interface EligibilityResult {
  eligible: boolean;
  conflictCount: number;
  conflictDetails: string[];
}

/**
 * Table mapping for each manifest object_type.
 * Maps to { table, displayIdField } so we can query created_by and return readable IDs.
 */
const OBJECT_TYPE_TABLE_MAP: Record<string, { table: string; displayIdField: string }> = {
  user_need: { table: 'user_needs', displayIdField: 'need_id' },
  system_requirement: { table: 'system_requirements', displayIdField: 'requirement_id' },
  software_requirement: { table: 'requirement_specifications', displayIdField: 'spec_id' },
  hardware_requirement: { table: 'requirement_specifications', displayIdField: 'spec_id' },
  hazard: { table: 'hazards', displayIdField: 'hazard_id' },
  test_case: { table: 'test_cases', displayIdField: 'test_id' },
};

/**
 * Check whether a user is eligible to sign as Independent Reviewer for a given design review.
 * A user is INELIGIBLE if they are the `created_by` author of ANY object in the review manifest.
 */
export async function checkIndependentEligibility(
  reviewId: string,
  userId: string
): Promise<EligibilityResult> {
  // 1. Fetch review metadata to get discussion_items
  const { data: reviewData } = await supabase
    .from('design_reviews' as any)
    .select('metadata')
    .eq('id', reviewId)
    .single();

  if (!reviewData) {
    return { eligible: true, conflictCount: 0, conflictDetails: [] };
  }

  const metadata = (reviewData as any).metadata || {};
  const discussionItems: Array<{ object_type: string; object_id: string; display_id?: string }> =
    metadata.discussion_items || [];

  if (discussionItems.length === 0) {
    return { eligible: true, conflictCount: 0, conflictDetails: [] };
  }

  // 2. Group items by object_type
  const grouped: Record<string, Array<{ object_id: string; display_id?: string }>> = {};
  for (const item of discussionItems) {
    const key = item.object_type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({ object_id: item.object_id, display_id: item.display_id });
  }

  // 3. For each group, query the source table for created_by
  const conflictDetails: string[] = [];

  const queries = Object.entries(grouped).map(async ([objectType, items]) => {
    const mapping = OBJECT_TYPE_TABLE_MAP[objectType];
    if (!mapping) return;

    const objectIds = items.map(i => i.object_id);

    const { data } = await supabase
      .from(mapping.table as any)
      .select(`id, ${mapping.displayIdField}, created_by`)
      .in('id', objectIds);

    if (!data) return;

    for (const row of data as any[]) {
      if (row.created_by === userId) {
        const displayId = row[mapping.displayIdField] || row.id.slice(0, 8);
        conflictDetails.push(displayId);
      }
    }
  });

  await Promise.all(queries);

  return {
    eligible: conflictDetails.length === 0,
    conflictCount: conflictDetails.length,
    conflictDetails,
  };
}

/**
 * Server-side guard: check if a specific signer_id is eligible for independent reviewer.
 * Used by canFinalize() as a backup enforcement.
 */
export async function isSignerEligibleForIndependent(
  reviewId: string,
  signerId: string
): Promise<boolean> {
  const result = await checkIndependentEligibility(reviewId, signerId);
  return result.eligible;
}
