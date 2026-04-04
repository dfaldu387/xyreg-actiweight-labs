import { supabase } from "@/integrations/supabase/client";
import type { DigitalTemplate, DigitalTemplateSection } from "@/types/templateSettings";

export interface DesignReviewTemplate {
  generalInfo: {
    projectName: string;
    reviewId: string;
    date: string;
    time: string;
    location: string;
    designPhase: string;
    reviewType: string;
  };
  attendees: Array<{
    name: string;
    title: string;
    signature: string;
  }>;
  agenda: string;
  inputs: Array<{
    documentId: string;
    title: string;
    status: boolean;
  }>;
  findings: {
    requirements: string;
    riskManagement: string;
    verification: string;
    manufacturing: string;
    regulatory: string;
    previousActions: string;
  };
  outputs: {
    conclusion: 'approved' | 'approved_with_actions' | 'not_approved';
    actionItems: Array<{
      id: string;
      description: string;
      owner: string;
      dueDate: string;
    }>;
  };
  approvals: Array<{
    role: string;
    signature: string;
    date: string;
  }>;
}

export class DigitalTemplateService {
  static getPhaseSpecificContent(phase: string): DigitalTemplateSection[] {
    const phaseContent: Record<string, DigitalTemplateSection[]> = {
      'concept': [
        {
          id: 'concept-requirements',
          title: 'Requirements Review',
          content: 'Confirm that high-level user needs and intended use are clearly defined. Verify market requirements alignment.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'User needs clearly documented',
              'Intended use statement defined',
              'Market requirements identified',
              'High-level safety considerations outlined',
              'Feasibility assessment completed'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'concept-risk',
          title: 'Preliminary Risk Assessment',
          content: 'Review preliminary hazard analysis and early risk identification.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Preliminary hazard analysis completed',
              'Major risks identified',
              'Risk management plan initiated',
              'Safety classification determined'
            ]
          },
          required: true,
          order: 2
        }
      ],
      'design_input': [
        {
          id: 'input-requirements',
          title: 'Design Input Requirements Review',
          content: 'Confirm that all design inputs are complete, unambiguous, and traceable.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'User needs specification complete',
              'Design input requirements documented',
              'Performance requirements defined',
              'Safety requirements specified',
              'Regulatory requirements identified',
              'Standards mapping completed'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'input-traceability',
          title: 'Traceability Matrix Review',
          content: 'Verify traceability from user needs to design inputs.',
          section_type: 'table',
          phase_specific_data: {
            columns: ['User Need', 'Design Input', 'Requirement ID', 'Verification Method'],
            required_fields: ['User Need', 'Design Input']
          },
          required: true,
          order: 2
        }
      ],
      'design_output': [
        {
          id: 'output-specifications',
          title: 'Design Output Specifications Review',
          content: 'Confirm that design outputs meet all design inputs and are suitable for manufacturing.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'CAD drawings and BOMs complete',
              'Software documentation complete',
              'Manufacturing specifications defined',
              'Labeling requirements specified',
              'Packaging design complete',
              'Installation/service instructions drafted'
            ]
          },
          required: true,
          order: 1
        },
        {
          id: 'output-verification-plan',
          title: 'Verification Planning Review',
          content: 'Review verification protocols and acceptance criteria.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Verification protocols defined',
              'Acceptance criteria established',
              'Test methods validated',
              'Equipment requirements identified'
            ]
          },
          required: true,
          order: 2
        }
      ],
      'verification': [
        {
          id: 'verification-results',
          title: 'Verification Results Review',
          content: 'Review verification test results and confirm design outputs meet design inputs.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Verification testing completed',
              'All acceptance criteria met',
              'Test reports reviewed and approved',
              'Non-conformances addressed',
              'Traceability matrix updated'
            ]
          },
          required: true,
          order: 1
        }
      ],
      'validation': [
        {
          id: 'validation-clinical',
          title: 'Clinical/Usability Validation Review',
          content: 'Review validation activities including clinical evaluation and usability testing.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Clinical evaluation plan executed',
              'Usability validation completed',
              'User feedback incorporated',
              'Risk-benefit analysis updated',
              'Post-market surveillance plan defined'
            ]
          },
          required: true,
          order: 1
        }
      ],
      'transfer': [
        {
          id: 'transfer-manufacturing',
          title: 'Manufacturing Readiness Review',
          content: 'Review manufacturing process documentation and production readiness.',
          section_type: 'checklist',
          phase_specific_data: {
            items: [
              'Manufacturing processes documented',
              'Equipment qualification completed',
              'Personnel training completed',
              'Quality control procedures established',
              'Supply chain validated'
            ]
          },
          required: true,
          order: 1
        }
      ]
    };

    return phaseContent[phase.toLowerCase()] || [];
  }

  static generateDesignReviewTemplate(phase: string): DesignReviewTemplate {
    const phaseSpecificSections = this.getPhaseSpecificContent(phase);
    
    return {
      generalInfo: {
        projectName: '',
        reviewId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        designPhase: phase,
        reviewType: 'Phase-Gate Review'
      },
      attendees: [
        { name: '', title: 'Project Manager, Chair', signature: '' },
        { name: '', title: 'Systems Engineering', signature: '' },
        { name: '', title: 'Quality Assurance', signature: '' },
        { name: '', title: 'Regulatory Affairs', signature: '' },
        { name: '', title: 'Independent Reviewer', signature: '' }
      ],
      agenda: `This review covers the ${phase} phase deliverables. The objective is to evaluate the design against requirements and confirm readiness to proceed to the next phase.`,
      inputs: phaseSpecificSections.map(section => ({
        documentId: section.id,
        title: section.title,
        status: false
      })),
      findings: {
        requirements: '',
        riskManagement: '',
        verification: '',
        manufacturing: '',
        regulatory: '',
        previousActions: ''
      },
      outputs: {
        conclusion: 'approved' as const,
        actionItems: []
      },
      approvals: [
        { role: 'Review Chair', signature: '', date: '' },
        { role: 'Quality Assurance', signature: '', date: '' }
      ]
    };
  }

  static async createDigitalTemplate(template: Omit<DigitalTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<DigitalTemplate> {
    // TODO: Implement once types are regenerated
    console.log('Creating digital template:', template);
    return {
      ...template,
      id: 'temp-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async getCompanyDigitalTemplates(companyId: string): Promise<DigitalTemplate[]> {
    // TODO: Implement once types are regenerated
    console.log('Getting digital templates for company:', companyId);
    return [];
  }

  static async updateDigitalTemplate(id: string, updates: Partial<DigitalTemplate>): Promise<DigitalTemplate> {
    // TODO: Implement once types are regenerated
    console.log('Updating digital template:', id, updates);
    return {
      id,
      template_name: 'Design Review',
      template_type: 'activity',
      base_template: 'design_review',
      phase_adaptations: {},
      company_id: updates.company_id || 'temp',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...updates
    };
  }
}