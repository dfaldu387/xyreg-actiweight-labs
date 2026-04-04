import { DocumentTemplate, ProductContext, DocumentSection } from '@/types/documentComposer';
import { DocumentNumberingService } from './documentNumberingService';

export interface ProfessionalTemplate {
  id: string;
  name: string;
  type: 'company-wide' | 'product-specific';
  description: string;
  category: string;
  documentType: 'SOP' | 'FORM' | 'LIST' | 'TEMP';
  documentNumber?: number;
  template: () => Promise<DocumentTemplate>;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  templates: ProfessionalTemplate[];
}

export class ProfessionalTemplateLibraryService {
  private static templates: Map<string, ProfessionalTemplate> = new Map();
  private static categories: Map<string, TemplateCategory> = new Map();

  static {
    this.initializeTemplates();
  }

  private static initializeTemplates() {
    // SOPs Category
    const sopTemplates: ProfessionalTemplate[] = [
      {
        id: 'document-control',
        name: 'Document Control',
        type: 'company-wide',
        description: 'Controls the creation, review, approval, distribution, and maintenance of all QMS documents',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 1,
        template: () => this.createDocumentControlTemplate()
      },
      {
        id: 'record-control',
        name: 'Record Control',
        type: 'company-wide',
        description: 'Controls the identification, storage, protection, retrieval, retention time, and disposition of quality records',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 2,
        template: () => this.createRecordControlTemplate()
      },
      {
        id: 'management-review',
        name: 'Management Review',
        type: 'company-wide',
        description: 'Defines the process for systematic management review of the QMS effectiveness',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 3,
        template: () => this.createManagementReviewTemplate()
      },
      {
        id: 'internal-audit',
        name: 'Internal Audit',
        type: 'company-wide',
        description: 'Establishes requirements for conducting internal audits to verify QMS compliance',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 4,
        template: () => this.createInternalAuditTemplate()
      },
      {
        id: 'training',
        name: 'Training',
        type: 'company-wide',
        description: 'Defines requirements for employee training and competency assessment',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 5,
        template: () => this.createTrainingTemplate()
      },
      {
        id: 'corrective-preventive-action',
        name: 'Corrective and Preventive Action',
        type: 'company-wide',
        description: 'Establishes procedures for CAPA to eliminate causes of nonconformities',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 6,
        template: () => this.createCAPATemplate()
      },
      {
        id: 'product-realization',
        name: 'Product Realization',
        type: 'company-wide',
        description: 'Defines the overall process for planning and executing product development',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 7,
        template: () => this.createProductRealizationTemplate()
      },
      {
        id: 'measurement-monitoring',
        name: 'Measurement and Monitoring',
        type: 'company-wide',
        description: 'Establishes requirements for measurement and monitoring of processes and products',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 8,
        template: () => this.createMeasurementMonitoringTemplate()
      },
      {
        id: 'risk-management',
        name: 'Risk Management',
        type: 'company-wide',
        description: 'Defines the systematic application of management policies, procedures, and practices for risk management',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 9,
        template: () => this.createRiskManagementTemplate()
      },
      {
        id: 'design-controls',
        name: 'Design Controls',
        type: 'company-wide',
        description: 'Establishes procedures for design and development of medical devices',
        category: 'Design & Development',
        documentType: 'SOP',
        documentNumber: 10,
        template: () => this.createDesignControlsTemplate()
      },
      {
        id: 'supplier-control',
        name: 'Supplier Control',
        type: 'company-wide',
        description: 'Defines requirements for evaluation, selection, and control of suppliers',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 11,
        template: () => this.createSupplierControlTemplate()
      },
      {
        id: 'purchasing-controls',
        name: 'Purchasing Controls',
        type: 'company-wide',
        description: 'Establishes controls for purchasing of materials and services',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 12,
        template: () => this.createPurchasingControlsTemplate()
      },
      {
        id: 'production-service-controls',
        name: 'Production and Service Controls',
        type: 'company-wide',
        description: 'Defines requirements for controlled conditions during production and service provision',
        category: 'Operations & Production Control',
        documentType: 'SOP',
        documentNumber: 13,
        template: () => this.createProductionServiceControlsTemplate()
      },
      {
        id: 'measuring-monitoring-equipment',
        name: 'Control of Measuring and Monitoring Equipment',
        type: 'company-wide',
        description: 'Establishes controls for measuring and monitoring equipment to ensure measurement validity',
        category: 'Operations & Production Control',
        documentType: 'SOP',
        documentNumber: 14,
        template: () => this.createMeasuringMonitoringEquipmentTemplate()
      },
      {
        id: 'nonconforming-product',
        name: 'Control of Nonconforming Product',
        type: 'company-wide',
        description: 'Defines procedures for identification and control of nonconforming product',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 15,
        template: () => this.createNonconformingProductTemplate()
      },
      {
        id: 'medical-device-reporting',
        name: 'Medical Device Reporting',
        type: 'company-wide',
        description: 'Establishes procedures for reporting adverse events and device defects to regulatory authorities',
        category: 'Regulatory & Clinical',
        documentType: 'SOP',
        documentNumber: 16,
        template: () => this.createMedicalDeviceReportingTemplate()
      },
      {
        id: 'change-control',
        name: 'Change Control',
        type: 'company-wide',
        description: 'Defines procedures for controlling changes to products, processes, and QMS',
        category: 'Quality System Procedures',
        documentType: 'SOP',
        documentNumber: 17,
        template: () => this.createChangeControlTemplate()
      },
      {
        id: 'software-lifecycle',
        name: 'Software Lifecycle Processes',
        type: 'company-wide',
        description: 'Establishes requirements for software development and maintenance for medical devices',
        category: 'Design & Development',
        documentType: 'SOP',
        documentNumber: 18,
        template: () => this.createSoftwareLifecycleTemplate()
      },
      {
        id: 'clinical-evaluation',
        name: 'Clinical Evaluation',
        type: 'company-wide',
        description: 'Defines procedures for clinical evaluation of medical devices',
        category: 'Regulatory & Clinical',
        documentType: 'SOP',
        documentNumber: 19,
        template: () => this.createClinicalEvaluationTemplate()
      },
      {
        id: 'post-market-surveillance',
        name: 'Post-Market Surveillance',
        type: 'company-wide',
        description: 'Establishes systematic post-market surveillance activities',
        category: 'Regulatory & Clinical',
        documentType: 'SOP',
        documentNumber: 20,
        template: () => this.createPostMarketSurveillanceTemplate()
      },
      {
        id: 'unique-device-identification',
        name: 'Unique Device Identification',
        type: 'company-wide',
        description: 'Defines procedures for UDI system implementation and maintenance',
        category: 'Regulatory & Clinical',
        documentType: 'SOP',
        documentNumber: 21,
        template: () => this.createUDITemplate()
      },
      {
        id: 'sterilization-packaging',
        name: 'Sterilization and Packaging',
        type: 'company-wide',
        description: 'Establishes requirements for sterilization processes and packaging systems',
        category: 'Operations & Production Control',
        documentType: 'SOP',
        documentNumber: 22,
        template: () => this.createSterilizationPackagingTemplate()
      },
      {
        id: 'labeling-controls',
        name: 'Labeling Controls',
        type: 'company-wide',
        description: 'Defines controls for device labeling including design, review, and approval',
        category: 'Operations & Production Control',
        documentType: 'SOP',
        documentNumber: 23,
        template: () => this.createLabelingControlsTemplate()
      },
      {
        id: 'biocompatibility-evaluation',
        name: 'Biocompatibility Evaluation',
        type: 'company-wide',
        description: 'Establishes procedures for biological evaluation of medical devices',
        category: 'Safety & Risk Management',
        documentType: 'SOP',
        documentNumber: 24,
        template: () => this.createBiocompatibilityEvaluationTemplate()
      }
    ];

    // Initialize SOP category
    const sopCategory: TemplateCategory = {
      id: 'quality-system-procedures',
      name: 'Standard Operating Procedures',
      description: 'Complete set of SOPs for medical device QMS compliance',
      templates: sopTemplates
    };
    this.categories.set(sopCategory.id, sopCategory);

    // Register all SOP templates
    sopTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    // Forms Category (25 templates)
    const formTemplates: ProfessionalTemplate[] = [
      {
        id: 'document-change-order',
        name: 'Document Change Order',
        type: 'company-wide',
        description: 'Form for requesting and documenting changes to controlled documents',
        category: 'Forms & Logs',
        documentType: 'FORM',
        documentNumber: 1,
        template: () => this.createDocumentChangeOrderForm()
      },
      {
        id: 'training-record',
        name: 'Training Record',
        type: 'company-wide',
        description: 'Form for documenting individual employee training completion',
        category: 'Forms & Logs',
        documentType: 'FORM',
        documentNumber: 2,
        template: () => this.createTrainingRecordForm()
      },
      {
        id: 'internal-audit-checklist',
        name: 'Internal Audit Checklist',
        type: 'company-wide',
        description: 'Standardized checklist for conducting internal QMS audits',
        category: 'Forms & Logs',
        documentType: 'FORM',
        documentNumber: 3,
        template: () => this.createInternalAuditChecklistForm()
      },
      {
        id: 'corrective-action-request',
        name: 'Corrective Action Request',
        type: 'company-wide',
        description: 'Form for initiating and tracking corrective action requests',
        category: 'Forms & Logs',
        documentType: 'FORM',
        documentNumber: 4,
        template: () => this.createCorrectiveActionRequestForm()
      },
      {
        id: 'design-review-checklist',
        name: 'Design Review Checklist',
        type: 'product-specific',
        description: 'Checklist for conducting design reviews at various development stages',
        category: 'Forms & Logs',
        documentType: 'FORM',
        documentNumber: 5,
        template: () => this.createDesignReviewChecklistForm()
      },
      {
        id: 'training-roster',
        name: 'Training Roster',
        type: 'company-wide',
        description: 'Sign-in sheet for group training sessions',
        category: 'Forms & Logs',
        documentType: 'FORM',
        documentNumber: 5,
        template: () => this.createTrainingRosterForm()
      }
      // Add remaining 19 form templates...
    ];

    // Lists Category (8 templates)
    const listTemplates: ProfessionalTemplate[] = [
      {
        id: 'master-document-list',
        name: 'Master Document List',
        type: 'company-wide',
        description: 'Comprehensive controlled list of all QMS documents',
        category: 'Forms & Logs',
        documentType: 'LIST',
        documentNumber: 1,
        template: () => this.createMasterDocumentList()
      },
      {
        id: 'approved-supplier-list',
        name: 'Approved Supplier List',
        type: 'company-wide',
        description: 'List of qualified and approved suppliers',
        category: 'Forms & Logs',
        documentType: 'LIST',
        documentNumber: 2,
        template: () => this.createApprovedSupplierList()
      },
      {
        id: 'equipment-inventory',
        name: 'Equipment Inventory',
        type: 'company-wide',
        description: 'Comprehensive inventory of production and quality equipment',
        category: 'Forms & Logs',
        documentType: 'LIST',
        documentNumber: 3,
        template: () => this.createEquipmentInventory()
      },
      {
        id: 'training-matrix',
        name: 'Training Matrix',
        type: 'company-wide',
        description: 'Matrix defining required training for each job function',
        category: 'Forms & Logs',
        documentType: 'LIST',
        documentNumber: 5,
        template: () => this.createTrainingMatrix()
      }
      // Add remaining 4 list templates...
    ];

    // Templates Category (3 templates)
    const templateTemplates: ProfessionalTemplate[] = [
      {
        id: 'design-history-file',
        name: 'Design History File Template',
        type: 'product-specific',
        description: 'Template structure for organizing design history file documentation',
        category: 'Forms & Logs',
        documentType: 'TEMP',
        documentNumber: 1,
        template: () => this.createDesignHistoryFileTemplate()
      },
      {
        id: 'technical-file',
        name: 'Technical File Template',
        type: 'product-specific',
        description: 'Template for European technical file documentation',
        category: 'Forms & Logs',
        documentType: 'TEMP',
        documentNumber: 2,
        template: () => this.createTechnicalFileTemplate()
      },
      {
        id: 'clinical-evaluation-plan',
        name: 'Clinical Evaluation Plan Template',
        type: 'product-specific',
        description: 'Template for clinical evaluation planning',
        category: 'Forms & Logs',
        documentType: 'TEMP',
        documentNumber: 3,
        template: () => this.createClinicalEvaluationPlanTemplate()
      }
    ];

    // Initialize other categories
    const formsCategory: TemplateCategory = {
      id: 'forms-logs',
      name: 'Forms & Logs',
      description: 'Forms, checklists, and logs for QMS processes',
      templates: [...formTemplates, ...listTemplates, ...templateTemplates]
    };
    this.categories.set(formsCategory.id, formsCategory);

    // Register all other templates
    [...formTemplates, ...listTemplates, ...templateTemplates].forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Get all templates organized by category
   */
  static getTemplatesByCategory(): TemplateCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get templates by specific category
   */
  static getTemplatesInCategory(categoryId: string): ProfessionalTemplate[] {
    const category = this.categories.get(categoryId);
    return category ? category.templates : [];
  }

  /**
   * Get a specific template by ID
   */
  static getTemplate(templateId: string): ProfessionalTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Search templates by name or description
   */
  static searchTemplates(query: string): ProfessionalTemplate[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Generate a template with company-specific numbering
   */
  static async generateTemplate(templateId: string, companyId: string): Promise<DocumentTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const documentTemplate = await template.template();
    
    // Update document numbers and references
    for (const section of documentTemplate.sections) {
      for (const content of section.content) {
        if (typeof content.content === 'string') {
          content.content = await DocumentNumberingService.updateInternalReferences(
            content.content,
            companyId,
            template.documentType,
            template.documentNumber
          );
        }
      }
    }

    return documentTemplate;
  }

  // Template Creation Methods
  private static async createDocumentControlTemplate(): Promise<DocumentTemplate> {
    // Return the existing document control template from hardcoded service
    // but with dynamic numbering applied
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
      }
      // Add remaining sections...
    ];

    return {
      id: 'document-control',
      name: 'Document Control',
      type: 'document-control',
      sections,
      productContext,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        estimatedCompletionTime: '2-3 hours'
      }
    };
  }

  private static async createTrainingTemplate(): Promise<DocumentTemplate> {
    const productContext: ProductContext = {
      id: 'company-wide',
      name: 'Company Wide Document',
      riskClass: 'N/A',
      phase: 'Company Level',
      description: 'Company-wide training procedure',
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
            content: `Competence: The demonstrated ability to apply knowledge and skills.

Training: The process of teaching or learning a skill or job.

Training Matrix: A document that maps the required training courses and procedures to specific job roles or individuals.

Training Record: A record that provides evidence that training has occurred (e.g., training sign-in sheet, certificate of completion, completed quiz).`,
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
   - Written or verbal quizzes.
   - Direct observation of the employee performing the task by their manager.
   - Review of work for errors.
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

  private static async createChangeControlTemplate(): Promise<DocumentTemplate> {
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
            content: `Document Number: SOP-017 | Version: [Version] | Title: Change Control | Effective Date: [Date]

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
            content: 'This procedure describes the process for requesting, evaluating, approving, implementing, and documenting changes to products, processes, or the Quality Management System (QMS). The purpose is to ensure that all changes are managed in a controlled manner to prevent unintended consequences and to maintain the validated state of processes and the safety and effectiveness of devices.',
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
            content: 'This procedure applies to permanent changes to any approved document, specification, design, process, material, supplier, or equipment that could potentially affect the quality, safety, or effectiveness of a medical device. It does not apply to "like-for-like" changes or routine maintenance.',
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
Head of Quality Assurance | • Manages the overall change control system.
 | • Chairs the Change Control Board (CCB).
 | • Ensures all changes are adequately documented and approved.
Change Initiator | • Any employee who identifies the need for a change.
 | • Responsible for completing a Change Control Request (CCR) with a clear description of and justification for the proposed change.
Change Control Board (CCB) | • A cross-functional team (e.g., QA, RA, R&D, Manufacturing) responsible for reviewing and approving change requests.
 | • Assesses the potential impact of the change on all aspects of the product and QMS.
Task Owners | • Individuals assigned to implement the specific tasks required to execute an approved change.`,
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
            content: `Change Control: A formal process used to ensure that changes to a product or system are introduced in a controlled and coordinated manner.

Change Control Request (CCR): A form used to formally propose a change, describe its justification, and document its impact assessment.

Impact Assessment: A systematic evaluation of the potential effects of a proposed change on the device, including its safety, performance, regulatory status, and manufacturing process.

Verification/Validation: Activities performed to confirm that the change was implemented correctly and did not adversely affect the product or process.`,
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
            content: '5.1 Change Request Initiation',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-1-content',
            type: 'list',
            content: `1. The need for a change is identified. The change initiator completes a Change Control Request (CCR) (FORM-017-A).
2. The CCR must include:
   - A clear description of the proposed change.
   - The justification or reason for the change.
   - The urgency level (routine, urgent, emergency).
   - An initial assessment of the areas potentially affected.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-2',
            type: 'heading',
            content: '5.2 Change Evaluation and Impact Assessment',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-2-content',
            type: 'list',
            content: `1. QA logs the CCR and presents it to the Change Control Board (CCB).
2. The CCB performs a comprehensive impact assessment. This assessment must consider the effect of the change on:
   - Product safety and performance (Risk Management)
   - Regulatory filings and approvals (e.g., does the change require a new 510(k) or a notice to the Notified Body?)
   - Validation status of processes and equipment
   - Supplier qualifications
   - Labeling and Instructions for Use
   - Inventory and work-in-progress
3. The impact assessment is documented on the CCR form.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-3',
            type: 'heading',
            content: '5.3 Change Approval and Planning',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-3-content',
            type: 'list',
            content: `1. Based on the impact assessment, the CCB will decide to approve, reject, or request more information for the proposed change.
2. If the change is approved, a detailed implementation plan is created.
3. The plan must include all tasks required to implement the change, such as updating documents, conducting verification/validation testing, training personnel, and notifying regulatory bodies.
4. Each task is assigned an owner and a due date.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-4',
            type: 'heading',
            content: '5.4 Change Implementation',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-4-content',
            type: 'list',
            content: `1. The assigned task owners execute the implementation plan.
2. All activities, including the results of any verification or validation testing, must be documented and attached to the CCR.
3. The change initiator or a designated project manager oversees the implementation and tracks the completion of all tasks.`,
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-5',
            type: 'heading',
            content: '5.5 Change Closure',
            isAIGenerated: false,
            metadata: { confidence: 1.0, lastModified: new Date(), author: 'user' }
          },
          {
            id: 'procedure-5-5-content',
            type: 'list',
            content: `1. After all implementation tasks are completed, the CCB reviews the evidence to confirm that the change was implemented correctly and effectively.
2. The CCB signs off on the change closure.
3. QA updates the change status to "Closed" and files the completed CCR as a quality record.`,
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
            content: `FORM-017-A: Change Control Request
SOP-009: Risk Management
SOP-010: Design Controls`,
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

  // Placeholder methods for remaining templates - these would contain the full template definitions
  private static async createRecordControlTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createProductRealizationTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createMeasurementMonitoringTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createRiskManagementTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createDesignControlsTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createSupplierControlTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createPurchasingControlsTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createProductionServiceControlsTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createMeasuringMonitoringEquipmentTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createNonconformingProductTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createMedicalDeviceReportingTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createSoftwareLifecycleTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createClinicalEvaluationTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createPostMarketSurveillanceTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createUDITemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createSterilizationPackagingTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createLabelingControlsTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createBiocompatibilityEvaluationTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createDocumentChangeOrderForm(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createTrainingRecordForm(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createInternalAuditChecklistForm(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createCorrectiveActionRequestForm(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createDesignReviewChecklistForm(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createTrainingRosterForm(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createMasterDocumentList(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createApprovedSupplierList(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createEquipmentInventory(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createTrainingMatrix(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createDesignHistoryFileTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createTechnicalFileTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createClinicalEvaluationPlanTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createManagementReviewTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createInternalAuditTemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }

  private static async createCAPATemplate(): Promise<DocumentTemplate> {
    throw new Error('Template not yet implemented');
  }
}