import { Question } from '@/types/classification';

/**
 * China NMPA Medical Device Classification Rules
 * Based on the Regulations on Supervision and Administration of Medical Devices
 * Reference: NMPA Order No. 739 and Classification Catalogue
 */
export const chinaClassificationQuestions: Record<string, Question> = {
  initial: {
    id: 'initial',
    text: 'Is this product a medical device under Chinese NMPA regulations?',
    description: 'Medical devices in China are regulated by the National Medical Products Administration (NMPA, formerly CFDA) under the Regulations on Supervision and Administration of Medical Devices.',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is a medical device',
        nextQuestionId: 'risk_level'
      },
      {
        id: 'no',
        text: 'No, this is not a medical device',
        result: {
          class: 'Not a medical device',
          rule: 'NMPA Regulations Article 76',
          description: 'This product does not meet the definition of a medical device (医疗器械, yīliáo qìxiè) under Chinese NMPA regulations and is therefore not subject to medical device registration requirements in China.',
          ruleText: 'Products that do not meet the medical device definition under the Regulations on Supervision and Administration of Medical Devices are not subject to NMPA oversight.',
          ruleSource: 'Regulations on Supervision and Administration of Medical Devices (Order No. 739), Article 76 - Definitions'
        }
      }
    ]
  },
  risk_level: {
    id: 'risk_level',
    text: 'What is the primary risk level and intended use?',
    description: 'NMPA uses a three-tier risk-based classification system (Class I, II, III) based on the potential risk to human health.',
    options: [
      {
        id: 'low_risk',
        text: 'Low risk - routine management sufficient',
        nextQuestionId: 'class_i_type'
      },
      {
        id: 'moderate_risk',
        text: 'Moderate risk - controls needed',
        nextQuestionId: 'class_ii_type'
      },
      {
        id: 'high_risk',
        text: 'High risk - special controls needed',
        nextQuestionId: 'class_iii_type'
      }
    ]
  },
  class_i_type: {
    id: 'class_i_type',
    text: 'What type of low-risk device is this?',
    options: [
      {
        id: 'basic',
        text: 'Basic medical equipment (surgical instruments, gauze, bandages)',
        result: {
          class: 'Class I',
          rule: 'NMPA Classification - Low Risk',
          description: 'This device is classified as Class I (第一类医疗器械) under NMPA regulations because it presents low potential risk to human health and can be managed through routine safety controls. Class I devices are subject to filing (备案, bèi\'àn) with local municipal drug administrations rather than registration. Examples include basic surgical instruments, gauze, bandages, and tongue depressors.',
          ruleText: 'Class I medical devices are those with low risk that can be ensured safe and effective through routine management.',
          ruleSource: 'Regulations on Supervision and Administration of Medical Devices (Order No. 739), Article 6, Class I'
        }
      },
      {
        id: 'non_contact',
        text: 'Non-invasive devices with no body contact',
        result: {
          class: 'Class I',
          rule: 'NMPA Classification - Non-Contact Devices',
          description: 'This device is classified as Class I (第一类医疗器械) under NMPA regulations because it is a non-invasive device with no direct body contact, presenting minimal risk to human health. Filing with local drug administrations is required, but no pre-market technical review is necessary.',
          ruleText: 'Non-invasive devices with no body contact and minimal risk are classified as Class I.',
          ruleSource: 'Regulations on Supervision and Administration of Medical Devices (Order No. 739), Article 6, Class I'
        }
      }
    ]
  },
  class_ii_type: {
    id: 'class_ii_type',
    text: 'What type of moderate-risk device is this?',
    options: [
      {
        id: 'invasive_transient',
        text: 'Invasive devices with short-term use',
        result: {
          class: 'Class II',
          rule: 'NMPA Rule 3',
          description: 'Moderate-risk invasive devices with transient or short-term use requiring product registration'
        }
      },
      {
        id: 'active_diagnostic',
        text: 'Active diagnostic or monitoring devices',
        result: {
          class: 'Class II',
          rule: 'NMPA Rule 4',
          description: 'Active devices for diagnosis or monitoring with moderate risk'
        }
      },
      {
        id: 'surface_contact',
        text: 'Devices with body surface or cavity contact',
        result: {
          class: 'Class II',
          rule: 'NMPA Rule 5',
          description: 'Devices with body contact requiring moderate controls'
        }
      }
    ]
  },
  class_iii_type: {
    id: 'class_iii_type',
    text: 'What type of high-risk device is this?',
    options: [
      {
        id: 'implantable',
        text: 'Implantable devices',
        result: {
          class: 'Class III',
          rule: 'NMPA Rule 6',
          description: 'Implantable devices requiring highest level of regulatory control and clinical evaluation'
        }
      },
      {
        id: 'life_support',
        text: 'Life-supporting or life-sustaining devices',
        result: {
          class: 'Class III',
          rule: 'NMPA Rule 7',
          description: 'Life-supporting devices with highest risk requiring special controls and clinical data'
        }
      },
      {
        id: 'critical_use',
        text: 'Devices used in critical situations or with vital organs',
        result: {
          class: 'Class III',
          rule: 'NMPA Rule 8',
          description: 'Devices for critical applications with high risk to patient safety'
        }
      },
      {
        id: 'drug_delivery',
        text: 'Drug delivery or biological material contact',
        result: {
          class: 'Class III',
          rule: 'NMPA Rule 9',
          description: 'Devices administering drugs or contacting biological materials with high risk'
        }
      }
    ]
  }
};
