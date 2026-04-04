import { Question } from '@/types/classification';

/**
 * South Korea IVD Classification Rules
 * Based on MFDS Medical Device Act
 * Uses Classes I, II, III, IV
 */

export const southKoreaIVDClassificationQuestions: Record<string, Question> = {
  korea_ivd_initial: {
    id: 'korea_ivd_initial',
    text: 'What is the primary intended use of this IVD?',
    helpText: 'MFDS classifies IVDs into Classes I-IV based on risk.',
    options: [
      {
        id: 'blood_screening',
        text: 'Blood donation screening',
        description: 'HIV, HBV, HCV, HTLV screening',
        result: {
          class: 'Class IV',
          rule: 'MFDS - Blood Screening',
          description: 'IVDs for screening blood donations.',
          regulatoryPathway: 'MFDS approval with clinical data',
          requirements: [
            'MFDS product approval',
            'Korean clinical data may be required',
            'Korean GMP (KGMP)',
            'Korean License Holder (KLH)',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV screening', 'HCV NAT', 'HBsAg']
        }
      },
      {
        id: 'blood_grouping',
        text: 'ABO/Rh blood grouping',
        description: 'Blood group determination',
        result: {
          class: 'Class IV',
          rule: 'MFDS - Blood Grouping',
          description: 'Blood grouping for transfusion safety.',
          regulatoryPathway: 'MFDS approval',
          requirements: [
            'MFDS approval',
            'Clinical performance data',
            'KGMP certification'
          ],
          productCodeExamples: ['ABO reagents', 'Rh typing']
        }
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic',
        description: 'Required for drug therapy',
        result: {
          class: 'Class III',
          rule: 'MFDS - Companion Diagnostics',
          description: 'IVDs essential for drug selection.',
          regulatoryPathway: 'MFDS approval with drug coordination',
          requirements: [
            'MFDS approval',
            'Coordination with drug approval',
            'Clinical evidence',
            'Post-market surveillance'
          ],
          productCodeExamples: ['EGFR mutation', 'HER2', 'ALK']
        }
      },
      {
        id: 'genetic_testing',
        text: 'Genetic testing',
        description: 'Prenatal, hereditary, pharmacogenomics',
        nextQuestionId: 'korea_ivd_genetic'
      },
      {
        id: 'infectious_disease',
        text: 'Infectious disease testing',
        description: 'Pathogen detection',
        nextQuestionId: 'korea_ivd_infectious'
      },
      {
        id: 'cancer_testing',
        text: 'Cancer diagnostics',
        description: 'Tumour markers',
        nextQuestionId: 'korea_ivd_cancer'
      },
      {
        id: 'self_testing',
        text: 'Self-testing / OTC',
        description: 'Home-use tests',
        nextQuestionId: 'korea_ivd_self_test'
      },
      {
        id: 'general_lab',
        text: 'General laboratory diagnostics',
        description: 'Clinical chemistry, haematology',
        nextQuestionId: 'korea_ivd_general'
      },
      {
        id: 'instruments',
        text: 'Instruments / accessories',
        description: 'Analysers, specimen containers',
        nextQuestionId: 'korea_ivd_instruments'
      }
    ]
  },

  korea_ivd_genetic: {
    id: 'korea_ivd_genetic',
    text: 'What type of genetic test?',
    options: [
      {
        id: 'prenatal',
        text: 'Prenatal testing',
        description: 'Fetal genetic conditions',
        result: {
          class: 'Class III',
          rule: 'MFDS - Prenatal Testing',
          description: 'IVDs for prenatal genetic screening.',
          regulatoryPathway: 'MFDS approval',
          requirements: [
            'MFDS approval',
            'Clinical performance data',
            'Korean License Holder'
          ],
          productCodeExamples: ['NIPT', 'Prenatal chromosomal']
        }
      },
      {
        id: 'hereditary',
        text: 'Hereditary conditions',
        description: 'Carrier, predictive testing',
        result: {
          class: 'Class III',
          rule: 'MFDS - Hereditary Testing',
          description: 'IVDs for hereditary conditions.',
          regulatoryPathway: 'MFDS approval',
          requirements: [
            'MFDS approval',
            'Clinical validity data'
          ],
          productCodeExamples: ['BRCA', 'Lynch syndrome']
        }
      },
      {
        id: 'pharmacogenomics',
        text: 'Pharmacogenomics',
        description: 'Drug metabolism',
        result: {
          class: 'Class III',
          rule: 'MFDS - Pharmacogenomics',
          description: 'IVDs for drug response prediction.',
          regulatoryPathway: 'MFDS approval',
          requirements: [
            'MFDS approval',
            'Clinical utility data'
          ],
          productCodeExamples: ['CYP2C19', 'Warfarin dosing']
        }
      }
    ]
  },

  korea_ivd_infectious: {
    id: 'korea_ivd_infectious',
    text: 'What type of infectious disease test?',
    options: [
      {
        id: 'high_risk',
        text: 'High-risk pathogens (HIV, HBV, HCV, TB)',
        description: 'Serious infections',
        result: {
          class: 'Class III',
          rule: 'MFDS - High-Risk Pathogens',
          description: 'IVDs for serious infectious diseases.',
          regulatoryPathway: 'MFDS approval',
          requirements: [
            'MFDS approval',
            'Clinical data',
            'KGMP certification'
          ],
          productCodeExamples: ['HIV', 'Tuberculosis', 'HCV']
        }
      },
      {
        id: 'moderate_risk',
        text: 'Common pathogens',
        description: 'Respiratory, GI infections',
        result: {
          class: 'Class II',
          rule: 'MFDS - Moderate Risk',
          description: 'IVDs for common pathogens.',
          regulatoryPathway: 'MFDS certification',
          requirements: [
            'MFDS certification',
            'Performance validation',
            'KGMP certification'
          ],
          productCodeExamples: ['Influenza', 'RSV', 'Streptococcus']
        }
      }
    ]
  },

  korea_ivd_cancer: {
    id: 'korea_ivd_cancer',
    text: 'What is the cancer-related application?',
    options: [
      {
        id: 'screening',
        text: 'Population screening',
        description: 'Asymptomatic screening',
        result: {
          class: 'Class III',
          rule: 'MFDS - Cancer Screening',
          description: 'IVDs for cancer screening.',
          regulatoryPathway: 'MFDS approval',
          requirements: [
            'MFDS approval',
            'Screening performance data'
          ],
          productCodeExamples: ['PSA', 'Colorectal screening']
        }
      },
      {
        id: 'diagnosis',
        text: 'Diagnosis / monitoring',
        description: 'Tumour markers',
        result: {
          class: 'Class II',
          rule: 'MFDS - Cancer Diagnostics',
          description: 'IVDs for cancer diagnosis.',
          regulatoryPathway: 'MFDS certification',
          requirements: [
            'MFDS certification',
            'Performance data'
          ],
          productCodeExamples: ['CEA', 'CA-125', 'AFP']
        }
      }
    ]
  },

  korea_ivd_self_test: {
    id: 'korea_ivd_self_test',
    text: 'What does the self-test detect?',
    options: [
      {
        id: 'serious',
        text: 'Serious conditions',
        description: 'High health impact',
        result: {
          class: 'Class III',
          rule: 'MFDS - High-Risk Self-Tests',
          description: 'Self-tests for serious conditions.',
          regulatoryPathway: 'MFDS approval',
          requirements: [
            'MFDS approval',
            'Lay user studies',
            'Korean labelling'
          ],
          productCodeExamples: ['HIV self-test', 'COVID self-test']
        }
      },
      {
        id: 'general',
        text: 'General monitoring',
        description: 'Pregnancy, glucose',
        result: {
          class: 'Class II',
          rule: 'MFDS - Self-Testing',
          description: 'Self-tests for general monitoring.',
          regulatoryPathway: 'MFDS certification',
          requirements: [
            'MFDS certification',
            'Lay user validation',
            'Korean language IFU'
          ],
          productCodeExamples: ['Pregnancy test', 'Blood glucose']
        }
      }
    ]
  },

  korea_ivd_general: {
    id: 'korea_ivd_general',
    text: 'What type of general laboratory test?',
    options: [
      {
        id: 'chemistry',
        text: 'Clinical chemistry',
        description: 'Biochemistry tests',
        result: {
          class: 'Class II',
          rule: 'MFDS - Clinical Chemistry',
          description: 'Standard clinical chemistry tests.',
          regulatoryPathway: 'MFDS certification',
          requirements: [
            'MFDS certification',
            'Performance evaluation',
            'KGMP certification'
          ],
          productCodeExamples: ['Glucose', 'Liver enzymes', 'Electrolytes']
        }
      },
      {
        id: 'haematology',
        text: 'Haematology',
        description: 'Blood counts, coagulation',
        result: {
          class: 'Class II',
          rule: 'MFDS - Haematology',
          description: 'Haematology and coagulation tests.',
          regulatoryPathway: 'MFDS certification',
          requirements: [
            'MFDS certification',
            'Performance data',
            'KGMP certification'
          ],
          productCodeExamples: ['CBC', 'PT/INR', 'D-dimer']
        }
      },
      {
        id: 'microbiology',
        text: 'General microbiology',
        description: 'Culture, identification',
        result: {
          class: 'Class II',
          rule: 'MFDS - Microbiology',
          description: 'General microbiological tests.',
          regulatoryPathway: 'MFDS certification',
          requirements: [
            'MFDS certification',
            'Performance validation'
          ],
          productCodeExamples: ['Culture media', 'Susceptibility tests']
        }
      }
    ]
  },

  korea_ivd_instruments: {
    id: 'korea_ivd_instruments',
    text: 'What type of instrument?',
    options: [
      {
        id: 'class_iv_analyser',
        text: 'Analyser for Class III/IV tests',
        description: 'High-risk systems',
        result: {
          class: 'Class III',
          rule: 'MFDS - Specific Instruments',
          description: 'Instruments for high-risk IVDs.',
          regulatoryPathway: 'MFDS approval',
          requirements: [
            'MFDS approval',
            'Software validation',
            'KGMP certification'
          ],
          productCodeExamples: ['Molecular platforms', 'Blood bank analysers']
        }
      },
      {
        id: 'general_analyser',
        text: 'General-purpose analyser',
        description: 'Multi-parameter systems',
        result: {
          class: 'Class II',
          rule: 'MFDS - General Instruments',
          description: 'General laboratory analysers.',
          regulatoryPathway: 'MFDS certification',
          requirements: [
            'MFDS certification',
            'Technical documentation',
            'KGMP certification'
          ],
          productCodeExamples: ['Chemistry analysers', 'Haematology counters']
        }
      },
      {
        id: 'specimen_containers',
        text: 'Specimen containers',
        description: 'Blood tubes, swabs',
        result: {
          class: 'Class I',
          rule: 'MFDS - Specimen Receptacles',
          description: 'Specimen collection products.',
          regulatoryPathway: 'MFDS notification',
          requirements: [
            'MFDS notification',
            'Technical documentation',
            'Korean License Holder'
          ],
          productCodeExamples: ['Blood tubes', 'Specimen containers']
        }
      }
    ]
  }
};
