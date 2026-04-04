
export interface AffectedProduct {
  productId: string;
  productName: string;
  // Legacy field for backward compatibility
  monthlyImpactPercentage?: number;
  // New progressive cannibalization fields
  monthsToReachRoof: number;
  totalCannibalizationPercentage: number;
}

export interface AffectedProductsData {
  affectedProducts: AffectedProduct[];
}

// Helper function to calculate progressive cannibalization for a specific month
export function calculateProgressiveCannibalization(
  affectedProduct: AffectedProduct,
  currentMonth: number,
  affectedProductBaselineRevenue: number
): number {
  const { monthsToReachRoof, totalCannibalizationPercentage } = affectedProduct;
  
  let impactPercentage: number;
  
  if (currentMonth <= monthsToReachRoof) {
    // Linear progression to roof
    impactPercentage = (currentMonth / monthsToReachRoof) * totalCannibalizationPercentage;
  } else {
    // Roof reached, maintain maximum impact
    impactPercentage = totalCannibalizationPercentage;
  }
  
  return affectedProductBaselineRevenue * (impactPercentage / 100);
}
