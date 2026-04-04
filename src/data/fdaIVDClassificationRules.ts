import { Question } from '@/types/classification';

/**
 * FDA IVD Classification Rules
 * Based on 21 CFR Part 809 and FDA IVD Guidance Documents
 * Uses Classes I, II, III (not IMDRF A-D)
 * Reference: FDA CDRH Device Classification Database
 */

export const fdaIVDClassificationQuestions: Record<string, Question> = {
  fda_ivd_initial: {
    id: 'fda_ivd_initial',
    text: 'What is the primary intended use of this IVD?',
    helpText: 'FDA classifies IVDs based on risk to patient health. Select the main purpose.',
    options: [
      {
        id: 'blood_bank',
        text: 'Blood banking / transfusion safety',
        description: 'Blood screening, typing, compatibility testing',
        nextQuestionId: 'fda_ivd_blood_bank'
      },
      {
        id: 'companion_dx',
        text: 'Companion diagnostic (CDx)',
        description: 'Essential for safe and effective use of a therapeutic',
        nextQuestionId: 'fda_ivd_cdx'
      },
      {
        id: 'infectious_disease',
        text: 'Infectious disease testing',
        description: 'Detection or identification of pathogens',
        nextQuestionId: 'fda_ivd_infectious'
      },
      {
        id: 'cancer_diagnostics',
        text: 'Cancer / oncology diagnostics',
        description: 'Tumour markers, screening, diagnosis',
        nextQuestionId: 'fda_ivd_cancer'
      },
      {
        id: 'genetic_testing',
        text: 'Genetic / molecular testing',
        description: 'Genetic markers, pharmacogenomics, hereditary conditions',
        nextQuestionId: 'fda_ivd_genetic'
      },
      {
        id: 'otc_self_test',
        text: 'OTC / Self-testing',
        description: 'Over-the-counter or home-use tests',
        nextQuestionId: 'fda_ivd_otc'
      },
      {
        id: 'clinical_chemistry',
        text: 'Clinical chemistry / haematology',
        description: 'General laboratory diagnostics',
        nextQuestionId: 'fda_ivd_chemistry'
      },
      {
        id: 'instruments_accessories',
        text: 'Instruments / general products',
        description: 'Analysers, specimen containers, reagents',
        nextQuestionId: 'fda_ivd_instruments'
      }
    ]
  },

  fda_ivd_blood_bank: {
    id: 'fda_ivd_blood_bank',
    text: 'What type of blood banking test?',
    helpText: 'Blood banking IVDs are typically Class II or III depending on intended use.',
    options: [
      {
        id: 'donor_screening',
        text: 'Donor screening (HIV, HBV, HCV, etc.)',
        description: 'Screening blood/plasma donations for infectious agents',
        result: {
          class: 'Class III',
          rule: '21 CFR Part 864 - Blood and Blood Products',
          description: 'Donor screening tests are critical for blood supply safety.',
          regulatoryPathway: 'Premarket Approval (PMA) required',
          productCodeExamples: ['KRE', 'KRF', 'QJK'],
          requirements: [
            'Premarket Approval (PMA) submission',
            'Clinical trials demonstrating safety and effectiveness',
            'Manufacturing site inspection',
            'Quality System Regulation (21 CFR Part 820)',
            'Post-market surveillance requirements'
          ]
        }
      },
      {
        id: 'blood_grouping',
        text: 'ABO/Rh blood grouping',
        description: 'Blood group antigen determination',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 864.7010 - Blood grouping reagent',
          description: 'Blood grouping requires 510(k) with special controls.',
          regulatoryPathway: '510(k) Premarket Notification with special controls',
          productCodeExamples: ['KRD', 'KRC'],
          requirements: [
            '510(k) submission',
            'Substantial equivalence to predicate device',
            'Performance testing per FDA guidance',
            'Labelling requirements per 21 CFR 809',
            'Quality System Regulation compliance'
          ]
        }
      },
      {
        id: 'compatibility_testing',
        text: 'Compatibility / crossmatch testing',
        description: 'Donor-recipient compatibility',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 864 - Blood Banking Immunology',
          description: 'Compatibility testing requires 510(k) clearance.',
          regulatoryPathway: '510(k) Premarket Notification',
          productCodeExamples: ['KGP', 'LYL'],
          requirements: [
            '510(k) submission',
            'Performance evaluation',
            'Quality System Regulation compliance'
          ]
        }
      }
    ]
  },

  fda_ivd_cdx: {
    id: 'fda_ivd_cdx',
    text: 'What is the therapeutic context?',
    helpText: 'CDx devices are typically Class III requiring PMA, often reviewed with the therapeutic.',
    options: [
      {
        id: 'cdx_oncology',
        text: 'Oncology companion diagnostic',
        description: 'Biomarker for targeted cancer therapy selection',
        result: {
          class: 'Class III',
          rule: 'FDA CDx Guidance - Essential for therapeutic use',
          description: 'Oncology CDx are Class III due to critical treatment decisions.',
          regulatoryPathway: 'PMA (often concurrent with drug approval)',
          productCodeExamples: ['PIQ', 'PLD'],
          requirements: [
            'Premarket Approval (PMA) or De Novo',
            'Bridging studies with therapeutic clinical trials',
            'Analytical and clinical validation',
            'Labelling coordination with therapeutic product',
            'Post-market requirements per PMA conditions'
          ]
        }
      },
      {
        id: 'cdx_pharmacogenomics',
        text: 'Pharmacogenomics CDx',
        description: 'Genetic test for drug dosing/selection',
        result: {
          class: 'Class II' as any,
          rule: 'FDA Pharmacogenomics Guidance',
          description: 'PGx CDx may be Class II (De Novo) or III depending on clinical impact.',
          regulatoryPathway: 'De Novo or PMA depending on risk',
          productCodeExamples: ['NVQ', 'PGX'],
          requirements: [
            'De Novo request or PMA (depending on therapeutic)',
            'Analytical validation',
            'Clinical utility evidence',
            'Labelling alignment with therapeutic'
          ]
        }
      },
      {
        id: 'cdx_other',
        text: 'Other companion diagnostic',
        description: 'Non-oncology CDx (e.g., infectious disease therapy)',
        result: {
          class: 'Class II' as any,
          rule: 'FDA CDx Guidance',
          description: 'Classification depends on therapeutic risk and clinical decision impact.',
          regulatoryPathway: '510(k), De Novo, or PMA',
          requirements: [
            'Pre-submission meeting with FDA recommended',
            'Analytical and clinical validation',
            'Coordination with therapeutic manufacturer'
          ]
        }
      }
    ]
  },

  fda_ivd_infectious: {
    id: 'fda_ivd_infectious',
    text: 'What type of infectious disease test?',
    helpText: 'Classification depends on disease severity and public health impact.',
    options: [
      {
        id: 'high_risk_pathogens',
        text: 'High-risk pathogens (HIV, HCV, HBV)',
        description: 'Tests for bloodborne or high-consequence pathogens',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 866 - Immunology and Microbiology',
          description: 'High-risk pathogen tests require enhanced controls.',
          regulatoryPathway: '510(k) with special controls or PMA',
          productCodeExamples: ['LQR', 'LSC', 'NVU'],
          requirements: [
            '510(k) with FDA special controls guidance compliance',
            'Performance evaluation per FDA guidance',
            'Clinical trial data for novel claims',
            'Quality System Regulation compliance'
          ]
        }
      },
      {
        id: 'respiratory_pathogens',
        text: 'Respiratory pathogens (flu, RSV, COVID)',
        description: 'Upper/lower respiratory infection testing',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 866.3900 series - Microbiology devices',
          description: 'Respiratory pathogen tests are typically Class II.',
          regulatoryPathway: '510(k) Premarket Notification',
          productCodeExamples: ['LMO', 'QLJ', 'QJL'],
          requirements: [
            '510(k) submission',
            'Substantial equivalence demonstration',
            'Performance testing per applicable guidance',
            'Labelling requirements'
          ]
        }
      },
      {
        id: 'sti_testing',
        text: 'STI testing (chlamydia, gonorrhoea, etc.)',
        description: 'Sexually transmitted infection detection',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 866.3300 series - Microbiology devices',
          description: 'STI tests are Class II with special controls.',
          regulatoryPathway: '510(k) with special controls',
          productCodeExamples: ['LWS', 'LWT', 'NUJ'],
          requirements: [
            '510(k) submission',
            'Performance per FDA guidance',
            'Special controls compliance',
            'Clinical trial if claims differ from predicate'
          ]
        }
      },
      {
        id: 'general_microbiology',
        text: 'General microbiology / culture',
        description: 'Culture media, identification systems',
        result: {
          class: 'Class I' as any,
          rule: '21 CFR 866.2000 series - Microbiology devices',
          description: 'General microbiology products vary in classification.',
          regulatoryPathway: '510(k) Exempt (Class I) or 510(k) (Class II)',
          productCodeExamples: ['JZL', 'LNQ', 'JSB'],
          requirements: [
            'Registration and Listing (all devices)',
            '510(k) if Class II',
            'Quality System Regulation compliance',
            'General and special controls as applicable'
          ]
        }
      }
    ]
  },

  fda_ivd_cancer: {
    id: 'fda_ivd_cancer',
    text: 'What is the intended use of the oncology test?',
    helpText: 'Cancer diagnostic classification depends on clinical decision impact.',
    options: [
      {
        id: 'cancer_screening',
        text: 'Cancer screening (asymptomatic population)',
        description: 'Population screening for early detection',
        result: {
          class: 'Class III',
          rule: 'FDA Cancer Screening IVD Guidance',
          description: 'Cancer screening in asymptomatic individuals is high-risk.',
          regulatoryPathway: 'Premarket Approval (PMA)',
          productCodeExamples: ['PKY', 'QDU'],
          requirements: [
            'PMA submission',
            'Large clinical trials demonstrating screening utility',
            'Risk-benefit analysis',
            'Post-market surveillance'
          ]
        }
      },
      {
        id: 'cancer_diagnosis',
        text: 'Cancer diagnosis / staging',
        description: 'Confirmation or characterization of cancer',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 866.6000 series - Immunology devices',
          description: 'Classification depends on clinical impact and novelty.',
          regulatoryPathway: '510(k), De Novo, or PMA',
          productCodeExamples: ['KAD', 'OQI', 'PNT'],
          requirements: [
            'Pre-submission recommended for novel markers',
            'Analytical and clinical validation',
            'Performance per applicable guidance'
          ]
        }
      },
      {
        id: 'cancer_monitoring',
        text: 'Cancer monitoring / recurrence',
        description: 'Monitoring treatment response or detecting recurrence',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 866.6000 series - Tumour markers',
          description: 'Monitoring tests used with other clinical info are typically Class II.',
          regulatoryPathway: '510(k) Premarket Notification',
          productCodeExamples: ['DSL', 'LKO'],
          requirements: [
            '510(k) submission',
            'Substantial equivalence to predicate',
            'Performance evaluation',
            'Clear intended use in labelling'
          ]
        }
      },
      {
        id: 'cancer_prognosis',
        text: 'Prognostic markers',
        description: 'Prediction of disease outcome',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 866 - Clinical chemistry devices',
          description: 'Prognostic markers used with clinical judgment are Class II.',
          regulatoryPathway: '510(k) Premarket Notification',
          productCodeExamples: ['NLT', 'OIN'],
          requirements: [
            '510(k) submission',
            'Clinical validation of prognostic claims',
            'Clear intended use limitations'
          ]
        }
      }
    ]
  },

  fda_ivd_genetic: {
    id: 'fda_ivd_genetic',
    text: 'What type of genetic test?',
    helpText: 'Genetic test classification depends on clinical implications.',
    options: [
      {
        id: 'prenatal_genetic',
        text: 'Prenatal / carrier screening',
        description: 'Genetic testing during pregnancy or for carriers',
        result: {
          class: 'Class II' as any,
          rule: 'FDA Genetic Testing Guidance',
          description: 'Prenatal genetic tests may be Class II or III depending on claims.',
          regulatoryPathway: '510(k), De Novo, or PMA',
          productCodeExamples: ['NXS', 'OFO'],
          requirements: [
            'Pre-submission meeting recommended',
            'Analytical and clinical validation',
            'Genetic counselling considerations in labelling',
            'Appropriate intended use population'
          ]
        }
      },
      {
        id: 'heritable_genetic',
        text: 'Heritable condition testing',
        description: 'Testing for inherited genetic disorders',
        result: {
          class: 'Class II' as any,
          rule: 'FDA Genetic Test Classification',
          description: 'Heritable condition tests are typically Class II.',
          regulatoryPathway: '510(k) or De Novo',
          productCodeExamples: ['NVR', 'OXJ'],
          requirements: [
            '510(k) or De Novo submission',
            'Analytical validation',
            'Clinical validity evidence',
            'Genetic counselling guidance in labelling'
          ]
        }
      },
      {
        id: 'ngc_ngs',
        text: 'Next-generation sequencing (NGS)',
        description: 'Broad genomic sequencing panels',
        result: {
          class: 'Class II' as any,
          rule: 'FDA NGS Guidance Documents',
          description: 'NGS classification depends on intended use and claims.',
          regulatoryPathway: '510(k), De Novo, or PMA',
          productCodeExamples: ['PIW', 'PDQ'],
          requirements: [
            'Compliance with FDA NGS guidance',
            'Analytical validation (accuracy, precision, reproducibility)',
            'Reference materials and orthogonal methods',
            'Bioinformatics pipeline validation'
          ]
        }
      },
      {
        id: 'dtc_genetic',
        text: 'Direct-to-consumer genetic test',
        description: 'Consumer genetic testing (ancestry, wellness)',
        result: {
          class: 'Class II' as any,
          rule: 'FDA DTC Genetic Testing Guidance',
          description: 'DTC genetic tests without medical claims may use De Novo.',
          regulatoryPathway: 'De Novo classification request',
          productCodeExamples: ['QJA'],
          requirements: [
            'De Novo request',
            'Consumer comprehension studies',
            'Analytical and clinical validation',
            'Clear communication of limitations'
          ]
        }
      }
    ]
  },

  fda_ivd_otc: {
    id: 'fda_ivd_otc',
    text: 'What type of OTC/self-test?',
    helpText: 'OTC tests require additional usability and lay-user studies.',
    options: [
      {
        id: 'otc_pregnancy',
        text: 'Pregnancy / ovulation test',
        description: 'Home pregnancy or fertility monitoring',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 862.1785 - hCG test systems',
          description: 'OTC pregnancy tests are Class II with special controls.',
          regulatoryPathway: '510(k) with OTC labelling',
          productCodeExamples: ['LCL', 'LCM'],
          requirements: [
            '510(k) submission',
            'Lay-user labelling comprehension study',
            'Consumer use study (untrained users)',
            'OTC labelling per 21 CFR 809.10'
          ]
        }
      },
      {
        id: 'otc_glucose',
        text: 'Blood glucose monitoring',
        description: 'Self-monitoring for diabetes management',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 862.1345 - Glucose test system',
          description: 'OTC glucose monitors are Class II with special controls.',
          regulatoryPathway: '510(k) with OTC special controls',
          productCodeExamples: ['NBW', 'MWY'],
          requirements: [
            '510(k) submission',
            'Accuracy per ISO 15197 / FDA guidance',
            'Lay-user use study',
            'Interference testing',
            'OTC labelling requirements'
          ]
        }
      },
      {
        id: 'otc_covid',
        text: 'OTC infectious disease (COVID, flu)',
        description: 'Home tests for infectious diseases',
        result: {
          class: 'Class II' as any,
          rule: 'FDA OTC Molecular/Antigen Test Guidance',
          description: 'OTC infectious disease tests are Class II with special controls.',
          regulatoryPathway: '510(k) or EUA (emergency use)',
          productCodeExamples: ['QJL', 'QKO'],
          requirements: [
            '510(k) submission (or EUA during PHE)',
            'OTC performance evaluation',
            'Lay-user usability study',
            'Consumer comprehension study',
            'Special controls per FDA template'
          ]
        }
      },
      {
        id: 'otc_cholesterol',
        text: 'OTC cholesterol / lipid test',
        description: 'Home cholesterol monitoring',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 862.1170 - Cholesterol test system',
          description: 'OTC cholesterol tests are Class II.',
          regulatoryPathway: '510(k) with OTC labelling',
          productCodeExamples: ['JJL', 'CFX'],
          requirements: [
            '510(k) submission',
            'Consumer use study',
            'Accuracy evaluation',
            'OTC labelling'
          ]
        }
      }
    ]
  },

  fda_ivd_chemistry: {
    id: 'fda_ivd_chemistry',
    text: 'What type of clinical chemistry test?',
    helpText: 'Most clinical chemistry tests are Class I or II.',
    options: [
      {
        id: 'general_chemistry',
        text: 'General clinical chemistry',
        description: 'Electrolytes, enzymes, metabolites, proteins',
        result: {
          class: 'Class I' as any,
          rule: '21 CFR 862 - Clinical Chemistry and Toxicology',
          description: 'General chemistry tests are typically Class I (exempt) or Class II.',
          regulatoryPathway: '510(k) Exempt or 510(k)',
          productCodeExamples: ['JJL', 'CGM', 'CHD'],
          requirements: [
            'Registration and Listing (all devices)',
            '510(k) if Class II',
            'Quality System Regulation compliance',
            'General controls'
          ]
        }
      },
      {
        id: 'haematology',
        text: 'Haematology / coagulation',
        description: 'CBC, clotting factors, cell analysis',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 864 - Haematology and Pathology',
          description: 'Haematology devices are typically Class II.',
          regulatoryPathway: '510(k) Premarket Notification',
          productCodeExamples: ['GGL', 'GGH', 'JHR'],
          requirements: [
            '510(k) submission',
            'Substantial equivalence demonstration',
            'Performance testing',
            'Quality System Regulation compliance'
          ]
        }
      },
      {
        id: 'toxicology',
        text: 'Toxicology / drugs of abuse',
        description: 'Drug screening, therapeutic drug monitoring',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 862.3000 series - Toxicology',
          description: 'Toxicology tests are Class II with special controls.',
          regulatoryPathway: '510(k) Premarket Notification',
          productCodeExamples: ['KRE', 'LDS', 'JVX'],
          requirements: [
            '510(k) submission',
            'Cutoff concentration validation',
            'Cross-reactivity testing',
            'Confirmation method requirements in labelling'
          ]
        }
      },
      {
        id: 'thyroid_hormones',
        text: 'Thyroid / endocrine testing',
        description: 'Thyroid hormones, cortisol, other hormones',
        result: {
          class: 'Class II' as any,
          rule: '21 CFR 862.1000 series - Clinical chemistry',
          description: 'Endocrine tests are typically Class II.',
          regulatoryPathway: '510(k) Premarket Notification',
          productCodeExamples: ['CHR', 'CHT', 'DJF'],
          requirements: [
            '510(k) submission',
            'Analytical performance evaluation',
            'Method comparison studies'
          ]
        }
      }
    ]
  },

  fda_ivd_instruments: {
    id: 'fda_ivd_instruments',
    text: 'What type of instrument or general product?',
    helpText: 'Instruments and accessories vary in classification.',
    options: [
      {
        id: 'automated_analyzer',
        text: 'Automated analyser / platform',
        description: 'Chemistry analysers, immunoassay platforms',
        result: {
          class: 'Class I' as any,
          rule: '21 CFR 862.2 / 864.2 / 866.2 - Automated systems',
          description: 'Analyser classification depends on intended use.',
          regulatoryPathway: '510(k) Exempt (Class I) or 510(k) (Class II)',
          productCodeExamples: ['JQW', 'MRI', 'CHW'],
          requirements: [
            'Registration and Listing',
            '510(k) if Class II',
            'Electrical safety (IEC 61010)',
            'Software validation',
            'Assay-specific clearances as applicable'
          ]
        }
      },
      {
        id: 'specimen_collection',
        text: 'Specimen collection devices',
        description: 'Blood tubes, swabs, urine containers',
        result: {
          class: 'Class I' as any,
          rule: '21 CFR 864.3250 - Blood specimen collection device',
          description: 'Specimen collection devices are generally Class I exempt.',
          regulatoryPathway: '510(k) Exempt',
          productCodeExamples: ['FMF', 'KXG', 'OPQ'],
          requirements: [
            'Registration and Listing',
            'General controls (labelling, GMP)',
            'Biocompatibility as applicable',
            'Sterility validation if sterile'
          ]
        }
      },
      {
        id: 'reagents_calibrators',
        text: 'Calibrators / controls',
        description: 'Quality control materials, calibrators',
        result: {
          class: 'Class I' as any,
          rule: '21 CFR 862.1 series - Clinical chemistry',
          description: 'Calibrators/controls classification follows the test system.',
          regulatoryPathway: '510(k) Exempt or 510(k)',
          productCodeExamples: ['CFR', 'JJJ'],
          requirements: [
            'Registration and Listing',
            '510(k) if assay-specific claims',
            'Value assignment validation',
            'Stability studies'
          ]
        }
      },
      {
        id: 'ivd_software',
        text: 'IVD software / informatics',
        description: 'LIS, image analysis, decision support',
        nextQuestionId: 'fda_ivd_software'
      }
    ]
  },

  fda_ivd_software: {
    id: 'fda_ivd_software',
    text: 'What is the function of the IVD software?',
    helpText: 'Software classification depends on clinical decision impact.',
    options: [
      {
        id: 'diagnostic_software',
        text: 'Diagnostic decision support',
        description: 'Software that provides diagnostic conclusions',
        result: {
          class: 'Class II' as any,
          rule: 'FDA Software as Medical Device (SaMD) Guidance',
          description: 'Diagnostic software classification depends on condition and decision type.',
          regulatoryPathway: '510(k), De Novo, or PMA',
          productCodeExamples: ['QDQ', 'QPN'],
          requirements: [
            'Pre-submission recommended',
            'IEC 62304 software lifecycle',
            'Clinical validation of diagnostic accuracy',
            'Cybersecurity documentation'
          ]
        }
      },
      {
        id: 'analysis_software',
        text: 'Image/data analysis',
        description: 'Quantitative analysis, measurement tools',
        result: {
          class: 'Class II' as any,
          rule: 'FDA CADe / Quantitative Software Guidance',
          description: 'Analysis software assisting professionals is typically Class II.',
          regulatoryPathway: '510(k) Premarket Notification',
          productCodeExamples: ['QKQ', 'QIH'],
          requirements: [
            '510(k) submission',
            'Analytical validation',
            'IEC 62304 compliance',
            'Clinical validation as appropriate'
          ]
        }
      },
      {
        id: 'lis_software',
        text: 'LIS / workflow software',
        description: 'Laboratory information systems, data management',
        result: {
          class: 'Class I' as any,
          rule: 'FDA LIS Guidance / MDDS Classification',
          description: 'Pure data transfer/storage software may not be a device.',
          regulatoryPathway: 'Registration only (if device) or not regulated',
          requirements: [
            'Evaluate if meets device definition',
            'If device: Registration and Listing',
            'General controls as applicable',
            'Data integrity and security controls'
          ]
        }
      },
      {
        id: 'cdss_software',
        text: 'Clinical decision support',
        description: 'Treatment recommendations, risk calculators',
        result: {
          class: 'Class II' as any,
          rule: 'FDA CDS Guidance (2022)',
          description: 'CDS may be non-device if meeting CDS criteria in FD&C Act.',
          regulatoryPathway: 'Evaluate CDS criteria; 510(k) if device',
          requirements: [
            'Evaluate against 21st Century Cures Act CDS criteria',
            'If device: Pre-submission recommended',
            '510(k) or De Novo as appropriate',
            'Clinical validation of recommendations'
          ]
        }
      }
    ]
  }
};
