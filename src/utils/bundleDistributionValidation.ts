import type { ProductBundleMember } from '@/types/productBundle';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DistributionGroup {
  groupId: string;
  relationshipType: string;
  members: ProductBundleMember[];
  totalRate: number;
}

/**
 * Validates bundle member distributions
 */
export function validateBundleDistributions(members: ProductBundleMember[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate attachment rates are 0-100
  members.forEach((member, index) => {
    const rate = member.attachment_rate ?? 100;
    if (rate < 0 || rate > 100) {
      errors.push(`Member ${index + 1}: Attachment rate must be between 0% and 100% (currently ${rate}%)`);
    }
  });

  // Group by distribution_group_id
  const groups = new Map<string, DistributionGroup>();
  
  members.forEach(member => {
    if (member.distribution_group_id) {
      const key = `${member.distribution_group_id}_${member.relationship_type}`;
      if (!groups.has(key)) {
        groups.set(key, {
          groupId: member.distribution_group_id,
          relationshipType: member.relationship_type,
          members: [],
          totalRate: 0,
        });
      }
      const group = groups.get(key)!;
      group.members.push(member);
      group.totalRate += member.attachment_rate ?? 100;
    }
  });

  // Validate distribution groups sum to 100%
  groups.forEach((group, key) => {
    const diff = Math.abs(group.totalRate - 100);
    if (diff > 0.01) {
      errors.push(
        `Distribution group "${group.groupId}" (${group.relationshipType}): Members must sum to 100% (currently ${group.totalRate.toFixed(2)}%)`
      );
    }
    
    if (group.members.length < 2) {
      warnings.push(
        `Distribution group "${group.groupId}": Only has ${group.members.length} member. Groups should have at least 2 competing items.`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Auto-balance distribution group percentages to sum to 100%
 */
export function autoBalanceDistributionGroup(members: ProductBundleMember[], groupId: string): ProductBundleMember[] {
  const groupMembers = members.filter(m => m.distribution_group_id === groupId);
  if (groupMembers.length === 0) return members;

  const currentTotal = groupMembers.reduce((sum, m) => sum + (m.attachment_rate ?? 100), 0);
  
  if (currentTotal === 0) {
    // Distribute evenly
    const evenRate = 100 / groupMembers.length;
    return members.map(m => 
      m.distribution_group_id === groupId 
        ? { ...m, attachment_rate: evenRate }
        : m
    );
  }

  // Proportionally adjust
  const factor = 100 / currentTotal;
  let adjustedMembers = members.map(m => 
    m.distribution_group_id === groupId
      ? { ...m, attachment_rate: (m.attachment_rate ?? 100) * factor }
      : m
  );

  // Handle rounding - adjust the member with highest rate
  const adjusted = adjustedMembers.filter(m => m.distribution_group_id === groupId);
  const newTotal = adjusted.reduce((sum, m) => sum + (m.attachment_rate ?? 100), 0);
  const diff = 100 - newTotal;
  
  if (Math.abs(diff) > 0.001) {
    const maxMember = adjusted.reduce((max, m) => 
      (m.attachment_rate ?? 0) > (max.attachment_rate ?? 0) ? m : max
    );
    adjustedMembers = adjustedMembers.map(m =>
      m.id === maxMember.id
        ? { ...m, attachment_rate: (m.attachment_rate ?? 100) + diff }
        : m
    );
  }

  return adjustedMembers;
}

/**
 * Get all distribution groups from bundle members
 */
export function getDistributionGroups(members: ProductBundleMember[]): DistributionGroup[] {
  const groups = new Map<string, DistributionGroup>();
  
  members.forEach(member => {
    if (member.distribution_group_id) {
      const key = `${member.distribution_group_id}_${member.relationship_type}`;
      if (!groups.has(key)) {
        groups.set(key, {
          groupId: member.distribution_group_id,
          relationshipType: member.relationship_type,
          members: [],
          totalRate: 0,
        });
      }
      const group = groups.get(key)!;
      group.members.push(member);
      group.totalRate += member.attachment_rate ?? 100;
    }
  });

  return Array.from(groups.values());
}

/**
 * Suggest creating distribution groups for items with same relationship type
 */
export function suggestDistributionGroups(members: ProductBundleMember[]): { 
  relationshipType: string; 
  members: ProductBundleMember[];
}[] {
  // Group by relationship type (excluding items already in distribution groups)
  const byType = new Map<string, ProductBundleMember[]>();
  
  members
    .filter(m => !m.distribution_group_id) // Only ungrouped items
    .forEach(member => {
      if (!byType.has(member.relationship_type)) {
        byType.set(member.relationship_type, []);
      }
      byType.get(member.relationship_type)!.push(member);
    });

  // Return types with 2+ items
  return Array.from(byType.entries())
    .filter(([_, items]) => items.length >= 2)
    .map(([relationshipType, items]) => ({
      relationshipType,
      members: items,
    }));
}
