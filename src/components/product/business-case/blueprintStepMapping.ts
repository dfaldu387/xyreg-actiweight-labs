import { 
  Target, 
  Users, 
  Lightbulb, 
  FileText, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  ClipboardList,
  Calendar,
  DollarSign,
  UserCircle,
  Megaphone,
  Factory,
  Scale,
  Banknote,
  LineChart
} from 'lucide-react';

export interface StepConfig {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  questions: string;
  route: string;
  moduleLabel: string;
  completionKey: string;
  isNew?: boolean; // For newly added steps
}

// Phase 1: Opportunity & Definition (Steps 1-12)
// Order matches sidebar checklist in useViabilityFunnelProgress.ts
export const PHASE_1_STEPS: StepConfig[] = [
  {
    id: '1',
    stepNumber: 1,
    title: 'Device Name',
    description: 'Set your device\'s official name (done during creation).',
    questions: 'What is the device name?',
    route: 'device-information?tab=basics&subtab=definition',
    moduleLabel: 'Device Definition',
    completionKey: 'device_name',
  },
  {
    id: '2',
    stepNumber: 2,
    title: 'Technical Readiness Level (TRL)',
    description: 'Assess your technology maturity from proof of concept (TRL 3) to market ready (TRL 8).',
    questions: 'What stage is your technology at? Have you completed bench-top validation? Clinical testing?',
    route: 'device-information?tab=basics&subtab=technical&section=trl',
    moduleLabel: 'Device Definition',
    completionKey: 'trl_assessment',
  },
  {
    id: '3',
    stepNumber: 3,
    title: 'System Architecture',
    description: 'Define if your device is Pure Hardware, Hardware+Software (SiMD), or Software as a Medical Device (SaMD).',
    questions: 'What is the system architecture type? Is it hardware only, software-enabled hardware, or standalone software?',
    route: 'device-information?tab=basics&subtab=technical&section=architecture',
    moduleLabel: 'Device Definition',
    completionKey: 'system_architecture',
  },
  {
    id: '4',
    stepNumber: 4,
    title: 'Intended Use and Value Proposition',
    description: 'Define WHY your device exists and the measurable benefit of your solution.',
    questions: 'What is the specific, unmet need? How does our solution improve outcomes, reduce time, or lower costs?',
    route: 'device-information?tab=purpose&subtab=statement',
    moduleLabel: 'Device Definition',
    completionKey: 'intended_use_and_value',
  },
  {
    id: '5',
    stepNumber: 5,
    title: 'Device Type',
    description: 'Define device characteristics: invasiveness, active status, anatomical location, and contact duration.',
    questions: 'Is the device invasive? Is it active (powered)? Where does it contact the body? For how long?',
    route: 'device-information?tab=basics&subtab=classification',
    moduleLabel: 'Device Definition',
    completionKey: 'device_type',
  },
  {
    id: '6',
    stepNumber: 6,
    title: 'Add Device Description',
    description: 'Describe WHAT your device is - its physical form, key components, and core technology.',
    questions: 'What is the device? What are its main components? What technology enables it?',
    route: 'device-information?tab=basics&subtab=definition',
    moduleLabel: 'Device Definition',
    completionKey: 'device_description',
  },
  {
    id: '7',
    stepNumber: 7,
    title: 'Upload Device Image',
    description: 'Upload at least one image showing your device for visual documentation.',
    questions: 'Do you have product photos, CAD renders, or prototype images?',
    route: 'device-information?tab=basics&subtab=media',
    moduleLabel: 'Device Definition',
    completionKey: 'device_media',
  },
  {
    id: '8',
    stepNumber: 8,
    title: 'Select Target Markets',
    description: 'Choose which geographic markets you plan to launch in (US, EU, UK, etc.).',
    questions: 'Which markets will you target first? What is your market entry strategy?',
    route: 'device-information?tab=markets-regulatory',
    moduleLabel: 'Device Definition',
    completionKey: 'target_markets',
  },
  {
    id: '9',
    stepNumber: 9,
    title: 'Classify Device',
    description: 'Determine device classification per market (EU Class I/IIa/IIb/III, FDA Class I/II/III).',
    questions: 'What is the likely device class in each target market? What classification rule applies?',
    route: 'device-information?tab=markets-regulatory&section=classification',
    moduleLabel: 'Regulatory',
    completionKey: 'regulatory_pathway',
  },
  {
    id: '10',
    stepNumber: 10,
    title: 'Market Sizing',
    description: 'Define the total addressable market (TAM), serviceable market (SAM), and target market (SOM).',
    questions: 'How big is the opportunity? What is the realistic market we can capture?',
    route: 'business-case?tab=market-analysis&subtab=sizing',
    moduleLabel: 'Market Analysis',
    completionKey: 'market_sizing',
  },
  {
    id: '11',
    stepNumber: 11,
    title: 'Competitor Analysis',
    description: 'Identify current solutions, competitors, and what makes your approach different.',
    questions: 'Who else is solving this? What makes our idea different or better?',
    route: 'business-case?tab=market-analysis&subtab=competition',
    moduleLabel: 'Market Analysis',
    completionKey: 'competition',
  },
  {
    id: '12',
    stepNumber: 12,
    title: 'Profile User',
    description: 'Define target patient population, intended operators, environment, duration, and what triggers device use.',
    questions: 'Who is our target patient? Who operates the device? Where and how long is it used? What triggers its use?',
    route: 'device-information?tab=purpose&subtab=context',
    moduleLabel: 'Device Definition',
    completionKey: 'user_profile',
  },
  {
    id: '13',
    stepNumber: 13,
    title: 'Profile Economic Buyer',
    description: 'Define market-specific economic buyer characteristics and budget ownership.',
    questions: 'Who controls the budget? What is the procurement path? What motivates the buyer?',
    route: 'device-information?tab=markets-regulatory&section=economic-buyer',
    moduleLabel: 'Device Definition',
    completionKey: 'economic_buyer',
  },
];

// Phase 2: Feasibility & Planning (Steps 14-23)
export const PHASE_2_STEPS: StepConfig[] = [
  {
    id: '14',
    stepNumber: 14,
    title: 'Strategic Partners',
    description: 'Define market-specific distribution, clinical, and regulatory partners.',
    questions: 'Who will help distribute your product? Who are your clinical partners? Who supports regulatory compliance?',
    route: 'device-information?tab=markets-regulatory&section=partners',
    moduleLabel: 'Device Definition',
    completionKey: 'strategic_partners',
  },
  {
    id: '15',
    stepNumber: 15,
    title: 'Health Economic Model (HEOR)',
    description: 'Prove the ROI math to economic buyers. Show cost savings, QALY gains, or budget impact.',
    questions: 'What is the per-procedure cost? What savings does it generate? What is the payback period?',
    route: 'business-case?tab=reimbursement&subtab=heor',
    moduleLabel: 'Reimbursement',
    completionKey: 'health_economics',
  },
  {
    id: '16',
    stepNumber: 16,
    title: 'Reimbursement & Market Access',
    description: 'Develop your reimbursement strategy, coding pathway, and payer engagement plan.',
    questions: 'What codes will cover this device? Who are the key payers? What evidence do they need?',
    route: 'business-case?tab=reimbursement',
    moduleLabel: 'Reimbursement',
    completionKey: 'reimbursement',
  },
  {
    id: '17',
    stepNumber: 17,
    title: 'Risk Assessment',
    description: 'Conduct preliminary hazard analysis per ISO 14971.',
    questions: 'What hazards exist? What are their severity and likelihood? What controls mitigate them?',
    route: 'design-risk-controls?tab=risk-management',
    moduleLabel: 'Risk Analysis',
    completionKey: 'risk_analysis',
  },
  {
    id: '18',
    stepNumber: 18,
    title: 'Clinical Evidence Strategy',
    description: 'Define your clinical validation plan, study design, and evidence requirements.',
    questions: 'What clinical evidence will regulators require? What data do payers need? What will physicians need?',
    route: 'clinical-trials?tab=evidence-plan',
    moduleLabel: 'Clinical Evidence',
    completionKey: 'clinical_evidence',
  },
  {
    id: '19',
    stepNumber: 19,
    title: 'IP Strategy & Freedom to Operate',
    description: 'Map your defensive moat (patents, trade secrets) and assess FTO risk to ensure you can launch without infringement.',
    questions: 'What is your core innovation? How will you protect it? Have you checked for blocking patents? Who owns the IP?',
    route: 'business-case?tab=ip-strategy',
    moduleLabel: 'IP Strategy',
    completionKey: 'ip_strategy',
  },
  {
    id: '20',
    stepNumber: 20,
    title: 'High-Level Project & Resource Plan',
    description: 'Outline major phases, estimate budget, team size, and create a high-level timeline.',
    questions: 'How long will this take? What is the estimated budget? Do we have the right team?',
    route: 'milestones?openDates=true',
    moduleLabel: 'Essential Gates',
    completionKey: 'essential_gates',
  },
  {
    id: '21',
    stepNumber: 21,
    title: 'Funding & Use of Proceeds',
    description: 'Plan your capital requirements and how funds will be allocated across activities.',
    questions: 'How much capital do we need? How will funds be allocated across R&D, regulatory, team, commercial?',
    route: 'business-case?tab=use-of-proceeds',
    moduleLabel: 'Use of Proceeds',
    completionKey: 'use_of_proceeds',
  },
  {
    id: '22',
    stepNumber: 22,
    title: 'Revenue Forecast',
    description: 'Project your expected sales, pricing, and 5-year NPV for investor presentations.',
    questions: 'What are your expected unit sales? What is your pricing strategy? What are your unit costs?',
    route: 'business-case?tab=rnpv&view=essential',
    moduleLabel: 'Revenue Forecast',
    completionKey: 'revenue_forecast',
  },
  {
    id: '23',
    stepNumber: 23,
    title: 'Team Composition',
    description: 'Identify key roles, current team members, and hiring priorities to execute your plan.',
    questions: 'Who are the key team members? What critical roles are missing? What is our hiring roadmap?',
    route: 'business-case?tab=team-profile',
    moduleLabel: 'Team Profile',
    completionKey: 'team_profile',
  },
];

// Phase 3: Design & Development
export const PHASE_3_STEPS: StepConfig[] = [
  {
    id: '9',
    stepNumber: 9,
    title: 'Establish Detailed Requirements',
    description: 'Translate user needs into verifiable engineering requirements.',
    questions: 'What must the device do? How will we measure success?',
    route: 'design-risk-controls?tab=requirements',
    moduleLabel: 'Design Controls → Requirements',
    completionKey: 'requirements',
  },
  {
    id: '10',
    stepNumber: 10,
    title: 'System Architecture',
    description: 'Create high-level architecture including hardware, software, and materials.',
    questions: 'How do the parts interact? Build vs. buy decisions?',
    route: 'design-risk-controls?tab=architecture',
    moduleLabel: 'Design Controls → Architecture',
    completionKey: 'architecture',
  },
  {
    id: '11',
    stepNumber: 11,
    title: 'Detailed Design & Prototyping',
    description: 'Create specifications, schematics, CAD drawings, and build prototypes.',
    questions: 'Have we created complete specifications?',
    route: 'design-risk-controls?tab=design-outputs',
    moduleLabel: 'Design Controls → Design Outputs',
    completionKey: 'design_outputs',
  },
  {
    id: '12',
    stepNumber: 12,
    title: 'Formal Risk Management (ISO 14971)',
    description: 'Conduct detailed risk analysis (FMEA) and implement control measures.',
    questions: 'Have we mitigated every potential risk?',
    route: 'design-risk-controls?tab=risk-management',
    moduleLabel: 'Risk Management',
    completionKey: 'risk_analysis',
  },
];

// Phase 4: Verification & Validation
export const PHASE_4_STEPS: StepConfig[] = [
  {
    id: '13',
    stepNumber: 13,
    title: 'Design Verification',
    description: 'Execute tests to prove the device meets all system requirements.',
    questions: 'Do test results prove we built it right?',
    route: 'design-risk-controls?tab=verification',
    moduleLabel: 'Design Controls → Verification',
    completionKey: 'verification',
  },
  {
    id: '14',
    stepNumber: 14,
    title: 'Design Validation & Usability',
    description: 'Test with end-users in simulated or real clinical environments.',
    questions: 'Does the device solve user problems safely?',
    route: 'design-risk-controls?tab=validation',
    moduleLabel: 'Design Controls → Validation',
    completionKey: 'validation',
  },
  {
    id: '15',
    stepNumber: 15,
    title: 'Manufacturing Process Validation',
    description: 'Validate manufacturing line can consistently produce to specification.',
    questions: 'Can we build quality devices every time?',
    route: 'operations/manufacturing?tab=process-validation',
    moduleLabel: 'Manufacturing → Process Validation',
    completionKey: 'process_validation',
  },
];

// Phase 5: Market Readiness & Submission (Full version)
export const PHASE_5_FULL_STEPS: StepConfig[] = [
  {
    id: '16',
    stepNumber: 16,
    title: 'Compile Regulatory Submission',
    description: 'Gather all documentation into required regulatory format.',
    questions: 'Is our submission package complete?',
    route: 'regulatory-pathway?tab=submissions',
    moduleLabel: 'Regulatory → Submissions',
    completionKey: 'regulatory_submission',
  },
  {
    id: '17',
    stepNumber: 17,
    title: 'Go-to-Market Strategy',
    description: 'Finalize pricing, sales channels, marketing materials, and customer support plan.',
    questions: 'How will we sell and support this device? What is our messaging to customers?',
    route: 'business-case?tab=gtm-strategy',
    moduleLabel: 'GTM Strategy',
    completionKey: 'gtm_strategy',
  },
  {
    id: '18',
    stepNumber: 18,
    title: 'Manufacturing & Supply Chain',
    description: 'Finalize supplier selection, production strategy, and supply chain logistics.',
    questions: 'Who will manufacture the device? Is our supply chain ready for launch quantities?',
    route: 'operations/manufacturing',
    moduleLabel: 'Manufacturing & Operations',
    completionKey: 'manufacturing',
  },
  {
    id: '19',
    stepNumber: 19,
    title: 'Submit for Approval',
    description: 'Formally submit to regulatory authorities and respond to questions.',
    questions: 'Are we prepared for regulatory review?',
    route: 'regulatory-pathway?tab=submissions',
    moduleLabel: 'Regulatory → Submission Status',
    completionKey: 'regulatory_approval',
  },
];

// Phase 6: Post-Market & Growth
export const PHASE_6_STEPS: StepConfig[] = [
  {
    id: '20',
    stepNumber: 20,
    title: 'Commercial Launch',
    description: 'Execute go-to-market plan and train sales force.',
    questions: 'Are marketing efforts generating expected results?',
    route: 'business-case?tab=gtm-strategy',
    moduleLabel: 'GTM Strategy → Launch',
    completionKey: 'gtm_strategy',
  },
  {
    id: '21',
    stepNumber: 21,
    title: 'Post-Market Surveillance',
    description: 'Monitor device in field, handle complaints, track adverse events.',
    questions: 'How do we handle customer complaints?',
    route: 'pms/surveillance',
    moduleLabel: 'PMS → Surveillance',
    completionKey: 'pms_surveillance',
  },
  {
    id: '22',
    stepNumber: 22,
    title: 'Analyze Performance',
    description: 'Analyze sales data, complaint trends, and PMS data.',
    questions: 'Is the device performing as expected?',
    route: 'pms/analytics',
    moduleLabel: 'PMS → Analytics',
    completionKey: 'pms_analytics',
  },
  {
    id: '23',
    stepNumber: 23,
    title: 'Plan Next Version',
    description: 'Prioritize features for next device version based on collected data.',
    questions: 'What should we work on next?',
    route: 'change-control',
    moduleLabel: 'Change Control',
    completionKey: 'change_control',
  },
  {
    id: '24',
    stepNumber: 24,
    title: 'Maintain Compliance',
    description: 'Handle changes through formal change control process.',
    questions: 'Is our QMS being actively maintained?',
    route: 'qms/overview',
    moduleLabel: 'QMS Overview',
    completionKey: 'qms_maintenance',
  },
];

// Phase 5: Market Readiness - Investor relevant steps (for Genesis, Steps 24-26)
export const PHASE_5_INVESTOR_STEPS: StepConfig[] = [
  {
    id: '24',
    stepNumber: 24,
    title: 'Go-to-Market Strategy',
    description: 'Finalize pricing, sales channels, marketing materials, and customer support plan.',
    questions: 'How will we sell and support this device? What is our messaging to customers?',
    route: 'business-case?tab=gtm-strategy',
    moduleLabel: 'GTM Strategy',
    completionKey: 'gtm_strategy',
  },
  {
    id: '25',
    stepNumber: 25,
    title: 'Manufacturing & Supply Chain',
    description: 'Finalize supplier selection, production strategy, and supply chain logistics.',
    questions: 'Who will manufacture the device? Is our supply chain ready for launch quantities?',
    route: 'operations/manufacturing',
    moduleLabel: 'Manufacturing',
    completionKey: 'manufacturing',
  },
  {
    id: '26',
    stepNumber: 26,
    title: 'Exit Strategy & Comparable Valuations',
    description: 'Identify potential acquirers and comparable M&A transactions to show investors the path to liquidity.',
    questions: 'Who would acquire us? Why would they buy? What are comparable transaction multiples?',
    route: 'business-case?tab=exit-strategy&subsection=trade_sale',
    moduleLabel: 'Exit Strategy',
    completionKey: 'exit_strategy',
  },
];

// All investor-relevant steps combined (for XyReg Genesis)
export const ALL_INVESTOR_STEPS: StepConfig[] = [
  ...PHASE_1_STEPS,
  ...PHASE_2_STEPS,
  ...PHASE_5_INVESTOR_STEPS,
];

// All development steps (all 6 phases for Venture Blueprint)
export const ALL_DEVELOPMENT_STEPS: StepConfig[] = [
  ...PHASE_1_STEPS,
  ...PHASE_2_STEPS,
  ...PHASE_3_STEPS,
  ...PHASE_4_STEPS,
  ...PHASE_5_FULL_STEPS,
  ...PHASE_6_STEPS,
];

// Map step IDs to their completion keys
export const STEP_COMPLETION_KEYS = ALL_INVESTOR_STEPS.reduce((acc, step) => {
  acc[step.id] = step.completionKey;
  return acc;
}, {} as Record<string, string>);

// Get total investor-relevant steps count
export const TOTAL_INVESTOR_STEPS = ALL_INVESTOR_STEPS.length;

// Get total development steps count (all 6 phases)
export const TOTAL_DEVELOPMENT_STEPS = ALL_DEVELOPMENT_STEPS.length;

// Minimum steps required for "Blueprint Complete" status  
export const REQUIRED_STEPS_FOR_COMPLETE = 6;
