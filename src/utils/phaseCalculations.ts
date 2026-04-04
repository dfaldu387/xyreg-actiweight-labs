import { Phase } from "@/components/settings/phases/ConsolidatedPhaseDataService";

/**
 * Calculate the total project duration in days based on linear phases
 * This finds the maximum end day from all phases (start day + duration)
 */
export function calculateTotalProjectDuration(activePhases: Phase[]): number {
  let maxEndDay = 0;
  
  for (const phase of activePhases) {
    // Calculate end day based on start_date and duration_days
    if (phase.start_date && phase.duration_days) {
      // Convert start_date to days from project start (this would need project start reference)
      // For now, use position * 30 as approximation
      const startDay = phase.position * 30;
      const phaseEndDay = startDay + phase.duration_days;
      maxEndDay = Math.max(maxEndDay, phaseEndDay);
    }
  }
  
  // Default to 180 days if no phases exist
  return maxEndDay > 0 ? maxEndDay : 180;
}

/**
 * Calculate the actual start and end days for a concurrent phase based on percentages
 */
export function calculateDaysFromPercentage(
  startPercentage: number, 
  endPercentage: number, 
  totalProjectDays: number
): { startDay: number; endDay: number } {
  const startDay = Math.round((startPercentage / 100) * totalProjectDays);
  const endDay = Math.round((endPercentage / 100) * totalProjectDays);
  
  return { startDay, endDay };
}

/**
 * Format day calculation display text
 */
export function formatDayCalculation(
  startPercentage: number, 
  endPercentage: number, 
  totalProjectDays: number
): string {
  const { startDay, endDay } = calculateDaysFromPercentage(startPercentage, endPercentage, totalProjectDays);
  return `≈ Day ${startDay} - Day ${endDay} (based on ${totalProjectDays}-day project)`;
}

/**
 * Calculate the start date for a post-launch phase based on launch date
 */
export function calculatePostLaunchPhaseStartDate(
  launchDate: Date, 
  startDayAfterLaunch: number
): Date {
  const startDate = new Date(launchDate);
  startDate.setDate(startDate.getDate() + startDayAfterLaunch);
  return startDate;
}

/**
 * Calculate the end date for a post-launch phase
 */
export function calculatePostLaunchPhaseEndDate(
  launchDate: Date, 
  startDayAfterLaunch: number, 
  durationDays?: number, 
  isContinuous: boolean = false
): Date | undefined {
  const startDate = calculatePostLaunchPhaseStartDate(launchDate, startDayAfterLaunch);
  
  if (isContinuous || !durationDays) {
    // For continuous phases, return undefined to indicate unlimited duration
    // or calculate a reasonable display end date (e.g., 1 year from start)
    const displayEndDate = new Date(startDate);
    displayEndDate.setFullYear(displayEndDate.getFullYear() + 1);
    return displayEndDate;
  }
  
  // For finite phases, calculate actual end date
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

/**
 * Calculate post-launch phase dates from percentage-based timing
 */
export function calculatePostLaunchDatesFromPercentage(
  launchDate: Date,
  startPercentage: number,
  endPercentage: number,
  postLaunchTimelineDays: number = 365 // Default 1 year post-launch timeline
): { startDate: Date; endDate: Date } {
  const startDayAfterLaunch = Math.round((startPercentage / 100) * postLaunchTimelineDays);
  const endDayAfterLaunch = Math.round((endPercentage / 100) * postLaunchTimelineDays);
  
  const startDate = calculatePostLaunchPhaseStartDate(launchDate, startDayAfterLaunch);
  const endDate = calculatePostLaunchPhaseStartDate(launchDate, endDayAfterLaunch);
  
  return { startDate, endDate };
}

/**
 * Get smart defaults for linear pre-revenue phases
 */
export function getLinearPreRevenueDefaults(activePhases: Phase[], existingPhase?: Phase): {
  start_date: Date | null;
  duration_days: number;
} {
  // Find the latest end date from existing phases
  let latestEndDate: Date | null = null;
  
  for (const phase of activePhases) {
    if (phase.id !== existingPhase?.id && phase.start_date && phase.duration_days) {
      const phaseEndDate = new Date(phase.start_date);
      phaseEndDate.setDate(phaseEndDate.getDate() + phase.duration_days);
      
      if (!latestEndDate || phaseEndDate > latestEndDate) {
        latestEndDate = phaseEndDate;
      }
    }
  }
  
  return {
    start_date: latestEndDate, // Start after the latest existing phase
    duration_days: 30 // Default 30-day duration
  };
}

/**
 * Get smart defaults for linear post-revenue phases
 */
export function getLinearPostRevenueDefaults(): {
  start_date: Date | null;
  duration_days: number;
} {
  return {
    start_date: new Date(), // Start at launch/current date
    duration_days: 90 // Default 90-day duration for post-launch activities
  };
}
