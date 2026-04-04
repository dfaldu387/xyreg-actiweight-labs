import { ModuleContent } from '@/types/onboarding';

export const designRiskModule: ModuleContent = {
  id: 'design-risk-management',
  translationKey: 'designRiskManagement',
  title: 'Design & Risk Management',
  category: 'Compliance & Risk',
  estimatedTime: 30,
  difficulty: 'advanced',
  roles: ['admin', 'company_admin', 'consultant', 'editor'],
  
  overview: {
    description: 'Design & Risk Management provides comprehensive tools for managing design controls per ISO 13485 and risk management per ISO 14971, ensuring your medical device meets safety and performance requirements.',
    whoUsesIt: 'Design Engineers, Risk Managers, Quality Assurance, and Regulatory Affairs teams working on medical device development.',
    keyBenefits: [
      'ISO 14971 compliant risk management',
      'Design control workflow (21 CFR 820.30)',
      'Risk analysis with FMEA support',
      'Design review management',
      'Traceability matrix generation',
      'Change control integration'
    ],
    prerequisites: ['Product created', 'Understanding of ISO 14971', 'Basic design process knowledge']
  },
  
  steps: [
    {
      id: 'risk-assessment',
      title: 'Creating Risk Assessments',
      content: `Systematic risk identification and analysis following ISO 14971 principles.

<strong>Risk Management Process:</strong>

<strong>1. Risk Analysis Planning</strong>
- Define scope and boundaries
- Identify intended use and reasonably foreseeable misuse
- Determine characteristics related to safety
- Set up risk acceptance criteria
- Assign risk management team

<strong>2. Hazard Identification</strong>
- Use structured brainstorming
- Review similar device hazards
- Analyze user interface risks
- Consider manufacturing risks
- Include software hazards (for SaMD)

<strong>Common Hazard Categories:</strong>
- Energy hazards (electrical, thermal, mechanical)
- Biological hazards (biocompatibility, infection)
- Environmental hazards (EMC, radiation)
- Operational hazards (use error, training)
- Information hazards (incorrect output, data security)

<strong>3. Risk Estimation</strong>
- Assess severity of harm
- Estimate probability of occurrence
- Calculate risk level (Severity × Probability)
- Use risk matrix or scoring system

<strong>Severity Levels:</strong>
- <strong>Catastrophic: Death or permanent injury
- <strong>Critical: Serious injury requiring intervention
- <strong>Major: Injury requiring medical attention
- <strong>Minor: Temporary discomfort, no medical intervention
- <strong>Negligible: No injury

<strong>Probability Levels:</strong>
- Frequent: Expected to occur repeatedly
- Probable: Likely to occur several times
- Occasional: May occur sometime
- Remote: Unlikely but possible
- Improbable: Extremely unlikely

<strong>4. Risk Evaluation</strong>
- Compare against acceptance criteria
- Determine if risk reduction needed
- Prioritize risks for control measures
- Document evaluation rationale`,
      tips: [
        'Involve multi-disciplinary team in hazard identification',
        'Use FMEA templates for structured analysis',
        'Consider entire product lifecycle, not just use',
        'Document assumptions and rationale clearly'
      ],
      commonMistakes: [
        'Only analyzing normal use, missing misuse scenarios',
        'Using vague severity or probability estimates',
        'Not updating risk assessment after design changes',
        'Insufficient hazard identification coverage'
      ]
    },
    {
      id: 'risk-controls',
      title: 'Implementing Risk Controls',
      content: `Apply risk control measures following ISO 14971 hierarchy to reduce risks to acceptable levels.

<strong>Risk Control Hierarchy (in order of preference):</strong>

<strong>1. Inherently Safe Design</strong>
- Eliminate hazard through design
- Most effective control method
- Examples:
  - Remove sharp edges
  - Use low voltage instead of high voltage
  - Design out pinch points
  - Eliminate toxic materials

<strong>2. Protective Measures in Device/Manufacturing</strong>
- Add safety features when elimination not possible
- Examples:
  - Alarms and alerts
  - Interlocks and guards
  - Redundant systems
  - Error-proofing (poka-yoke)
  - Software validation and verification

<strong>3. Information for Safety</strong>
- Warnings, precautions, training when technical controls insufficient
- Examples:
  - User manual warnings
  - Labeling precautions
  - Training requirements
  - Contraindications
  - Clinical risk communication

<strong>Implementing Controls:</strong>

<strong>For Each Risk:</strong>
1. Select appropriate control measure(s)
2. Implement in design or process
3. Verify effectiveness
4. Re-assess residual risk
5. Document implementation

<strong>Verification Methods:</strong>
- Design analysis
- Testing (bench, animal, clinical)
- Inspection
- User studies (for usability risks)
- Simulation
- Literature review

<strong>Residual Risk:</strong>
- Risk remaining after control implementation
- Must be acceptable per criteria
- Document benefit-risk analysis if elevated
- Include in risk-benefit for users/patients`,
      tips: [
        'Always try inherent safety first before adding warnings',
        'Combine multiple control types for high risks',
        'Verify control effectiveness with objective evidence',
        'Update risk controls when design changes'
      ]
    },
    {
      id: 'design-reviews',
      title: 'Design Review Process',
      content: `Design Review is a top-level module that acts as a System Orchestrator for regulatory compliance (ISO 13485 §7.3.5 / FDA 21 CFR 820.30(e)). It supports three modalities and provides a live, interactive workspace for conducting formal reviews.

<strong>Review Modalities:</strong>

<strong>1. Phase-End (Hard-Gate)</strong>
- Formal milestone review at each development phase
- Blocks progression until all criteria met
- Generates a frozen baseline upon approval

<strong>2. Ad-Hoc (Agility)</strong>
- On-demand reviews for specific topics or scope changes
- Lighter-weight but still formally recorded

<strong>3. Post-Market / Change Control</strong>
- Reviews triggered by field data (PMS events, CAPAs)
- Evaluates impact of post-market changes on the Design History File

<strong>Interactive Overview Tab (6 Sections):</strong>

The Design Review detail page is a live workspace with six interactive sections. All state (checklists, decisions, signatures) is persisted in real time.

<strong>1. General Information</strong> — Review metadata (type, date, product, phase)
<strong>2. Attendees & Roles</strong> — Database-driven participant list with signature and date columns
<strong>3. Review Scope / Artifacts (OID Change Tracker)</strong> — Automated agenda showing all objects (User Needs, Requirements, Hazards, Test Cases) created or updated since the last completed review
<strong>4. Gate Criteria Checklist</strong> — Interactive checklist with form logic specific to the review phase
<strong>5. Review Decision & Action Items</strong> — Approved / Approved with Conditions / Not Approved, plus action item tracking
<strong>6. Approvals</strong> — Formal signature blocks for final sign-off

<strong>Automated OID Change Tracker:</strong>
The "Review Scope / Artifacts" section automatically identifies and groups all project objects that have changed since the most recent completed design review. This provides reviewers with a data-driven agenda, eliminating manual change tracking.

<strong>Regulatory Baselining (Legal Handshake):</strong>
Upon final approval with all required signatures:
- The system freezes manifest objects in an immutable JSONB snapshot
- Object statuses transition from DRAFT to BASELINED
- At least one independent reviewer (not involved in design) is enforced
- Major findings block final approval until resolved

<strong>PMS Closed-Loop Integration:</strong>
Field events (complaints, adverse events) are now linked back to the Design History File:
- Critical/Adverse events auto-trigger a CAPA and Change Control Request
- Serious/Malfunction events auto-trigger a CAPA
- Escalated records link directly to affected requirements and hazards
- Design reviews can evaluate the impact of field-triggered changes`,
      tips: [
        'Use the OID Change Tracker as your review agenda — it auto-captures all changes since the last review',
        'Ensure at least one independent reviewer is assigned (regulatory requirement)',
        'Complete all Gate Criteria Checklist items before attempting final approval',
        'Review PMS-triggered CAPAs and CCRs in Post-Market review modality',
        'Major findings will block approval — resolve them first',
        'The baseline snapshot is immutable once signed — verify completeness before signing'
      ],
      commonMistakes: [
        'Skipping the independent reviewer requirement',
        'Not resolving major findings before attempting sign-off',
        'Ignoring the OID Change Tracker items (they represent real design changes)',
        'Failing to link PMS events to affected design objects before review'
      ]
    },
    {
      id: 'traceability',
      title: 'Design Traceability Matrix',
      content: `Maintain complete traceability from user needs through design, verification, and risk controls.

<strong>Traceability Links:</strong>

<strong>User Needs → Design Inputs</strong>
- Map stakeholder requirements to technical requirements
- Ensure all user needs addressed
- Regulatory requirements included

<strong>Design Inputs → Design Outputs</strong>
- Link requirements to specifications
- Ensure complete implementation
- Verify nothing missing

<strong>Design Outputs → Verification</strong>
- Each specification has test method
- Link test results to outputs
- Demonstrate conformance

<strong>Design Inputs → Validation</strong>
- Validate that user needs met
- Clinical evaluation evidence
- Usability validation

<strong>Risks → Controls → Verification</strong>
- Each risk has control measure
- Controls are verified effective
- Residual risk acceptable

<strong>Design Changes → Impact Analysis</strong>
- Trace affected requirements
- Re-verify changed elements
- Update risk analysis

<strong>Matrix Management in XYREG:</strong>
1. System auto-generates initial matrix
2. Manually link related elements
3. Identify gaps (missing links)
4. Export for regulatory submissions
5. Update as design evolves
6. Use for impact analysis`,
      tips: [
        'Maintain matrix throughout development, not at end',
        'Review matrix completeness in design reviews',
        'Use matrix for change impact analysis',
        'Export matrix for technical documentation'
      ]
    }
  ],
  
  examples: [
    {
      scenario: 'Complete Risk Management for Infusion Pump',
      description: 'ISO 14971 compliant risk management from analysis through controls',
      steps: [
        'Create risk management plan defining scope and criteria',
        'Conduct hazard identification workshop with design, clinical, and quality teams',
        'Identify 45 hazards across energy, biological, operational categories',
        'Perform FMEA risk analysis, calculate initial risk levels',
        'Find 8 unacceptable risks requiring control measures',
        'Implement inherent safe design: Add occlusion detection sensor',
        'Add protective measures: Alarm systems, dose limits, anti-free-flow valve',
        'Add safety information: Training requirements, user warnings',
        'Verify control effectiveness through testing',
        'Re-assess residual risks - all now acceptable',
        'Complete risk-benefit analysis',
        'Generate risk management report for submission'
      ],
      expectedOutcome: 'Complete ISO 14971 compliant risk management file'
    }
  ],
  
  bestPractices: [
    'Conduct risk analysis early and update continuously',
    'Use structured methods (FMEA, FTA) for consistency',
    'Involve multi-disciplinary teams in risk identification',
    'Follow ISO 14971 risk control hierarchy strictly',
    'Verify all risk controls with objective evidence',
    'Schedule design reviews at key project milestones',
    'Maintain complete traceability matrix throughout development',
    'Update risk assessment after any design change',
    'Document all risk management decisions and rationale',
    'Include usability risks and use errors in analysis',
    'Consider entire product lifecycle in risk assessment',
    'Link risk management to design controls for efficiency'
  ],
  
  relatedModules: [
    'product-management',
    'document-studio',
    'compliance-gap-analysis',
    'clinical-trials'
  ],
  
  quickReference: {
    shortcuts: [
      { key: 'R → N', action: 'Create new risk', context: 'From risk management page' },
      { key: 'D → R', action: 'Schedule design review' }
    ],
    commonTasks: [
      {
        task: 'Create risk assessment',
        steps: ['Navigate to Risk Management', 'New Risk', 'Identify hazard', 'Estimate severity & probability', 'Evaluate risk'],
        estimatedTime: '15-30 minutes per risk'
      },
      {
        task: 'Schedule design review',
        steps: ['Design tab', 'Reviews', 'Schedule Review', 'Select type & participants', 'Set agenda'],
        estimatedTime: '10 minutes'
      }
    ],
    cheatSheet: [
      {
        title: 'Risk Control Hierarchy',
        description: '1. Inherent Safety > 2. Protective Measures > 3. Information'
      },
      {
        title: 'Risk Formula',
        description: 'Risk = Severity × Probability'
      },
      {
        title: 'Design Review Types',
        description: 'Concept → Input → Output → Transfer → Final'
      }
    ]
  }
};
