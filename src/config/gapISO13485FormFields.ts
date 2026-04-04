/**
 * ISO 13485:2016 QMS — Clause-Specific Form Field Definitions
 * Enterprise-level guided structure for quality management system (§4.1–8.5).
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const ISO_13485_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // §4 Quality Management System
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    clauseTitle: '4.1 — General Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '4.1_qms_scope',
        stepLabel: 'QMS Scope & Processes',
        requirementText: 'Establish, document, implement, and maintain a QMS. Define processes, their interactions, and criteria for operation.',
        fields: [
          { id: 'qms_scope', label: 'QMS scope statement', type: 'richtext', helpText: 'Define the scope of the QMS including applicable product types, regulatory requirements, and any exclusions with justification.' },
          { id: 'process_map', label: 'Process map / interaction diagram', type: 'doc_reference', helpText: 'Link to the process map showing QMS processes and their interactions.' },
        ],
      },
      {
        id: '4.1_outsourced',
        stepLabel: 'Outsourced Processes',
        requirementText: 'Identify outsourced processes and define controls to ensure they meet requirements.',
        fields: [
          { id: 'outsourced_processes', label: 'Outsourced process controls', type: 'richtext', helpText: 'List outsourced processes and describe how they are controlled (supplier agreements, audits, incoming inspection).' },
        ],
      },
      {
        id: '4.1_software',
        stepLabel: 'Computer Software Validation',
        requirementText: 'Validate computer software used in the QMS, including risk-based approach to validation.',
        fields: [
          { id: 'software_validation', label: 'QMS software validation approach', type: 'richtext', helpText: 'Describe the approach for validating computer software used in QMS processes (e.g., ERP, CAPA, document control systems).' },
          { id: 'software_list_ref', label: 'Validated software inventory', type: 'doc_reference', helpText: 'Link to the validated software inventory.' },
        ],
      },
    ],
  },
  '4.2': {
    clauseTitle: '4.2 — Documentation Requirements',
    evidenceRequired: true,
    steps: [
      {
        id: '4.2_hierarchy',
        stepLabel: 'Documentation Hierarchy',
        requirementText: 'Maintain quality policy, quality manual, required procedures, medical device file, and records.',
        fields: [
          { id: 'doc_hierarchy', label: 'Documentation hierarchy description', type: 'richtext', helpText: 'Describe the documentation hierarchy: Level 1 (Quality Manual/Policy), Level 2 (Procedures/SOPs), Level 3 (Work Instructions), Level 4 (Forms/Records).' },
          { id: 'quality_manual_ref', label: 'Quality manual', type: 'doc_reference', required: true, helpText: 'Link to the quality manual.' },
        ],
      },
      {
        id: '4.2_control',
        stepLabel: 'Document & Record Control',
        requirementText: 'Control documents and records per documented procedures.',
        fields: [
          { id: 'doc_control', label: 'Document control procedure', type: 'richtext', helpText: 'Describe the document control process: approval, review, revision control, distribution, obsolete document handling.' },
          { id: 'doc_control_ref', label: 'Document control SOP', type: 'doc_reference', required: true, helpText: 'Link to the document control procedure.' },
          { id: 'record_control_ref', label: 'Record control SOP', type: 'doc_reference', helpText: 'Link to the record control procedure (retention, storage, retrieval, disposition).' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5 Management Responsibility
  // ═══════════════════════════════════════════════════════════
  '5.1': {
    clauseTitle: '5.1 — Management Commitment',
    evidenceRequired: true,
    steps: [
      {
        id: '5.1_commitment',
        stepLabel: 'Evidence of Commitment',
        requirementText: 'Demonstrate top management commitment to the QMS through communication, policy, objectives, reviews, and resources.',
        fields: [
          { id: 'commitment_evidence', label: 'Management commitment evidence', type: 'richtext', helpText: 'Describe how top management demonstrates commitment: communicating importance of meeting requirements, establishing quality policy/objectives, conducting management reviews, ensuring resources.' },
          { id: 'mgmt_review_ref', label: 'Management review records', type: 'doc_reference', helpText: 'Link to management review meeting minutes/records.' },
        ],
      },
    ],
  },
  '5.2': {
    clauseTitle: '5.2 — Customer Focus',
    evidenceRequired: true,
    steps: [{ id: '5.2_customer', stepLabel: 'Customer Requirements', requirementText: 'Ensure customer and regulatory requirements are determined and met.', fields: [
      { id: 'customer_focus', label: 'Customer needs analysis', type: 'richtext', helpText: 'Describe how customer requirements and applicable regulatory requirements are identified, documented, and met.' },
    ]}],
  },
  '5.3': {
    clauseTitle: '5.3 — Quality Policy',
    evidenceRequired: true,
    steps: [{ id: '5.3_policy', stepLabel: 'Quality Policy', requirementText: 'Establish a quality policy appropriate to the organisation, including commitment to compliance and continual improvement.', fields: [
      { id: 'policy_content', label: 'Quality policy summary', type: 'richtext', helpText: 'Summarize the quality policy. Confirm it includes commitment to meeting requirements, maintaining QMS effectiveness, and is communicated/understood.' },
      { id: 'policy_ref', label: 'Quality policy document', type: 'doc_reference', required: true, helpText: 'Link to the quality policy document.' },
    ]}],
  },
  '5.4': {
    clauseTitle: '5.4 — Planning',
    evidenceRequired: true,
    steps: [
      { id: '5.4_objectives', stepLabel: 'Quality Objectives', requirementText: 'Establish measurable quality objectives at relevant functions and levels.', fields: [
        { id: 'objectives', label: 'Quality objectives', type: 'richtext', helpText: 'List quality objectives. They must be measurable and consistent with the quality policy.' },
        { id: 'objectives_ref', label: 'Quality objectives document', type: 'doc_reference', helpText: 'Link to documented quality objectives.' },
      ]},
      { id: '5.4_planning', stepLabel: 'QMS Planning', requirementText: 'Plan QMS processes and maintain QMS integrity during changes.', fields: [
        { id: 'change_planning', label: 'QMS change planning approach', type: 'richtext', helpText: 'Describe how QMS integrity is maintained when changes are planned and implemented.' },
      ]},
    ],
  },
  '5.5': {
    clauseTitle: '5.5 — Responsibility, Authority and Communication',
    evidenceRequired: true,
    steps: [
      { id: '5.5_org', stepLabel: 'Organisation & Management Representative', requirementText: 'Define responsibilities and authorities. Appoint a management representative.', fields: [
        { id: 'org_chart', label: 'Organisational structure', type: 'richtext', helpText: 'Describe the organisational structure including reporting lines and responsibilities for quality.' },
        { id: 'mgmt_rep', label: 'Management representative details', type: 'richtext', helpText: 'Identify the management representative and describe their authorities for ensuring QMS processes and regulatory compliance.' },
        { id: 'org_chart_ref', label: 'Organisation chart', type: 'doc_reference', helpText: 'Link to the organisation chart.' },
      ]},
    ],
  },
  '5.6': {
    clauseTitle: '5.6 — Management Review',
    evidenceRequired: true,
    steps: [
      { id: '5.6_review', stepLabel: 'Management Review Process', requirementText: 'Conduct planned management reviews with defined inputs and outputs.', fields: [
        { id: 'review_frequency', label: 'Review frequency and inputs', type: 'richtext', helpText: 'Describe review frequency and confirm inputs include: audit results, customer feedback, process performance, product conformity, CAPA status, previous actions, changes, new regulations.' },
        { id: 'review_outputs', label: 'Review outputs', type: 'richtext', helpText: 'Describe typical outputs: improvement decisions, resource needs, QMS changes, regulatory compliance actions.' },
        { id: 'review_record_ref', label: 'Management review records', type: 'doc_reference', required: true, helpText: 'Link to management review meeting records.' },
      ]},
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §6 Resource Management
  // ═══════════════════════════════════════════════════════════
  '6.1': {
    clauseTitle: '6.1 — Provision of Resources',
    evidenceRequired: true,
    steps: [{ id: '6.1_resources', stepLabel: 'Resource Provision', requirementText: 'Determine and provide resources needed for QMS implementation and maintenance.', fields: [
      { id: 'resource_plan', label: 'Resource planning approach', type: 'richtext', helpText: 'Describe how resource needs are identified and provided: budget process, staffing plans, capital equipment planning.' },
    ]}],
  },
  '6.2': {
    clauseTitle: '6.2 — Human Resources',
    evidenceRequired: true,
    steps: [
      { id: '6.2_competence', stepLabel: 'Competence & Training', requirementText: 'Ensure personnel competence based on education, training, skills, and experience.', fields: [
        { id: 'competence_system', label: 'Competence management system', type: 'richtext', helpText: 'Describe how competence requirements are defined, training is provided and evaluated, and records are maintained.' },
        { id: 'training_sop_ref', label: 'Training procedure', type: 'doc_reference', required: true, helpText: 'Link to the training and competence procedure.' },
      ]},
    ],
  },
  '6.3': {
    clauseTitle: '6.3 — Infrastructure',
    evidenceRequired: true,
    steps: [{ id: '6.3_infra', stepLabel: 'Infrastructure Management', requirementText: 'Determine, provide, and maintain infrastructure needed for product conformity.', fields: [
      { id: 'infrastructure', label: 'Infrastructure description', type: 'richtext', helpText: 'Describe buildings, workspace, process equipment, supporting services (IT, utilities), and maintenance activities.' },
      { id: 'maintenance_ref', label: 'Equipment maintenance records', type: 'doc_reference', helpText: 'Link to equipment maintenance program or records.' },
    ]}],
  },
  '6.4': {
    clauseTitle: '6.4 — Work Environment and Contamination Control',
    evidenceRequired: true,
    steps: [
      { id: '6.4_env', stepLabel: 'Work Environment', requirementText: 'Manage the work environment for product conformity and contamination control.', fields: [
        { id: 'work_env', label: 'Work environment requirements', type: 'richtext', helpText: 'Describe environmental requirements: temperature, humidity, cleanliness, ESD controls, and how they are monitored.' },
        { id: 'contamination_control', label: 'Contamination control measures', type: 'richtext', helpText: 'For sterile/clean devices: describe cleanroom classification, gowning procedures, environmental monitoring, and contamination prevention measures.' },
        { id: 'env_monitoring_ref', label: 'Environmental monitoring records', type: 'doc_reference', helpText: 'Link to environmental monitoring records or procedures.' },
      ]},
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §7 Product Realization
  // ═══════════════════════════════════════════════════════════
  '7.1': {
    clauseTitle: '7.1 — Planning of Product Realization',
    evidenceRequired: true,
    steps: [{ id: '7.1_planning', stepLabel: 'Realization Planning', requirementText: 'Plan processes needed for product realization including quality objectives, documentation, V&V, and monitoring.', fields: [
      { id: 'realization_plan', label: 'Product realization planning approach', type: 'richtext', helpText: 'Describe how product realization is planned: quality objectives, required procedures, verification/validation/monitoring activities, and records.' },
      { id: 'risk_mgmt_integration', label: 'Risk management integration', type: 'richtext', helpText: 'Describe how risk management is integrated into product realization planning.' },
    ]}],
  },
  '7.2': {
    clauseTitle: '7.2 — Customer-Related Processes',
    evidenceRequired: true,
    steps: [
      { id: '7.2_requirements', stepLabel: 'Requirement Determination & Review', requirementText: 'Determine and review product requirements including regulatory requirements.', fields: [
        { id: 'req_determination', label: 'Requirement determination process', type: 'richtext', helpText: 'Describe how product requirements are determined: customer-specified, regulatory, intended use, and additional organisational requirements.' },
        { id: 'req_review', label: 'Contract/order review process', type: 'richtext', helpText: 'Describe how requirements are reviewed before commitment to supply, including resolution of differences.' },
      ]},
    ],
  },
  '7.3': {
    clauseTitle: '7.3 — Design and Development',
    evidenceRequired: true,
    steps: [
      { id: '7.3_planning', stepLabel: 'Design Planning & Inputs', requirementText: 'Plan and control design and development. Define inputs including functional, performance, regulatory, and risk management requirements.', fields: [
        { id: 'design_planning', label: 'Design and development planning', type: 'richtext', helpText: 'Describe design phases, review/verification/validation activities, responsibilities, and how design planning is updated as design evolves.' },
        { id: 'design_inputs', label: 'Design input categories', type: 'richtext', helpText: 'List design input categories: functional/performance requirements, applicable regulatory requirements, risk management outputs, usability requirements, standards.' },
        { id: 'design_plan_ref', label: 'Design and development plan', type: 'doc_reference', required: true, helpText: 'Link to a design and development plan.' },
      ]},
      { id: '7.3_outputs', stepLabel: 'Outputs, V&V, Transfer', requirementText: 'Define design outputs, conduct reviews/verification/validation, manage design transfer and changes.', fields: [
        { id: 'design_outputs', label: 'Design output requirements', type: 'richtext', helpText: 'Describe design output requirements: meeting input requirements, providing information for purchasing/production/servicing, acceptance criteria, essential characteristics for safe use.' },
        { id: 'design_vv', label: 'Verification and validation approach', type: 'richtext', helpText: 'Describe V&V approach including use of representative devices, statistical methods, and clinical evaluation where required.' },
        { id: 'design_transfer', label: 'Design transfer process', type: 'richtext', helpText: 'Describe how design outputs are verified as suitable for manufacturing before transfer to production.' },
        { id: 'design_change', label: 'Design change control', type: 'richtext', helpText: 'Describe the design change control process: identification, documentation, review, verification/validation, and approval before implementation.' },
      ]},
    ],
  },
  '7.4': {
    clauseTitle: '7.4 — Purchasing',
    evidenceRequired: true,
    steps: [
      { id: '7.4_purchasing', stepLabel: 'Purchasing Controls', requirementText: 'Evaluate/select suppliers, specify purchasing information, and verify purchased products.', fields: [
        { id: 'supplier_evaluation', label: 'Supplier evaluation and selection', type: 'richtext', helpText: 'Describe criteria for supplier evaluation, approval, and monitoring. Include how supplier capability to meet requirements is assessed.' },
        { id: 'purchasing_info', label: 'Purchasing information requirements', type: 'richtext', helpText: 'Describe how purchasing documents specify product requirements, QMS requirements, and supplier agreements.' },
        { id: 'incoming_inspection', label: 'Verification of purchased product', type: 'richtext', helpText: 'Describe incoming inspection and verification activities, including acceptance criteria and records.' },
        { id: 'supplier_sop_ref', label: 'Supplier management procedure', type: 'doc_reference', required: true, helpText: 'Link to the supplier evaluation and purchasing procedure.' },
      ]},
    ],
  },
  '7.5': {
    clauseTitle: '7.5 — Production and Service Provision',
    evidenceRequired: true,
    steps: [
      { id: '7.5_control', stepLabel: 'Production Control', requirementText: 'Control production and service provision with documented procedures, validated processes, and proper identification/traceability.', fields: [
        { id: 'production_control', label: 'Production control overview', type: 'richtext', helpText: 'Describe controlled conditions: documented procedures, suitable equipment, monitoring/measuring, defined operations for labelling/packaging/sterilization.' },
        { id: 'process_validation', label: 'Process validation approach', type: 'richtext', helpText: 'Describe which processes are validated (output cannot be fully verified by inspection) and the validation approach (IQ/OQ/PQ).' },
        { id: 'traceability', label: 'Identification and traceability system', type: 'richtext', helpText: 'Describe the product identification and traceability system through all stages of production, distribution, and installation.' },
      ]},
      { id: '7.5_sterile', stepLabel: 'Sterile & Special Requirements', requirementText: 'Address sterilization validation, cleanliness, installation, servicing, and customer property.', fields: [
        { id: 'sterilization', label: 'Sterilization and cleanliness', type: 'richtext', helpText: 'Describe sterilization validation, cleanliness requirements, and sterile barrier system controls. State N/A if device is non-sterile.' },
        { id: 'servicing', label: 'Installation and servicing activities', type: 'richtext', helpText: 'Describe installation/servicing procedures and records. State N/A if not applicable.' },
        { id: 'preservation', label: 'Preservation of product', type: 'richtext', helpText: 'Describe controls for handling, storage, packaging, and delivery to maintain product conformity.' },
      ]},
    ],
  },
  '7.6': {
    clauseTitle: '7.6 — Control of Monitoring and Measuring Equipment',
    evidenceRequired: true,
    steps: [{ id: '7.6_calibration', stepLabel: 'Calibration & Control', requirementText: 'Calibrate or verify monitoring and measuring equipment at specified intervals.', fields: [
      { id: 'calibration_system', label: 'Calibration management system', type: 'richtext', helpText: 'Describe the calibration program: equipment inventory, calibration intervals, traceability to national standards, handling of out-of-calibration findings.' },
      { id: 'calibration_sop_ref', label: 'Calibration procedure', type: 'doc_reference', required: true, helpText: 'Link to the calibration management procedure.' },
    ]}],
  },

  // ═══════════════════════════════════════════════════════════
  // §8 Measurement, Analysis and Improvement
  // ═══════════════════════════════════════════════════════════
  '8.1': {
    clauseTitle: '8.1 — General',
    evidenceRequired: true,
    steps: [{ id: '8.1_general', stepLabel: 'Monitoring & Improvement Planning', requirementText: 'Plan and implement monitoring, measurement, analysis, and improvement processes.', fields: [
      { id: 'monitoring_plan', label: 'Monitoring and improvement approach', type: 'richtext', helpText: 'Describe the overall approach to monitoring, measurement, analysis, and improvement of the QMS including statistical techniques used.' },
    ]}],
  },
  '8.2': {
    clauseTitle: '8.2 — Monitoring and Measurement',
    evidenceRequired: true,
    steps: [
      { id: '8.2_feedback', stepLabel: 'Feedback & Complaints', requirementText: 'Implement feedback systems, complaint handling, and regulatory reporting.', fields: [
        { id: 'feedback_system', label: 'Customer feedback system', type: 'richtext', helpText: 'Describe the system for collecting and evaluating customer feedback, including as input to risk management and complaint handling.' },
        { id: 'complaint_handling', label: 'Complaint handling process', type: 'richtext', helpText: 'Describe the complaint handling process: receipt, recording, investigation, trending, and regulatory reporting triggers.' },
        { id: 'complaint_sop_ref', label: 'Complaint handling SOP', type: 'doc_reference', required: true, helpText: 'Link to the complaint handling procedure.' },
      ]},
      { id: '8.2_audits', stepLabel: 'Internal Audit & Process Monitoring', requirementText: 'Conduct internal audits and monitor process/product performance.', fields: [
        { id: 'internal_audit', label: 'Internal audit program', type: 'richtext', helpText: 'Describe the internal audit program: frequency, scope, auditor qualification, independence, and follow-up of findings.' },
        { id: 'process_monitoring', label: 'Process and product monitoring', type: 'richtext', helpText: 'Describe methods for monitoring QMS processes and product conformity, including statistical methods and trending.' },
        { id: 'audit_sop_ref', label: 'Internal audit procedure', type: 'doc_reference', required: true, helpText: 'Link to the internal audit procedure.' },
      ]},
    ],
  },
  '8.3': {
    clauseTitle: '8.3 — Control of Nonconforming Product',
    evidenceRequired: true,
    steps: [{ id: '8.3_nc', stepLabel: 'Nonconformance Control', requirementText: 'Identify, document, segregate, and disposition nonconforming product.', fields: [
      { id: 'nc_process', label: 'Nonconformance handling process', type: 'richtext', helpText: 'Describe the process: identification, documentation, segregation, investigation, disposition (use-as-is, rework, scrap), and notification requirements.' },
      { id: 'nc_post_delivery', label: 'Post-delivery nonconformance handling', type: 'richtext', helpText: 'Describe actions taken when nonconforming product is detected after delivery, including advisory notices and field corrective actions.' },
      { id: 'nc_sop_ref', label: 'Nonconforming product procedure', type: 'doc_reference', required: true, helpText: 'Link to the nonconforming product control procedure.' },
    ]}],
  },
  '8.4': {
    clauseTitle: '8.4 — Analysis of Data',
    evidenceRequired: true,
    steps: [{ id: '8.4_analysis', stepLabel: 'Data Analysis', requirementText: 'Collect and analyse data to demonstrate QMS suitability, adequacy, and effectiveness.', fields: [
      { id: 'data_analysis', label: 'Data analysis approach', type: 'richtext', helpText: 'Describe data sources (feedback, complaints, NC, audit results, PMS, supplier performance), analysis methods, and how results feed into improvement.' },
      { id: 'kpi_dashboard_ref', label: 'Quality metrics / KPIs', type: 'doc_reference', helpText: 'Link to quality KPI dashboard or data analysis records.' },
    ]}],
  },
  '8.5': {
    clauseTitle: '8.5 — Improvement',
    evidenceRequired: true,
    steps: [
      { id: '8.5_capa', stepLabel: 'CAPA Process', requirementText: 'Identify and implement improvements through corrective and preventive actions.', fields: [
        { id: 'capa_process', label: 'CAPA process description', type: 'richtext', helpText: 'Describe the CAPA process: sources of CAPA, root cause investigation methods, action planning, implementation, verification of effectiveness, and closure.' },
        { id: 'capa_sop_ref', label: 'CAPA procedure', type: 'doc_reference', required: true, helpText: 'Link to the corrective and preventive action procedure.' },
      ]},
    ],
  },
};
