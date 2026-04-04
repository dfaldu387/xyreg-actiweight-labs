import { Question } from '@/types/classification';

/**
 * Australia IVD Classification Rules
 * Based on TGA Therapeutic Goods (Medical Devices) Regulations 2002
 * Uses Classes 1, 2, 3, 4 for IVDs
 */

export const australiaIVDClassificationQuestions: Record<string, Question> = {
  australia_ivd_initial: {
    id: 'australia_ivd_initial',
    text: 'What is the primary intended use of this IVD?',
    helpText: 'TGA classifies IVDs into Classes 1-4 based on risk.',
    options: [
      {
        id: 'blood_screening',
        text: 'Blood/tissue donation screening',
        description: 'HIV, HBV, HCV, HTLV screening',
        result: {
          class: 'Class 4',
          rule: 'TGA IVD Regulation - Blood Screening',
          description: 'IVDs for screening blood and tissue donations.',
          regulatoryPathway: 'ARTG inclusion with conformity assessment',
          requirements: [
            'Australian Register of Therapeutic Goods (ARTG) inclusion',
            'Conformity assessment with EU Notified Body or TGA',
            'Australian Sponsor required',
            'Post-market surveillance',
            'Adverse event reporting'
          ],
          productCodeExamples: ['HIV screening', 'HCV NAT', 'HBsAg']
        }
      },
      {
        id: 'blood_grouping',
        text: 'ABO/Rh blood grouping',
        description: 'Blood group determination for transfusion',
        result: {
          class: 'Class 4',
          rule: 'TGA IVD Regulation - Blood Grouping',
          description: 'Blood grouping reagents for transfusion safety.',
          regulatoryPathway: 'ARTG inclusion with conformity assessment',
          requirements: [
            'ARTG inclusion',
            'Conformity assessment',
            'Clinical performance data',
            'Australian Sponsor'
          ],
          productCodeExamples: ['ABO reagents', 'Rh typing', 'Crossmatch']
        }
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic',
        description: 'Required for drug therapy selection',
        result: {
          class: 'Class 3',
          rule: 'TGA IVD Regulation - Companion Diagnostics',
          description: 'IVDs essential for safe use of specific medicines.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Coordination with drug registration',
            'Clinical evidence',
            'Post-market surveillance'
          ],
          productCodeExamples: ['EGFR mutation', 'HER2', 'PD-L1']
        }
      },
      {
        id: 'genetic_testing',
        text: 'Genetic testing',
        description: 'Prenatal, hereditary, pharmacogenomics',
        nextQuestionId: 'australia_ivd_genetic'
      },
      {
        id: 'infectious_disease',
        text: 'Infectious disease testing',
        description: 'Pathogen detection',
        nextQuestionId: 'australia_ivd_infectious'
      },
      {
        id: 'cancer_testing',
        text: 'Cancer diagnostics',
        description: 'Tumour markers, screening',
        nextQuestionId: 'australia_ivd_cancer'
      },
      {
        id: 'self_testing',
        text: 'Self-testing / OTC',
        description: 'Home-use tests',
        nextQuestionId: 'australia_ivd_self_test'
      },
      {
        id: 'general_lab',
        text: 'General laboratory diagnostics',
        description: 'Clinical chemistry, haematology',
        nextQuestionId: 'australia_ivd_general'
      },
      {
        id: 'instruments',
        text: 'Instruments / accessories',
        description: 'Analysers, specimen containers',
        nextQuestionId: 'australia_ivd_instruments'
      }
    ]
  },

  australia_ivd_genetic: {
    id: 'australia_ivd_genetic',
    text: 'What type of genetic test?',
    options: [
      {
        id: 'prenatal',
        text: 'Prenatal testing',
        description: 'Fetal genetic conditions',
        result: {
          class: 'Class 3',
          rule: 'TGA IVD Regulation - Prenatal Testing',
          description: 'IVDs for prenatal genetic screening.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Clinical performance data',
            'Australian Sponsor',
            'Post-market surveillance'
          ],
          productCodeExamples: ['NIPT', 'Prenatal chromosomal']
        }
      },
      {
        id: 'hereditary',
        text: 'Hereditary conditions',
        description: 'Carrier, predictive testing',
        result: {
          class: 'Class 3',
          rule: 'TGA IVD Regulation - Hereditary Testing',
          description: 'IVDs for hereditary genetic conditions.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Clinical validity',
            'Genetic counselling considerations'
          ],
          productCodeExamples: ['BRCA', 'Lynch syndrome', 'Cystic fibrosis']
        }
      },
      {
        id: 'pharmacogenomics',
        text: 'Pharmacogenomics',
        description: 'Drug metabolism testing',
        result: {
          class: 'Class 3',
          rule: 'TGA IVD Regulation - Pharmacogenomics',
          description: 'IVDs for drug response prediction.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Clinical utility data',
            'Australian Sponsor'
          ],
          productCodeExamples: ['CYP2D6', 'UGT1A1', 'Warfarin dosing']
        }
      }
    ]
  },

  australia_ivd_infectious: {
    id: 'australia_ivd_infectious',
    text: 'What type of infectious disease test?',
    options: [
      {
        id: 'high_risk',
        text: 'High-risk pathogens (HIV, HBV, HCV)',
        description: 'Serious transmissible diseases',
        result: {
          class: 'Class 4',
          rule: 'TGA IVD Regulation - High-Risk Pathogens',
          description: 'IVDs for detecting serious infections.',
          regulatoryPathway: 'ARTG with conformity assessment',
          requirements: [
            'ARTG inclusion',
            'Conformity assessment',
            'Clinical data',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV', 'HCV', 'HBV']
        }
      },
      {
        id: 'moderate_risk',
        text: 'Common pathogens',
        description: 'Respiratory, GI infections',
        result: {
          class: 'Class 2',
          rule: 'TGA IVD Regulation - Moderate Risk',
          description: 'IVDs for common pathogens.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Performance validation',
            'Australian Sponsor'
          ],
          productCodeExamples: ['Influenza', 'RSV', 'Streptococcus']
        }
      }
    ]
  },

  australia_ivd_cancer: {
    id: 'australia_ivd_cancer',
    text: 'What is the cancer-related application?',
    options: [
      {
        id: 'screening',
        text: 'Population screening',
        description: 'Asymptomatic screening',
        result: {
          class: 'Class 3',
          rule: 'TGA IVD Regulation - Cancer Screening',
          description: 'IVDs for cancer screening.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
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
          class: 'Class 2',
          rule: 'TGA IVD Regulation - Cancer Diagnostics',
          description: 'IVDs for cancer diagnosis.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Performance data',
            'Australian Sponsor'
          ],
          productCodeExamples: ['CEA', 'CA-125', 'AFP']
        }
      }
    ]
  },

  australia_ivd_self_test: {
    id: 'australia_ivd_self_test',
    text: 'What does the self-test detect?',
    options: [
      {
        id: 'serious',
        text: 'Serious conditions (HIV, etc.)',
        description: 'High health impact',
        result: {
          class: 'Class 3',
          rule: 'TGA IVD Regulation - High-Risk Self-Tests',
          description: 'Self-tests for serious conditions.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Lay user studies',
            'Clear instructions'
          ],
          productCodeExamples: ['HIV self-test']
        }
      },
      {
        id: 'general',
        text: 'General monitoring',
        description: 'Pregnancy, glucose',
        result: {
          class: 'Class 2',
          rule: 'TGA IVD Regulation - Self-Testing',
          description: 'Self-tests for general monitoring.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Lay user validation',
            'Consumer labelling'
          ],
          productCodeExamples: ['Pregnancy test', 'Blood glucose', 'Ovulation']
        }
      }
    ]
  },

  australia_ivd_general: {
    id: 'australia_ivd_general',
    text: 'What type of general laboratory test?',
    options: [
      {
        id: 'chemistry',
        text: 'Clinical chemistry',
        description: 'Biochemistry tests',
        result: {
          class: 'Class 2',
          rule: 'TGA IVD Regulation - Clinical Chemistry',
          description: 'Standard clinical chemistry tests.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Performance evaluation',
            'Australian Sponsor'
          ],
          productCodeExamples: ['Glucose', 'Liver enzymes', 'Electrolytes']
        }
      },
      {
        id: 'haematology',
        text: 'Haematology',
        description: 'Blood counts, coagulation',
        result: {
          class: 'Class 2',
          rule: 'TGA IVD Regulation - Haematology',
          description: 'Haematology and coagulation tests.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Performance data',
            'Australian Sponsor'
          ],
          productCodeExamples: ['CBC', 'PT/INR', 'D-dimer']
        }
      },
      {
        id: 'microbiology',
        text: 'General microbiology',
        description: 'Culture, identification',
        result: {
          class: 'Class 2',
          rule: 'TGA IVD Regulation - Microbiology',
          description: 'General microbiological tests.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Performance validation'
          ],
          productCodeExamples: ['Culture media', 'Susceptibility tests']
        }
      }
    ]
  },

  australia_ivd_instruments: {
    id: 'australia_ivd_instruments',
    text: 'What type of instrument?',
    options: [
      {
        id: 'class_4_analyser',
        text: 'Analyser for Class 4 tests',
        description: 'Blood screening systems',
        result: {
          class: 'Class 4',
          rule: 'TGA IVD Regulation - Specific Instruments',
          description: 'Instruments for high-risk IVDs.',
          regulatoryPathway: 'ARTG with conformity assessment',
          requirements: [
            'ARTG inclusion',
            'Conformity assessment',
            'Software validation'
          ],
          productCodeExamples: ['Blood bank analysers']
        }
      },
      {
        id: 'general_analyser',
        text: 'General-purpose analyser',
        description: 'Multi-parameter systems',
        result: {
          class: 'Class 2',
          rule: 'TGA IVD Regulation - General Instruments',
          description: 'General laboratory analysers.',
          regulatoryPathway: 'ARTG inclusion',
          requirements: [
            'ARTG inclusion',
            'Technical documentation',
            'Australian Sponsor'
          ],
          productCodeExamples: ['Chemistry analysers', 'Haematology counters']
        }
      },
      {
        id: 'specimen_containers',
        text: 'Specimen containers',
        description: 'Blood tubes, swabs',
        result: {
          class: 'Class 1',
          rule: 'TGA IVD Regulation - Specimen Receptacles',
          description: 'Specimen collection products.',
          regulatoryPathway: 'ARTG inclusion (exempt category)',
          requirements: [
            'ARTG listing',
            'Technical documentation',
            'Australian Sponsor'
          ],
          productCodeExamples: ['Blood tubes', 'Specimen containers']
        }
      }
    ]
  }
};
