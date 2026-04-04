import { Question } from '@/types/classification';

/**
 * UK IVDR Classification Rules
 * Based on UK Medical Devices Regulations 2002 (as amended) - Part IV
 * Aligned with IMDRF classification (Classes A-D)
 * Reference: MHRA guidance on IVD classification
 */

export const ukIVDRClassificationQuestions: Record<string, Question> = {
  uk_ivdr_initial: {
    id: 'uk_ivdr_initial',
    text: 'What is the primary intended purpose of this IVD?',
    helpText: 'Select the main function of your in vitro diagnostic device.',
    options: [
      {
        id: 'blood_safety',
        text: 'Blood/tissue safety screening',
        description: 'Testing for transfusion/transplant safety (HIV, HBV, HCV, HTLV, etc.)',
        nextQuestionId: 'uk_ivdr_blood_safety'
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic (CDx)',
        description: 'Determines patient suitability for specific therapy',
        nextQuestionId: 'uk_ivdr_cdx'
      },
      {
        id: 'infectious_disease',
        text: 'Infectious disease testing',
        description: 'Detection of infectious agents (not blood safety)',
        nextQuestionId: 'uk_ivdr_infectious'
      },
      {
        id: 'cancer_markers',
        text: 'Cancer/tumour markers',
        description: 'Screening, diagnosis, or staging of cancer',
        nextQuestionId: 'uk_ivdr_cancer'
      },
      {
        id: 'genetic_testing',
        text: 'Genetic testing',
        description: 'Germline or somatic genetic analysis',
        nextQuestionId: 'uk_ivdr_genetic'
      },
      {
        id: 'self_testing',
        text: 'Self-testing / Near-patient testing',
        description: 'Used by patients or at point of care',
        nextQuestionId: 'uk_ivdr_self_test'
      },
      {
        id: 'general_lab',
        text: 'General laboratory use',
        description: 'Clinical chemistry, haematology, general diagnostics',
        nextQuestionId: 'uk_ivdr_general'
      },
      {
        id: 'instruments',
        text: 'Instruments / Accessories',
        description: 'Laboratory instruments, specimen containers, accessories',
        nextQuestionId: 'uk_ivdr_instruments'
      }
    ]
  },

  uk_ivdr_blood_safety: {
    id: 'uk_ivdr_blood_safety',
    text: 'What type of blood/tissue safety testing?',
    helpText: 'Blood safety IVDs are typically Class D under UK regulations.',
    options: [
      {
        id: 'transfusion_screening',
        text: 'Blood transfusion screening',
        description: 'HIV, HBV, HCV, HTLV, syphilis for transfusion safety',
        result: {
          class: 'Class D',
          rule: 'UK MDR 2002 Part IV, Annex II List A',
          description: 'IVDs for blood/tissue safety screening are highest risk class.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review by UK Approved Body',
            'Type examination or production quality assurance',
            'Performance evaluation with clinical evidence',
            'UK Responsible Person required for overseas manufacturers'
          ]
        }
      },
      {
        id: 'blood_grouping',
        text: 'Blood grouping / typing',
        description: 'ABO, Rh, Kell, other blood group systems',
        result: {
          class: 'Class D',
          rule: 'UK MDR 2002 Part IV, Annex II List A',
          description: 'Blood grouping IVDs for transfusion are highest risk.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review by UK Approved Body',
            'Type examination or production quality assurance',
            'Performance evaluation with clinical evidence'
          ]
        }
      },
      {
        id: 'organ_tissue',
        text: 'Organ/tissue compatibility',
        description: 'HLA typing for transplantation',
        result: {
          class: 'Class D',
          rule: 'UK MDR 2002 Part IV, Annex II List A',
          description: 'Transplant compatibility testing is highest risk class.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review by UK Approved Body',
            'Type examination or production quality assurance',
            'Performance evaluation with clinical evidence'
          ]
        }
      }
    ]
  },

  uk_ivdr_cdx: {
    id: 'uk_ivdr_cdx',
    text: 'What is the therapeutic context of this companion diagnostic?',
    helpText: 'Companion diagnostics are typically Class C under UK regulations.',
    options: [
      {
        id: 'cdx_oncology',
        text: 'Oncology CDx',
        description: 'Biomarker testing for cancer therapy selection',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'Companion diagnostics for treatment decisions are high risk.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Performance evaluation demonstrating clinical validity',
            'Coordination with therapeutic product manufacturer'
          ]
        }
      },
      {
        id: 'cdx_pharmacogenomics',
        text: 'Pharmacogenomics CDx',
        description: 'Genetic testing for drug metabolism/response',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'Pharmacogenomic CDx affects critical treatment decisions.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Clinical evidence of utility',
            'Labelling alignment with therapeutic product'
          ]
        }
      },
      {
        id: 'cdx_other',
        text: 'Other CDx',
        description: 'Non-oncology companion diagnostics',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'All companion diagnostics are classified as high risk.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Performance evaluation with clinical evidence'
          ]
        }
      }
    ]
  },

  uk_ivdr_infectious: {
    id: 'uk_ivdr_infectious',
    text: 'What type of infectious disease testing?',
    helpText: 'Classification depends on disease severity and transmission risk.',
    options: [
      {
        id: 'sti_testing',
        text: 'STI testing (not HIV)',
        description: 'Chlamydia, gonorrhoea, syphilis, HPV, etc.',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'STI testing carries significant public health implications.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Performance evaluation'
          ]
        }
      },
      {
        id: 'high_consequence',
        text: 'High-consequence pathogens',
        description: 'Tuberculosis, MRSA, highly transmissible diseases',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'High-consequence infectious disease testing is high risk.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Performance evaluation with clinical samples'
          ]
        }
      },
      {
        id: 'general_infectious',
        text: 'General infectious disease',
        description: 'Common respiratory, GI, or other infections',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, Self-certification with documentation',
          description: 'General infectious disease testing is moderate risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with QMS',
          requirements: [
            'Quality Management System (ISO 13485)',
            'Technical Documentation',
            'Performance evaluation',
            'Declaration of Conformity'
          ]
        }
      }
    ]
  },

  uk_ivdr_cancer: {
    id: 'uk_ivdr_cancer',
    text: 'What is the intended use of the cancer marker test?',
    helpText: 'Cancer marker classification depends on clinical impact.',
    options: [
      {
        id: 'cancer_screening',
        text: 'Cancer screening (asymptomatic)',
        description: 'Population-level screening for early detection',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'Cancer screening IVDs have high clinical impact.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Clinical performance data',
            'Post-market surveillance plan'
          ]
        }
      },
      {
        id: 'cancer_diagnosis',
        text: 'Cancer diagnosis/staging',
        description: 'Confirmation or staging of suspected cancer',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'Cancer diagnostic IVDs directly affect treatment decisions.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Clinical evidence of diagnostic accuracy'
          ]
        }
      },
      {
        id: 'cancer_monitoring',
        text: 'Cancer monitoring/prognosis',
        description: 'Monitoring treatment response or recurrence',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, Self-certification with documentation',
          description: 'Cancer monitoring IVDs are moderate risk when used alongside other clinical data.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with QMS',
          requirements: [
            'Quality Management System (ISO 13485)',
            'Technical Documentation',
            'Performance evaluation',
            'Clear intended use limitations'
          ]
        }
      }
    ]
  },

  uk_ivdr_genetic: {
    id: 'uk_ivdr_genetic',
    text: 'What type of genetic testing?',
    helpText: 'Genetic testing classification depends on clinical impact.',
    options: [
      {
        id: 'prenatal_genetic',
        text: 'Prenatal/neonatal genetic testing',
        description: 'Genetic testing during pregnancy or at birth',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'Prenatal genetic testing has significant clinical and ethical implications.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Clinical validation studies',
            'Genetic counselling considerations in labelling'
          ]
        }
      },
      {
        id: 'heritable_conditions',
        text: 'Heritable condition testing',
        description: 'Testing for inherited genetic disorders',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'Heritable condition testing significantly impacts patient management.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Clinical evidence',
            'Appropriate genetic counselling guidance'
          ]
        }
      },
      {
        id: 'somatic_genetic',
        text: 'Somatic mutation testing',
        description: 'Tumour profiling, acquired mutations',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Annex II List B',
          description: 'Somatic genetic testing affects treatment decisions.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Analytical and clinical validation'
          ]
        }
      }
    ]
  },

  uk_ivdr_self_test: {
    id: 'uk_ivdr_self_test',
    text: 'What type of self-test or near-patient test?',
    helpText: 'Self-tests require special usability considerations.',
    options: [
      {
        id: 'self_test_pregnancy',
        text: 'Pregnancy / fertility testing',
        description: 'Home pregnancy tests, ovulation tests',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, Self-test classification',
          description: 'Pregnancy and fertility self-tests are moderate risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with enhanced documentation',
          requirements: [
            'Quality Management System (ISO 13485)',
            'Technical Documentation',
            'Lay-user usability studies',
            'Clear labelling for home use',
            'Performance evaluation'
          ]
        }
      },
      {
        id: 'self_test_glucose',
        text: 'Blood glucose monitoring',
        description: 'Self-monitoring of blood glucose for diabetes',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, Self-test for chronic disease management',
          description: 'Glucose monitoring directly affects insulin dosing decisions.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'Technical Documentation review',
            'Lay-user usability studies',
            'Analytical accuracy per ISO 15197'
          ]
        }
      },
      {
        id: 'self_test_covid',
        text: 'Infectious disease self-test',
        description: 'COVID-19, flu, or other rapid home tests',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, Self-test classification',
          description: 'Infectious disease self-tests require lay-user validation.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with enhanced documentation',
          requirements: [
            'Quality Management System (ISO 13485)',
            'Technical Documentation',
            'Lay-user usability studies',
            'Performance validation in intended use population'
          ]
        }
      },
      {
        id: 'near_patient',
        text: 'Near-patient testing (professional use)',
        description: 'Point-of-care testing by healthcare professionals',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, Near-patient testing',
          description: 'Near-patient testing by professionals is moderate risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with QMS',
          requirements: [
            'Quality Management System (ISO 13485)',
            'Technical Documentation',
            'Performance evaluation',
            'Point-of-care guidance in labelling'
          ]
        }
      }
    ]
  },

  uk_ivdr_general: {
    id: 'uk_ivdr_general',
    text: 'What type of general laboratory testing?',
    helpText: 'General laboratory IVDs are typically lower risk.',
    options: [
      {
        id: 'clinical_chemistry',
        text: 'Clinical chemistry',
        description: 'Electrolytes, enzymes, metabolites, proteins',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, General laboratory IVDs',
          description: 'Clinical chemistry IVDs are moderate risk when used in laboratory settings.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with QMS',
          requirements: [
            'Quality Management System (ISO 13485)',
            'Technical Documentation',
            'Performance evaluation',
            'Declaration of Conformity'
          ]
        }
      },
      {
        id: 'haematology',
        text: 'Haematology',
        description: 'Complete blood count, coagulation, cell analysis',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, General laboratory IVDs',
          description: 'Haematology IVDs are moderate risk in professional settings.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with QMS',
          requirements: [
            'Quality Management System (ISO 13485)',
            'Technical Documentation',
            'Performance evaluation'
          ]
        }
      },
      {
        id: 'urinalysis',
        text: 'Urinalysis',
        description: 'Urine chemistry, sediment analysis',
        result: {
          class: 'Class A',
          rule: 'UK MDR 2002 Part IV, Low-risk general laboratory IVDs',
          description: 'Basic urinalysis is low risk when not for specific disease diagnosis.',
          regulatoryPathway: 'UKCA Marking - Self-declaration',
          requirements: [
            'Quality Management System (recommended)',
            'Technical Documentation',
            'Declaration of Conformity'
          ]
        }
      },
      {
        id: 'microbiology_culture',
        text: 'Culture media / microbiology',
        description: 'General culture media, identification systems',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, Microbiology IVDs',
          description: 'Microbiology IVDs are moderate risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with QMS',
          requirements: [
            'Quality Management System (ISO 13485)',
            'Technical Documentation',
            'Performance evaluation'
          ]
        }
      }
    ]
  },

  uk_ivdr_instruments: {
    id: 'uk_ivdr_instruments',
    text: 'What type of instrument or accessory?',
    helpText: 'Instruments are classified based on their intended use.',
    options: [
      {
        id: 'general_instrument',
        text: 'General laboratory instrument',
        description: 'Analysers, readers, automated systems',
        result: {
          class: 'Class A',
          rule: 'UK MDR 2002 Part IV, IVD instruments',
          description: 'General instruments without specific reagents are low risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration',
          requirements: [
            'Technical Documentation',
            'Declaration of Conformity',
            'Essential requirements compliance',
            'IEC 61010 safety compliance'
          ]
        }
      },
      {
        id: 'specimen_containers',
        text: 'Specimen receptacles',
        description: 'Blood collection tubes, urine containers, swabs',
        result: {
          class: 'Class A',
          rule: 'UK MDR 2002 Part IV, Specimen receptacles',
          description: 'Specimen containers are generally low risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration',
          requirements: [
            'Technical Documentation',
            'Declaration of Conformity',
            'Biocompatibility assessment if applicable'
          ]
        }
      },
      {
        id: 'buffers_solutions',
        text: 'Buffers / wash solutions',
        description: 'General purpose laboratory solutions',
        result: {
          class: 'Class A',
          rule: 'UK MDR 2002 Part IV, General products',
          description: 'General laboratory products without specific diagnostic claims are low risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration',
          requirements: [
            'Technical Documentation',
            'Declaration of Conformity',
            'Performance specifications'
          ]
        }
      },
      {
        id: 'software_ivd',
        text: 'Standalone IVD software',
        description: 'Software for IVD data analysis/interpretation',
        nextQuestionId: 'uk_ivdr_software'
      }
    ]
  },

  uk_ivdr_software: {
    id: 'uk_ivdr_software',
    text: 'What is the intended purpose of the IVD software?',
    helpText: 'IVD software classification depends on its clinical impact.',
    options: [
      {
        id: 'software_diagnostic',
        text: 'Diagnostic decision support',
        description: 'Software that provides diagnostic conclusions',
        result: {
          class: 'Class C',
          rule: 'UK MDR 2002 Part IV, IVD software with diagnostic function',
          description: 'Diagnostic software that provides clinical conclusions is high risk.',
          regulatoryPathway: 'UKCA Marking with UK Approved Body assessment',
          requirements: [
            'Full Quality Management System (ISO 13485)',
            'IEC 62304 software lifecycle',
            'Clinical validation of diagnostic accuracy',
            'Technical Documentation review'
          ]
        }
      },
      {
        id: 'software_analysis',
        text: 'Data analysis / interpretation aid',
        description: 'Software that assists but doesn\'t conclude',
        result: {
          class: 'Class B',
          rule: 'UK MDR 2002 Part IV, IVD software',
          description: 'Analysis software that aids professional interpretation is moderate risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration with QMS',
          requirements: [
            'Quality Management System (ISO 13485)',
            'IEC 62304 software lifecycle',
            'Performance validation',
            'Clear intended use limitations'
          ]
        }
      },
      {
        id: 'software_lims',
        text: 'Laboratory information management',
        description: 'LIMS, data storage, workflow management',
        result: {
          class: 'Class A',
          rule: 'UK MDR 2002 Part IV, General IVD software',
          description: 'LIMS without diagnostic function is low risk.',
          regulatoryPathway: 'UKCA Marking - Self-declaration',
          requirements: [
            'Technical Documentation',
            'IEC 62304 software lifecycle (recommended)',
            'Data integrity and security controls'
          ]
        }
      }
    ]
  }
};
