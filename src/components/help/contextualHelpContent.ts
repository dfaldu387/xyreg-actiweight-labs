export interface HelpEntry {
  tooltip: string;
  card: {
    title: string;
    description: string;
    example?: string;
  };
  article?: string;
  complianceCard?: {
    title: string;
    description: string;
    standard?: string;
  };
  complianceArticle?: string;
}

export const helpContentRegistry: Record<string, HelpEntry> = {
  'intended-use': {
    tooltip: 'Define the medical purpose and target patient population.',
    card: {
      title: 'Intended Use / Purpose',
      description: 'Describes what your device does, for whom, and under what conditions. This is the single most important field — it drives classification, risk analysis, and clinical evaluation.',
      example: '"Continuous glucose monitor for adult diabetic patients in home-use settings."',
    },
    article: `## Intended Use / Intended Purpose

The Intended Use is the cornerstone of every regulatory submission. It defines:

- **What** the device does (function)
- **Who** it is for (target population)
- **Where** it is used (clinical setting)
- **How** it achieves its purpose (mechanism)

### Why It Matters

Every downstream activity — classification, risk management, clinical evaluation, labelling — derives from the Intended Use. A vague or overly broad statement creates regulatory risk across the entire technical file.

### Best Practices

1. Be specific but not overly narrow
2. Use language consistent with your target market's regulations
3. Align with your clinical evidence strategy
4. Review against predicate devices (510(k)) or GSPR mapping (MDR)

### Common Mistakes

- Mixing intended use with indications for use
- Using marketing language instead of regulatory language
- Failing to specify the target population`,
    complianceCard: {
      title: 'Intended Purpose (MDR Art. 2(12))',
      description: 'The use for which a device is intended according to the data supplied by the manufacturer on the label, in the instructions for use, or in promotional materials.',
      standard: 'MDR 2017/745, Article 2(12); ISO 13485:2016 §7.3.3',
    },
    complianceArticle: `## Intended Purpose — Regulatory Definition

**MDR 2017/745, Article 2(12):**
> "intended purpose" means the use for which a device is intended according to the data supplied by the manufacturer on the label, in the instructions for use or in promotional or sales materials or statements and as specified by the manufacturer in the clinical evaluation.

**FDA 21 CFR 801.4:**
> Intended uses may be determined from labeling, advertising, oral or written statements by the manufacturer or their representatives.

### Key Regulatory Hooks

- Drives **Rule-based classification** (MDR Annex VIII)
- Defines scope of **Essential Requirements / GSPRs**
- Must align with **Clinical Evaluation Report** (MEDDEV 2.7/1 Rev 4)
- Referenced in **ISO 14971** risk management process

### Auditor Expectations

An auditor will check that:
1. The Intended Purpose is identical across label, IFU, CER, and technical documentation
2. No promotional material implies uses beyond the stated purpose
3. The clinical evidence supports all stated claims`,
  },

  'device-classification': {
    tooltip: 'Risk-based category that determines regulatory pathway.',
    card: {
      title: 'Device Classification',
      description: 'The risk class (I, IIa, IIb, III under MDR or I/II/III under FDA) determines which conformity assessment route your device must follow and the level of scrutiny from Notified Bodies.',
      example: 'Class IIa — active therapeutic device with non-invasive energy delivery.',
    },
    article: `## Device Classification

Classification determines the regulatory pathway and level of oversight for your medical device.

### EU MDR Classification

Under MDR 2017/745, devices are classified using 22 rules in Annex VIII:

- **Class I** — Low risk (e.g., bandages, tongue depressors)
- **Class IIa** — Medium risk (e.g., hearing aids, ultrasound)
- **Class IIb** — Medium-high risk (e.g., ventilators, infusion pumps)
- **Class III** — High risk (e.g., implantable devices, drug-device combos)

### FDA Classification

- **Class I** — General controls
- **Class II** — Special controls + 510(k)
- **Class III** — PMA required

### Impact on Your Project

Higher classification means:
- More extensive clinical evidence
- Notified Body involvement (EU) or PMA review (FDA)
- Stricter post-market surveillance requirements`,
    complianceCard: {
      title: 'Classification Rules (MDR Annex VIII)',
      description: 'Classification is determined by applying 22 implementing rules based on the device\'s intended purpose, duration of use, invasiveness, and active/non-active nature.',
      standard: 'MDR 2017/745, Annex VIII; 21 CFR 860',
    },
  },

  'risk-class': {
    tooltip: 'ISO 14971 risk level assigned after risk analysis.',
    card: {
      title: 'Risk Class',
      description: 'The risk level (acceptable, ALARP, unacceptable) resulting from your ISO 14971 risk analysis. Drives the depth of risk controls, V&V testing, and clinical evidence required.',
      example: 'Risk level: ALARP — residual risk accepted with benefit-risk justification.',
    },
    complianceCard: {
      title: 'Risk Acceptability (ISO 14971:2019)',
      description: 'Risk acceptability criteria shall be based on applicable national or regional regulations, relevant standards, and the state of the art in technology.',
      standard: 'ISO 14971:2019 §5.4, §7',
    },
  },

  'clinical-indication': {
    tooltip: 'Specific medical condition the device is designed to address.',
    card: {
      title: 'Clinical Indication',
      description: 'The medical condition, disease, or symptom your device diagnoses, treats, monitors, or prevents. Must be supported by clinical data and align with your intended use statement.',
      example: '"Management of Type 2 Diabetes Mellitus in adults aged 18+."',
    },
    complianceCard: {
      title: 'Indications for Use',
      description: 'A general description of the disease or condition the device will diagnose, treat, prevent, cure, or mitigate — including a description of the patient population.',
      standard: 'FDA Guidance: "Writing Indications for Use"; MDR Annex II §1.1',
    },
  },

  'udi-di': {
    tooltip: 'Unique Device Identifier for traceability and market surveillance.',
    card: {
      title: 'UDI-DI (Device Identifier)',
      description: 'The static part of the UDI that identifies the device model. Assigned by an issuing agency (GS1, HIBCC, ICCBBA). Required for EUDAMED registration and FDA GUDID submission.',
      example: '"(01)00860123456789 — GS1 GTIN-14 format."',
    },
    complianceCard: {
      title: 'UDI System (MDR Art. 27)',
      description: 'The UDI system enables unambiguous identification of devices on the market. The UDI-DI is the primary key for accessing device data in EUDAMED or GUDID.',
      standard: 'MDR 2017/745, Art. 27; 21 CFR 830',
    },
  },

  'client-compass': {
    tooltip: 'Central hub to manage all your medtech company portfolios.',
    card: {
      title: 'Client Compass',
      description: 'Your command center for managing multiple medtech companies. Each company card shows regulatory status, device count, and compliance health at a glance.',
      example: '"Click a company card to access its full regulatory portfolio and device dashboard."',
    },
    article: `## Client Compass

The Client Compass is the top-level view of all companies you manage on the platform.

### What You See

- **Company Cards**: Each card represents a company with its regulatory portfolio
- **Status Indicators**: Quick visual health checks for compliance status
- **Search & Filter**: Find companies by name, status, or regulatory framework

### How to Use

1. Click any company card to enter its dashboard
2. Use the search bar to filter companies
3. Check status badges for quick compliance overview

### Tips

- Pin frequently accessed companies for quick access
- Use status filters to focus on companies needing attention
- The "Most Recent" section shows your last-visited companies`,
    complianceCard: {
      title: 'Organization Management (ISO 13485 §4.1)',
      description: 'Each organization must maintain a QMS. The Client Compass provides oversight across multiple QMS-scoped entities under your management.',
      standard: 'ISO 13485:2016 §4.1; MDR 2017/745 Art. 10',
    },
  },

  'device-portfolio': {
    tooltip: 'View and manage all medical devices for a company.',
    card: {
      title: 'Device Portfolio',
      description: 'The complete inventory of medical devices under a company\'s regulatory umbrella. Tracks classification, lifecycle phase, and market status for each device.',
      example: '"3 devices: 1 Class IIa in development, 2 Class I on market."',
    },
    complianceCard: {
      title: 'Technical Documentation (MDR Annex II)',
      description: 'Each device in the portfolio must have complete technical documentation as specified in Annex II, maintained throughout the device lifecycle.',
      standard: 'MDR 2017/745, Annex II; 21 CFR 820.184',
    },
  },

  'add-device': {
    tooltip: 'Register a new medical device in your regulatory portfolio.',
    card: {
      title: 'Add New Device',
      description: 'Start the regulatory journey for a new medical device. The wizard guides you through defining intended use, classification, and initial risk assessment.',
      example: '"New Class IIb active implantable device for cardiac monitoring."',
    },
    complianceCard: {
      title: 'Device Registration (MDR Art. 29)',
      description: 'Before placing a device on the market, manufacturers must register it in EUDAMED and assign a Basic UDI-DI.',
      standard: 'MDR 2017/745, Art. 29-31; 21 CFR 807',
    },
  },
};
