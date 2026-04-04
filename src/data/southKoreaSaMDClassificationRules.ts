import { Question } from '@/types/classification';

/**
 * MFDS (South Korea) Software as a Medical Device Classification Decision Tree
 * Based on Korean Medical Devices Act and MFDS guidance
 * Reference: Medical Devices Act, MFDS SaMD classification guidance
 * Risk classes: 1, 2, 3, 4 (4 being highest risk)
 */
export const southKoreaSaMDClassificationQuestions: Record<string, Question> = {
  kr_samd_initial: {
    id: 'kr_samd_initial',
    text: 'What is the primary intended purpose of your software?',
    description: 'MFDS classifies software medical devices based on intended purpose and risk level.',
    helpText: 'Consider the main clinical function and intended use of your software.',
    options: [
      {
        id: 'diagnostic',
        text: 'Diagnosis or screening of diseases',
        helpText: 'Software that diagnoses, screens, or detects medical conditions',
        nextQuestionId: 'kr_diagnostic_risk'
      },
      {
        id: 'therapeutic',
        text: 'Treatment planning or therapy management',
        helpText: 'Software that influences treatment decisions or manages therapy',
        nextQuestionId: 'kr_therapeutic_risk'
      },
      {
        id: 'monitoring',
        text: 'Patient monitoring or vital signs',
        helpText: 'Software that monitors physiological parameters',
        nextQuestionId: 'kr_monitoring_risk'
      },
      {
        id: 'support',
        text: 'Clinical decision support or information management',
        helpText: 'Software that supports clinical workflows',
        nextQuestionId: 'kr_support_risk'
      }
    ]
  },

  kr_diagnostic_risk: {
    id: 'kr_diagnostic_risk',
    text: 'What is the risk level of the diagnostic function?',
    description: 'Consider the severity of conditions diagnosed and potential impact of errors.',
    options: [
      {
        id: 'life_threatening',
        text: 'Life-threatening conditions (cancer, cardiac, stroke)',
        helpText: 'Diagnosis where errors could result in death or serious harm',
        result: {
          class: 'Class 4',
          rule: 'MFDS Medical Devices Act - High Risk Diagnostic Software',
          description: 'This software is classified as Class 4 under MFDS regulations because it provides diagnostic information for life-threatening conditions. Requires MFDS pre-market approval, clinical trials, Korean Authorized Representative (KAR), and GMP certification.',
          ruleText: 'Software for diagnosis of life-threatening conditions is classified as Class 4.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'serious',
        text: 'Serious conditions requiring medical intervention',
        helpText: 'Diagnosis of conditions that need treatment',
        result: {
          class: 'Class 3',
          rule: 'MFDS Medical Devices Act - Medium-High Risk Diagnostic Software',
          description: 'This software is classified as Class 3 under MFDS regulations because it provides diagnostic information for serious conditions. Requires MFDS approval and clinical data.',
          ruleText: 'Software for diagnosis of serious conditions is classified as Class 3.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'moderate',
        text: 'Moderate conditions - not immediately dangerous',
        helpText: 'Diagnosis of manageable conditions',
        result: {
          class: 'Class 2',
          rule: 'MFDS Medical Devices Act - Medium Risk Diagnostic Software',
          description: 'This software is classified as Class 2 under MFDS regulations because it provides diagnostic information for moderate-risk conditions.',
          ruleText: 'Software for diagnosis of moderate conditions is classified as Class 2.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'low',
        text: 'General screening or wellness assessment',
        helpText: 'Preliminary screening requiring confirmation',
        result: {
          class: 'Class 1',
          rule: 'MFDS Medical Devices Act - Low Risk Diagnostic Software',
          description: 'This software is classified as Class 1 under MFDS regulations because it provides only preliminary diagnostic information.',
          ruleText: 'Low-risk screening software is classified as Class 1.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      }
    ]
  },

  kr_therapeutic_risk: {
    id: 'kr_therapeutic_risk',
    text: 'What type of therapeutic influence does the software have?',
    description: 'Consider how the software affects treatment decisions.',
    options: [
      {
        id: 'direct_control',
        text: 'Direct control of therapy or drug delivery',
        helpText: 'Software directly controls therapeutic interventions',
        result: {
          class: 'Class 4',
          rule: 'MFDS Medical Devices Act - High Risk Therapeutic Software',
          description: 'This software is classified as Class 4 under MFDS regulations because it directly controls therapeutic delivery.',
          ruleText: 'Software with direct therapeutic control is classified as Class 4.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'treatment_planning',
        text: 'Treatment planning or surgical guidance',
        helpText: 'Software assists in planning treatments or procedures',
        result: {
          class: 'Class 3',
          rule: 'MFDS Medical Devices Act - Treatment Planning Software',
          description: 'This software is classified as Class 3 under MFDS regulations because it provides treatment planning or surgical guidance.',
          ruleText: 'Treatment planning software is classified as Class 3.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'recommendations',
        text: 'Treatment recommendations (clinician decides)',
        helpText: 'Software provides suggestions but clinician decides',
        result: {
          class: 'Class 2',
          rule: 'MFDS Medical Devices Act - Treatment Recommendation Software',
          description: 'This software is classified as Class 2 under MFDS regulations because it provides treatment recommendations while clinician retains authority.',
          ruleText: 'Treatment recommendation software is classified as Class 2.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'wellness',
        text: 'General wellness or rehabilitation guidance',
        helpText: 'Non-critical health recommendations',
        result: {
          class: 'Class 1',
          rule: 'MFDS Medical Devices Act - Wellness Software',
          description: 'This software is classified as Class 1 under MFDS regulations because it provides general wellness guidance.',
          ruleText: 'General wellness software is classified as Class 1.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      }
    ]
  },

  kr_monitoring_risk: {
    id: 'kr_monitoring_risk',
    text: 'What type of monitoring does the software perform?',
    description: 'Consider the clinical setting and criticality of monitored parameters.',
    options: [
      {
        id: 'critical',
        text: 'Critical vital signs (ICU, emergency)',
        helpText: 'Monitoring where parameter changes require immediate action',
        result: {
          class: 'Class 3',
          rule: 'MFDS Medical Devices Act - Critical Monitoring Software',
          description: 'This software is classified as Class 3 under MFDS regulations because it monitors critical vital parameters.',
          ruleText: 'Critical vital signs monitoring software is classified as Class 3.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'routine',
        text: 'Routine vital signs monitoring',
        helpText: 'Standard monitoring of vital signs',
        result: {
          class: 'Class 2',
          rule: 'MFDS Medical Devices Act - Routine Monitoring Software',
          description: 'This software is classified as Class 2 under MFDS regulations because it monitors vital parameters in routine settings.',
          ruleText: 'Routine vital signs monitoring software is classified as Class 2.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'wellness',
        text: 'General health or fitness tracking',
        helpText: 'Non-medical monitoring for wellness',
        result: {
          class: 'Class 1',
          rule: 'MFDS Medical Devices Act - Wellness Tracking Software',
          description: 'This software is classified as Class 1 or may not be a medical device if it only tracks general wellness.',
          ruleText: 'Wellness tracking software is classified as Class 1 or non-device.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      }
    ]
  },

  kr_support_risk: {
    id: 'kr_support_risk',
    text: 'How does the software support clinical decisions?',
    description: 'Consider the impact of the information on patient care.',
    options: [
      {
        id: 'critical_alerts',
        text: 'Critical clinical alerts or decision support',
        helpText: 'Software provides alerts affecting critical care',
        result: {
          class: 'Class 2',
          rule: 'MFDS Medical Devices Act - Clinical Decision Support',
          description: 'This software is classified as Class 2 under MFDS regulations because it provides clinical decision support.',
          ruleText: 'Clinical decision support software is classified as Class 2.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'data_management',
        text: 'Health data management or display',
        helpText: 'Software manages or displays clinical information',
        result: {
          class: 'Class 1',
          rule: 'MFDS Medical Devices Act - Data Management Software',
          description: 'This software is classified as Class 1 under MFDS regulations because it manages or displays health data.',
          ruleText: 'Data management software is classified as Class 1.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      },
      {
        id: 'administrative',
        text: 'Administrative or workflow support',
        helpText: 'Non-clinical administrative functions',
        result: {
          class: 'Class 1',
          rule: 'MFDS Medical Devices Act - Administrative Software',
          description: 'This software may be Class 1 or may not be a medical device if it performs only administrative functions.',
          ruleText: 'Administrative software is Class 1 or non-device.',
          ruleSource: 'Korean Medical Devices Act, Article 6, Classification Rules'
        }
      }
    ]
  }
};
