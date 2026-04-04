export interface ToolboxItem {
  id: string;
  table: 'A1' | 'A2' | 'A3' | 'A4' | 'A5';
  tableName: string;
  activity: string;
  tool: string;
  applicableRiskLevels: ('low' | 'medium' | 'high')[];
  rationale: string;
}

/**
 * TR80002-2 Tables A.1–A.5: Toolbox selections with risk-based rationale.
 * These map validation activities to the tools/methods selected for XYREG.
 */
export const TR80002_TOOLBOX_ITEMS: ToolboxItem[] = [
  // Table A.1: Define (Requirements & Risk Analysis)
  {
    id: 'a1-01', table: 'A1', tableName: 'Define',
    activity: 'Process Requirements Definition',
    tool: 'Module Group Decomposition Matrix',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'All module groups require documented intended use and boundary definitions regardless of risk level.',
  },
  {
    id: 'a1-02', table: 'A1', tableName: 'Define',
    activity: 'Intended Use Specification',
    tool: 'Per-module intended use statements with ISO clause references',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'TR80002-2 §5.3.2.5.2c requires intended use per functional group.',
  },
  {
    id: 'a1-03', table: 'A1', tableName: 'Define',
    activity: 'Risk Analysis (Process)',
    tool: 'Process risk assessment matrix (harm, regulatory, environmental)',
    applicableRiskLevels: ['medium', 'high'],
    rationale: 'Medium and high risk groups require formal process risk analysis per Annex B.',
  },
  {
    id: 'a1-04', table: 'A1', tableName: 'Define',
    activity: 'Risk Analysis (Software)',
    tool: 'Software failure mode analysis per module group',
    applicableRiskLevels: ['high'],
    rationale: 'High risk groups require software-specific failure mode analysis per §5.3.3.2.',
  },

  // Table A.2: Implement (Design & Configuration)
  {
    id: 'a2-01', table: 'A2', tableName: 'Implement',
    activity: 'Configuration Management',
    tool: 'Git version control with tagged releases',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'All changes tracked via version control; releases tagged for traceability.',
  },
  {
    id: 'a2-02', table: 'A2', tableName: 'Implement',
    activity: 'Coding Standards Compliance',
    tool: 'TypeScript strict mode + ESLint + automated CI checks',
    applicableRiskLevels: ['medium', 'high'],
    rationale: 'Automated code quality enforcement reduces defect introduction risk.',
  },
  {
    id: 'a2-03', table: 'A2', tableName: 'Implement',
    activity: 'Security Design Review',
    tool: 'RLS policy audit + penetration testing',
    applicableRiskLevels: ['high'],
    rationale: 'High risk modules handling regulated data require security-specific design review.',
  },

  // Table A.3: Test (IQ, OQ, PQ)
  {
    id: 'a3-01', table: 'A3', tableName: 'Test',
    activity: 'Installation Qualification (IQ)',
    tool: 'Automated deployment verification + environment configuration check',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'All modules require verified deployment to production environment.',
  },
  {
    id: 'a3-02', table: 'A3', tableName: 'Test',
    activity: 'Operational Qualification (OQ)',
    tool: 'Vendor pre-executed functional test suites per module group',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'Vendor provides OQ evidence; customer reviews applicability to their use case.',
  },
  {
    id: 'a3-03', table: 'A3', tableName: 'Test',
    activity: 'Performance Qualification (PQ)',
    tool: 'Customer-executed site-specific test scenarios with rationale documentation',
    applicableRiskLevels: ['medium', 'high'],
    rationale: 'Medium and high risk modules require site-specific performance verification.',
  },
  {
    id: 'a3-04', table: 'A3', tableName: 'Test',
    activity: 'Regression Testing',
    tool: 'Automated regression suite + core dependency cascade analysis',
    applicableRiskLevels: ['high'],
    rationale: 'High risk modules require automated regression after any core service change.',
  },

  // Table A.4: Deploy (Release & Training)
  {
    id: 'a4-01', table: 'A4', tableName: 'Deploy',
    activity: 'Release Management',
    tool: 'Versioned release with change impact matrix and affected module mapping',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'All releases include structured impact analysis showing affected modules and core services.',
  },
  {
    id: 'a4-02', table: 'A4', tableName: 'Deploy',
    activity: 'User Training',
    tool: 'Release notes + in-app contextual help + training module assignments',
    applicableRiskLevels: ['medium', 'high'],
    rationale: 'Users of medium/high risk modules require documented training on changes.',
  },
  {
    id: 'a4-03', table: 'A4', tableName: 'Deploy',
    activity: 'Data Migration Verification',
    tool: 'Pre/post migration data integrity checks',
    applicableRiskLevels: ['high'],
    rationale: 'High risk modules with schema changes require verified data migration.',
  },

  // Table A.5: Maintain (Change Control & Periodic Review)
  {
    id: 'a5-01', table: 'A5', tableName: 'Maintain',
    activity: 'Change Control',
    tool: 'Structured change impact assessment with core dependency cascade',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'All changes assessed for impact on dependent module groups via dependency matrix.',
  },
  {
    id: 'a5-02', table: 'A5', tableName: 'Maintain',
    activity: 'Periodic Review',
    tool: 'Annual validation status review per module group',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'TR80002-2 §5.4 requires periodic review of validation status.',
  },
  {
    id: 'a5-03', table: 'A5', tableName: 'Maintain',
    activity: 'Continuous Monitoring',
    tool: 'Error logging, uptime monitoring, security scanning',
    applicableRiskLevels: ['medium', 'high'],
    rationale: 'Medium and high risk modules require ongoing operational monitoring.',
  },
  {
    id: 'a5-04', table: 'A5', tableName: 'Maintain',
    activity: 'Retirement Planning',
    tool: 'Data export, migration path documentation, user notification',
    applicableRiskLevels: ['low', 'medium', 'high'],
    rationale: 'TR80002-2 §5.5 requires documented retirement considerations for all modules.',
  },
];
