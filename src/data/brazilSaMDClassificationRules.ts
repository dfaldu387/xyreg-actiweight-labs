import { Question } from '@/types/classification';

/**
 * ANVISA (Brazil) Software as a Medical Device Classification Decision Tree
 * Based on ANVISA RDC 185/2001 and IN 77/2020 for software classification
 * Reference: Brazilian Health Regulatory Agency (ANVISA)
 * Risk classes: I, II, III, IV (IV being highest risk)
 */
export const brazilSaMDClassificationQuestions: Record<string, Question> = {
  br_samd_initial: {
    id: 'br_samd_initial',
    text: 'What is the primary intended purpose of your software?',
    description: 'ANVISA classifies software medical devices based on intended purpose and risk to patients.',
    helpText: 'Consider the main function of your software and how it impacts patient care.',
    options: [
      {
        id: 'diagnostic',
        text: 'Diagnosis of diseases or health conditions',
        helpText: 'Software that diagnoses, screens, or detects medical conditions',
        nextQuestionId: 'br_diagnostic_risk'
      },
      {
        id: 'therapeutic',
        text: 'Treatment decisions or therapy management',
        helpText: 'Software that influences treatment or therapeutic decisions',
        nextQuestionId: 'br_therapeutic_risk'
      },
      {
        id: 'monitoring',
        text: 'Patient monitoring or vital signs tracking',
        helpText: 'Software that monitors physiological parameters',
        nextQuestionId: 'br_monitoring_risk'
      },
      {
        id: 'administrative',
        text: 'Clinical decision support or information management',
        helpText: 'Software that supports clinical workflows or displays health information',
        nextQuestionId: 'br_support_risk'
      }
    ]
  },

  br_diagnostic_risk: {
    id: 'br_diagnostic_risk',
    text: 'What is the potential risk level of incorrect diagnosis?',
    description: 'Consider the consequences if the software provides incorrect diagnostic information.',
    options: [
      {
        id: 'life_threatening',
        text: 'Life-threatening conditions (cancer, cardiac, neurological)',
        helpText: 'Diagnosis of conditions where missed detection could result in death',
        result: {
          class: 'Class IV',
          rule: 'ANVISA RDC 185/2001 - High Risk Diagnostic Software',
          description: 'This software is classified as Class IV under ANVISA regulations because it provides diagnostic information for life-threatening conditions. Requires ANVISA registration, Good Manufacturing Practices (BPF) certification, clinical evidence, and Brazilian Representative (BRH).',
          ruleText: 'Software intended for diagnosis of life-threatening conditions is classified as Class IV.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11 - Software Medical Devices'
        }
      },
      {
        id: 'serious',
        text: 'Serious conditions requiring prompt treatment',
        helpText: 'Diagnosis of conditions that could cause significant harm if untreated',
        result: {
          class: 'Class III',
          rule: 'ANVISA RDC 185/2001 - Serious Risk Diagnostic Software',
          description: 'This software is classified as Class III under ANVISA regulations because it provides diagnostic information for serious health conditions. Requires ANVISA registration, quality management system, and clinical evidence.',
          ruleText: 'Software intended for diagnosis of serious conditions is classified as Class III.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'moderate',
        text: 'Moderate conditions - not immediately dangerous',
        helpText: 'Diagnosis of conditions that require treatment but are not immediately harmful',
        result: {
          class: 'Class II',
          rule: 'ANVISA RDC 185/2001 - Moderate Risk Diagnostic Software',
          description: 'This software is classified as Class II under ANVISA regulations because it provides diagnostic information for moderate-risk conditions. Requires ANVISA notification and quality management system.',
          ruleText: 'Software for diagnosis of moderate-risk conditions is classified as Class II.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'low',
        text: 'Low-risk screening or preliminary assessment',
        helpText: 'Results require confirmation; not used for critical decisions alone',
        result: {
          class: 'Class I',
          rule: 'ANVISA RDC 185/2001 - Low Risk Software',
          description: 'This software is classified as Class I under ANVISA regulations because it provides only preliminary diagnostic information that requires confirmation. Basic registration requirements apply.',
          ruleText: 'Software for preliminary assessment or screening is classified as Class I.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      }
    ]
  },

  br_therapeutic_risk: {
    id: 'br_therapeutic_risk',
    text: 'What type of therapeutic influence does the software have?',
    description: 'Consider how the software affects treatment decisions.',
    options: [
      {
        id: 'direct_control',
        text: 'Direct control of therapy or drug dosing',
        helpText: 'Software that directly controls or calculates therapeutic interventions',
        result: {
          class: 'Class IV',
          rule: 'ANVISA RDC 185/2001 - High Risk Therapeutic Software',
          description: 'This software is classified as Class IV under ANVISA regulations because it directly controls therapeutic delivery. Requires full ANVISA registration with clinical evidence.',
          ruleText: 'Software with direct therapeutic control is classified as Class IV.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'treatment_planning',
        text: 'Treatment planning or surgical guidance',
        helpText: 'Software that assists in planning treatments or procedures',
        result: {
          class: 'Class III',
          rule: 'ANVISA RDC 185/2001 - Treatment Planning Software',
          description: 'This software is classified as Class III under ANVISA regulations because it provides treatment planning or surgical guidance. Requires ANVISA registration and clinical validation.',
          ruleText: 'Treatment planning software is classified as Class III.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'recommendations',
        text: 'Treatment recommendations (clinician decides)',
        helpText: 'Software provides suggestions but clinician makes final decision',
        result: {
          class: 'Class II',
          rule: 'ANVISA RDC 185/2001 - Treatment Recommendation Software',
          description: 'This software is classified as Class II under ANVISA regulations because it provides treatment recommendations while the clinician retains decision authority.',
          ruleText: 'Treatment recommendation software is classified as Class II.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'wellness',
        text: 'General wellness or lifestyle guidance',
        helpText: 'Non-clinical recommendations for general health',
        result: {
          class: 'Class I',
          rule: 'ANVISA RDC 185/2001 - Wellness Software',
          description: 'This software is classified as Class I under ANVISA regulations because it provides general wellness guidance without specific medical claims.',
          ruleText: 'General wellness software is classified as Class I.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      }
    ]
  },

  br_monitoring_risk: {
    id: 'br_monitoring_risk',
    text: 'What type of monitoring does the software perform?',
    description: 'Consider what parameters are monitored and the clinical context.',
    options: [
      {
        id: 'critical_vitals',
        text: 'Critical vital signs (ICU, emergency settings)',
        helpText: 'Monitoring where parameter changes require immediate action',
        result: {
          class: 'Class III',
          rule: 'ANVISA RDC 185/2001 - Critical Monitoring Software',
          description: 'This software is classified as Class III under ANVISA regulations because it monitors critical vital parameters where failure to detect changes could result in serious harm.',
          ruleText: 'Critical vital signs monitoring software is classified as Class III.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'routine_vitals',
        text: 'Routine vital signs monitoring',
        helpText: 'Standard monitoring of vital signs in non-critical settings',
        result: {
          class: 'Class II',
          rule: 'ANVISA RDC 185/2001 - Routine Monitoring Software',
          description: 'This software is classified as Class II under ANVISA regulations because it monitors vital parameters in routine clinical settings.',
          ruleText: 'Routine monitoring software is classified as Class II.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'wellness_tracking',
        text: 'General health or fitness tracking',
        helpText: 'Non-medical monitoring for wellness purposes',
        result: {
          class: 'Class I',
          rule: 'ANVISA RDC 185/2001 - Wellness Tracking Software',
          description: 'This software is classified as Class I under ANVISA regulations because it tracks general wellness parameters without medical claims.',
          ruleText: 'Wellness tracking software is classified as Class I.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      }
    ]
  },

  br_support_risk: {
    id: 'br_support_risk',
    text: 'How does the software support clinical decisions?',
    description: 'Consider the impact of the information on patient care.',
    options: [
      {
        id: 'critical_alerts',
        text: 'Critical alerts or clinical decision support',
        helpText: 'Software provides alerts that could affect critical care decisions',
        result: {
          class: 'Class II',
          rule: 'ANVISA RDC 185/2001 - Clinical Decision Support',
          description: 'This software is classified as Class II under ANVISA regulations because it provides clinical decision support or alerts that influence patient care.',
          ruleText: 'Clinical decision support software is classified as Class II.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'information_display',
        text: 'Information display or data aggregation',
        helpText: 'Software displays or organizes clinical information',
        result: {
          class: 'Class I',
          rule: 'ANVISA RDC 185/2001 - Information Display Software',
          description: 'This software is classified as Class I under ANVISA regulations because it displays or aggregates clinical information without making clinical recommendations.',
          ruleText: 'Information display software is classified as Class I.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      },
      {
        id: 'administrative',
        text: 'Administrative or scheduling functions',
        helpText: 'Non-clinical administrative support',
        result: {
          class: 'Class I',
          rule: 'ANVISA RDC 185/2001 - Administrative Software',
          description: 'This software may be classified as Class I or may not be considered a medical device if it performs only administrative functions without clinical impact.',
          ruleText: 'Administrative software with no clinical impact is Class I or non-device.',
          ruleSource: 'ANVISA RDC 185/2001, Annex II, Rule 11'
        }
      }
    ]
  }
};
