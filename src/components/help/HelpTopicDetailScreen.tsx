import React, { useState } from 'react';
import { ArrowLeft, Info, CheckCircle2, AlertCircle, Lightbulb, Shield, BookOpen, ExternalLink, Target, ClipboardCheck, Globe, Database, Cpu, BarChart3, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HelpTopicDetailScreenProps {
  topicId: string;
  onBack: () => void;
}

// Glossary definitions for technical terms
const glossaryTerms: Record<string, { title: string; definition: string; examples?: string[]; references?: string[] }> = {
  'soup': {
    title: 'SOUP (Software of Unknown Provenance)',
    definition: 'Software that is already developed and generally available, but was not developed for the purpose of being incorporated into a medical device. This includes open-source libraries, commercial off-the-shelf software, and legacy code.',
    examples: ['React.js framework', 'Node.js runtime', 'OpenSSL library', 'SQLite database'],
    references: ['IEC 62304 §8 - Software of Unknown Provenance'],
  },
  'fuzz-testing': {
    title: 'Fuzz Testing (Fuzzing)',
    definition: 'An automated software testing technique that involves providing invalid, unexpected, or random data as inputs to a computer program. The goal is to find security vulnerabilities, crashes, and memory leaks that could be exploited.',
    examples: ['Random input generation', 'Protocol fuzzing', 'File format fuzzing', 'API endpoint fuzzing'],
    references: ['OWASP Testing Guide', 'IEC 81001-5-1 Cybersecurity'],
  },
  'cve-scanning': {
    title: 'CVE Scanning',
    definition: 'The process of scanning software components against the Common Vulnerabilities and Exposures (CVE) database to identify known security vulnerabilities. Essential for SBOM (Software Bill of Materials) security.',
    examples: ['Dependency vulnerability scanning', 'Container image scanning', 'OS package scanning'],
    references: ['FDA Cybersecurity Guidance', 'NIST Cybersecurity Framework'],
  },
  'stride': {
    title: 'STRIDE Threat Model',
    definition: 'A threat modeling framework developed by Microsoft. Each letter represents a type of security threat: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.',
    examples: [
      'Spoofing: Fake user authentication',
      'Tampering: Modifying data in transit',
      'Repudiation: Denying actions without proof',
      'Information Disclosure: Data breach',
      'Denial of Service: System overload',
      'Elevation of Privilege: Gaining admin access',
    ],
    references: ['IEC 81001-5-1', 'AAMI TIR57'],
  },
  'data-leakage': {
    title: 'Data Leakage (ML/AI)',
    definition: 'A critical validation error where information from the test dataset inadvertently leaks into the training process, causing artificially inflated performance metrics that do not reflect real-world performance.',
    examples: ['Using test data for feature selection', 'Overlapping train/test samples', 'Target leakage in features'],
    references: ['FDA AI/ML Guidance', 'IMDRF AI/ML Guidance'],
  },
  'boundary-values': {
    title: 'Boundary Value Testing',
    definition: 'A testing technique that focuses on testing at the edges of input ranges. Bugs are often found at boundaries (min, max, min-1, max+1) rather than in the middle of valid ranges.',
    examples: ['Testing 0, 1, max-1, max', 'Empty strings vs. max length', 'Date boundaries (leap years)'],
    references: ['IEC 62304 §5.6 - Software Verification'],
  },
  'fault-injection': {
    title: 'Fault Injection Testing',
    definition: 'A testing technique that deliberately introduces faults into a system to test its error handling and recovery capabilities. Critical for safety-critical medical device software.',
    examples: ['Memory corruption', 'Network failures', 'Sensor malfunctions', 'Power interruption'],
    references: ['IEC 62304 §5.6', 'ISO 14971 Risk Management'],
  },
  'iq-oq-pq': {
    title: 'IQ/OQ/PQ (Equipment Qualification)',
    definition: 'A three-stage qualification process for equipment validation. Installation Qualification (IQ) verifies installation. Operational Qualification (OQ) verifies operation within specs. Performance Qualification (PQ) verifies performance under actual use.',
    examples: ['Test equipment validation', 'Manufacturing equipment', 'Software tools validation'],
    references: ['21 CFR 820.72', 'ISO 13485 §7.6'],
  },
  'pen-testing': {
    title: 'Penetration Testing',
    definition: 'A simulated cyber attack against a system to check for exploitable vulnerabilities. For medical devices, this includes testing device interfaces, network connections, and data storage.',
    examples: ['Network penetration', 'Web application testing', 'Wireless protocol testing', 'Physical security'],
    references: ['FDA Cybersecurity Guidance', 'IEC 81001-5-1'],
  },
  'assume-breach': {
    title: 'Assume Breach Testing',
    definition: 'A security testing philosophy that assumes attackers have already gained access to the system. Tests focus on detection, containment, and recovery rather than just prevention.',
    examples: ['Lateral movement testing', 'Data exfiltration detection', 'Incident response validation'],
    references: ['NIST Zero Trust Architecture', 'FDA Cybersecurity Guidance'],
  },
};

// Comprehensive regulatory standards definitions
const regulatoryStandards: Record<string, {
  title: string;
  fullName: string;
  overview: string;
  scope: string;
  keyRequirements: { section: string; title: string; description: string }[];
  vvRelevance: string[];
  applicability: string;
  relatedStandards: string[];
  externalLink?: string;
}> = {
  'iso-13485': {
    title: 'ISO 13485:2016',
    fullName: 'Medical devices — Quality management systems — Requirements for regulatory purposes',
    overview: 'ISO 13485 is the international standard for quality management systems (QMS) specific to the medical device industry. It provides a framework for consistent design, development, production, installation, and servicing of medical devices that are safe for their intended purpose.',
    scope: 'Applies to organizations involved in one or more stages of the medical device lifecycle, including design, development, production, storage, distribution, installation, servicing, and final decommissioning.',
    keyRequirements: [
      { section: '§4.1', title: 'QMS General Requirements', description: 'Establish, document, implement, and maintain a QMS. Ensure processes are validated and controlled.' },
      { section: '§4.2', title: 'Documentation Requirements', description: 'Quality manual, procedures, records, and device master records must be established and maintained.' },
      { section: '§7.1', title: 'Planning of Product Realization', description: 'Plan and develop processes for product realization, including risk management activities.' },
      { section: '§7.3.3', title: 'Design and Development Inputs', description: 'Define functional, performance, safety, and regulatory requirements as design inputs.' },
      { section: '§7.3.4', title: 'Design and Development Outputs', description: 'Outputs must meet input requirements and provide information for production and servicing.' },
      { section: '§7.3.5', title: 'Design and Development Review', description: 'Systematic reviews at suitable stages to evaluate ability to meet requirements.' },
      { section: '§7.3.6', title: 'Design and Development Verification', description: 'Verification must confirm design outputs meet design input requirements.' },
      { section: '§7.3.7', title: 'Design and Development Validation', description: 'Validation must confirm the product meets defined user requirements and intended uses.' },
      { section: '§7.5.6', title: 'Process Validation', description: 'Validate any production or service processes where output cannot be verified by inspection.' },
      { section: '§8.2.6', title: 'Monitoring and Measurement', description: 'Apply suitable methods for monitoring and measuring product characteristics.' },
    ],
    vvRelevance: [
      'Sections 7.3.6 and 7.3.7 directly mandate V&V activities',
      'Design review requirements ensure continuous verification throughout development',
      'Process validation requirements extend V&V beyond product to manufacturing processes',
      'Documentation requirements ensure traceability and evidence preservation',
    ],
    applicability: 'Globally recognized. Required for CE Marking (EU), Health Canada, ANVISA (Brazil), NMPA (China), and many other jurisdictions. Often used as the foundation for country-specific QMS requirements.',
    relatedStandards: ['ISO 14971', 'IEC 62304', 'IEC 62366-1', 'ISO 10993 series'],
    externalLink: 'https://www.iso.org/standard/59752.html',
  },
  'iec-62304': {
    title: 'IEC 62304',
    fullName: 'Medical device software — Software life cycle processes',
    overview: 'IEC 62304 defines the lifecycle requirements for the development of medical device software and software within medical devices. It provides a framework for safe software design, development, maintenance, and risk management.',
    scope: 'Applies to the development and maintenance of medical device software. This includes both standalone software (SaMD) and software embedded in medical devices (SiMD).',
    keyRequirements: [
      { section: '§4', title: 'General Requirements', description: 'Apply risk management to software development. Classify software into safety classes A, B, or C.' },
      { section: '§5.1', title: 'Software Development Planning', description: 'Create and maintain a software development plan covering lifecycle activities.' },
      { section: '§5.2', title: 'Software Requirements Analysis', description: 'Define and document software requirements derived from system requirements.' },
      { section: '§5.3', title: 'Software Architectural Design', description: 'Transform requirements into architecture defining structure and interfaces.' },
      { section: '§5.4', title: 'Software Detailed Design', description: 'Refine architecture into units that can be implemented and tested.' },
      { section: '§5.5', title: 'Software Unit Implementation', description: 'Implement units and verify implementation follows detailed design.' },
      { section: '§5.6', title: 'Software Integration & Testing', description: 'Integrate units, verify integration, and test integrated software.' },
      { section: '§5.7', title: 'Software System Testing', description: 'Test complete software system against software requirements.' },
      { section: '§6', title: 'Software Maintenance', description: 'Plan for and execute software maintenance activities, including problem resolution.' },
      { section: '§7', title: 'Software Risk Management', description: 'Identify hazards, evaluate risks, and implement risk controls throughout the lifecycle.' },
      { section: '§8', title: 'Software Configuration Management', description: 'Control software items, changes, and ensure reproducibility of builds.' },
      { section: '§9', title: 'Software Problem Resolution', description: 'Establish processes to identify, analyze, and resolve software problems.' },
    ],
    vvRelevance: [
      'Sections 5.6-5.7 define software verification and validation requirements',
      'Software safety classification (A, B, C) determines V&V rigor',
      'Class C software requires the most extensive V&V documentation',
      'Traceability from requirements through architecture to test cases is mandatory',
    ],
    applicability: 'Internationally recognized. Required for FDA 510(k)/PMA (software-related submissions), CE Marking (EU MDR/IVDR), and most regulatory jurisdictions. Essential for any software in a medical device.',
    relatedStandards: ['ISO 14971', 'IEC 62366-1', 'IEC 81001-5-1', 'ISO 13485'],
    externalLink: 'https://www.iec.ch/dyn/www/f?p=103:22:0::::FSP_ORG_ID:1245',
  },
  '21-cfr-820': {
    title: '21 CFR Part 820',
    fullName: 'Quality System Regulation (QSR) - FDA',
    overview: 'The FDA Quality System Regulation (QSR) establishes requirements for methods used in the design, manufacture, packaging, labeling, storage, installation, and servicing of all finished medical devices intended for human use. It is the primary regulation governing medical device quality in the United States.',
    scope: 'Applies to manufacturers of finished medical devices intended for commercial distribution in the United States, including both domestic and foreign manufacturers.',
    keyRequirements: [
      { section: '§820.20', title: 'Management Responsibility', description: 'Management must establish quality policy and ensure adequate resources for quality.' },
      { section: '§820.25', title: 'Personnel', description: 'Personnel performing work affecting quality must be competent and trained.' },
      { section: '§820.30(a)', title: 'Design Controls General', description: 'Establish and maintain procedures to control design of devices.' },
      { section: '§820.30(c)', title: 'Design Input', description: 'Define and document design requirements addressing intended use and user needs.' },
      { section: '§820.30(d)', title: 'Design Output', description: 'Document design outputs in terms that can be verified against inputs.' },
      { section: '§820.30(e)', title: 'Design Review', description: 'Conduct design reviews at appropriate stages.' },
      { section: '§820.30(f)', title: 'Design Verification', description: 'Verify that design output meets design input requirements.' },
      { section: '§820.30(g)', title: 'Design Validation', description: 'Validate device design under actual or simulated use conditions.' },
      { section: '§820.30(h)', title: 'Design Transfer', description: 'Establish procedures to ensure design is correctly translated to production.' },
      { section: '§820.30(i)', title: 'Design Changes', description: 'Document and control design changes before implementation.' },
      { section: '§820.30(j)', title: 'Design History File', description: 'Maintain a DHF containing complete design history.' },
      { section: '§820.75', title: 'Process Validation', description: 'Validate processes where results cannot be fully verified by inspection.' },
    ],
    vvRelevance: [
      '§820.30(f) directly mandates design verification with documented results',
      '§820.30(g) requires design validation under actual or simulated use conditions',
      'Design History File (DHF) must contain all V&V records',
      'Production process validation extends V&V beyond product design',
    ],
    applicability: 'Mandatory for all medical devices marketed in the United States. FDA inspectors audit against these requirements. Non-compliance can result in Warning Letters, import alerts, consent decrees, and product seizures.',
    relatedStandards: ['ISO 13485', '21 CFR Part 11', '21 CFR Part 803'],
    externalLink: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820',
  },
  'eu-mdr': {
    title: 'EU MDR 2017/745',
    fullName: 'Regulation (EU) 2017/745 - European Medical Device Regulation',
    overview: 'The EU MDR is the comprehensive regulatory framework governing medical devices in the European Union. It replaced the Medical Device Directive (MDD) 93/42/EEC and establishes more stringent requirements for safety, performance, and clinical evidence.',
    scope: 'Applies to all medical devices placed on the EU market, including accessories, software, and custom-made devices. Covers the entire lifecycle from design to post-market surveillance.',
    keyRequirements: [
      { section: 'Article 5', title: 'Placing on the Market', description: 'Devices must meet applicable General Safety and Performance Requirements (GSPR).' },
      { section: 'Article 10', title: 'General Obligations of Manufacturers', description: 'Manufacturers must establish, document, implement, and maintain a QMS.' },
      { section: 'Article 14', title: 'General Obligations of AR', description: 'Authorized Representative obligations for non-EU manufacturers.' },
      { section: 'Article 61', title: 'Clinical Evaluation', description: 'Clinical evaluation must demonstrate conformity with GSPR through clinical data.' },
      { section: 'Annex I', title: 'GSPR', description: 'General Safety and Performance Requirements - 23 essential requirements.' },
      { section: 'Annex II', title: 'Technical Documentation', description: 'Complete technical documentation requirements including V&V evidence.' },
      { section: 'Annex III', title: 'Technical Documentation (PMS)', description: 'Post-market surveillance documentation requirements.' },
      { section: 'Annex VI', title: 'CE Marking', description: 'Requirements for affixing CE marking to devices.' },
      { section: 'Annex IX', title: 'Conformity Assessment QMS', description: 'Conformity assessment based on QMS and technical documentation assessment.' },
      { section: 'Annex X', title: 'Type Examination', description: 'Conformity assessment based on type examination.' },
      { section: 'Annex XI', title: 'Production QA', description: 'Conformity assessment based on product conformity verification.' },
    ],
    vvRelevance: [
      'Annex II §6.1 requires demonstration of conformity through V&V',
      'Clinical evaluation (Article 61) is a form of validation',
      'Risk management integration requires risk control verification',
      'Post-market surveillance validates real-world performance',
    ],
    applicability: 'Mandatory for all medical devices placed on the EU market since May 26, 2021 (with transition periods). Notified Body involvement required for Class IIa, IIb, and III devices.',
    relatedStandards: ['EN ISO 13485', 'EN ISO 14971', 'EN 62304', 'EN 62366-1'],
    externalLink: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32017R0745',
  },
  'iec-62366': {
    title: 'IEC 62366-1',
    fullName: 'Medical devices — Application of usability engineering to medical devices',
    overview: 'IEC 62366-1 specifies a process for analyzing, specifying, developing, and evaluating the usability of medical devices as it relates to safety. It focuses on preventing use errors that could cause harm.',
    scope: 'Applies to all medical devices. Particularly relevant for devices that interact with users (clinicians, patients, caregivers) and where use errors could lead to harm.',
    keyRequirements: [
      { section: '§5.1', title: 'Use Specification', description: 'Specify medical device characteristics related to safety: intended use, users, use environment.' },
      { section: '§5.2', title: 'User Interface Analysis', description: 'Identify characteristics of the user interface related to safety.' },
      { section: '§5.3', title: 'Hazard-Related Use Scenarios', description: 'Identify and describe hazard-related use scenarios.' },
      { section: '§5.4', title: 'User Interface Specification', description: 'Establish user interface specification addressing identified risks.' },
      { section: '§5.5', title: 'User Interface Evaluation Plan', description: 'Plan formative and summative evaluations.' },
      { section: '§5.6', title: 'User Interface Design and Implementation', description: 'Design UI to mitigate use-related risks.' },
      { section: '§5.7', title: 'Formative Evaluation', description: 'Iterative testing during development to identify usability issues.' },
      { section: '§5.8', title: 'Summative Evaluation', description: 'Final validation to demonstrate safety of the user interface.' },
      { section: '§5.9', title: 'Usability Engineering File', description: 'Compile and maintain usability engineering documentation.' },
    ],
    vvRelevance: [
      'Formative evaluations are verification activities for usability',
      'Summative evaluation is the validation of use-safety',
      'Use error analysis feeds into risk management and V&V planning',
      'Critical tasks require specific validation protocols',
    ],
    applicability: 'Required by EU MDR (referenced in Annex I GSPR §5), FDA guidance on human factors, and most regulatory jurisdictions. Essential for Class II and III devices.',
    relatedStandards: ['ISO 14971', 'IEC 62304', 'IEC/TR 62366-2 (guidance)'],
    externalLink: 'https://www.iec.ch/dyn/www/f?p=103:22:0::::FSP_ORG_ID:1245',
  },
  'iso-14971': {
    title: 'ISO 14971',
    fullName: 'Medical devices — Application of risk management to medical devices',
    overview: 'ISO 14971 provides the international framework for risk management throughout the medical device lifecycle. It establishes principles and processes for identifying hazards, estimating and evaluating risks, controlling risks, and monitoring effectiveness.',
    scope: 'Applies to all stages of the medical device lifecycle: design, production, post-production, and disposal. Covers all types of risks including those related to biocompatibility, software, usability, and data security.',
    keyRequirements: [
      { section: '§4', title: 'General Requirements', description: 'Establish and document a risk management process. Define risk acceptability criteria.' },
      { section: '§5', title: 'Risk Analysis', description: 'Identify intended use, identify hazards, estimate risks for each hazard.' },
      { section: '§6', title: 'Risk Evaluation', description: 'Evaluate estimated risks against established criteria.' },
      { section: '§7.1', title: 'Risk Control Option Analysis', description: 'Identify and analyze risk control options.' },
      { section: '§7.2', title: 'Risk Control Implementation', description: 'Implement selected risk control measures.' },
      { section: '§7.3', title: 'Residual Risk Evaluation', description: 'Evaluate residual risk after control implementation.' },
      { section: '§7.4', title: 'Benefit-Risk Analysis', description: 'When residual risks are not acceptable, weigh benefits against risks.' },
      { section: '§7.5', title: 'Risk Control Completeness', description: 'Verify all hazards have been considered and all risk controls implemented.' },
      { section: '§8', title: 'Overall Residual Risk Evaluation', description: 'Evaluate the aggregate residual risk.' },
      { section: '§9', title: 'Risk Management Report', description: 'Document results of risk management process.' },
      { section: '§10', title: 'Production & Post-Production', description: 'Collect and review production and post-production information.' },
    ],
    vvRelevance: [
      'Risk control measures must be verified for implementation (§7.2)',
      'Risk control effectiveness must be verified (§7.3)',
      'V&V activities validate that risk controls reduce risks as intended',
      'Post-production monitoring validates real-world risk control effectiveness',
    ],
    applicability: 'Universally required. Referenced by EU MDR, FDA, Health Canada, TGA, and all major regulatory authorities. The foundation of medical device safety assurance.',
    relatedStandards: ['IEC 62304', 'IEC 62366-1', 'ISO 13485', 'IEC 81001-5-1'],
    externalLink: 'https://www.iso.org/standard/72704.html',
  },
  'iec-81001-5-1': {
    title: 'IEC 81001-5-1',
    fullName: 'Health software and health IT systems safety, effectiveness and security — Part 5-1: Security',
    overview: 'IEC 81001-5-1 provides requirements and guidance for the security of health software and health IT systems. It focuses on cybersecurity throughout the product lifecycle, addressing threats, vulnerabilities, and security controls.',
    scope: 'Applies to the security of health software, including medical device software (SaMD and SiMD), health IT systems, and personal health systems.',
    keyRequirements: [
      { section: '§5.2', title: 'Security Management', description: 'Establish security processes, roles, and responsibilities.' },
      { section: '§5.3', title: 'Threat Modeling', description: 'Identify and document security threats (e.g., using STRIDE).' },
      { section: '§5.4', title: 'Security Requirements', description: 'Define security requirements based on threat analysis.' },
      { section: '§5.5', title: 'Secure Design', description: 'Design software to address identified security requirements.' },
      { section: '§5.6', title: 'Secure Implementation', description: 'Implement code following secure coding guidelines.' },
      { section: '§5.7', title: 'Security Verification', description: 'Verify security controls through testing (fuzz, pen-test, SAST/DAST).' },
      { section: '§5.8', title: 'Security Validation', description: 'Validate security in operational environment.' },
      { section: '§5.9', title: 'Security Update Management', description: 'Manage security updates throughout product lifecycle.' },
      { section: '§6', title: 'SBOM', description: 'Maintain Software Bill of Materials for vulnerability management.' },
    ],
    vvRelevance: [
      'Security verification (§5.7) is a specialized form of V&V',
      'Penetration testing validates security controls',
      'SBOM and CVE scanning are ongoing verification activities',
      'Security validation demonstrates real-world security effectiveness',
    ],
    applicability: 'Becoming mandatory. Referenced by EU MDR (cybersecurity requirements), FDA premarket guidance, and emerging regulations globally. Essential for connected/networked medical devices.',
    relatedStandards: ['IEC 62304', 'AAMI TIR57', 'FDA Cybersecurity Guidance', 'NIST Cybersecurity Framework'],
    externalLink: 'https://www.iec.ch/dyn/www/f?p=103:22:0::::FSP_ORG_ID:1245',
  },
};

// Component to render text with hyperlinked glossary terms
const LinkedText: React.FC<{ text: string; onTermClick: (term: string) => void }> = ({ text, onTermClick }) => {
  const termMappings: Record<string, string> = {
    'SOUP': 'soup',
    'Fuzz testing': 'fuzz-testing',
    'Fuzz': 'fuzz-testing',
    'CVE scanning': 'cve-scanning',
    'CVE': 'cve-scanning',
    'STRIDE': 'stride',
    'Data Leakage': 'data-leakage',
    'Boundary Values': 'boundary-values',
    'Fault Injection': 'fault-injection',
    'IQ/OQ': 'iq-oq-pq',
    'IQ/OQ/PQ': 'iq-oq-pq',
    'Pen-Test': 'pen-testing',
    'Pen-Testing': 'pen-testing',
    'Assume Breach': 'assume-breach',
  };

  let result = text;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;

  // Sort by length descending to match longer terms first
  const sortedTerms = Object.keys(termMappings).sort((a, b) => b.length - a.length);
  
  for (const term of sortedTerms) {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const matches = [...text.matchAll(regex)];
    
    for (const match of matches) {
      if (match.index !== undefined && match.index >= lastIndex) {
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index));
        }
        parts.push(
          <button
            key={`${term}-${match.index}`}
            onClick={() => onTermClick(termMappings[term])}
            className="text-primary hover:underline font-medium"
          >
            {match[0]}
          </button>
        );
        lastIndex = match.index + match[0].length;
      }
    }
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
};

// Glossary detail view
const GlossaryDetailView: React.FC<{ termId: string; onBack: () => void }> = ({ termId, onBack }) => {
  const term = glossaryTerms[termId];
  
  if (!term) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Term not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">{term.title}</h2>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">{term.definition}</p>
        </div>

        {term.examples && (
          <div>
            <h4 className="font-semibold mb-3">Examples</h4>
            <ul className="space-y-2">
              {term.examples.map((example, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {term.references && (
          <div>
            <h4 className="font-semibold mb-3">Regulatory References</h4>
            <div className="space-y-2">
              {term.references.map((ref, idx) => (
                <div key={idx} className="flex gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{ref}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Standard detail view - comprehensive standard summaries
const StandardDetailView: React.FC<{ standardId: string; onBack: () => void; onStandardClick?: (id: string) => void }> = ({ standardId, onBack, onStandardClick }) => {
  const standard = regulatoryStandards[standardId];
  
  if (!standard) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Standard not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">{standard.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{standard.fullName}</p>
      </div>

      {/* Overview */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-sm font-medium text-primary mb-2">Overview</p>
        <p className="text-sm text-muted-foreground">{standard.overview}</p>
      </div>

      {/* Scope */}
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Scope
        </h4>
        <p className="text-sm text-muted-foreground">{standard.scope}</p>
      </div>

      {/* Key Requirements */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Key Requirements
        </h4>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {standard.keyRequirements.map((req, idx) => (
            <div key={idx} className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">
                  {req.section}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{req.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* V&V Relevance */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          V&V Relevance
        </h4>
        <ul className="space-y-2">
          {standard.vvRelevance.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
              <span className="text-green-500">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Applicability */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Globe className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Global Applicability</p>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                {standard.applicability}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Standards */}
      <div>
        <h4 className="font-semibold mb-3">Related Standards</h4>
        <div className="flex flex-wrap gap-2">
          {standard.relatedStandards.map((rel, idx) => {
            // Map display name to standardId
            const standardMapping: Record<string, string> = {
              'ISO 14971': 'iso-14971',
              'IEC 62304': 'iec-62304',
              'IEC 62366-1': 'iec-62366',
              'ISO 13485': 'iso-13485',
              'EN ISO 13485': 'iso-13485',
              'EN ISO 14971': 'iso-14971',
              'EN 62304': 'iec-62304',
              'EN 62366-1': 'iec-62366',
              'IEC 81001-5-1': 'iec-81001-5-1',
            };
            const mappedId = standardMapping[rel];
            
            return mappedId && regulatoryStandards[mappedId] ? (
              <button
                key={idx}
                onClick={() => onStandardClick?.(mappedId)}
                className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
              >
                {rel}
              </button>
            ) : (
              <span
                key={idx}
                className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-full"
              >
                {rel}
              </span>
            );
          })}
        </div>
      </div>

      {/* External Link */}
      {standard.externalLink && (
        <div className="pt-2 border-t">
          <a
            href={standard.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            View official standard documentation
          </a>
        </div>
      )}
    </div>
  );
};

// Detailed content for each navigable topic
const topicDetails: Record<string, {
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}> = {
  'vv-verification': {
    title: 'Verification',
    icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Confirmation through objective evidence that specified requirements have been fulfilled. 
            Tests design outputs against design inputs.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Purpose</h4>
          <p className="text-sm text-muted-foreground">
            Ensure the design output meets the design input requirements at each development stage.
            The key question is: "Did we build the product right?"
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Activities</h4>
          <ul className="space-y-2">
            {[
              'Design Reviews (documented with objective evidence)',
              'Unit Testing & Integration Testing',
              'Code Reviews and Static Analysis',
              'Component Testing and Inspection',
              'Protocol-driven System Testing',
              'Worst-case analysis and simulation',
              'Environmental stress testing',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Regulatory References</h4>
          <div className="space-y-2">
            {[
              { code: '21 CFR 820.30(f)', title: 'FDA Design Verification' },
              { code: 'ISO 13485:2016 §7.3.6', title: 'Design Verification' },
              { code: 'IEC 62304 §5.6', title: 'Software Verification' },
              { code: 'EU MDR Annex II §6.1', title: 'Technical Documentation' },
            ].map((ref, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{ref.code}</strong>
                  <span className="text-muted-foreground"> - {ref.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Common Mistake</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                  Treating verification as a one-time event. Verification must occur at each stage 
                  of development, not just at the end. Each design change requires re-verification 
                  of affected requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the V&V Module to link each verification test case directly to design inputs. 
                  The traceability matrix automatically shows coverage gaps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'vv-validation': {
    title: 'Validation',
    icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Confirmation through objective evidence that requirements for a specific intended use 
            are consistently fulfilled. Tests the device under actual or simulated use conditions.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Purpose</h4>
          <p className="text-sm text-muted-foreground">
            Demonstrate the final device meets user needs and intended uses under real-world conditions.
            The key question is: "Did we build the right product?"
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Activities</h4>
          <ul className="space-y-2">
            {[
              'Summative Usability Testing (IEC 62366-1)',
              'Clinical Performance Studies',
              'Simulated Use Testing',
              'User Acceptance Testing',
              'Biocompatibility & Safety Testing',
              'Real-world performance evaluation',
              'Patient outcome studies',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Regulatory References</h4>
          <div className="space-y-2">
            {[
              { code: '21 CFR 820.30(g)', title: 'FDA Design Validation' },
              { code: 'ISO 13485:2016 §7.3.7', title: 'Design Validation' },
              { code: 'IEC 62366-1', title: 'Usability Engineering' },
              { code: 'EU MDR Article 61', title: 'Clinical Evaluation' },
            ].map((ref, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{ref.code}</strong>
                  <span className="text-muted-foreground"> - {ref.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">Best Practice</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Validation must include production-equivalent units. Prototype testing is 
                  verification, not validation. Ensure units are manufactured using final 
                  production processes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Critical Requirement</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                  Validation testing must be conducted under conditions that simulate actual use 
                  or are actual use conditions. Laboratory-only testing is insufficient for validation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'vv-design-transfer': {
    title: 'Design Transfer',
    icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            The bridge between Design & Development and Production. Ensures the device 
            can be reliably manufactured to specification.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Purpose</h4>
          <p className="text-sm text-muted-foreground">
            Ensure design specifications are correctly translated into production specifications 
            and the manufacturing process consistently produces conforming product.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Elements</h4>
          <ul className="space-y-2">
            {[
              'Device Master Record (DMR) completion',
              'Process Validation (IQ/OQ/PQ)',
              'Manufacturing instructions and work instructions',
              'Acceptance criteria and inspection procedures',
              'Supplier qualification and component specifications',
              'Equipment qualification',
              'Production staff training verification',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Verification During Transfer</h4>
          <ul className="space-y-2">
            {[
              'First Article Inspection',
              'Process capability studies (Cpk)',
              'Equipment qualification',
              'Production staff training verification',
              'Incoming inspection procedures',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Link the Design Transfer Protocol to your BOM version to ensure the 
                  production configuration matches the validated design.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'vv-plans': {
    title: 'V&V Plans',
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Master documents defining the overall strategy, scope, methodology, acceptance 
            criteria, and roles for verification and validation activities.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">A V&V Plan Must Include</h4>
          <ul className="space-y-3">
            {[
              { title: 'Scope', desc: "What's included and explicitly excluded" },
              { title: 'Methodology', desc: 'Test, Analysis, Inspection, or Demonstration' },
              { title: 'Acceptance Criteria', desc: 'Quantitative pass/fail criteria' },
              { title: 'Roles & Responsibilities', desc: 'Who approves, who executes' },
              { title: 'Traceability', desc: 'Mapping to requirements and risks' },
              { title: 'Environment', desc: 'Test conditions, equipment, calibration' },
              { title: 'Sample Size', desc: 'Statistical justification for sample quantities' },
            ].map((item, idx) => (
              <li key={idx} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">Best Practice</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a Master Validation Plan (MVP) early in development. This ensures 
                  testing resources are planned and validation doesn't become a bottleneck.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'vv-protocols': {
    title: 'V&V Protocols',
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Detailed test scripts specifying exact procedures, equipment, acceptance criteria, 
            and data collection methods for specific verification or validation activities.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Protocol Structure</h4>
          <ul className="space-y-3">
            {[
              { title: 'Purpose & Scope', desc: 'Clear statement of what is being tested and why' },
              { title: 'Test Articles', desc: 'Specific units/samples to be tested with identification' },
              { title: 'Equipment List', desc: 'All required equipment with calibration status' },
              { title: 'Procedure Steps', desc: 'Detailed step-by-step instructions' },
              { title: 'Data Forms', desc: 'Pre-designed forms for recording results' },
              { title: 'Acceptance Criteria', desc: 'Clear pass/fail criteria for each test' },
              { title: 'Deviation Handling', desc: 'Process for documenting and addressing deviations' },
            ].map((item, idx) => (
              <li key={idx} className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Critical Rule</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                  Protocols must be approved BEFORE execution. Changing acceptance criteria 
                  after testing is a major regulatory finding.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'vv-traceability': {
    title: 'Traceability Matrix',
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            A living document that maps user needs → design inputs → design outputs → 
            V&V activities → production specifications, ensuring complete requirement coverage.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Traceability Chain</h4>
          <div className="space-y-2">
            {[
              'User Needs / Intended Use',
              'Design Input Requirements',
              'Design Output Specifications',
              'Verification Test Cases',
              'Validation Test Cases',
              'Risk Controls',
              'Production Specifications',
            ].map((item, idx, arr) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {idx + 1}
                </div>
                <span className="text-sm">{item}</span>
                {idx < arr.length - 1 && (
                  <div className="flex-1 border-t border-dashed border-primary/30 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The XyReg Traceability Module automatically generates the traceability matrix 
                  and highlights any requirements without linked test cases.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Audit Focus Area</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                  Auditors will check for bidirectional traceability - every requirement must 
                  trace to tests AND every test must trace back to requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'vv-regulatory': {
    title: 'Regulatory Framework',
    icon: <Shield className="h-6 w-6 text-primary" />,
    content: null, // Will be rendered dynamically with onStandardClick
  },
  'vv-survival-guide': {
    title: 'V&V Survival Guide',
    icon: <AlertCircle className="h-6 w-6 text-amber-600" />,
    content: null, // Will be rendered dynamically with onTermClick
  },
  // Requirements Management detail topics
  'req-user-needs': {
    title: 'User Needs (UNs)',
    icon: <Target className="h-6 w-6 text-primary" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            High-level statements of what users (clinicians, patients, caregivers) require from the device. 
            User Needs form the foundation of your design inputs and are the starting point for all 
            requirement decomposition.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Purpose</h4>
          <p className="text-sm text-muted-foreground">
            Capture the "voice of the customer" in regulatory-compliant language. User Needs drive 
            all downstream requirements and are validated (not just verified) to confirm the device 
            meets actual user expectations.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">How to Write Good User Needs</h4>
          <ul className="space-y-2">
            {[
              'Start with "The [user] needs..." or "The [user] shall be able to..."',
              'Focus on outcomes, not implementation details',
              'Be specific enough to be testable',
              'Include context of use (environment, frequency, criticality)',
              'Identify the stakeholder type (clinician, patient, technician, etc.)',
              'Link to clinical or business justification',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Example User Needs</h4>
          <div className="space-y-2">
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs font-mono text-primary">UN-DR-01</p>
              <p className="text-sm text-muted-foreground mt-1">
                "The healthcare professional needs to acquire a clear and stable EEG signal with 
                low impedance (&lt;5 kΩ) for the entire duration of the study."
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border">
              <p className="text-xs font-mono text-primary">UN-PD-01</p>
              <p className="text-sm text-muted-foreground mt-1">
                "The patient needs the device to be made of materials that do not cause skin 
                irritation during prolonged overnight use."
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Regulatory References</h4>
          <div className="space-y-2">
            {[
              { code: 'ISO 13485 §7.3.3', title: 'Design Inputs shall include user needs' },
              { code: '21 CFR 820.30(c)', title: 'FDA Design Input requirements' },
              { code: 'IEC 62366-1 §5.1', title: 'Use specification from user research' },
              { code: 'EU MDR Annex I §5', title: 'User-centered design requirements' },
            ].map((ref, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{ref.code}</strong>
                  <span className="text-muted-foreground"> - {ref.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Each User Need should link to at least one System Requirement. Use the "Link" 
                  button when creating SRs to establish traceability. Orphan UNs are flagged 
                  automatically in the Traceability Matrix.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'req-system': {
    title: 'System Requirements (SRs)',
    icon: <ClipboardCheck className="h-6 w-6 text-primary" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Technical specifications that address user needs at the system level. SRs define what 
            the complete device must do, including performance, safety, regulatory, and environmental 
            requirements.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Purpose</h4>
          <p className="text-sm text-muted-foreground">
            Translate user-facing needs into measurable, testable technical specifications. SRs 
            form the bridge between "what users want" and "how the device works."
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Requirement Categories</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Functional', desc: 'What the device must do' },
              { label: 'Performance', desc: 'How well it must perform' },
              { label: 'Safety', desc: 'Risk mitigations and fail-safes' },
              { label: 'Regulatory', desc: 'Compliance obligations' },
              { label: 'Environmental', desc: 'Operating conditions' },
              { label: 'Interface', desc: 'Connections and protocols' },
            ].map((cat, idx) => (
              <div key={idx} className="p-2 bg-muted/50 rounded border">
                <p className="text-xs font-medium">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">SMART Criteria</h4>
          <ul className="space-y-2">
            {[
              { letter: 'S', word: 'Specific', desc: 'Unambiguous and clear' },
              { letter: 'M', word: 'Measurable', desc: 'Quantifiable acceptance criteria' },
              { letter: 'A', word: 'Achievable', desc: 'Technically feasible' },
              { letter: 'R', word: 'Relevant', desc: 'Traces to a user need' },
              { letter: 'T', word: 'Testable', desc: 'Can be verified objectively' },
            ].map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {item.letter}
                </span>
                <span>
                  <strong className="text-foreground">{item.word}:</strong>
                  <span className="text-muted-foreground"> {item.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Common Mistake</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                  Avoid vague requirements like "The device shall be fast" or "The display shall be 
                  readable." Instead: "Response time shall be ≤200ms" or "Font size shall be ≥14pt."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'req-software': {
    title: 'Software Requirements (SWRs)',
    icon: <ClipboardCheck className="h-6 w-6 text-blue-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">IEC 62304 Requirement</p>
          <p className="text-sm text-muted-foreground">
            Per IEC 62304, software requirements decompose system requirements into specific software 
            functions, interfaces, performance criteria, and safety classifications.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Software Safety Classification</h4>
          <p className="text-sm text-muted-foreground mb-3">
            IEC 62304 classifies software based on potential contribution to hazardous situations:
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">Class A</p>
              <p className="text-xs text-muted-foreground">No injury or damage to health is possible</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Class B</p>
              <p className="text-xs text-muted-foreground">Non-serious injury is possible</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-900 dark:text-red-300">Class C</p>
              <p className="text-xs text-muted-foreground">Death or serious injury is possible</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Required SWR Content</h4>
          <ul className="space-y-2">
            {[
              'Functional and performance requirements',
              'Software system inputs and outputs',
              'Interfaces with other systems/SOUP',
              'Alarm and warning requirements',
              'Security and cybersecurity requirements',
              'Usability-critical functions',
              'Data integrity and backup requirements',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  XyReg automatically tracks software safety class at the requirement level. 
                  Link SWRs to risk controls for integrated hazard traceability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'req-hardware': {
    title: 'Hardware Requirements (HWRs)',
    icon: <ClipboardCheck className="h-6 w-6 text-orange-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Technical specifications for physical components, materials, mechanical properties, 
            electrical characteristics, and manufacturing tolerances of the device.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">HWR Categories</h4>
          <div className="space-y-2">
            {[
              { title: 'Mechanical', items: ['Dimensions & tolerances', 'Material specifications', 'Strength & durability'] },
              { title: 'Electrical', items: ['Power requirements', 'Signal characteristics', 'EMC compliance'] },
              { title: 'Environmental', items: ['Operating temperature', 'Humidity tolerance', 'IP rating'] },
              { title: 'Biocompatibility', items: ['ISO 10993 compliance', 'Material safety', 'Sterilization compatibility'] },
            ].map((cat, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium mb-1">{cat.title}</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {cat.items.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Standards</h4>
          <div className="space-y-2">
            {[
              { code: 'IEC 60601-1', title: 'Medical electrical equipment safety' },
              { code: 'ISO 10993', title: 'Biocompatibility evaluation' },
              { code: 'IEC 61010-1', title: 'Laboratory equipment safety' },
              { code: 'IEC 62471', title: 'Photobiological safety' },
            ].map((ref, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <Shield className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{ref.code}</strong>
                  <span className="text-muted-foreground"> - {ref.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Link HWRs directly to verification test protocols. For components with 
                  tolerances, ensure test acceptance criteria match the requirement bounds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  // System Architecture Topics
  'arch-pure-hardware': {
    title: 'Pure Hardware Device',
    icon: <Shield className="h-6 w-6 text-slate-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-300 mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            A medical device that contains no embedded software, programmable electronics, or 
            firmware. The device operates through purely mechanical, electrical, or chemical means.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Characteristics</h4>
          <ul className="space-y-2">
            {[
              'No microprocessors, microcontrollers, or FPGAs',
              'No firmware or embedded software',
              'Relies on mechanical, pneumatic, or analog electronic principles',
              'Examples: surgical instruments, passive implants, manual testing equipment',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Documentation Focus</h4>
          <div className="space-y-2">
            {[
              { title: 'Materials Specification', desc: 'Detailed material composition and biocompatibility' },
              { title: 'Mechanical Drawings', desc: 'CAD files, tolerances, assembly instructions' },
              { title: 'Manufacturing Process', desc: 'Production methods, quality controls, validation' },
              { title: 'Physical Testing', desc: 'Durability, fatigue, environmental stress testing' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Standards</h4>
          <div className="space-y-2">
            {[
              { code: 'ISO 13485', title: 'Quality Management Systems' },
              { code: 'ISO 14971', title: 'Risk Management' },
              { code: 'ISO 10993', title: 'Biocompatibility (if patient contact)' },
              { code: 'IEC 60601-1', title: 'Electrical Safety (if applicable)' },
            ].map((ref, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{ref.code}</strong>
                  <span className="text-muted-foreground"> - {ref.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pure hardware devices skip IEC 62304 software lifecycle requirements but 
                  still require thorough design verification per ISO 13485 §7.3.6.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'arch-simd': {
    title: 'Software in Medical Device (SiMD)',
    icon: <Shield className="h-6 w-6 text-blue-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Software that is embedded within a hardware medical device. The software is integral 
            to device operation but cannot function independently without the hardware platform.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Examples</h4>
          <ul className="space-y-2">
            {[
              'Infusion pump firmware controlling drug delivery',
              'Patient monitor software displaying vital signs',
              'Diagnostic equipment controllers',
              'Surgical robot control systems',
              'Implantable device firmware (pacemakers, neurostimulators)',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">IEC 62304 Requirements</h4>
          <p className="text-sm text-muted-foreground mb-3">
            SiMD is fully subject to IEC 62304 software lifecycle requirements:
          </p>
          <div className="space-y-2">
            {[
              { section: '§5.1', title: 'Software Development Planning' },
              { section: '§5.2', title: 'Software Requirements Analysis' },
              { section: '§5.3', title: 'Software Architectural Design' },
              { section: '§5.4', title: 'Software Detailed Design' },
              { section: '§5.5', title: 'Software Unit Implementation' },
              { section: '§5.6', title: 'Software Integration Testing' },
              { section: '§5.7', title: 'Software System Testing' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <Shield className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{item.section}</strong>
                  <span className="text-muted-foreground"> - {item.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Software Safety Classification</h4>
          <div className="space-y-2">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">Class A</p>
              <p className="text-xs text-muted-foreground">No injury possible - minimal documentation</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Class B</p>
              <p className="text-xs text-muted-foreground">Non-serious injury possible - moderate documentation</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-900 dark:text-red-300">Class C</p>
              <p className="text-xs text-muted-foreground">Death or serious injury possible - extensive documentation</p>
            </div>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the Architecture Diagram Editor to visualize hardware-software boundaries 
                  and identify SOUP components requiring additional risk analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'arch-samd': {
    title: 'Software as Medical Device (SaMD)',
    icon: <Shield className="h-6 w-6 text-purple-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">IMDRF Definition</p>
          <p className="text-sm text-muted-foreground">
            Software intended to be used for one or more medical purposes that perform these 
            purposes without being part of a hardware medical device. SaMD can run on 
            general-purpose computing platforms.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Examples</h4>
          <ul className="space-y-2">
            {[
              'Clinical decision support software (diagnostic algorithms)',
              'Medical imaging analysis apps (radiology AI)',
              'Remote patient monitoring platforms',
              'Digital therapeutics (DTx) applications',
              'Laboratory information management systems (LIMS)',
              'AI/ML-based diagnostic tools',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">IMDRF SaMD Risk Framework</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Risk categorization based on healthcare situation and information significance:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border rounded">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 border text-left">Significance</th>
                  <th className="p-2 border text-center">Critical</th>
                  <th className="p-2 border text-center">Serious</th>
                  <th className="p-2 border text-center">Non-Serious</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border font-medium">Treat/Diagnose</td>
                  <td className="p-2 border text-center bg-red-100 dark:bg-red-900/30">IV</td>
                  <td className="p-2 border text-center bg-orange-100 dark:bg-orange-900/30">III</td>
                  <td className="p-2 border text-center bg-amber-100 dark:bg-amber-900/30">II</td>
                </tr>
                <tr>
                  <td className="p-2 border font-medium">Drive Clinical Mgmt</td>
                  <td className="p-2 border text-center bg-orange-100 dark:bg-orange-900/30">III</td>
                  <td className="p-2 border text-center bg-amber-100 dark:bg-amber-900/30">II</td>
                  <td className="p-2 border text-center bg-green-100 dark:bg-green-900/30">I</td>
                </tr>
                <tr>
                  <td className="p-2 border font-medium">Inform Clinical Mgmt</td>
                  <td className="p-2 border text-center bg-amber-100 dark:bg-amber-900/30">II</td>
                  <td className="p-2 border text-center bg-green-100 dark:bg-green-900/30">I</td>
                  <td className="p-2 border text-center bg-green-100 dark:bg-green-900/30">I</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">AI/ML Considerations</h4>
          <ul className="space-y-2">
            {[
              'Algorithm lock vs. continuous learning documentation',
              'Training data representativeness and bias analysis',
              'Performance monitoring and drift detection',
              'FDA AI/ML Predetermined Change Control Plan (PCCP)',
              'IMDRF AI/ML guidance alignment',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  For AI/ML SaMD, use the Model Card feature to document algorithm versioning, 
                  training datasets, and performance metrics across patient subgroups.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'arch-block-diagrams': {
    title: 'Block Diagrams',
    icon: <Target className="h-6 w-6 text-teal-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
          <p className="text-sm font-medium text-teal-900 dark:text-teal-300 mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Visual representations showing system components, their relationships, data flows, 
            and interfaces. Block diagrams are essential for communicating system architecture 
            to stakeholders and regulators.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Diagram Types</h4>
          <div className="space-y-2">
            {[
              { title: 'System Context Diagram', desc: 'Shows device boundaries and external actors/systems' },
              { title: 'Functional Block Diagram', desc: 'Depicts major functional components and data flow' },
              { title: 'Hardware Block Diagram', desc: 'Physical components, PCBs, connectors, power' },
              { title: 'Software Architecture Diagram', desc: 'Modules, layers, interfaces, SOUP' },
              { title: 'Data Flow Diagram', desc: 'Information movement through the system' },
              { title: 'Network Topology', desc: 'Connected devices and communication protocols' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Required Elements</h4>
          <ul className="space-y-2">
            {[
              'Unique component identifiers for traceability',
              'Interface definitions (protocols, data formats)',
              'Data flow direction arrows',
              'Trust boundaries for cybersecurity analysis',
              'Safety-critical subsystem identification',
              'Version control and change history',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Regulatory Relevance</h4>
          <div className="space-y-2">
            {[
              { code: 'EU MDR Annex II §4', title: 'Technical documentation design' },
              { code: 'FDA 510(k)', title: 'System architecture overview' },
              { code: 'IEC 62304 §5.3', title: 'Software architectural design' },
            ].map((ref, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{ref.code}</strong>
                  <span className="text-muted-foreground"> - {ref.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use the Create Diagram tool to build interactive block diagrams. Components 
                  automatically link to requirements and SBOM entries for full traceability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'arch-software': {
    title: 'Software Architecture',
    icon: <Shield className="h-6 w-6 text-indigo-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-2">IEC 62304 Definition</p>
          <p className="text-sm text-muted-foreground">
            The organizational structure of software, including components, their externally 
            visible properties, and the relationships among them. Architecture defines how 
            the software fulfills requirements while managing complexity and risk.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Components</h4>
          <div className="space-y-2">
            {[
              { title: 'Software Items', desc: 'Identifiable components (source code, executables, libraries)' },
              { title: 'SOUP/OTS Components', desc: 'Third-party software with risk assessment' },
              { title: 'Interfaces', desc: 'APIs, communication protocols, data formats' },
              { title: 'Safety Classification', desc: 'Class A/B/C designation per component' },
              { title: 'Cybersecurity Boundaries', desc: 'Trust zones and attack surface mapping' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">SOUP Risk Assessment</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Per IEC 62304 §8, SOUP components require:
          </p>
          <ul className="space-y-2">
            {[
              'Identification and documentation of each SOUP item',
              'Functional and performance requirements',
              'Known anomaly assessment (CVE scanning)',
              'Verification of SOUP behavior within system context',
              'Software Bill of Materials (SBOM) maintenance',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Cybersecurity Per IEC 81001-5-1</h4>
          <ul className="space-y-2">
            {[
              'Threat modeling (STRIDE, attack trees)',
              'Security requirements specification',
              'Secure design patterns and principles',
              'Vulnerability management process',
              'Security testing and penetration testing',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Import your SBOM directly to auto-populate SOUP items. XyReg integrates 
                  CVE databases to flag known vulnerabilities in your dependencies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'arch-hardware': {
    title: 'Hardware Architecture',
    icon: <Shield className="h-6 w-6 text-orange-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            The physical structure and organization of the device, including PCB layouts, 
            component specifications, power systems, mechanical interfaces, and the 
            relationships between hardware subsystems.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Documentation Requirements</h4>
          <div className="space-y-2">
            {[
              { title: 'PCB Schematics', desc: 'Circuit diagrams, component placement, routing' },
              { title: 'Bill of Materials (BOM)', desc: 'Complete component list with specifications' },
              { title: 'Mechanical Drawings', desc: 'Enclosure, mounting, tolerances, materials' },
              { title: 'Power Architecture', desc: 'Power supply, distribution, isolation, protection' },
              { title: 'Interconnect Diagram', desc: 'Cables, connectors, signal routing' },
              { title: 'Thermal Analysis', desc: 'Heat dissipation, cooling, operating temperatures' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Safety Considerations</h4>
          <ul className="space-y-2">
            {[
              'Electrical isolation and patient protection (IEC 60601-1)',
              'EMC compliance and immunity (IEC 60601-1-2)',
              'Single fault safe design principles',
              'Critical component identification and qualification',
              'Derating analysis for reliability',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Standards</h4>
          <div className="space-y-2">
            {[
              { code: 'IEC 60601-1', title: 'Medical electrical equipment - General safety' },
              { code: 'IEC 60601-1-2', title: 'EMC requirements and tests' },
              { code: 'IEC 62368-1', title: 'Audio/video and IT equipment safety' },
              { code: 'ISO 10993', title: 'Biocompatibility (patient-contact materials)' },
            ].map((ref, idx) => (
              <div key={idx} className="flex gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{ref.code}</strong>
                  <span className="text-muted-foreground"> - {ref.title}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Link hardware components in your architecture diagram directly to BOM items 
                  and verification test protocols for complete design traceability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  // Usability Engineering (UEF) Deep Dives
  'uef-use-specification': {
    title: '5.1 - Use Specification',
    icon: <Target className="h-6 w-6 text-teal-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
          <p className="text-sm font-medium text-teal-900 dark:text-teal-300 mb-2">IEC 62366-1 Clause 5.1</p>
          <p className="text-sm text-muted-foreground">
            The Use Specification documents the intended medical indication, intended users, 
            use environment, and operating principle. It forms the foundation for all 
            subsequent usability engineering activities.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Required Elements</h4>
          <div className="space-y-2">
            {[
              { title: 'Intended Medical Indication', desc: 'The specific medical condition, disease, or purpose the device addresses' },
              { title: 'Intended Users', desc: 'Healthcare professionals, patients, caregivers, lay users - with training/experience levels' },
              { title: 'Intended Use Environment', desc: 'Hospital, clinic, home, ambulance, operating room - including lighting, noise, stress' },
              { title: 'Operating Principle', desc: 'How the device achieves its intended purpose (mode of action)' },
              { title: 'Target Patient Population', desc: 'Age, condition severity, mobility, cognitive status' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">User Characteristics to Document</h4>
          <ul className="space-y-2">
            {[
              'Physical capabilities (vision, hearing, dexterity, strength)',
              'Cognitive abilities (literacy, numeracy, language)',
              'Experience with similar devices or technology',
              'Training level and frequency of device use',
              'Age range and any age-related limitations',
              'Use under stress or fatigue conditions',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use Specification data syncs automatically from Device Definition. 
                  This ensures a single source of truth across your technical file.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'uef-ui-characteristics': {
    title: '5.2 - UI Characteristics',
    icon: <Target className="h-6 w-6 text-teal-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
          <p className="text-sm font-medium text-teal-900 dark:text-teal-300 mb-2">IEC 62366-1 Clause 5.2</p>
          <p className="text-sm text-muted-foreground">
            Identify and document all user interface elements - the physical and perceptual 
            characteristics through which users interact with the device.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">UI Element Categories</h4>
          <div className="space-y-2">
            {[
              { title: 'Displays', desc: 'Screens, indicators, gauges, LEDs, labels - visual feedback to users' },
              { title: 'Controls', desc: 'Buttons, knobs, switches, touchscreens, keyboards - user input mechanisms' },
              { title: 'Alarms & Signals', desc: 'Audible, visual, and tactile alerts - attention-getting mechanisms' },
              { title: 'Connections', desc: 'Cables, ports, consumable attachments - physical interfaces' },
              { title: 'Accessories', desc: 'Carrying cases, mounts, cleaning equipment - supporting items' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Safety Relevance Assessment</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Each UI element must be assessed for safety relevance:
          </p>
          <div className="space-y-2">
            {[
              { level: 'Critical', desc: 'Misuse could directly cause harm or death', color: 'text-red-600' },
              { level: 'Moderate', desc: 'Misuse could contribute to harm under certain conditions', color: 'text-amber-600' },
              { level: 'Low', desc: 'Misuse unlikely to cause harm', color: 'text-green-600' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                <span className={`font-medium text-sm ${item.color}`}>{item.level}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Critical Requirement</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                  Safety-relevant UI characteristics must be linked to Usability Hazards 
                  (Clause 5.3-5.4) and tested in the Summative Evaluation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'uef-usability-hazards': {
    title: '5.3-5.4 - Usability Hazards',
    icon: <AlertCircle className="h-6 w-6 text-red-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">IEC 62366-1 Clauses 5.3 & 5.4</p>
          <p className="text-sm text-muted-foreground">
            Identify use-related hazards and hazardous situations. A hazard is a potential 
            source of harm, while a hazardous situation is the circumstance in which a 
            user is exposed to that hazard.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Use Error Categories</h4>
          <div className="space-y-2">
            {[
              { title: 'Perception Errors', desc: 'User fails to notice or correctly perceive information (e.g., missed alarm, misread display)' },
              { title: 'Cognition Errors', desc: 'User misunderstands or makes incorrect decision (e.g., wrong mode selection, incorrect interpretation)' },
              { title: 'Action Errors', desc: 'User performs wrong action or fails to act (e.g., wrong button press, sequence error, omission)' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Analysis Methods</h4>
          <ul className="space-y-2">
            {[
              'Task Analysis - Break down device use into discrete steps',
              'P×C Analysis - Probability × Consequence for each hazard',
              'Literature Review - Similar devices, incident databases (MAUDE)',
              'Formative Testing - Observe real users, identify failure modes',
              'Expert Review - Cognitive walkthrough by human factors specialists',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Link to Risk Management</h4>
          <p className="text-sm text-muted-foreground">
            Usability hazards must feed into your ISO 14971 Risk Management process. 
            Use errors are often the initiating cause in hazardous situation sequences.
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create usability hazards directly from the Usability Engineering module. 
                  They automatically link to Risk Management for integrated traceability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'uef-evaluation-plan': {
    title: '5.5 - Evaluation Plan',
    icon: <ClipboardCheck className="h-6 w-6 text-blue-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">IEC 62366-1 Clause 5.5</p>
          <p className="text-sm text-muted-foreground">
            The Usability Evaluation Plan documents the strategy for formative and summative 
            testing, including objectives, methods, user groups, and acceptance criteria.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Plan Elements</h4>
          <div className="space-y-2">
            {[
              { title: 'Evaluation Objectives', desc: 'What questions are you trying to answer?' },
              { title: 'Methods', desc: 'Simulated use, actual use, cognitive walkthrough, heuristic review' },
              { title: 'User Groups', desc: 'Representative sample of intended users with defined characteristics' },
              { title: 'Sample Size', desc: 'Formative: 3-5 per round; Summative: 15+ (statistically justified)' },
              { title: 'Test Scenarios', desc: 'Critical tasks, routine tasks, edge cases, error recovery' },
              { title: 'Acceptance Criteria', desc: 'Task success rates, critical error thresholds, time limits' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Formative vs Summative</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">Formative</p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Iterative, during development</li>
                <li>• Goal: Identify and fix issues</li>
                <li>• Small sample (3-5 users)</li>
                <li>• Qualitative focus</li>
              </ul>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Summative</p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Final validation</li>
                <li>• Goal: Prove safety & effectiveness</li>
                <li>• Larger sample (15+ users)</li>
                <li>• Quantitative pass/fail</li>
              </ul>
            </div>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Common Mistake</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                  Don't skip formative testing. Multiple rounds of formative evaluation 
                  catch issues early when they're cheap to fix. Summative is too late for design changes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'uef-validation-results': {
    title: '5.7/5.9 - Validation Results',
    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">IEC 62366-1 Clauses 5.7 & 5.9</p>
          <p className="text-sm text-muted-foreground">
            Document usability testing results including participant demographics, task 
            performance data, use difficulties observed, and residual risk assessment.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Required Documentation</h4>
          <div className="space-y-2">
            {[
              { title: 'Participant Demographics', desc: 'Age, experience, training, representation of intended users' },
              { title: 'Task Performance Data', desc: 'Success/failure rates, task completion times, error counts' },
              { title: 'Use Difficulties', desc: 'Hesitations, workarounds, requests for help, confusion observed' },
              { title: 'Critical Task Analysis', desc: 'Detailed breakdown of safety-critical task performance' },
              { title: 'Root Cause Analysis', desc: 'Why did use errors occur? UI design vs. training vs. labeling' },
              { title: 'Residual Risk Summary', desc: 'Risks that remain after design optimization and training' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Acceptance Criteria Examples</h4>
          <ul className="space-y-2">
            {[
              'Critical tasks: 100% success rate (zero critical errors)',
              'Important tasks: ≥90% success rate',
              'Routine tasks: ≥80% success rate',
              'No single use error pattern in >10% of participants',
              'Time-critical tasks completed within clinically acceptable limits',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Link validation results directly to V&V test cases. The Traceability 
                  Matrix shows complete coverage from hazards to validation evidence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'uef-formative-evaluation': {
    title: 'Formative Evaluation',
    icon: <Target className="h-6 w-6 text-green-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Iterative testing during development to identify usability issues early. 
            The goal is to improve the design, not to validate it. Multiple rounds 
            are recommended throughout the development process.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Characteristics</h4>
          <ul className="space-y-2">
            {[
              'Low participant numbers (3-5 per round) are acceptable',
              'Focus on finding problems, not proving safety',
              'Iterative - multiple rounds as design evolves',
              'Qualitative data is primary (observations, think-aloud)',
              'Can use early prototypes, paper mockups, or simulations',
              'Informal setting, facilitator can interact with participant',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Methods</h4>
          <div className="space-y-2">
            {[
              { title: 'Think-Aloud Protocol', desc: 'Participants verbalize thoughts while using device' },
              { title: 'Cognitive Walkthrough', desc: 'Expert simulates user actions step-by-step' },
              { title: 'Heuristic Evaluation', desc: 'Experts assess against usability principles' },
              { title: 'Paper Prototyping', desc: 'Test concepts before building software/hardware' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">Best Practice</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Document formative findings even if informal. This evidence supports 
                  your design rationale and shows due diligence to regulators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'uef-summative-evaluation': {
    title: 'Summative Evaluation',
    icon: <CheckCircle2 className="h-6 w-6 text-blue-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Definition</p>
          <p className="text-sm text-muted-foreground">
            Final validation testing that demonstrates the device can be used safely 
            and effectively for its intended use. Uses statistically appropriate sample 
            sizes and produces quantitative pass/fail evidence.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Key Characteristics</h4>
          <ul className="space-y-2">
            {[
              'Statistically justified sample size (typically 15+ users)',
              'Production-equivalent device and IFU',
              'Simulated or actual use environment',
              'Representative of all intended user groups',
              'Minimal facilitator intervention',
              'Pre-defined pass/fail acceptance criteria',
              'Quantitative success/error rate data',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Sample Size Guidance</h4>
          <div className="p-3 bg-muted/50 rounded border">
            <p className="text-sm text-muted-foreground">
              FDA typically expects <strong>15 participants per distinct user group</strong>. 
              For Class II/III devices with safety-critical tasks, larger samples may be 
              needed for statistical power. Document your sample size rationale.
            </p>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300 text-sm">Critical Requirement</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                  Summative testing must use the <strong>final design</strong> with 
                  production-equivalent labeling. Changes after summative testing 
                  may require re-validation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  'uef-hazard-scenarios': {
    title: 'Hazard-Related Use Scenarios',
    icon: <AlertCircle className="h-6 w-6 text-red-600" />,
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">IEC 62366-1 Clause 5.6</p>
          <p className="text-sm text-muted-foreground">
            Critical tasks where use errors could lead to harm. These "hazard-related 
            use scenarios" require specific testing with pass/fail criteria and must 
            be validated in summative evaluation.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Identification Process</h4>
          <ul className="space-y-2">
            {[
              'Review usability hazards (Clause 5.3-5.4) for harm potential',
              'Identify tasks where use errors contribute to hazardous situations',
              'Define specific use scenarios that must be tested',
              'Establish pass/fail criteria for each scenario',
              'Link to Risk Management for severity classification',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Testing Requirements</h4>
          <div className="space-y-2">
            {[
              { title: 'Critical Errors', desc: 'Zero tolerance - any critical error = failure' },
              { title: 'Close Calls', desc: 'Document near-misses and recovery patterns' },
              { title: 'Root Cause', desc: 'If errors occur, determine if UI design or training issue' },
              { title: 'Residual Risk', desc: 'Remaining risk must be documented and accepted' },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded border">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">Examples</h4>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Infusion pump: Setting correct dose and rate</li>
              <li>• Defibrillator: Recognizing shockable rhythm and delivering shock</li>
              <li>• Insulin pen: Dialing correct dose, confirming injection complete</li>
              <li>• Ventilator: Responding to disconnect alarm</li>
            </ul>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-primary text-sm">XyReg Tip</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tag critical usability hazards in Risk Management. XyReg automatically 
                  flags them for mandatory summative testing coverage.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },

  // AI Assurance Lab Detail Screens
  'ai-data-vault': {
    title: 'Controlled Datasets (Data Vault)',
    icon: <Database className="h-5 w-5 text-indigo-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The Data Vault ensures training and testing datasets remain immutable and properly segregated—a 
          core requirement of EU AI Act Article 10 (Data Governance).
        </p>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Key Functions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Lock & Hash:</strong> Generate SHA-256 hash to prove dataset hasn't changed</p>
            <p><strong>Segregation:</strong> Training vs. Testing sets must never overlap</p>
            <p><strong>Lineage:</strong> Document data sources, preprocessing, and versioning</p>
            <p><strong>Block Animation:</strong> Prevents dragging training data to testing zone</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4 text-sm"><strong>EU AI Act Article 10:</strong> Training, validation, and testing datasets must be relevant, representative, free of errors, and complete.</CardContent>
        </Card>
      </div>
    ),
  },
  'ai-model-registry': {
    title: 'Model Registry (Device Under Test)',
    icon: <Cpu className="h-5 w-5 text-indigo-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Track AI model versions with cryptographic hashes. Models must be "Frozen" before validation to ensure reproducibility.
        </p>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Model Status Flow</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Trained:</strong> Model is still being developed (cannot run verification)</p>
            <p><strong>Frozen:</strong> Model is locked with SHA-256 hash (ready for testing)</p>
            <p><strong>Validated:</strong> Model has passed all verification tests</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
          <CardContent className="pt-4 text-sm"><strong>Critical:</strong> Never validate a model that is still "Trained"—this violates immutability requirements.</CardContent>
        </Card>
      </div>
    ),
  },
  'ai-bias-matrix': {
    title: 'Bias Matrix (Stratification Heatmap)',
    icon: <BarChart3 className="h-5 w-5 text-indigo-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Evaluate model performance across demographic subgroups to detect algorithmic bias—required by EU AI Act for high-risk AI systems.
        </p>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Metrics Grid (3×3)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Rows:</strong> Male, Female, Pediatric (demographic subgroups)</p>
            <p><strong>Columns:</strong> Precision, Recall, F1-Score</p>
            <p><strong>Green (≥95%):</strong> Excellent performance</p>
            <p><strong>Yellow (80-94%):</strong> Acceptable, monitor closely</p>
            <p><strong>Red (&lt;80%):</strong> Fail—investigate bias source</p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800">
          <CardContent className="pt-4 text-sm"><strong>Global Status:</strong> PASS only if ALL subgroups meet thresholds. Any red cell = FAIL.</CardContent>
        </Card>
      </div>
    ),
  },
  'ai-act-article9': {
    title: 'EU AI Act - Article 9: Risk Management',
    icon: <Shield className="h-5 w-5 text-indigo-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">High-risk AI systems shall be subject to a continuous iterative risk management process throughout their lifecycle.</p>
        <Card><CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
          <p>• Identify and analyse known/foreseeable risks</p>
          <p>• Estimate and evaluate residual risks</p>
          <p>• Adopt suitable risk mitigation measures</p>
          <p>• Test to ensure risks are effectively mitigated</p>
        </CardContent></Card>
      </div>
    ),
  },
  'ai-act-article10': {
    title: 'EU AI Act - Article 10: Data Governance',
    icon: <Database className="h-5 w-5 text-indigo-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Training, validation, and testing datasets shall meet quality criteria appropriate to the intended purpose.</p>
        <Card><CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
          <p>• Relevant, representative, and free of errors</p>
          <p>• Appropriate statistical properties for intended use</p>
          <p>• Documented data governance and management practices</p>
          <p>• Examination for possible biases likely to affect health/safety</p>
        </CardContent></Card>
      </div>
    ),
  },
  'ai-act-article11': {
    title: 'EU AI Act - Article 11: Technical Documentation',
    icon: <FileText className="h-5 w-5 text-indigo-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Technical documentation shall be drawn up before placing on market and kept up-to-date.</p>
        <Card><CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
          <p>• General description and intended purpose</p>
          <p>• Design specifications and architecture</p>
          <p>• Development process and validation methods</p>
          <p>• Risk management documentation</p>
        </CardContent></Card>
      </div>
    ),
  },
  'ai-act-article15': {
    title: 'EU AI Act - Article 15: Accuracy & Robustness',
    icon: <Target className="h-5 w-5 text-indigo-500" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">High-risk AI systems shall achieve appropriate levels of accuracy, robustness, and cybersecurity.</p>
        <Card><CardContent className="pt-4 space-y-2 text-sm text-muted-foreground">
          <p>• Declared performance metrics in instructions for use</p>
          <p>• Resilient against errors, faults, and inconsistencies</p>
          <p>• Protected against unauthorized third-party manipulation</p>
          <p>• Appropriate levels of cybersecurity</p>
        </CardContent></Card>
      </div>
    ),
  },
};

// Regulatory content with clickable standards
const RegulatoryContent: React.FC<{ onStandardClick: (id: string) => void }> = ({ onStandardClick }) => {
  const standards = [
    { id: 'iso-13485', code: 'ISO 13485:2016', title: 'Quality Management Systems' },
    { id: 'iec-62304', code: 'IEC 62304', title: 'Medical Device Software Lifecycle' },
    { id: '21-cfr-820', code: '21 CFR 820', title: 'FDA QSR (Quality System Regulation)' },
    { id: 'eu-mdr', code: 'EU MDR 2017/745', title: 'European Medical Device Regulation' },
    { id: 'iec-62366', code: 'IEC 62366-1', title: 'Usability Engineering' },
    { id: 'iso-14971', code: 'ISO 14971', title: 'Risk Management' },
    { id: 'iec-81001-5-1', code: 'IEC 81001-5-1', title: 'Cybersecurity' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-sm font-medium text-primary mb-2">Overview</p>
        <p className="text-sm text-muted-foreground">
          V&V activities are fundamental requirements across all major regulatory frameworks. 
          Click any standard below for a comprehensive summary.
        </p>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Key Standards & Regulations</h4>
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <Info className="h-3 w-3" /> Click any standard for detailed guidance
        </p>
        <div className="space-y-2">
          {standards.map((std) => (
            <button
              key={std.id}
              onClick={() => onStandardClick(std.id)}
              className="w-full p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">{std.code}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 pl-6">{std.title}</p>
            </button>
          ))}
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium text-primary text-sm">Multi-Market Strategy</p>
              <p className="text-sm text-muted-foreground mt-1">
                For devices targeting multiple markets, design your V&V program to meet 
                the most stringent requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Survival guide with linked terms
const SurvivalGuideContent: React.FC<{ onTermClick: (term: string) => void }> = ({ onTermClick }) => {
  const pitfalls = [
    { id: 1, title: "Inadequate Design Inputs", problem: "Vague requirements like 'easy to use'.", fix: "Write unambiguous, measurable specs.", tip: "Use the Requirements Module to flag unverifiable words." },
    { id: 2, title: "Uncontrolled Test Articles", problem: "Testing a prototype version that doesn't match the BOM.", fix: "Lock the BOM Snapshot before testing.", tip: "Link Protocol to a specific BOM Version." },
    { id: 3, title: "Testing the 'Wrong' Design", problem: "Using V&V for debugging/exploratory work.", fix: "Finish engineering 'Sandbox' tests before formal V&V.", tip: "Use 'Draft' state for exploration." },
    { id: 4, title: "Insufficient Sample Size", problem: "Testing n=1 and assuming reliability.", fix: "Calculate sample size based on Risk (90/95 confidence).", tip: "Check the Risk Matrix for 'High Risk' items requiring n=30+." },
    { id: 5, title: "Unvalidated Test Tools", problem: "Using a custom script that hasn't been validated (IQ/OQ).", fix: "Validate the tool before validating the device.", tip: "Attach 'Tool Validation Report' as a dependency." },
    { id: 6, title: "Poor Protocol Management", problem: "Moving the goalposts (changing criteria after testing).", fix: "Approve Protocol BEFORE execution.", tip: "System enforces 'Lock before Run' logic." },
    { id: 7, title: "Poor Test Methods", problem: "Tests rely on operator skill/subjectivity.", fix: "Invest in robust fixtures and automated hooks." },
    { id: 8, title: "Inadequate Software Testing", problem: "Testing only 'Happy Paths' (ignoring failure modes).", fix: "Test SOUP, Boundary Values (-1), and Fault Injection.", tip: "Link specific 'Software Failure Risks' to Test Cases." },
    { id: 9, title: "Poor Test Planning", problem: "Rushing to the lab without a Master Plan.", fix: "Create MVP (Master Validation Plan) months ahead." },
    { id: 10, title: "Not Comprehensive", problem: "Forgetting Packaging, Labeling, and Shelf-Life.", fix: "Traceability Matrix must show 100% coverage." },
    { id: 11, title: "Neglecting AI/ML Validation", problem: "Testing on training data (Data Leakage) or ignoring Bias.", fix: "Strict separation of Train/Test data & Stratified Testing.", tip: "Use the 'AI Model Card' snapshot feature.", theme: "ai" as const },
    { id: 12, title: "Overlooking Cybersecurity", problem: "Testing for function, not vulnerability.", fix: "Fuzz testing, CVE scanning, and Assume Breach testing.", tip: "Link Pen-Test Reports to Threat Analysis (STRIDE).", theme: "security" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-2">12 Common Pitfalls</p>
        <p className="text-sm text-muted-foreground">
          Avoid these validation failures that lead to FDA 483s, failed audits, and delayed product launches.
          <span className="block mt-2 text-xs text-primary">💡 Click on highlighted terms to learn more.</span>
        </p>
      </div>

      <div className="space-y-3">
        {pitfalls.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border ${
              item.theme === 'ai' 
                ? 'border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-700'
                : item.theme === 'security'
                ? 'border-red-200 bg-red-50/50 dark:bg-red-900/20 dark:border-red-700'
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">
                {item.id}
              </div>
              <div className="flex-1 space-y-2">
                <h5 className="font-medium text-sm">{item.title}</h5>
                <div className="text-xs space-y-1">
                  <div className="flex gap-2">
                    <span className="font-semibold text-red-600 dark:text-red-400 shrink-0">Problem:</span>
                    <span className="text-muted-foreground">
                      <LinkedText text={item.problem} onTermClick={onTermClick} />
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-green-600 dark:text-green-400 shrink-0">Fix:</span>
                    <span className="text-muted-foreground">
                      <LinkedText text={item.fix} onTermClick={onTermClick} />
                    </span>
                  </div>
                  {item.tip && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-primary/5 rounded border-l-2 border-primary">
                      <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        <strong className="text-primary">XyReg Tip:</strong>{' '}
                        <LinkedText text={item.tip} onTermClick={onTermClick} />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function HelpTopicDetailScreen({ topicId, onBack }: HelpTopicDetailScreenProps) {
  const [glossaryTerm, setGlossaryTerm] = useState<string | null>(null);
  const [standardId, setStandardId] = useState<string | null>(null);
  const topic = topicDetails[topicId];

  // If viewing a standard
  if (standardId) {
    return <StandardDetailView standardId={standardId} onBack={() => setStandardId(null)} onStandardClick={setStandardId} />;
  }

  // If viewing a glossary term
  if (glossaryTerm) {
    return <GlossaryDetailView termId={glossaryTerm} onBack={() => setGlossaryTerm(null)} />;
  }

  if (!topic) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Topic not found.</p>
      </div>
    );
  }

  // Special handling for regulatory content to inject onStandardClick
  if (topicId === 'vv-regulatory') {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to V&V Help
        </Button>
        
        <div className="flex items-center gap-3 mb-6">
          {topic.icon}
          <h2 className="text-xl font-semibold">{topic.title}</h2>
        </div>

        <RegulatoryContent onStandardClick={setStandardId} />
      </div>
    );
  }

  // Special handling for survival guide to inject onTermClick
  if (topicId === 'vv-survival-guide') {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to V&V Help
        </Button>
        
        <div className="flex items-center gap-3 mb-6">
          {topic.icon}
          <h2 className="text-xl font-semibold">{topic.title}</h2>
        </div>

        <SurvivalGuideContent onTermClick={setGlossaryTerm} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to V&V Help
      </Button>
      
      <div className="flex items-center gap-3 mb-6">
        {topic.icon}
        <h2 className="text-xl font-semibold">{topic.title}</h2>
      </div>

      {topic.content}
    </div>
  );
}

export const navigableTopics = Object.keys(topicDetails);
