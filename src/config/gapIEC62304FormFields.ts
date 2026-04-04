/**
 * IEC 62304 Clause-Specific Form Field Definitions — Step-by-Step Structure
 *
 * Each clause is split into individual steps matching numbered requirements.
 * Each step has its own requirement text and input fields.
 * Re-uses ClauseFormConfig / ClauseStep / ClauseField types from gapIEC60601FormFields.
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const IEC_62304_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // ═══════════════════════════════════════════════════════════
  // §4 General Requirements
  // ═══════════════════════════════════════════════════════════
  '4.1': {
    clauseTitle: '4.1 — Quality Management System',
    evidenceRequired: false,
    steps: [
      {
        id: '4.1_qms_coverage',
        stepLabel: 'QMS Coverage',
        requirementText: 'Demonstrate that software development is covered under a quality management system compliant with ISO 13485 or equivalent. The QMS must address the full software lifecycle.',
        supplementaryInfo: 'Provide a reference to the QMS certificate (ISO 13485) or the quality manual section covering software development activities.',
        fields: [
          { id: 'qms_standard', label: 'QMS standard applied', type: 'select', helpText: 'Select the quality management standard your organisation is certified to or follows. ISO 13485 is the most common for medical devices. If using ISO 9001, document additional medical device supplements applied.', options: [
            { value: 'iso_13485', label: 'ISO 13485' },
            { value: 'iso_9001_plus', label: 'ISO 9001 + Medical Device supplements' },
            { value: 'other', label: 'Other (specify)' },
          ] },
          { id: 'qms_certificate_ref', label: 'QMS certificate or quality manual reference', type: 'doc_reference', helpText: 'Link your ISO 13485 certificate (issued by a Notified Body or Certification Body) OR your internal Quality Manual document. The linked document must be in "Approved" status. If not yet certified, reference the Quality Manual sections covering software lifecycle activities (planning, design, V&V, maintenance).' },
          { id: 'qms_sw_coverage', label: 'How does the QMS specifically cover software lifecycle activities?', type: 'richtext', helpText: 'Describe which QMS procedures address software development. Reference specific procedure numbers (e.g., SOP-SW-001). Include procedures for: software planning, requirements, design, implementation, testing, release, maintenance, and risk management.', placeholder: 'Describe the QMS sections/procedures that address software development, maintenance, and risk management...' },
        ],
      },
    ],
  },

  '4.2': {
    clauseTitle: '4.2 — Risk Management',
    evidenceRequired: false,
    steps: [
      {
        id: '4.2_risk_process',
        stepLabel: 'Risk Management Process',
        requirementText: 'Show that a risk management process per ISO 14971 is applied to the software. The software risk management process must be integrated into the overall device risk management.',
        supplementaryInfo: 'Reference the risk management plan and show how software-specific risks (including SOUP risks) are identified and controlled.',
        fields: [
          { id: 'risk_mgmt_plan_ref', label: 'Risk management plan reference', type: 'doc_reference', helpText: 'Link your Risk Management Plan (RMP) document. This should be the plan that covers ISO 14971 application to software, including software hazard analysis, SOUP risk evaluation, and software risk control measures. The document must be approved.' },
          { id: 'sw_risk_integration', label: 'How is software risk management integrated with the device-level risk management?', type: 'richtext', helpText: 'Explain the relationship between software risk analysis and the device-level risk management file. Describe how software failure modes feed into the device FMEA/FTA, how software risk control measures are tracked in the overall risk file, and who owns each process.', placeholder: 'Describe the integration approach...' },
          { id: 'risk_standard', label: 'Risk management standard applied', type: 'select', helpText: 'Select the risk management standard your process follows. ISO 14971 is required by IEC 62304. ISO/TR 24971 provides additional guidance for applying ISO 14971 to software.', options: [
            { value: 'iso_14971', label: 'ISO 14971' },
            { value: 'iso_14971_plus_tr24971', label: 'ISO 14971 + ISO/TR 24971' },
            { value: 'other', label: 'Other (specify)' },
          ] },
        ],
      },
    ],
  },

  '4.3': {
    clauseTitle: '4.3 — Software Safety Classification',
    evidenceRequired: false,
    steps: [
      {
        id: '4.3_classification',
        stepLabel: 'Safety Classification',
        requirementText: 'Classify the software system (and each software item, if applicable) into Class A, B, or C based on the possible contribution to a hazardous situation and the severity of resulting harm.',
        supplementaryInfo: 'Class A: No contribution to hazardous situation. Class B: Non-serious injury possible. Class C: Death or serious injury possible. The classification determines which IEC 62304 requirements apply.',
        fields: [
          { id: 'sw_safety_class', label: 'Software safety classification', type: 'select', helpText: 'Select the safety class based on the worst-case severity of harm the software could contribute to. Class A = no possible contribution to a hazardous situation. Class B = possible contribution to non-serious injury. Class C = possible contribution to death or serious injury. When in doubt, classify higher.', options: [
            { value: 'class_a', label: 'Class A — No contribution to hazardous situation' },
            { value: 'class_b', label: 'Class B — Non-serious injury possible' },
            { value: 'class_c', label: 'Class C — Death or serious injury possible' },
          ] },
          { id: 'classification_rationale', label: 'Classification rationale', type: 'richtext', helpText: 'Provide a clear justification for the chosen safety class. Reference the hazard analysis: what hazardous situations could the software contribute to? What is the worst-case severity? The rationale must trace through the causal chain: software failure → system-level effect → hazardous situation → harm.', placeholder: 'Justify the chosen safety class based on the severity of harm the software could contribute to...' },
        ],
      },
      {
        id: '4.3_approval',
        stepLabel: 'Classification Approval',
        requirementText: 'Obtain approval of the software safety classification from qualified personnel. Document the approval evidence.',
        fields: [
          { id: 'classification_approval_evidence', label: 'Classification approval evidence', type: 'doc_reference', helpText: 'Link the document showing formal approval of the safety classification. This could be a signed classification document, a design review record where classification was approved, or meeting minutes. The approver should be qualified (e.g., risk manager, regulatory affairs, senior SW engineer).' },
          { id: 'classification_approver', label: 'Who approved the classification?', type: 'text', helpText: 'Enter the name and role of the person who formally approved the safety classification. This should be someone with authority over risk management decisions (e.g., Risk Manager, QA Manager, or Project Lead).', placeholder: 'Name and role...' },
        ],
      },
    ],
  },

  '4.4': {
    clauseTitle: '4.4 — Legacy Software',
    evidenceRequired: false,
    steps: [
      {
        id: '4.4_1_determination',
        stepLabel: '4.4.1 Legacy Software Determination',
        requirementText: 'Determine whether the software qualifies as LEGACY SOFTWARE — i.e. software that was already on the market prior to applying IEC 62304 and was not developed under this standard.',
        supplementaryInfo: 'Legacy software is defined as software which was legally placed on the market and is still marketed today but for which there is insufficient objective evidence that it was developed in compliance with IEC 62304.',
        fields: [
          { id: 'is_legacy', label: 'Is this software classified as legacy software?', type: 'select', helpText: 'Select "Yes" if the software was developed and placed on the market BEFORE IEC 62304 was applied to it, and there is insufficient evidence of compliance. Select "No" if the software was developed under IEC 62304 from the start, or if this is new development.', options: [
            { value: 'yes', label: 'Yes — developed before IEC 62304 was applied' },
            { value: 'no', label: 'No — developed under IEC 62304 lifecycle' },
          ] },
          { id: 'legacy_justification', label: 'Justification for legacy determination', type: 'richtext', helpText: 'Document when the software was first placed on market, under which regulatory framework, and what development processes were followed (even informally). If not legacy, briefly state that the software was developed under IEC 62304.', placeholder: 'Describe when the software was first placed on market, under which regulatory framework, and why it qualifies (or does not qualify) as legacy software...' },
          { id: 'market_history_ref', label: 'Market history / prior regulatory evidence', type: 'doc_reference', helpText: 'Link documents showing the market history: prior 510(k) clearances, CE certificates, regulatory submissions, or market surveillance records. This establishes the timeline for legacy determination.' },
        ],
      },
      {
        id: '4.4_2_risk_assessment',
        stepLabel: '4.4.2 Legacy Software Risk Assessment',
        requirementText: 'Obtain and document a risk assessment for the legacy software. Evaluate the software\'s contribution to hazardous situations using available field data, complaint history, and known anomalies.',
        supplementaryInfo: 'Use post-market surveillance data, complaint records, recall history, and known software anomalies to inform the risk assessment. Consider both the existing configuration and typical use environments.',
        fields: [
          { id: 'legacy_risk_assessment_ref', label: 'Legacy software risk assessment document', type: 'doc_reference', helpText: 'Link the risk assessment document specific to the legacy software. This should evaluate field safety data, complaints, recalls, and known anomalies against the device hazard analysis.' },
          { id: 'field_data_summary', label: 'Summary of field safety data and complaint history', type: 'richtext', helpText: 'Summarise the post-market surveillance data available for this software: number and nature of complaints, adverse events reported, field safety corrective actions, and any recalls. Include the time period covered.', placeholder: 'Summarise complaints, adverse events, recalls, and field corrections related to this software...' },
          { id: 'known_anomalies', label: 'Known anomalies and their risk evaluation', type: 'richtext', helpText: 'List all known software bugs/anomalies. For each, provide: description, severity assessment, probability of occurrence, risk level, and whether a workaround exists. Reference the anomaly tracking system.', placeholder: 'List known software anomalies, their severity, probability, and whether they are acceptable...' },
          { id: 'legacy_safety_class', label: 'Assigned safety classification for legacy software', type: 'select', helpText: 'Assign a safety class to the legacy software using the same criteria as §4.3. This classification determines the scope of the gap analysis in §4.4.3.', options: [
            { value: 'class_a', label: 'Class A — No contribution to hazardous situation' },
            { value: 'class_b', label: 'Class B — Non-serious injury possible' },
            { value: 'class_c', label: 'Class C — Death or serious injury possible' },
          ] },
        ],
      },
      {
        id: '4.4_3_gap_analysis',
        stepLabel: '4.4.3 Gap Analysis Against IEC 62304',
        requirementText: 'Perform a gap analysis of the legacy software against the applicable requirements of IEC 62304 for the assigned safety class. Document which requirements are met, partially met, or not met.',
        supplementaryInfo: 'The gap analysis should cover all normative clauses (§4–§9) applicable to the assigned software safety class. For each requirement, document existing evidence or identify the gap.',
        fields: [
          { id: 'gap_analysis_ref', label: 'Gap analysis report reference', type: 'doc_reference', helpText: 'Link the formal gap analysis report comparing the legacy software development practices against IEC 62304 requirements for the assigned safety class.' },
          { id: 'gap_summary', label: 'Summary of gap analysis findings', type: 'richtext', helpText: 'Provide a high-level summary of the gap analysis results. Highlight the most critical gaps (especially those affecting risk controls or verification activities) and any areas of strength.', placeholder: 'Summarise which IEC 62304 requirements are met, partially met, or not met. Highlight critical gaps...' },
          { id: 'gap_count_met', label: 'Number of requirements fully met', type: 'text', helpText: 'Enter the total number of applicable IEC 62304 requirements that are fully met by existing evidence.', placeholder: 'e.g. 28' },
          { id: 'gap_count_partial', label: 'Number of requirements partially met', type: 'text', helpText: 'Enter the total number of requirements that are partially met (some evidence exists but is incomplete).', placeholder: 'e.g. 7' },
          { id: 'gap_count_not_met', label: 'Number of requirements not met', type: 'text', helpText: 'Enter the total number of requirements that are not met (no evidence exists).', placeholder: 'e.g. 3' },
        ],
      },
      {
        id: '4.4_4_remediation_plan',
        stepLabel: '4.4.4 Remediation Plan',
        requirementText: 'Create a plan to address the identified gaps, or provide a documented justification for continued use of the legacy software without full compliance to IEC 62304.',
        supplementaryInfo: 'The plan may include phased remediation, risk-based prioritisation of gaps, or documented acceptance of residual gaps with supporting risk analysis. If the software is to be modified, apply the full software development process from that point forward.',
        fields: [
          { id: 'remediation_plan_ref', label: 'Remediation plan document', type: 'doc_reference', helpText: 'Link the remediation plan document that describes how each identified gap will be addressed, the timeline, and responsible parties.' },
          { id: 'remediation_approach', label: 'Remediation approach', type: 'select', helpText: 'Select the approach being taken: full compliance (all gaps will be closed), phased (gaps prioritised by risk and closed over time), justified continued use (gaps accepted based on risk analysis), or planned replacement.', options: [
            { value: 'full_compliance', label: 'Full compliance — all gaps will be addressed' },
            { value: 'phased', label: 'Phased remediation — gaps prioritised by risk' },
            { value: 'justified_continued_use', label: 'Justified continued use — gaps accepted with rationale' },
            { value: 'replacement_planned', label: 'Software replacement planned' },
          ] },
          { id: 'remediation_timeline', label: 'Remediation timeline and milestones', type: 'richtext', helpText: 'Describe the timeline for closing gaps, with specific milestones and target dates. Identify who is responsible for each remediation activity.', placeholder: 'Describe the timeline, key milestones, and responsible parties for addressing gaps...' },
          { id: 'continued_use_justification', label: 'Justification for continued use (if applicable)', type: 'richtext', helpText: 'If any gaps are being accepted without remediation, provide a risk-based justification. Reference the field safety data, legacy risk assessment, and regulatory guidance supporting the determination that residual risk is acceptable.', placeholder: 'If gaps are accepted, provide risk-based justification referencing field safety data, risk assessment, and regulatory guidance...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §5 Software Development Process
  // ═══════════════════════════════════════════════════════════
  '5.1': {
    clauseTitle: '5.1 — Software Development Planning',
    evidenceRequired: true,
    steps: [
      {
        id: '5.1_1_plan',
        stepLabel: '5.1.1 Software Development Plan',
        requirementText: 'Create a software development plan or reference one. The plan must describe the processes, activities, and tasks for developing the software.',
        fields: [
          { id: 'sw_dev_plan_ref', label: 'Software development plan reference', type: 'doc_reference', helpText: 'Link your Software Development Plan (SDP) document. This is the master plan governing the entire software development effort. It must be approved and current. If using a template from your QMS, reference the project-specific version.' },
          { id: 'sw_dev_plan_summary', label: 'Summarise the software development plan scope', type: 'richtext', helpText: 'Briefly describe the scope of the SDP: which software system/items it covers, the lifecycle model used (e.g., V-model, Agile with gates), key deliverables, and how it maps to IEC 62304 clauses.', placeholder: 'Key processes, deliverables, and lifecycle model...' },
        ],
      },
      {
        id: '5.1_2_keep_updated',
        stepLabel: '5.1.2 Keep Plan Updated',
        requirementText: 'Keep the software development plan updated as development progresses. Describe the change management approach for the plan itself.',
        fields: [
          { id: 'plan_update_process', label: 'How is the plan kept updated?', type: 'richtext', helpText: 'Describe the process for updating the SDP: Who triggers updates? How often is the plan reviewed? What change control process applies? Provide evidence of at least one plan update if development has been ongoing.', placeholder: 'Describe the review cycle and triggers for plan updates...' },
        ],
      },
      {
        id: '5.1_3_design_dev_ref',
        stepLabel: '5.1.3 Design & Development Reference',
        requirementText: 'Reference the software development plan in the design and development planning per the QMS.',
        fields: [
          { id: 'design_dev_ref', label: 'Design & development plan cross-reference', type: 'doc_reference', helpText: 'Link the device-level Design & Development Plan that references the Software Development Plan. This demonstrates integration between software and device-level design control.' },
        ],
      },
      {
        id: '5.1_4_standards_tools',
        stepLabel: '5.1.4 Standards, Methods & Tools',
        requirementText: 'Identify and document the software development standards, methods, and tools to be used.',
        supplementaryInfo: 'Include coding standards, design methods (e.g. UML), development environments, compilers, and static analysis tools.',
        fields: [
          { id: 'dev_standards', label: 'Development standards applied', type: 'richtext', helpText: 'List all coding standards and design methods used (e.g., MISRA C, CERT C, internal coding standard SOP-CS-001). Reference the specific version/edition of each standard.', placeholder: 'e.g. MISRA C, CERT C, internal coding standard...' },
          { id: 'dev_tools', label: 'Development tools and environments', type: 'richtext', helpText: 'List all development tools with versions: IDE, compiler, linker, static analysis tool, code review tool, build system. For safety-critical tools, indicate whether tool qualification has been performed per IEC 62304 §5.1.4.', placeholder: 'e.g. IDE, compiler, static analysis tool, version...' },
        ],
      },
      {
        id: '5.1_5_integration_plan',
        stepLabel: '5.1.5 Integration & Integration Testing Planning',
        requirementText: 'Plan for integration of software units and integration testing.',
        fields: [
          { id: 'integration_plan', label: 'Integration strategy and testing approach', type: 'richtext', helpText: 'Describe the integration strategy: top-down, bottom-up, or incremental? What is the integration sequence? What test environment is used? How are integration issues tracked?', placeholder: 'Top-down, bottom-up, incremental? Test environment?' },
        ],
      },
      {
        id: '5.1_6_verification_plan',
        stepLabel: '5.1.6 Verification Planning',
        requirementText: 'Plan software verification activities including milestones, methods, and pass/fail criteria.',
        fields: [
          { id: 'verification_plan', label: 'Verification approach and criteria', type: 'richtext', helpText: 'Describe the overall verification strategy: which verification methods are used at each lifecycle stage (review, analysis, demonstration, testing)? Define pass/fail criteria and who performs verification.', placeholder: 'Describe verification methods (review, analysis, testing) and acceptance criteria...' },
        ],
      },
      {
        id: '5.1_7_risk_plan',
        stepLabel: '5.1.7 Risk Management Planning',
        requirementText: 'Plan how software risk management activities are integrated into the development process.',
        fields: [
          { id: 'sw_risk_plan', label: 'Software risk management planning', type: 'richtext', helpText: 'Describe when risk analyses are performed during development (e.g., at requirements, architecture, detailed design). How are risk control measures tracked through to verification? Who is responsible?', placeholder: 'When are risk analyses performed? How are risk control measures tracked?' },
        ],
      },
      {
        id: '5.1_8_doc_plan',
        stepLabel: '5.1.8 Documentation Planning',
        requirementText: 'Plan the documentation to be produced during development.',
        fields: [
          { id: 'doc_plan', label: 'Documentation plan', type: 'richtext', helpText: 'List all documents that will be produced during software development: SRS, SAD, SDD, test plans, test reports, traceability matrix, release notes, etc. For each, indicate the author, reviewer, and approver.', placeholder: 'List planned documents: SRS, SDD, test plans, reports, traceability matrices...' },
        ],
      },
      {
        id: '5.1_9_config_plan',
        stepLabel: '5.1.9 Configuration Management Planning',
        requirementText: 'Plan the software configuration management approach including tools, branching strategy, and approval workflows.',
        fields: [
          { id: 'config_mgmt_plan', label: 'Configuration management approach', type: 'richtext', helpText: 'Describe the version control system (e.g., Git), branching model (e.g., GitFlow), code review process, merge approval workflow, and how configuration baselines are established and maintained.', placeholder: 'VCS tool, branching model, merge/review process...' },
        ],
      },
      {
        id: '5.1_10_supporting_items',
        stepLabel: '5.1.10 Supporting Items to Control',
        requirementText: 'Identify supporting items that need to be controlled (test tools, build environments, etc.).',
        fields: [
          { id: 'supporting_items', label: 'Supporting items under configuration control', type: 'richtext', helpText: 'List all supporting items that are under configuration control: test frameworks, build scripts, CI/CD pipelines, test fixtures, simulation environments, reference data sets. Include version identification for each.', placeholder: 'e.g. test frameworks, build scripts, CI/CD pipelines...' },
        ],
      },
      {
        id: '5.1_11_config_before_verif',
        stepLabel: '5.1.11 Config Control Before Verification',
        requirementText: 'Describe how software configuration items are controlled before verification is complete.',
        fields: [
          { id: 'config_before_verif', label: 'Pre-verification configuration control', type: 'richtext', helpText: 'Describe how work-in-progress items are managed before formal verification: branch protection, code review requirements, draft document control, and how changes are tracked during development.', placeholder: 'How are work-in-progress items managed before formal verification?' },
        ],
      },
    ],
  },

  '5.2': {
    clauseTitle: '5.2 — Software Requirements Analysis',
    evidenceRequired: false,
    steps: [
      {
        id: '5.2_1_define_reqs',
        stepLabel: '5.2.1 Define Requirements',
        requirementText: 'Define and document software requirements derived from system requirements, risk control measures, and regulatory requirements.',
        fields: [
          { id: 'sw_req_spec_ref', label: 'Software requirements specification reference', type: 'doc_reference', helpText: 'Link your Software Requirements Specification (SRS) document. This must contain all software requirements derived from system requirements, risk control measures, and regulatory requirements.' },
          { id: 'req_derivation', label: 'How are software requirements derived from system requirements?', type: 'richtext', helpText: 'Describe the traceability chain: how do system requirements flow down to software requirements? Reference the traceability matrix. Include how risk control measures and regulatory requirements are captured as software requirements.', placeholder: 'Describe the traceability from system to software requirements...' },
        ],
      },
      {
        id: '5.2_2_req_content',
        stepLabel: '5.2.2 Requirements Content',
        requirementText: 'Software requirements shall include functional, capability, interface (hardware/software/users), and performance requirements as appropriate to the safety class.',
        fields: [
          { id: 'req_content_coverage', label: 'Confirm requirements content coverage', type: 'richtext', helpText: 'Confirm which requirement categories are covered in your SRS: functional requirements, performance requirements, interface requirements (HW, SW, user), security requirements, usability requirements. For any category not included, explain why.', placeholder: 'Which requirement categories are addressed: functional, performance, interface, security, usability?' },
        ],
      },
      {
        id: '5.2_3_risk_controls',
        stepLabel: '5.2.3 Risk Control in Requirements',
        requirementText: 'Include risk control measures as software requirements. Each risk control measure from the risk management process should be traceable to a software requirement.',
        fields: [
          { id: 'risk_control_reqs', label: 'How are risk control measures incorporated into software requirements?', type: 'richtext', helpText: 'Describe how risk control measures from the risk management file become formal software requirements. Show the traceability: Risk ID → Risk Control Measure → Software Requirement ID. Each risk control implemented in software must have a corresponding testable requirement.', placeholder: 'Describe the traceability from risk controls to SW requirements...' },
        ],
      },
      {
        id: '5.2_4_re_evaluate_risk',
        stepLabel: '5.2.4 Re-evaluate Risk Analysis',
        requirementText: 'Re-evaluate the medical device risk analysis based on the software requirements.',
        fields: [
          { id: 'risk_re_eval', label: 'Risk analysis re-evaluation', type: 'richtext', helpText: 'Document whether the software requirements analysis revealed new hazards or changes to existing hazards. If so, describe the updates made to the risk management file. If no new hazards were identified, document that the re-evaluation was performed and the conclusion.', placeholder: 'Were new hazards or changes to existing hazards identified during requirements analysis?' },
        ],
      },
      {
        id: '5.2_5_update_system_reqs',
        stepLabel: '5.2.5 Update System Requirements',
        requirementText: 'Update system requirements if the software requirements analysis identifies necessary changes.',
        fields: [
          { id: 'system_req_updates', label: 'System requirements updates', type: 'richtext', helpText: 'Document any changes made to system requirements as a result of the software requirements analysis. If no changes were needed, state that explicitly and explain why.', placeholder: 'Were system requirements updated based on SW requirements analysis? Document changes.' },
        ],
      },
      {
        id: '5.2_6_verify_reqs',
        stepLabel: '5.2.6 Verify Requirements',
        requirementText: 'Verify that software requirements are correct, complete, consistent, testable, and traceable to system requirements and risk control measures.',
        fields: [
          { id: 'req_verification', label: 'Requirements verification evidence', type: 'richtext', helpText: 'Describe how requirements were verified: peer review, formal inspection, checklist-based review, or automated analysis. Document who performed the verification and the conclusion (all requirements are correct, complete, consistent, testable, and traceable).', placeholder: 'How were requirements verified? (review, analysis, traceability matrix)' },
          { id: 'req_verification_ref', label: 'Verification record reference', type: 'doc_reference', helpText: 'Link the requirements review record or verification report. This could be a review meeting minutes document, a checklist, or a formal inspection report.' },
        ],
      },
    ],
  },

  '5.3': {
    clauseTitle: '5.3 — Software Architectural Design',
    evidenceRequired: false,
    steps: [
      {
        id: '5.3_1_architecture',
        stepLabel: '5.3.1 Architecture from Requirements',
        requirementText: 'Transform the software requirements into a documented architecture that describes the structure of the software, identifies software items, and documents their relationships.',
        fields: [
          { id: 'sw_arch_ref', label: 'Software architecture document reference', type: 'doc_reference', helpText: 'Link your Software Architecture Description (SAD) document. This should show the high-level structure, major software items/modules, their interfaces, and data flows.' },
          { id: 'arch_description', label: 'Describe the software architecture', type: 'richtext', helpText: 'Provide an overview of the architecture: major software items, their responsibilities, how they communicate, and key design decisions. Include or reference block diagrams and data flow diagrams.', placeholder: 'High-level structure, main software items, and their relationships...' },
        ],
      },
      {
        id: '5.3_2_interfaces',
        stepLabel: '5.3.2 Software Item Interfaces',
        requirementText: 'Develop and document the interfaces between software items and external components.',
        fields: [
          { id: 'interface_spec', label: 'Interface specifications', type: 'richtext', helpText: 'Document all interfaces: between software items (APIs, shared memory, message queues), between software and hardware (registers, drivers, protocols), and between software and external systems (network protocols, file formats).', placeholder: 'Document interfaces between software items, and between software and hardware/external systems...' },
        ],
      },
      {
        id: '5.3_3_soup_reqs',
        stepLabel: '5.3.3 SOUP Item Requirements',
        requirementText: 'Specify functional and performance requirements for each SOUP (Software of Unknown Provenance) item used.',
        supplementaryInfo: 'SOUP includes libraries, frameworks, operating systems, or any software not developed under IEC 62304.',
        fields: [
          { id: 'soup_list', label: 'List SOUP items with functional/performance requirements', type: 'richtext', helpText: 'For each SOUP item (library, framework, OS, middleware), document: name, version, manufacturer/author, intended purpose in your system, functional requirements it must meet, and performance requirements (e.g., response time, throughput).', placeholder: 'For each SOUP: name, version, purpose, functional requirements, performance requirements...' },
        ],
      },
      {
        id: '5.3_4_soup_hw_sw',
        stepLabel: '5.3.4 SOUP Hardware/Software Dependencies',
        requirementText: 'Specify system hardware and software required by each SOUP item.',
        fields: [
          { id: 'soup_dependencies', label: 'SOUP dependencies', type: 'richtext', helpText: 'For each SOUP item, document the required operating system, hardware platform, runtime libraries, and any other dependencies. This ensures the SOUP will function correctly in your target environment.', placeholder: 'For each SOUP: required OS, hardware platform, runtime dependencies...' },
        ],
      },
      {
        id: '5.3_5_segregation',
        stepLabel: '5.3.5 Segregation for Risk Control',
        requirementText: 'Identify any segregation between software items necessary for risk control (e.g. separating safety-critical from non-safety functions).',
        fields: [
          { id: 'segregation', label: 'Segregation approach for risk control', type: 'richtext', helpText: 'Describe how safety-critical software items are separated from non-critical items: separate processes, memory protection, watchdog timers, independent execution environments. If no segregation is used, explain why (e.g., entire system is the same safety class).', placeholder: 'How are safety-critical software items separated from non-critical items?' },
        ],
      },
      {
        id: '5.3_6_verify_arch',
        stepLabel: '5.3.6 Verify Architecture',
        requirementText: 'Verify that the software architecture implements all software requirements, supports interfaces, and is consistent with the safety classification.',
        fields: [
          { id: 'arch_verification', label: 'Architecture verification evidence', type: 'richtext', helpText: 'Describe how the architecture was verified against requirements: traceability analysis (all requirements mapped to architecture elements), architecture review, and consistency check with safety classification.', placeholder: 'How was the architecture verified against requirements? (review, analysis)' },
          { id: 'arch_verification_ref', label: 'Architecture verification record', type: 'doc_reference', helpText: 'Link the architecture review record or verification report documenting the outcome of the verification.' },
        ],
      },
    ],
  },

  '5.4': {
    clauseTitle: '5.4 — Software Detailed Design',
    evidenceRequired: false,
    steps: [
      {
        id: '5.4_1_subdivide',
        stepLabel: '5.4.1 Subdivide into Units',
        requirementText: 'Subdivide the software items into software units that can be independently tested.',
        fields: [
          { id: 'unit_breakdown', label: 'Software unit breakdown', type: 'richtext', helpText: 'List the software units and describe the scope/responsibility of each. A software unit is the smallest piece of software that can be independently tested. The granularity should be proportional to the safety class.', placeholder: 'List software units and their scope/responsibility...' },
        ],
      },
      {
        id: '5.4_2_detailed_design',
        stepLabel: '5.4.2 Detailed Design',
        requirementText: 'Develop detailed designs for each software unit describing algorithms, data structures, and control logic.',
        fields: [
          { id: 'detailed_design_ref', label: 'Detailed design document reference', type: 'doc_reference', helpText: 'Link the Software Detailed Design (SDD) document. For Class C software, this must describe algorithms, data structures, state machines, and control logic at a level sufficient for implementation by a developer who did not write the design.' },
          { id: 'detailed_design_summary', label: 'Detailed design approach', type: 'richtext', helpText: 'Summarise the detailed design approach: what level of detail is provided, what notations are used (pseudocode, flowcharts, state diagrams), and how the design is organised.', placeholder: 'Summarise the detailed design approach for key units...' },
        ],
      },
      {
        id: '5.4_3_interface_design',
        stepLabel: '5.4.3 Interface Detailed Design',
        requirementText: 'Develop detailed designs for interfaces between software units and external components.',
        fields: [
          { id: 'interface_detailed_design', label: 'Interface detailed design', type: 'richtext', helpText: 'Document the detailed interface specifications: data formats, protocols, error handling, timing constraints, and boundary conditions for each interface between software units.', placeholder: 'Document interface protocols, data formats, and error handling...' },
        ],
      },
      {
        id: '5.4_4_verify_design',
        stepLabel: '5.4.4 Verify Detailed Design',
        requirementText: 'Verify the detailed design against the software architecture and requirements.',
        fields: [
          { id: 'design_verification', label: 'Design verification evidence', type: 'richtext', helpText: 'Describe how the detailed design was verified: design review (who participated, when), traceability check (each design element maps to an architecture element and requirement), and consistency check.', placeholder: 'How was the detailed design verified? (code review, design review, traceability)' },
          { id: 'design_verification_ref', label: 'Design verification record', type: 'doc_reference', helpText: 'Link the design review record or verification report.' },
        ],
      },
    ],
  },

  '5.5': {
    clauseTitle: '5.5 — Software Unit Implementation & Verification',
    evidenceRequired: false,
    steps: [
      {
        id: '5.5_1_implement',
        stepLabel: '5.5.1 Implement Units',
        requirementText: 'Implement each software unit according to the detailed design and applicable coding standards.',
        fields: [
          { id: 'implementation_approach', label: 'Implementation approach', type: 'richtext', helpText: 'Describe the implementation practices: coding standards enforced, code review process (who reviews, what criteria), static analysis tools used, and how compliance is documented.', placeholder: 'Coding standards applied, code review process, static analysis...' },
        ],
      },
      {
        id: '5.5_2_verification_process',
        stepLabel: '5.5.2 Unit Verification Process',
        requirementText: 'Establish the software unit verification process including test strategies and tools.',
        fields: [
          { id: 'unit_test_strategy', label: 'Unit test strategy', type: 'richtext', helpText: 'Describe the unit testing approach: test framework used (e.g., GTest, JUnit, pytest), test execution environment, code coverage targets, and automation approach. For Class C, include structural coverage requirements.', placeholder: 'Test framework, coverage targets, automation approach...' },
        ],
      },
      {
        id: '5.5_3_acceptance_criteria',
        stepLabel: '5.5.3 Acceptance Criteria',
        requirementText: 'Define acceptance criteria for software units.',
        fields: [
          { id: 'unit_acceptance_criteria', label: 'Unit acceptance criteria', type: 'richtext', helpText: 'Define the specific criteria that must be met for a software unit to pass verification: all unit tests pass, code coverage ≥ X%, no critical static analysis warnings, code review approved, etc.', placeholder: 'e.g. all unit tests pass, code coverage ≥ X%, no critical static analysis warnings...' },
        ],
      },
      {
        id: '5.5_4_additional_criteria',
        stepLabel: '5.5.4 Additional Acceptance Criteria',
        requirementText: 'For Class C software, define additional acceptance criteria including boundary value testing and data/control flow analysis.',
        supplementaryInfo: 'This step applies primarily to Class C software. For Class A/B, document why additional criteria are not needed.',
        fields: [
          { id: 'additional_criteria', label: 'Additional acceptance criteria (Class C)', type: 'richtext', helpText: 'For Class C software: define additional criteria such as boundary value analysis, equivalence class testing, structural (branch/statement) coverage targets, and data/control flow analysis requirements. For Class A/B, state that additional criteria are not required and reference the safety classification.', placeholder: 'Boundary value analysis, equivalence class testing, structural coverage...' },
        ],
      },
      {
        id: '5.5_5_verify_units',
        stepLabel: '5.5.5 Unit Verification',
        requirementText: 'Perform unit verification against acceptance criteria and document results.',
        fields: [
          { id: 'unit_test_results', label: 'Unit verification results', type: 'richtext', helpText: 'Provide a summary of unit verification results: total tests executed, pass/fail counts, code coverage achieved, static analysis results, and any issues found and their resolution.', placeholder: 'Summary of unit test results, coverage achieved, issues found...' },
          { id: 'unit_test_ref', label: 'Unit test report reference', type: 'doc_reference', helpText: 'Link the unit test report containing detailed results, coverage data, and anomaly records.' },
        ],
      },
    ],
  },

  '5.6': {
    clauseTitle: '5.6 — Software Integration & Integration Testing',
    evidenceRequired: false,
    steps: [
      {
        id: '5.6_1_integrate',
        stepLabel: '5.6.1 Integrate Units',
        requirementText: 'Integrate software units according to the integration plan.',
        fields: [
          { id: 'integration_approach', label: 'Integration approach', type: 'richtext', helpText: 'Describe the actual integration sequence followed and the build process used. Include the CI/CD pipeline if applicable.', placeholder: 'Describe the integration sequence and build process...' },
        ],
      },
      {
        id: '5.6_2_verify_integration',
        stepLabel: '5.6.2 Verify Integration',
        requirementText: 'Verify that software items have been correctly integrated.',
        fields: [
          { id: 'integration_verification', label: 'Integration verification approach', type: 'richtext', helpText: 'Describe how correct integration is verified: smoke tests, build verification tests, sanity checks that confirm all modules are present and communicating correctly.', placeholder: 'How is correct integration verified? (smoke tests, integration checks)' },
        ],
      },
      {
        id: '5.6_3_integration_testing',
        stepLabel: '5.6.3 Integration Testing',
        requirementText: 'Test integrated software to verify that the software items interact correctly.',
        fields: [
          { id: 'integration_test_approach', label: 'Integration test approach', type: 'richtext', helpText: 'Describe the integration test methods: what interfaces are tested, what test environment is used, and the scope of testing at each integration stage.', placeholder: 'Test methods, environment, and scope of integration testing...' },
        ],
      },
      {
        id: '5.6_4_test_content',
        stepLabel: '5.6.4 Integration Test Content',
        requirementText: 'Integration tests shall verify interfaces, data flow, and resource usage between software items.',
        fields: [
          { id: 'integration_test_content', label: 'Integration test coverage', type: 'richtext', helpText: 'Describe which interfaces, data flows, and shared resources are covered by integration tests. Ensure all inter-module interfaces identified in the architecture are tested.', placeholder: 'Which interfaces, data flows, and resources are tested?' },
        ],
      },
      {
        id: '5.6_5_evaluate_procedures',
        stepLabel: '5.6.5 Evaluate Test Procedures',
        requirementText: 'Evaluate integration test procedures for correctness and completeness.',
        fields: [
          { id: 'test_procedure_eval', label: 'Test procedure evaluation', type: 'richtext', helpText: 'Describe how integration test procedures were reviewed and approved: who reviewed them, what criteria were used, and whether any gaps were identified and addressed.', placeholder: 'How were test procedures reviewed? Any gaps identified?' },
        ],
      },
      {
        id: '5.6_6_regression',
        stepLabel: '5.6.6 Regression Tests',
        requirementText: 'Conduct regression testing when changes are made during integration.',
        fields: [
          { id: 'regression_approach', label: 'Regression testing approach', type: 'richtext', helpText: 'Describe the regression test suite: what is included, how is it maintained, what triggers full vs. partial regression, and what level of automation is used.', placeholder: 'Regression test suite, automation, criteria for re-running tests...' },
        ],
      },
      {
        id: '5.6_7_test_records',
        stepLabel: '5.6.7 Test Record Contents',
        requirementText: 'Document integration test records including results, pass/fail status, and anomalies.',
        fields: [
          { id: 'integration_test_ref', label: 'Integration test report reference', type: 'doc_reference', helpText: 'Link the integration test report containing test results, pass/fail summary, and any anomaly records.' },
          { id: 'integration_test_results', label: 'Integration test results summary', type: 'richtext', helpText: 'Summarise integration test results: total tests, pass/fail counts, anomalies found, and their resolution status.', placeholder: 'Pass/fail summary, issues found, anomalies...' },
        ],
      },
      {
        id: '5.6_8_problem_resolution',
        stepLabel: '5.6.8 Problem Resolution',
        requirementText: 'Use the problem resolution process for any issues found during integration testing.',
        fields: [
          { id: 'integration_problems', label: 'Problems found and resolution status', type: 'richtext', helpText: 'List any problems found during integration testing and their resolution status. Reference the problem tracking system and the problem resolution process (§9).', placeholder: 'List problems found during integration and their resolution...' },
        ],
      },
    ],
  },

  '5.7': {
    clauseTitle: '5.7 — Software System Testing',
    evidenceRequired: false,
    steps: [
      {
        id: '5.7_1_establish_tests',
        stepLabel: '5.7.1 Establish System Tests',
        requirementText: 'Establish tests for all software requirements, including risk control requirements, at the system level.',
        fields: [
          { id: 'system_test_plan_ref', label: 'System test plan reference', type: 'doc_reference', helpText: 'Link the Software System Test Plan. This must demonstrate traceability from every software requirement (including risk control requirements) to at least one system-level test case.' },
          { id: 'system_test_coverage', label: 'How does system testing cover all software requirements?', type: 'richtext', helpText: 'Describe the traceability from software requirements to system test cases. What tools or matrices are used? Confirm that risk control requirements have dedicated test cases.', placeholder: 'Describe traceability from requirements to system test cases...' },
        ],
      },
      {
        id: '5.7_2_problem_resolution',
        stepLabel: '5.7.2 Problem Resolution',
        requirementText: 'Use the problem resolution process for any issues found during system testing.',
        fields: [
          { id: 'system_test_problems', label: 'Problems found and resolution', type: 'richtext', helpText: 'List problems found during system testing and their resolution status. For safety-related problems, describe the risk impact assessment.', placeholder: 'List system-level issues and their resolution status...' },
        ],
      },
      {
        id: '5.7_3_retest',
        stepLabel: '5.7.3 Retest After Changes',
        requirementText: 'Re-test after changes to confirm the fix and ensure no regression.',
        fields: [
          { id: 'system_retest', label: 'Retest approach and evidence', type: 'richtext', helpText: 'Describe the retest strategy: how is the fix verified? What regression scope is applied? How is it determined that the change did not introduce new issues?', placeholder: 'How is retest performed? Include regression scope...' },
        ],
      },
      {
        id: '5.7_4_test_records',
        stepLabel: '5.7.4 System Test Records',
        requirementText: 'Verify that software system test records contain all required information.',
        fields: [
          { id: 'system_test_ref', label: 'System test report reference', type: 'doc_reference', helpText: 'Link the Software System Test Report containing detailed results, traceability matrix, coverage analysis, and anomaly log.' },
          { id: 'system_test_results', label: 'System test results summary', type: 'richtext', helpText: 'Summarise system test results: requirements coverage achieved, pass/fail counts, residual anomalies, and overall conclusion.', placeholder: 'Pass/fail summary, coverage achieved, residual issues...' },
        ],
      },
      {
        id: '5.7_5_evaluate_procedures',
        stepLabel: '5.7.5 Evaluate Test Procedures',
        requirementText: 'Evaluate system test procedures for correctness, completeness, and traceability to requirements.',
        fields: [
          { id: 'system_test_eval', label: 'Test procedure evaluation', type: 'richtext', helpText: 'Describe how system test procedures were reviewed and approved. Who reviewed them? Were they verified for correctness and completeness?', placeholder: 'How were system test procedures reviewed and approved?' },
        ],
      },
    ],
  },

  '5.8': {
    clauseTitle: '5.8 — Software Release',
    evidenceRequired: true,
    steps: [
      {
        id: '5.8_1_verification_complete',
        stepLabel: '5.8.1 Verification Complete',
        requirementText: 'Ensure all software verification activities are complete before release.',
        fields: [
          { id: 'verification_complete', label: 'Confirm all verification is complete', type: 'richtext', helpText: 'Provide a checklist or summary showing that all planned verification activities (unit testing, integration testing, system testing, code reviews, static analysis) are complete and have passed.', placeholder: 'List completed verification activities and their status...' },
        ],
      },
      {
        id: '5.8_2_residual_anomalies',
        stepLabel: '5.8.2 Known Residual Anomalies',
        requirementText: 'Document all known residual anomalies in the released software.',
        fields: [
          { id: 'residual_anomalies', label: 'Known residual anomalies', type: 'richtext', helpText: 'List every known bug or anomaly in the software being released. For each, document: description, severity, risk assessment, and workaround (if any). This list must be reviewed and accepted before release.', placeholder: 'List known bugs/anomalies and their risk assessment...' },
        ],
      },
      {
        id: '5.8_3_evaluate_anomalies',
        stepLabel: '5.8.3 Evaluate Anomalies',
        requirementText: 'Evaluate known residual anomalies to determine acceptability for release.',
        fields: [
          { id: 'anomaly_evaluation', label: 'Anomaly evaluation and risk justification', type: 'richtext', helpText: 'For each residual anomaly, provide a risk-based justification for release: is the risk acceptable? Is a workaround available? Does it affect safety-critical functions? Document the decision to accept each anomaly.', placeholder: 'For each anomaly: risk assessment, workaround, and justification for release...' },
        ],
      },
      {
        id: '5.8_4_release_versions',
        stepLabel: '5.8.4 Document Released Versions',
        requirementText: 'Document the version identification of the released software and all components.',
        fields: [
          { id: 'release_version', label: 'Released software version(s)', type: 'text', helpText: 'Enter the exact version identifier of the released software (e.g., v2.1.0). Use the same versioning scheme throughout all documentation.', placeholder: 'e.g. v2.1.0' },
          { id: 'release_manifest', label: 'Release manifest / component versions', type: 'richtext', helpText: 'List all components of the release: application software items with versions, SOUP items with versions, configuration files, and build identifiers. This enables exact reproduction of the release.', placeholder: 'List all software items, SOUP versions, and build identifiers...' },
        ],
      },
      {
        id: '5.8_5_release_creation',
        stepLabel: '5.8.5 Release Creation Process',
        requirementText: 'Document how the released software was created (build process, tools, environment).',
        fields: [
          { id: 'build_process', label: 'Build and release process', type: 'richtext', helpText: 'Describe the build process: build tools and versions, build environment (OS, dependencies), signing/encryption if applicable, packaging process, and how the build is verified (e.g., hash comparison).', placeholder: 'Build tools, environment, signing, packaging process...' },
        ],
      },
      {
        id: '5.8_6_activities_complete',
        stepLabel: '5.8.6 Activities Complete',
        requirementText: 'Ensure all activities and tasks defined in the software development plan are complete.',
        fields: [
          { id: 'activities_checklist', label: 'Development plan activities completion', type: 'richtext', helpText: 'Confirm that all activities specified in the Software Development Plan (§5.1) have been completed. If any planned activities were deferred, provide justification.', placeholder: 'Confirm all planned activities are complete or justified if deferred...' },
        ],
      },
      {
        id: '5.8_7_archive',
        stepLabel: '5.8.7 Archive Software',
        requirementText: 'Archive the released software including source code, build environment, and documentation.',
        fields: [
          { id: 'archive_location', label: 'Archive details', type: 'richtext', helpText: 'Describe the archive: storage location (e.g., secure server, cloud storage), what is archived (source code, build tools, documentation, test results), retention period, and access controls.', placeholder: 'Where is the release archived? Include storage location, retention period...' },
        ],
      },
      {
        id: '5.8_8_repeatability',
        stepLabel: '5.8.8 Release Repeatability',
        requirementText: 'Assure that the software release can be reproduced from the archived materials.',
        fields: [
          { id: 'repeatability_evidence', label: 'Repeatability assurance', type: 'richtext', helpText: 'Describe how build repeatability is ensured: deterministic builds, containerised build environments, archived toolchains, or hash verification of outputs. Has the build been reproduced to verify repeatability?', placeholder: 'How is build repeatability ensured? (deterministic builds, archived toolchains)' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §6 Software Maintenance
  // ═══════════════════════════════════════════════════════════
  '6.1': {
    clauseTitle: '6.1 — Establish Software Maintenance Plan',
    evidenceRequired: false,
    steps: [
      {
        id: '6.1_maintenance_plan',
        stepLabel: 'Maintenance Plan',
        requirementText: 'Define a plan for maintaining the software post-release, including criteria for determining when the software development process must be used for modifications.',
        fields: [
          { id: 'maintenance_plan_ref', label: 'Software maintenance plan reference', type: 'doc_reference', helpText: 'Link the Software Maintenance Plan. This defines: types of maintenance activities, criteria for when a full development process is required vs. a simplified process, and responsibilities for post-market software updates.' },
          { id: 'maintenance_criteria', label: 'Criteria for using development process for modifications', type: 'richtext', helpText: 'Define the criteria that determine when a software change requires the full IEC 62304 development process (e.g., safety-critical change, new functionality) vs. when a simplified maintenance process is sufficient (e.g., minor bug fix, cosmetic change).', placeholder: 'What triggers full development process vs. minor maintenance?' },
        ],
      },
    ],
  },

  '6.2': {
    clauseTitle: '6.2 — Problem and Modification Analysis',
    evidenceRequired: false,
    steps: [
      {
        id: '6.2_1_problem_reports',
        stepLabel: '6.2.1 Problem Reports',
        requirementText: 'Document and evaluate each problem report received.',
        fields: [
          { id: 'problem_report_process', label: 'Problem report evaluation process', type: 'richtext', helpText: 'Describe the process for receiving, logging, and evaluating problem reports: intake channels (customer support, field service, internal testing), triage criteria, severity/priority classification, and responsible person.', placeholder: 'How are problem reports received, logged, and evaluated?' },
        ],
      },
      {
        id: '6.2_2_problem_resolution',
        stepLabel: '6.2.2 Problem Resolution Process',
        requirementText: 'Use the software problem resolution process to address reported problems.',
        fields: [
          { id: 'resolution_process', label: 'Problem resolution process reference', type: 'doc_reference', helpText: 'Link the SOP or procedure document that defines the software problem resolution process (per §9). This should cover: investigation, root cause analysis, fix implementation, verification, and closure.' },
        ],
      },
      {
        id: '6.2_3_change_analysis',
        stepLabel: '6.2.3 Change Impact Analysis',
        requirementText: 'Analyse change requests for impact including risks to patient safety.',
        fields: [
          { id: 'change_impact', label: 'Change impact analysis approach', type: 'richtext', helpText: 'Describe how the impact of proposed changes is assessed: which software items are affected, impact on existing risk controls, regression testing scope, and whether the change affects the safety classification.', placeholder: 'How is impact on safety, existing risk controls, and functionality assessed?' },
        ],
      },
      {
        id: '6.2_4_approve_changes',
        stepLabel: '6.2.4 Approve Changes',
        requirementText: 'Obtain appropriate approval for change requests before implementation.',
        fields: [
          { id: 'change_approval', label: 'Change approval process', type: 'richtext', helpText: 'Describe who approves software changes (role, authority level), what criteria are used for approval decisions, and how the approval is documented. Include the escalation path for safety-critical changes.', placeholder: 'Who approves changes? What criteria are used?' },
        ],
      },
      {
        id: '6.2_5_communicate',
        stepLabel: '6.2.5 Communicate to Users/Regulators',
        requirementText: 'Communicate relevant information about modifications to users and regulatory authorities as required.',
        fields: [
          { id: 'communication_plan', label: 'Communication approach', type: 'richtext', helpText: 'Describe when and how users and regulators are notified of software changes: notification channels, criteria for mandatory notification (e.g., safety-related changes, regulatory reporting), and the content of notifications.', placeholder: 'When and how are users/regulators notified of changes?' },
        ],
      },
    ],
  },

  '6.3': {
    clauseTitle: '6.3 — Implementation of Modification',
    evidenceRequired: false,
    steps: [
      {
        id: '6.3_modification',
        stepLabel: 'Implement Modifications',
        requirementText: 'Implement approved modifications using the established software development process, ensuring traceability and re-verification.',
        fields: [
          { id: 'modification_process', label: 'Modification implementation approach', type: 'richtext', helpText: 'Describe how approved modifications are implemented: which parts of the development process (§5) are applied, how traceability is maintained for the modification, and what re-verification is performed.', placeholder: 'How are modifications implemented, verified, and released?' },
          { id: 'modification_ref', label: 'Modification procedure reference', type: 'doc_reference', helpText: 'Link the procedure document that defines the modification implementation process.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §7 Software Risk Management
  // ═══════════════════════════════════════════════════════════
  '7.1': {
    clauseTitle: '7.1 — Analysis of Software Contributing to Hazardous Situations',
    evidenceRequired: true,
    steps: [
      {
        id: '7.1_1_identify_items',
        stepLabel: '7.1.1 Identify Hazardous Software Items',
        requirementText: 'Identify software items that could contribute to a hazardous situation.',
        fields: [
          { id: 'hazardous_sw_items', label: 'Software items contributing to hazardous situations', type: 'richtext', helpText: 'List all software items, functions, or modules that could contribute to a hazardous situation if they malfunction. Reference the software architecture and the hazard analysis. Include: control algorithms, safety interlocks, data processing, and user interface elements.', placeholder: 'List software items/functions that could cause or contribute to hazards...' },
        ],
      },
      {
        id: '7.1_2_potential_causes',
        stepLabel: '7.1.2 Identify Potential Causes',
        requirementText: 'Identify potential causes of the software contribution to each hazardous situation.',
        supplementaryInfo: 'Consider: incorrect/incomplete requirements, software defects, failure of risk control measures, hardware failures affecting software, use errors, SOUP failures.',
        fields: [
          { id: 'potential_causes', label: 'Potential causes analysis', type: 'richtext', helpText: 'For each hazardous software item, systematically identify potential causes: requirements errors, coding defects, algorithm errors, timing/race conditions, data corruption, SOUP failures, hardware interface failures, and use errors triggering software behaviour.', placeholder: 'For each identified hazardous situation, list potential software causes...' },
        ],
      },
      {
        id: '7.1_3_soup_anomalies',
        stepLabel: '7.1.3 Evaluate SOUP Anomaly Lists',
        requirementText: 'Evaluate published SOUP anomaly lists (bug databases, errata) for anomalies that could cause or contribute to hazardous situations.',
        fields: [
          { id: 'soup_anomaly_eval', label: 'SOUP anomaly list evaluation', type: 'richtext', helpText: 'For each SOUP item used in safety-related functions: identify the bug database or anomaly list reviewed, document any anomalies found that could affect safety, and describe the mitigation (e.g., using a patched version, avoiding the affected functionality, adding a wrapper).', placeholder: 'For each SOUP item: which anomaly lists were reviewed? Any relevant anomalies found?' },
        ],
      },
      {
        id: '7.1_4_document_causes',
        stepLabel: '7.1.4 Document Potential Causes',
        requirementText: 'Document all identified potential causes and their evaluation in the risk management file.',
        fields: [
          { id: 'causes_documentation', label: 'Documentation of potential causes', type: 'richtext', helpText: 'Confirm that all identified potential causes from §7.1.1–7.1.3 are documented in the Risk Management File. Reference the specific section or table where they are recorded.', placeholder: 'Summary of documented causes and their risk file location...' },
          { id: 'risk_file_ref', label: 'Risk management file reference', type: 'doc_reference', helpText: 'Link the Risk Management File section containing the software hazard analysis and potential causes documentation.' },
        ],
      },
    ],
  },

  '7.2': {
    clauseTitle: '7.2 — Risk Control Measures',
    evidenceRequired: true,
    steps: [
      {
        id: '7.2_1_define',
        stepLabel: '7.2.1 Define Risk Control Measures',
        requirementText: 'Define risk control measures for identified hazardous situations caused by software.',
        fields: [
          { id: 'risk_controls', label: 'Software risk control measures', type: 'richtext', helpText: 'For each identified hazardous situation: describe the risk control measure, how it mitigates the risk (prevention, detection, notification), and trace it to the corresponding software requirement. Risk controls may include: input validation, watchdog timers, redundant calculations, range checks, user confirmations.', placeholder: 'For each hazardous situation: describe the risk control measure and how it mitigates the risk...' },
        ],
      },
      {
        id: '7.2_2_verify',
        stepLabel: '7.2.2 Verify Risk Control Measures',
        requirementText: 'Verify that risk control measures are correctly implemented.',
        fields: [
          { id: 'risk_control_verification', label: 'Risk control verification evidence', type: 'richtext', helpText: 'For each risk control measure: describe the verification method (testing, review, analysis), the acceptance criteria, and the result. Each risk control must have documented verification evidence.', placeholder: 'How was each risk control measure verified? Test results?' },
          { id: 'risk_control_verification_ref', label: 'Verification evidence reference', type: 'doc_reference', helpText: 'Link the verification evidence: test reports, review records, or analysis reports showing that risk control measures are correctly implemented and effective.' },
        ],
      },
    ],
  },

  '7.3': {
    clauseTitle: '7.3 — Verification of Risk Control Measures',
    evidenceRequired: true,
    steps: [
      {
        id: '7.3_verification',
        stepLabel: 'Verify All Risk Controls',
        requirementText: 'Verify that all risk control measures have been correctly implemented and are effective in reducing risk to acceptable levels.',
        fields: [
          { id: 'overall_risk_verification', label: 'Overall risk control verification', type: 'richtext', helpText: 'Provide a comprehensive summary showing that ALL risk control measures (not just individual ones) have been verified. This should reference the traceability from risk controls → requirements → test cases → test results.', placeholder: 'Comprehensive verification that all risk controls are implemented and effective...' },
          { id: 'residual_risk_assessment', label: 'Residual risk assessment', type: 'richtext', helpText: 'Describe the overall residual risk assessment: after all risk controls are implemented, is the overall residual risk acceptable? Reference the risk acceptability criteria from the Risk Management Plan and the benefit-risk analysis.', placeholder: 'Is the overall residual risk acceptable? Justification...' },
          { id: 'risk_verification_ref', label: 'Risk verification report reference', type: 'doc_reference', helpText: 'Link the risk control verification summary report or the Risk Management Report section that documents the overall verification conclusion.' },
        ],
      },
    ],
  },

  '7.4': {
    clauseTitle: '7.4 — Risk Management of Software Changes',
    evidenceRequired: true,
    steps: [
      {
        id: '7.4_change_risk',
        stepLabel: 'Change Risk Analysis',
        requirementText: 'Analyse software changes for potential new hazards or impact on existing risk control measures. Update risk documentation accordingly.',
        fields: [
          { id: 'change_risk_process', label: 'Software change risk analysis process', type: 'richtext', helpText: 'Describe the process for assessing risk impact of software changes: Who performs the analysis? What criteria trigger a full risk re-analysis vs. a focused review? How are new hazards identified? How are existing risk controls re-verified after changes?', placeholder: 'How are changes assessed for new or modified risks? When is re-analysis triggered?' },
          { id: 'change_risk_examples', label: 'Recent change risk analyses', type: 'richtext', helpText: 'Provide 1-2 examples of recent change risk analyses performed, showing the process in action. This demonstrates that the process is not just documented but actually followed.', placeholder: 'Provide examples of change risk analyses performed...' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §8 Software Configuration Management
  // ═══════════════════════════════════════════════════════════
  '8.1': {
    clauseTitle: '8.1 — Configuration Identification',
    evidenceRequired: true,
    steps: [
      {
        id: '8.1_1_config_items',
        stepLabel: '8.1.1 Configuration Items',
        requirementText: 'Establish means to uniquely identify software configuration items including documentation, source code, and executables.',
        fields: [
          { id: 'config_id_scheme', label: 'Configuration identification scheme', type: 'richtext', helpText: 'Describe the naming convention and versioning scheme for all configuration items: source code files, documents, executables, configuration files, and test artefacts. Include how unique identification is maintained (e.g., Git commit hashes, document version numbers, build numbers).', placeholder: 'How are configuration items uniquely identified? (naming convention, version numbering)' },
        ],
      },
      {
        id: '8.1_2_soup_config',
        stepLabel: '8.1.2 SOUP Configuration Items',
        requirementText: 'Identify SOUP configuration items including title, manufacturer, and unique identifier (version).',
        fields: [
          { id: 'soup_config_list', label: 'SOUP configuration item register', type: 'richtext', helpText: 'Provide a register of all SOUP items under configuration control: title, manufacturer/author, version number, download source, and any integrity verification (e.g., SHA hash). This register must be maintained and updated when SOUP versions change.', placeholder: 'For each SOUP: title, manufacturer/author, version, unique identifier...' },
        ],
      },
      {
        id: '8.1_3_system_config',
        stepLabel: '8.1.3 System Configuration Documentation',
        requirementText: 'Identify the documentation of the system configuration (hardware, software, network, etc.).',
        fields: [
          { id: 'system_config_doc', label: 'System configuration documentation', type: 'richtext', helpText: 'Describe the system configuration baseline: which hardware, software, and network configurations are documented, how baselines are established and maintained, and where the documentation is stored.', placeholder: 'Describe the system configuration baseline documentation...' },
          { id: 'system_config_ref', label: 'System configuration document reference', type: 'doc_reference', helpText: 'Link the system configuration documentation or baseline description.' },
        ],
      },
    ],
  },

  '8.2': {
    clauseTitle: '8.2 — Change Control',
    evidenceRequired: true,
    steps: [
      {
        id: '8.2_1_approve',
        stepLabel: '8.2.1 Approve Change Requests',
        requirementText: 'Approve change requests before implementation.',
        fields: [
          { id: 'change_approval_process', label: 'Change request approval process', type: 'richtext', helpText: 'Describe the change request workflow: how are changes requested (e.g., issue tracker), who reviews and approves them, what criteria are used for approval, and how the approval is documented.', placeholder: 'How are change requests documented, reviewed, and approved?' },
        ],
      },
      {
        id: '8.2_2_implement',
        stepLabel: '8.2.2 Implement Changes',
        requirementText: 'Implement approved changes and update configuration items.',
        fields: [
          { id: 'change_implementation', label: 'Change implementation process', type: 'richtext', helpText: 'Describe how approved changes are implemented: branching strategy, code review requirements before merge, build and packaging process, and how configuration items are updated consistently.', placeholder: 'How are changes implemented, built, and deployed?' },
        ],
      },
      {
        id: '8.2_3_verify',
        stepLabel: '8.2.3 Verify Changes',
        requirementText: 'Verify that changes have been correctly implemented.',
        fields: [
          { id: 'change_verification', label: 'Change verification approach', type: 'richtext', helpText: 'Describe how changes are verified after implementation: code review, targeted testing, regression testing, and acceptance criteria. Who performs the verification and how is it documented?', placeholder: 'How are changes verified? (code review, testing, regression)' },
        ],
      },
      {
        id: '8.2_4_traceability',
        stepLabel: '8.2.4 Change Traceability',
        requirementText: 'Provide means for the traceability of changes back to change requests.',
        fields: [
          { id: 'change_traceability', label: 'Change traceability mechanism', type: 'richtext', helpText: 'Describe how each change in the codebase or documentation is traceable back to an approved change request: commit message conventions referencing issue IDs, traceability in the issue tracker, or a traceability matrix.', placeholder: 'How is traceability maintained? (issue tracker, commit references, traceability matrix)' },
        ],
      },
    ],
  },

  '8.3': {
    clauseTitle: '8.3 — Configuration Status Accounting',
    evidenceRequired: true,
    steps: [
      {
        id: '8.3_status',
        stepLabel: 'Status Accounting',
        requirementText: 'Maintain records of the configuration status of all software items throughout the lifecycle.',
        fields: [
          { id: 'status_accounting', label: 'Configuration status accounting approach', type: 'richtext', helpText: 'Describe how configuration baselines are recorded and how the status of each configuration item is tracked: current version, change history, approval status. Include the tools or systems used for status accounting.', placeholder: 'How are configuration baselines maintained and status tracked?' },
          { id: 'status_ref', label: 'Configuration status records reference', type: 'doc_reference', helpText: 'Link the configuration status records: baseline descriptions, change logs, or configuration management system reports.' },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // §9 Software Problem Resolution
  // ═══════════════════════════════════════════════════════════
  '9.1': {
    clauseTitle: '9.1 — Prepare Problem Reports',
    evidenceRequired: true,
    steps: [
      {
        id: '9.1_problem_reports',
        stepLabel: 'Problem Reporting',
        requirementText: 'Create documented problem reports for each identified software problem, including problem type, criticality, and priority.',
        fields: [
          { id: 'problem_report_template', label: 'Problem report template/process', type: 'richtext', helpText: 'Describe the problem report format: required fields (description, steps to reproduce, severity, priority, assigned to), classification criteria (critical, major, minor), and the tool or system used for tracking.', placeholder: 'Describe the problem report format: fields, classification, priority levels...' },
          { id: 'problem_report_ref', label: 'Problem report procedure reference', type: 'doc_reference', helpText: 'Link the SOP or procedure document that defines the problem reporting process.' },
        ],
      },
    ],
  },

  '9.2': {
    clauseTitle: '9.2 — Investigate the Problem',
    evidenceRequired: true,
    steps: [
      {
        id: '9.2_investigation',
        stepLabel: 'Problem Investigation',
        requirementText: 'Investigate each reported problem to determine root cause, scope of impact, and potential safety implications.',
        fields: [
          { id: 'investigation_process', label: 'Investigation process', type: 'richtext', helpText: 'Describe the investigation methodology: root cause analysis methods used (5 Whys, Fishbone, Fault Tree), how scope of impact is determined (which software items are affected), and how safety implications are assessed (reference to risk management file).', placeholder: 'How are problems investigated? Root cause analysis methods used?' },
        ],
      },
    ],
  },

  '9.3': {
    clauseTitle: '9.3 — Advise Relevant Parties',
    evidenceRequired: false,
    steps: [
      {
        id: '9.3_advise',
        stepLabel: 'Notify Relevant Parties',
        requirementText: 'Notify users, regulators, and other relevant parties of safety-related software problems as required by regulatory obligations.',
        fields: [
          { id: 'notification_criteria', label: 'Notification criteria and process', type: 'richtext', helpText: 'Define when notification is required: criteria for user notification (e.g., safety advisory), criteria for regulatory notification (e.g., vigilance reporting, MDR Article 87), notification channels, and timeline requirements.', placeholder: 'When must users/regulators be notified? What channels are used?' },
        ],
      },
    ],
  },

  '9.4': {
    clauseTitle: '9.4 — Use Change Control Process',
    evidenceRequired: true,
    steps: [
      {
        id: '9.4_change_control',
        stepLabel: 'Apply Change Control',
        requirementText: 'Apply the change control process (§8.2) to implement approved corrections for reported problems.',
        fields: [
          { id: 'change_control_for_problems', label: 'How is the change control process used for problem fixes?', type: 'richtext', helpText: 'Describe the workflow from problem report through to released fix: problem report → investigation → change request → impact analysis → approval → implementation → verification → release. Reference the change control process from §8.2.', placeholder: 'Describe the workflow from problem report to approved fix to release...' },
        ],
      },
    ],
  },

  '9.5': {
    clauseTitle: '9.5 — Maintain Records',
    evidenceRequired: true,
    steps: [
      {
        id: '9.5_records',
        stepLabel: 'Problem Records',
        requirementText: 'Maintain complete records of all software problems, investigations, and resolutions.',
        fields: [
          { id: 'records_location', label: 'Problem records management', type: 'richtext', helpText: 'Describe where problem records are maintained: tracking system (e.g., Jira, Azure DevOps), retention period (minimum until end of device service life), access controls, and backup procedures.', placeholder: 'Where are records maintained? Retention period? Access controls?' },
          { id: 'records_ref', label: 'Problem records reference', type: 'doc_reference', helpText: 'Link the problem tracking system or a report showing the current state of problem records.' },
        ],
      },
    ],
  },

  '9.6': {
    clauseTitle: '9.6 — Analyse Problems for Trends',
    evidenceRequired: true,
    steps: [
      {
        id: '9.6_trends',
        stepLabel: 'Trend Analysis',
        requirementText: 'Analyse software problem reports to identify trends that may indicate systemic issues requiring corrective action.',
        fields: [
          { id: 'trend_analysis', label: 'Trend analysis approach', type: 'richtext', helpText: 'Describe how problem trends are identified and analysed: frequency of analysis (e.g., monthly, quarterly), metrics tracked (e.g., defect density, recurrence rate, time to resolution), criteria for triggering corrective action, and how results are reported to management.', placeholder: 'How are problem trends identified and analysed? Frequency? Metrics used?' },
        ],
      },
    ],
  },

  '9.7': {
    clauseTitle: '9.7 — Verify Software Problem Resolution',
    evidenceRequired: true,
    steps: [
      {
        id: '9.7_verify',
        stepLabel: 'Resolution Verification',
        requirementText: 'Verify that each software problem has been resolved and the resolution does not introduce new problems.',
        fields: [
          { id: 'resolution_verification', label: 'Resolution verification approach', type: 'richtext', helpText: 'Describe how problem resolution is verified: targeted testing of the fix, regression testing to confirm no new issues introduced, review of the fix by someone other than the implementer, and sign-off criteria.', placeholder: 'How is problem resolution verified? Regression testing? Review?' },
        ],
      },
    ],
  },

  '9.8': {
    clauseTitle: '9.8 — Test Documentation Contents',
    evidenceRequired: true,
    steps: [
      {
        id: '9.8_test_docs',
        stepLabel: 'Test Documentation',
        requirementText: 'Ensure test documentation records contain all required information for regulatory review, including test setup, expected/actual results, and pass/fail criteria.',
        fields: [
          { id: 'test_doc_contents', label: 'Test documentation content requirements', type: 'richtext', helpText: 'Define the required content for test documentation: test ID, test objective, prerequisites/setup, test steps, expected results, actual results, pass/fail verdict, tester identification, date, and references to requirements under test. This should match the template defined in your QMS.', placeholder: 'What content is required in test records? (setup, expected results, actual results, verdict)' },
          { id: 'test_doc_ref', label: 'Test documentation template reference', type: 'doc_reference', helpText: 'Link the test documentation template or procedure that defines the required content for test records.' },
        ],
      },
    ],
  },
};
