/**
 * ISO 13485:2016 section/route configuration for enterprise-level gap analysis.
 * Maps the full ISO 13485 clause hierarchy to enterprise modules.
 */

export interface ISO13485SubItem {
  letter: string;
  description: string;
  detailedDescription?: string;
  route?: string;
}

export interface ISO13485SectionItem {
  section: string;
  title: string;
  description?: string;
  sectionGroup: number;
  sectionGroupName: string;
  type: 'navigate' | 'evidence';
  route?: string;
  iconHint: 'qms' | 'management' | 'resources' | 'realization' | 'measurement' | 'evidence';
  subItems?: ISO13485SubItem[];
  /** If true, this section is commonly excluded by many companies */
  commonlyExcluded?: boolean;
  /** Hint shown to user explaining why this section is often excluded */
  exclusionHint?: string;
}

export const ISO_13485_SECTIONS: ISO13485SectionItem[] = [
  // ── §4 Quality Management System ──
  { section: '4.1', title: 'General requirements', description: 'Establish, document, implement, and maintain a QMS. Define processes, interactions, and criteria for operation. Outsourced processes must be controlled.', sectionGroup: 4, sectionGroupName: 'Quality Management System', type: 'evidence', iconHint: 'qms' },
  { section: '4.2', title: 'Documentation requirements', description: 'Maintain quality policy, quality manual, required procedures, medical device file, and records. Control documents and records per documented procedures.', sectionGroup: 4, sectionGroupName: 'Quality Management System', type: 'evidence', iconHint: 'qms',
    subItems: [
      { letter: '1', description: 'General', detailedDescription: 'Define the scope and extent of QMS documentation, considering regulatory requirements, device risk class, and organisational complexity.' },
      { letter: '2', description: 'Quality manual', route: 'quality-manual', detailedDescription: 'Establish and maintain a quality manual including QMS scope, justified exclusions, documented procedures, and process interactions.' },
      { letter: '3', description: 'Medical device file', detailedDescription: 'Create and maintain a medical device file (MDF/DHF) for each device type or family, containing or referencing all conformity evidence.' },
      { letter: '4', description: 'Control of documents', route: 'documents', detailedDescription: 'Establish a documented procedure for document approval, review, update, identification of changes, and availability at points of use.' },
      { letter: '5', description: 'Control of records', detailedDescription: 'Define retention times, storage, protection, retrieval, and disposition of records demonstrating QMS conformity and regulatory compliance.' },
    ],
  },

  // ── §5 Management Responsibility ──
  { section: '5.1', title: 'Management commitment', description: 'Demonstrate top management commitment: communicate regulatory and QMS requirements, establish quality policy and objectives, conduct management reviews, ensure resources.', sectionGroup: 5, sectionGroupName: 'Management Responsibility', type: 'evidence', iconHint: 'management' },
  { section: '5.2', title: 'Customer focus', description: 'Ensure customer and applicable regulatory requirements are determined and met. Provide evidence of customer needs analysis.', sectionGroup: 5, sectionGroupName: 'Management Responsibility', type: 'evidence', iconHint: 'management' },
  { section: '5.3', title: 'Quality policy', description: 'Establish a quality policy that is appropriate, includes commitment to compliance and continual improvement, and is communicated throughout the organisation.', sectionGroup: 5, sectionGroupName: 'Management Responsibility', type: 'evidence', iconHint: 'management' },
  { section: '5.4', title: 'Planning', description: 'Establish measurable quality objectives and plan QMS processes to meet them while maintaining QMS integrity during changes.', sectionGroup: 5, sectionGroupName: 'Management Responsibility', type: 'evidence', iconHint: 'management',
    subItems: [
      { letter: '1', description: 'Quality objectives', detailedDescription: 'Establish measurable quality objectives at relevant functions and levels, ensuring they are consistent with the quality policy.' },
      { letter: '2', description: 'Quality management system planning', detailedDescription: 'Plan QMS processes to meet quality objectives and general requirements, and maintain QMS integrity when changes are planned and implemented.' },
    ],
  },
  { section: '5.5', title: 'Responsibility, authority and communication', description: 'Define organisational responsibilities and authorities. Appoint a management representative. Ensure effective internal communication channels.', sectionGroup: 5, sectionGroupName: 'Management Responsibility', type: 'evidence', iconHint: 'management',
    subItems: [
      { letter: '1', description: 'Responsibility and authority', detailedDescription: 'Define and communicate responsibilities, authorities, and interrelations of all personnel who manage, perform, and verify work affecting quality.' },
      { letter: '2', description: 'Management representative', detailedDescription: 'Appoint a management representative with authority and responsibility to ensure QMS processes are established, maintained, and reported to top management.' },
      { letter: '3', description: 'Internal communication', route: 'communication', detailedDescription: 'Ensure appropriate communication processes are established and that communication takes place regarding QMS effectiveness.' },
    ],
  },
  { section: '5.6', title: 'Management review', description: 'Conduct planned management reviews of the QMS. Review inputs include audit results, customer feedback, process performance, CAPA status, and regulatory changes.', sectionGroup: 5, sectionGroupName: 'Management Responsibility', type: 'navigate', route: 'management-review', iconHint: 'management',
    subItems: [
      { letter: '1', description: 'General', route: 'management-review', detailedDescription: 'Conduct planned management reviews at defined intervals to ensure continuing suitability, adequacy, and effectiveness of the QMS.' },
      { letter: '2', description: 'Review input', route: 'management-review', detailedDescription: 'Define review inputs including audit results, customer feedback, process performance, CAPA status, regulatory changes, and follow-up actions from prior reviews.' },
      { letter: '3', description: 'Review output', route: 'management-review', detailedDescription: 'Document review outputs including decisions on QMS improvements, resource needs, and changes necessary to respond to new or revised regulatory requirements.' },
    ],
  },

  // ── §6 Resource Management ──
  { section: '6.1', title: 'Provision of resources', description: 'Determine and provide resources needed to implement, maintain, and improve the QMS and meet regulatory and customer requirements.', sectionGroup: 6, sectionGroupName: 'Resource Management', type: 'evidence', iconHint: 'resources' },
  { section: '6.2', title: 'Human resources', description: 'Ensure personnel are competent based on education, training, skills, and experience. Maintain training records and evaluate effectiveness.', sectionGroup: 6, sectionGroupName: 'Resource Management', type: 'navigate', route: 'hr', iconHint: 'resources' },
  { section: '6.3', title: 'Infrastructure', description: 'Determine, provide, and maintain infrastructure needed for product conformity: buildings, workspace, equipment, and supporting services.', sectionGroup: 6, sectionGroupName: 'Resource Management', type: 'navigate', route: 'infrastructure', iconHint: 'resources' },
  { section: '6.4', title: 'Work environment and contamination control', description: 'Manage the work environment to achieve product conformity. For sterile/clean devices, document contamination control requirements.', sectionGroup: 6, sectionGroupName: 'Resource Management', type: 'evidence', iconHint: 'resources', commonlyExcluded: true, exclusionHint: 'Often excluded for non-sterile / non-implantable devices with no contamination control requirements',
    subItems: [
      { letter: '1', description: 'Work environment', detailedDescription: 'Determine and manage the work environment needed to achieve conformity to product requirements, including temperature, humidity, lighting, and cleanliness.' },
      { letter: '2', description: 'Contamination control', detailedDescription: 'Document requirements for health, cleanliness, and clothing of personnel if contact could adversely affect product quality. For sterile devices, document contamination control and validation of assembly/packaging.' },
    ],
  },

  // ── §7 Product Realization ──
  { section: '7.1', title: 'Planning of product realization', description: 'Plan the processes needed for product realization, including quality objectives, required documentation, verification, validation, and monitoring activities.', sectionGroup: 7, sectionGroupName: 'Product Realization', type: 'navigate', route: 'compliance-instances', iconHint: 'realization' },
  { section: '7.2', title: 'Customer-related processes', description: 'Determine product requirements (including regulatory), review them before commitment, and maintain communication channels with customers.', sectionGroup: 7, sectionGroupName: 'Product Realization', type: 'evidence', iconHint: 'realization',
    subItems: [
      { letter: '1', description: 'Determination of requirements related to product', detailedDescription: 'Determine requirements specified by the customer, regulatory requirements applicable to the medical device, and any additional requirements determined by the organisation.' },
      { letter: '2', description: 'Review of requirements related to product', detailedDescription: 'Review product requirements before commitment to supply, ensuring requirements are defined, differences resolved, and the organisation can meet them.' },
      { letter: '3', description: 'Communication', detailedDescription: 'Implement effective arrangements for communicating with customers regarding product information, enquiries, contracts, and customer feedback including complaints.' },
    ],
  },
  { section: '7.3', title: 'Design and development', description: 'Plan, control, and document design and development: inputs, outputs, reviews, verification, validation, transfer, and change control.', sectionGroup: 7, sectionGroupName: 'Product Realization', type: 'evidence', iconHint: 'realization',
    subItems: [
      { letter: '1', description: 'General', detailedDescription: 'Establish documented procedures for design and development and determine the interaction with other processes necessary for effective development.' },
      { letter: '2', description: 'Design and development planning', detailedDescription: 'Plan design and development stages, including reviews, verification, validation, and transfer activities, assigning responsibilities and updating plans as the design evolves.' },
      { letter: '3', description: 'Design and development inputs', detailedDescription: 'Determine inputs relating to functional, performance, safety, and regulatory requirements, usability, and applicable standards. Review inputs for adequacy.' },
      { letter: '4', description: 'Design and development outputs', detailedDescription: 'Document design outputs in a form suitable for verification against inputs. Outputs must address safety, intended use, and essential design characteristics.' },
      { letter: '5', description: 'Design and development review', route: 'design-review', detailedDescription: 'Conduct systematic reviews at suitable stages to evaluate design results, identify problems, and propose necessary actions. Include independent reviewers per §7.3.5.' },
      { letter: '6', description: 'Design and development verification', detailedDescription: 'Perform verification to confirm design outputs meet input requirements. Record results and any necessary actions.' },
      { letter: '7', description: 'Design and development validation', detailedDescription: 'Validate the design to confirm the resulting product can meet requirements for intended use, including clinical evaluation or performance evaluation as appropriate.' },
      { letter: '8', description: 'Design and development transfer', detailedDescription: 'Document and verify transfer activities to ensure design outputs are suitable for manufacturing, including process capabilities and personnel training.' },
      { letter: '9', description: 'Control of design and development changes', detailedDescription: 'Identify, document, review, verify, and validate design changes before implementation. Assess the effect of changes on constituent parts and delivered product.' },
      { letter: '10', description: 'Design and development files', detailedDescription: 'Maintain a design and development file (DHF) for each medical device type or family, containing or referencing records generated to demonstrate conformity to requirements.' },
    ],
  },
  { section: '7.4', title: 'Purchasing', description: 'Evaluate and select suppliers based on ability to meet requirements. Specify purchasing information and verify purchased products.', sectionGroup: 7, sectionGroupName: 'Product Realization', type: 'navigate', route: 'supplier-registry', iconHint: 'realization',
    subItems: [
      { letter: '1', description: 'Purchasing process', route: 'supplier-registry', detailedDescription: 'Establish criteria for evaluation and selection of suppliers based on their ability to provide product that meets requirements. Maintain supplier evaluation records.' },
      { letter: '2', description: 'Purchasing information', detailedDescription: 'Ensure purchasing documents describe the product to be purchased, including specifications, procedures, equipment, personnel qualifications, and QMS requirements.' },
      { letter: '3', description: 'Verification of purchased product', detailedDescription: 'Establish and implement inspection or other activities to ensure purchased product meets specified purchasing requirements. Define verification scope based on supplier evaluation and risk.' },
    ],
  },
  { section: '7.5', title: 'Production and service provision', description: 'Control production/service provision: documented procedures, validated processes, sterilization, identification, traceability, customer property, and preservation.', sectionGroup: 7, sectionGroupName: 'Product Realization', type: 'evidence', iconHint: 'realization', commonlyExcluded: true, exclusionHint: 'Sub-clauses §7.5.2–§7.5.5, §7.5.7, §7.5.10 are commonly excluded for non-sterile software or non-serviced devices',
    subItems: [
      { letter: '1', description: 'Control of production and service provision', detailedDescription: 'Plan and carry out production and service provision under controlled conditions, including documented procedures, qualified infrastructure, and monitoring/measuring activities.' },
      { letter: '2', description: 'Cleanliness of product', detailedDescription: 'Document requirements for product cleanliness or contamination control if the product is cleaned before sterilisation, supplied non-sterile for subsequent cleaning, or cannot be cleaned and cleanliness is significant in use.' },
      { letter: '3', description: 'Installation activities', detailedDescription: 'Document requirements for medical device installation and acceptance criteria for verification of installation. If agreed by customer, allow third-party installation with documented requirements.' },
      { letter: '4', description: 'Servicing activities', detailedDescription: 'Document procedures, work instructions, and reference materials for servicing activities. Analyse servicing records as a source of post-market surveillance input.' },
      { letter: '5', description: 'Particular requirements for sterile medical devices', detailedDescription: 'Maintain records of sterilisation process parameters for each sterilisation batch. Sterilisation records must be traceable to each production batch of medical devices.' },
      { letter: '6', description: 'Validation of processes for production and service provision', detailedDescription: 'Validate any process where the resulting output cannot be verified by subsequent monitoring or measurement. This includes software used in production and service provision.' },
      { letter: '7', description: 'Particular requirements for validation of processes for sterilization and sterile barrier systems', detailedDescription: 'Validate sterilisation processes and sterile barrier system processes before initial use. Maintain records of validation results and required revalidation due to changes.' },
      { letter: '8', description: 'Identification', detailedDescription: 'Identify product by suitable means throughout product realisation. Identify product status with respect to monitoring and measurement requirements. Maintain procedures for distinguishing returned devices.' },
      { letter: '9', description: 'Traceability', detailedDescription: 'Establish documented procedures for traceability, defining the extent of traceability per applicable regulatory requirements and the records to be maintained.' },
      { letter: '10', description: 'Customer property', detailedDescription: 'Identify, verify, protect, and safeguard customer property provided for use or incorporation into the product. Report any lost, damaged, or unsuitable customer property.' },
      { letter: '11', description: 'Preservation of product', detailedDescription: 'Preserve conformity of product during internal processing and delivery, including identification, handling, packaging, storage, and protection. Apply preservation to constituent parts.' },
    ],
  },
  { section: '7.6', title: 'Control of monitoring and measuring equipment', description: 'Calibrate or verify monitoring and measuring equipment at specified intervals. Maintain calibration records and assess validity of prior results if found out of calibration.', sectionGroup: 7, sectionGroupName: 'Product Realization', type: 'navigate', route: 'calibration', iconHint: 'realization' },

  // ── §8 Measurement, Analysis and Improvement ──
  { section: '8.1', title: 'General', description: 'Plan and implement monitoring, measurement, analysis, and improvement processes to demonstrate product conformity, QMS conformity, and maintain effectiveness.', sectionGroup: 8, sectionGroupName: 'Measurement, Analysis & Improvement', type: 'evidence', iconHint: 'measurement' },
  { section: '8.2', title: 'Monitoring and measurement', description: 'Implement feedback systems, complaint handling, regulatory reporting, internal audits, and process/product monitoring to ensure ongoing conformity.', sectionGroup: 8, sectionGroupName: 'Measurement, Analysis & Improvement', type: 'evidence', iconHint: 'measurement',
    subItems: [
      { letter: '1', description: 'Feedback', route: 'post-market-surveillance', detailedDescription: 'Gather and monitor information on whether the organisation has met customer requirements. Include feedback as an input to monitoring and risk management processes.' },
      { letter: '2', description: 'Complaint handling', detailedDescription: 'Establish documented procedures for timely complaint handling, including receiving, evaluating, investigating, and determining the need for reporting to regulatory authorities.' },
      { letter: '3', description: 'Reporting to regulatory authorities', detailedDescription: 'Establish documented procedures for reporting to regulatory authorities according to applicable guidance and regulations (e.g., vigilance, MDR, adverse events).' },
      { letter: '4', description: 'Internal audit', route: 'audits', detailedDescription: 'Conduct internal audits at planned intervals to determine whether the QMS conforms to planned arrangements, ISO 13485 requirements, and is effectively implemented and maintained.' },
      { letter: '5', description: 'Monitoring and measurement of processes', detailedDescription: 'Apply suitable methods for monitoring and measurement of QMS processes. Demonstrate the ability of the processes to achieve planned results; take correction and corrective action when results are not achieved.' },
      { letter: '6', description: 'Monitoring and measurement of product', detailedDescription: 'Monitor and measure product characteristics to verify that product requirements have been met at applicable stages of the product realisation process.' },
    ],
  },
  { section: '8.3', title: 'Control of nonconforming product', description: 'Identify, document, segregate, and disposition nonconforming product. Maintain records. Handle nonconformities detected both before and after delivery.', sectionGroup: 8, sectionGroupName: 'Measurement, Analysis & Improvement', type: 'evidence', iconHint: 'measurement',
    subItems: [
      { letter: '1', description: 'General', detailedDescription: 'Ensure nonconforming product is identified and controlled to prevent unintended use or delivery. Document the controls, responsibilities, and authorities for dealing with nonconforming product.' },
      { letter: '2', description: 'Actions in response to nonconforming product detected before delivery', detailedDescription: 'Take action to eliminate the detected nonconformity: rework, accept by concession with justification, or reject/scrap. Document disposition decisions and justifications.' },
      { letter: '3', description: 'Actions in response to nonconforming product detected after delivery', detailedDescription: 'Issue advisory notices and take actions appropriate to the effects of the nonconformity, including investigation, field corrections, or recalls as determined by risk assessment.' },
      { letter: '4', description: 'Rework', detailedDescription: 'Document rework processes in work instructions that have undergone the same authorisation as the original. Assess any adverse effect of the rework upon the product and document the rework performed.' },
    ],
  },
  { section: '8.4', title: 'Analysis of data', description: 'Collect and analyse data to demonstrate QMS suitability, adequacy, and effectiveness. Include data from monitoring, PMS, and supplier performance.', sectionGroup: 8, sectionGroupName: 'Measurement, Analysis & Improvement', type: 'evidence', iconHint: 'measurement' },
  { section: '8.5', title: 'Improvement', description: 'Identify and implement improvements through corrective and preventive actions (CAPA). Investigate root causes, implement corrections, and verify effectiveness.', sectionGroup: 8, sectionGroupName: 'Measurement, Analysis & Improvement', type: 'evidence', iconHint: 'measurement',
    subItems: [
      { letter: '1', description: 'General', detailedDescription: 'Identify and implement changes needed to ensure and maintain the continuing suitability, adequacy, and effectiveness of the QMS through quality policy, objectives, audits, data analysis, CAPA, and management review.' },
      { letter: '2', description: 'Corrective action', detailedDescription: 'Establish a documented procedure for corrective actions: reviewing nonconformities and complaints, determining causes, evaluating action needed, implementing and recording actions, verifying effectiveness, and updating risk documentation.' },
      { letter: '3', description: 'Preventive action', detailedDescription: 'Establish a documented procedure for preventive actions: determining potential nonconformities and their causes, evaluating need for action, planning and implementing action, recording results, and reviewing effectiveness.' },
    ],
  },
];

/** Unique section groups in order */
export const ISO_13485_GROUPS = (() => {
  const seen = new Map<number, string>();
  ISO_13485_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) {
      seen.set(s.sectionGroup, s.sectionGroupName);
    }
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();

/** Find the config entry matching a gap item's section field */
export function findISO13485Config(section: string): ISO13485SectionItem | undefined {
  return ISO_13485_SECTIONS.find(s => s.section === section);
}
