import { ModuleContent } from '@/types/onboarding';

export const complianceGapAnalysisModule: ModuleContent = {
  id: 'compliance-gap-analysis',
  translationKey: 'complianceGapAnalysis',
  title: 'Compliance & Gap Analysis',
  category: 'Compliance & Risk',
  estimatedTime: 25,
  difficulty: 'intermediate',
  roles: ['admin', 'company_admin', 'consultant', 'editor'],
  
  overview: {
    description: 'Compliance & Gap Analysis helps you systematically assess your medical device against regulatory requirements, identify gaps, and track remediation efforts across EU MDR, FDA, ISO 13485, and other frameworks.',
    whoUsesIt: 'Regulatory Affairs Managers, Quality Assurance teams, and Consultants use this module to ensure complete compliance before regulatory submissions.',
    keyBenefits: [
      'Automated compliance assessment against multiple frameworks',
      'Gap identification and prioritization',
      'Remediation tracking with progress monitoring',
      'Audit-ready documentation and evidence trails',
      'Risk-based compliance roadmaps'
    ],
    prerequisites: ['Product created', 'Regulatory framework selected', 'Basic document management']
  },
  
  steps: [
    {
      id: 'run-gap-analysis',
      title: 'Running Your First Gap Analysis',
      content: `Gap Analysis systematically compares your current state against regulatory requirements to identify missing documentation, processes, or evidence.

<strong>How to Run:</strong>
1. Navigate to product Compliance tab
2. Click "Run Gap Analysis" button
3. Select regulatory framework (EU MDR, FDA 510(k), ISO 13485, etc.)
4. Choose analysis depth:
   - Quick Scan: High-level overview (5-10 min)
   - Detailed Analysis: Comprehensive assessment (30-60 min)
   - Audit Preparation: Full regulatory readiness review (2-3 hours)
5. System analyzes:
   - Required vs. existing documents
   - Process completeness
   - Evidence sufficiency
   - Regulatory timeline alignment

<strong>Analysis Outputs:</strong>
- Gap identification report
- Compliance percentage by category
- Priority recommendations
- Remediation roadmap
- Timeline estimates`,
      tips: [
        'Run gap analysis early in development to plan ahead',
        'Re-run after major changes or document updates',
        'Use detailed analysis before regulatory submissions',
        'Export reports for stakeholder reviews'
      ],
      commonMistakes: [
        'Running only once at the end of development',
        'Ignoring low-priority gaps that can become critical',
        'Not tracking gap remediation progress'
      ]
    },
    {
      id: 'gap-categories',
      title: 'Understanding Gap Categories',
      content: `Gaps are categorized by type and severity to help you prioritize remediation efforts.

<strong>Gap Types:</strong>

<strong>Documentation Gaps</strong>
- Missing required documents
- Incomplete document sections
- Outdated document versions
- Missing signatures or approvals

<strong>Process Gaps</strong>
- Missing QMS procedures
- Incomplete verification/validation
- Inadequate risk management
- Missing design reviews

<strong>Evidence Gaps</strong>
- Insufficient test data
- Missing clinical evidence
- Incomplete traceability
- Inadequate design history

<strong>Compliance Gaps</strong>
- Missing regulatory certifications
- Expired notified body approvals
- Non-conforming labeling
- Missing post-market surveillance plans

<strong>Severity Levels:</strong>

🔴 <strong>Critical</strong> (Must fix before submission)
- Prevents regulatory approval
- Major compliance violation
- High patient safety risk
- Examples: Missing essential performance, no clinical evaluation

🟡 <strong>Major</strong> (Should fix soon)
- Significant compliance issue
- May delay approval
- Moderate risk
- Examples: Incomplete risk analysis, missing design verification

🟢 <strong>Minor</strong> (Recommend fixing)
- Best practice improvement
- Low risk
- May be questioned in audit
- Examples: Documentation formatting, missing optional annexes`,
      tips: [
        'Always address critical gaps first',
        'Create remediation plans for major gaps',
        'Bundle minor gaps for efficiency'
      ]
    },
    {
      id: 'remediation',
      title: 'Gap Remediation Workflow',
      content: `Turn identified gaps into actionable remediation tasks with progress tracking.

<strong>Remediation Process:</strong>

<strong>1. Gap Review & Assignment</strong>
- Review all identified gaps
- Assign owners for each gap
- Set due dates based on priority
- Allocate resources and budget

<strong>2. Create Remediation Plan</strong>
- Define specific actions required
- Identify dependencies
- Estimate effort and timeline
- Get stakeholder approval

<strong>3. Execute Remediation</strong>
- Complete required documentation
- Implement missing processes
- Gather evidence
- Conduct verification activities
- Link completed work to gap items

<strong>4. Verification</strong>
- Review remediation completeness
- Verify against requirements
- Document evidence
- Obtain approvals
- Mark gap as resolved

<strong>5. Re-Analysis</strong>
- Run gap analysis again
- Confirm gap closure
- Identify any new gaps
- Update compliance metrics

<strong>Tracking Tools:</strong>
- Remediation dashboard showing progress
- Burndown charts for timeline tracking
- Owner accountability reports
- Blocker identification and escalation
- Audit trail of all activities`,
      tips: [
        'Assign realistic due dates with buffer time',
        'Track dependencies between gaps',
        'Hold regular remediation review meetings',
        'Celebrate milestone completions'
      ]
    },
    {
      id: 'frameworks',
      title: 'Multi-Framework Compliance',
      content: `Manage compliance across multiple regulatory frameworks simultaneously.

<strong>Supported Frameworks:</strong>

<strong>EU MDR (Medical Device Regulation)</strong>
- Annex I-XVII requirements
- Technical documentation structure
- Clinical evaluation requirements
- Post-market surveillance obligations
- Classification-specific requirements

<strong>FDA (Food & Drug Administration)</strong>
- 510(k) submission requirements
- PMA (Premarket Approval) documentation
- De Novo pathway requirements
- QSR (Quality System Regulation)
- Design controls (21 CFR 820.30)

<strong>ISO 13485 (QMS Standard)</strong>
- Quality management system requirements
- Process documentation
- Risk management integration
- Verification and validation
- Measurement and monitoring

<strong>ISO 14971 (Risk Management)</strong>
- Risk management process
- Risk analysis requirements
- Risk evaluation criteria
- Risk control measures
- Residual risk assessment

<strong>FDA QMSR (Effective February 2, 2026)</strong>
- Incorporates ISO 13485:2016 by reference
- Replaces standalone 21 CFR Part 820 QSR
- Retained 820.35 (complaints - enhanced requirements)
- Retained 820.45 (labeling - enhanced inspection)
- Retained 820.10 (traceability for life-supporting devices)
- ⚠️ Internal audits NOW subject to FDA inspection
- ⚠️ Supplier audit records NOW subject to FDA inspection  
- ⚠️ Management review records NOW subject to FDA inspection
- Companies may continue using DHF/DMR/DHR terminology per FDA guidance

<strong>Other Frameworks:</strong>
- IVDR (In Vitro Diagnostic Regulation)
- MDSAP (Medical Device Single Audit Program)
- CMDR (Canada Medical Device Regulations)
- TGA (Therapeutic Goods Administration)
- PMDA (Japan regulatory requirements)

<strong>Cross-Framework Features:</strong>
- Identify common requirements across frameworks
- Reuse documentation where applicable
- Flag framework-specific gaps
- Optimize compliance strategy
- Generate framework-specific reports`,
      tips: [
        'Start with primary market framework',
        'Look for overlap to reduce duplication',
        'Maintain framework-specific documentation where required',
        'Plan multi-market strategy early',
        'For US market: Transition to QMSR before February 2, 2026'
      ]
    }
  ],
  
  examples: [
    {
      scenario: 'Preparing for EU MDR Technical Documentation Submission',
      description: 'Complete gap analysis workflow for a Class IIb medical device',
      steps: [
        'Run detailed gap analysis for EU MDR Annex II & III',
        'System identifies 47 gaps: 12 critical, 23 major, 12 minor',
        'Review critical gaps: missing clinical evaluation, incomplete risk management',
        'Assign gaps to team: Clinical to Regulatory, Risk to Quality Engineer',
        'Create remediation plan with 8-week timeline',
        'Execute: Complete clinical literature review, update risk analysis',
        'Upload completed documents and link to gap items',
        'Verify all critical gaps closed',
        'Re-run gap analysis: Now 0 critical, 8 major remaining',
        'Generate compliance report showing 94% readiness',
        'Continue with major gap remediation before submission'
      ],
      expectedOutcome: 'Complete Technical Documentation ready for Notified Body submission'
    },
    {
      scenario: 'Multi-Market Compliance Planning',
      description: 'Simultaneous FDA 510(k) and EU MDR preparation',
      steps: [
        'Run gap analysis for both FDA 510(k) and EU MDR',
        'Identify common gaps: Design verification, risk management, labeling',
        'Create unified remediation plan addressing both frameworks',
        'Address framework-specific gaps separately',
        'Track progress against both frameworks in parallel',
        'Generate separate compliance reports for FDA and EU'
      ],
      expectedOutcome: 'Optimized documentation strategy serving both markets efficiently'
    }
  ],
  
  bestPractices: [
    'Run gap analysis at multiple project phases, not just at the end',
    'Use detailed analysis mode before regulatory submissions',
    'Assign clear ownership for each identified gap',
    'Set realistic remediation timelines with contingency buffers',
    'Track gap remediation progress weekly',
    'Link all completed work back to specific gaps for traceability',
    'Re-run analysis after major product or process changes',
    'Maintain evidence for gap closure (documents, test results, approvals)',
    'Use gap analysis reports in design reviews and management meetings',
    'Export compliance reports for stakeholders and auditors',
    'Address critical gaps immediately - they block submissions',
    'Bundle related gaps for efficient remediation'
  ],
  
  relatedModules: [
    'product-management',
    'document-studio',
    'design-risk-management',
    'audit-management'
  ],
  
  quickReference: {
    shortcuts: [
      { key: 'C → G', action: 'Run gap analysis', context: 'From product page' },
      { key: 'C → R', action: 'View remediation dashboard' }
    ],
    commonTasks: [
      {
        task: 'Run gap analysis',
        steps: ['Navigate to Compliance tab', 'Click "Run Gap Analysis"', 'Select framework', 'Choose depth', 'Review results'],
        estimatedTime: '10-60 minutes'
      },
      {
        task: 'Close a gap',
        steps: ['Complete required work', 'Upload evidence', 'Link to gap item', 'Mark as resolved', 'Verify closure'],
        estimatedTime: 'Varies by gap'
      }
    ],
    cheatSheet: [
      {
        title: 'Gap Severity',
        description: '🔴 Critical = Must fix | 🟡 Major = Should fix | 🟢 Minor = Nice to fix'
      },
      {
        title: 'Analysis Depth',
        description: 'Quick Scan < Detailed Analysis < Audit Preparation'
      },
      {
        title: 'Compliance %',
        description: '(Closed Gaps / Total Gaps) × 100 by category'
      }
    ]
  }
};
