/**
 * Build PostgREST OR filter for finding documents assigned to a user as reviewer
 * (via group membership OR individual assignment).
 */
export function buildReviewerFilter(userGroups: string[], userId: string): string {
  const parts: string[] = [];
  if (userGroups.length > 0) {
    parts.push(`reviewer_group_ids.ov.{${userGroups.join(',')}}`);
  }
  parts.push(`reviewer_user_ids.cs.{${userId}}`);
  return parts.join(',');
}

/**
 * Build PostgREST OR filter for finding documents assigned to a user as approver
 * (via approved_by, individual assignment, or group membership).
 */
export function buildApproverFilter(userGroups: string[], userId: string): string {
  const parts: string[] = [];
  parts.push(`approved_by.eq.${userId}`);
  parts.push(`approver_user_ids.cs.{${userId}}`);
  if (userGroups.length > 0) {
    parts.push(`approver_group_ids.ov.{${userGroups.join(',')}}`);
  }
  return parts.join(',');
}
