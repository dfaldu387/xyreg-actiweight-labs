import { ModuleContent } from '@/types/onboarding';

export const clinicalTrialsModule: ModuleContent = {
  id: 'clinical-trials',
  translationKey: 'clinicalTrials',
  title: 'Clinical Trials Management',
  category: 'Compliance & Risk',
  estimatedTime: 25,
  difficulty: 'advanced',
  roles: ['admin', 'company_admin', 'consultant', 'editor'],
  
  overview: {
    description: 'Clinical Trials Management helps you plan, execute, and document clinical investigations for medical devices across different regulatory frameworks.',
    whoUsesIt: 'Clinical Affairs, Regulatory Affairs, and R&D teams conducting clinical studies to demonstrate safety and performance.',
    keyBenefits: [
      'Clinical study planning and protocol management',
      'Site and investigator tracking',
      'Endpoint definition and tracking',
      'CRO partner management',
      'Documentation templates and compliance tracking'
    ],
    prerequisites: ['Product created', 'Understanding of clinical evidence requirements']
  },
  
  steps: [
    {
      id: 'study-types',
      title: 'Understanding Study Types',
      content: `Different clinical study types serve different regulatory and evidence needs.

<strong>Study Types:</strong>

<strong>Feasibility Studies</strong>
- Purpose: Initial safety and performance assessment
- Size: 5-20 patients typically
- Duration: 3-6 months
- Regulatory: Often under IDE/clinical investigation exemption
- Use: Proof of concept, design refinement

<strong>Pivotal Studies</strong>
- Purpose: Demonstrate safety and effectiveness for approval
- Size: 50-300+ patients (varies by device and indication)
- Duration: 6-36 months
- Regulatory: Required for PMA, often for 510(k), EU MDR
- Use: Primary evidence for regulatory submission

<strong>Post-Market Surveillance (PMS)</strong>
- Purpose: Long-term safety and performance monitoring
- Size: Ongoing patient population
- Duration: Continuous (5+ years typical)
- Regulatory: Required by EU MDR, FDA may require PMCF
- Use: Real-world evidence, ongoing compliance

<strong>Registries</strong>
- Purpose: Collect long-term outcomes data
- Size: Large patient populations (hundreds to thousands)
- Duration: Multi-year or indefinite
- Use: Real-world evidence, comparative effectiveness

<strong>Study Phases (Drug-like classification sometimes used):</strong>
- Phase I: First-in-human safety (5-10 patients)
- Phase II: Safety and initial efficacy (20-50 patients)
- Phase III: Pivotal efficacy (100-500+ patients)
- Phase IV: Post-market studies`,
      tips: [
        'Start with feasibility study for novel devices',
        'Size pivotal study based on statistical power calculation',
        'Plan PMS early to meet EU MDR requirements',
        'Consider registry participation for long-term data'
      ]
    },
    {
      id: 'protocol-development',
      title: 'Developing Clinical Protocols',
      content: `Well-designed protocols are essential for successful clinical investigations.

<strong>Protocol Components:</strong>

<strong>1. Study Overview</strong>
- Study title and identifier
- Study type and phase
- Indication and patient population
- Study objectives (primary and secondary)
- Study design (e.g., randomized, blinded, controlled)

<strong>2. Study Endpoints</strong>

<strong>Primary Endpoint:</strong>
- Main measure of device effectiveness
- Must be clinically meaningful
- Powers sample size calculation
- Examples:
  - Reduction in pain score
  - Healing rate at 12 weeks
  - Diagnostic accuracy vs. gold standard

<strong>Secondary Endpoints:</strong>
- Support primary endpoint
- Safety measures
- Quality of life assessments
- Cost-effectiveness

<strong>3. Patient Selection</strong>

<strong>Inclusion Criteria:</strong>
- Target patient demographics
- Disease characteristics
- Specific indications

<strong>Exclusion Criteria:</strong>
- Conditions that may confound results
- Safety concerns
- Inability to comply with follow-up

<strong>4. Study Procedures</strong>
- Screening and enrollment
- Device implantation/use procedures
- Follow-up schedule and assessments
- Data collection methods
- Adverse event reporting

<strong>5. Statistical Analysis Plan</strong>
- Sample size justification
- Primary analysis method
- Handling of missing data
- Interim analysis (if applicable)
- Success criteria

<strong>6. Ethics & Regulatory</strong>
- IRB/Ethics committee approval process
- Informed consent procedures
- Data monitoring committee (if needed)
- Regulatory reporting requirements`,
      tips: [
        'Engage statistician early for sample size calculation',
        'Use validated outcome measures when possible',
        'Plan realistic follow-up schedule',
        'Include clear adverse event definitions'
      ],
      commonMistakes: [
        'Underpowered studies due to insufficient sample size',
        'Overly complex protocols hard to execute',
        'Unrealistic patient recruitment timelines',
        'Missing important safety endpoints'
      ]
    },
    {
      id: 'site-management',
      title: 'Managing Sites and Investigators',
      content: `Effective site and investigator management ensures study quality and timeline adherence.

<strong>Site Selection:</strong>

<strong>Evaluation Criteria:</strong>
- Patient population access
- PI qualifications and experience
- Site infrastructure and capabilities
- Track record in clinical research
- Regulatory compliance history

<strong>Site Registry in XYREG:</strong>
- Database of qualified sites
- PI contact information and CVs
- Site capabilities and specialties
- Past trial performance metrics
- Site qualification status

<strong>Site Initiation:</strong>
1. Site qualification visit
2. Contract and budget negotiation
3. Ethics committee submission
4. Protocol training
5. Site initiation visit (SIV)
6. First patient enrollment

<strong>Ongoing Management:</strong>

<strong>Site Monitoring:</strong>
- Regular monitoring visits
- Data quality checks
- Protocol compliance verification
- AE/SAE review
- Regulatory document updates

<strong>Performance Tracking:</strong>
- Enrollment rate by site
- Data quality scores
- Protocol deviations
- Patient retention
- Timeline adherence

<strong>Site Communication:</strong>
- Regular updates on study status
- Protocol amendments communication
- Safety information distribution
- Enrollment progress reports`,
      tips: [
        'Over-recruit sites by 20-30% for enrollment targets',
        'Provide comprehensive site training upfront',
        'Monitor actively, especially early in study',
        'Maintain good investigator relationships'
      ]
    },
    {
      id: 'cro-partners',
      title: 'Working with CRO Partners',
      content: `Contract Research Organizations (CROs) can accelerate trials and provide expertise.

<strong>CRO Services:</strong>
- Full-service: Complete trial management
- Functional: Specific services (monitoring, data management)
- Site management organizations (SMOs)
- Central labs and imaging core labs
- Biostatistics and data analysis

<strong>CRO Selection:</strong>
- Therapeutic area expertise
- Geographic coverage
- Technology platforms
- Quality track record
- Cost and timeline
- Regulatory experience

<strong>CRO Management in XYREG:</strong>
- CRO partner registry
- Service agreement tracking
- Performance monitoring
- Budget and payment tracking
- Deliverable management

<strong>Working Effectively:</strong>
- Clear SOW (Statement of Work)
- Defined roles and responsibilities
- Regular status meetings
- Transparent communication
- Quality metrics tracking
- Change order management`,
      tips: [
        'Get multiple CRO bids for comparison',
        'Check CRO references thoroughly',
        'Clearly define deliverables and timelines',
        'Monitor CRO performance actively'
      ]
    }
  ],
  
  examples: [
    {
      scenario: 'Planning Pivotal Study for Class III Device',
      description: 'Multinational trial for FDA PMA submission',
      steps: [
        'Define primary endpoint: Device success rate at 12 months',
        'Statistical power analysis: Need 150 patients for 80% power',
        'Select 15 sites across US and EU (10 patients each average)',
        'Partner with CRO for site monitoring and data management',
        'Develop protocol with statistical consultant',
        'Submit IDE application to FDA',
        'Obtain Ethics Committee approvals at all sites',
        'Conduct site initiation visits',
        'Enroll 150 patients over 18 months',
        'Complete 12-month follow-up for all patients',
        'Data lock and statistical analysis',
        'Clinical study report for PMA submission'
      ],
      expectedOutcome: 'Successful pivotal trial supporting PMA approval'
    }
  ],
  
  bestPractices: [
    'Engage clinical and statistical experts early in planning',
    'Use standardized templates for protocols and case report forms',
    'Over-recruit sites by 20-30% to meet enrollment targets',
    'Plan for 20-30% longer timeline than initial estimates',
    'Monitor sites actively, especially during early enrollment',
    'Use electronic data capture (EDC) systems for quality',
    'Maintain close communication with regulatory authorities',
    'Plan interim analysis for early safety review',
    'Document all protocol deviations and resolutions',
    'Keep comprehensive regulatory files',
    'Budget conservatively - trials often cost more than planned',
    'Plan post-market surveillance early to align with pivotal study'
  ],
  
  relatedModules: [
    'product-management',
    'compliance-gap-analysis',
    'business-analysis',
    'document-studio'
  ],
  
  quickReference: {
    shortcuts: [
      { key: 'T → N', action: 'New clinical trial', context: 'From clinical tab' },
      { key: 'T → S', action: 'Manage sites' }
    ],
    commonTasks: [
      {
        task: 'Create clinical trial',
        steps: ['Clinical tab', 'New Trial', 'Select study type', 'Define endpoints', 'Set timeline'],
        estimatedTime: '30-60 minutes'
      },
      {
        task: 'Add site',
        steps: ['Trial page', 'Sites', 'Add Site', 'Enter details', 'Set status'],
        estimatedTime: '10 minutes'
      }
    ],
    cheatSheet: [
      {
        title: 'Study Sizes',
        description: 'Feasibility: 5-20 | Pivotal: 50-300+ | PMS: Ongoing'
      },
      {
        title: 'Timeline Planning',
        description: 'Add 20-30% buffer to all initial estimates'
      }
    ]
  }
};
