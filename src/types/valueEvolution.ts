/**
 * Value Evolution Analytics Types
 * Types for the "Step-Up" chart showing project asset value over the lifecycle
 */

import { PhaseBudgetData } from '@/services/enhanced-rnpv/budgetIntegrationService';

/**
 * Data point for the value evolution chart
 */
export interface ValueEvolutionDataPoint {
  /** Timestamp as Date object */
  timestamp: Date;
  /** Month index from project start */
  monthIndex: number;
  /** Display label for X-axis */
  label: string;
  /** Current asset value at this point */
  assetValue: number;
  /** Cumulative actual spend up to this point */
  cumulativeSpend: number;
  /** Current phase name */
  phaseName: string;
  /** Phase ID */
  phaseId: string;
  /** Whether this point represents a phase completion */
  isPhaseComplete: boolean;
  /** Is this the launch point */
  isLaunchPoint: boolean;
  /** Cumulative LoS at this point */
  cumulativeLoS: number;
}

/**
 * Represents a phase value inflection (step-up) point
 */
export interface PhaseValueInflection {
  phaseId: string;
  phaseName: string;
  phaseOrder: number;
  /** When the phase completes (LoS retires) */
  completionDate: Date | null;
  /** Value just before phase completion */
  valueBeforeCompletion: number;
  /** Value immediately after (LoS → 1.0) */
  valueAfterCompletion: number;
  /** The LoS value before retirement */
  preLoS: number;
  /** Always 100 after retirement */
  postLoS: number;
  /** The jump in value due to retirement */
  valueJump: number;
  /** Milestone label (e.g., "FDA 510(k) Cleared") */
  milestoneLabel: string;
  /** Whether this phase is complete */
  isComplete: boolean;
}

/**
 * Configuration for value evolution calculation
 */
export interface ValueEvolutionConfig {
  /** Annual discount rate (WACC) as decimal (e.g., 0.10 for 10%) */
  discountRate: number;
  /** IP/Patent expiry date */
  ipExpiryDate: Date;
  /** Expected launch date */
  launchDate: Date;
  /** Project start date */
  projectStartDate: Date;
  /** Today's date for "current value" marker */
  currentDate: Date;
  /** Total expected future cash flows at launch (peak NPV) */
  futureCashFlows: number;
  /** Phase data with LoS values */
  phases: PhaseWithLoS[];
  /** Post-launch decline type */
  declineType: 'linear' | 'exponential';
}

/**
 * Phase data with LoS information
 */
export interface PhaseWithLoS {
  id: string;
  name: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  budget: number;
  likelihoodOfSuccess: number;
  isComplete: boolean;
  milestoneLabel?: string;
}

/**
 * Result of value evolution calculation
 */
export interface ValueEvolutionResult {
  /** All data points for the chart */
  dataPoints: ValueEvolutionDataPoint[];
  /** Phase inflection points (step-ups) */
  inflectionPoints: PhaseValueInflection[];
  /** Current asset value (at today) */
  currentValue: number;
  /** Peak value at launch */
  peakValue: number;
  /** Total cumulative spend at current date */
  currentSpend: number;
  /** Net value created (current value - current spend) */
  netValueCreated: number;
  /** Current cumulative LoS */
  cumulativeLoS: number;
  /** Months to launch from today */
  monthsToLaunch: number;
  /** Total IP life in months */
  totalIpLifeMonths: number;
}

/**
 * Simulated values for what-if analysis
 */
export interface SimulatedValues {
  /** Override LoS values per phase */
  phaseLoS: Record<string, number>;
  /** Override launch date */
  launchDate: Date | null;
  /** Override IP expiry date */
  ipExpiryDate: Date | null;
}

/**
 * Props for the Value Evolution Tab container
 */
export interface ValueEvolutionTabProps {
  productId: string;
  phases: PhaseBudgetData[];
  npvData: Record<string, any>;
  marketInputs: Record<string, any>;
  currency: string;
  disabled?: boolean;
}

/**
 * Props for the Step-Up Value Chart
 */
export interface StepUpValueChartProps {
  dataPoints: ValueEvolutionDataPoint[];
  inflectionPoints: PhaseValueInflection[];
  currentValue: number;
  peakValue: number;
  launchDate: Date;
  ipExpiryDate: Date;
  currentDate: Date;
  currency: string;
  onIpExpiryChange?: (newDate: Date) => void;
}

/**
 * Props for the Value Evolution Controls
 */
export interface ValueEvolutionControlsProps {
  phases: PhaseWithLoS[];
  simulatedLoS: Record<string, number>;
  launchDate: Date;
  ipExpiryDate: Date;
  onPhaseLoSChange: (phaseId: string, newLoS: number) => void;
  onLaunchDateChange: (newDate: Date) => void;
  onIpExpiryChange: (newDate: Date) => void;
  onReset: () => void;
  currency: string;
}

/**
 * Props for the Current Value Summary
 */
export interface CurrentValueSummaryProps {
  currentValue: number;
  peakValue: number;
  cumulativeLoS: number;
  currentSpend: number;
  netValueCreated: number;
  monthsToLaunch: number;
  currency: string;
}
