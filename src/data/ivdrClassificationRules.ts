import { Question, ClassificationResult } from '@/types/classification';

export const ivdrClassificationQuestions: Record<string, Question> = {
  initial: {
    id: 'initial',
    text: 'Is this product an In Vitro Diagnostic medical device?',
    description: 'An IVD medical device is defined under IVDR Article 2(2) as any medical device which is a reagent, reagent product, calibrator, control material, kit, instrument, apparatus, piece of equipment, software or system, whether used alone or in combination, intended by the manufacturer to be used in vitro for the examination of specimens, including blood and tissue donations, derived from the human body.',
    helpText: 'IVDs are intended solely or principally for providing information for diagnostic, monitoring or compatibility purposes.',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is an IVD medical device',
        nextQuestionId: 'rule_1_transmissible_agents'
      },
      {
        id: 'no',
        text: 'No, this is not an IVD medical device',
        result: {
          class: 'Not an IVD device',
          rule: 'IVDR Article 2(2)',
          description: 'Product does not meet the definition of an In Vitro Diagnostic medical device under the IVDR.'
        }
      }
    ]
  },

  rule_1_transmissible_agents: {
    id: 'rule_1_transmissible_agents',
    text: 'Is the device intended for detecting transmissible agents in blood/tissue for transfusion/transplantation, life-threatening diseases, or monitoring infectious load?',
    description: 'Rule 1: Class D devices include those for detecting transmissible agents in blood/blood components/cells/tissues/organs for transfusion/transplantation suitability, life-threatening diseases with high propagation risk, or determining infectious load where monitoring is critical.',
    options: [
      {
        id: 'yes',
        text: 'Yes, detects transmissible agents or infectious load',
        result: {
          class: 'Class D',
          rule: 'IVDR Annex VIII, Rule 1',
          description: 'This device is classified as Class D under Rule 1 because it is intended for one of the highest-risk diagnostic purposes: (a) detecting transmissible agents in blood, blood components, cells, tissues, or organs to assess suitability for transfusion, transplantation, or cell administration; (b) detecting transmissible agents causing life-threatening diseases with high propagation risk; or (c) determining infectious load where monitoring is critical for patient management. These applications directly impact life-or-death clinical decisions.',
          ruleText: 'Devices intended to be used for the following purposes are classified as class D:\n\n(a) detecting the presence of, or exposure to, a transmissible agent in blood, blood components, cells, tissues or organs, or in any of their derivatives, in order to assess their suitability for transfusion, transplantation or cell administration;\n\n(b) detecting the presence of, or exposure to, a transmissible agent that causes a life-threatening disease with a high or suspected high risk of propagation;\n\n(c) determining the infectious load of a transmissible agent that causes a life-threatening disease where monitoring is critical in the process of patient management.',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 1'
        }
      },
      {
        id: 'no',
        text: 'No, not for these purposes',
        nextQuestionId: 'rule_2_blood_grouping'
      }
    ]
  },

  rule_2_blood_grouping: {
    id: 'rule_2_blood_grouping',
    text: 'Is the device intended for blood grouping or tissue typing for immunological compatibility?',
    description: 'Rule 2: Devices for blood grouping or tissue typing to ensure immunological compatibility for transfusion/transplantation are generally Class C, except for specific markers which are Class D.',
    options: [
      {
        id: 'yes_specific_markers',
        text: 'Yes, for ABO, Rhesus, Kell, Kidd, or Duffy systems',
        result: {
          class: 'Class D',
          rule: 'IVDR Annex VIII, Rule 2(a)',
          description: 'This device is classified as Class D under Rule 2(a) because it is intended for blood grouping or tissue typing to ensure immunological compatibility for transfusion, transplantation, or cell administration, and specifically targets high-risk marker systems: ABO, Rhesus (RH1-RH5), Kell (Kel1), Kidd (JK1, JK2), or Duffy (FY1, FY2). These markers are designated as highest-risk due to their critical role in preventing potentially fatal transfusion reactions.',
          ruleText: 'Devices intended to be used for blood grouping or tissue typing to ensure the immunological compatibility of blood, blood components, cells, tissues or organs that are intended for transfusion, transplantation or cell administration, are classified as class D when intended to determine any of the following markers:\n\n— ABO system [A (ABO1), B (ABO2), AB (ABO3)];\n— Rhesus system [RH1 (D), RHW1, RH2 (C), RH3 (E), RH4 (c), RH5 (e)];\n— Kell system [Kel1 (K)];\n— Kidd system [JK1 (Jka), JK2 (Jkb)];\n— Duffy system [FY1 (Fya), FY2 (Fyb)].',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 2(a)'
        }
      },
      {
        id: 'yes_other_markers',
        text: 'Yes, for other blood grouping/tissue typing',
        result: {
          class: 'Class C',
          rule: 'IVDR Annex VIII, Rule 2(b)',
          description: 'This device is classified as Class C under Rule 2(b) because it is intended for blood grouping or tissue typing to ensure immunological compatibility for transfusion, transplantation, or cell administration, but targets markers other than those referred to in point (a) (i.e., markers outside the ABO, Rhesus, Kell, Kidd, and Duffy systems). While still critical for patient safety, these markers present a lower risk profile than the high-risk systems specified in Rule 2(a).',
          ruleText: 'Devices intended to be used for blood grouping or tissue typing to ensure the immunological compatibility of blood, blood components, cells, tissues or organs that are intended for transfusion, transplantation or cell administration, are classified as class C when intended to determine any markers other than those referred to in point (a).',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 2(b)'
        }
      },
      {
        id: 'no',
        text: 'No, not for blood grouping/tissue typing',
        nextQuestionId: 'rule_3_class_c_conditions'
      }
    ]
  },

  rule_3_class_c_conditions: {
    id: 'rule_3_class_c_conditions',
    text: 'Does the device detect sexually transmitted agents, infectious agents in CSF/blood, or is used for cancer screening/diagnosis?',
    description: 'Rule 3: Class C devices include those for detecting sexually transmitted agents, infectious agents in CSF/blood, cancer screening/diagnosis, genetic testing, companion diagnostics, and other high-risk applications.',
    options: [
      {
        id: 'yes_std',
        text: 'Yes, detects sexually transmitted agents',
        result: {
          class: 'Class C',
          rule: 'IVDR Annex VIII, Rule 3(a)',
          description: 'Devices for detecting sexually transmitted agents are Class C.',
          ruleText: 'Devices intended to be used for the following purposes are classified as class C:\n\n(a) detecting the presence of, or exposure to, a sexually transmitted agent;',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 3(a)'
        }
      },
      {
        id: 'yes_csf_blood',
        text: 'Yes, detects infectious agents in CSF/blood',
        result: {
          class: 'Class C',
          rule: 'IVDR Annex VIII, Rule 3(b)',
          description: 'Devices for detecting infectious agents in cerebrospinal fluid or blood are Class C.',
          ruleText: 'Devices intended to be used for the following purposes are classified as class C:\n\n(b) detecting the presence of, or exposure to, an infectious agent in cerebrospinal fluid or blood;',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 3(b)'
        }
      },
      {
        id: 'yes_cancer',
        text: 'Yes, for cancer screening/diagnosis/staging',
        result: {
          class: 'Class C',
          rule: 'IVDR Annex VIII, Rule 3(h)',
          description: 'Devices for screening, diagnosis, or staging of cancer are Class C.',
          ruleText: 'Devices intended to be used for the following purposes are classified as class C:\n\n(h) screening for, diagnosis of, or aid in the diagnosis of cancer;',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 3(h)'
        }
      },
      {
        id: 'yes_genetic',
        text: 'Yes, for human genetic testing',
        result: {
          class: 'Class C',
          rule: 'IVDR Annex VIII, Rule 3(i)',
          description: 'Devices for human genetic testing are Class C.',
          ruleText: 'Devices intended to be used for the following purposes are classified as class C:\n\n(i) human genetic testing;',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 3(i)'
        }
      },
      {
        id: 'yes_companion',
        text: 'Yes, used as companion diagnostics',
        result: {
          class: 'Class C',
          rule: 'IVDR Annex VIII, Rule 3(f)',
          description: 'Devices used as companion diagnostics are Class C.',
          ruleText: 'Devices intended to be used for the following purposes are classified as class C:\n\n(f) devices that are companion diagnostics;',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 3(f)'
        }
      },
      {
        id: 'yes_other_rule3',
        text: 'Yes, other Rule 3 conditions apply',
        result: {
          class: 'Class C',
          rule: 'IVDR Annex VIII, Rule 3',
          description: 'Device meets other Class C criteria under Rule 3 (prenatal screening, disease staging, congenital disorders, etc.).',
          ruleText: 'Devices intended to be used for the following purposes are classified as class C:\n\n(c) detecting the presence of an infectious agent with a significant risk that an erroneous result could cause death or severe disability to the individual, foetus or embryo being tested, or to the individual\'s offspring;\n\n(d) pre-natal screening of women in order to determine their immune status towards transmissible agents;\n\n(e) determining infective disease status or immune status, where there is a risk that an erroneous result will lead to a patient management decision resulting in an imminent life-threatening situation for the patient or for the patient\'s offspring;\n\n(g) monitoring of levels of medicinal products, substances or biological components, where there is a risk that an erroneous result will lead to a patient management decision resulting in an imminent life-threatening situation for the patient or for the patient\'s offspring;\n\n(j) pre-natal screening of pregnant women in order to determine the status of the foetus, and in screening of newborn in order to determine congenital disorders, where failure to detect and treat these conditions could lead to an imminent life-threatening situation or severe disability.',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 3'
        }
      },
      {
        id: 'no',
        text: 'No, none of these conditions apply',
        nextQuestionId: 'rule_4_self_testing'
      }
    ]
  },

  rule_4_self_testing: {
    id: 'rule_4_self_testing',
    text: 'Is the device intended for self-testing or near-patient testing?',
    description: 'Rule 4: Self-testing devices are generally Class C, except for pregnancy, fertility, cholesterol, glucose, erythrocytes, leucocytes, and bacteria in urine testing which are Class B.',
    options: [
      {
        id: 'yes_self_class_b',
        text: 'Yes, for pregnancy/fertility/cholesterol/glucose/urine testing',
        result: {
          class: 'Class B',
          rule: 'IVDR Annex VIII, Rule 4(a)',
          description: 'Self-testing devices for pregnancy, fertility, cholesterol, glucose, erythrocytes, leucocytes, and bacteria in urine are Class B.',
          ruleText: 'Devices intended for self-testing are classified as class C, except for devices for the detection of pregnancy, for fertility testing and for determining cholesterol level, and devices for the detection of glucose, erythrocytes, leucocytes and bacteria in urine, which are classified as class B.',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 4(a)'
        }
      },
      {
        id: 'yes_self_other',
        text: 'Yes, for other self-testing applications',
        result: {
          class: 'Class C',
          rule: 'IVDR Annex VIII, Rule 4(a)',
          description: 'Self-testing devices (other than specified low-risk tests) are Class C.',
          ruleText: 'Devices intended for self-testing are classified as class C, except for devices for the detection of pregnancy, for fertility testing and for determining cholesterol level, and devices for the detection of glucose, erythrocytes, leucocytes and bacteria in urine, which are classified as class B.',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 4(a)'
        }
      },
      {
        id: 'yes_near_patient',
        text: 'Yes, for near-patient testing',
        result: {
          class: 'Class B',
          rule: 'IVDR Annex VIII, Rule 4(b)',
          description: 'Near-patient testing devices are classified in their own right (generally Class B unless other rules apply).',
          ruleText: 'Devices intended for near-patient testing are classified in their own right, except for devices intended for self-testing, to which Rule 4(a) applies.',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 4(b)'
        }
      },
      {
        id: 'no',
        text: 'No, not for self-testing or near-patient testing',
        nextQuestionId: 'rule_5_class_a'
      }
    ]
  },

  rule_5_class_a: {
    id: 'rule_5_class_a',
    text: 'Is the device a general laboratory product, instrument, or specimen receptacle?',
    description: 'Rule 5: Class A devices include general laboratory products (buffers, washing solutions, culture media, stains), instruments specifically for IVD procedures, and specimen receptacles.',
    options: [
      {
        id: 'yes_lab_products',
        text: 'Yes, general laboratory products (buffers, media, stains)',
        result: {
          class: 'Class A',
          rule: 'IVDR Annex VIII, Rule 5(a)',
          description: 'General laboratory products (buffers, washing solutions, culture media, stains) are Class A.',
          ruleText: 'The following devices are classified as class A:\n\n(a) products for general laboratory use, buffers, washing solutions, general culture media and histological stains, intended by the manufacturer to make them suitable for in vitro diagnostic procedures relating to a specific examination;',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 5(a)'
        }
      },
      {
        id: 'yes_instruments',
        text: 'Yes, instruments for IVD procedures',
        result: {
          class: 'Class A',
          rule: 'IVDR Annex VIII, Rule 5(b)',
          description: 'Instruments intended specifically for in vitro diagnostic procedures are Class A.',
          ruleText: 'The following devices are classified as class A:\n\n(b) instruments intended by the manufacturer specifically to be used for in vitro diagnostic procedures;',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 5(b)'
        }
      },
      {
        id: 'yes_receptacles',
        text: 'Yes, specimen receptacles',
        result: {
          class: 'Class A',
          rule: 'IVDR Annex VIII, Rule 5(c)',
          description: 'Specimen receptacles are Class A.',
          ruleText: 'The following devices are classified as class A:\n\n(c) specimen receptacles.',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 5(c)'
        }
      },
      {
        id: 'no',
        text: 'No, not covered by Rule 5',
        nextQuestionId: 'rule_6_7_class_b'
      }
    ]
  },

  rule_6_7_class_b: {
    id: 'rule_6_7_class_b',
    text: 'Is the device a control material without quantitative/qualitative assigned values?',
    description: 'Rules 6 & 7: Devices not covered by other rules are Class B (Rule 6). Controls without assigned values are also Class B (Rule 7).',
    options: [
      {
        id: 'yes_controls',
        text: 'Yes, controls without assigned values',
        result: {
          class: 'Class B',
          rule: 'IVDR Annex VIII, Rule 7',
          description: 'Controls without quantitative or qualitative assigned values are Class B.',
          ruleText: 'Controls without a quantitative or qualitative assigned value are classified as class B.',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 7'
        }
      },
      {
        id: 'no_default',
        text: 'No, not controls - default classification',
        result: {
          class: 'Class B',
          rule: 'IVDR Annex VIII, Rule 6',
          description: 'Devices not covered by other classification rules are Class B.',
          ruleText: 'Devices not covered by the classification rules set out in Rules 1 to 5 and in Rule 7 are classified as class B.',
          ruleSource: 'IVDR 2017/746, Annex VIII, Chapter III, Section 2.2, Rule 6'
        }
      }
    ]
  },

  final_classification: {
    id: 'final_classification',
    text: 'IVDR Classification Complete',
    description: 'Based on your answers, we have determined the IVDR classification of your IVD device.',
    options: []
  }
};

// Implementing rules for IVDR
export const implementingRules = {
  rule_1_1: 'Application of the classification rules shall be governed by the intended purpose of the devices.',
  rule_1_2: 'If the device in question is intended to be used in combination with another device, the classification rules shall apply separately to each of the devices.',
  rule_1_3: 'Accessories for an in vitro diagnostic medical device shall be classified in their own right separately from the device with which they are used.',
  rule_1_4: 'Software, which drives a device or influences the use of a device, shall fall within the same class as the device. If the software is independent of any other device, it shall be classified in its own right.',
  rule_1_5: 'Calibrators intended to be used with a device shall be classified in the same class as the device.',
  rule_1_6: 'Control materials with quantitative or qualitative assigned values intended for one specific analyte or multiple analytes shall be classified in the same class as the device.',
  rule_1_7: 'The manufacturer shall take into consideration all classification and implementation rules in order to establish the proper classification for the device.',
  rule_1_8: 'Where a manufacturer states multiple intended purposes for a device, and as a result the device falls into more than one class, it shall be classified in the higher class.',
  rule_1_9: 'If several classification rules apply to the same device, the rule resulting in the higher classification shall apply.',
  rule_1_10: 'Each of the classification rules shall apply to first line assays, confirmatory assays and supplemental assays.'
};