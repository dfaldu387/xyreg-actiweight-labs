import { Question } from '@/types/classification';

/**
 * Brazil ANVISA Medical Device Classification Rules
 * Based on RDC 185/2001 and subsequent amendments
 * Reference: ANVISA Resolução RDC Nº 185/2001
 */
export const brazilClassificationQuestions: Record<string, Question> = {
  initial: {
    id: 'initial',
    text: 'Is this product a medical device under Brazilian ANVISA regulations?',
    description: 'Medical devices in Brazil are regulated by ANVISA (National Health Surveillance Agency) under RDC 185/2001 and related resolutions.',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is a medical device',
        nextQuestionId: 'risk_assessment'
      },
      {
        id: 'no',
        text: 'No, this is not a medical device',
        result: {
          class: 'Not a medical device',
          rule: 'ANVISA RDC 185/2001',
          description: 'This product does not meet the definition of a medical device (produto para saúde) under Brazilian ANVISA regulations and is therefore not subject to medical device registration requirements.',
          ruleText: 'Products that do not meet the definition of medical device under RDC 185/2001 Article 2 are not subject to ANVISA medical device regulations.',
          ruleSource: 'ANVISA RDC 185/2001, Article 2 - Definitions'
        }
      }
    ]
  },
  risk_assessment: {
    id: 'risk_assessment',
    text: 'What is the primary risk level of the device?',
    description: 'ANVISA classifies devices into four risk classes (I-IV) based on inherent risk to patient and user safety.',
    options: [
      {
        id: 'minimal',
        text: 'Minimal risk',
        nextQuestionId: 'class_i_confirm'
      },
      {
        id: 'low',
        text: 'Low risk',
        nextQuestionId: 'class_ii_type'
      },
      {
        id: 'moderate',
        text: 'Moderate risk',
        nextQuestionId: 'class_iii_type'
      },
      {
        id: 'high',
        text: 'High risk',
        nextQuestionId: 'class_iv_type'
      }
    ]
  },
  class_i_confirm: {
    id: 'class_i_confirm',
    text: 'Does the device have non-invasive, external use with minimal risk?',
    options: [
      {
        id: 'yes',
        text: 'Yes',
        result: {
          class: 'Class I',
          rule: 'ANVISA RDC 185/2001 - Rule 1',
          description: 'This device is classified as Class I (Classe I) under ANVISA RDC 185/2001 because it is a non-invasive device with minimal risk to patient and user safety. Class I devices are subject to simplified registration (cadastro) rather than full registration (registro). Examples include non-sterile wound dressings, wheelchairs, and basic diagnostic instruments.',
          ruleText: 'Class I devices are those that present minimal risk to the user and patient, typically non-invasive devices for external use that do not contact injured tissue.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class I'
        }
      },
      {
        id: 'no',
        text: 'No',
        nextQuestionId: 'risk_assessment'
      }
    ]
  },
  class_ii_type: {
    id: 'class_ii_type',
    text: 'What type of Class II device is this?',
    options: [
      {
        id: 'non_invasive',
        text: 'Non-invasive with low risk',
        result: {
          class: 'Class II',
          rule: 'ANVISA RDC 185/2001 - Rule 2',
          description: 'This device is classified as Class II (Classe II) under ANVISA RDC 185/2001 because it is a non-invasive device with low risk that may contact injured skin, mucous membranes, or channel body fluids. Class II devices require standard registration (registro) with ANVISA. Examples include electrodes, hypodermic needles, and basic surgical instruments.',
          ruleText: 'Class II devices are those that present low risk, including non-invasive devices that may contact injured skin or mucous membranes, and devices for channeling or storing body fluids for subsequent use.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class II'
        }
      },
      {
        id: 'short_term_invasive',
        text: 'Short-term invasive (< 24 hours)',
        result: {
          class: 'Class II',
          rule: 'ANVISA RDC 185/2001 - Rule 3',
          description: 'This device is classified as Class II (Classe II) under ANVISA RDC 185/2001 because it is an invasive device intended for transient or short-term use (less than 24 hours continuous use). The brief duration of contact limits the risk profile. Requires standard ANVISA registration.',
          ruleText: 'Short-term invasive devices that do not contact critical organ systems are classified as Class II when the duration of use is less than 24 hours.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class II'
        }
      }
    ]
  },
  class_iii_type: {
    id: 'class_iii_type',
    text: 'What type of Class III device is this?',
    options: [
      {
        id: 'long_term_contact',
        text: 'Long-term contact (> 24 hours)',
        result: {
          class: 'Class III',
          rule: 'ANVISA RDC 185/2001 - Rule 4',
          description: 'This device is classified as Class III (Classe III) under ANVISA RDC 185/2001 because it is an invasive device intended for long-term use (more than 24 hours continuous contact) or semi-implantable. The extended duration of contact increases the risk profile, requiring more rigorous conformity assessment and clinical evidence. Examples include long-term catheters and certain wound management devices.',
          ruleText: 'Long-term invasive devices with continuous use exceeding 24 hours, or semi-implantable devices, are classified as Class III due to increased risk from prolonged tissue contact.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class III'
        }
      },
      {
        id: 'active_therapeutic',
        text: 'Active therapeutic device',
        result: {
          class: 'Class III',
          rule: 'ANVISA RDC 185/2001 - Rule 5',
          description: 'This device is classified as Class III (Classe III) under ANVISA RDC 185/2001 because it is an active therapeutic device that delivers or exchanges energy to/from the patient in a potentially hazardous manner. The active nature and therapeutic purpose require enhanced safety controls and clinical validation. Examples include surgical lasers and electrosurgical units.',
          ruleText: 'Active devices intended for therapeutic purposes that deliver energy to the patient in a potentially hazardous manner are classified as Class III.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class III'
        }
      },
      {
        id: 'drug_delivery',
        text: 'Drug delivery device',
        result: {
          class: 'Class III',
          rule: 'ANVISA RDC 185/2001 - Rule 6',
          description: 'This device is classified as Class III (Classe III) under ANVISA RDC 185/2001 because it is intended for administering medicinal products where dosing accuracy is critical or errors could result in patient harm. The drug-device combination increases the regulatory complexity and requires coordination with pharmaceutical regulations. Examples include infusion pumps and drug-coated devices.',
          ruleText: 'Devices intended for administering medicinal products where the manner of administration may present risk are classified as Class III.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class III'
        }
      }
    ]
  },
  class_iv_type: {
    id: 'class_iv_type',
    text: 'What type of Class IV device is this?',
    options: [
      {
        id: 'implantable',
        text: 'Implantable device',
        result: {
          class: 'Class IV',
          rule: 'ANVISA RDC 185/2001 - Rule 7',
          description: 'This device is classified as Class IV (Classe IV) under ANVISA RDC 185/2001 because it is an implantable device intended to remain wholly or partially in the body, or a device that contacts the heart, central circulatory system, or central nervous system. This highest-risk classification requires comprehensive clinical evidence, full quality management system certification, and may require clinical trials in Brazil. Examples include cardiac implants, vascular stents, and orthopedic implants.',
          ruleText: 'Implantable devices and devices in contact with the heart, central circulatory system, or central nervous system are classified as Class IV as the highest risk category.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class IV'
        }
      },
      {
        id: 'life_support',
        text: 'Life-supporting device',
        result: {
          class: 'Class IV',
          rule: 'ANVISA RDC 185/2001 - Rule 8',
          description: 'This device is classified as Class IV (Classe IV) under ANVISA RDC 185/2001 because it is intended to support or sustain life, where failure could result in immediate death or serious injury. Life-supporting devices require the highest level of regulatory scrutiny, including fail-safe design requirements, redundancy systems, and comprehensive post-market surveillance. Examples include ventilators, heart-lung machines, and defibrillators.',
          ruleText: 'Devices intended to support or sustain life, where failure could result in death or serious harm, are classified as Class IV.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class IV'
        }
      },
      {
        id: 'active_critical',
        text: 'Active device for critical diagnosis/monitoring',
        result: {
          class: 'Class IV',
          rule: 'ANVISA RDC 185/2001 - Rule 9',
          description: 'This device is classified as Class IV (Classe IV) under ANVISA RDC 185/2001 because it is an active device for diagnosis or monitoring of vital physiological functions in critical care settings where failure to accurately diagnose or detect could result in immediate danger to the patient. Examples include patient monitors for intensive care and critical diagnostic imaging equipment.',
          ruleText: 'Active devices for critical diagnosis or monitoring where failure could result in immediate danger are classified as Class IV.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II - Classification Rules, Class IV'
        }
      }
    ]
  }
};
