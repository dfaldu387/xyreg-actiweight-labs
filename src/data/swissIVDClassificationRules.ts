import { Question } from '@/types/classification';

/**
 * Swiss IVD Classification Rules
 * Based on Swiss Ordinance on In-Vitro Diagnostic Medical Devices (IvDO/IVDO)
 * Uses Classes A, B, C, D (aligned with EU IVDR structure)
 * Reference: SR 812.219 - Ordinance on In-Vitro Diagnostic Medical Devices
 */

export const swissIVDClassificationQuestions: Record<string, Question> = {
  swiss_ivd_initial: {
    id: 'swiss_ivd_initial',
    text: 'What is the primary intended purpose of this IVD?',
    helpText: 'Swiss IvDO classifies IVDs into Classes A-D based on risk. Select the main purpose.',
    options: [
      {
        id: 'high_risk_infectious',
        text: 'Detection of life-threatening infectious agents',
        description: 'HIV, HBV, HCV, HTLV, or other high-risk pathogens in blood/tissues',
        nextQuestionId: 'swiss_ivd_high_risk_infectious'
      },
      {
        id: 'blood_grouping',
        text: 'Blood grouping / tissue typing',
        description: 'ABO, Rh, HLA, or other compatibility testing',
        nextQuestionId: 'swiss_ivd_blood_grouping'
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic',
        description: 'Essential for safe and effective use of a medicinal product',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Companion Diagnostics',
          description: 'Companion diagnostics used to determine patient eligibility for targeted therapy.',
          regulatoryPathway: 'Conformity assessment with Notified Body involvement',
          requirements: [
            'Conformity assessment by designated Conformity Assessment Body',
            'Coordination with medicinal product authorization',
            'Clinical evidence demonstrating diagnostic-therapeutic link',
            'Post-market surveillance plan',
            'Swiss Authorized Representative if non-Swiss manufacturer'
          ],
          productCodeExamples: ['Oncology CDx', 'Pharmacogenomic tests']
        }
      },
      {
        id: 'genetic_testing',
        text: 'Genetic testing / screening',
        description: 'Prenatal, hereditary conditions, pharmacogenomics',
        nextQuestionId: 'swiss_ivd_genetic'
      },
      {
        id: 'cancer_screening',
        text: 'Cancer screening / diagnosis',
        description: 'Tumour markers, screening tests',
        nextQuestionId: 'swiss_ivd_cancer'
      },
      {
        id: 'self_testing',
        text: 'Self-testing / near-patient testing',
        description: 'OTC tests or point-of-care by non-professionals',
        nextQuestionId: 'swiss_ivd_self_test'
      },
      {
        id: 'general_laboratory',
        text: 'General laboratory diagnostics',
        description: 'Clinical chemistry, haematology, microbiology',
        nextQuestionId: 'swiss_ivd_general'
      },
      {
        id: 'instruments',
        text: 'Instruments / specimen containers',
        description: 'Analysers, sample collection devices, reagents',
        nextQuestionId: 'swiss_ivd_instruments'
      }
    ]
  },

  swiss_ivd_high_risk_infectious: {
    id: 'swiss_ivd_high_risk_infectious',
    text: 'What is the specific application?',
    helpText: 'Detection of certain high-risk pathogens requires Class D classification.',
    options: [
      {
        id: 'blood_screening',
        text: 'Blood/tissue donation screening',
        description: 'Screening donations for transfusion-transmissible infections',
        result: {
          class: 'Class D',
          rule: 'Swiss IvDO Annex I - Blood Screening',
          description: 'IVDs for screening blood, plasma, or tissue donations for HIV, HBV, HCV, HTLV.',
          regulatoryPathway: 'Full conformity assessment with batch testing',
          requirements: [
            'Conformity assessment by designated Conformity Assessment Body',
            'Batch verification and release',
            'Post-market surveillance including trend analysis',
            'Incident reporting to Swissmedic',
            'Swiss Authorized Representative required'
          ],
          productCodeExamples: ['HIV screening', 'HCV NAT', 'HBsAg tests']
        }
      },
      {
        id: 'diagnosis_confirmation',
        text: 'Diagnosis / confirmation testing',
        description: 'Confirming infection in symptomatic patients',
        result: {
          class: 'Class D',
          rule: 'Swiss IvDO Annex I - High-Risk Pathogens',
          description: 'Confirmatory tests for life-threatening infectious diseases.',
          regulatoryPathway: 'Full conformity assessment with Notified Body',
          requirements: [
            'Conformity assessment by designated body',
            'Clinical performance studies in Swiss or recognized setting',
            'Post-market performance follow-up',
            'Vigilance system',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['HIV confirmatory', 'HCV genotyping']
        }
      }
    ]
  },

  swiss_ivd_blood_grouping: {
    id: 'swiss_ivd_blood_grouping',
    text: 'What type of blood grouping or typing test?',
    helpText: 'Blood grouping for transfusion is typically Class D; tissue typing varies.',
    options: [
      {
        id: 'abo_rh_transfusion',
        text: 'ABO/Rh grouping for transfusion',
        description: 'Blood group determination for safe transfusion',
        result: {
          class: 'Class D',
          rule: 'Swiss IvDO Annex I - Blood Grouping',
          description: 'ABO, Rh (C, c, D, E, e), Kell grouping systems for transfusion compatibility.',
          regulatoryPathway: 'Full conformity assessment',
          requirements: [
            'Conformity assessment by designated body',
            'Batch release testing',
            'Clinical performance validation',
            'Post-market surveillance',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['ABO grouping reagents', 'Rh typing']
        }
      },
      {
        id: 'other_blood_groups',
        text: 'Other blood group antigens',
        description: 'Minor blood group systems (Duffy, Kidd, etc.)',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Blood Group Antigens',
          description: 'IVDs for determining other blood group antigens or antibodies.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination by designated body',
            'Quality management system certification',
            'Clinical performance data',
            'Post-market surveillance'
          ],
          productCodeExamples: ['Duffy typing', 'Kidd antibody screening']
        }
      },
      {
        id: 'hla_typing',
        text: 'HLA typing for transplantation',
        description: 'Tissue compatibility for organ/stem cell transplant',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Transplant Compatibility',
          description: 'HLA typing and crossmatch testing for transplant compatibility.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination by designated body',
            'Clinical performance studies',
            'Post-market surveillance',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['HLA-A/B/C typing', 'HLA crossmatch']
        }
      }
    ]
  },

  swiss_ivd_genetic: {
    id: 'swiss_ivd_genetic',
    text: 'What type of genetic testing?',
    helpText: 'Prenatal and hereditary genetic tests have higher classification.',
    options: [
      {
        id: 'prenatal_screening',
        text: 'Prenatal screening / diagnosis',
        description: 'Fetal chromosome abnormalities, genetic conditions',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Prenatal Testing',
          description: 'IVDs for prenatal screening including NIPT and fetal genetic testing.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination by designated body',
            'Clinical performance validation',
            'Genetic counselling considerations',
            'Post-market surveillance',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['NIPT', 'Prenatal trisomy screening']
        }
      },
      {
        id: 'hereditary_conditions',
        text: 'Hereditary genetic conditions',
        description: 'Carrier testing, predictive genetic testing',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Hereditary Testing',
          description: 'IVDs for detecting genetic variants associated with hereditary conditions.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination',
            'Clinical validity and utility data',
            'Genetic counselling integration',
            'Post-market surveillance'
          ],
          productCodeExamples: ['BRCA testing', 'Cystic fibrosis carrier']
        }
      },
      {
        id: 'pharmacogenomics',
        text: 'Pharmacogenomics',
        description: 'Drug metabolism, dosing guidance',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Pharmacogenomics',
          description: 'IVDs determining genetic variants affecting drug response.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination',
            'Clinical evidence for drug-gene interactions',
            'Post-market performance monitoring'
          ],
          productCodeExamples: ['CYP450 genotyping', 'Warfarin dosing']
        }
      }
    ]
  },

  swiss_ivd_cancer: {
    id: 'swiss_ivd_cancer',
    text: 'What is the cancer-related application?',
    helpText: 'Cancer screening tests typically require higher classification.',
    options: [
      {
        id: 'cancer_screening',
        text: 'Population screening',
        description: 'Asymptomatic population screening programs',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Cancer Screening',
          description: 'IVDs used for cancer screening in asymptomatic populations.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination by designated body',
            'Clinical trial data for screening performance',
            'Post-market performance follow-up',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['PSA screening', 'Cervical cancer screening']
        }
      },
      {
        id: 'diagnosis_staging',
        text: 'Diagnosis / staging / monitoring',
        description: 'Tumour markers for symptomatic patients',
        result: {
          class: 'Class B',
          rule: 'Swiss IvDO Art. 5 - Cancer Diagnostics',
          description: 'IVDs for cancer diagnosis, staging, or monitoring in clinical settings.',
          regulatoryPathway: 'Self-declaration with technical documentation',
          requirements: [
            'Technical documentation',
            'Quality management system',
            'Clinical performance data',
            'Post-market surveillance',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['CEA', 'CA-125', 'AFP']
        }
      }
    ]
  },

  swiss_ivd_self_test: {
    id: 'swiss_ivd_self_test',
    text: 'What is tested with the self-test?',
    helpText: 'Self-tests are classified based on the condition being tested.',
    options: [
      {
        id: 'self_test_serious',
        text: 'Serious conditions (HIV, pregnancy complications)',
        description: 'Self-tests where misdiagnosis could cause serious harm',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - High-Risk Self-Tests',
          description: 'Self-tests for conditions where false results could lead to serious health consequences.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination by designated body',
            'Lay user performance studies',
            'Clear instructions for use',
            'Post-market surveillance',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['HIV self-test', 'Coagulation self-monitoring']
        }
      },
      {
        id: 'self_test_general',
        text: 'General wellness / monitoring',
        description: 'Pregnancy, ovulation, cholesterol, glucose monitoring',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Self-Testing',
          description: 'Self-tests for conditions with moderate risk impact.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination',
            'Lay user studies',
            'Clear labelling and IFU',
            'Post-market surveillance'
          ],
          productCodeExamples: ['Pregnancy test', 'Blood glucose meter', 'Cholesterol test']
        }
      }
    ]
  },

  swiss_ivd_general: {
    id: 'swiss_ivd_general',
    text: 'What clinical area does the test serve?',
    helpText: 'General laboratory tests are typically Class B unless specified otherwise.',
    options: [
      {
        id: 'clinical_chemistry',
        text: 'Clinical chemistry',
        description: 'Electrolytes, enzymes, metabolites',
        result: {
          class: 'Class B',
          rule: 'Swiss IvDO Art. 5 - Clinical Chemistry',
          description: 'Standard clinical chemistry tests used in professional laboratory settings.',
          regulatoryPathway: 'Self-declaration with technical documentation',
          requirements: [
            'Technical documentation',
            'Quality management system',
            'Performance evaluation',
            'Post-market surveillance',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['Glucose', 'Creatinine', 'Liver enzymes']
        }
      },
      {
        id: 'haematology',
        text: 'Haematology',
        description: 'Blood cell counts, coagulation (excluding transfusion)',
        result: {
          class: 'Class B',
          rule: 'Swiss IvDO Art. 5 - Haematology',
          description: 'Haematology tests for blood cell analysis and coagulation.',
          regulatoryPathway: 'Self-declaration with technical documentation',
          requirements: [
            'Technical documentation',
            'Quality management system',
            'Clinical performance data',
            'Post-market surveillance'
          ],
          productCodeExamples: ['CBC reagents', 'PT/INR', 'D-dimer']
        }
      },
      {
        id: 'microbiology_low',
        text: 'General microbiology',
        description: 'Culture media, susceptibility testing, non-high-risk pathogens',
        result: {
          class: 'Class B',
          rule: 'Swiss IvDO Art. 5 - Microbiology',
          description: 'Microbiological tests for non-life-threatening pathogens.',
          regulatoryPathway: 'Self-declaration with technical documentation',
          requirements: [
            'Technical documentation',
            'Quality management system',
            'Performance validation',
            'Post-market surveillance'
          ],
          productCodeExamples: ['Culture media', 'Antibiotic susceptibility']
        }
      },
      {
        id: 'immunology_routine',
        text: 'Routine immunology',
        description: 'Inflammatory markers, autoantibodies',
        result: {
          class: 'Class B',
          rule: 'Swiss IvDO Art. 5 - Immunology',
          description: 'Immunological tests for routine clinical use.',
          regulatoryPathway: 'Self-declaration with technical documentation',
          requirements: [
            'Technical documentation',
            'Performance evaluation',
            'Quality management system',
            'Post-market surveillance'
          ],
          productCodeExamples: ['CRP', 'RF', 'ANA']
        }
      }
    ]
  },

  swiss_ivd_instruments: {
    id: 'swiss_ivd_instruments',
    text: 'What type of instrument or accessory?',
    helpText: 'Classification depends on whether the product has measuring function.',
    options: [
      {
        id: 'analyser_specific',
        text: 'Analyser for specific high-risk tests',
        description: 'Dedicated instrument for Class C/D IVDs',
        result: {
          class: 'Class C',
          rule: 'Swiss IvDO Art. 5 - Specific Instruments',
          description: 'Instruments specifically intended for use with Class C or D IVDs.',
          regulatoryPathway: 'Conformity assessment with Notified Body',
          requirements: [
            'Type examination',
            'Software validation (IEC 62304)',
            'Electromagnetic compatibility',
            'Post-market surveillance'
          ],
          productCodeExamples: ['Blood bank analysers', 'Molecular platforms']
        }
      },
      {
        id: 'general_analyser',
        text: 'General-purpose analyser',
        description: 'Multi-parameter or open systems',
        result: {
          class: 'Class B',
          rule: 'Swiss IvDO Art. 5 - General Instruments',
          description: 'General-purpose laboratory instruments and analysers.',
          regulatoryPathway: 'Self-declaration with technical documentation',
          requirements: [
            'Technical documentation',
            'Software validation',
            'Quality management system',
            'Post-market surveillance'
          ],
          productCodeExamples: ['Chemistry analysers', 'Haematology counters']
        }
      },
      {
        id: 'specimen_containers',
        text: 'Specimen containers / collection devices',
        description: 'Blood tubes, swabs, urine containers',
        result: {
          class: 'Class A',
          rule: 'Swiss IvDO Art. 5 - Specimen Receptacles',
          description: 'Products for specimen collection, transport, and storage.',
          regulatoryPathway: 'Self-declaration',
          requirements: [
            'Technical documentation',
            'Declaration of Conformity',
            'Quality management system recommended',
            'Swiss Authorized Representative'
          ],
          productCodeExamples: ['Blood collection tubes', 'Specimen containers']
        }
      },
      {
        id: 'reagents_general',
        text: 'General-purpose reagents / buffers',
        description: 'Wash solutions, diluents, calibrators for Class A/B',
        result: {
          class: 'Class A',
          rule: 'Swiss IvDO Art. 5 - General Reagents',
          description: 'General-purpose laboratory reagents without specific intended use.',
          regulatoryPathway: 'Self-declaration',
          requirements: [
            'Technical documentation',
            'Declaration of Conformity',
            'Quality management system recommended'
          ],
          productCodeExamples: ['Buffer solutions', 'Wash reagents', 'Diluents']
        }
      }
    ]
  }
};
