
import { CommunicationThread, Participant, Message, Attachment } from '@/types/communications';

// Mock participants representing different stakeholders
const participants: Record<string, Participant> = {
  johnSmith: {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    organization: 'Internal Team',
    isInternal: true
  },
  sarahJohnson: {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    organization: 'Regulatory Affairs',
    isInternal: true
  },
  drMiller: {
    id: '3',
    name: 'Dr. Michael Miller',
    email: 'michael.miller@regulatoryconsult.com',
    organization: 'Regulatory Consultants Inc.',
    isInternal: false
  },
  annaWeber: {
    id: '4',
    name: 'Anna Weber',
    email: 'anna.weber@bsigroup.com',
    organization: 'BSI Group (Notified Body)',
    isInternal: false
  },
  markChen: {
    id: '5',
    name: 'Mark Chen',
    email: 'mark.chen@company.com',
    organization: 'Quality Assurance',
    isInternal: true
  },
  lisaGarcia: {
    id: '6',
    name: 'Lisa Garcia',
    email: 'lisa.garcia@company.com',
    organization: 'Manufacturing',
    isInternal: true
  }
};

// Mock attachments
const mockAttachments: Record<string, Attachment> = {
  dhrFile: {
    id: 'att1',
    fileName: 'DHR_Review_Comments_v2.pdf',
    fileSize: '2.4 MB',
    url: '/documents/dhr-review-comments.pdf'
  },
  auditReport: {
    id: 'att2',
    fileName: 'Internal_Audit_Findings.xlsx',
    fileSize: '1.8 MB',
    url: '/documents/audit-findings.xlsx'
  },
  certificationDocs: {
    id: 'att3',
    fileName: 'CE_Certification_Requirements.docx',
    fileSize: '856 KB',
    url: '/documents/ce-requirements.docx'
  },
  gapAnalysis: {
    id: 'att4',
    fileName: 'Gap_Analysis_Report_Q2.pdf',
    fileSize: '3.2 MB',
    url: '/documents/gap-analysis-q2.pdf'
  }
};

export const mockCommunicationThreads: CommunicationThread[] = [
  {
    id: 'thread1',
    title: 'DHR Document Review - Cardiovascular Device',
    status: 'Active',
    lastActivity: '2024-06-23T14:30:00Z',
    relatedEntity: {
      type: 'Document',
      name: 'Design History Record - CardioFlow Pro'
    },
    participants: [participants.johnSmith, participants.drMiller, participants.sarahJohnson],
    unreadCount: 2,
    messages: [
      {
        id: 'msg1',
        sender: participants.johnSmith,
        content: 'Hi Dr. Miller, we\'ve uploaded the updated DHR for the CardioFlow Pro device. Could you please review the risk management section? We\'ve addressed the previous comments regarding software validation.',
        timestamp: '2024-06-22T09:15:00Z',
        attachments: [mockAttachments.dhrFile]
      },
      {
        id: 'msg2',
        sender: participants.drMiller,
        content: 'Thank you John. I\'ve reviewed the document and the software validation section looks much better. However, I have some concerns about the clinical evaluation section. The predicate device comparison needs more detail.',
        timestamp: '2024-06-22T16:45:00Z',
        attachments: []
      },
      {
        id: 'msg3',
        sender: participants.sarahJohnson,
        content: 'Dr. Miller, I can provide additional clinical data for the predicate comparison. Should we schedule a call this week to discuss the specific requirements?',
        timestamp: '2024-06-23T14:30:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'thread2',
    title: 'Q2 Internal Audit Follow-up',
    status: 'Awaiting Response',
    lastActivity: '2024-06-21T11:20:00Z',
    relatedEntity: {
      type: 'Audit',
      name: 'Q2 2024 Internal Quality Audit'
    },
    participants: [participants.markChen, participants.lisaGarcia, participants.johnSmith],
    unreadCount: 1,
    messages: [
      {
        id: 'msg4',
        sender: participants.markChen,
        content: 'Hi team, I\'ve completed the Q2 internal audit. There are 3 minor non-conformities identified in the manufacturing process. Lisa, could you please review the findings and provide corrective action plans?',
        timestamp: '2024-06-20T13:30:00Z',
        attachments: [mockAttachments.auditReport]
      },
      {
        id: 'msg5',
        sender: participants.lisaGarcia,
        content: 'Thanks Mark. I\'ve reviewed the findings. Two of them are related to documentation control and one is about calibration schedules. I\'ll have the CAPA plans ready by end of week.',
        timestamp: '2024-06-21T11:20:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'thread3',
    title: 'CE Certification Process - MedDevice X1',
    status: 'Active',
    lastActivity: '2024-06-23T16:10:00Z',
    relatedEntity: {
      type: 'Product',
      name: 'MedDevice X1 - Class II'
    },
    participants: [participants.sarahJohnson, participants.annaWeber],
    unreadCount: 0,
    messages: [
      {
        id: 'msg6',
        sender: participants.sarahJohnson,
        content: 'Hi Anna, we\'re ready to submit our technical documentation for the CE certification of MedDevice X1. I\'ve attached the requirements checklist. When would be a good time to schedule the initial review?',
        timestamp: '2024-06-21T10:00:00Z',
        attachments: [mockAttachments.certificationDocs]
      },
      {
        id: 'msg7',
        sender: participants.annaWeber,
        content: 'Hello Sarah, thank you for the submission. I can schedule the initial review for next week. Please ensure all sections of Annex II are complete, particularly the clinical evaluation and post-market surveillance plan.',
        timestamp: '2024-06-23T16:10:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'thread4',
    title: 'Gap Analysis Resolution - MDR Compliance',
    status: 'Closed',
    lastActivity: '2024-06-18T14:45:00Z',
    relatedEntity: {
      type: 'Gap Analysis',
      name: 'MDR Compliance Assessment 2024'
    },
    participants: [participants.johnSmith, participants.sarahJohnson, participants.drMiller],
    unreadCount: 0,
    messages: [
      {
        id: 'msg8',
        sender: participants.johnSmith,
        content: 'Team, I\'ve completed the gap analysis for our MDR compliance. We have 12 gaps identified across different product lines. The detailed report is attached.',
        timestamp: '2024-06-15T09:30:00Z',
        attachments: [mockAttachments.gapAnalysis]
      },
      {
        id: 'msg9',
        sender: participants.sarahJohnson,
        content: 'Thanks John. I\'ve reviewed the gaps. Most are related to clinical data requirements and labeling updates. I\'ll coordinate with the clinical team for the data updates.',
        timestamp: '2024-06-16T14:20:00Z',
        attachments: []
      },
      {
        id: 'msg10',
        sender: participants.drMiller,
        content: 'The analysis looks comprehensive. I\'ve provided comments on the clinical data gaps. With the proposed timeline, you should be compliant within 6 months.',
        timestamp: '2024-06-18T14:45:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'thread5',
    title: 'Manufacturing Process Validation',
    status: 'Active',
    lastActivity: '2024-06-23T10:15:00Z',
    relatedEntity: {
      type: 'Product',
      name: 'SurgicalTool Pro Series'
    },
    participants: [participants.lisaGarcia, participants.markChen],
    unreadCount: 1,
    messages: [
      {
        id: 'msg11',
        sender: participants.lisaGarcia,
        content: 'Mark, we need to discuss the validation protocol for the new sterilization process. The current protocol doesn\'t cover the new temperature ranges we\'re planning to implement.',
        timestamp: '2024-06-22T15:30:00Z',
        attachments: []
      },
      {
        id: 'msg12',
        sender: participants.markChen,
        content: 'Agreed. Let\'s update the validation protocol to include the extended temperature range. I\'ll draft the revision and send it for your review by tomorrow.',
        timestamp: '2024-06-23T10:15:00Z',
        attachments: []
      }
    ]
  },
  {
    id: 'thread6',
    title: 'Supplier Qualification - Component X',
    status: 'Awaiting Response',
    lastActivity: '2024-06-20T16:30:00Z',
    relatedEntity: {
      type: 'Document',
      name: 'Supplier Quality Agreement - TechComponents Ltd'
    },
    participants: [participants.markChen, participants.johnSmith],
    unreadCount: 3,
    messages: [
      {
        id: 'msg13',
        sender: participants.markChen,
        content: 'John, we need to complete the supplier qualification for TechComponents Ltd. Their quality system audit is scheduled for next week. Have you reviewed their ISO 13485 certificate?',
        timestamp: '2024-06-19T11:00:00Z',
        attachments: []
      },
      {
        id: 'msg14',
        sender: participants.johnSmith,
        content: 'Yes, their certificate is valid until 2025. However, I noticed some gaps in their risk management procedures. Should we address these during the audit?',
        timestamp: '2024-06-20T16:30:00Z',
        attachments: []
      }
    ]
  }
];
