/**
 * ISO 13485:2016 Clause Content
 * Extracted from the Clause-by-Clause Explanation document.
 * Used to show detailed clause explanations in QMS map nodes.
 */

export interface ISO13485ClauseContent {
  clause: string;
  title: string;
  summary: string;
  keyRequirements: string[];
  whyItMatters: string;
}

export const ISO_13485_CLAUSE_CONTENT: Record<string, ISO13485ClauseContent> = {
  // Clause 4 - Quality Management System
  '4.1': {
    clause: '4.1',
    title: 'General Requirements',
    summary: 'Organizations must establish, document, implement, and maintain a QMS and continually improve its effectiveness.',
    keyRequirements: [
      'Identify QMS processes and their interactions',
      'Apply risk-based approach to control processes',
      'Document procedures and records',
      'Maintain quality objectives and quality policy',
    ],
    whyItMatters: 'The QMS forms the foundation for all regulatory compliance. Without documented processes and controls, organizations cannot demonstrate compliance to auditors or regulatory bodies.',
  },
  '4.2': {
    clause: '4.2',
    title: 'Documentation Requirements',
    summary: 'The QMS documentation must include quality policy, quality manual, documented procedures, and records.',
    keyRequirements: [
      'Establish and maintain a Quality Manual',
      'Control documents (approval, review, updates)',
      'Maintain records as evidence of conformity',
      'Define document retention periods',
    ],
    whyItMatters: 'Documentation provides objective evidence of compliance. During audits, inspectors will request documented procedures and records to verify your QMS is implemented as described.',
  },

  // Clause 5 - Management Responsibility
  '5.1': {
    clause: '5.1',
    title: 'Management Commitment',
    summary: 'Top management must demonstrate commitment to the QMS through policy, objectives, resources, and regular reviews.',
    keyRequirements: [
      'Communicate importance of meeting regulatory requirements',
      'Establish quality policy and objectives',
      'Conduct management reviews',
      'Ensure availability of resources',
    ],
    whyItMatters: 'FDA and notified bodies specifically look for evidence of management commitment. Quality cannot be delegated away from the top.',
  },
  '5.5': {
    clause: '5.5',
    title: 'Responsibility, Authority, and Communication',
    summary: 'Responsibilities and authorities must be defined, documented, and communicated. A Management Representative must be appointed.',
    keyRequirements: [
      'Define organizational roles and responsibilities',
      'Appoint a Management Representative',
      'Ensure internal communication about QMS effectiveness',
      'Document authority for quality-related decisions',
    ],
    whyItMatters: 'Clear accountability prevents quality issues from falling through the cracks. Auditors will verify that responsible individuals can demonstrate knowledge of their QMS duties.',
  },
  '5.6': {
    clause: '5.6',
    title: 'Management Review',
    summary: 'Top management must review the QMS at planned intervals to ensure its continuing suitability, adequacy, and effectiveness.',
    keyRequirements: [
      'Conduct reviews at least annually',
      'Review inputs: audits, feedback, process performance, CAPAs',
      'Document outputs: improvements, resource needs, policy changes',
      'Maintain records of management review',
    ],
    whyItMatters: 'Management review is a mandatory checkpoint. Under QMSR, these records are NOW subject to FDA inspection (a major change from legacy QSR).',
  },

  // Clause 6 - Resource Management
  '6.1': {
    clause: '6.1',
    title: 'Provision of Resources',
    summary: 'The organization must determine and provide resources needed to implement, maintain, and improve the QMS.',
    keyRequirements: [
      'Identify resource requirements (personnel, equipment, facilities)',
      'Provide adequate resources for QMS activities',
      'Review resource adequacy periodically',
      'Plan for growth and scaling',
    ],
    whyItMatters: 'Understaffed or under-resourced quality departments are a common audit finding. Resource constraints can lead to shortcuts and compliance gaps.',
  },
  '6.2': {
    clause: '6.2',
    title: 'Human Resources',
    summary: 'Personnel performing work affecting product quality must be competent based on education, training, skills, and experience.',
    keyRequirements: [
      'Define competence requirements for each role',
      'Provide training to achieve competence',
      'Evaluate training effectiveness',
      'Maintain training records',
    ],
    whyItMatters: 'Training records are heavily scrutinized during audits. Inspectors will verify that personnel are qualified for their roles and that training is documented.',
  },
  '6.3': {
    clause: '6.3',
    title: 'Infrastructure',
    summary: 'The organization must determine, provide, and maintain infrastructure needed to achieve conformity to product requirements.',
    keyRequirements: [
      'Define buildings, workspace, and equipment needs',
      'Document maintenance requirements',
      'Maintain equipment qualification records',
      'Control IT infrastructure and software validation',
    ],
    whyItMatters: 'Equipment qualification (IQ/OQ/PQ) and facility controls directly impact product quality. Infrastructure failures can lead to product non-conformances.',
  },
  '6.4': {
    clause: '6.4',
    title: 'Work Environment and Contamination Control',
    summary: 'The organization must determine and manage work environment conditions and implement contamination controls.',
    keyRequirements: [
      'Document work environment requirements',
      'Control temperature, humidity, cleanliness as needed',
      'Establish contamination control procedures',
      'Monitor environmental conditions where critical',
    ],
    whyItMatters: 'Environmental controls are critical for sterile devices, implants, and sensitive manufacturing processes. Contamination can cause serious patient harm.',
  },

  // Clause 7 - Product Realization
  '7.1': {
    clause: '7.1',
    title: 'Planning of Product Realization',
    summary: 'Planning must define quality objectives, processes, resources, and activities for product realization.',
    keyRequirements: [
      'Define quality objectives for the product',
      'Establish risk management activities',
      'Plan verification, validation, and acceptance criteria',
      'Document required records',
    ],
    whyItMatters: 'Product realization planning establishes the roadmap for development. Poor planning leads to scope creep, missed requirements, and regulatory delays.',
  },
  '7.2': {
    clause: '7.2',
    title: 'Customer-Related Processes',
    summary: 'Requirements related to the product must be determined, reviewed, and communicated with customers.',
    keyRequirements: [
      'Identify customer and regulatory requirements',
      'Review requirements before commitment',
      'Resolve requirement differences',
      'Establish customer communication channels',
    ],
    whyItMatters: 'Misunderstood requirements are a leading cause of design failures. Clear communication prevents costly late-stage changes.',
  },
  '7.3': {
    clause: '7.3',
    title: 'Design and Development (General)',
    summary: 'Design and development must be planned, with defined stages, reviews, responsibilities, and interfaces.',
    keyRequirements: [
      'Document design and development procedures',
      'Plan stages and review points',
      'Define verification and validation activities',
      'Maintain Design History File (DHF)',
    ],
    whyItMatters: 'Design controls are the heart of medical device development. The DHF provides the audit trail proving your design meets requirements.',
  },
  '7.3.2': {
    clause: '7.3.2',
    title: 'Design and Development Planning',
    summary: 'Design planning must define phases, activities, responsibilities, and resources for the design project.',
    keyRequirements: [
      'Define design phases and milestones',
      'Assign responsibilities and authorities',
      'Establish communication between design teams',
      'Plan for design reviews at appropriate stages',
    ],
    whyItMatters: 'Without proper planning, design projects become chaotic. Planning ensures all activities are coordinated and nothing falls through the cracks.',
  },
  '7.3.3': {
    clause: '7.3.3',
    title: 'Design and Development Inputs',
    summary: 'Design inputs must include functional, performance, safety, and regulatory requirements.',
    keyRequirements: [
      'Document functional and performance requirements',
      'Identify applicable regulations and standards',
      'Include risk management outputs',
      'Review and approve design inputs',
    ],
    whyItMatters: 'Design inputs form the foundation of your device requirements. Incomplete inputs lead to missing features, safety gaps, and failed validation.',
  },
  '7.3.4': {
    clause: '7.3.4',
    title: 'Design and Development Outputs',
    summary: 'Design outputs must meet input requirements, provide information for production, and reference acceptance criteria.',
    keyRequirements: [
      'Design outputs must meet design inputs',
      'Provide production and servicing information',
      'Reference acceptance criteria',
      'Identify essential safety characteristics',
    ],
    whyItMatters: 'Design outputs are what you actually build and manufacture. They must trace back to inputs to demonstrate design control.',
  },
  '7.3.5': {
    clause: '7.3.5',
    title: 'Design and Development Review',
    summary: 'Systematic reviews must be conducted to evaluate design results and identify problems.',
    keyRequirements: [
      'Conduct reviews at appropriate design stages',
      'Include relevant functions in reviews',
      'Evaluate ability to meet requirements',
      'Document review results and actions',
    ],
    whyItMatters: 'Design reviews catch problems early when they are cheaper to fix. They also provide objective evidence that design was properly controlled.',
  },
  '7.3.6': {
    clause: '7.3.6',
    title: 'Design and Development Verification',
    summary: 'Verification ensures design outputs meet design input requirements.',
    keyRequirements: [
      'Perform verification at planned stages',
      'Compare outputs to inputs',
      'Document verification methods and results',
      'Address non-conformances before proceeding',
    ],
    whyItMatters: 'Verification answers: "Did we build it right?" It confirms the design meets specifications before validation.',
  },
  '7.3.7': {
    clause: '7.3.7',
    title: 'Design and Development Validation',
    summary: 'Validation ensures the resulting product is capable of meeting intended use requirements.',
    keyRequirements: [
      'Validate before product release',
      'Use production-equivalent units',
      'Include clinical evaluation where needed',
      'Document validation results',
    ],
    whyItMatters: 'Validation answers: "Did we build the right thing?" It proves the device actually works for its intended purpose.',
  },
  '7.3.8': {
    clause: '7.3.8',
    title: 'Design and Development Transfer',
    summary: 'Transfer of design outputs to manufacturing must be documented and verified.',
    keyRequirements: [
      'Document transfer activities',
      'Verify outputs are suitable for manufacturing',
      'Ensure manufacturing can replicate design',
      'Maintain transfer records',
    ],
    whyItMatters: 'Transfer failures cause production problems. Design must be manufacturable at scale before release.',
  },
  '7.3.9': {
    clause: '7.3.9',
    title: 'Control of Design Changes',
    summary: 'Design changes must be identified, reviewed, verified, validated, and approved before implementation.',
    keyRequirements: [
      'Identify and document changes',
      'Assess impact on product and regulations',
      'Verify and validate changes',
      'Obtain approval before implementation',
    ],
    whyItMatters: 'Uncontrolled changes are a major audit finding. Changes must be evaluated for impact on safety, performance, and regulatory status.',
  },
  '7.4': {
    clause: '7.4',
    title: 'Purchasing',
    summary: 'Purchased products must meet requirements. Suppliers must be evaluated and selected.',
    keyRequirements: [
      'Define supplier evaluation criteria',
      'Maintain approved supplier list',
      'Verify purchased products',
      'Document purchasing information',
    ],
    whyItMatters: 'Supplier quality directly impacts device quality. Poor supplier controls are a common source of non-conformances.',
  },
  '7.4.1': {
    clause: '7.4.1',
    title: 'Purchasing Process',
    summary: 'The organization must evaluate and select suppliers based on their ability to supply conforming product.',
    keyRequirements: [
      'Establish supplier evaluation criteria',
      'Classify suppliers by risk/criticality',
      'Conduct supplier audits where appropriate',
      'Re-evaluate suppliers periodically',
    ],
    whyItMatters: 'Supplier criticality assessment ensures you focus controls where they matter most. Critical suppliers require more oversight.',
  },
  '7.5': {
    clause: '7.5',
    title: 'Production and Service Provision',
    summary: 'Production must be carried out under controlled conditions with validated processes.',
    keyRequirements: [
      'Control production conditions',
      'Validate special processes',
      'Maintain traceability',
      'Preserve product during handling',
    ],
    whyItMatters: 'Production controls ensure consistent, safe products. Process validation proves manufacturing can reliably produce conforming devices.',
  },
  '7.5.6': {
    clause: '7.5.6',
    title: 'Validation of Processes',
    summary: 'Processes where output cannot be verified by monitoring must be validated.',
    keyRequirements: [
      'Identify processes requiring validation',
      'Define validation criteria and methods',
      'Document validation activities (IQ/OQ/PQ)',
      'Revalidate when changes occur',
    ],
    whyItMatters: 'Special processes (sterilization, welding, coating) must be validated because you cannot inspect quality into the product afterward.',
  },

  // Clause 8 - Measurement, Analysis, and Improvement
  '8.1': {
    clause: '8.1',
    title: 'General (Measurement & Improvement)',
    summary: 'Plan and implement monitoring, measurement, analysis, and improvement processes.',
    keyRequirements: [
      'Plan monitoring and measurement activities',
      'Use statistical methods where appropriate',
      'Analyze data for trends',
      'Drive continual improvement',
    ],
    whyItMatters: 'Without measurement, you cannot improve. Data-driven decisions are expected by regulators.',
  },
  '8.2.1': {
    clause: '8.2.1',
    title: 'Feedback',
    summary: 'Gather and monitor information about customer satisfaction and product performance.',
    keyRequirements: [
      'Document feedback collection process',
      'Monitor customer complaints',
      'Track product performance data',
      'Feed back into QMS improvement',
    ],
    whyItMatters: 'Feedback from the field is critical for post-market surveillance. It identifies problems before they become widespread.',
  },
  '8.2.2': {
    clause: '8.2.2',
    title: 'Complaint Handling',
    summary: 'Complaints must be handled in a timely manner with documented procedures.',
    keyRequirements: [
      'Document complaint handling procedure',
      'Investigate complaints promptly',
      'Determine if CAPA is needed',
      'Report to authorities when required',
    ],
    whyItMatters: 'Complaints are a key input to CAPA and PMS. Improper handling can lead to undetected safety issues.',
  },
  '8.2.3': {
    clause: '8.2.3',
    title: 'Reporting to Regulatory Authorities',
    summary: 'When required, notify authorities about complaints and issue advisory notices.',
    keyRequirements: [
      'Document reporting procedures',
      'Know regulatory reporting timelines',
      'Issue advisory notices when needed',
      'Maintain reporting records',
    ],
    whyItMatters: 'Failure to report is a serious violation. MDR/IVDR and FDA require timely reporting of adverse events.',
  },
  '8.2.4': {
    clause: '8.2.4',
    title: 'Internal Audit',
    summary: 'Conduct internal audits to verify QMS conformity and effectiveness.',
    keyRequirements: [
      'Document audit procedures',
      'Plan audits based on importance and history',
      'Use qualified auditors',
      'Follow up on findings',
    ],
    whyItMatters: 'Under QMSR, internal audit records are NOW subject to FDA inspection. This is a major change from legacy QSR.',
  },
  '8.3': {
    clause: '8.3',
    title: 'Control of Nonconforming Product',
    summary: 'Nonconforming products must be identified, controlled, and prevented from unintended use.',
    keyRequirements: [
      'Identify and segregate nonconforming product',
      'Document disposition decisions',
      'Notify affected parties',
      'Implement rework procedures if needed',
    ],
    whyItMatters: 'Releasing nonconforming product can harm patients. Controls prevent defective devices from reaching the market.',
  },
  '8.4': {
    clause: '8.4',
    title: 'Analysis of Data',
    summary: 'Collect and analyze data to demonstrate QMS suitability and identify improvement opportunities.',
    keyRequirements: [
      'Analyze customer satisfaction data',
      'Monitor product conformity trends',
      'Evaluate supplier performance',
      'Track CAPA effectiveness',
    ],
    whyItMatters: 'Data analysis reveals patterns that individual events might hide. Trending is expected by regulators.',
  },
  '8.5': {
    clause: '8.5',
    title: 'Improvement (General)',
    summary: 'Take action to ensure continual improvement of QMS effectiveness.',
    keyRequirements: [
      'Use quality policy as improvement driver',
      'Act on audit results',
      'Implement data analysis findings',
      'Conduct management reviews',
    ],
    whyItMatters: 'Continual improvement is not optional. Regulators expect to see evidence that your QMS is evolving and improving.',
  },
  '8.5.2': {
    clause: '8.5.2',
    title: 'Corrective Action',
    summary: 'Take action to eliminate causes of nonconformities to prevent recurrence.',
    keyRequirements: [
      'Review nonconformities (including complaints)',
      'Determine root causes',
      'Implement corrective actions',
      'Verify effectiveness of actions',
    ],
    whyItMatters: 'Corrective action eliminates the ROOT CAUSE, not just the symptom. Recurring problems indicate ineffective CAPAs.',
  },
  '8.5.3': {
    clause: '8.5.3',
    title: 'Preventive Action',
    summary: 'Take action to eliminate causes of potential nonconformities to prevent occurrence.',
    keyRequirements: [
      'Identify potential nonconformities',
      'Determine potential causes',
      'Implement preventive actions',
      'Review effectiveness',
    ],
    whyItMatters: 'Preventive action is proactive quality. Identifying and addressing potential problems before they occur is the hallmark of a mature QMS.',
  },
};

/**
 * Get clause content for a given ISO clause reference (e.g., "7.3.3", "8.5.2-8.5.3")
 */
export function getClauseContent(clauseRef: string): ISO13485ClauseContent[] {
  const results: ISO13485ClauseContent[] = [];
  
  // Handle range format like "8.5.2-8.5.3"
  if (clauseRef.includes('-')) {
    const [start, end] = clauseRef.split('-').map(s => s.trim());
    const startContent = ISO_13485_CLAUSE_CONTENT[start];
    const endContent = ISO_13485_CLAUSE_CONTENT[end];
    if (startContent) results.push(startContent);
    if (endContent && endContent !== startContent) results.push(endContent);
    return results;
  }
  
  // Handle comma-separated format like "7.1, 7.3.3"
  if (clauseRef.includes(',')) {
    clauseRef.split(',').forEach(clause => {
      const content = ISO_13485_CLAUSE_CONTENT[clause.trim()];
      if (content) results.push(content);
    });
    return results;
  }
  
  // Single clause lookup
  const content = ISO_13485_CLAUSE_CONTENT[clauseRef.trim()];
  if (content) results.push(content);
  
  return results;
}

/**
 * Parse a clause reference like "7.3.3-7.3.5" or "8.2.1-8.2.3" into individual clauses
 */
export function parseClauseRange(clauseRef: string): string[] {
  if (clauseRef.includes('-')) {
    const [start, end] = clauseRef.split('-').map(s => s.trim());
    return [start, end];
  }
  if (clauseRef.includes(',')) {
    return clauseRef.split(',').map(s => s.trim());
  }
  return [clauseRef.trim()];
}
