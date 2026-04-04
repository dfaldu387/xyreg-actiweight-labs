/**
 * Calculates even distribution percentages across variants
 */
export function calculateEvenDistribution(
  totalPercentage: number,
  variantCount: number
): number[] {
  if (variantCount === 0) return [];
  
  const basePercentage = totalPercentage / variantCount;
  const percentages = Array(variantCount).fill(basePercentage);
  
  // Handle rounding by adjusting the first variant
  const sum = percentages.reduce((a, b) => a + b, 0);
  const diff = totalPercentage - sum;
  if (Math.abs(diff) > 0.001) {
    percentages[0] += diff;
  }
  
  return percentages.map(p => Math.round(p * 100) / 100);
}

/**
 * Calculates Gaussian (normal) distribution percentages across variants
 * Peak is at the middle, tapers towards edges
 */
export function calculateGaussianDistribution(
  totalPercentage: number,
  variantCount: number
): number[] {
  if (variantCount === 0) return [];
  if (variantCount === 1) return [totalPercentage];
  
  // Calculate Gaussian weights
  const mean = (variantCount - 1) / 2;
  const stdDev = variantCount / 6; // Standard deviation spans ~99.7% of data
  
  const weights = Array.from({ length: variantCount }, (_, i) => {
    const x = i - mean;
    return Math.exp(-(x * x) / (2 * stdDev * stdDev));
  });
  
  // Normalize weights to sum to totalPercentage
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  const percentages = weights.map(w => (w / sumWeights) * totalPercentage);
  
  // Round and adjust for rounding errors
  const rounded = percentages.map(p => Math.round(p * 100) / 100);
  const sum = rounded.reduce((a, b) => a + b, 0);
  const diff = totalPercentage - sum;
  
  if (Math.abs(diff) > 0.001) {
    // Find index of max value and adjust it
    const maxIndex = rounded.indexOf(Math.max(...rounded));
    rounded[maxIndex] += diff;
    rounded[maxIndex] = Math.round(rounded[maxIndex] * 100) / 100;
  }
  
  return rounded;
}

/**
 * Validates that empirical percentages sum to the expected total
 */
export function validateEmpiricalDistribution(
  percentages: number[],
  expectedTotal: number
): { valid: boolean; actualTotal: number; diff: number } {
  const actualTotal = percentages.reduce((a, b) => a + b, 0);
  const diff = Math.abs(expectedTotal - actualTotal);
  
  return {
    valid: diff < 0.01, // Allow 0.01% tolerance for rounding
    actualTotal: Math.round(actualTotal * 100) / 100,
    diff: Math.round(diff * 100) / 100
  };
}

/**
 * Adjusts empirical percentages to match target total
 */
export function adjustEmpiricalDistribution(
  percentages: number[],
  targetTotal: number
): number[] {
  const currentTotal = percentages.reduce((a, b) => a + b, 0);
  
  if (currentTotal === 0) {
    return calculateEvenDistribution(targetTotal, percentages.length);
  }
  
  const factor = targetTotal / currentTotal;
  const adjusted = percentages.map(p => p * factor);
  
  // Round and handle rounding errors
  const rounded = adjusted.map(p => Math.round(p * 100) / 100);
  const sum = rounded.reduce((a, b) => a + b, 0);
  const diff = targetTotal - sum;
  
  if (Math.abs(diff) > 0.001) {
    const maxIndex = rounded.indexOf(Math.max(...rounded));
    rounded[maxIndex] += diff;
    rounded[maxIndex] = Math.round(rounded[maxIndex] * 100) / 100;
  }
  
  return rounded;
}
 
 // ============================================
 // Cost Distribution Functions for rNPV Engine
 // ============================================
 
 import type { MonthlyBucket, DistributionPreset } from '@/types/costDistribution';
 
 /**
  * Generates a flat (even) distribution of costs across months
  */
 export function generateFlatCostDistribution(
   totalBudget: number,
   months: number
 ): MonthlyBucket[] {
   if (months <= 0) return [];
   
   const monthlyAmount = totalBudget / months;
   const weight = 1 / months;
   
   const buckets: MonthlyBucket[] = Array.from({ length: months }, (_, i) => ({
     month: i + 1,
     amount: Math.round(monthlyAmount * 100) / 100,
     weight: Math.round(weight * 10000) / 10000,
   }));
   
   // Adjust first bucket for rounding errors
   const sum = buckets.reduce((acc, b) => acc + b.amount, 0);
   const diff = totalBudget - sum;
   if (Math.abs(diff) > 0.001 && buckets.length > 0) {
     buckets[0].amount = Math.round((buckets[0].amount + diff) * 100) / 100;
   }
   
   return buckets;
 }
 
 /**
  * Generates an S-Curve (bell/Gaussian) distribution - peaks in the middle
  */
 export function generateSCurveCostDistribution(
   totalBudget: number,
   months: number
 ): MonthlyBucket[] {
   if (months <= 0) return [];
   if (months === 1) return [{ month: 1, amount: totalBudget, weight: 1 }];
   
   const mean = (months - 1) / 2;
   const stdDev = months / 6;
   
   // Calculate Gaussian weights
   const weights = Array.from({ length: months }, (_, i) => {
     const x = i - mean;
     return Math.exp(-(x * x) / (2 * stdDev * stdDev));
   });
   
   const sumWeights = weights.reduce((a, b) => a + b, 0);
   const normalizedWeights = weights.map(w => w / sumWeights);
   
   const buckets: MonthlyBucket[] = normalizedWeights.map((weight, i) => ({
     month: i + 1,
     amount: Math.round(weight * totalBudget * 100) / 100,
     weight: Math.round(weight * 10000) / 10000,
   }));
   
   // Adjust for rounding errors
   const sum = buckets.reduce((acc, b) => acc + b.amount, 0);
   const diff = totalBudget - sum;
   if (Math.abs(diff) > 0.001 && buckets.length > 0) {
     const maxIndex = buckets.reduce((maxIdx, b, idx, arr) => 
       b.amount > arr[maxIdx].amount ? idx : maxIdx, 0);
     buckets[maxIndex].amount = Math.round((buckets[maxIndex].amount + diff) * 100) / 100;
   }
   
   return buckets;
 }
 
 /**
  * Generates a front-loaded distribution - 60% in first half, 40% in second
  */
 export function generateFrontLoadedCostDistribution(
   totalBudget: number,
   months: number
 ): MonthlyBucket[] {
   if (months <= 0) return [];
   if (months === 1) return [{ month: 1, amount: totalBudget, weight: 1 }];
   
   const midpoint = Math.ceil(months / 2);
   const firstHalfBudget = totalBudget * 0.6;
   const secondHalfBudget = totalBudget * 0.4;
   
   const buckets: MonthlyBucket[] = [];
   
   // First half - higher amounts
   const firstHalfMonthly = firstHalfBudget / midpoint;
   for (let i = 0; i < midpoint; i++) {
     buckets.push({
       month: i + 1,
       amount: Math.round(firstHalfMonthly * 100) / 100,
       weight: Math.round((firstHalfMonthly / totalBudget) * 10000) / 10000,
     });
   }
   
   // Second half - lower amounts
   const secondHalfMonths = months - midpoint;
   if (secondHalfMonths > 0) {
     const secondHalfMonthly = secondHalfBudget / secondHalfMonths;
     for (let i = midpoint; i < months; i++) {
       buckets.push({
         month: i + 1,
         amount: Math.round(secondHalfMonthly * 100) / 100,
         weight: Math.round((secondHalfMonthly / totalBudget) * 10000) / 10000,
       });
     }
   }
   
   // Adjust for rounding errors
   const sum = buckets.reduce((acc, b) => acc + b.amount, 0);
   const diff = totalBudget - sum;
   if (Math.abs(diff) > 0.001 && buckets.length > 0) {
     buckets[0].amount = Math.round((buckets[0].amount + diff) * 100) / 100;
   }
   
   return buckets;
 }
 
 /**
  * Generates a back-loaded distribution - 40% in first half, 60% in second
  */
 export function generateBackLoadedCostDistribution(
   totalBudget: number,
   months: number
 ): MonthlyBucket[] {
   if (months <= 0) return [];
   if (months === 1) return [{ month: 1, amount: totalBudget, weight: 1 }];
   
   const midpoint = Math.ceil(months / 2);
   const firstHalfBudget = totalBudget * 0.4;
   const secondHalfBudget = totalBudget * 0.6;
   
   const buckets: MonthlyBucket[] = [];
   
   // First half - lower amounts
   const firstHalfMonthly = firstHalfBudget / midpoint;
   for (let i = 0; i < midpoint; i++) {
     buckets.push({
       month: i + 1,
       amount: Math.round(firstHalfMonthly * 100) / 100,
       weight: Math.round((firstHalfMonthly / totalBudget) * 10000) / 10000,
     });
   }
   
   // Second half - higher amounts
   const secondHalfMonths = months - midpoint;
   if (secondHalfMonths > 0) {
     const secondHalfMonthly = secondHalfBudget / secondHalfMonths;
     for (let i = midpoint; i < months; i++) {
       buckets.push({
         month: i + 1,
         amount: Math.round(secondHalfMonthly * 100) / 100,
         weight: Math.round((secondHalfMonthly / totalBudget) * 10000) / 10000,
       });
     }
   }
   
   // Adjust for rounding errors
   const sum = buckets.reduce((acc, b) => acc + b.amount, 0);
   const diff = totalBudget - sum;
   if (Math.abs(diff) > 0.001 && buckets.length > 0) {
     buckets[buckets.length - 1].amount = Math.round((buckets[buckets.length - 1].amount + diff) * 100) / 100;
   }
   
   return buckets;
 }
 
 /**
  * Generates distribution based on preset type
  */
 export function generateCostDistribution(
   preset: DistributionPreset,
   totalBudget: number,
   months: number
 ): MonthlyBucket[] {
   switch (preset) {
     case 'flat':
       return generateFlatCostDistribution(totalBudget, months);
     case 's-curve':
       return generateSCurveCostDistribution(totalBudget, months);
     case 'front-loaded':
       return generateFrontLoadedCostDistribution(totalBudget, months);
     case 'back-loaded':
       return generateBackLoadedCostDistribution(totalBudget, months);
     case 'custom':
     default:
       return generateFlatCostDistribution(totalBudget, months);
   }
 }
 
 /**
  * Normalizes buckets to match a target total while preserving relative weights
  */
 export function normalizeCostDistribution(
   buckets: MonthlyBucket[],
   targetTotal: number
 ): MonthlyBucket[] {
   const currentTotal = buckets.reduce((acc, b) => acc + b.amount, 0);
   
   if (currentTotal === 0 || buckets.length === 0) {
     return generateFlatCostDistribution(targetTotal, buckets.length);
   }
   
   const factor = targetTotal / currentTotal;
   
   const normalized = buckets.map(bucket => ({
     ...bucket,
     amount: Math.round(bucket.amount * factor * 100) / 100,
     weight: Math.round((bucket.amount * factor / targetTotal) * 10000) / 10000,
   }));
   
   // Adjust for rounding errors
   const sum = normalized.reduce((acc, b) => acc + b.amount, 0);
   const diff = targetTotal - sum;
   if (Math.abs(diff) > 0.001 && normalized.length > 0) {
     const maxIndex = normalized.reduce((maxIdx, b, idx, arr) => 
       b.amount > arr[maxIdx].amount ? idx : maxIdx, 0);
     normalized[maxIndex].amount = Math.round((normalized[maxIndex].amount + diff) * 100) / 100;
   }
   
   return normalized;
 }
 
 /**
  * Calculates risk-adjusted present value for cost distribution
  * @param buckets Monthly cost buckets
  * @param phaseLoS Likelihood of Success (0-100)
  * @param annualDiscountRate Annual discount rate (e.g., 10 for 10%)
  * @param startMonth Starting month offset from project start
  */
 export function calculateRiskAdjustedCostValue(
   buckets: MonthlyBucket[],
   phaseLoS: number,
   annualDiscountRate: number,
   startMonth: number = 0
 ): { nominal: number; riskAdjusted: number } {
   const monthlyRate = annualDiscountRate / 100 / 12;
   const losMultiplier = phaseLoS / 100;
   
   let nominal = 0;
   let riskAdjusted = 0;
   
   buckets.forEach((bucket, index) => {
     const monthOffset = startMonth + index;
     const discountFactor = 1 / Math.pow(1 + monthlyRate, monthOffset);
     
     nominal += bucket.amount;
     riskAdjusted += bucket.amount * losMultiplier * discountFactor;
   });
   
   return {
     nominal: Math.round(nominal * 100) / 100,
     riskAdjusted: Math.round(riskAdjusted * 100) / 100,
   };
 }
 
 /**
  * Snaps a value to the nearest grid step
  */
 export function snapToGridStep(value: number, gridStep: number): number {
   if (gridStep <= 0) return value;
   return Math.round(value / gridStep) * gridStep;
 }
