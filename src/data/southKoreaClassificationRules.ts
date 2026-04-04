import { Question } from '@/types/classification';

/**
 * South Korea MFDS Medical Device Classification Rules
 * Based on the Medical Device Act and MFDS Classification Guidelines
 * Reference: MFDS (Ministry of Food and Drug Safety) Medical Device Classification
 */
export const southKoreaClassificationQuestions: Record<string, Question> = {
  initial: {
    id: 'initial',
    text: 'Is this product a medical device under South Korean MFDS regulations?',
    description: 'Medical devices in South Korea are regulated by the Ministry of Food and Drug Safety (MFDS, 식품의약품안전처) under the Medical Device Act. South Korea uses a four-tier classification system (Classes 1-4).',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is a medical device',
        nextQuestionId: 'device_category'
      },
      {
        id: 'no',
        text: 'No, this is not a medical device',
        result: {
          class: 'Not a medical device',
          rule: 'Medical Device Act Article 2',
          description: 'This product does not meet the definition of a medical device (의료기기, uiryo-gigi) under the South Korean Medical Device Act and is therefore not subject to MFDS medical device regulations.',
          ruleText: 'Products that do not meet the definition of medical device under the Medical Device Act Article 2 are not subject to MFDS oversight.',
          ruleSource: 'Medical Device Act (의료기기법), Article 2 - Definitions'
        }
      }
    ]
  },
  device_category: {
    id: 'device_category',
    text: 'What category best describes this device?',
    options: [
      {
        id: 'non_powered_non_invasive',
        text: 'Non-powered, non-invasive',
        nextQuestionId: 'non_invasive_risk'
      },
      {
        id: 'invasive',
        text: 'Invasive device',
        nextQuestionId: 'invasive_duration'
      },
      {
        id: 'active',
        text: 'Active device (powered)',
        nextQuestionId: 'active_type'
      },
      {
        id: 'implantable',
        text: 'Implantable device',
        nextQuestionId: 'implant_criticality'
      }
    ]
  },
  non_invasive_risk: {
    id: 'non_invasive_risk',
    text: 'What is the risk level of the non-invasive device?',
    options: [
      {
        id: 'low',
        text: 'Low risk (external use only)',
        result: {
          class: 'Class 1',
          rule: 'MFDS Classification - Class 1',
          description: 'This device is classified as Class 1 (1등급) under MFDS regulations because it is a non-powered, non-invasive device with low potential risk to the human body. Class 1 devices are subject to notification (신고) only and do not require pre-market approval. Examples include medical furniture, simple diagnostic tools, and external supports.',
          ruleText: 'Class 1 medical devices are those with low potential risk to the human body that do not directly affect the human body or have minimal contact for very short periods.',
          ruleSource: 'Medical Device Act Enforcement Rules, Article 2 - Classification, Class 1'
        }
      },
      {
        id: 'moderate',
        text: 'Moderate risk (contact with broken skin)',
        result: {
          class: 'Class 2',
          rule: 'MFDS Classification - Class 2',
          description: 'This device is classified as Class 2 (2등급) under MFDS regulations because it is a non-invasive device with moderate potential risk, such as contact with broken skin or mucous membranes. Class 2 devices require certification (인증) by a Designated Certification Body. Examples include wound dressings, compression bandages, and diagnostic electrodes.',
          ruleText: 'Class 2 medical devices are those with moderate potential risk to the human body, including devices that contact body surfaces or body orifices for short-term use.',
          ruleSource: 'Medical Device Act Enforcement Rules, Article 2 - Classification, Class 2'
        }
      }
    ]
  },
  invasive_duration: {
    id: 'invasive_duration',
    text: 'What is the intended duration of use?',
    options: [
      {
        id: 'transient',
        text: 'Transient (< 60 minutes)',
        nextQuestionId: 'transient_location'
      },
      {
        id: 'short_term',
        text: 'Short term (60 min - 30 days)',
        nextQuestionId: 'short_term_location'
      },
      {
        id: 'long_term',
        text: 'Long term (> 30 days)',
        result: {
          class: 'Class III',
          rule: 'MFDS Rule 5',
          description: 'Long-term invasive devices are typically Class III'
        }
      }
    ]
  },
  transient_location: {
    id: 'transient_location',
    text: 'Where is the device used?',
    options: [
      {
        id: 'non_critical',
        text: 'Non-critical areas',
        result: {
          class: 'Class I',
          rule: 'MFDS Rule 3',
          description: 'Transient invasive devices in non-critical areas are Class I'
        }
      },
      {
        id: 'critical',
        text: 'Critical areas (circulatory system, CNS)',
        result: {
          class: 'Class III',
          rule: 'MFDS Rule 4',
          description: 'Transient invasive devices in critical areas are Class III'
        }
      }
    ]
  },
  short_term_location: {
    id: 'short_term_location',
    text: 'Where is the device used?',
    options: [
      {
        id: 'non_critical',
        text: 'Non-critical areas',
        result: {
          class: 'Class II',
          rule: 'MFDS Rule 6',
          description: 'Short-term invasive devices in non-critical areas are Class II'
        }
      },
      {
        id: 'critical',
        text: 'Critical areas (circulatory system, CNS)',
        result: {
          class: 'Class III',
          rule: 'MFDS Rule 7',
          description: 'Short-term invasive devices in critical areas are Class III'
        }
      }
    ]
  },
  active_type: {
    id: 'active_type',
    text: 'What type of active device is this?',
    options: [
      {
        id: 'diagnostic',
        text: 'Diagnostic/monitoring',
        result: {
          class: 'Class II',
          rule: 'MFDS Rule 8',
          description: 'Active diagnostic devices are typically Class II'
        }
      },
      {
        id: 'therapeutic_low',
        text: 'Therapeutic (low risk)',
        result: {
          class: 'Class II',
          rule: 'MFDS Rule 9',
          description: 'Low-risk active therapeutic devices are Class II'
        }
      },
      {
        id: 'therapeutic_high',
        text: 'Therapeutic (high risk/life-supporting)',
        result: {
          class: 'Class III',
          rule: 'MFDS Rule 10',
          description: 'High-risk active therapeutic devices are Class III'
        }
      }
    ]
  },
  implant_criticality: {
    id: 'implant_criticality',
    text: 'Is the implantable device life-sustaining or used in critical areas?',
    options: [
      {
        id: 'no',
        text: 'No',
        result: {
          class: 'Class III',
          rule: 'MFDS Rule 11',
          description: 'Standard implantable devices are Class III'
        }
      },
      {
        id: 'yes',
        text: 'Yes (life-sustaining or cardiac/CNS)',
        result: {
          class: 'Class IV',
          rule: 'MFDS Rule 12',
          description: 'Life-sustaining or critical implantable devices are Class IV'
        }
      }
    ]
  }
};
