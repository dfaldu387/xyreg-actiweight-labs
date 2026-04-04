import { Question } from '@/types/classification';

/**
 * India IVD Classification Rules
 * Based on CDSCO Medical Devices Rules 2017 (amended)
 * Uses Classes A, B, C, D (aligned with IMDRF)
 */

export const indiaIVDClassificationQuestions: Record<string, Question> = {
  india_ivd_initial: {
    id: 'india_ivd_initial',
    text: 'What is the primary intended use of this IVD?',
    helpText: 'CDSCO classifies IVDs into Classes A-D based on risk.',
    options: [
      {
        id: 'blood_screening',
        text: 'Blood/tissue donation screening',
        description: 'HIV, HBV, HCV, malaria screening',
        result: {
          class: 'Class D',
          rule: 'MDR 2017 - Blood Screening',
          description: 'IVDs for screening blood donations.',
          regulatoryPathway: 'CDSCO registration with clinical data',
          requirements: [
            'CDSCO registration',
            'Indian clinical performance data',
            'Manufacturing licence',
            'Indian Authorized Agent for imports',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV screening', 'HCV NAT', 'Malaria']
        }
      },
      {
        id: 'blood_grouping',
        text: 'ABO/Rh blood grouping',
        description: 'Blood group determination',
        result: {
          class: 'Class D',
          rule: 'MDR 2017 - Blood Grouping',
          description: 'Blood grouping for transfusion safety.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Clinical performance data',
            'Batch release testing'
          ],
          productCodeExamples: ['ABO reagents', 'Rh typing']
        }
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic',
        description: 'Required for drug therapy',
        result: {
          class: 'Class C',
          rule: 'MDR 2017 - Companion Diagnostics',
          description: 'IVDs essential for drug selection.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Coordination with drug approval',
            'Clinical evidence',
            'Post-market surveillance'
          ],
          productCodeExamples: ['EGFR mutation', 'HER2']
        }
      },
      {
        id: 'genetic_testing',
        text: 'Genetic testing',
        description: 'Prenatal, hereditary, pharmacogenomics',
        nextQuestionId: 'india_ivd_genetic'
      },
      {
        id: 'infectious_disease',
        text: 'Infectious disease testing',
        description: 'Pathogen detection',
        nextQuestionId: 'india_ivd_infectious'
      },
      {
        id: 'cancer_testing',
        text: 'Cancer diagnostics',
        description: 'Tumour markers',
        nextQuestionId: 'india_ivd_cancer'
      },
      {
        id: 'self_testing',
        text: 'Self-testing / OTC',
        description: 'Home-use tests',
        nextQuestionId: 'india_ivd_self_test'
      },
      {
        id: 'general_lab',
        text: 'General laboratory diagnostics',
        description: 'Clinical chemistry, haematology',
        nextQuestionId: 'india_ivd_general'
      },
      {
        id: 'instruments',
        text: 'Instruments / accessories',
        description: 'Analysers, specimen containers',
        nextQuestionId: 'india_ivd_instruments'
      }
    ]
  },

  india_ivd_genetic: {
    id: 'india_ivd_genetic',
    text: 'What type of genetic test?',
    options: [
      {
        id: 'prenatal',
        text: 'Prenatal testing',
        description: 'Fetal genetic conditions',
        result: {
          class: 'Class C',
          rule: 'MDR 2017 - Prenatal Testing',
          description: 'IVDs for prenatal genetic screening.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Clinical performance data',
            'PC-PNDT Act compliance',
            'Indian Authorized Agent'
          ],
          productCodeExamples: ['NIPT', 'Prenatal chromosomal']
        }
      },
      {
        id: 'hereditary',
        text: 'Hereditary conditions',
        description: 'Carrier, predictive testing',
        result: {
          class: 'Class C',
          rule: 'MDR 2017 - Hereditary Testing',
          description: 'IVDs for hereditary conditions.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Clinical validity data'
          ],
          productCodeExamples: ['BRCA', 'Thalassemia carrier']
        }
      },
      {
        id: 'pharmacogenomics',
        text: 'Pharmacogenomics',
        description: 'Drug metabolism',
        result: {
          class: 'Class C',
          rule: 'MDR 2017 - Pharmacogenomics',
          description: 'IVDs for drug response prediction.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Clinical utility data'
          ],
          productCodeExamples: ['CYP2C19', 'Warfarin dosing']
        }
      }
    ]
  },

  india_ivd_infectious: {
    id: 'india_ivd_infectious',
    text: 'What type of infectious disease test?',
    options: [
      {
        id: 'high_risk',
        text: 'High-risk pathogens (HIV, HBV, HCV, TB)',
        description: 'Serious infections',
        result: {
          class: 'Class D',
          rule: 'MDR 2017 - High-Risk Pathogens',
          description: 'IVDs for serious infectious diseases.',
          regulatoryPathway: 'CDSCO registration with clinical data',
          requirements: [
            'CDSCO registration',
            'Indian clinical data',
            'Manufacturing licence',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV', 'Tuberculosis', 'HCV']
        }
      },
      {
        id: 'moderate_risk',
        text: 'Common pathogens',
        description: 'Respiratory, GI infections',
        result: {
          class: 'Class B',
          rule: 'MDR 2017 - Moderate Risk',
          description: 'IVDs for common pathogens.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Performance validation'
          ],
          productCodeExamples: ['Influenza', 'Dengue', 'Typhoid']
        }
      }
    ]
  },

  india_ivd_cancer: {
    id: 'india_ivd_cancer',
    text: 'What is the cancer-related application?',
    options: [
      {
        id: 'screening',
        text: 'Population screening',
        description: 'Asymptomatic screening',
        result: {
          class: 'Class C',
          rule: 'MDR 2017 - Cancer Screening',
          description: 'IVDs for cancer screening.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Screening performance data'
          ],
          productCodeExamples: ['PSA', 'Cervical cancer screening']
        }
      },
      {
        id: 'diagnosis',
        text: 'Diagnosis / monitoring',
        description: 'Tumour markers',
        result: {
          class: 'Class B',
          rule: 'MDR 2017 - Cancer Diagnostics',
          description: 'IVDs for cancer diagnosis.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Performance data'
          ],
          productCodeExamples: ['CEA', 'CA-125', 'AFP']
        }
      }
    ]
  },

  india_ivd_self_test: {
    id: 'india_ivd_self_test',
    text: 'What does the self-test detect?',
    options: [
      {
        id: 'serious',
        text: 'Serious conditions (HIV)',
        description: 'High health impact',
        result: {
          class: 'Class C',
          rule: 'MDR 2017 - High-Risk Self-Tests',
          description: 'Self-tests for serious conditions.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Lay user studies',
            'Hindi/English labelling'
          ],
          productCodeExamples: ['HIV self-test']
        }
      },
      {
        id: 'general',
        text: 'General monitoring',
        description: 'Pregnancy, glucose',
        result: {
          class: 'Class B',
          rule: 'MDR 2017 - Self-Testing',
          description: 'Self-tests for general monitoring.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Lay user validation'
          ],
          productCodeExamples: ['Pregnancy test', 'Blood glucose']
        }
      }
    ]
  },

  india_ivd_general: {
    id: 'india_ivd_general',
    text: 'What type of general laboratory test?',
    options: [
      {
        id: 'chemistry',
        text: 'Clinical chemistry',
        description: 'Biochemistry tests',
        result: {
          class: 'Class B',
          rule: 'MDR 2017 - Clinical Chemistry',
          description: 'Standard clinical chemistry tests.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Performance evaluation'
          ],
          productCodeExamples: ['Glucose', 'Liver enzymes', 'Electrolytes']
        }
      },
      {
        id: 'haematology',
        text: 'Haematology',
        description: 'Blood counts, coagulation',
        result: {
          class: 'Class B',
          rule: 'MDR 2017 - Haematology',
          description: 'Haematology and coagulation tests.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Performance data'
          ],
          productCodeExamples: ['CBC', 'PT/INR', 'D-dimer']
        }
      },
      {
        id: 'microbiology',
        text: 'General microbiology',
        description: 'Culture, identification',
        result: {
          class: 'Class B',
          rule: 'MDR 2017 - Microbiology',
          description: 'General microbiological tests.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Performance validation'
          ],
          productCodeExamples: ['Culture media', 'Susceptibility tests']
        }
      }
    ]
  },

  india_ivd_instruments: {
    id: 'india_ivd_instruments',
    text: 'What type of instrument?',
    options: [
      {
        id: 'high_risk_analyser',
        text: 'Analyser for Class C/D tests',
        description: 'High-risk systems',
        result: {
          class: 'Class C',
          rule: 'MDR 2017 - Specific Instruments',
          description: 'Instruments for high-risk IVDs.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Software validation',
            'Manufacturing licence'
          ],
          productCodeExamples: ['Molecular platforms', 'Blood bank analysers']
        }
      },
      {
        id: 'general_analyser',
        text: 'General-purpose analyser',
        description: 'Multi-parameter systems',
        result: {
          class: 'Class B',
          rule: 'MDR 2017 - General Instruments',
          description: 'General laboratory analysers.',
          regulatoryPathway: 'CDSCO registration',
          requirements: [
            'CDSCO registration',
            'Technical documentation'
          ],
          productCodeExamples: ['Chemistry analysers', 'Haematology counters']
        }
      },
      {
        id: 'specimen_containers',
        text: 'Specimen containers',
        description: 'Blood tubes, swabs',
        result: {
          class: 'Class A',
          rule: 'MDR 2017 - Specimen Receptacles',
          description: 'Specimen collection products.',
          regulatoryPathway: 'CDSCO notification',
          requirements: [
            'CDSCO notification',
            'Technical documentation',
            'Indian Authorized Agent'
          ],
          productCodeExamples: ['Blood tubes', 'Specimen containers']
        }
      }
    ]
  }
};
