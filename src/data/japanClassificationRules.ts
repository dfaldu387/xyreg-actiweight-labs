import { Question } from '@/types/classification';

/**
 * Japan PMDA Medical Device Classification Rules
 * Based on the Pharmaceutical and Medical Device Act (PMD Act)
 * Reference: PMDA Classification Guidelines for Medical Devices
 */
export const japanClassificationQuestions: Record<string, Question> = {
  initial: {
    id: 'initial',
    text: 'Is this product a medical device under Japanese PMDA regulations?',
    description: 'Medical devices in Japan are regulated under the Pharmaceutical and Medical Device Act (PMD Act, formerly known as the Pharmaceutical Affairs Law). The PMDA (Pharmaceuticals and Medical Devices Agency) oversees device classification and approval.',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is a medical device',
        nextQuestionId: 'invasiveness'
      },
      {
        id: 'no',
        text: 'No, this is not a medical device',
        result: {
          class: 'Not a medical device',
          rule: 'PMD Act Article 2',
          description: 'This product does not meet the definition of a medical device (医療機器, iryou-kiki) under the Japanese Pharmaceutical and Medical Device Act and is therefore not subject to PMDA medical device regulations.',
          ruleText: 'Products that do not meet the definition of medical device under PMD Act Article 2 are not subject to PMDA regulatory oversight.',
          ruleSource: 'Pharmaceutical and Medical Device Act (PMD Act), Article 2 - Definitions'
        }
      }
    ]
  },
  invasiveness: {
    id: 'invasiveness',
    text: 'Does the device come into contact with the body?',
    options: [
      {
        id: 'non_contact',
        text: 'No body contact (external use only)',
        nextQuestionId: 'non_contact_risk'
      },
      {
        id: 'surface_contact',
        text: 'Surface contact only',
        nextQuestionId: 'surface_duration'
      },
      {
        id: 'invasive',
        text: 'Invasive (penetrates body)',
        nextQuestionId: 'invasive_type'
      }
    ]
  },
  non_contact_risk: {
    id: 'non_contact_risk',
    text: 'Does the device pose significant risk?',
    options: [
      {
        id: 'low_risk',
        text: 'Low risk',
        result: {
          class: 'Class I',
          rule: 'PMDA General Medical Devices',
          description: 'This device is classified as Class I (一般医療機器, Ippan Iryou-kiki) under the PMD Act because it is a non-contact device with low potential risk to human health. Class I devices are subject to manufacturer notification only and do not require pre-market approval. Examples include medical furniture, specimen containers, and basic diagnostic accessories.',
          ruleText: 'Non-contact medical devices with minimal risk to patients are classified as Class I (General Medical Devices) requiring manufacturer notification only.',
          ruleSource: 'PMD Act Enforcement Order, Article 80 - Classification of Medical Devices, Class I'
        }
      },
      {
        id: 'moderate_risk',
        text: 'Moderate risk',
        result: {
          class: 'Class II',
          rule: 'PMDA Controlled Medical Devices',
          description: 'This device is classified as Class II (管理医療機器, Kanri Iryou-kiki) under the PMD Act because it is a non-contact device with moderate potential risk to human health. Class II devices require third-party certification by a Registered Certification Body (RCB). Examples include X-ray film, magnetic resonance imaging coils, and powered examination tables.',
          ruleText: 'Non-contact medical devices with moderate risk are classified as Class II (Controlled Medical Devices) requiring third-party certification.',
          ruleSource: 'PMD Act Enforcement Order, Article 80 - Classification of Medical Devices, Class II'
        }
      }
    ]
  },
  surface_duration: {
    id: 'surface_duration',
    text: 'What is the duration of contact?',
    options: [
      {
        id: 'transient',
        text: 'Transient (< 60 minutes)',
        result: {
          class: 'Class I',
          rule: 'Rule 1',
          description: 'Transient surface contact devices are typically Class I'
        }
      },
      {
        id: 'short_term',
        text: 'Short term (60 min - 24 hours)',
        result: {
          class: 'Class II',
          rule: 'Rule 2',
          description: 'Short-term surface contact devices are typically Class II'
        }
      },
      {
        id: 'long_term',
        text: 'Long term (> 24 hours)',
        nextQuestionId: 'long_term_risk'
      }
    ]
  },
  long_term_risk: {
    id: 'long_term_risk',
    text: 'Does the device pose high risk to critical areas?',
    options: [
      {
        id: 'no',
        text: 'No',
        result: {
          class: 'Class II',
          rule: 'Rule 3',
          description: 'Long-term surface contact devices with moderate risk are Class II'
        }
      },
      {
        id: 'yes',
        text: 'Yes',
        result: {
          class: 'Class III',
          rule: 'Rule 4',
          description: 'Long-term surface contact devices with high risk are Class III'
        }
      }
    ]
  },
  invasive_type: {
    id: 'invasive_type',
    text: 'What type of invasive device is this?',
    options: [
      {
        id: 'surgically_invasive',
        text: 'Surgically invasive',
        nextQuestionId: 'surgical_duration'
      },
      {
        id: 'implantable',
        text: 'Implantable',
        nextQuestionId: 'implant_location'
      },
      {
        id: 'body_orifice',
        text: 'Body orifice device',
        result: {
          class: 'Class II',
          rule: 'Rule 6',
          description: 'Body orifice devices are typically Class II'
        }
      }
    ]
  },
  surgical_duration: {
    id: 'surgical_duration',
    text: 'What is the intended duration of use?',
    options: [
      {
        id: 'transient',
        text: 'Transient use (< 60 minutes)',
        result: {
          class: 'Class II',
          rule: 'Rule 7',
          description: 'Transient surgically invasive devices are Class II'
        }
      },
      {
        id: 'short_long',
        text: 'Short or long term',
        nextQuestionId: 'surgical_critical'
      }
    ]
  },
  surgical_critical: {
    id: 'surgical_critical',
    text: 'Is the device used in critical areas (heart, CNS, central circulatory system)?',
    options: [
      {
        id: 'no',
        text: 'No',
        result: {
          class: 'Class II',
          rule: 'Rule 8',
          description: 'Surgically invasive devices not in critical areas are Class II'
        }
      },
      {
        id: 'yes',
        text: 'Yes',
        result: {
          class: 'Class III',
          rule: 'Rule 9',
          description: 'Surgically invasive devices in critical areas are Class III'
        }
      }
    ]
  },
  implant_location: {
    id: 'implant_location',
    text: 'Where is the device implanted?',
    options: [
      {
        id: 'non_critical',
        text: 'Non-critical areas',
        result: {
          class: 'Class III',
          rule: 'Rule 10',
          description: 'Implantable devices are typically Class III'
        }
      },
      {
        id: 'critical',
        text: 'Critical areas (heart, CNS)',
        result: {
          class: 'Class IV',
          rule: 'Rule 11',
          description: 'Implantable devices in critical areas are Class IV'
        }
      },
      {
        id: 'life_sustaining',
        text: 'Life-sustaining or life-supporting',
        result: {
          class: 'Class IV',
          rule: 'Rule 12',
          description: 'Life-sustaining implantable devices are Class IV'
        }
      }
    ]
  }
};
