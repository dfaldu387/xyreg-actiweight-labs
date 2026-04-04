 // Cost Distribution Types for rNPV Engine
 
 export interface MonthlyBucket {
   month: number;      // 1-based month index within the phase
   amount: number;     // Absolute amount for this month
   weight: number;     // Percentage weight (0-1)
 }
 
 export type DistributionPreset = 'flat' | 's-curve' | 'front-loaded' | 'back-loaded' | 'custom';
 
 export interface CostDistributionEntry {
   id: string;
   costTypeId: string;
   costTypeName: string;
   phaseId: string;
   phaseName: string;
   phaseMonths: number;      // Duration of the phase in months
   totalBudget: number;
   currency: string;
   distribution: MonthlyBucket[];
   distributionPreset: DistributionPreset;
   phaseLoS: number;         // Likelihood of Success for this phase (0-100)
 }
 
 export interface CostDistributionOutput {
   costTypeId: string;
   costTypeName: string;
   phaseId: string;
   phaseName: string;
   totalAmount: number;
   distribution: MonthlyBucket[];
 }
 
 export interface CostTypeDefinition {
   id: string;
   name: string;
   defaultPhaseId?: string;
   isRequired?: boolean;
 }
 
 export const DEFAULT_COST_TYPES: CostTypeDefinition[] = [
   { id: 'development', name: 'Development Costs', isRequired: true },
   { id: 'clinical', name: 'Clinical Trial Costs' },
   { id: 'regulatory', name: 'Regulatory Costs' },
   { id: 'manufacturing', name: 'Manufacturing Costs' },
   { id: 'marketing', name: 'Marketing Costs' },
   { id: 'operational', name: 'Operational Costs' },
   { id: 'customer-acquisition', name: 'Customer Acquisition Cost' },
 ];
 
 export interface PhaseOption {
   id: string;
   name: string;
   months: number;
   loS: number;
 }