import { Question } from '@/types/classification';

/**
 * NMPA (China) Software as a Medical Device Classification Decision Tree
 * Based on NMPA regulations and Guidelines for Classification of Medical Device Software
 * Reference: NMPA Order No. 15 and related guidance documents
 * Risk classes: I, II, III (III being highest risk)
 */
export const chinaSaMDClassificationQuestions: Record<string, Question> = {
  cn_samd_initial: {
    id: 'cn_samd_initial',
    text: 'What is the primary intended purpose of your software?',
    description: 'NMPA classifies software medical devices based on intended purpose and risk to patients.',
    helpText: 'Consider the main clinical function and intended use of your software.',
    options: [
      {
        id: 'diagnostic',
        text: 'Diagnosis or screening of diseases',
        helpText: 'Software that diagnoses, screens, or detects medical conditions',
        nextQuestionId: 'cn_diagnostic_risk'
      },
      {
        id: 'therapeutic',
        text: 'Treatment planning or therapy control',
        helpText: 'Software that influences treatment decisions or controls therapy',
        nextQuestionId: 'cn_therapeutic_risk'
      },
      {
        id: 'monitoring',
        text: 'Patient monitoring or vital signs',
        helpText: 'Software that monitors physiological parameters',
        nextQuestionId: 'cn_monitoring_risk'
      },
      {
        id: 'support',
        text: 'Clinical decision support or data management',
        helpText: 'Software that supports clinical workflows or manages health data',
        nextQuestionId: 'cn_support_risk'
      }
    ]
  },

  cn_diagnostic_risk: {
    id: 'cn_diagnostic_risk',
    text: 'What is the risk level of the diagnostic function?',
    description: 'Consider the severity of conditions diagnosed and impact of errors.',
    options: [
      {
        id: 'high',
        text: 'Life-threatening conditions (cancer, cardiac, neurological)',
        helpText: 'Diagnosis of conditions where errors could result in death or serious harm',
        result: {
          class: 'Class III',
          rule: 'NMPA Classification - High Risk Diagnostic Software',
          description: 'This software is classified as Class III under NMPA regulations because it provides diagnostic information for life-threatening conditions. Requires NMPA registration, clinical trials in China, Chinese Agent/Legal Manufacturer, and GMP certification.',
          ruleText: 'Software for diagnosis of life-threatening conditions is classified as Class III.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'medium',
        text: 'Serious conditions requiring medical intervention',
        helpText: 'Diagnosis of conditions that need treatment but are not immediately life-threatening',
        result: {
          class: 'Class II',
          rule: 'NMPA Classification - Medium Risk Diagnostic Software',
          description: 'This software is classified as Class II under NMPA regulations because it provides diagnostic information for serious but non-life-threatening conditions. Requires NMPA registration and quality management system.',
          ruleText: 'Software for diagnosis of serious conditions is classified as Class II.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'low',
        text: 'General health screening or wellness assessment',
        helpText: 'Preliminary screening that requires confirmation',
        result: {
          class: 'Class I',
          rule: 'NMPA Classification - Low Risk Diagnostic Software',
          description: 'This software is classified as Class I under NMPA regulations because it provides only preliminary diagnostic information that requires confirmation by other means.',
          ruleText: 'Low-risk screening software is classified as Class I.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      }
    ]
  },

  cn_therapeutic_risk: {
    id: 'cn_therapeutic_risk',
    text: 'What type of therapeutic influence does the software have?',
    description: 'Consider how the software affects treatment decisions.',
    options: [
      {
        id: 'direct_control',
        text: 'Direct control of therapy or drug delivery',
        helpText: 'Software directly controls therapeutic interventions',
        result: {
          class: 'Class III',
          rule: 'NMPA Classification - High Risk Therapeutic Software',
          description: 'This software is classified as Class III under NMPA regulations because it directly controls therapeutic delivery where errors could be life-threatening.',
          ruleText: 'Software with direct therapeutic control is classified as Class III.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'treatment_planning',
        text: 'Treatment planning or surgical guidance',
        helpText: 'Software assists in planning treatments or procedures',
        result: {
          class: 'Class III',
          rule: 'NMPA Classification - Treatment Planning Software',
          description: 'This software is classified as Class III under NMPA regulations because it provides treatment planning or surgical guidance where errors could cause serious harm.',
          ruleText: 'Treatment planning and surgical guidance software is classified as Class III.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'recommendations',
        text: 'Treatment recommendations (clinician decides)',
        helpText: 'Software provides suggestions but clinician makes final decision',
        result: {
          class: 'Class II',
          rule: 'NMPA Classification - Treatment Recommendation Software',
          description: 'This software is classified as Class II under NMPA regulations because it provides treatment recommendations while clinician retains decision authority.',
          ruleText: 'Treatment recommendation software is classified as Class II.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'wellness',
        text: 'General health or rehabilitation guidance',
        helpText: 'Non-critical health recommendations',
        result: {
          class: 'Class I',
          rule: 'NMPA Classification - Wellness Software',
          description: 'This software is classified as Class I under NMPA regulations because it provides general wellness guidance without specific medical treatment claims.',
          ruleText: 'General wellness software is classified as Class I.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      }
    ]
  },

  cn_monitoring_risk: {
    id: 'cn_monitoring_risk',
    text: 'What type of monitoring does the software perform?',
    description: 'Consider the clinical setting and criticality of monitored parameters.',
    options: [
      {
        id: 'critical',
        text: 'Critical vital signs (ICU, emergency)',
        helpText: 'Monitoring where parameter changes require immediate action',
        result: {
          class: 'Class III',
          rule: 'NMPA Classification - Critical Monitoring Software',
          description: 'This software is classified as Class III under NMPA regulations because it monitors critical vital parameters in life-threatening situations.',
          ruleText: 'Critical vital signs monitoring software is classified as Class III.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'routine',
        text: 'Routine vital signs monitoring',
        helpText: 'Standard monitoring of vital signs',
        result: {
          class: 'Class II',
          rule: 'NMPA Classification - Routine Monitoring Software',
          description: 'This software is classified as Class II under NMPA regulations because it monitors vital parameters in routine clinical settings.',
          ruleText: 'Routine vital signs monitoring software is classified as Class II.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'wellness',
        text: 'General health or fitness tracking',
        helpText: 'Non-medical monitoring for wellness purposes',
        result: {
          class: 'Class I',
          rule: 'NMPA Classification - Wellness Tracking Software',
          description: 'This software is classified as Class I under NMPA regulations or may not be considered a medical device if it only tracks general wellness parameters.',
          ruleText: 'Wellness tracking software is classified as Class I or non-device.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      }
    ]
  },

  cn_support_risk: {
    id: 'cn_support_risk',
    text: 'How does the software support clinical decisions?',
    description: 'Consider the impact of the information on patient care.',
    options: [
      {
        id: 'critical_alerts',
        text: 'Critical clinical alerts or decision support',
        helpText: 'Software provides alerts that could affect critical care decisions',
        result: {
          class: 'Class II',
          rule: 'NMPA Classification - Clinical Decision Support',
          description: 'This software is classified as Class II under NMPA regulations because it provides clinical decision support or critical alerts.',
          ruleText: 'Clinical decision support software is classified as Class II.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'data_management',
        text: 'Health data management or display',
        helpText: 'Software manages or displays clinical information',
        result: {
          class: 'Class I',
          rule: 'NMPA Classification - Data Management Software',
          description: 'This software is classified as Class I under NMPA regulations because it manages or displays health data without making clinical recommendations.',
          ruleText: 'Data management software is classified as Class I.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      },
      {
        id: 'administrative',
        text: 'Administrative or workflow support',
        helpText: 'Non-clinical administrative functions',
        result: {
          class: 'Class I',
          rule: 'NMPA Classification - Administrative Software',
          description: 'This software may be classified as Class I or may not be considered a medical device if it performs only administrative functions.',
          ruleText: 'Administrative software is Class I or non-device.',
          ruleSource: 'NMPA Order No. 15, Appendix I, Classification Rules for Medical Devices'
        }
      }
    ]
  }
};
