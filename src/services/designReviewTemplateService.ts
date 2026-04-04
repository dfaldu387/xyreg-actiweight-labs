export interface DesignReviewTemplate {
  generalInfo: {
    projectName: string;
    reviewDate: string;
    developmentPhase: string;
    reviewType: string;
  };
  attendees: Array<{
    title: string;
    required: boolean;
  }>;
  phaseSpecificContent: DesignReviewSection[];
  decision: {
    options: string[];
    actionItems: ActionItem[];
  };
  approvals: Array<{
    role: string;
    required: boolean;
  }>;
}

export interface DesignReviewSection {
  id: string;
  title: string;
  content: string;
  section_type: 'checklist' | 'form' | 'table';
  phase_specific_data?: Record<string, any>;
  required: boolean;
  order: number;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

export class DesignReviewTemplateService {
  static getPhaseSpecificContent(phase: string): DesignReviewSection[] {
    const phaseContent: Record<string, DesignReviewSection[]> = {
      'concept': [
        {
          id: 'concept-feasibility',
          title: 'Concept Feasibility Assessment',
          content: 'Review the business case, market analysis, and technical feasibility of the proposed device concept.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Business case clearly defines value proposition and market opportunity',
              'Technical feasibility assessment demonstrates concept viability',
              'Preliminary user needs and intended use are documented',
              'High-level regulatory pathway is identified',
              'Resource requirements and timeline are realistic',
              'Key risks and mitigation strategies are outlined'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'concept-requirements',
          title: 'Initial Requirements Definition',
          content: 'Evaluate the completeness and clarity of initial stakeholder requirements.',
          section_type: 'form',
          phase_specific_data: {
            fields: [
              { label: 'User Needs Documentation Status', type: 'textarea' },
              { label: 'Intended Use Statement', type: 'textarea' },
              { label: 'Key Performance Requirements', type: 'textarea' },
              { label: 'Safety and Risk Considerations', type: 'textarea' }
            ]
          },
          required: true,
          order: 2
        }
      ],
      'design_input': [
        {
          id: 'input-completeness',
          title: 'Design Input Completeness Review',
          content: 'Verify that all design inputs are complete, unambiguous, and traceable to user needs.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'User needs specification is complete and approved',
              'Design input requirements are clearly documented',
              'Performance specifications are quantifiable and measurable',
              'Safety requirements are comprehensive and specific',
              'Regulatory requirements and standards are identified',
              'Interface requirements are defined',
              'Environmental and operational requirements are specified'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'input-traceability',
          title: 'Requirements Traceability',
          content: 'Review the traceability matrix linking user needs to design inputs.',
          section_type: 'form',
          phase_specific_data: {
            fields: [
              { label: 'Traceability Matrix Status', type: 'textarea' },
              { label: 'Untraced Requirements', type: 'textarea' },
              { label: 'Verification Strategy Overview', type: 'textarea' }
            ]
          },
          required: true,
          order: 2
        }
      ],
      'design_output': [
        {
          id: 'output-specifications',
          title: 'Design Output Review',
          content: 'Evaluate design outputs for completeness and manufacturing readiness.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Detailed drawings and specifications are complete',
              'Bill of materials (BOM) is accurate and detailed',
              'Software architecture and documentation are complete',
              'Manufacturing processes are defined',
              'Labeling and packaging designs are finalized',
              'Installation and service documentation is complete',
              'Design outputs meet all design input requirements'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'output-verification-planning',
          title: 'Verification and Validation Planning',
          content: 'Review plans for verification and validation activities.',
          section_type: 'form',
          phase_specific_data: {
            fields: [
              { label: 'Verification Protocol Status', type: 'textarea' },
              { label: 'Test Methods and Acceptance Criteria', type: 'textarea' },
              { label: 'Validation Planning Status', type: 'textarea' }
            ]
          },
          required: true,
          order: 2
        }
      ],
      'verification': [
        {
          id: 'verification-results',
          title: 'Verification Test Results Review',
          content: 'Review and evaluate all verification testing results against acceptance criteria.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'All verification protocols have been executed',
              'Test results meet established acceptance criteria',
              'Non-conformances have been addressed and documented',
              'Verification reports are complete and approved',
              'Traceability to design inputs is maintained',
              'Test equipment calibration is current and documented'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'verification-issues',
          title: 'Verification Issues and Resolutions',
          content: 'Document any verification issues and their resolutions.',
          section_type: 'form',
          phase_specific_data: {
            fields: [
              { label: 'Outstanding Verification Issues', type: 'textarea' },
              { label: 'Resolution Plans and Timeline', type: 'textarea' },
              { label: 'Impact Assessment', type: 'textarea' }
            ]
          },
          required: true,
          order: 2
        }
      ],
      'validation': [
        {
          id: 'validation-clinical',
          title: 'Clinical and Usability Validation',
          content: 'Review clinical evaluation and usability validation results.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Clinical evaluation plan has been executed',
              'Clinical data supports safety and effectiveness',
              'Usability validation demonstrates safe and effective use',
              'User feedback has been incorporated into design',
              'Risk-benefit analysis supports device approval',
              'Post-market surveillance plan is established'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'validation-manufacturing',
          title: 'Process Validation Review',
          content: 'Review manufacturing process validation activities.',
          section_type: 'form',
          phase_specific_data: {
            fields: [
              { label: 'Process Validation Status', type: 'textarea' },
              { label: 'Installation/Operational/Performance Qualification Results', type: 'textarea' },
              { label: 'Manufacturing Readiness Assessment', type: 'textarea' }
            ]
          },
          required: true,
          order: 2
        }
      ],
      'transfer': [
        {
          id: 'transfer-readiness',
          title: 'Design Transfer Readiness',
          content: 'Assess readiness for full-scale manufacturing and commercial release.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Manufacturing processes are validated and documented',
              'Production equipment is qualified and operational',
              'Quality control procedures are established',
              'Personnel training is complete',
              'Supply chain is validated and contracts are in place',
              'Regulatory submissions are approved or on track'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'transfer-documentation',
          title: 'Documentation Transfer Review',
          content: 'Review completeness of documentation transfer to manufacturing.',
          section_type: 'form',
          phase_specific_data: {
            fields: [
              { label: 'Design History File (DHF) Status', type: 'textarea' },
              { label: 'Device Master Record (DMR) Status', type: 'textarea' },
              { label: 'Manufacturing Documentation Transfer', type: 'textarea' }
            ]
          },
          required: true,
          order: 2
        }
      ],
      'bl-1': [
        {
          id: 'bl1-identity-checklist',
          title: 'Identity & Business Case Checklist',
          content: 'Baseline 1 Identity Lock — Verify the project identity and business case are sound enough to invest in design.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'All 26 Genesis Steps completed and signed off',
              'Intended use / indications for use statement documented and reviewed',
              'Device classification and regulatory pathway confirmed (EU MDR / FDA / IVDR)',
              'Preliminary risk assessment completed (initial hazard identification per ISO 14971)',
              'Market and competitive landscape validation documented',
              'Project plan and resource allocation reviewed and approved',
              'IP landscape assessment completed (freedom-to-operate analysis)'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'bl1-concept-readiness',
          title: 'Concept Readiness Assessment',
          content: 'Confirm each area has been reviewed. Use the comment field for any notes or change requests.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Intended Use Statement reviewed and confirmed',
              'Regulatory Pathway Rationale reviewed and confirmed',
              'Key Risks and Initial Mitigation Strategy reviewed and confirmed'
            ],
            comment_field: { label: 'Reviewer Comments', type: 'textarea' }
          },
          required: true,
          order: 2
        }
      ],
      'bl-2': [
        {
          id: 'bl2-input-checklist',
          title: 'Design Input Completeness Checklist',
          content: 'Baseline 2 Input Lock — Verify design inputs are complete, traceable, and risk-controlled enough to build against.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'User Needs specification complete and approved',
              'System Requirements (SYSR) traceable to User Needs',
              'Software Requirements (SWR) traceable to System Requirements',
              'Full UN → SYSR → SWR traceability matrix reviewed and approved',
              'ISO 14971 risk analysis complete (all hazards identified, RPN scored)',
              'Risk control measures defined for all unacceptable risks',
              'Standards applicability checklist completed (IEC 60601, IEC 62304, IEC 62366, etc.)',
              'Design inputs reviewed against all applicable standards'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'bl2-traceability-status',
          title: 'Traceability & Risk Status',
          content: 'Confirm each area has been reviewed. Use the comment field for any notes or change requests.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Traceability Matrix coverage reviewed and confirmed',
              'All requirements traced (no gaps remaining)',
              'Risk Analysis reviewed and confirmed (hazard count, unacceptable risks)',
              'Standards Gap Status reviewed and confirmed'
            ],
            comment_field: { label: 'Reviewer Comments', type: 'textarea' }
          },
          required: true,
          order: 2
        }
      ],
      'bl-3': [
        {
          id: 'bl3-product-checklist',
          title: 'Product Readiness Checklist',
          content: 'Baseline 3 Product Lock — Verify the product is safe, effective, and ready for regulatory submission.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Verification testing 100% complete (all protocols executed, all acceptance criteria met)',
              'Validation testing complete (clinical evaluation and/or usability validation)',
              'Risk management report finalized (residual risk acceptable per ISO 14971)',
              'IEC 62366-1 usability engineering file complete',
              'Technical File / Design History File complete and audit-ready',
              'Labeling and Instructions for Use (IFU) reviewed and approved',
              'Post-market surveillance plan established',
              'Manufacturing process validation complete (IQ/OQ/PQ)'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'bl3-submission-readiness',
          title: 'Submission Readiness Assessment',
          content: 'Confirm each area has been reviewed. Use the comment field for any notes or change requests.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'All verification failures resolved or accepted with rationale',
              'Residual Risk Acceptability reviewed and confirmed',
              'Regulatory Submission Timeline reviewed and confirmed'
            ],
            comment_field: { label: 'Reviewer Comments', type: 'textarea' }
          },
          required: true,
          order: 2
        }
      ]
    };

    // Fuzzy mapping: company phase names → template keys
    const normalizedPhase = phase.toLowerCase();
    const fuzzyKey = Object.keys(phaseContent).find(key => key === normalizedPhase)
      || (normalizedPhase.includes('concept') ? 'concept' : null)
      || (normalizedPhase.includes('design input') ? 'design_input' : null)
      || (normalizedPhase.includes('design') && normalizedPhase.includes('dev') ? 'design_output' : null)
      || (normalizedPhase.includes('verification') || normalizedPhase.includes('validation') ? 'verification' : null)
      || (normalizedPhase.includes('transfer') || normalizedPhase.includes('production') ? 'transfer' : null)
      || (normalizedPhase.includes('market') || normalizedPhase.includes('surveillance') ? 'post_market' : null);

    if (fuzzyKey && phaseContent[fuzzyKey]) {
      return phaseContent[fuzzyKey];
    }

    // Generic fallback — no more defaulting to Concept
    return [
      {
        id: 'general-checklist',
        title: 'General Review Checklist',
        content: 'Verify each item has been reviewed and addressed.',
        section_type: 'checklist' as const,
        phase_specific_data: {
          items: [
            'All User Needs reviewed and current (UN-xxx)',
            'System Requirements traceable to User Needs (SYSR-xxx)',
            'Risk Analysis reviewed — all hazards scored (ISO 14971)',
            'Verification test results reviewed against acceptance criteria',
            'Open findings from previous Design Reviews addressed',
            'Document status: all required documents approved or in-progress'
          ],
          comment_field: { label: 'Reviewer Comments', type: 'textarea' }
        },
        required: true,
        order: 0
      }
    ];
  }

  static generateTemplate(phase: string): DesignReviewTemplate {
    return {
      generalInfo: {
        projectName: '',
        reviewDate: new Date().toISOString().split('T')[0],
        developmentPhase: phase,
        reviewType: 'Phase Gate Design Review'
      },
      attendees: [
        { title: 'Project Manager (Review Chair)', required: true },
        { title: 'Systems Engineer/Lead Designer', required: true },
        { title: 'Quality Assurance Representative', required: true },
        { title: 'Regulatory Affairs Representative', required: true },
        { title: 'Manufacturing Engineer', required: false },
        { title: 'Independent Reviewer', required: true }
      ],
      phaseSpecificContent: this.getPhaseSpecificContent(phase),
      decision: {
        options: [
          'Approved - Proceed to next phase',
          'Approved with Conditions - Address action items before proceeding',
          'Not Approved - Significant issues must be resolved'
        ],
        actionItems: []
      },
      approvals: [
        { role: 'Review Chair', required: true },
        { role: 'Quality Assurance', required: true }
      ]
    };
  }
}