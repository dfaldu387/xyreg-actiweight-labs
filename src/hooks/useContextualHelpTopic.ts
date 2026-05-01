import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  BarChart3, 
  FileText, 
  Users, 
  Flag, 
  Target, 
  Lightbulb,
  DollarSign,
  Stethoscope,
  Barcode,
  Calendar,
  Package,
  Shield,
  ClipboardList,
  Settings,
  AlertTriangle,
  Building2,
  Cpu,
  Layers,
  Clock,
  type LucideIcon
} from 'lucide-react';
import { HELIX_NODE_CONFIGS } from '@/config/helixNodeConfig';

export interface HelpTopic {
  key: string;
  title: string;
  icon: LucideIcon;
  section?: string;
}

interface RouteHelpMapping {
  pattern: RegExp;
  topic: HelpTopic;
  tabMappings?: Record<string, HelpTopic>;
}

const helpTopics: Record<string, HelpTopic> = {
  // Business Case topics
  'genesis-overview': {
    key: 'genesis-overview',
    title: 'How Genesis Works (XyReg Module)',
    icon: Lightbulb,
  },
  'viability-scorecard': {
    key: 'viability-scorecard',
    title: 'Viability Scorecard (XyReg Module)',
    icon: BarChart3,
  },
  'venture-blueprint': {
    key: 'venture-blueprint',
    title: 'Venture Blueprint (XyReg Module)',
    icon: Lightbulb,
  },
  'business-canvas': {
    key: 'business-canvas',
    title: 'Business Canvas (XyReg Module)',
    icon: Target,
  },
  'team-profile': {
    key: 'team-profile',
    title: 'Team Profile (XyReg Module)',
    icon: Users,
  },
  'market-sizing': {
    key: 'market-sizing',
    title: 'Market Sizing (XyReg Module)',
    icon: BarChart3,
  },
  'competition': {
    key: 'competition',
    title: 'Competitive Analysis (XyReg Module)',
    icon: Target,
  },
  'reimbursement': {
    key: 'reimbursement',
    title: 'Reimbursement Strategy (XyReg Module)',
    icon: DollarSign,
  },
  'verification-validation': {
    key: 'verification-validation',
    title: 'Verification & Validation',
    icon: ClipboardList,
  },
  'qmsr-rationale': {
    key: 'qmsr-rationale',
    title: 'QMSR Process Validation Rationale',
    icon: ClipboardList,
  },
  'clinical-trials': {
    key: 'clinical-trials',
    title: 'Clinical Evidence (XyReg Module)',
    icon: Stethoscope,
  },
  'readiness-gates': {
    key: 'readiness-gates',
    title: 'Readiness Gates (XyReg Module)',
    icon: Flag,
  },
  'target-markets': {
    key: 'target-markets',
    title: 'Target Markets (XyReg Module)',
    icon: Target,
  },
  'economic-buyer': {
    key: 'economic-buyer',
    title: 'Economic Buyer Profile (XyReg Module)',
    icon: Users,
  },
  'value-proposition': {
    key: 'value-proposition',
    title: 'Value Proposition (XyReg Module)',
    icon: Target,
  },
  'user-profile': {
    key: 'user-profile',
    title: 'User Profile (XyReg Module)',
    icon: Users,
  },
  'ip-strategy': {
    key: 'ip-strategy',
    title: 'IP Strategy (XyReg Module)',
    icon: Shield,
  },
  'use-of-proceeds': {
    key: 'use-of-proceeds',
    title: 'Use of Proceeds (XyReg Module)',
    icon: DollarSign,
  },
  'gtm-strategy': {
    key: 'gtm-strategy',
    title: 'Go-to-Market Strategy (XyReg Module)',
    icon: Target,
  },
  'manufacturing': {
    key: 'manufacturing',
    title: 'Manufacturing & Supply Chain (XyReg Module)',
    icon: Package,
  },
  'exit-strategy': {
    key: 'exit-strategy',
    title: 'Exit Strategy (XyReg Module)',
    icon: Target,
  },
  
  // Product/Device topics
  'device-definition': {
    key: 'device-definition',
    title: 'Device Definition',
    icon: Package,
  },
  'device-overview': {
    key: 'device-overview',
    title: 'Device Overview',
    icon: Package,
  },
  'device-purpose': {
    key: 'device-purpose',
    title: 'Purpose & Intended Use',
    icon: Target,
  },
  'device-general': {
    key: 'device-general',
    title: 'General Information',
    icon: Package,
  },
  'device-general-deviceid': {
    key: 'device-general-deviceid',
    title: 'Device ID',
    icon: Barcode,
  },
  'device-general-classification': {
    key: 'device-general-classification',
    title: 'Classification',
    icon: Shield,
  },
  'device-general-techspecs': {
    key: 'device-general-techspecs',
    title: 'Technical Specs',
    icon: ClipboardList,
  },
  'device-general-definition': {
    key: 'device-general-definition',
    title: 'Device Definition',
    icon: Package,
  },
  'device-general-media': {
    key: 'device-general-media',
    title: 'Media Gallery',
    icon: FileText,
  },
  'device-general-storage': {
    key: 'device-general-storage',
    title: 'File Storage',
    icon: FileText,
  },
  'device-general-variants': {
    key: 'device-general-variants',
    title: 'Device Variants',
    icon: Package,
  },
  'device-markets': {
    key: 'device-markets',
    title: 'Target Markets',
    icon: Target,
  },
  'device-bundles': {
    key: 'device-bundles',
    title: 'Device Bundles',
    icon: Package,
  },
  'device-auditlog': {
    key: 'device-auditlog',
    title: 'Audit Log',
    icon: ClipboardList,
  },
  'udi-management': {
    key: 'udi-management',
    title: 'UDI Management (XyReg Module)',
    icon: Barcode,
  },
  'eudamed': {
    key: 'eudamed',
    title: 'EUDAMED Registration (XyReg Module)',
    icon: Shield,
  },
  'milestones': {
    key: 'milestones',
    title: 'Milestones & Timeline (XyReg Module)',
    icon: Calendar,
  },
  'documents': {
    key: 'documents',
    title: 'Document Management (XyReg Module)',
    icon: FileText,
  },
  'regulatory': {
    key: 'regulatory',
    title: 'Regulatory Compliance (XyReg Module)',
    icon: Shield,
  },
  'qms': {
    key: 'qms',
    title: 'Quality Management (XyReg Module)',
    icon: ClipboardList,
  },
  'risk-management': {
    key: 'risk-management',
    title: 'Risk Management (XyReg Module)',
    icon: AlertTriangle,
  },
  'requirements-specifications': {
    key: 'requirements-specifications',
    title: 'Requirements Management (XyReg Module)',
    icon: ClipboardList,
  },
  'usability-engineering': {
    key: 'usability-engineering',
    title: 'Usability Engineering (XyReg Module)',
    icon: Users,
  },
  'system-architecture': {
    key: 'system-architecture',
    title: 'System Architecture (XyReg Module)',
    icon: Package,
  },
  'design-review': {
    key: 'design-review',
    title: 'Design Review (XyReg Module)',
    icon: ClipboardList,
  },
  'design-review-detail': {
    key: 'design-review-detail',
    title: 'Design Review Session',
    icon: ClipboardList,
  },
  'ai-assurance-lab': {
    key: 'ai-assurance-lab',
    title: 'AI Assurance Lab',
    icon: Shield,
  },
  
  // Company-level topics
  'company-dashboard': {
    key: 'company-dashboard',
    title: 'Company Dashboard',
    icon: Target,
    section: 'Company',
  },
  'company-milestones': {
    key: 'company-milestones',
    title: 'Company Milestones (XyReg Module)',
    icon: Calendar,
    section: 'Company',
  },
  'company-documents': {
    key: 'company-documents',
    title: 'Company Documents (XyReg Module)',
    icon: FileText,
    section: 'Company',
  },
  'company-audits': {
    key: 'company-audits',
    title: 'Audits & Compliance (XyReg Module)',
    icon: ClipboardList,
    section: 'Company',
  },
  'company-training': {
    key: 'company-training',
    title: 'Training Management (XyReg Module)',
    icon: Users,
    section: 'Company',
  },
  'company-suppliers': {
    key: 'company-suppliers',
    title: 'Supplier Management (XyReg Module)',
    icon: Package,
    section: 'Company',
  },
  'company-pms': {
    key: 'company-pms',
    title: 'Post-Market Surveillance (XyReg Module)',
    icon: Shield,
    section: 'Company',
  },
  'company-settings': {
    key: 'company-settings',
    title: 'Company Settings',
    icon: Settings,
    section: 'Company',
  },
  'company-portfolio': {
    key: 'company-portfolio',
    title: 'Portfolio Management (XyReg Module)',
    icon: Package,
    section: 'Company',
  },

  // Enterprise Quality Governance topics
  'company-nc-trends': {
    key: 'company-nc-trends',
    title: 'NC Trends (Enterprise)',
    icon: AlertTriangle,
    section: 'Company',
  },
  'company-capa-trends': {
    key: 'company-capa-trends',
    title: 'CAPA Trends (Enterprise)',
    icon: AlertTriangle,
    section: 'Company',
  },
  'company-change-control': {
    key: 'company-change-control',
    title: 'Global Change Control',
    icon: ClipboardList,
    section: 'Company',
  },
  'ccr-detail': {
    key: 'ccr-detail',
    title: 'Change Control Request (CCR)',
    icon: ClipboardList,
    section: 'Company',
  },
  'ccr-detail-details': {
    key: 'ccr-detail-details',
    title: 'CCR — Details & Approvals',
    icon: ClipboardList,
    section: 'Company',
  },
  'ccr-detail-impact': {
    key: 'ccr-detail-impact',
    title: 'CCR — Impact Assessment',
    icon: AlertTriangle,
    section: 'Company',
  },
  'ccr-detail-implementation': {
    key: 'ccr-detail-implementation',
    title: 'CCR — Implementation',
    icon: Settings,
    section: 'Company',
  },
  'ccr-detail-history': {
    key: 'ccr-detail-history',
    title: 'CCR — State History',
    icon: Clock,
    section: 'Company',
  },
  'company-design-review': {
    key: 'company-design-review',
    title: 'Design Review (Enterprise)',
    icon: ClipboardList,
    section: 'Company',
  },
  'company-management-review': {
    key: 'company-management-review',
    title: 'Management Review',
    icon: ClipboardList,
    section: 'Company',
  },
  'company-infrastructure': {
    key: 'company-infrastructure',
    title: 'Infrastructure Management',
    icon: Building2,
    section: 'Company',
  },
  'company-calibration': {
    key: 'company-calibration',
    title: 'Calibration Schedule',
    icon: ClipboardList,
    section: 'Company',
  },
  'company-competency-matrix': {
    key: 'company-competency-matrix',
    title: 'Competency Matrix',
    icon: Users,
    section: 'Company',
  },
  'company-gap-analysis': {
    key: 'company-gap-analysis',
    title: 'QMS Gap Analysis',
    icon: ClipboardList,
    section: 'Company',
  },
  'company-activities': {
    key: 'company-activities',
    title: 'Compliance Activities',
    icon: ClipboardList,
    section: 'Company',
  },
  'company-quality-manual': {
    key: 'company-quality-manual',
    title: 'Global Quality Manual',
    icon: FileText,
    section: 'Company',
  },
  'company-ip-management': {
    key: 'company-ip-management',
    title: 'IP Management',
    icon: Shield,
    section: 'Company',
  },
  'company-audit-log': {
    key: 'company-audit-log',
    title: 'Audit Log',
    icon: ClipboardList,
    section: 'Company',
  },
  'company-commercial-landing': {
    key: 'company-commercial-landing',
    title: 'Commercial Intelligence',
    icon: BarChart3,
    section: 'Company',
  },
  'company-strategic-blueprint': {
    key: 'company-strategic-blueprint',
    title: 'Strategic Blueprint',
    icon: Target,
    section: 'Company',
  },
  'company-market-analysis': {
    key: 'company-market-analysis',
    title: 'Market Analysis (Enterprise)',
    icon: BarChart3,
    section: 'Company',
  },
  'company-commercial-performance': {
    key: 'company-commercial-performance',
    title: 'Commercial Performance',
    icon: BarChart3,
    section: 'Company',
  },
  'company-pricing-strategy': {
    key: 'company-pricing-strategy',
    title: 'Pricing Strategy (Enterprise)',
    icon: DollarSign,
    section: 'Company',
  },
  'company-market-access': {
    key: 'company-market-access',
    title: 'Global Market Access',
    icon: Target,
    section: 'Company',
  },

  // QMS Architecture topics
  'qms-foundation': {
    key: 'qms-foundation',
    title: 'QMS Foundation (XyReg Module)',
    icon: Building2,
    section: 'Company',
  },
  'device-process-engine': {
    key: 'device-process-engine',
    title: 'Device Process Engine (XyReg Module)',
    icon: Cpu,
    section: 'Product',
  },
  'qms-architecture': {
    key: 'qms-architecture',
    title: 'QMS Triple-Helix Architecture',
    icon: Layers,
  },

  // Mission Control
  'mission-control': {
    key: 'mission-control',
    title: 'Mission Control',
    icon: Target,
    section: 'Company',
  },

  // Portfolio Health topics
  'portfolio-overview': {
    key: 'portfolio-overview',
    title: 'Portfolio Financial Health',
    icon: BarChart3,
    section: 'Company',
  },
  'project-health-metrics': {
    key: 'project-health-metrics',
    title: 'Project Health Metrics',
    icon: Target,
    section: 'Company',
  },
  'operational-health': {
    key: 'operational-health',
    title: 'Operational Health (QMS)',
    icon: ClipboardList,
    section: 'Company',
  },
  'advanced-financial': {
    key: 'advanced-financial',
    title: 'Advanced Financial Analysis',
    icon: DollarSign,
    section: 'Company',
  },
  
  // Platform Architecture
  'xyreg-architecture': {
    key: 'xyreg-architecture',
    title: 'Xyreg Architecture',
    icon: Layers,
  },

  // EHDS Data Vault topics
  'ehds-data-vault': {
    key: 'ehds-data-vault',
    title: 'EHDS Data Vault (EU 2025/327)',
    icon: Shield,
    section: 'Company',
  },
  'ehds-datasets': {
    key: 'ehds-datasets',
    title: 'Dataset Library (HealthDCAT-AP)',
    icon: Shield,
    section: 'Company',
  },
  'ehds-translation': {
    key: 'ehds-translation',
    title: 'Translation Layer (EEHRxF)',
    icon: Shield,
    section: 'Company',
  },
  'ehds-secondary-use': {
    key: 'ehds-secondary-use',
    title: 'Secondary Use (HDAB Permits)',
    icon: Shield,
    section: 'Company',
  },
  'ehds-anonymization': {
    key: 'ehds-anonymization',
    title: 'Anonymization Lab',
    icon: Shield,
    section: 'Company',
  },
  'ehds-self-declaration': {
    key: 'ehds-self-declaration',
    title: 'Self-Declaration (Annex II)',
    icon: Shield,
    section: 'Company',
  },

  // Gap Analysis contextual help
  'gap-analysis-detail': {
    key: 'gap-analysis-detail',
    title: 'Gap Analysis Guidance',
    icon: ClipboardList,
  },

  // Technical File
  'technical-file': {
    key: 'technical-file',
    title: 'Technical File (MDR Dossier)',
    icon: FileText,
  },

  // Product-level pages
  'bom': {
    key: 'bom',
    title: 'Bill of Materials',
    icon: Package,
  },
  'gantt-chart': {
    key: 'gantt-chart',
    title: 'Gantt Chart & Timeline',
    icon: Calendar,
  },
  'essential-gates': {
    key: 'essential-gates',
    title: 'Essential Gates',
    icon: Flag,
  },
  'investor-share': {
    key: 'investor-share',
    title: 'Investor Share (Genesis)',
    icon: DollarSign,
  },
  'npv-analysis': {
    key: 'npv-analysis',
    title: 'NPV / rNPV Analysis',
    icon: DollarSign,
  },
  'compliance-instances': {
    key: 'compliance-instances',
    title: 'Compliance Instances',
    icon: FileText,
  },
  'product-definition-page': {
    key: 'product-definition-page',
    title: 'Product Definition',
    icon: Package,
  },
  'product-audit-log': {
    key: 'product-audit-log',
    title: 'Device Audit Trail',
    icon: ClipboardList,
  },

  // Company-level additional pages
  'company-permissions': {
    key: 'company-permissions',
    title: 'Permissions & Access',
    icon: Shield,
    section: 'Company',
  },
  'company-products': {
    key: 'company-products',
    title: 'Products List',
    icon: Package,
    section: 'Company',
  },
  'company-portfolio-landing': {
    key: 'company-portfolio-landing',
    title: 'Portfolio Landing',
    icon: BarChart3,
    section: 'Company',
  },
  'company-budget': {
    key: 'company-budget',
    title: 'Budget Dashboard',
    icon: DollarSign,
    section: 'Company',
  },
  'company-user-product-matrix': {
    key: 'company-user-product-matrix',
    title: 'User-Product Matrix',
    icon: Users,
    section: 'Company',
  },
  'company-basic-udi': {
    key: 'company-basic-udi',
    title: 'Basic UDI-DI Registry',
    icon: Barcode,
    section: 'Company',
  },
  'company-role-access': {
    key: 'company-role-access',
    title: 'Role Access Control',
    icon: Shield,
    section: 'Company',
  },
  'company-reviewer-analytics': {
    key: 'company-reviewer-analytics',
    title: 'Reviewer Analytics',
    icon: BarChart3,
    section: 'Company',
  },
  'company-platforms': {
    key: 'company-platforms',
    title: 'Platform Management',
    icon: Layers,
    section: 'Company',
  },
  'company-marketplace': {
    key: 'company-marketplace',
    title: 'Marketplace Preview',
    icon: Package,
    section: 'Company',
  },

  // Default/General
  'general': {
    key: 'general',
    title: 'Help & Documentation',
    icon: BookOpen,
  },
};

// Auto-register a HelpTopic for every QMS Foundation node so the global
// Help sidebar can surface node-specific help (e.g. "Design Control")
// when a foundation node drawer is open on the QMS Foundation tab.
const trackIcon = (track: string | undefined): LucideIcon => {
  switch (track) {
    case 'regulatory':
      return Shield;
    case 'engineering':
      return Cpu;
    case 'management':
      return Building2;
    default:
      return Layers;
  }
};
for (const node of HELIX_NODE_CONFIGS) {
  const key = `foundation-node-${node.id}`;
  helpTopics[key] = {
    key,
    title: `${node.label} (QMS Foundation)`,
    icon: trackIcon(node.track),
    section: 'Company',
  };
}

const routeMappings: RouteHelpMapping[] = [
  // Business Case with tab support
  {
    pattern: /\/business-case/,
    topic: helpTopics['business-canvas'],
    tabMappings: {
      'genesis': helpTopics['genesis-overview'],
      'viability': helpTopics['viability-scorecard'],
      'viability-scorecard': helpTopics['viability-scorecard'],
      'venture-blueprint': helpTopics['venture-blueprint'],
      'business-canvas': helpTopics['business-canvas'],
      'team-profile': helpTopics['team-profile'],
      'market-analysis': helpTopics['market-sizing'],
      'market-sizing': helpTopics['market-sizing'],
      'competition': helpTopics['competition'],
      'reimbursement': helpTopics['reimbursement'],
      'clinical-trials': helpTopics['clinical-trials'],
      'readiness-gates': helpTopics['readiness-gates'],
      'ip-strategy': helpTopics['ip-strategy'],
      'use-of-proceeds': helpTopics['use-of-proceeds'],
      'gtm-strategy': helpTopics['gtm-strategy'],
      'exit-strategy': helpTopics['exit-strategy'],
    },
  },
  
  // Product pages - device-information with tab support
  {
    pattern: /\/product\/[^/]+\/device-information/,
    topic: helpTopics['device-overview'],
    tabMappings: {
      'overview': helpTopics['device-overview'],
      'basics': helpTopics['device-general-deviceid'],
      'purpose': helpTopics['device-purpose'],
      'general': helpTopics['device-general'],
      'identification': helpTopics['udi-management'],
      'regulatory': helpTopics['regulatory'],
      'markets': helpTopics['device-markets'],
      'bundles': helpTopics['device-bundles'],
      'audit-log': helpTopics['device-auditlog'],
      'materials': helpTopics['device-definition'],
      'requirements': helpTopics['device-definition'],
    },
  },
  {
    pattern: /\/product\/[^/]+\/udi/,
    topic: helpTopics['udi-management'],
  },
  {
    pattern: /\/product\/[^/]+\/milestones/,
    topic: helpTopics['milestones'],
  },
  {
    pattern: /\/product\/[^/]+\/documents/,
    topic: helpTopics['documents'],
  },
  {
    pattern: /\/product\/[^/]+\/bom/,
    topic: helpTopics['bom'],
  },
  {
    pattern: /\/product\/[^/]+\/gantt-chart/,
    topic: helpTopics['gantt-chart'],
  },
  {
    pattern: /\/product\/[^/]+\/essential-gates/,
    topic: helpTopics['essential-gates'],
  },
  {
    pattern: /\/product\/[^/]+\/investor-share/,
    topic: helpTopics['investor-share'],
  },
  {
    pattern: /\/product\/[^/]+\/npv-analysis/,
    topic: helpTopics['npv-analysis'],
  },
  {
    pattern: /\/product\/[^/]+\/compliance-instances/,
    topic: helpTopics['compliance-instances'],
  },
  {
    pattern: /\/product\/[^/]+\/audit-log/,
    topic: helpTopics['product-audit-log'],
  },
  {
    pattern: /\/product\/[^/]+\/technical-file/,
    topic: helpTopics['technical-file'],
  },
  {
    pattern: /\/product\/[^/]+\/regulatory/,
    topic: helpTopics['regulatory'],
  },
  {
    pattern: /\/product\/[^/]+\/definition/,
    topic: helpTopics['device-definition'],
  },
  {
    pattern: /\/product\/[^/]+\/qms/,
    topic: helpTopics['qms'],
  },
  {
    pattern: /\/product\/[^/]+\/design-risk-controls/,
    topic: helpTopics['risk-management'],
    tabMappings: {
      'risk-management': helpTopics['risk-management'],
      'requirements': helpTopics['requirements-specifications'],
      'requirement-specifications': helpTopics['requirements-specifications'],
      'architecture': helpTopics['system-architecture'],
      'system-architecture': helpTopics['system-architecture'],
      'verification-validation': helpTopics['verification-validation'],
      'usability-engineering': helpTopics['usability-engineering'],
      'traceability': helpTopics['risk-management'],
    },
  },
  {
    pattern: /\/product\/[^/]+\/clinical-trials/,
    topic: helpTopics['clinical-trials'],
  },
  {
    pattern: /\/product\/[^/]+\/design-review\/[^/]+/,
    topic: helpTopics['design-review-detail'],
  },
  {
    pattern: /\/product\/[^/]+\/design-review/,
    topic: helpTopics['design-review'],
  },
  
  // Company-level pages (must be before generic /company/ patterns)
  // Base company route (Executive Dashboard) with portfolioTab support
  {
    pattern: /\/app\/company\/[^/]+$/,
    topic: helpTopics['qms-foundation'],
    tabMappings: {
      'portfolio': helpTopics['portfolio-overview'],
      'project-health': helpTopics['project-health-metrics'],
      'qms': helpTopics['operational-health'],
      'financial': helpTopics['advanced-financial'],
    },
  },
  {
    pattern: /\/company\/[^/]+\/dashboard/,
    topic: helpTopics['qms-foundation'],
    tabMappings: {
      'portfolio': helpTopics['portfolio-overview'],
      'project-health': helpTopics['project-health-metrics'],
      'qms': helpTopics['operational-health'],
      'financial': helpTopics['advanced-financial'],
    },
  },
  {
    pattern: /\/company\/[^/]+\/mission-control/,
    topic: helpTopics['mission-control'],
  },
  {
    pattern: /\/company\/[^/]+\/milestones/,
    topic: helpTopics['company-milestones'],
  },
  {
    pattern: /\/company\/[^/]+\/documents/,
    topic: helpTopics['company-documents'],
  },
  {
    pattern: /\/company\/[^/]+\/audits/,
    topic: helpTopics['company-audits'],
  },
  {
    pattern: /\/company\/[^/]+\/audit-log/,
    topic: helpTopics['company-audit-log'],
  },
  {
    pattern: /\/company\/[^/]+\/training/,
    topic: helpTopics['company-training'],
  },
  {
    pattern: /\/company\/[^/]+\/suppliers/,
    topic: helpTopics['company-suppliers'],
  },
  {
    pattern: /\/company\/[^/]+\/post-market-surveillance/,
    topic: helpTopics['company-pms'],
  },
  {
    pattern: /\/company\/[^/]+\/portfolio/,
    topic: helpTopics['company-portfolio'],
  },
  {
    pattern: /\/company\/[^/]+\/settings/,
    topic: helpTopics['company-settings'],
  },
  // Additional company pages
  {
    pattern: /\/company\/[^/]+\/permissions/,
    topic: helpTopics['company-permissions'],
  },
  {
    pattern: /\/company\/[^/]+\/products/,
    topic: helpTopics['company-products'],
  },
  {
    pattern: /\/company\/[^/]+\/portfolio-landing/,
    topic: helpTopics['company-portfolio-landing'],
  },
  {
    pattern: /\/company\/[^/]+\/budget/,
    topic: helpTopics['company-budget'],
  },
  {
    pattern: /\/company\/[^/]+\/user-product-matrix/,
    topic: helpTopics['company-user-product-matrix'],
  },
  {
    pattern: /\/company\/[^/]+\/basic-udi/,
    topic: helpTopics['company-basic-udi'],
  },
  {
    pattern: /\/company\/[^/]+\/role-access/,
    topic: helpTopics['company-role-access'],
  },
  {
    pattern: /\/company\/[^/]+\/reviewer-analytics/,
    topic: helpTopics['company-reviewer-analytics'],
  },
  {
    pattern: /\/company\/[^/]+\/platforms/,
    topic: helpTopics['company-platforms'],
  },
  {
    pattern: /\/company\/[^/]+\/marketplace/,
    topic: helpTopics['company-marketplace'],
  },
  // Enterprise Quality Governance
  {
    pattern: /\/company\/[^/]+\/nonconformity/,
    topic: helpTopics['company-nc-trends'],
  },
  {
    pattern: /\/company\/[^/]+\/capa/,
    topic: helpTopics['company-capa-trends'],
  },
  {
    pattern: /\/company\/[^/]+\/change-control/,
    topic: helpTopics['company-change-control'],
  },
  {
    pattern: /\/company\/[^/]+\/design-review/,
    topic: helpTopics['company-design-review'],
  },
  {
    pattern: /\/company\/[^/]+\/management-review/,
    topic: helpTopics['company-management-review'],
  },
  // Enterprise Operations
  {
    pattern: /\/company\/[^/]+\/infrastructure/,
    topic: helpTopics['company-infrastructure'],
  },
  {
    pattern: /\/company\/[^/]+\/calibration-schedule/,
    topic: helpTopics['company-calibration'],
  },
  {
    pattern: /\/company\/[^/]+\/competency-matrix/,
    topic: helpTopics['company-competency-matrix'],
  },
  // EHDS Data Vault
  {
    pattern: /\/company\/[^/]+\/ehds-data-vault/,
    topic: helpTopics['ehds-data-vault'],
    tabMappings: {
      'datasets': helpTopics['ehds-datasets'],
      'translation': helpTopics['ehds-translation'],
      'secondary-use': helpTopics['ehds-secondary-use'],
      'anonymization': helpTopics['ehds-anonymization'],
      'self-declaration': helpTopics['ehds-self-declaration'],
    },
  },
  // Enterprise Compliance
  {
    pattern: /\/company\/[^/]+\/gap-analysis/,
    topic: helpTopics['company-gap-analysis'],
  },
  {
    pattern: /\/company\/[^/]+\/activities/,
    topic: helpTopics['company-activities'],
  },
  {
    pattern: /\/company\/[^/]+\/quality-manual/,
    topic: helpTopics['company-quality-manual'],
  },
  {
    pattern: /\/company\/[^/]+\/ip-portfolio/,
    topic: helpTopics['company-ip-management'],
  },
  // Commercial Intelligence
  {
    pattern: /\/company\/[^/]+\/commercial-landing/,
    topic: helpTopics['company-commercial-landing'],
  },
  {
    pattern: /\/company\/[^/]+\/commercial/,
    topic: helpTopics['company-commercial-landing'],
    tabMappings: {
      'strategic-blueprint': helpTopics['company-strategic-blueprint'],
      'business-canvas': helpTopics['company-commercial-landing'],
      'feasibility-studies': helpTopics['company-commercial-landing'],
      'market-analysis': helpTopics['company-market-analysis'],
      'commercial-performance': helpTopics['company-commercial-performance'],
      'pricing-strategy': helpTopics['company-pricing-strategy'],
      'market-access': helpTopics['company-market-access'],
    },
  },
];

export function useContextualHelpTopic(): HelpTopic {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  return useMemo(() => {
    const pathname = location.pathname;
    const tab = searchParams.get('tab');
    const subTab = searchParams.get('subTab');

    // Special-case: V&V subtab for AI Assurance Lab
    if (/\/product\/[^/]+\/design-risk-controls/.test(pathname) && tab === 'verification-validation' && subTab === 'ai-assurance') {
      return helpTopics['ai-assurance-lab'];
    }

    // Special-case: V&V subtab for QMSR Rationale
    if (/\/product\/[^/]+\/design-risk-controls/.test(pathname) && tab === 'verification-validation' && subTab === 'qmsr-rationale') {
      return helpTopics['qmsr-rationale'];
    }

    // Special-case: Device Information → Basics tab with subtabs
    if (/\/product\/[^/]+\/device-information/.test(pathname) && tab === 'basics') {
      const subtab = searchParams.get('subtab');
      if (subtab === 'technical') return helpTopics['device-general-techspecs']; // System Architecture
      if (subtab === 'definition') return helpTopics['device-general-definition'];
      if (subtab === 'media') return helpTopics['device-general-media'];
      if (subtab === 'identification') return helpTopics['device-general-deviceid'];
      return helpTopics['device-general-deviceid']; // default
    }

    // Special-case: Device Definition → Identification has internal tabs (UDI vs EUDAMED)
    if (/\/product\/[^/]+\/device-information/.test(pathname) && tab === 'identification') {
      const identificationSection = searchParams.get('identificationSection');
      if (identificationSection === 'eudamed') return helpTopics['eudamed'];
      return helpTopics['udi-management'];
    }

    // Special-case: Device Definition → General tab has sub-tabs
    if (/\/product\/[^/]+\/device-information/.test(pathname) && tab === 'general') {
      const generalSubTab = subTab || searchParams.get('generalSubTab');
      if (generalSubTab === 'device-id') return helpTopics['device-general-deviceid'];
      if (generalSubTab === 'classification') return helpTopics['device-general-classification'];
      if (generalSubTab === 'technical-specs') return helpTopics['device-general-techspecs'];
      if (generalSubTab === 'definition') return helpTopics['device-general-definition'];
      if (generalSubTab === 'media') return helpTopics['device-general-media'];
      if (generalSubTab === 'storage') return helpTopics['device-general-storage'];
      if (generalSubTab === 'variants') return helpTopics['device-general-variants'];
      return helpTopics['device-general']; // default to general overview
    }

    // Special-case: Market Analysis has sub-tabs (market-sizing vs competition)
    if (/\/business-case/.test(pathname) && tab === 'market-analysis') {
      const subtab = searchParams.get('subtab');
      if (subtab === 'competition') return helpTopics['competition'];
      return helpTopics['market-sizing']; // default to market-sizing
    }

    // Special-case: Device Information → Risk tab with subtabs
    if (/\/product\/[^/]+\/device-information/.test(pathname) && tab === 'risk') {
      const subtab = searchParams.get('subtab');
      const section = searchParams.get('section');
      if (subtab === 'target') {
        if (section === 'economic-buyer') return helpTopics['economic-buyer'];
        return helpTopics['target-markets'];
      }
      return helpTopics['device-overview'];
    }

    // Special-case: Device Information → Purpose tab with sections
    if (/\/product\/[^/]+\/device-information/.test(pathname) && tab === 'purpose') {
      const subtab = searchParams.get('subtab');
      const section = searchParams.get('section');
      if (subtab === 'context') return helpTopics['user-profile'];
      if (subtab === 'statement') {
        if (section === 'value-proposition') return helpTopics['value-proposition'];
        return helpTopics['device-purpose']; // intended-use
      }
      return helpTopics['device-purpose'];
    }

    // Special-case: Reimbursement has sub-tabs
    if (/\/business-case/.test(pathname) && tab === 'reimbursement') {
      const subtab = searchParams.get('subtab');
      if (subtab === 'heor') return helpTopics['reimbursement']; // HEOR uses same content
      return helpTopics['reimbursement'];
    }

    // Special-case: Company dashboard tabs (dashboardTab param)
    if (/\/app\/company\/[^/]+$/.test(pathname)) {
      const dashboardTab = searchParams.get('dashboardTab');
      
      // QMS Foundation tab
      if (dashboardTab === 'qms-foundation') {
        // If a foundation node drawer is open, prefer node-specific help.
        const foundationNode = searchParams.get('foundationNode');
        if (foundationNode) {
          const nodeTopic = helpTopics[`foundation-node-${foundationNode}`];
          if (nodeTopic) return nodeTopic;
        }
        return helpTopics['qms-foundation'];
      }
      
      // Portfolio Health tab (default) - check for inner tabs
      const portfolioTab = searchParams.get('portfolioTab');
      const portfolioMappings: Record<string, HelpTopic> = {
        'portfolio': helpTopics['portfolio-overview'],
        'project-health': helpTopics['project-health-metrics'],
        'qms': helpTopics['operational-health'],
        'financial': helpTopics['advanced-financial'],
      };
      if (portfolioTab && portfolioMappings[portfolioTab]) {
        return portfolioMappings[portfolioTab];
      }
      // Default to portfolio overview for Portfolio Health tab
      return helpTopics['portfolio-overview'];
    }

    // Special-case: Product dashboard tabs (dashboardTab param)
    if (/\/app\/product\/[^/]+$/.test(pathname) || /\/product\/[^/]+$/.test(pathname)) {
      const dashboardTab = searchParams.get('dashboardTab');
      
      // Device Process Engine tab
      if (dashboardTab === 'process-engine') {
        return helpTopics['device-process-engine'];
      }
      
      // Default to device overview for Device Status tab
      return helpTopics['device-overview'];
    }

    // Special-case: Operations/Manufacturing
    if (/\/product\/[^/]+\/operations\/manufacturing/.test(pathname)) {
      return helpTopics['manufacturing'];
    }

    // Special-case: Product Gap Analysis detail page
    if (/\/product\/[^/]+\/gap-analysis\/[^/]+/.test(pathname)) {
      return helpTopics['gap-analysis-detail'];
    }

    // Special-case: Change Control Request detail page
    if (/\/app\/change-control\/[^/]+/.test(pathname)) {
      const ccrTab = tab ?? 'details';
      const ccrTabMap: Record<string, HelpTopic> = {
        details: helpTopics['ccr-detail-details'],
        impact: helpTopics['ccr-detail-impact'],
        implementation: helpTopics['ccr-detail-implementation'],
        history: helpTopics['ccr-detail-history'],
      };
      return ccrTabMap[ccrTab] ?? helpTopics['ccr-detail'];
    }
    
    // Find matching route
    for (const mapping of routeMappings) {
      if (mapping.pattern.test(pathname)) {
        // Check for tab-specific topic
        if (tab && mapping.tabMappings && mapping.tabMappings[tab]) {
          return mapping.tabMappings[tab];
        }
        return mapping.topic;
      }
    }

    // Default to general help
    return helpTopics['general'];
  }, [location.pathname, searchParams]);
}

export { helpTopics };

// Export as helpTopicMap for external access
export const helpTopicMap = helpTopics;
