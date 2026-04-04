import { DocumentTemplate, ProductContext, DocumentSection, DocumentContent } from '@/types/documentComposer';

export interface HardcodedTemplate {
  id: string;
  name: string;
  type: 'company-wide' | 'product-specific';
  description: string;
  category: string;
  template: DocumentTemplate;
}

export class HardcodedTemplateService {
  private static templates: Map<string, HardcodedTemplate> = new Map();

  static {
    // Initialize hardcoded templates
    this.initializeTemplates();
  }

  private static initializeTemplates() {
    // Document Control SOP - Company Wide
    const documentControlSOP: HardcodedTemplate = {
      id: 'document-control-sop',
      name: 'Document Control',
      type: 'company-wide',
      description: 'Standard Operating Procedure for document control system including creation, review, approval, distribution, revision, and archiving',
      category: 'Quality System Procedures',
      template: this.createDocumentControlTemplate()
    };

    this.templates.set(documentControlSOP.id, documentControlSOP);

    // Training SOP - Company Wide (corrected)
    const trainingSOP: HardcodedTemplate = {
      id: 'training',
      name: 'Training',
      type: 'company-wide',
      description: 'Standard Operating Procedure for identifying training needs, providing training, and documenting training activities for all personnel',
      category: 'Quality System Procedures',
      template: this.createTrainingTemplate()
    };

    this.templates.set(trainingSOP.id, trainingSOP);

    // Change Control SOP - Company Wide (corrected)
    const changeControlSOP: HardcodedTemplate = {
      id: 'change-control',
      name: 'Change Control',
      type: 'company-wide',
      description: 'Standard Operating Procedure for requesting, evaluating, approving, implementing, and documenting changes to products, processes, or QMS',
      category: 'Quality System Procedures',
      template: this.createChangeControlTemplate()
    };

    this.templates.set(changeControlSOP.id, changeControlSOP);
  }

  private static createDocumentControlTemplate(): DocumentTemplate {
    const productContext: ProductContext = {
      id: 'company-wide',
      name: 'Company Wide Document',
      riskClass: 'N/A',
      phase: 'Company Level',
      description: 'Company-wide document control procedure',
      regulatoryRequirements: ['ISO 13485', 'FDA 21 CFR 820', 'EU MDR']
    };

    const sections: DocumentSection[] = [
      {
        id: 'header',
        title: 'Document Header',
        order: 0,
        content: [
          {
            id: 'header-title',
            type: 'heading',
            content: 'Standard Operating Procedure: Document Control',
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'header-table',
            type: 'table',
            content: `Document Number: SOP-001 | Version: [Version] | Title: Document Control | Effective Date: [Date]

Issued By: [Issued By Name] | Date: [Date]
Reviewed By: [Reviewed By Name] | Date: [Date]  
Approved By: [Approved By Name] | Date: [Date]`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          }
        ]
      },
      {
        id: 'purpose',
        title: '1.0 Purpose',
        order: 1,
        content: [
          {
            id: 'purpose-content',
            type: 'paragraph',
            content: 'This Standard Operating Procedure (SOP) describes the system for the creation, review, approval, distribution, revision, and archiving of all documents within the [Company Name] Quality Management System (QMS). The purpose is to ensure that all personnel have access to the correct and current versions of documents and that obsolete documents are prevented from unintended use.',
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          }
        ]
      },
      {
        id: 'scope',
        title: '2.0 Scope',
        order: 2,
        content: [
          {
            id: 'scope-content',
            type: 'paragraph',
            content: 'This procedure applies to all QMS documents, including but not limited to, the Quality Manual, Standard Operating Procedures (SOPs), Work Instructions (WIs), templates, forms, and other quality-related documentation, whether in electronic or paper format.',
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          }
        ]
      },
      {
        id: 'responsibilities',
        title: '3.0 Responsibilities',
        order: 3,
        content: [
          {
            id: 'responsibilities-table',
            type: 'table',
            content: `Role | Responsibilities
Head of Quality Assurance | - Manages the overall document control system.
 | - Ensures this procedure is implemented and maintained.
 | - Acts as the final approver for all QMS documents.
 | - Manages the Master Document List.
Document Owner / Author | - Creates or modifies a document.
 | - Ensures the document's content is accurate, clear, and compliant.
 | - Coordinates the review and approval process for their documents.
All Employees | - Are responsible for using only the current and approved versions of documents.
 | - Must be trained on the documents relevant to their roles and responsibilities.`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          }
        ]
      },
      {
        id: 'definitions',
        title: '4.0 Definitions',
        order: 4,
        content: [
          {
            id: 'definitions-content',
            type: 'list',
            content: `Document: Any written or pictorial information describing, defining, specifying, reporting, or certifying activities, requirements, or results.

Document Control: The systematic process of managing documents from creation to archiving to ensure their integrity and availability.

Controlled Document: A document that is managed under the requirements of this SOP. Its distribution is tracked, and revisions are formally communicated.

Master Document List (MDL): A comprehensive, controlled list of all QMS documents, indicating the current revision level and effective date for each.

Document Change Order (DCO): A form used to request, describe, justify, and approve changes to a controlled document.`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          }
        ]
      },
      {
        id: 'procedure',
        title: '5.0 Procedure',
        order: 5,
        content: [
          {
            id: 'procedure-5-1',
            type: 'heading',
            content: '5.1 Document Creation and Identification',
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-1-content',
            type: 'list',
            content: `New documents are created using approved company templates.
Each controlled document is assigned a unique identifier (e.g., SOP-XXX, WI-XXX) by the Quality Assurance (QA) department.`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-2',
            type: 'heading',
            content: '5.2 Document Review and Approval',
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-2-content',
            type: 'list',
            content: `The document author initiates a review process by circulating the draft document to relevant subject matter experts and department heads.
Reviewers provide feedback, and the author incorporates necessary changes.
Once the content is finalized, the author completes a Document Change Order (DCO) form to formally request approval.
The DCO, along with the final document, is routed for approval signatures as defined on the DCO. At a minimum, this includes the author, the relevant department head, and the Head of QA.
Approval is documented with handwritten or validated (ELECTRONIC SIGNATURE) electronic signatures.`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-3',
            type: 'heading',
            content: '5.3 Document Issuance and Distribution',
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-3-content',
            type: 'list',
            content: `Upon final approval, QA updates the Master Document List with the new document information and its effective date.
QA is responsible for distributing the newly effective document to all relevant points of use.
For electronic systems, QA will update the document in the validated electronic document management system (eDMS).
For physical copies, QA will print the document on specially marked "CONTROLLED COPY" paper, record the distribution, and replace the obsolete version.`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-4',
            type: 'heading',
            content: '5.4 Document Changes',
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-4-content',
            type: 'list',
            content: `1. Any change to a controlled document must be initiated via a DCO.
2. The DCO must include a description of the change, the reason for the change, and an assessment of its impact.
3. The DCO follows the same review and approval process as a new document.
4. Upon approval, the document revision level is updated (e.g., from 1.0 to 2.0 for a major change, or 1.1 to 1.2 for a minor change).`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-5',
            type: 'heading',
            content: '5.5 Obsoleting and Archiving Documents',
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          },
          {
            id: 'procedure-5-5-content',
            type: 'list',
            content: `1. When a document is superseded by a new revision, the previous version becomes obsolete.
2. QA is responsible for removing all copies of the obsolete document from points of use.
3. At least one copy of the obsolete document, clearly marked "OBSOLETE," is retained for historical purposes in the document archive for the period defined in SOP-002: Record Control.`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          }
        ]
      },
      {
        id: 'associated-documents',
        title: '6.0 Associated Documents',
        order: 6,
        content: [
          {
            id: 'associated-documents-content',
            type: 'list',
            content: `SOP-002: Record Control
FORM-001-A: Document Change Order (DCO)
LIST-001-B: Master Document List (MDL)`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          }
        ]
      },
      {
        id: 'revision-history',
        title: '7.0 Revision History',
        order: 7,
        content: [
          {
            id: 'revision-history-table',
            type: 'table',
            content: `Version | Date | Author | Summary of Changes
0.1 | [Date] | [Name] | Initial Release`,
            isAIGenerated: false,
            metadata: {
              confidence: 1.0,
              lastModified: new Date(),
              author: 'user'
            }
          }
        ]
      }
    ];

    return {
      id: 'document-control-sop',
      name: 'Document Control',
      type: 'document-control-sop',
      sections,
      productContext,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        estimatedCompletionTime: '2-3 hours'
      }
    };
  }

  private static createTrainingTemplate(): DocumentTemplate {
    const productContext: ProductContext = {
      id: 'company-wide',
      name: 'Company Wide Document',
      riskClass: 'N/A',
      phase: 'Company Level',
      description: 'Company-wide employee training procedure',
      regulatoryRequirements: ['ISO 13485', 'FDA 21 CFR 820', 'EU MDR']
    };

    const sections: DocumentSection[] = [
      {
        id: 'header',
        title: 'Document Header',
        order: 0,
        content: [
          {
            id: 'header-title',
            type: 'heading',
            content: 'Standard Operating Procedure: Training',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'header-table',
            type: 'table',
            content: `Document Number: SOP-005 | Version: [Version] | Title: Training | Effective Date: [Date]

Issued By: [Name, Title] | Date: [Date]
Reviewed By: [Name, Title] | Date: [Date]  
Approved By: [Name, Title (e.g., Head of Quality)] | Date: [Date]`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'purpose',
        title: '1.0 Purpose',
        order: 1,
        content: [
          {
            id: 'purpose-content',
            type: 'paragraph',
            content: 'This procedure describes the process for identifying training needs, providing training, and documenting training activities for all personnel whose activities affect product quality. The purpose is to ensure that all employees are competent on the basis of appropriate education, training, skills, and experience.',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'scope',
        title: '2.0 Scope',
        order: 2,
        content: [
          {
            id: 'scope-content',
            type: 'paragraph',
            content: 'This procedure applies to all [Company Name] employees (full-time, part-time, and temporary) whose work impacts the safety, performance, or quality of the medical devices.',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'responsibilities',
        title: '3.0 Responsibilities',
        order: 3,
        content: [
          {
            id: 'responsibilities-table',
            type: 'table',
            content: `Role | Responsibilities
Head of Quality Assurance | • Manages the overall training program.
 | • Ensures training records are maintained and complete.
Department Managers | • Identify training needs for their personnel.
 | • Ensure completion of required training.
 | • Assess employee competency and performance.
Quality Assurance | • Provides QMS-specific training.
 | • Reviews and approves training content.
 | • Audits training effectiveness.
All Employees | • Complete required training programs.
 | • Maintain competency in assigned responsibilities.
 | • Report training needs to supervisors.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'definitions',
        title: '4.0 Definitions',
        order: 4,
        content: [
          {
            id: 'definitions-content',
            type: 'list',
            content: `• Competence: The demonstrated ability to apply knowledge and skills.

• Training: The process of teaching or learning a skill or job.

• Training Matrix: A document that maps the required training courses and procedures to specific job roles or individuals.

• Training Record: A record that provides evidence that training has occurred (e.g., training sign-in sheet, certificate of completion, completed quiz).`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'procedure',
        title: '5.0 Procedure',
        order: 5,
        content: [
          {
            id: 'procedure-5-1',
            type: 'heading',
            content: '5.1 Identification of Training Needs',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-1-content',
            type: 'list',
            content: `1. Each department manager, in consultation with HR and QA, shall identify the competency and training requirements for each job function within their department.
2. These requirements are documented in job descriptions and in the Training Matrix (LIST-005-A).
3. Training needs are also identified when:
   - A new employee is hired.
   - An employee changes roles.
   - New procedures or equipment are introduced.
   - Performance deficiencies are identified.
   - Regulatory requirements change.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-2',
            type: 'heading',
            content: '5.2 Planning and Delivering Training',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-2-content',
            type: 'list',
            content: `1. Training can be delivered through various methods, including:
   - On-the-job training (OJT) by a qualified employee.
   - Classroom-style training (internal or external).
   - Self-reading of documents.
   - E-learning modules.
2. The department manager is responsible for ensuring the training is scheduled and that the selected trainer is qualified to provide the training.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-3',
            type: 'heading',
            content: '5.3 Documentation of Training',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-3-content',
            type: 'list',
            content: `1. All completed training must be documented.
2. For group training sessions, a Training Roster (FORM-005-B) shall be used to record the topic, date, trainer, and attendees' signatures.
3. For self-reading, the employee will sign a form or electronic record acknowledging they have read and understood the document.
4. Copies of certificates from external training courses shall be provided to HR and QA.
5. All training records are considered quality records and must be filed in the employee's training file, which is maintained by the QA department.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-4',
            type: 'heading',
            content: '5.4 Assessment of Training Effectiveness',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-4-content',
            type: 'list',
            content: `1. The effectiveness of training shall be evaluated to ensure that the employee has understood the material and can perform the task competently.
2. Effectiveness can be assessed through:
   ○ Written or verbal quizzes.
   ○ Direct observation of the employee performing the task by their manager.
   ○ Review of work for errors.
3. The method of effectiveness assessment and the results shall be documented in the employee's training record.
4. If training is found to be ineffective, retraining must be provided and documented.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'associated-documents',
        title: '6.0 Associated Documents',
        order: 6,
        content: [
          {
            id: 'associated-documents-content',
            type: 'list',
            content: `LIST-005-A: Training Matrix
FORM-005-B: Training Roster`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'revision-history',
        title: '7.0 Revision History',
        order: 7,
        content: [
          {
            id: 'revision-history-table',
            type: 'table',
            content: `Version | Date | Author | Summary of Changes
1.0 | [Date] | [Name] | Initial Release`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      }
    ];

    return {
      id: 'training',
      name: 'Training',
      type: 'training',
      sections,
      productContext,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        estimatedCompletionTime: '2-3 hours'
      }
    };
  }

  private static createChangeControlTemplate(): DocumentTemplate {
    const productContext: ProductContext = {
      id: 'company-wide',
      name: 'Company Wide Document',
      riskClass: 'N/A',
      phase: 'Company Level',
      description: 'Company-wide change control procedure',
      regulatoryRequirements: ['ISO 13485', 'FDA 21 CFR 820', 'EU MDR']
    };

    const sections: DocumentSection[] = [
      {
        id: 'header',
        title: 'Document Header',
        order: 0,
        content: [
          {
            id: 'header-title',
            type: 'heading',
            content: 'Standard Operating Procedure: Change Control',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'header-table',
            type: 'table',
            content: `Document Number: SOP-004 | Version: [Version] | Title: Change Control | Effective Date: [Date]

Issued By: [Name, Title] | Date: [Date]
Reviewed By: [Name, Title] | Date: [Date]  
Approved By: [Name, Title (e.g., Head of Quality)] | Date: [Date]`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'purpose',
        title: '1.0 Purpose',
        order: 1,
        content: [
          {
            id: 'purpose-content',
            type: 'paragraph',
            content: 'This Standard Operating Procedure (SOP) establishes the requirements and procedures for controlling changes to processes, products, documents, and systems within [Company Name] to ensure all changes are properly evaluated, approved, and implemented.',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      },
      {
        id: 'scope',
        title: '2.0 Scope',
        order: 2,
        content: [
          {
            id: 'scope-content',
            type: 'paragraph',
            content: 'This procedure applies to all changes affecting products, processes, equipment, software, documents, facilities, or any element that could impact product quality, safety, or regulatory compliance.',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          }
        ]
      }
    ];

    return {
      id: 'change-control',
      name: 'Change Control',
      type: 'change-control',
      sections,
      productContext,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        estimatedCompletionTime: '2-3 hours'
      }
    };
  }

  static getTemplate(templateId: string): HardcodedTemplate | null {
    return this.templates.get(templateId) || null;
  }

  static getAllTemplates(): HardcodedTemplate[] {
    return Array.from(this.templates.values());
  }

  static getCompanyWideTemplates(): HardcodedTemplate[] {
    return this.getAllTemplates().filter(t => t.type === 'company-wide');
  }

  static getProductSpecificTemplates(): HardcodedTemplate[] {
    return this.getAllTemplates().filter(t => t.type === 'product-specific');
  }

  static hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  static customizeTemplateForCompany(template: DocumentTemplate, companyName: string): DocumentTemplate {
    // Replace placeholders with actual company name
    const customizedSections = template.sections.map(section => ({
      ...section,
      content: section.content.map(content => ({
        ...content,
        content: content.content
          .replace(/\[Company Name\]/g, companyName)
          .replace(/\[Date\]/g, new Date().toLocaleDateString())
          .replace(/\[Version\]/g, '1.0')
      }))
    }));

    return {
      ...template,
      sections: customizedSections,
      productContext: {
        ...template.productContext,
        name: `${companyName} - ${template.name}`,
        description: `Company-wide ${template.name} procedure for ${companyName}`
      }
    };
  }
}