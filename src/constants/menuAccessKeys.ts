/**
 * Menu Access Keys Mapping
 *
 * Maps SidebarConfig menu item IDs to the menu_access keys stored in subscription_plans table.
 * The menu_access field in subscription_plans uses a hierarchical structure like:
 * - missionControl.mission-control
 * - missionControl.client-compass
 * - portfolio.dashboard
 * - portfolio.commercial
 * - devices.dashboard
 * etc.
 */

// Mission Control menu access keys
export const MISSION_CONTROL_MENU_ACCESS = {
  MISSION_CONTROL: 'missionControl.mission-control',
  CLIENT_COMPASS: 'missionControl.client-compass',
} as const;

// Portfolio (Company Dashboard) menu access keys
export const PORTFOLIO_MENU_ACCESS = {
  DASHBOARD: 'portfolio.dashboard',
  COMMERCIAL: 'portfolio.commercial',
  COMMERCIAL_STRATEGIC_BLUEPRINT: 'portfolio.commercial.strategic-blueprint',
  COMMERCIAL_BUSINESS_CANVAS: 'portfolio.commercial.business-canvas',
  COMMERCIAL_FEASIBILITY_STUDIES: 'portfolio.commercial.feasibility-studies',
  COMMERCIAL_MARKET_ANALYSIS: 'portfolio.commercial.market-analysis',
  COMMERCIAL_COMMERCIAL_PERFORMANCE: 'portfolio.commercial.commercial-performance',
  COMMERCIAL_VARIANCE_ANALYSIS: 'portfolio.commercial.variance-analysis',
  COMMERCIAL_PRICING_STRATEGY: 'portfolio.commercial.pricing-strategy',
  COMMERCIAL_INVESTORS: 'portfolio.commercial.investors',
  COMMERCIAL_IP_PORTFOLIO: 'portfolio.commercial.ip-portfolio',
  COMMERCIAL_FUNDING_GRANTS: 'portfolio.commercial.funding-grants',
  DEVICE_PORTFOLIO: 'portfolio.device-portfolio',
  DEVICE_PORTFOLIO_SUNBURST: 'portfolio.device-portfolio.sunburst',
  DEVICE_PORTFOLIO_PHASES_CHART: 'portfolio.device-portfolio.phases-chart',
  DEVICE_PORTFOLIO_CARDS: 'portfolio.device-portfolio.cards',
  DEVICE_PORTFOLIO_PHASES: 'portfolio.device-portfolio.phases',
  DEVICE_PORTFOLIO_TIMELINE: 'portfolio.device-portfolio.timeline',
  DEVICE_PORTFOLIO_LIST: 'portfolio.device-portfolio.list',
  DEVICE_PORTFOLIO_RELATIONSHIPS: 'portfolio.device-portfolio.relationships',
  DEVICE_PORTFOLIO_HIERARCHY: 'portfolio.device-portfolio.hierarchy-graph',
  DEVICE_PORTFOLIO_BUNDLES: 'portfolio.device-portfolio.bundles',
  DEVICE_PORTFOLIO_GENESIS: 'portfolio.device-portfolio.genesis',
  MILESTONES: 'portfolio.milestones',
  COMPLIANCE_INSTANCES: 'portfolio.compliance-instances',
  COMPLIANCE_DOCUMENTS: 'portfolio.compliance-instances.documents',
  COMPLIANCE_GAP_ANALYSIS: 'portfolio.compliance-instances.gap-analysis',
  COMPLIANCE_ACTIVITIES: 'portfolio.compliance-instances.activities',
  COMPLIANCE_AUDITS: 'portfolio.compliance-instances.audits',
  OPERATIONS: 'portfolio.operations',
  CAPA: 'portfolio.capa',
  OPERATIONS_BUDGET: 'portfolio.operations.budget-dashboard',
  OPERATIONS_SUPPLIERS: 'portfolio.operations.suppliers',
  PMS: 'portfolio.pms',
  TRAINING: 'portfolio.training',
  COMMUNICATIONS: 'portfolio.communications',
  CHANGE_CONTROL: 'portfolio.change-control',
  NONCONFORMITY: 'portfolio.nonconformity',
  AUDIT_LOG: 'portfolio.audit-log',
  EHDS_DATA_VAULT: 'portfolio.ehds-data-vault',
} as const;

// Devices menu access keys
export const DEVICES_MENU_ACCESS = {
  DASHBOARD: 'devices.device-dashboard',
  BUSINESS_CASE: 'devices.business-case',
  BUSINESS_CASE_VIABILITY: 'devices.business-case.viability-scorecard',
  BUSINESS_CASE_VENTURE: 'devices.business-case.venture-blueprint',
  BUSINESS_CASE_CANVAS: 'devices.business-case.business-canvas',
  BUSINESS_CASE_TEAM: 'devices.business-case.team-profile',
  BUSINESS_CASE_MARKET_SIZING: 'devices.business-case.market-sizing',
  BUSINESS_CASE_COMPETITION: 'devices.business-case.competition',
  BUSINESS_CASE_RNPV: 'devices.business-case.rnpv',
  BUSINESS_CASE_REIMBURSEMENT: 'devices.business-case.reimbursement',
  BUSINESS_CASE_PRICING: 'devices.business-case.pricing-strategy',
  DEVICE_DEFINITION: 'devices.device-definition',
  DEVICE_DEFINITION_OVERVIEW: 'devices.device-definition.overview',
  DEVICE_DEFINITION_PURPOSE: 'devices.device-definition.intended-purpose',
  DEVICE_DEFINITION_GENERAL: 'devices.device-definition.general',
  DEVICE_DEFINITION_IDENTIFICATION: 'devices.device-definition.identification',
  DEVICE_DEFINITION_REGULATORY: 'devices.device-definition.regulatory',
  DEVICE_DEFINITION_MARKETS: 'devices.device-definition.target-markets',
  DEVICE_DEFINITION_BUNDLES: 'devices.device-definition.bundles',
  DEVICE_DEFINITION_VARIANTS: 'devices.device-definition.variants',
  DEVICE_DEFINITION_AUDIT_LOG: 'devices.device-definition.audit-log',
  DESIGN_RISK: 'devices.design-risk-controls',
  DESIGN_RISK_REQUIREMENTS: 'devices.design-risk-controls.requirements',
  DESIGN_RISK_REQUIREMENTS_USER_NEEDS: 'devices.design-risk-controls.requirements.user-needs',
  DESIGN_RISK_REQUIREMENTS_SYSTEM: 'devices.design-risk-controls.requirements.system-requirements',
  DESIGN_RISK_REQUIREMENTS_SOFTWARE: 'devices.design-risk-controls.requirements.software-requirements',
  DESIGN_RISK_REQUIREMENTS_HARDWARE: 'devices.design-risk-controls.requirements.hardware-requirements',
  DESIGN_RISK_ARCHITECTURE: 'devices.design-risk-controls.architecture',
  DESIGN_RISK_MANAGEMENT: 'devices.design-risk-controls.risk-management',
  DESIGN_RISK_VV: 'devices.design-risk-controls.verification-validation',
  DESIGN_RISK_VV_PLAN: 'devices.design-risk-controls.verification-validation.vv-plan',
  DESIGN_RISK_VV_TEST_CASES: 'devices.design-risk-controls.verification-validation.test-cases',
  DESIGN_RISK_VV_TEST_EXECUTION: 'devices.design-risk-controls.verification-validation.test-execution',
  DESIGN_RISK_VV_DEFECTS: 'devices.design-risk-controls.verification-validation.defects',
  DESIGN_RISK_VV_REPORTS: 'devices.design-risk-controls.verification-validation.reports',
  DESIGN_RISK_VV_AI_ASSURANCE: 'devices.design-risk-controls.verification-validation.ai-assurance',
  DESIGN_RISK_TRACEABILITY: 'devices.design-risk-controls.traceability',
  DESIGN_RISK_TRACEABILITY_MATRIX: 'devices.design-risk-controls.traceability.matrix',
  DESIGN_RISK_TRACEABILITY_GAPS: 'devices.design-risk-controls.traceability.gaps',
  DESIGN_RISK_TRACEABILITY_IMPACT: 'devices.design-risk-controls.traceability.impact',
  DESIGN_RISK_TRACEABILITY_SETTINGS: 'devices.design-risk-controls.traceability.settings',
  DESIGN_RISK_UEF: 'devices.design-risk-controls.usability-engineering',
  CLINICAL_TRIALS: 'devices.clinical-trials',
  MILESTONES: 'devices.milestones',
  COMPLIANCE_INSTANCES: 'devices.compliance-instances',
  COMPLIANCE_DOCUMENTS: 'devices.compliance-instances.documents',
  COMPLIANCE_GAP_ANALYSIS: 'devices.compliance-instances.gap-analysis',
  COMPLIANCE_ACTIVITIES: 'devices.compliance-instances.activities',
  COMPLIANCE_AUDITS: 'devices.compliance-instances.audits',
  PMS: 'devices.pms',
  CAPA: 'devices.capa',
  CHANGE_CONTROL: 'devices.change-control',
  NONCONFORMITY: 'devices.nonconformity',
  USER_ACCESS: 'devices.user-access',
} as const;

// Document Studio menu access keys
export const DRAFT_STUDIO_MENU_ACCESS = {
  DOCUMENT_STUDIO: 'draftStudio.document-studio',
} as const;

/**
 * Mapping from SidebarConfig menu item IDs to menu_access keys
 * Used by L2ContextualBar to check if a menu item should be enabled/disabled
 */
export const SIDEBAR_TO_MENU_ACCESS_MAP: Record<string, string> = {
  // Mission Control mappings
  'mission-control-main': MISSION_CONTROL_MENU_ACCESS.MISSION_CONTROL,
  'clients': MISSION_CONTROL_MENU_ACCESS.CLIENT_COMPASS,

  // Portfolio (Company Dashboard) mappings
  'company-dashboard': PORTFOLIO_MENU_ACCESS.DASHBOARD,
  'commercial': PORTFOLIO_MENU_ACCESS.COMMERCIAL,
  'company-strategic-blueprint': PORTFOLIO_MENU_ACCESS.COMMERCIAL_STRATEGIC_BLUEPRINT,
  'company-business-canvas': PORTFOLIO_MENU_ACCESS.COMMERCIAL_BUSINESS_CANVAS,
  'company-feasibility': PORTFOLIO_MENU_ACCESS.COMMERCIAL_FEASIBILITY_STUDIES,
  'company-market-analysis': PORTFOLIO_MENU_ACCESS.COMMERCIAL_MARKET_ANALYSIS,
  'company-commercial-performance': PORTFOLIO_MENU_ACCESS.COMMERCIAL_COMMERCIAL_PERFORMANCE,
  'company-variance-analysis': PORTFOLIO_MENU_ACCESS.COMMERCIAL_VARIANCE_ANALYSIS,
  'company-pricing-strategy': PORTFOLIO_MENU_ACCESS.COMMERCIAL_PRICING_STRATEGY,
  'company-investors': PORTFOLIO_MENU_ACCESS.COMMERCIAL_INVESTORS,
  'commercial-variance-analysis': PORTFOLIO_MENU_ACCESS.COMMERCIAL_VARIANCE_ANALYSIS,
  'commercial-investors': PORTFOLIO_MENU_ACCESS.COMMERCIAL_INVESTORS,
  'commercial-funding-grants': PORTFOLIO_MENU_ACCESS.COMMERCIAL_FUNDING_GRANTS,
  'ip-portfolio': PORTFOLIO_MENU_ACCESS.COMMERCIAL_IP_PORTFOLIO,
  'company-products': PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO,
  'company-milestones': PORTFOLIO_MENU_ACCESS.MILESTONES,
  'compliance-instances': PORTFOLIO_MENU_ACCESS.COMPLIANCE_INSTANCES,
  'company-documents': PORTFOLIO_MENU_ACCESS.COMPLIANCE_DOCUMENTS,
  'company-gap-analysis': PORTFOLIO_MENU_ACCESS.COMPLIANCE_GAP_ANALYSIS,
  'company-activities': PORTFOLIO_MENU_ACCESS.COMPLIANCE_ACTIVITIES,
  'company-audits': PORTFOLIO_MENU_ACCESS.COMPLIANCE_AUDITS,
  'operations': PORTFOLIO_MENU_ACCESS.OPERATIONS,
  'company-budget': PORTFOLIO_MENU_ACCESS.OPERATIONS_BUDGET,
  'company-suppliers': PORTFOLIO_MENU_ACCESS.OPERATIONS_SUPPLIERS,
  'company-capa': PORTFOLIO_MENU_ACCESS.CAPA,
  'company-change-control': PORTFOLIO_MENU_ACCESS.CHANGE_CONTROL,
  'company-nonconformity': PORTFOLIO_MENU_ACCESS.NONCONFORMITY,
  'company-pms': PORTFOLIO_MENU_ACCESS.PMS,
  'company-training': PORTFOLIO_MENU_ACCESS.TRAINING,
  'communications': PORTFOLIO_MENU_ACCESS.COMMUNICATIONS,
  'audit-log': PORTFOLIO_MENU_ACCESS.AUDIT_LOG,

  // Devices mappings
  'dashboard': DEVICES_MENU_ACCESS.DASHBOARD,
  'strategic-growth': DEVICES_MENU_ACCESS.BUSINESS_CASE,
  'xyreg-genesis': DEVICES_MENU_ACCESS.BUSINESS_CASE,
  'venture-blueprint': DEVICES_MENU_ACCESS.BUSINESS_CASE_VENTURE,
  'business-canvas': DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
  'team-profile': DEVICES_MENU_ACCESS.BUSINESS_CASE_TEAM,
  'market-analysis': DEVICES_MENU_ACCESS.BUSINESS_CASE_COMPETITION,
  'gtm-strategy': DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
  'use-of-proceeds': DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
  'market-sizing': DEVICES_MENU_ACCESS.BUSINESS_CASE_MARKET_SIZING,
  'competition': DEVICES_MENU_ACCESS.BUSINESS_CASE_COMPETITION,
  'rnpv': DEVICES_MENU_ACCESS.BUSINESS_CASE_RNPV,
  'reimbursement': DEVICES_MENU_ACCESS.BUSINESS_CASE_REIMBURSEMENT,
  'pricing': DEVICES_MENU_ACCESS.BUSINESS_CASE_PRICING,
  'exit-strategy': DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
  'ip-strategy': DEVICES_MENU_ACCESS.BUSINESS_CASE_CANVAS,
  'device-definition': DEVICES_MENU_ACCESS.DEVICE_DEFINITION,
  'overview': DEVICES_MENU_ACCESS.DEVICE_DEFINITION_OVERVIEW,
  'purpose': DEVICES_MENU_ACCESS.DEVICE_DEFINITION_PURPOSE,
  'general': DEVICES_MENU_ACCESS.DEVICE_DEFINITION_GENERAL,
  'identification': DEVICES_MENU_ACCESS.DEVICE_DEFINITION_IDENTIFICATION,
  'regulatory': DEVICES_MENU_ACCESS.DEVICE_DEFINITION_REGULATORY,
  'markets-tab': DEVICES_MENU_ACCESS.DEVICE_DEFINITION_MARKETS,
  'bundles': DEVICES_MENU_ACCESS.DEVICE_DEFINITION_BUNDLES,
  'auditlogs': DEVICES_MENU_ACCESS.DEVICE_DEFINITION_AUDIT_LOG,
  'design-risk-controls': DEVICES_MENU_ACCESS.DESIGN_RISK,
  'requirements': DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS,
  'architecture': DEVICES_MENU_ACCESS.DESIGN_RISK_ARCHITECTURE,
  'risk-mgmt': DEVICES_MENU_ACCESS.DESIGN_RISK_MANAGEMENT,
  'vv': DEVICES_MENU_ACCESS.DESIGN_RISK_VV,
  'traceability': DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY,
  'clinical-trials': DEVICES_MENU_ACCESS.CLINICAL_TRIALS,
  'milestones': DEVICES_MENU_ACCESS.MILESTONES,
  'documents': DEVICES_MENU_ACCESS.COMPLIANCE_DOCUMENTS,
  'gap-analysis': DEVICES_MENU_ACCESS.COMPLIANCE_GAP_ANALYSIS,
  'activities': DEVICES_MENU_ACCESS.COMPLIANCE_ACTIVITIES,
  'audits': DEVICES_MENU_ACCESS.COMPLIANCE_AUDITS,
  'pms': DEVICES_MENU_ACCESS.PMS,
  'product-capa': DEVICES_MENU_ACCESS.CAPA,
  'product-change-control': DEVICES_MENU_ACCESS.CHANGE_CONTROL,
  'product-nonconformity': DEVICES_MENU_ACCESS.NONCONFORMITY,
  'user-access': DEVICES_MENU_ACCESS.USER_ACCESS,

  // Document Studio mappings
  'document-studio': DRAFT_STUDIO_MENU_ACCESS.DOCUMENT_STUDIO,
};

/**
 * Get the menu_access key for a sidebar menu item ID
 * @param menuItemId - The ID from SidebarConfig
 * @param moduleId - The current module (portfolio, products, draft-studio)
 * @returns The menu_access key or null if not mapped
 */
export function getMenuAccessKey(menuItemId: string, moduleId?: string): string | null {
  // Direct mapping lookup
  const directMapping = SIDEBAR_TO_MENU_ACCESS_MAP[menuItemId];
  if (directMapping) {
    return directMapping;
  }

  // If no direct mapping, try with module prefix
  if (moduleId) {
    const prefixedKey = `${moduleId}.${menuItemId}`;
    return SIDEBAR_TO_MENU_ACCESS_MAP[prefixedKey] || null;
  }

  return null;
}

/**
 * Check if a menu item is enabled based on menu_access settings
 * @param menuAccess - The menu_access object from subscription_plans
 * @param menuAccessKey - The menu_access key to check
 * @returns true if enabled, false if disabled
 */
export function isMenuItemEnabled(
  menuAccess: Record<string, boolean | string> | null | undefined,
  menuAccessKey: string
): boolean {
  // If no menu_access configured, all items are enabled by default
  if (!menuAccess) {
    return true;
  }

  // Check if the key exists and is explicitly set
  if (menuAccessKey in menuAccess) {
    const value = menuAccess[menuAccessKey];
    // Support boolean true or string values ('manual', 'auto-data') as enabled
    return value === true || (typeof value === 'string' && ['manual', 'auto-data', 'full'].includes(value));
  }

  // Check for access mode sub-keys (e.g., devices.business-case.market-analysis.manual, .auto-data)
  // If the base key doesn't exist, check if any sub-keys with access modes are enabled
  const manualKey = `${menuAccessKey}.manual`;
  const autoDataKey = `${menuAccessKey}.auto-data`;

  if (manualKey in menuAccess || autoDataKey in menuAccess) {
    // Access mode keys exist - check if at least one is enabled
    const manualValue = menuAccess[manualKey];
    const autoDataValue = menuAccess[autoDataKey];

    const isManualEnabled = manualValue === true || (typeof manualValue === 'string' && ['manual', 'auto-data', 'full'].includes(manualValue));
    const isAutoDataEnabled = autoDataValue === true || (typeof autoDataValue === 'string' && ['manual', 'auto-data', 'full'].includes(autoDataValue));

    return isManualEnabled || isAutoDataEnabled;
  }

  // If key not found, check parent key (e.g., for portfolio.commercial.strategic-blueprint, check portfolio.commercial)
  const parts = menuAccessKey.split('.');
  if (parts.length > 2) {
    const parentKey = parts.slice(0, 2).join('.');
    if (parentKey in menuAccess) {
      const parentValue = menuAccess[parentKey];
      return parentValue === true || (typeof parentValue === 'string' && ['manual', 'auto-data', 'full'].includes(parentValue));
    }
  }

  // Default to enabled if not explicitly set
  return true;
}

/**
 * Mapping from L1 Module IDs to menu_access keys
 * Used by L1PrimaryModuleBar to check if a module should show a lock icon
 */
export const L1_MODULE_TO_MENU_ACCESS_MAP: Record<string, string> = {
  'mission-control': MISSION_CONTROL_MENU_ACCESS.MISSION_CONTROL,
  'portfolio': PORTFOLIO_MENU_ACCESS.DASHBOARD, // Portfolio module checks dashboard access
  'products': DEVICES_MENU_ACCESS.DASHBOARD, // Products module checks device dashboard access
  'draft-studio': DRAFT_STUDIO_MENU_ACCESS.DOCUMENT_STUDIO,
  'genesis': 'devices.business-case', // Genesis module checks business case access
  'review': 'review.panel', // Review module - always enabled by default
  'investor': 'investor.dashboard', // Investor module - always enabled for investors
  'home': 'home.dashboard', // Home module - always enabled
};
