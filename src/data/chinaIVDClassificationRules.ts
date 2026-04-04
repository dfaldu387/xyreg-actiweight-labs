import { Question } from '@/types/classification';

/**
 * China IVD Classification Rules
 * Based on NMPA Order No. 5 (2021) - Classification Rules for IVD Products
 * Uses Classes I, II, III
 */

export const chinaIVDClassificationQuestions: Record<string, Question> = {
  china_ivd_initial: {
    id: 'china_ivd_initial',
    text: 'What is the primary intended use of this IVD?',
    helpText: 'NMPA classifies IVDs into Classes I-III based on risk.',
    options: [
      {
        id: 'blood_screening',
        text: 'Blood/plasma donation screening',
        description: 'HIV, HBV, HCV screening for transfusion safety',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - Blood Screening',
          description: 'IVDs for screening blood donations for transfusion-transmissible infections.',
          regulatoryPathway: 'NMPA registration with clinical trials',
          requirements: [
            'NMPA product registration',
            'Local clinical trials required',
            'GMP certification',
            'China Agent required for foreign manufacturers',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV screening', 'HCV NAT', 'HBsAg']
        }
      },
      {
        id: 'blood_grouping',
        text: 'ABO/Rh blood grouping',
        description: 'Blood group determination for transfusion',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - Blood Grouping',
          description: 'Blood grouping reagents for transfusion safety.',
          regulatoryPathway: 'NMPA registration',
          requirements: [
            'NMPA registration',
            'Clinical performance data',
            'GMP certification',
            'Batch release'
          ],
          productCodeExamples: ['ABO reagents', 'Rh typing']
        }
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic',
        description: 'Required for targeted therapy selection',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - Companion Diagnostics',
          description: 'IVDs essential for drug therapy decisions.',
          regulatoryPathway: 'NMPA registration with drug coordination',
          requirements: [
            'NMPA registration',
            'Coordination with drug approval (CDE)',
            'Clinical evidence in Chinese population',
            'Post-market surveillance'
          ],
          productCodeExamples: ['EGFR mutation', 'HER2', 'PD-L1']
        }
      },
      {
        id: 'infectious_disease',
        text: 'Infectious disease testing',
        description: 'Pathogen detection and identification',
        nextQuestionId: 'china_ivd_infectious'
      },
      {
        id: 'genetic_testing',
        text: 'Genetic / molecular testing',
        description: 'Prenatal, hereditary, pharmacogenomics',
        nextQuestionId: 'china_ivd_genetic'
      },
      {
        id: 'cancer_testing',
        text: 'Cancer diagnostics',
        description: 'Tumour markers, screening',
        nextQuestionId: 'china_ivd_cancer'
      },
      {
        id: 'self_testing',
        text: 'Self-testing / OTC',
        description: 'Home-use tests',
        nextQuestionId: 'china_ivd_self_test'
      },
      {
        id: 'general_lab',
        text: 'General laboratory diagnostics',
        description: 'Clinical chemistry, haematology',
        nextQuestionId: 'china_ivd_general'
      },
      {
        id: 'instruments',
        text: 'Instruments / accessories',
        description: 'Analysers, specimen containers',
        nextQuestionId: 'china_ivd_instruments'
      }
    ]
  },

  china_ivd_infectious: {
    id: 'china_ivd_infectious',
    text: 'What type of infectious disease test?',
    options: [
      {
        id: 'high_risk',
        text: 'High-risk pathogens (HIV, HBV, HCV, TB)',
        description: 'Serious transmissible diseases',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - High-Risk Pathogens',
          description: 'IVDs for detecting serious infectious diseases.',
          regulatoryPathway: 'NMPA registration with local trials',
          requirements: [
            'NMPA registration',
            'Chinese clinical trial data',
            'GMP certification',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV', 'Tuberculosis', 'Hepatitis']
        }
      },
      {
        id: 'moderate_risk',
        text: 'Moderate-risk pathogens',
        description: 'Common respiratory, GI pathogens',
        result: {
          class: 'Class II',
          rule: 'NMPA Order No. 5 - Moderate Risk',
          description: 'IVDs for common infectious disease detection.',
          regulatoryPathway: 'Provincial registration',
          requirements: [
            'Provincial DA registration',
            'Performance validation',
            'GMP certification'
          ],
          productCodeExamples: ['Streptococcus', 'Influenza', 'RSV']
        }
      }
    ]
  },

  china_ivd_genetic: {
    id: 'china_ivd_genetic',
    text: 'What type of genetic test?',
    options: [
      {
        id: 'prenatal',
        text: 'Prenatal screening / diagnosis',
        description: 'Fetal genetic conditions',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - Prenatal Testing',
          description: 'IVDs for prenatal genetic testing.',
          regulatoryPathway: 'NMPA registration',
          requirements: [
            'NMPA registration',
            'Clinical performance in Chinese population',
            'Genetic counselling integration',
            'Post-market surveillance'
          ],
          productCodeExamples: ['NIPT', 'Trisomy screening']
        }
      },
      {
        id: 'hereditary',
        text: 'Hereditary conditions',
        description: 'Carrier testing, predictive testing',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - Hereditary Testing',
          description: 'IVDs for hereditary genetic conditions.',
          regulatoryPathway: 'NMPA registration',
          requirements: [
            'NMPA registration',
            'Clinical validity data',
            'Genetic counselling requirements'
          ],
          productCodeExamples: ['BRCA', 'Thalassemia carrier']
        }
      },
      {
        id: 'pharmacogenomics',
        text: 'Pharmacogenomics',
        description: 'Drug metabolism, dosing',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - Pharmacogenomics',
          description: 'IVDs for drug response prediction.',
          regulatoryPathway: 'NMPA registration',
          requirements: [
            'NMPA registration',
            'Chinese population data',
            'Clinical utility evidence'
          ],
          productCodeExamples: ['CYP2C19', 'Warfarin dosing']
        }
      }
    ]
  },

  china_ivd_cancer: {
    id: 'china_ivd_cancer',
    text: 'What is the cancer-related application?',
    options: [
      {
        id: 'screening',
        text: 'Population screening',
        description: 'Asymptomatic screening',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - Cancer Screening',
          description: 'IVDs for cancer screening programs.',
          regulatoryPathway: 'NMPA registration',
          requirements: [
            'NMPA registration',
            'Clinical trial data',
            'Screening performance validation'
          ],
          productCodeExamples: ['Cervical cancer', 'Colorectal screening']
        }
      },
      {
        id: 'diagnosis',
        text: 'Diagnosis / monitoring',
        description: 'Tumour markers for clinical use',
        result: {
          class: 'Class II',
          rule: 'NMPA Order No. 5 - Cancer Diagnostics',
          description: 'IVDs for cancer diagnosis and monitoring.',
          regulatoryPathway: 'Provincial registration',
          requirements: [
            'Provincial DA registration',
            'Performance data',
            'GMP certification'
          ],
          productCodeExamples: ['CEA', 'AFP', 'CA-125']
        }
      }
    ]
  },

  china_ivd_self_test: {
    id: 'china_ivd_self_test',
    text: 'What does the self-test detect?',
    options: [
      {
        id: 'serious',
        text: 'Serious conditions',
        description: 'Diseases with significant health impact',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - High-Risk Self-Tests',
          description: 'Self-tests for serious health conditions.',
          regulatoryPathway: 'NMPA registration',
          requirements: [
            'NMPA registration',
            'Lay user studies',
            'Chinese language labelling'
          ],
          productCodeExamples: ['HIV self-test', 'COVID self-test']
        }
      },
      {
        id: 'general',
        text: 'General monitoring',
        description: 'Pregnancy, glucose, ovulation',
        result: {
          class: 'Class II',
          rule: 'NMPA Order No. 5 - Self-Testing',
          description: 'Self-tests for general health monitoring.',
          regulatoryPathway: 'Provincial registration',
          requirements: [
            'Provincial DA registration',
            'Lay user validation',
            'Chinese labelling'
          ],
          productCodeExamples: ['Pregnancy test', 'Blood glucose']
        }
      }
    ]
  },

  china_ivd_general: {
    id: 'china_ivd_general',
    text: 'What type of general laboratory test?',
    options: [
      {
        id: 'chemistry',
        text: 'Clinical chemistry',
        description: 'Routine biochemistry tests',
        result: {
          class: 'Class II',
          rule: 'NMPA Order No. 5 - Clinical Chemistry',
          description: 'Standard clinical chemistry tests.',
          regulatoryPathway: 'Provincial registration',
          requirements: [
            'Provincial DA registration',
            'Performance evaluation',
            'GMP certification'
          ],
          productCodeExamples: ['Glucose', 'Liver function', 'Kidney function']
        }
      },
      {
        id: 'haematology',
        text: 'Haematology',
        description: 'Blood cell analysis, coagulation',
        result: {
          class: 'Class II',
          rule: 'NMPA Order No. 5 - Haematology',
          description: 'Haematology and coagulation tests.',
          regulatoryPathway: 'Provincial registration',
          requirements: [
            'Provincial DA registration',
            'Performance data',
            'GMP certification'
          ],
          productCodeExamples: ['CBC', 'PT/INR', 'D-dimer']
        }
      },
      {
        id: 'microbiology',
        text: 'General microbiology',
        description: 'Culture, identification (non-high-risk)',
        result: {
          class: 'Class II',
          rule: 'NMPA Order No. 5 - Microbiology',
          description: 'General microbiological tests.',
          regulatoryPathway: 'Provincial registration',
          requirements: [
            'Provincial DA registration',
            'Performance validation'
          ],
          productCodeExamples: ['Culture media', 'Gram stain']
        }
      }
    ]
  },

  china_ivd_instruments: {
    id: 'china_ivd_instruments',
    text: 'What type of instrument or accessory?',
    options: [
      {
        id: 'class_iii_analyser',
        text: 'Analyser for Class III tests',
        description: 'Dedicated to high-risk IVDs',
        result: {
          class: 'Class III',
          rule: 'NMPA Order No. 5 - Specific Instruments',
          description: 'Instruments for high-risk IVD testing.',
          regulatoryPathway: 'NMPA registration',
          requirements: [
            'NMPA registration',
            'Software validation (cybersecurity)',
            'GMP certification'
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
          rule: 'NMPA Order No. 5 - General Instruments',
          description: 'General-purpose laboratory analysers.',
          regulatoryPathway: 'Provincial registration',
          requirements: [
            'Provincial DA registration',
            'Technical documentation',
            'GMP certification'
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
          rule: 'NMPA Order No. 5 - Specimen Receptacles',
          description: 'Products for specimen collection.',
          regulatoryPathway: 'Filing/notification',
          requirements: [
            'Product filing',
            'Technical documentation',
            'China Agent'
          ],
          productCodeExamples: ['Blood tubes', 'Swabs']
        }
      }
    ]
  }
};
