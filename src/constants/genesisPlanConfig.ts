/**
 * Genesis Plan Menu Access Configuration
 *
 * This file defines which features are enabled/disabled for the Genesis (free) plan.
 * The menu_access object should be stored in the `new_pricing_plans` table for the Genesis plan.
 *
 * Genesis Plan Features (from pricing page):
 * - Venture Blueprint (Starter) - Core ideation & feasibility tools
 * - Opportunity & Definition phase features
 * - Feasibility & Planning phase features
 * - Market Readiness phase features
 * - Viability Score Dashboard
 * - Pitch Builder
 *
 * Genesis Plan Restrictions:
 * - No Technical File Export (DHF/DMR)
 * - No Active Compliance Modules
 * - AI Credits via Purchase or Referrals Only
 * - 1 Device only
 * - 1 Market only (per device)
 */

import {
  MISSION_CONTROL_MENU_ACCESS,
  PORTFOLIO_MENU_ACCESS,
  DEVICES_MENU_ACCESS,
  DRAFT_STUDIO_MENU_ACCESS,
} from './menuAccessKeys';

/**
 * Genesis Plan Menu Access Configuration
 * true = enabled, false = disabled/locked
 *
 * Uses the exact keys from menuAccessKeys.ts to ensure consistency
 * with the SIDEBAR_TO_MENU_ACCESS_MAP mapping.
 */
export const GENESIS_MENU_ACCESS: Record<string, boolean | Record<string, number>> = {
  // ==================== MISSION CONTROL ====================
  [MISSION_CONTROL_MENU_ACCESS.MISSION_CONTROL]: true, // Enabled for Genesis
  [MISSION_CONTROL_MENU_ACCESS.CLIENT_COMPASS]: true, // Enabled for Genesis

  // ==================== PORTFOLIO (COMPANY DASHBOARD) ====================
  [PORTFOLIO_MENU_ACCESS.DASHBOARD]: false, // Company Dashboard - Helix OS feature
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL]: false, // Commercial Intelligence - Helix OS feature
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_STRATEGIC_BLUEPRINT]: false,
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_BUSINESS_CANVAS]: false,
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_FEASIBILITY_STUDIES]: false,
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_MARKET_ANALYSIS]: false,
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_COMMERCIAL_PERFORMANCE]: false,
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_VARIANCE_ANALYSIS]: false,
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_PRICING_STRATEGY]: false,
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_INVESTORS]: false,
  [PORTFOLIO_MENU_ACCESS.COMMERCIAL_IP_PORTFOLIO]: true, // IP Management - enabled for Genesis
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO]: true, // Portfolio Management - needed for Genesis
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_GENESIS]: true, // Genesis specific view
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_SUNBURST]: false,
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_PHASES_CHART]: false,
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_CARDS]: true, // Basic cards view
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_PHASES]: false,
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_TIMELINE]: false,
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_LIST]: true, // Basic list view
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_RELATIONSHIPS]: false,
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_HIERARCHY]: false, // hierarchy-graph
  [PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_BUNDLES]: false,
  [PORTFOLIO_MENU_ACCESS.MILESTONES]: true, // Basic milestones
  [PORTFOLIO_MENU_ACCESS.COMPLIANCE_INSTANCES]: false, // No compliance modules
  [PORTFOLIO_MENU_ACCESS.COMPLIANCE_DOCUMENTS]: false, // compliance-instances.documents
  [PORTFOLIO_MENU_ACCESS.COMPLIANCE_GAP_ANALYSIS]: false, // compliance-instances.gap-analysis
  [PORTFOLIO_MENU_ACCESS.COMPLIANCE_ACTIVITIES]: false, // compliance-instances.activities
  [PORTFOLIO_MENU_ACCESS.COMPLIANCE_AUDITS]: false, // compliance-instances.audits
  [PORTFOLIO_MENU_ACCESS.CAPA]: false, // CAPA - Helix OS feature
  [PORTFOLIO_MENU_ACCESS.CHANGE_CONTROL]: false, // Change Control - Helix OS feature
  [PORTFOLIO_MENU_ACCESS.OPERATIONS]: false, // Operations - Helix OS feature
  [PORTFOLIO_MENU_ACCESS.OPERATIONS_BUDGET]: false, // operations.budget-dashboard
  [PORTFOLIO_MENU_ACCESS.OPERATIONS_SUPPLIERS]: false, // operations.suppliers
  [PORTFOLIO_MENU_ACCESS.PMS]: false, // Post-Market Surveillance - Helix OS feature
  [PORTFOLIO_MENU_ACCESS.TRAINING]: false, // Training - Helix OS feature
  [PORTFOLIO_MENU_ACCESS.COMMUNICATIONS]: false, // Communications - Helix OS feature
  [PORTFOLIO_MENU_ACCESS.AUDIT_LOG]: false, // Audit Log - Helix OS feature

  // ==================== DEVICES (PRODUCT LEVEL) ====================
  [DEVICES_MENU_ACCESS.DASHBOARD]: true, // Device Dashboard - basic overview

  // Business Case - Core Genesis features
  [DEVICES_MENU_ACCESS.BUSINESS_CASE]: true,
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_VIABILITY]: true, // viability-scorecard - Viability Score Dashboard
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_VENTURE]: true, // venture-blueprint - Venture Blueprint - core Genesis
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS]: true, // business-canvas - Business Canvas
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_TEAM]: true, // team-profile - Team Profile
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_MARKET_SIZING]: true, // market-sizing - Market Sizing (TAM/SAM/SOM)
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_COMPETITION]: true, // competition - Competition Analysis
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_RNPV]: true, // rnpv - rNPV Analysis
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_REIMBURSEMENT]: true, // reimbursement - Reimbursement - in Feasibility phase
  [DEVICES_MENU_ACCESS.BUSINESS_CASE_PRICING]: false, // pricing-strategy - Pricing Strategy - Helix OS feature

  // Device Definition - Core Genesis features
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION]: true,
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION_OVERVIEW]: true,
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION_PURPOSE]: true, // intended-purpose - Intended Purpose
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION_GENERAL]: true, // General info
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION_IDENTIFICATION]: true, // Identification
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION_REGULATORY]: true, // Regulatory classification
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION_MARKETS]: true, // target-markets - Target Markets (limited to 1)
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION_BUNDLES]: false, // Bundles - Helix OS feature
  [DEVICES_MENU_ACCESS.DEVICE_DEFINITION_AUDIT_LOG]: false, // Audit Log - Helix OS feature

  // Design & Risk Controls - DISABLED for Genesis (Helix OS feature)
  [DEVICES_MENU_ACCESS.DESIGN_RISK]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS_USER_NEEDS]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS_SYSTEM]: false, // system-requirements
  [DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS_SOFTWARE]: false, // software-requirements
  [DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS_HARDWARE]: false, // hardware-requirements
  [DEVICES_MENU_ACCESS.DESIGN_RISK_ARCHITECTURE]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_MANAGEMENT]: true,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_VV]: false, // verification-validation
  [DEVICES_MENU_ACCESS.DESIGN_RISK_VV_PLAN]: false, // verification-validation.vv-plan
  [DEVICES_MENU_ACCESS.DESIGN_RISK_VV_TEST_CASES]: false, // verification-validation.test-cases
  [DEVICES_MENU_ACCESS.DESIGN_RISK_VV_TEST_EXECUTION]: false, // verification-validation.test-execution
  [DEVICES_MENU_ACCESS.DESIGN_RISK_VV_DEFECTS]: false, // verification-validation.defects
  [DEVICES_MENU_ACCESS.DESIGN_RISK_VV_REPORTS]: false, // verification-validation.reports
  [DEVICES_MENU_ACCESS.DESIGN_RISK_VV_AI_ASSURANCE]: false, // verification-validation.ai-assurance
  [DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_MATRIX]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_GAPS]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_IMPACT]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_SETTINGS]: false,
  [DEVICES_MENU_ACCESS.DESIGN_RISK_UEF]: false, // usability-engineering - Usability Engineering

  // Clinical Trials - Basic access for Genesis (evidence planning)
  [DEVICES_MENU_ACCESS.CLINICAL_TRIALS]: true, // Clinical Evidence Strategy in Feasibility phase

  // Milestones - Basic access
  [DEVICES_MENU_ACCESS.MILESTONES]: true, // High-Level Project & Resource Plan

  // Compliance Instances - DISABLED for Genesis
  [DEVICES_MENU_ACCESS.COMPLIANCE_INSTANCES]: false,
  [DEVICES_MENU_ACCESS.COMPLIANCE_DOCUMENTS]: false, // compliance-instances.documents
  [DEVICES_MENU_ACCESS.COMPLIANCE_GAP_ANALYSIS]: false, // compliance-instances.gap-analysis
  [DEVICES_MENU_ACCESS.COMPLIANCE_ACTIVITIES]: false, // compliance-instances.activities
  [DEVICES_MENU_ACCESS.COMPLIANCE_AUDITS]: false, // compliance-instances.audits

  // CAPA - DISABLED for Genesis
  [DEVICES_MENU_ACCESS.CAPA]: false,

  // Post-Market Surveillance - DISABLED for Genesis
  [DEVICES_MENU_ACCESS.PMS]: false,

  // User Access - Basic access
  [DEVICES_MENU_ACCESS.USER_ACCESS]: false, // Helix OS feature

  // ==================== DOCUMENT STUDIO ====================
  [DRAFT_STUDIO_MENU_ACCESS.DOCUMENT_STUDIO]: false, // Helix OS feature

  // ==================== FEATURE LIMITS ====================
  // Special key for feature limits (numeric values)
  '_feature_limits': {
    'devices.device-definition.target-markets': 1, // Max 1 market for Genesis
    'max_devices': 1, // Max 1 device for Genesis
  },
};

/**
 * Genesis Plan Restrictions (for display purposes)
 */
export const GENESIS_RESTRICTIONS = [
  'No Technical File Export (DHF/DMR)',
  'No Active Compliance Modules',
  'AI Credits via Purchase or Referrals Only',
];

/**
 * Genesis Plan Included Features (for display purposes)
 */
export const GENESIS_FEATURES = [
  { name: 'Venture Blueprint Builder', included: true, phase: 'Core' },
  { name: 'Live Pitch Link (Shareable)', included: true, phase: 'Core' },
  { name: 'Invest-Ready Viability Score', included: true, phase: 'Core' },
  { name: 'Competitor & Market Analysis', included: true, phase: 'Opportunity' },
  { name: 'Earn credits by inviting founders', included: true, phase: 'Core' },
  // Opportunity & Definition
  { name: 'Identify Clinical or User Need', included: true, phase: 'Opportunity & Definition' },
  { name: 'Competitor Analysis', included: true, phase: 'Opportunity & Definition' },
  { name: 'Market Sizing', included: true, phase: 'Opportunity & Definition' },
  { name: 'Define Core Solution Concept', included: true, phase: 'Opportunity & Definition' },
  { name: 'Profile User', included: true, phase: 'Opportunity & Definition' },
  { name: 'Profile Economic Buyer', included: true, phase: 'Opportunity & Definition' },
  { name: 'Intended Use and Value Proposition', included: true, phase: 'Opportunity & Definition' },
  { name: 'Strategic Partners', included: true, phase: 'Feasibility & Planning' },
  // Feasibility & Planning
  { name: 'Regulatory & Compliance Assessment', included: true, phase: 'Feasibility & Planning' },
  { name: 'Reimbursement & Market Access', included: true, phase: 'Feasibility & Planning' },
  { name: 'Technical Feasibility & Risk Assessment', included: true, phase: 'Feasibility & Planning' },
  { name: 'Clinical Evidence Strategy', included: true, phase: 'Feasibility & Planning' },
  { name: 'High-Level Project & Resource Plan', included: true, phase: 'Feasibility & Planning' },
  // Market Readiness
  { name: 'Go-to-Market Strategy', included: true, phase: 'Market Readiness' },
  { name: 'Manufacturing & Supply Chain', included: true, phase: 'Market Readiness' },
  // Tools
  { name: 'Viability Score Dashboard', included: true, phase: 'Tools' },
  { name: 'Pitch Builder', included: true, phase: 'Tools' },
];

/**
 * Check if a menu access key is enabled for Genesis plan
 */
export function isGenesisFeatureEnabled(menuAccessKey: string): boolean {
  const value = GENESIS_MENU_ACCESS[menuAccessKey];
  if (typeof value === 'boolean') {
    return value;
  }
  // If key not found, default to false (restrictive)
  return false;
}

/**
 * Get feature limit for Genesis plan
 */
export function getGenesisFeatureLimit(limitKey: string): number | null {
  const limits = GENESIS_MENU_ACCESS['_feature_limits'] as Record<string, number> | undefined;
  if (!limits) return null;
  return limits[limitKey] ?? null;
}

/**
 * SQL to update the Genesis plan in the database
 * Run this in Supabase SQL editor to update the plan
 */
export const GENESIS_PLAN_SQL = `
-- Update Genesis plan menu_access in new_pricing_plans table
UPDATE new_pricing_plans
SET menu_access = '${JSON.stringify(GENESIS_MENU_ACCESS)}'::jsonb,
    features = '${JSON.stringify(GENESIS_FEATURES)}'::jsonb,
    restrictions = '${JSON.stringify(GENESIS_RESTRICTIONS)}'::jsonb,
    updated_at = NOW()
WHERE name = 'genesis';
`;
