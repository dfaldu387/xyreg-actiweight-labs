import { Question } from '@/types/classification';

/**
 * Canada IVD Classification Rules
 * Based on Health Canada Medical Devices Regulations (SOR/98-282)
 * IVDs are classified as Class I, II, III, or IV
 */

export const canadaIVDClassificationQuestions: Record<string, Question> = {
  canada_ivd_initial: {
    id: 'canada_ivd_initial',
    text: 'What is the primary intended use of this IVD?',
    helpText: 'Health Canada classifies IVDs into Classes I-IV based on risk level.',
    options: [
      {
        id: 'blood_screening',
        text: 'Blood/tissue donation screening',
        description: 'HIV, HBV, HCV, HTLV screening for transfusion/transplant safety',
        result: {
          class: 'Class IV',
          rule: 'Health Canada IVD - Blood Screening',
          description: 'IVDs for screening blood, cells, tissues, or organs for transmissible agents.',
          ruleText: 'Class IV includes IVDs intended to detect the presence of, or exposure to, a transmissible agent in blood, blood components, cells, tissues or organs in order to assess their suitability for transfusion or transplantation.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1',
          regulatoryPathway: 'Class IV Medical Device Licence Application',
          requirements: [
            'Medical Device Licence (MDL)',
            'Quality Management System (ISO 13485)',
            'Canadian Medical Device Conformity Assessment System (CMDCAS)',
            'Establishment Licence',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV screening', 'HCV NAT', 'HBsAg tests']
        }
      },
      {
        id: 'blood_grouping',
        text: 'ABO/Rh blood grouping',
        description: 'Blood group determination for transfusion compatibility',
        result: {
          class: 'Class IV',
          rule: 'Health Canada IVD - Blood Grouping',
          description: 'IVDs for determining ABO blood groups or Rh blood groups.',
          ruleText: 'Class IV includes IVDs intended for determining ABO blood groups, Rh blood groups, or blood groups outside the ABO or Rh system.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1',
          regulatoryPathway: 'Class IV Medical Device Licence Application',
          requirements: [
            'Medical Device Licence (MDL)',
            'Quality Management System certification',
            'CMDCAS audit',
            'Clinical evidence'
          ],
          productCodeExamples: ['ABO reagents', 'Rh typing', 'Antibody screening']
        }
      },
      {
        id: 'genetic_testing',
        text: 'Genetic/hereditary testing',
        description: 'Prenatal, hereditary conditions, pharmacogenomics',
        nextQuestionId: 'canada_ivd_genetic'
      },
      {
        id: 'infectious_disease',
        text: 'Infectious disease testing',
        description: 'Pathogen detection and identification',
        nextQuestionId: 'canada_ivd_infectious'
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic',
        description: 'Required for drug therapy selection',
        result: {
          class: 'Class III',
          rule: 'Health Canada IVD - Companion Diagnostics',
          description: 'IVDs essential for safe and effective use of corresponding therapeutic products.',
          ruleText: 'Companion diagnostics that provide information essential for the safe and effective use of a corresponding therapeutic product are classified based on the risk associated with incorrect results.',
          ruleSource: 'Health Canada Guidance on Companion Diagnostics',
          regulatoryPathway: 'Class III Medical Device Licence with therapeutic coordination',
          requirements: [
            'Medical Device Licence (MDL)',
            'Coordination with drug submission',
            'Analytical and clinical validation',
            'Quality Management System'
          ],
          productCodeExamples: ['EGFR mutation', 'HER2', 'BRCA testing']
        }
      },
      {
        id: 'self_testing',
        text: 'Self-testing / Home use',
        description: 'Tests for use by lay persons at home',
        nextQuestionId: 'canada_ivd_self_test'
      },
      {
        id: 'general_lab',
        text: 'General laboratory diagnostics',
        description: 'Clinical chemistry, haematology, urinalysis',
        nextQuestionId: 'canada_ivd_general'
      },
      {
        id: 'instruments',
        text: 'Instruments and accessories',
        description: 'Analysers, specimen containers, reagent systems',
        nextQuestionId: 'canada_ivd_instruments'
      }
    ]
  },

  canada_ivd_genetic: {
    id: 'canada_ivd_genetic',
    text: 'What type of genetic test?',
    options: [
      {
        id: 'prenatal',
        text: 'Prenatal genetic testing',
        description: 'Fetal genetic abnormalities, chromosomal disorders',
        result: {
          class: 'Class III',
          rule: 'Health Canada IVD - Prenatal Testing',
          description: 'IVDs for prenatal genetic screening or diagnosis.',
          ruleText: 'IVDs intended for prenatal screening or diagnosis of genetic conditions are Class III due to the potential for serious harm from false results.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class III Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Clinical performance data',
            'Quality Management System'
          ],
          productCodeExamples: ['NIPT', 'Prenatal chromosomal testing']
        }
      },
      {
        id: 'hereditary',
        text: 'Hereditary condition testing',
        description: 'Carrier testing, predictive genetic testing',
        result: {
          class: 'Class III',
          rule: 'Health Canada IVD - Hereditary Testing',
          description: 'IVDs for detecting hereditary genetic conditions.',
          ruleText: 'IVDs for hereditary conditions where results may have significant implications for patient or family members.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class III Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Analytical and clinical validation',
            'Genetic counselling considerations'
          ],
          productCodeExamples: ['BRCA1/2', 'Lynch syndrome', 'Cystic fibrosis carrier']
        }
      },
      {
        id: 'pharmacogenomics',
        text: 'Pharmacogenomic testing',
        description: 'Drug metabolism, dosing guidance',
        result: {
          class: 'Class III',
          rule: 'Health Canada IVD - Pharmacogenomics',
          description: 'IVDs for predicting drug response or metabolism.',
          ruleText: 'Pharmacogenomic tests that inform drug selection or dosing decisions.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class III Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Clinical utility evidence',
            'Quality Management System'
          ],
          productCodeExamples: ['CYP2D6', 'CYP2C19', 'Warfarin sensitivity']
        }
      }
    ]
  },

  canada_ivd_infectious: {
    id: 'canada_ivd_infectious',
    text: 'What type of infectious disease test?',
    options: [
      {
        id: 'high_risk_pathogens',
        text: 'High-risk pathogens (HIV, HBV, HCV)',
        description: 'Life-threatening transmissible diseases',
        result: {
          class: 'Class IV',
          rule: 'Health Canada IVD - High-Risk Pathogens',
          description: 'IVDs for detecting serious transmissible diseases.',
          ruleText: 'IVDs for diagnosing life-threatening transmissible diseases where false results could lead to serious harm.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1',
          regulatoryPathway: 'Class IV Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'CMDCAS audit',
            'Extensive clinical validation',
            'Post-market surveillance'
          ],
          productCodeExamples: ['HIV diagnostic', 'HCV viral load', 'HBV markers']
        }
      },
      {
        id: 'sexually_transmitted',
        text: 'STI testing (non-HIV)',
        description: 'Chlamydia, gonorrhea, syphilis',
        result: {
          class: 'Class III',
          rule: 'Health Canada IVD - STI Testing',
          description: 'IVDs for sexually transmitted infection diagnosis.',
          ruleText: 'IVDs for detecting sexually transmitted infections where misdiagnosis could affect treatment and transmission.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class III Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Clinical performance data',
            'Quality Management System'
          ],
          productCodeExamples: ['Chlamydia/GC NAAT', 'Syphilis serology']
        }
      },
      {
        id: 'respiratory',
        text: 'Respiratory pathogens',
        description: 'Influenza, RSV, common respiratory infections',
        result: {
          class: 'Class II',
          rule: 'Health Canada IVD - Respiratory Testing',
          description: 'IVDs for common respiratory pathogen detection.',
          ruleText: 'IVDs for detecting common respiratory pathogens for clinical management.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class II Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Performance validation',
            'Quality Management System'
          ],
          productCodeExamples: ['Influenza A/B', 'RSV', 'Strep A rapid test']
        }
      },
      {
        id: 'general_microbiology',
        text: 'General microbiology',
        description: 'Culture, identification, susceptibility',
        result: {
          class: 'Class II',
          rule: 'Health Canada IVD - General Microbiology',
          description: 'IVDs for general microbiological testing.',
          ruleText: 'General microbiology products for pathogen culture and identification.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class II Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Technical documentation',
            'Quality Management System'
          ],
          productCodeExamples: ['Culture media', 'ID panels', 'AST systems']
        }
      }
    ]
  },

  canada_ivd_self_test: {
    id: 'canada_ivd_self_test',
    text: 'What does the self-test detect?',
    options: [
      {
        id: 'serious_condition',
        text: 'Serious health conditions',
        description: 'HIV, hepatitis, serious diseases',
        result: {
          class: 'Class III',
          rule: 'Health Canada IVD - High-Risk Self-Tests',
          description: 'Self-tests for serious conditions requiring medical follow-up.',
          ruleText: 'Self-tests for serious conditions where false results could lead to delayed treatment or unnecessary anxiety.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class III Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Lay user validation studies',
            'Clear patient instructions',
            'Link to healthcare system'
          ],
          productCodeExamples: ['HIV self-test', 'Hepatitis self-test']
        }
      },
      {
        id: 'general_monitoring',
        text: 'General health monitoring',
        description: 'Pregnancy, ovulation, glucose, cholesterol',
        result: {
          class: 'Class II',
          rule: 'Health Canada IVD - General Self-Tests',
          description: 'Self-tests for general health monitoring.',
          ruleText: 'Self-tests for general wellness monitoring by lay users at home.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class II Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Lay user studies',
            'Consumer-appropriate labelling'
          ],
          productCodeExamples: ['Pregnancy test', 'Ovulation predictor', 'Blood glucose meter']
        }
      }
    ]
  },

  canada_ivd_general: {
    id: 'canada_ivd_general',
    text: 'What type of general laboratory test?',
    options: [
      {
        id: 'chemistry',
        text: 'Clinical chemistry',
        description: 'Metabolic panels, enzymes, electrolytes',
        result: {
          class: 'Class II',
          rule: 'Health Canada IVD - Clinical Chemistry',
          description: 'Standard clinical chemistry tests.',
          ruleText: 'Clinical chemistry IVDs for routine laboratory testing.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class II Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Performance validation',
            'Quality Management System'
          ],
          productCodeExamples: ['Glucose', 'Creatinine', 'Liver enzymes', 'Electrolytes']
        }
      },
      {
        id: 'haematology',
        text: 'Haematology and coagulation',
        description: 'Blood counts, clotting factors',
        result: {
          class: 'Class II',
          rule: 'Health Canada IVD - Haematology',
          description: 'Haematology and coagulation testing.',
          ruleText: 'IVDs for haematological parameters and coagulation testing.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class II Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Performance data',
            'Quality Management System'
          ],
          productCodeExamples: ['CBC', 'PT/INR', 'D-dimer', 'Fibrinogen']
        }
      },
      {
        id: 'urinalysis',
        text: 'Urinalysis',
        description: 'Urine chemistry, microscopy',
        result: {
          class: 'Class I',
          rule: 'Health Canada IVD - Urinalysis',
          description: 'General urinalysis products.',
          ruleText: 'Low-risk IVDs for general urinalysis testing.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class I Establishment Licence',
          requirements: [
            'Establishment Licence',
            'Technical documentation',
            'Quality Management System'
          ],
          productCodeExamples: ['Urine dipsticks', 'Urine chemistry']
        }
      }
    ]
  },

  canada_ivd_instruments: {
    id: 'canada_ivd_instruments',
    text: 'What type of instrument or accessory?',
    options: [
      {
        id: 'high_risk_analyser',
        text: 'Analyser for Class III/IV tests',
        description: 'Blood bank, HIV testing platforms',
        result: {
          class: 'Class III',
          rule: 'Health Canada IVD - Specific Instruments',
          description: 'Instruments specifically for high-risk IVD testing.',
          ruleText: 'Instruments essential for performing Class III or IV IVD tests inherit the risk classification.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class III Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Software validation (IEC 62304)',
            'System performance validation'
          ],
          productCodeExamples: ['Blood bank analysers', 'NAT platforms']
        }
      },
      {
        id: 'general_analyser',
        text: 'General-purpose analyser',
        description: 'Chemistry, haematology, immunoassay platforms',
        result: {
          class: 'Class II',
          rule: 'Health Canada IVD - General Instruments',
          description: 'General laboratory analysers.',
          ruleText: 'General-purpose laboratory analysers and automated systems.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class II Medical Device Licence',
          requirements: [
            'Medical Device Licence',
            'Technical documentation',
            'Software validation'
          ],
          productCodeExamples: ['Chemistry analysers', 'Immunoassay platforms']
        }
      },
      {
        id: 'specimen_containers',
        text: 'Specimen collection devices',
        description: 'Blood tubes, swabs, containers',
        result: {
          class: 'Class I',
          rule: 'Health Canada IVD - Specimen Receptacles',
          description: 'Specimen collection and transport products.',
          ruleText: 'Low-risk specimen collection devices not containing additives affecting test results.',
          ruleSource: 'Health Canada Medical Devices Regulations (SOR/98-282)',
          regulatoryPathway: 'Class I Establishment Licence',
          requirements: [
            'Establishment Licence',
            'Technical documentation'
          ],
          productCodeExamples: ['Specimen containers', 'Transport swabs', 'Urine cups']
        }
      }
    ]
  }
};
