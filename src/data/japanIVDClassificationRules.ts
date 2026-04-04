import { Question } from '@/types/classification';

/**
 * Japan IVD Classification Rules
 * Based on PMDA Pharmaceutical and Medical Device Act (PMD Act)
 * Uses Classes I, II, III
 */

export const japanIVDClassificationQuestions: Record<string, Question> = {
  japan_ivd_initial: {
    id: 'japan_ivd_initial',
    text: 'What is the primary intended use of this IVD?',
    helpText: 'PMDA classifies IVDs into Classes I-III based on risk.',
    options: [
      {
        id: 'blood_screening',
        text: 'Blood donation screening',
        description: 'HIV, HBV, HCV, HTLV screening',
        result: {
          class: 'Class III',
          rule: 'PMD Act - Blood Screening',
          description: 'IVDs for screening blood donations.',
          regulatoryPathway: 'Shonin (approval) required',
          requirements: [
            'PMDA Shonin approval',
            'Japanese clinical data often required',
            'QMS certification',
            'Marketing Authorization Holder (MAH) in Japan',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV screening', 'HCV NAT']
        }
      },
      {
        id: 'blood_grouping',
        text: 'ABO/Rh blood grouping',
        description: 'Blood group determination',
        result: {
          class: 'Class III',
          rule: 'PMD Act - Blood Grouping',
          description: 'Blood grouping for transfusion safety.',
          regulatoryPathway: 'Shonin approval',
          requirements: [
            'PMDA Shonin approval',
            'Clinical performance data',
            'QMS certification'
          ],
          productCodeExamples: ['ABO reagents', 'Rh typing']
        }
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic',
        description: 'Required for drug therapy selection',
        result: {
          class: 'Class III',
          rule: 'PMD Act - Companion Diagnostics',
          description: 'IVDs essential for drug selection decisions.',
          regulatoryPathway: 'Shonin with drug coordination',
          requirements: [
            'PMDA Shonin approval',
            'Coordination with drug approval',
            'Japanese population clinical data',
            'Post-market surveillance'
          ],
          productCodeExamples: ['EGFR', 'ALK', 'HER2']
        }
      },
      {
        id: 'genetic_testing',
        text: 'Genetic testing',
        description: 'Prenatal, hereditary, pharmacogenomics',
        nextQuestionId: 'japan_ivd_genetic'
      },
      {
        id: 'infectious_disease',
        text: 'Infectious disease testing',
        description: 'Pathogen detection',
        nextQuestionId: 'japan_ivd_infectious'
      },
      {
        id: 'cancer_testing',
        text: 'Cancer diagnostics',
        description: 'Tumour markers, staging',
        nextQuestionId: 'japan_ivd_cancer'
      },
      {
        id: 'self_testing',
        text: 'Self-testing / OTC',
        description: 'Home-use tests',
        nextQuestionId: 'japan_ivd_self_test'
      },
      {
        id: 'general_lab',
        text: 'General laboratory diagnostics',
        description: 'Clinical chemistry, haematology',
        nextQuestionId: 'japan_ivd_general'
      },
      {
        id: 'instruments',
        text: 'Instruments / accessories',
        description: 'Analysers, specimen containers',
        nextQuestionId: 'japan_ivd_instruments'
      }
    ]
  },

  japan_ivd_genetic: {
    id: 'japan_ivd_genetic',
    text: 'What type of genetic test?',
    options: [
      {
        id: 'prenatal',
        text: 'Prenatal testing',
        description: 'Fetal genetic conditions',
        result: {
          class: 'Class III',
          rule: 'PMD Act - Prenatal Testing',
          description: 'IVDs for prenatal genetic screening.',
          regulatoryPathway: 'Shonin approval',
          requirements: [
            'PMDA Shonin approval',
            'Clinical performance data',
            'Ethical considerations',
            'Japanese MAH'
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
          rule: 'PMD Act - Hereditary Testing',
          description: 'IVDs for hereditary genetic conditions.',
          regulatoryPathway: 'Shonin approval',
          requirements: [
            'PMDA Shonin approval',
            'Clinical validity',
            'Genetic counselling integration'
          ],
          productCodeExamples: ['BRCA', 'Lynch syndrome']
        }
      },
      {
        id: 'pharmacogenomics',
        text: 'Pharmacogenomics',
        description: 'Drug metabolism testing',
        result: {
          class: 'Class II',
          rule: 'PMD Act - Pharmacogenomics',
          description: 'IVDs for drug response prediction.',
          regulatoryPathway: 'Ninsho (certification)',
          requirements: [
            'Third-party certification',
            'Clinical utility data',
            'QMS certification'
          ],
          productCodeExamples: ['CYP2D6', 'UGT1A1']
        }
      }
    ]
  },

  japan_ivd_infectious: {
    id: 'japan_ivd_infectious',
    text: 'What type of infectious disease test?',
    options: [
      {
        id: 'high_risk',
        text: 'High-risk pathogens (HIV, HBV, HCV, TB)',
        description: 'Serious infections',
        result: {
          class: 'Class III',
          rule: 'PMD Act - High-Risk Pathogens',
          description: 'IVDs for serious infectious diseases.',
          regulatoryPathway: 'Shonin approval',
          requirements: [
            'PMDA Shonin approval',
            'Japanese clinical data',
            'QMS certification'
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
          rule: 'PMD Act - Moderate Risk',
          description: 'IVDs for common pathogens.',
          regulatoryPathway: 'Ninsho certification',
          requirements: [
            'Third-party certification',
            'Performance validation',
            'QMS certification'
          ],
          productCodeExamples: ['Influenza', 'RSV', 'Streptococcus']
        }
      }
    ]
  },

  japan_ivd_cancer: {
    id: 'japan_ivd_cancer',
    text: 'What is the cancer-related application?',
    options: [
      {
        id: 'screening',
        text: 'Population screening',
        description: 'Asymptomatic screening',
        result: {
          class: 'Class III',
          rule: 'PMD Act - Cancer Screening',
          description: 'IVDs for cancer screening.',
          regulatoryPathway: 'Shonin approval',
          requirements: [
            'PMDA Shonin approval',
            'Screening performance data',
            'Post-market surveillance'
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
          rule: 'PMD Act - Cancer Diagnostics',
          description: 'IVDs for cancer diagnosis.',
          regulatoryPathway: 'Ninsho certification',
          requirements: [
            'Third-party certification',
            'Performance data',
            'QMS certification'
          ],
          productCodeExamples: ['CEA', 'CA-125', 'AFP']
        }
      }
    ]
  },

  japan_ivd_self_test: {
    id: 'japan_ivd_self_test',
    text: 'What does the self-test detect?',
    options: [
      {
        id: 'serious',
        text: 'Serious conditions',
        description: 'High health impact',
        result: {
          class: 'Class III',
          rule: 'PMD Act - High-Risk Self-Tests',
          description: 'Self-tests for serious conditions.',
          regulatoryPathway: 'Shonin approval',
          requirements: [
            'PMDA Shonin approval',
            'Lay user studies',
            'Japanese labelling'
          ],
          productCodeExamples: ['HIV self-test']
        }
      },
      {
        id: 'general',
        text: 'General monitoring',
        description: 'Pregnancy, glucose',
        result: {
          class: 'Class II',
          rule: 'PMD Act - Self-Testing',
          description: 'Self-tests for general monitoring.',
          regulatoryPathway: 'Ninsho certification',
          requirements: [
            'Third-party certification',
            'Lay user validation',
            'Japanese language IFU'
          ],
          productCodeExamples: ['Pregnancy test', 'Blood glucose']
        }
      }
    ]
  },

  japan_ivd_general: {
    id: 'japan_ivd_general',
    text: 'What type of general laboratory test?',
    options: [
      {
        id: 'chemistry',
        text: 'Clinical chemistry',
        description: 'Biochemistry tests',
        result: {
          class: 'Class II',
          rule: 'PMD Act - Clinical Chemistry',
          description: 'Standard clinical chemistry tests.',
          regulatoryPathway: 'Ninsho certification',
          requirements: [
            'Third-party certification',
            'Performance evaluation',
            'QMS certification'
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
          rule: 'PMD Act - Haematology',
          description: 'Haematology and coagulation tests.',
          regulatoryPathway: 'Ninsho certification',
          requirements: [
            'Third-party certification',
            'Performance data',
            'QMS certification'
          ],
          productCodeExamples: ['CBC', 'PT/INR', 'APTT']
        }
      },
      {
        id: 'immunology',
        text: 'Immunology',
        description: 'Inflammatory markers, autoantibodies',
        result: {
          class: 'Class II',
          rule: 'PMD Act - Immunology',
          description: 'Routine immunology tests.',
          regulatoryPathway: 'Ninsho certification',
          requirements: [
            'Third-party certification',
            'Performance data'
          ],
          productCodeExamples: ['CRP', 'RF', 'ANA']
        }
      }
    ]
  },

  japan_ivd_instruments: {
    id: 'japan_ivd_instruments',
    text: 'What type of instrument?',
    options: [
      {
        id: 'class_iii_analyser',
        text: 'Analyser for Class III tests',
        description: 'Dedicated high-risk systems',
        result: {
          class: 'Class III',
          rule: 'PMD Act - Specific Instruments',
          description: 'Instruments for high-risk IVDs.',
          regulatoryPathway: 'Shonin approval',
          requirements: [
            'PMDA Shonin approval',
            'Software validation',
            'QMS certification'
          ],
          productCodeExamples: ['Molecular platforms', 'Blood bank systems']
        }
      },
      {
        id: 'general_analyser',
        text: 'General-purpose analyser',
        description: 'Multi-parameter systems',
        result: {
          class: 'Class II',
          rule: 'PMD Act - General Instruments',
          description: 'General laboratory analysers.',
          regulatoryPathway: 'Ninsho certification',
          requirements: [
            'Third-party certification',
            'Technical documentation',
            'QMS certification'
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
          rule: 'PMD Act - General Medical Devices',
          description: 'Specimen collection products.',
          regulatoryPathway: 'Todokede (notification)',
          requirements: [
            'Notification to PMDA',
            'Technical documentation',
            'Japanese MAH'
          ],
          productCodeExamples: ['Blood tubes', 'Specimen containers']
        }
      }
    ]
  }
};
