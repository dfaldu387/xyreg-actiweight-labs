import { ProductBundleMember } from '@/types/productBundle';

export interface SiblingAssignment {
  id: string;
  product_id: string;
  percentage: number;
  products: {
    id: string;
    name: string;
    trade_name?: string;
  };
}

export interface ProductWithRelationship {
  id: string;
  name: string;
  relationship_type: string;
  multiplier?: number;
  quantity?: number;
  consumption_rate?: number;
  consumption_period?: string;
  attachment_rate?: number;
  distribution_group_id?: string;
  distribution_percentage?: number;
  sibling_group_id?: string;
  sibling_assignments?: SiblingAssignment[];
}


export interface WhatIfResult {
  productId: string;
  productName: string;
  relationshipType: string;
  calculatedUnits: number;
  unitsByYear?: number[]; // Units calculated per year
  calculationExplanation: string;
  isVariant?: boolean;
  parentGroup?: string;
}

export class BundleWhatIfCalculator {
  /**
   * Calculate dependent product sales based on primary product sales
   */
  static calculateDependentSales(
    primaryProductSales: number,
    timeframeMonths: number,
    bundleMembers: ProductWithRelationship[],
    annualGrowthRate: number = 0
  ): WhatIfResult[] {
    const results: WhatIfResult[] = [];

    for (const member of bundleMembers) {
      let explanation = '';

      // Base calculation starts with primary product sales
      let baseUnits = primaryProductSales;

      // Apply attachment rate if present
      if (member.attachment_rate !== undefined && member.attachment_rate !== null) {
        baseUnits = baseUnits * (member.attachment_rate / 100);
        explanation += `${primaryProductSales} units × ${member.attachment_rate}% attachment`;
      } else {
        explanation += `${primaryProductSales} units`;
      }

      // Apply distribution percentage if present (for distribution groups)
      if (member.distribution_percentage !== undefined && member.distribution_percentage !== null) {
        baseUnits = baseUnits * (member.distribution_percentage / 100);
        explanation += ` × ${member.distribution_percentage}% distribution`;
      }

      // Apply multiplier or quantity
      const multiplier = member.multiplier || member.quantity || 1;
      baseUnits = baseUnits * multiplier;
      if (multiplier !== 1) {
        explanation += ` × ${multiplier} qty`;
      }

      // Calculate units per year
      const unitsByYear: number[] = [];
      const completeYears = Math.floor(timeframeMonths / 12);
      const remainingMonths = timeframeMonths % 12;
      const totalYearsToShow = remainingMonths > 0 ? completeYears + 1 : completeYears;

      // For consumables, calculate annual consumption
      let isConsumable = false;
      let consumptionMultiplierPerYear = 1;
      
      if (member.consumption_rate && member.consumption_period) {
        isConsumable = true;
        consumptionMultiplierPerYear = this.calculateConsumptionMultiplier(
          member.consumption_rate,
          member.consumption_period,
          12 // Always calculate for 12 months
        );
      }

      // Calculate units for each year
      for (let year = 0; year < totalYearsToShow; year++) {
        const yearMultiplier = Math.pow(1 + annualGrowthRate / 100, year);
        let yearUnits = baseUnits * yearMultiplier;
        
        // Apply consumption for this year
        if (isConsumable) {
          yearUnits = yearUnits * consumptionMultiplierPerYear;
        }
        
        // Prorate the last partial year based on remaining months
        if (year === completeYears && remainingMonths > 0) {
          yearUnits = yearUnits * (remainingMonths / 12);
        }
        
        unitsByYear.push(Math.round(yearUnits));
      }

      // Calculate total units across all years
      const totalCalculatedUnits = unitsByYear.reduce((sum, units) => sum + units, 0);

      // Update explanation
      if (isConsumable) {
        explanation += ` × ${consumptionMultiplierPerYear.toFixed(1)} (annual consumption) × ${totalYearsToShow} years`;
      }

      // If this is a sibling group, break down into individual variants
      if (member.sibling_group_id && member.sibling_assignments && member.sibling_assignments.length > 0) {
        const groupExplanation = explanation + ` = ${totalCalculatedUnits} units (total for group)`;

        // Add group summary result
        results.push({
          productId: member.sibling_group_id,
          productName: member.name + ' (Group Total)',
          relationshipType: member.relationship_type,
          calculatedUnits: totalCalculatedUnits,
          unitsByYear,
          calculationExplanation: groupExplanation,
        });

        // Add individual variants
        member.sibling_assignments.forEach((assignment) => {
          const variantName = assignment.products.trade_name || assignment.products.name;
          
          // Calculate variant units by year
          const variantUnitsByYear = unitsByYear.map(yearUnits => 
            Math.round(yearUnits * (assignment.percentage / 100))
          );
          
          const variantTotal = variantUnitsByYear.reduce((sum, units) => sum + units, 0);
          
          results.push({
            productId: assignment.product_id,
            productName: variantName,
            relationshipType: member.relationship_type,
            calculatedUnits: variantTotal,
            unitsByYear: variantUnitsByYear,
            calculationExplanation: `${totalCalculatedUnits} units × ${assignment.percentage}% = ${variantTotal} units`,
            isVariant: true,
            parentGroup: member.name,
          });
        });
      } else {
        // Regular product (not a sibling group)
        results.push({
          productId: member.id,
          productName: member.name,
          relationshipType: member.relationship_type,
          calculatedUnits: totalCalculatedUnits,
          unitsByYear,
          calculationExplanation: explanation + ` = ${totalCalculatedUnits} units`,
        });
      }
    }

    return results;
  }

  /**
   * Calculate consumption multiplier based on consumption rate and period
   */
  private static calculateConsumptionMultiplier(
    consumptionRate: number,
    consumptionPeriod: string,
    timeframeMonths: number
  ): number {
    const periodsPerMonth: Record<string, number> = {
      per_use: 0, // Not time-based, just use the rate
      per_procedure: 0, // Not time-based
      per_day: 30,
      per_week: 4.33,
      per_month: 1,
      per_year: 1 / 12,
    };

    const multiplier = periodsPerMonth[consumptionPeriod];
    
    if (multiplier === 0 || multiplier === undefined) {
      // For non-time-based periods, just use the rate
      return consumptionRate;
    }

    return consumptionRate * multiplier * timeframeMonths;
  }

  /**
   * Group members by distribution group and calculate percentages
   */
  static enrichWithDistributionPercentages(
    members: ProductBundleMember[],
    siblingAssignments?: Array<{ product_id: string; percentage: number }>
  ): ProductWithRelationship[] {
    const distributionGroups = new Map<string, ProductBundleMember[]>();
    
    // Group members by distribution_group_id
    members.forEach((member) => {
      if (member.distribution_group_id) {
        const groupId = member.distribution_group_id;
        if (!distributionGroups.has(groupId)) {
          distributionGroups.set(groupId, []);
        }
        distributionGroups.get(groupId)!.push(member);
      }
    });

    // Calculate total attachment rate per group
    const groupTotals = new Map<string, number>();
    distributionGroups.forEach((groupMembers, groupId) => {
      const total = groupMembers.reduce((sum, m) => sum + (m.attachment_rate || 0), 0);
      groupTotals.set(groupId, total);
    });

    // Enrich members with calculated distribution percentages
    return members.map((member) => {
      let distributionPercentage: number | undefined;

      if (member.distribution_group_id) {
        const groupTotal = groupTotals.get(member.distribution_group_id) || 100;
        const memberAttachment = member.attachment_rate || 0;
        distributionPercentage = (memberAttachment / groupTotal) * 100;
      }

      // Check if this is a sibling group member
      const siblingPercentage = siblingAssignments?.find(
        (a) => a.product_id === member.product_id
      )?.percentage;

      return {
        id: member.product_id || member.id,
        name: '', // Will be filled in by the hook
        relationship_type: member.relationship_type,
        multiplier: member.multiplier,
        quantity: member.quantity,
        consumption_rate: member.consumption_rate,
        consumption_period: member.consumption_period,
        attachment_rate: member.attachment_rate,
        distribution_group_id: member.distribution_group_id,
        distribution_percentage: siblingPercentage || distributionPercentage,
      };
    });
  }
}
