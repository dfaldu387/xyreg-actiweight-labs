import { Question } from '@/types/classification';

/**
 * Brazil IVD Classification Rules
 * Based on ANVISA RDC 36/2015 and RDC 830/2023
 * Uses Classes I, II, III, IV
 */

export const brazilIVDClassificationQuestions: Record<string, Question> = {
  brazil_ivd_initial: {
    id: 'brazil_ivd_initial',
    text: 'What is the primary intended use of this IVD?',
    helpText: 'ANVISA classifies IVDs into Classes I-IV based on risk.',
    options: [
      {
        id: 'blood_screening',
        text: 'Blood/tissue donation screening',
        description: 'HIV, HBV, HCV, HTLV screening for transfusion safety',
        result: {
          class: 'Class IV',
          rule: 'RDC 36/2015 Annex II - Blood Screening',
          description: 'IVDs for screening blood donations for transfusion-transmissible infections.',
          regulatoryPathway: 'ANVISA registration with clinical data',
          requirements: [
            'Product registration with ANVISA',
            'Clinical performance studies',
            'Brazilian Good Manufacturing Practices (BGMP)',
            'Post-market vigilance',
            'Brazilian Registration Holder required'
          ],
          productCodeExamples: ['HIV screening', 'HCV NAT', 'Blood bank reagents']
        }
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic',
        description: 'Essential for safe use of a therapeutic product',
        result: {
          class: 'Class IV',
          rule: 'RDC 36/2015 - Companion Diagnostics',
          description: 'IVDs required for safe and effective use of specific medicines.',
          regulatoryPathway: 'ANVISA registration with coordination',
          requirements: [
            'Product registration with ANVISA',
            'Coordination with drug approval',
            'Clinical evidence for diagnostic-therapeutic link',
            'Post-market surveillance'
          ],
          productCodeExamples: ['Oncology CDx', 'Pharmacogenomic tests']
        }
      },
      {
        id: 'high_risk_infectious',
        text: 'High-risk infectious disease testing',
        description: 'HIV, HBV, HCV diagnosis (not donation screening)',
        nextQuestionId: 'brazil_ivd_high_risk'
      },
      {
        id: 'blood_grouping',
        text: 'Blood grouping / typing',
        description: 'ABO, Rh, compatibility testing',
        nextQuestionId: 'brazil_ivd_blood_group'
      },
      {
        id: 'cancer_testing',
        text: 'Cancer diagnostics',
        description: 'Tumour markers, screening, staging',
        nextQuestionId: 'brazil_ivd_cancer'
      },
      {
        id: 'self_testing',
        text: 'Self-testing / OTC',
        description: 'Home-use tests by lay users',
        nextQuestionId: 'brazil_ivd_self_test'
      },
      {
        id: 'general_lab',
        text: 'General laboratory diagnostics',
        description: 'Clinical chemistry, haematology, routine microbiology',
        nextQuestionId: 'brazil_ivd_general'
      },
      {
        id: 'instruments',
        text: 'Instruments / accessories',
        description: 'Analysers, specimen containers, general reagents',
        nextQuestionId: 'brazil_ivd_instruments'
      }
    ]
  },

  brazil_ivd_high_risk: {
    id: 'brazil_ivd_high_risk',
    text: 'What is the specific application?',
    helpText: 'High-risk pathogen diagnostics require Class III or IV.',
    options: [
      {
        id: 'confirmation',
        text: 'Confirmatory / diagnostic testing',
        description: 'Confirming infection for treatment decisions',
        result: {
          class: 'Class III',
          rule: 'RDC 36/2015 - High-Risk Pathogens',
          description: 'Diagnostic tests for serious infectious diseases.',
          regulatoryPathway: 'ANVISA registration',
          requirements: [
            'Product registration',
            'Clinical performance data',
            'BGMP compliance',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV confirmatory', 'HCV genotyping', 'Tuberculosis']
        }
      },
      {
        id: 'monitoring',
        text: 'Treatment monitoring',
        description: 'Viral load, resistance testing',
        result: {
          class: 'Class III',
          rule: 'RDC 36/2015 - Treatment Monitoring',
          description: 'IVDs for monitoring treatment of serious infections.',
          regulatoryPathway: 'ANVISA registration',
          requirements: [
            'Product registration',
            'Clinical performance data',
            'BGMP compliance'
          ],
          productCodeExamples: ['HIV viral load', 'Drug resistance']
        }
      }
    ]
  },

  brazil_ivd_blood_group: {
    id: 'brazil_ivd_blood_group',
    text: 'What type of blood grouping test?',
    options: [
      {
        id: 'abo_rh',
        text: 'ABO/Rh grouping for transfusion',
        description: 'Critical for transfusion safety',
        result: {
          class: 'Class IV',
          rule: 'RDC 36/2015 - Blood Grouping',
          description: 'Blood group determination for safe transfusion.',
          regulatoryPathway: 'ANVISA registration',
          requirements: [
            'Product registration',
            'Batch release testing',
            'Clinical performance validation',
            'Post-market surveillance'
          ],
          productCodeExamples: ['ABO reagents', 'Rh typing']
        }
      },
      {
        id: 'other_antigens',
        text: 'Other blood group antigens',
        description: 'Minor blood group systems',
        result: {
          class: 'Class III',
          rule: 'RDC 36/2015 - Blood Antigens',
          description: 'IVDs for other blood group antigen determination.',
          regulatoryPathway: 'ANVISA registration',
          requirements: [
            'Product registration',
            'Performance data',
            'BGMP compliance'
          ],
          productCodeExamples: ['Kell', 'Duffy', 'Kidd typing']
        }
      }
    ]
  },

  brazil_ivd_cancer: {
    id: 'brazil_ivd_cancer',
    text: 'What is the cancer-related application?',
    options: [
      {
        id: 'screening',
        text: 'Population screening',
        description: 'Asymptomatic screening programs',
        result: {
          class: 'Class III',
          rule: 'RDC 36/2015 - Cancer Screening',
          description: 'IVDs for cancer screening in asymptomatic populations.',
          regulatoryPathway: 'ANVISA registration',
          requirements: [
            'Product registration',
            'Clinical trial data',
            'Screening performance validation'
          ],
          productCodeExamples: ['PSA', 'Cervical cancer screening']
        }
      },
      {
        id: 'diagnosis',
        text: 'Diagnosis / staging / monitoring',
        description: 'Tumour markers for clinical use',
        result: {
          class: 'Class II',
          rule: 'RDC 36/2015 - Cancer Diagnostics',
          description: 'IVDs for cancer diagnosis and monitoring.',
          regulatoryPathway: 'ANVISA notification or registration',
          requirements: [
            'Product notification/registration',
            'Performance data',
            'BGMP compliance'
          ],
          productCodeExamples: ['CEA', 'CA-125', 'AFP']
        }
      }
    ]
  },

  brazil_ivd_self_test: {
    id: 'brazil_ivd_self_test',
    text: 'What condition does the self-test detect?',
    options: [
      {
        id: 'serious',
        text: 'Serious conditions (HIV, hepatitis)',
        description: 'Self-tests for serious diseases',
        result: {
          class: 'Class III',
          rule: 'RDC 36/2015 - High-Risk Self-Tests',
          description: 'Self-tests for serious health conditions.',
          regulatoryPathway: 'ANVISA registration',
          requirements: [
            'Product registration',
            'Lay user performance studies',
            'Clear instructions in Portuguese',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV self-test']
        }
      },
      {
        id: 'general',
        text: 'General wellness / monitoring',
        description: 'Pregnancy, glucose, cholesterol',
        result: {
          class: 'Class II',
          rule: 'RDC 36/2015 - Self-Testing',
          description: 'Self-tests for general health monitoring.',
          regulatoryPathway: 'ANVISA notification',
          requirements: [
            'Product notification',
            'Lay user studies',
            'Portuguese labelling'
          ],
          productCodeExamples: ['Pregnancy test', 'Blood glucose']
        }
      }
    ]
  },

  brazil_ivd_general: {
    id: 'brazil_ivd_general',
    text: 'What type of general laboratory test?',
    options: [
      {
        id: 'chemistry',
        text: 'Clinical chemistry',
        description: 'Electrolytes, enzymes, metabolites',
        result: {
          class: 'Class II',
          rule: 'RDC 36/2015 - Clinical Chemistry',
          description: 'Standard clinical chemistry tests.',
          regulatoryPathway: 'ANVISA notification',
          requirements: [
            'Product notification',
            'Performance evaluation',
            'BGMP compliance'
          ],
          productCodeExamples: ['Glucose', 'Creatinine', 'Liver enzymes']
        }
      },
      {
        id: 'haematology',
        text: 'Haematology / coagulation',
        description: 'Blood counts, clotting factors',
        result: {
          class: 'Class II',
          rule: 'RDC 36/2015 - Haematology',
          description: 'Haematology and coagulation tests.',
          regulatoryPathway: 'ANVISA notification',
          requirements: [
            'Product notification',
            'Performance data',
            'BGMP compliance'
          ],
          productCodeExamples: ['CBC', 'PT/INR', 'D-dimer']
        }
      },
      {
        id: 'microbiology',
        text: 'General microbiology',
        description: 'Culture media, identification (non-high-risk)',
        result: {
          class: 'Class II',
          rule: 'RDC 36/2015 - Microbiology',
          description: 'General microbiological tests.',
          regulatoryPathway: 'ANVISA notification',
          requirements: [
            'Product notification',
            'Performance validation'
          ],
          productCodeExamples: ['Culture media', 'Susceptibility tests']
        }
      }
    ]
  },

  brazil_ivd_instruments: {
    id: 'brazil_ivd_instruments',
    text: 'What type of instrument or accessory?',
    options: [
      {
        id: 'high_risk_analyser',
        text: 'Analyser for Class III/IV tests',
        description: 'Dedicated to high-risk IVDs',
        result: {
          class: 'Class III',
          rule: 'RDC 36/2015 - Specific Instruments',
          description: 'Instruments for high-risk IVD testing.',
          regulatoryPathway: 'ANVISA registration',
          requirements: [
            'Product registration',
            'Software validation',
            'BGMP compliance'
          ],
          productCodeExamples: ['Blood bank analysers', 'Molecular platforms']
        }
      },
      {
        id: 'general_analyser',
        text: 'General-purpose analyser',
        description: 'Multi-parameter systems',
        result: {
          class: 'Class II',
          rule: 'RDC 36/2015 - General Instruments',
          description: 'General-purpose laboratory analysers.',
          regulatoryPathway: 'ANVISA notification',
          requirements: [
            'Product notification',
            'Technical documentation',
            'BGMP compliance'
          ],
          productCodeExamples: ['Chemistry analysers', 'Haematology counters']
        }
      },
      {
        id: 'specimen_containers',
        text: 'Specimen containers / collection',
        description: 'Blood tubes, swabs, containers',
        result: {
          class: 'Class I',
          rule: 'RDC 36/2015 - Specimen Receptacles',
          description: 'Products for specimen collection and storage.',
          regulatoryPathway: 'ANVISA notification (simplified)',
          requirements: [
            'Simplified notification',
            'Technical documentation',
            'Brazilian Registration Holder'
          ],
          productCodeExamples: ['Blood tubes', 'Urine containers']
        }
      },
      {
        id: 'general_reagents',
        text: 'General reagents / buffers',
        description: 'Wash solutions, diluents',
        result: {
          class: 'Class I',
          rule: 'RDC 36/2015 - General Reagents',
          description: 'General-purpose laboratory reagents.',
          regulatoryPathway: 'ANVISA notification (simplified)',
          requirements: [
            'Simplified notification',
            'Technical documentation'
          ],
          productCodeExamples: ['Buffer solutions', 'Wash reagents']
        }
      }
    ]
  }
};
