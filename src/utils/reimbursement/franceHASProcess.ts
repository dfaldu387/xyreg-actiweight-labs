export const HAS_KEY_FACTS = {
  title: 'HAS (Haute Autorité de Santé)',
  subtitle: 'French National Authority for Health',
  description: 'HAS is an independent scientific public authority responsible for health technology assessment in France. It evaluates the clinical benefit of medical devices and issues recommendations on reimbursement eligibility.',
  authority: 'Public independent administrative authority',
  composition: 'Multi-disciplinary board including physicians, health economists, patient representatives',
  scope: 'All medical devices seeking reimbursement by French Social Security',
  mandate: 'Assess clinical benefit (Service Attendu) and improvement over alternatives (Amélioration du Service Attendu)'
};

export const HAS_COMMISSIONS = [
  {
    name: 'CNEDiMTS',
    fullName: 'Commission Nationale d\'Évaluation des Dispositifs Médicaux et des Technologies de Santé',
    role: 'Medical Device & Health Technology Evaluation Commission',
    responsibility: 'Primary commission responsible for evaluating medical devices for LPP inscription. Issues opinions on Service Attendu (SA) and Amélioration du Service Attendu (ASA).',
    composition: 'Physicians, pharmacists, health economists, patient representatives, industry observers'
  },
  {
    name: 'Collège',
    fullName: 'HAS Board of Directors',
    role: 'Governing Body',
    responsibility: 'Approves final HAS opinions and guidelines. Oversees all HAS commissions and ensures scientific rigor.',
    composition: '8 board members appointed by various government bodies and professional organizations'
  }
];

export const HAS_EVALUATION_CRITERIA = [
  {
    criterion: 'Clinical Efficacy',
    description: 'Evidence demonstrating the device achieves its intended clinical outcomes',
    requirements: [
      'Randomized controlled trials (preferred)',
      'Comparative studies vs. standard of care',
      'Long-term follow-up data',
      'Peer-reviewed publications'
    ]
  },
  {
    criterion: 'Safety Profile',
    description: 'Benefit-risk assessment demonstrating acceptable safety',
    requirements: [
      'Post-market surveillance data',
      'Adverse event reporting',
      'Contraindications clearly defined',
      'Risk mitigation measures documented'
    ]
  },
  {
    criterion: 'Comparative Effectiveness',
    description: 'Clinical benefit compared to existing reimbursed alternatives',
    requirements: [
      'Head-to-head comparative studies',
      'Indirect treatment comparisons if direct studies unavailable',
      'Real-world effectiveness data',
      'Patient-reported outcomes'
    ]
  },
  {
    criterion: 'Public Health Interest',
    description: 'Impact on population health, disease burden, and unmet medical needs',
    requirements: [
      'Epidemiological data on target population',
      'Disease burden assessment',
      'Unmet medical need documentation',
      'Health system impact analysis'
    ]
  },
  {
    criterion: 'Cost-Effectiveness',
    description: 'Economic value compared to alternatives (informative, not decisive)',
    requirements: [
      'Cost-utility analysis (QALYs)',
      'Budget impact analysis',
      'Cost-minimization or cost-effectiveness studies',
      'Sensitivity analyses'
    ]
  }
];

export const HAS_SUBMISSION_PATHWAYS = [
  {
    pathway: 'Standard Evaluation',
    timeline: '9-12 months',
    description: 'Full clinical and economic evaluation for new devices',
    applicability: 'New medical devices seeking initial LPP inscription',
    process: [
      'Complete dossier submission with all clinical evidence',
      'CNEDiMTS expert review and rapporteur assignment',
      'Potential request for additional data or clarifications',
      'CNEDiMTS commission meeting and vote',
      'HAS opinion publication (SA and ASA levels)'
    ]
  },
  {
    pathway: 'Simplified Evaluation',
    timeline: '3-6 months',
    description: 'Abbreviated review for minor modifications or renewals',
    applicability: 'Product modifications that do not significantly alter clinical benefit; LPP renewals',
    process: [
      'Abbreviated dossier submission',
      'Focused review of changes/updates',
      'CNEDiMTS expedited review',
      'Opinion on continued SA/ASA levels'
    ]
  },
  {
    pathway: 'Post-Inscription Studies (RIHN)',
    timeline: 'Up to 4 years',
    description: 'Conditional LPP inscription with requirement for additional real-world data collection',
    applicability: 'Innovative devices with promising but incomplete evidence at submission',
    process: [
      'Temporary LPP inscription granted',
      'Manufacturer conducts post-market study (RIHN protocol)',
      'Annual progress reports to HAS',
      'Final evaluation after study completion',
      'Decision on permanent LPP inscription or delisting'
    ]
  }
];

export const HAS_RESUBMISSION_SCENARIOS = [
  {
    scenario: 'SA Insufficient - Full Rejection',
    description: 'HAS determines clinical benefit is insufficient for reimbursement',
    options: [
      'Appeal decision with additional clinical evidence',
      'Conduct further clinical studies to strengthen evidence base',
      'Consider alternative reimbursement pathways (hospital budget, temporary use authorization)'
    ]
  },
  {
    scenario: 'Low ASA Rating (IV or V)',
    description: 'Device approved but rated as minor or no improvement vs. alternatives',
    options: [
      'Accept low ASA rating and negotiate competitive pricing with CEPS',
      'Conduct additional comparative studies to demonstrate superiority',
      'Position device in niche indications where superiority can be demonstrated'
    ]
  },
  {
    scenario: 'Conditional Approval (RIHN)',
    description: 'Temporary LPP inscription granted pending additional data collection',
    options: [
      'Comply with RIHN protocol and collect required real-world data',
      'Monitor patient outcomes closely to demonstrate real-world effectiveness',
      'Prepare for re-evaluation at end of RIHN period (typically 2-4 years)'
    ]
  }
];
