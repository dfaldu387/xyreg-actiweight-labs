import { Question } from '@/types/classification';

/**
 * India CDSCO Medical Device Classification Rules
 * Based on the Medical Devices Rules, 2017 (as amended)
 * Reference: Central Drugs Standard Control Organisation (CDSCO) Guidelines
 */
export const indiaClassificationQuestions: Record<string, Question> = {
  initial: {
    id: 'initial',
    text: 'Is this product a medical device under Indian CDSCO regulations?',
    description: 'Medical devices in India are regulated by the Central Drugs Standard Control Organisation (CDSCO) under the Medical Devices Rules, 2017. India uses a four-tier classification system (Classes A, B, C, D) aligned with the GHTF/IMDRF framework.',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is a medical device',
        nextQuestionId: 'device_type'
      },
      {
        id: 'no',
        text: 'No, this is not a medical device',
        result: {
          class: 'Not a medical device',
          rule: 'Medical Devices Rules 2017',
          description: 'This product does not meet the definition of a medical device under the Indian Medical Devices Rules, 2017 and is therefore not subject to CDSCO registration requirements.',
          ruleText: 'Products that do not meet the definition of medical device under Rule 2(b) of the Medical Devices Rules, 2017 are not subject to CDSCO regulatory oversight.',
          ruleSource: 'Medical Devices Rules, 2017, Rule 2(b) - Definitions'
        }
      }
    ]
  },
  device_type: {
    id: 'device_type',
    text: 'What is the primary nature of this device?',
    description: 'CDSCO classifies devices based on risk and intended use, following GHTF principles.',
    options: [
      {
        id: 'non_invasive',
        text: 'Non-invasive device',
        nextQuestionId: 'non_invasive_type'
      },
      {
        id: 'invasive',
        text: 'Invasive device',
        nextQuestionId: 'invasive_duration'
      },
      {
        id: 'active',
        text: 'Active device (electrically powered)',
        nextQuestionId: 'active_type'
      },
      {
        id: 'ivd',
        text: 'In-vitro diagnostic (IVD) device',
        nextQuestionId: 'ivd_type'
      }
    ]
  },
  non_invasive_type: {
    id: 'non_invasive_type',
    text: 'What type of non-invasive device is this?',
    options: [
      {
        id: 'no_contact',
        text: 'No direct patient contact (e.g., hospital furniture, transport equipment)',
        result: {
          class: 'Class A',
          rule: 'CDSCO Medical Devices Rules 2017 - Rule 1',
          description: 'This device is classified as Class A under the Medical Devices Rules, 2017 because it is a low-risk non-invasive device with no direct patient contact. Class A devices are subject to basic regulatory compliance with manufacturer registration and listing. Examples include hospital beds, wheelchairs, and specimen transport containers.',
          ruleText: 'Non-invasive devices which do not touch the patient or contact only intact skin are classified as Class A (low risk).',
          ruleSource: 'Medical Devices Rules, 2017, First Schedule - Classification Rules, Class A'
        }
      },
      {
        id: 'skin_contact',
        text: 'Contacts intact skin only (e.g., electrodes, compression bandages)',
        result: {
          class: 'Class A',
          rule: 'CDSCO Medical Devices Rules 2017 - Rule 2',
          description: 'This device is classified as Class A under the Medical Devices Rules, 2017 because it is a non-invasive device that contacts only intact skin under normal conditions. The low-risk profile requires basic regulatory compliance without extensive pre-market review.',
          ruleText: 'Non-invasive devices contacting intact skin with minimal risk are classified as Class A.',
          ruleSource: 'Medical Devices Rules, 2017, First Schedule - Classification Rules, Class A'
        }
      },
      {
        id: 'channeling',
        text: 'Channels or stores fluids/tissues for later use (e.g., blood bags, syringes)',
        nextQuestionId: 'channeling_risk'
      },
      {
        id: 'modifying',
        text: 'Modifies biological/chemical composition of fluids (e.g., dialysis equipment)',
        result: {
          class: 'Class C',
          rule: 'CDSCO Medical Devices Rules 2017 - Rule 4',
          description: 'This device is classified as Class C under the Medical Devices Rules, 2017 because it is a non-invasive device that modifies the biological or chemical composition of blood, body liquids, or other liquids intended for infusion. The modification function presents moderate-to-high risk requiring comprehensive conformity assessment. Examples include dialysis equipment and blood filters.',
          ruleText: 'Non-invasive devices that modify the biological or chemical composition of blood, body liquids, or other liquids intended for infusion are classified as Class C.',
          ruleSource: 'Medical Devices Rules, 2017, First Schedule - Classification Rules, Class C'
        }
      }
    ]
  },
  channeling_risk: {
    id: 'channeling_risk',
    text: 'What is the risk level of the channeling/storage function?',
    options: [
      {
        id: 'basic_storage',
        text: 'Basic storage or gravity-fed administration',
        result: {
          class: 'Class A',
          rule: 'CDSCO Rule 3a',
          description: 'Basic non-invasive storage devices with low risk.'
        }
      },
      {
        id: 'transfusion',
        text: 'Blood transfusion or biological fluid administration',
        result: {
          class: 'Class B',
          rule: 'CDSCO Rule 3b',
          description: 'Devices for blood/biological fluid administration require moderate controls.'
        }
      },
      {
        id: 'infusion',
        text: 'Active infusion with potential for error',
        result: {
          class: 'Class C',
          rule: 'CDSCO Rule 3c',
          description: 'Active infusion devices with higher risk require moderate-high controls.'
        }
      }
    ]
  },
  invasive_duration: {
    id: 'invasive_duration',
    text: 'What is the duration of invasive use?',
    description: 'Transient: <60 minutes, Short-term: <30 days, Long-term: >30 days',
    options: [
      {
        id: 'transient',
        text: 'Transient use (less than 60 minutes)',
        nextQuestionId: 'invasive_transient'
      },
      {
        id: 'short_term',
        text: 'Short-term use (less than 30 days)',
        nextQuestionId: 'invasive_short'
      },
      {
        id: 'long_term',
        text: 'Long-term use (more than 30 days) or implantable',
        nextQuestionId: 'invasive_long'
      }
    ]
  },
  invasive_transient: {
    id: 'invasive_transient',
    text: 'Where is the transient invasive device used?',
    options: [
      {
        id: 'oral_cavity',
        text: 'Oral cavity, ear canal, or nasal cavity',
        result: {
          class: 'Class A',
          rule: 'CDSCO Rule 5a',
          description: 'Transient invasive devices for oral/ear/nasal cavity with low risk.'
        }
      },
      {
        id: 'surgically_invasive',
        text: 'Surgically invasive (not oral/ear/nasal)',
        result: {
          class: 'Class B',
          rule: 'CDSCO Rule 5b',
          description: 'Transient surgically invasive devices require moderate controls.'
        }
      },
      {
        id: 'central_nervous',
        text: 'Central nervous system or central circulatory system',
        result: {
          class: 'Class D',
          rule: 'CDSCO Rule 5c',
          description: 'Devices accessing CNS or central circulation require highest controls.'
        }
      }
    ]
  },
  invasive_short: {
    id: 'invasive_short',
    text: 'What is the application of this short-term invasive device?',
    options: [
      {
        id: 'body_orifice',
        text: 'Natural body orifice (non-surgical)',
        result: {
          class: 'Class B',
          rule: 'CDSCO Rule 6a',
          description: 'Short-term invasive devices for natural orifices require moderate controls.'
        }
      },
      {
        id: 'surgically_invasive',
        text: 'Surgically invasive device',
        result: {
          class: 'Class C',
          rule: 'CDSCO Rule 6b',
          description: 'Short-term surgically invasive devices require moderate-high controls.'
        }
      },
      {
        id: 'heart_central',
        text: 'Heart or central circulatory system',
        result: {
          class: 'Class D',
          rule: 'CDSCO Rule 6c',
          description: 'Devices accessing heart or central circulation require highest controls.'
        }
      }
    ]
  },
  invasive_long: {
    id: 'invasive_long',
    text: 'What type of long-term/implantable device is this?',
    options: [
      {
        id: 'general_implant',
        text: 'General implantable device',
        result: {
          class: 'Class C',
          rule: 'CDSCO Rule 7a',
          description: 'Long-term implantable devices require moderate-high controls.'
        }
      },
      {
        id: 'heart_implant',
        text: 'Implant in heart or central circulatory system',
        result: {
          class: 'Class D',
          rule: 'CDSCO Rule 7b',
          description: 'Cardiac or vascular implants require highest controls and clinical evidence.'
        }
      },
      {
        id: 'biological_effect',
        text: 'Implant with biological effect or drug delivery',
        result: {
          class: 'Class D',
          rule: 'CDSCO Rule 7c',
          description: 'Implants with biological effects or drug delivery require highest controls.'
        }
      },
      {
        id: 'total_joint',
        text: 'Total or partial joint replacement',
        result: {
          class: 'Class D',
          rule: 'CDSCO Rule 7d',
          description: 'Joint replacement devices require highest controls and clinical evidence.'
        }
      }
    ]
  },
  active_type: {
    id: 'active_type',
    text: 'What is the function of this active device?',
    options: [
      {
        id: 'therapeutic',
        text: 'Therapeutic - delivers or exchanges energy',
        nextQuestionId: 'active_therapeutic'
      },
      {
        id: 'diagnostic',
        text: 'Diagnostic - imaging or monitoring',
        nextQuestionId: 'active_diagnostic'
      },
      {
        id: 'controlling',
        text: 'Controls or monitors another device',
        result: {
          class: 'Class B',
          rule: 'CDSCO Rule 10',
          description: 'Active devices that control other devices require moderate controls.'
        }
      },
      {
        id: 'administering',
        text: 'Administers or removes substances',
        result: {
          class: 'Class C',
          rule: 'CDSCO Rule 11',
          description: 'Active devices administering substances require moderate-high controls.'
        }
      }
    ]
  },
  active_therapeutic: {
    id: 'active_therapeutic',
    text: 'What is the risk level of the energy delivered?',
    options: [
      {
        id: 'low_energy',
        text: 'Low energy - not potentially hazardous (e.g., muscle stimulator)',
        result: {
          class: 'Class B',
          rule: 'CDSCO Rule 8a',
          description: 'Active therapeutic devices with low energy require moderate controls.'
        }
      },
      {
        id: 'ionizing',
        text: 'Ionizing radiation (e.g., X-ray, radiotherapy)',
        result: {
          class: 'Class C',
          rule: 'CDSCO Rule 8b',
          description: 'Devices using ionizing radiation require moderate-high controls.'
        }
      },
      {
        id: 'high_energy',
        text: 'High energy - potentially hazardous (e.g., defibrillator, surgical laser)',
        result: {
          class: 'Class C',
          rule: 'CDSCO Rule 8c',
          description: 'High-energy therapeutic devices require moderate-high controls.'
        }
      },
      {
        id: 'life_sustaining',
        text: 'Life-sustaining or life-supporting',
        result: {
          class: 'Class D',
          rule: 'CDSCO Rule 8d',
          description: 'Life-sustaining active devices require highest controls.'
        }
      }
    ]
  },
  active_diagnostic: {
    id: 'active_diagnostic',
    text: 'What type of active diagnostic device is this?',
    options: [
      {
        id: 'general_imaging',
        text: 'General imaging or monitoring (e.g., ultrasound, ECG)',
        result: {
          class: 'Class B',
          rule: 'CDSCO Rule 9a',
          description: 'General diagnostic imaging devices require moderate controls.'
        }
      },
      {
        id: 'ionizing_diagnostic',
        text: 'Uses ionizing radiation for diagnosis',
        result: {
          class: 'Class C',
          rule: 'CDSCO Rule 9b',
          description: 'Diagnostic devices using ionizing radiation require moderate-high controls.'
        }
      },
      {
        id: 'vital_monitoring',
        text: 'Monitors vital physiological parameters (failure could be life-threatening)',
        result: {
          class: 'Class C',
          rule: 'CDSCO Rule 9c',
          description: 'Critical vital signs monitoring requires moderate-high controls.'
        }
      }
    ]
  },
  ivd_type: {
    id: 'ivd_type',
    text: 'What type of in-vitro diagnostic device is this?',
    options: [
      {
        id: 'general_lab',
        text: 'General laboratory use (e.g., clinical chemistry, urinalysis)',
        result: {
          class: 'Class A',
          rule: 'CDSCO IVD Rule 1',
          description: 'General purpose IVD devices with low risk.'
        }
      },
      {
        id: 'self_testing',
        text: 'Self-testing devices (e.g., pregnancy tests, glucose monitors)',
        result: {
          class: 'Class B',
          rule: 'CDSCO IVD Rule 2',
          description: 'Self-testing IVD devices require moderate controls.'
        }
      },
      {
        id: 'blood_grouping',
        text: 'Blood grouping, tissue typing, or cancer markers',
        result: {
          class: 'Class C',
          rule: 'CDSCO IVD Rule 3',
          description: 'Critical IVD devices for blood grouping/cancer require moderate-high controls.'
        }
      },
      {
        id: 'blood_screening',
        text: 'Blood screening for transfusion (HIV, Hepatitis, etc.)',
        result: {
          class: 'Class D',
          rule: 'CDSCO IVD Rule 4',
          description: 'Blood screening IVD devices require highest controls due to transfusion risk.'
        }
      }
    ]
  }
};
