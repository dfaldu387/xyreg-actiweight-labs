import { Question } from '@/types/classification';

/**
 * PMDA (Japan) Software as a Medical Device Classification Decision Tree
 * Based on Japan's Pharmaceutical and Medical Device Act (PMD Act)
 * Reference: PMDA guidance on SaMD and medical device classification
 * Risk classes: I, II, III, IV (IV being highest risk)
 */
export const japanSaMDClassificationQuestions: Record<string, Question> = {
  jp_samd_initial: {
    id: 'jp_samd_initial',
    text: 'What is the primary intended purpose of your software?',
    description: 'PMDA classifies software medical devices based on intended purpose and risk under the PMD Act.',
    helpText: 'Consider the main clinical function and intended use of your software.',
    options: [
      {
        id: 'diagnostic',
        text: 'Diagnosis or screening of diseases',
        helpText: 'Software that diagnoses, screens, or detects medical conditions',
        nextQuestionId: 'jp_diagnostic_risk'
      },
      {
        id: 'therapeutic',
        text: 'Treatment planning or therapy management',
        helpText: 'Software that influences treatment decisions or manages therapy',
        nextQuestionId: 'jp_therapeutic_risk'
      },
      {
        id: 'monitoring',
        text: 'Patient monitoring or vital signs',
        helpText: 'Software that monitors physiological parameters',
        nextQuestionId: 'jp_monitoring_risk'
      },
      {
        id: 'support',
        text: 'Clinical decision support or information management',
        helpText: 'Software that supports clinical workflows',
        nextQuestionId: 'jp_support_risk'
      }
    ]
  },

  jp_diagnostic_risk: {
    id: 'jp_diagnostic_risk',
    text: 'What is the risk level of the diagnostic function?',
    description: 'Consider the severity of conditions diagnosed and potential impact of errors.',
    options: [
      {
        id: 'life_threatening',
        text: 'Life-threatening conditions (cancer, cardiac, stroke)',
        helpText: 'Diagnosis where errors could result in death or serious harm',
        result: {
          class: 'Class IV',
          rule: 'PMDA PMD Act - High Risk Diagnostic Software',
          description: 'This software is classified as Class IV (Specially Controlled Medical Device) under PMDA regulations because it provides diagnostic information for life-threatening conditions. Requires PMDA pre-market approval (Shonin), clinical trials in Japan, QMS certification, and Marketing Authorization Holder (MAH) in Japan.',
          ruleText: 'Software for diagnosis of life-threatening conditions is classified as Class IV.',
          ruleSource: 'PMD Act, Article 23-2-5, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'serious',
        text: 'Serious conditions requiring medical intervention',
        helpText: 'Diagnosis of conditions that need treatment',
        result: {
          class: 'Class III',
          rule: 'PMDA PMD Act - Medium-High Risk Diagnostic Software',
          description: 'This software is classified as Class III (Specially Controlled Medical Device) under PMDA regulations. Requires PMDA certification (Ninsho) through Registered Certification Body, QMS certification, and MAH in Japan.',
          ruleText: 'Software for diagnosis of serious conditions is classified as Class III.',
          ruleSource: 'PMD Act, Article 23-2-23, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'moderate',
        text: 'Moderate conditions - not immediately dangerous',
        helpText: 'Diagnosis of manageable conditions',
        result: {
          class: 'Class II',
          rule: 'PMDA PMD Act - Controlled Medical Device Software',
          description: 'This software is classified as Class II (Controlled Medical Device) under PMDA regulations. Requires PMDA notification (Todokede) and QMS compliance.',
          ruleText: 'Software for diagnosis of moderate conditions is classified as Class II.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'low',
        text: 'General screening or wellness assessment',
        helpText: 'Preliminary screening requiring confirmation',
        result: {
          class: 'Class I',
          rule: 'PMDA PMD Act - General Medical Device Software',
          description: 'This software is classified as Class I (General Medical Device) under PMDA regulations. Basic notification requirements apply.',
          ruleText: 'Low-risk screening software is classified as Class I.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      }
    ]
  },

  jp_therapeutic_risk: {
    id: 'jp_therapeutic_risk',
    text: 'What type of therapeutic influence does the software have?',
    description: 'Consider how the software affects treatment decisions.',
    options: [
      {
        id: 'direct_control',
        text: 'Direct control of therapy or drug delivery',
        helpText: 'Software directly controls therapeutic interventions',
        result: {
          class: 'Class IV',
          rule: 'PMDA PMD Act - High Risk Therapeutic Software',
          description: 'This software is classified as Class IV under PMDA regulations because it directly controls therapeutic delivery. Requires PMDA pre-market approval.',
          ruleText: 'Software with direct therapeutic control is classified as Class IV.',
          ruleSource: 'PMD Act, Article 23-2-5, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'treatment_planning',
        text: 'Treatment planning or surgical guidance',
        helpText: 'Software assists in planning treatments or procedures',
        result: {
          class: 'Class III',
          rule: 'PMDA PMD Act - Treatment Planning Software',
          description: 'This software is classified as Class III under PMDA regulations because it provides treatment planning or surgical guidance.',
          ruleText: 'Treatment planning software is classified as Class III.',
          ruleSource: 'PMD Act, Article 23-2-23, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'recommendations',
        text: 'Treatment recommendations (clinician decides)',
        helpText: 'Software provides suggestions but clinician decides',
        result: {
          class: 'Class II',
          rule: 'PMDA PMD Act - Treatment Recommendation Software',
          description: 'This software is classified as Class II under PMDA regulations because it provides treatment recommendations while clinician retains authority.',
          ruleText: 'Treatment recommendation software is classified as Class II.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'wellness',
        text: 'General wellness or rehabilitation guidance',
        helpText: 'Non-critical health recommendations',
        result: {
          class: 'Class I',
          rule: 'PMDA PMD Act - Wellness Software',
          description: 'This software is classified as Class I under PMDA regulations because it provides general wellness guidance.',
          ruleText: 'General wellness software is classified as Class I.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      }
    ]
  },

  jp_monitoring_risk: {
    id: 'jp_monitoring_risk',
    text: 'What type of monitoring does the software perform?',
    description: 'Consider the clinical setting and criticality of monitored parameters.',
    options: [
      {
        id: 'critical',
        text: 'Critical vital signs (ICU, emergency)',
        helpText: 'Monitoring where parameter changes require immediate action',
        result: {
          class: 'Class III',
          rule: 'PMDA PMD Act - Critical Monitoring Software',
          description: 'This software is classified as Class III under PMDA regulations because it monitors critical vital parameters.',
          ruleText: 'Critical vital signs monitoring software is classified as Class III.',
          ruleSource: 'PMD Act, Article 23-2-23, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'routine',
        text: 'Routine vital signs monitoring',
        helpText: 'Standard monitoring of vital signs',
        result: {
          class: 'Class II',
          rule: 'PMDA PMD Act - Routine Monitoring Software',
          description: 'This software is classified as Class II under PMDA regulations because it monitors vital parameters in routine settings.',
          ruleText: 'Routine vital signs monitoring software is classified as Class II.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'wellness',
        text: 'General health or fitness tracking',
        helpText: 'Non-medical monitoring for wellness',
        result: {
          class: 'Class I',
          rule: 'PMDA PMD Act - Wellness Tracking Software',
          description: 'This software is classified as Class I or may not be a medical device if it only tracks general wellness.',
          ruleText: 'Wellness tracking software is classified as Class I or non-device.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      }
    ]
  },

  jp_support_risk: {
    id: 'jp_support_risk',
    text: 'How does the software support clinical decisions?',
    description: 'Consider the impact of the information on patient care.',
    options: [
      {
        id: 'critical_alerts',
        text: 'Critical clinical alerts or decision support',
        helpText: 'Software provides alerts affecting critical care',
        result: {
          class: 'Class II',
          rule: 'PMDA PMD Act - Clinical Decision Support',
          description: 'This software is classified as Class II under PMDA regulations because it provides clinical decision support.',
          ruleText: 'Clinical decision support software is classified as Class II.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'data_management',
        text: 'Health data management or display',
        helpText: 'Software manages or displays clinical information',
        result: {
          class: 'Class I',
          rule: 'PMDA PMD Act - Data Management Software',
          description: 'This software is classified as Class I under PMDA regulations because it manages or displays health data.',
          ruleText: 'Data management software is classified as Class I.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'administrative',
        text: 'Administrative or workflow support',
        helpText: 'Non-clinical administrative functions',
        result: {
          class: 'Class I',
          rule: 'PMDA PMD Act - Administrative Software',
          description: 'This software may be Class I or may not be a medical device if it performs only administrative functions.',
          ruleText: 'Administrative software is Class I or non-device.',
          ruleSource: 'PMD Act, Classification Rules for Medical Devices'
        }
      }
    ]
  }
};
