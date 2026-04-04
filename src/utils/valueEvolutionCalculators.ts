/**
 * Value Evolution Calculation Engine
 * 
 * Core formula: Current_Value = (FutureCashFlows / (1+r)^t) * Product_of_Remaining_Phase_LoS
 * 
 * Pre-launch: Stepped S-curve as phases complete (LoS → 1.0)
 * Post-launch: Linear/exponential decline to zero at IP expiry
 */

import { differenceInMonths, addMonths, isBefore, isAfter, format } from 'date-fns';
import {
  ValueEvolutionConfig,
  ValueEvolutionResult,
  ValueEvolutionDataPoint,
  PhaseValueInflection,
  PhaseWithLoS,
} from '@/types/valueEvolution';

/**
 * Calculate asset value at a specific point in time
 * 
 * @param futureCashFlows - Total expected NPV at launch
 * @param discountRate - Annual WACC (e.g., 0.10)
 * @param monthsToLaunch - Months from calculation point to launch
 * @param remainingPhaseLoS - Array of incomplete phase LoS values (0-100)
 * @returns Current asset value
 */
export function calculateAssetValue(
  futureCashFlows: number,
  discountRate: number,
  monthsToLaunch: number,
  remainingPhaseLoS: number[]
): number {
  if (futureCashFlows <= 0 || monthsToLaunch < 0) return 0;
  
  // Time discounting: (1 + r)^t where t is in years
  const years = monthsToLaunch / 12;
  const timeDiscount = Math.pow(1 + discountRate, years);
  
  // Probability weighting: multiply all remaining phase LoS
  const cumulativeLoS = remainingPhaseLoS.reduce(
    (product, los) => product * (los / 100),
    1
  );
  
  // Final value = (FutureCashFlows / timeDiscount) * cumulativeLoS
  return (futureCashFlows / timeDiscount) * cumulativeLoS;
}

/**
 * Calculate the value jump when a phase completes
 * When phase completes, its LoS becomes 1.0 instead of X%
 * 
 * @param currentValue - Value before phase completion
 * @param completedPhaseLoS - The LoS of the completed phase (0-100)
 * @returns New value after phase completion
 */
export function calculateValueJumpOnCompletion(
  currentValue: number,
  completedPhaseLoS: number
): number {
  if (completedPhaseLoS <= 0 || completedPhaseLoS >= 100) return currentValue;
  
  // Value jumps by factor of (100 / original LoS)
  return currentValue * (100 / completedPhaseLoS);
}

/**
 * Calculate post-launch value decline
 * 
 * @param peakValue - Value at launch
 * @param monthsFromLaunch - Months elapsed since launch
 * @param totalPostLaunchMonths - Total months from launch to IP expiry
 * @param declineType - 'linear' or 'exponential'
 * @returns Value at the specified post-launch point
 */
export function calculatePostLaunchDecline(
  peakValue: number,
  monthsFromLaunch: number,
  totalPostLaunchMonths: number,
  declineType: 'linear' | 'exponential' = 'linear'
): number {
  if (monthsFromLaunch >= totalPostLaunchMonths) return 0;
  if (monthsFromLaunch <= 0) return peakValue;
  
  const remainingFraction = 1 - (monthsFromLaunch / totalPostLaunchMonths);
  
  if (declineType === 'exponential') {
    // Exponential decay: slower at first, faster near end
    return peakValue * Math.pow(remainingFraction, 1.5);
  }
  
  // Linear decline
  return peakValue * remainingFraction;
}

/**
 * Get cumulative LoS at a specific date
 * 
 * @param date - The date to calculate LoS for
 * @param phases - Phase data with LoS values
 * @returns Cumulative LoS as a percentage (0-100)
 */
export function getCumulativeLoSAtDate(
  date: Date,
  phases: PhaseWithLoS[]
): number {
  let cumulativeLoS = 100;
  
  for (const phase of phases) {
    if (phase.isComplete) {
      // Completed phases contribute 100%
      continue;
    }
    
    // For incomplete phases, check if we're past their end date
    if (phase.endDate && isBefore(phase.endDate, date)) {
      // This phase should be complete by this date, so it contributes 100%
      continue;
    }
    
    // This phase is still active/future, apply its LoS
    cumulativeLoS *= (phase.likelihoodOfSuccess / 100);
  }
  
  return cumulativeLoS;
}

/**
 * Get remaining phase LoS values at a specific date
 * 
 * @param date - The date to calculate for
 * @param phases - Phase data
 * @returns Array of LoS values for phases not yet complete
 */
export function getRemainingPhaseLoS(
  date: Date,
  phases: PhaseWithLoS[]
): number[] {
  const remaining: number[] = [];
  
  for (const phase of phases) {
    if (phase.isComplete) {
      // Already complete, LoS is retired (100%)
      continue;
    }
    
    // Check if phase would be complete by this date
    if (phase.endDate && isBefore(phase.endDate, date)) {
      continue;
    }
    
    // Phase is incomplete at this date
    remaining.push(phase.likelihoodOfSuccess);
  }
  
  return remaining;
}

/**
 * Generate cumulative spend data
 */
export function generateCumulativeSpend(
  phases: PhaseWithLoS[],
  startDate: Date,
  endDate: Date
): Map<number, number> {
  const spendByMonth = new Map<number, number>();
  const totalMonths = differenceInMonths(endDate, startDate) + 1;
  
  // Initialize all months to 0
  for (let m = 0; m <= totalMonths; m++) {
    spendByMonth.set(m, 0);
  }
  
  // Distribute phase budgets across their duration
  for (const phase of phases) {
    if (!phase.startDate || !phase.endDate || phase.budget <= 0) continue;
    
    const phaseStartMonth = Math.max(0, differenceInMonths(phase.startDate, startDate));
    const phaseEndMonth = Math.min(totalMonths, differenceInMonths(phase.endDate, startDate));
    const phaseDurationMonths = phaseEndMonth - phaseStartMonth + 1;
    
    if (phaseDurationMonths <= 0) continue;
    
    const monthlyBurn = phase.budget / phaseDurationMonths;
    
    for (let m = phaseStartMonth; m <= phaseEndMonth; m++) {
      spendByMonth.set(m, (spendByMonth.get(m) || 0) + monthlyBurn);
    }
  }
  
  // Convert to cumulative
  let cumulative = 0;
  const cumulativeByMonth = new Map<number, number>();
  
  for (let m = 0; m <= totalMonths; m++) {
    cumulative += spendByMonth.get(m) || 0;
    cumulativeByMonth.set(m, cumulative);
  }
  
  return cumulativeByMonth;
}

/**
 * Generate the complete stepped S-curve data
 */
export function generateStepUpCurve(config: ValueEvolutionConfig): ValueEvolutionResult {
  const {
    discountRate,
    ipExpiryDate,
    launchDate,
    projectStartDate,
    currentDate,
    futureCashFlows,
    phases,
    declineType,
  } = config;
  
  const dataPoints: ValueEvolutionDataPoint[] = [];
  const inflectionPoints: PhaseValueInflection[] = [];
  
  // Calculate timeline bounds
  const totalMonths = differenceInMonths(ipExpiryDate, projectStartDate);
  const launchMonthIndex = differenceInMonths(launchDate, projectStartDate);
  const currentMonthIndex = differenceInMonths(currentDate, projectStartDate);
  
  // Generate cumulative spend
  const cumulativeSpend = generateCumulativeSpend(phases, projectStartDate, ipExpiryDate);
  
  // Sort phases by order
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
  
  // Generate phase inflection points
  for (const phase of sortedPhases) {
    if (!phase.endDate) continue;
    
    const completionMonthIndex = differenceInMonths(phase.endDate, projectStartDate);
    const monthsToLaunchFromCompletion = launchMonthIndex - completionMonthIndex;
    
    // Calculate value before completion
    const losBeforeCompletion = getRemainingPhaseLoS(phase.endDate, sortedPhases);
    const valueBeforeCompletion = calculateAssetValue(
      futureCashFlows,
      discountRate,
      monthsToLaunchFromCompletion,
      losBeforeCompletion
    );
    
    // Calculate value after completion (this phase's LoS → 100%)
    const losAfterCompletion = losBeforeCompletion.filter(los => los !== phase.likelihoodOfSuccess);
    const valueAfterCompletion = calculateAssetValue(
      futureCashFlows,
      discountRate,
      monthsToLaunchFromCompletion,
      losAfterCompletion
    );
    
    inflectionPoints.push({
      phaseId: phase.id,
      phaseName: phase.name,
      phaseOrder: phase.order,
      completionDate: phase.endDate,
      valueBeforeCompletion,
      valueAfterCompletion,
      preLoS: phase.likelihoodOfSuccess,
      postLoS: 100,
      valueJump: valueAfterCompletion - valueBeforeCompletion,
      milestoneLabel: phase.milestoneLabel || phase.name,
      isComplete: phase.isComplete,
    });
  }
  
  // Peak value at launch (all phases complete, no discounting)
  const peakValue = futureCashFlows;
  const postLaunchMonths = differenceInMonths(ipExpiryDate, launchDate);
  
  // Generate data points for chart
  for (let monthIndex = 0; monthIndex <= totalMonths; monthIndex++) {
    const pointDate = addMonths(projectStartDate, monthIndex);
    const isLaunchPoint = monthIndex === launchMonthIndex;
    
    let assetValue: number;
    let phaseName = 'Pre-Launch';
    let phaseId = '';
    let isPhaseComplete = false;
    
    if (monthIndex < launchMonthIndex) {
      // Pre-launch: stepped S-curve
      const monthsToLaunch = launchMonthIndex - monthIndex;
      const remainingLoS = getRemainingPhaseLoS(pointDate, sortedPhases);
      assetValue = calculateAssetValue(futureCashFlows, discountRate, monthsToLaunch, remainingLoS);
      
      // Find current phase
      const currentPhase = sortedPhases.find(p => 
        p.startDate && p.endDate &&
        !isBefore(pointDate, p.startDate) && !isAfter(pointDate, p.endDate)
      );
      if (currentPhase) {
        phaseName = currentPhase.name;
        phaseId = currentPhase.id;
      }
      
      // Check if this is a phase completion point
      const completedPhase = sortedPhases.find(p => 
        p.endDate && differenceInMonths(p.endDate, projectStartDate) === monthIndex
      );
      if (completedPhase) {
        isPhaseComplete = true;
        phaseName = completedPhase.name;
        phaseId = completedPhase.id;
      }
    } else if (monthIndex === launchMonthIndex) {
      // Launch point - peak value
      assetValue = peakValue;
      phaseName = 'Launch';
    } else {
      // Post-launch: decline to IP expiry
      const monthsFromLaunch = monthIndex - launchMonthIndex;
      assetValue = calculatePostLaunchDecline(peakValue, monthsFromLaunch, postLaunchMonths, declineType);
      phaseName = 'Post-Launch';
    }
    
    const cumulativeLoS = getCumulativeLoSAtDate(pointDate, sortedPhases);
    
    dataPoints.push({
      timestamp: pointDate,
      monthIndex,
      label: format(pointDate, 'MMM yyyy'),
      assetValue,
      cumulativeSpend: cumulativeSpend.get(monthIndex) || 0,
      phaseName,
      phaseId,
      isPhaseComplete,
      isLaunchPoint,
      cumulativeLoS,
    });
  }
  
  // Calculate current values
  const currentDataPoint = dataPoints.find(dp => dp.monthIndex === currentMonthIndex);
  const currentValue = currentDataPoint?.assetValue || 0;
  const currentSpendValue = currentDataPoint?.cumulativeSpend || 0;
  const currentCumulativeLoS = currentDataPoint?.cumulativeLoS || 100;
  const monthsToLaunch = Math.max(0, launchMonthIndex - currentMonthIndex);
  
  return {
    dataPoints,
    inflectionPoints,
    currentValue,
    peakValue,
    currentSpend: currentSpendValue,
    netValueCreated: currentValue - currentSpendValue,
    cumulativeLoS: currentCumulativeLoS,
    monthsToLaunch,
    totalIpLifeMonths: totalMonths,
  };
}

/**
 * Calculate current asset value for the summary panel
 */
export function calculateCurrentAssetValue(
  futureCashFlows: number,
  discountRate: number,
  launchDate: Date,
  currentDate: Date,
  phases: PhaseWithLoS[]
): number {
  if (isAfter(currentDate, launchDate)) {
    // Post-launch - return remaining value
    return futureCashFlows; // Simplified for now
  }
  
  const monthsToLaunch = differenceInMonths(launchDate, currentDate);
  const remainingLoS = getRemainingPhaseLoS(currentDate, phases);
  
  return calculateAssetValue(futureCashFlows, discountRate, monthsToLaunch, remainingLoS);
}
