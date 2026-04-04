import { Question } from '@/types/classification';

/**
 * CDSCO (India) Software as a Medical Device Classification Decision Tree
 * Based on Medical Devices Rules 2017 and CDSCO guidance
 * Reference: MDR 2017 and related guidance documents
 * Risk classes: A, B, C, D (D being highest risk)
 */
export const indiaSaMDClassificationQuestions: Record<string, Question> = {
  in_samd_initial: {
    id: 'in_samd_initial',
    text: 'What is the primary intended purpose of your software?',
    description: 'CDSCO classifies software medical devices based on intended purpose and risk to patients under MDR 2017.',
    helpText: 'Consider the main clinical function and intended use of your software.',
    options: [
      {
        id: 'diagnostic',
        text: 'Diagnosis or detection of diseases',
        helpText: 'Software that diagnoses, screens, or detects medical conditions',
        nextQuestionId: 'in_diagnostic_risk'
      },
      {
        id: 'therapeutic',
        text: 'Treatment planning or therapy management',
        helpText: 'Software that influences treatment decisions or manages therapy',
        nextQuestionId: 'in_therapeutic_risk'
      },
      {
        id: 'monitoring',
        text: 'Patient monitoring or vital signs',
        helpText: 'Software that monitors physiological parameters',
        nextQuestionId: 'in_monitoring_risk'
      },
      {
        id: 'support',
        text: 'Clinical decision support or information management',
        helpText: 'Software that supports clinical workflows',
        nextQuestionId: 'in_support_risk'
      }
    ]
  },

  in_diagnostic_risk: {
    id: 'in_diagnostic_risk',
    text: 'What is the risk level of the diagnostic function?',
    description: 'Consider the severity of conditions diagnosed and potential impact of errors.',
    options: [
      {
        id: 'life_threatening',
        text: 'Life-threatening conditions (cancer, cardiac, stroke)',
        helpText: 'Diagnosis where errors could result in death or irreversible harm',
        result: {
          class: 'Class D',
          rule: 'CDSCO MDR 2017 - High Risk Diagnostic Software',
          description: 'This software is classified as Class D under CDSCO regulations because it provides diagnostic information for life-threatening conditions. Requires CDSCO registration, clinical investigation, Indian Authorized Agent, and ISO 13485 certification.',
          ruleText: 'Software for diagnosis of life-threatening conditions is classified as Class D.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'serious',
        text: 'Serious conditions requiring medical intervention',
        helpText: 'Diagnosis of conditions that need treatment',
        result: {
          class: 'Class C',
          rule: 'CDSCO MDR 2017 - Medium-High Risk Diagnostic Software',
          description: 'This software is classified as Class C under CDSCO regulations because it provides diagnostic information for serious conditions. Requires CDSCO registration and quality management system.',
          ruleText: 'Software for diagnosis of serious conditions is classified as Class C.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'moderate',
        text: 'Moderate conditions - not immediately dangerous',
        helpText: 'Diagnosis of conditions that are manageable',
        result: {
          class: 'Class B',
          rule: 'CDSCO MDR 2017 - Medium Risk Diagnostic Software',
          description: 'This software is classified as Class B under CDSCO regulations because it provides diagnostic information for moderate-risk conditions.',
          ruleText: 'Software for diagnosis of moderate conditions is classified as Class B.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'low',
        text: 'General screening or wellness assessment',
        helpText: 'Preliminary screening that requires confirmation',
        result: {
          class: 'Class A',
          rule: 'CDSCO MDR 2017 - Low Risk Diagnostic Software',
          description: 'This software is classified as Class A under CDSCO regulations because it provides only preliminary diagnostic information requiring confirmation.',
          ruleText: 'Low-risk screening software is classified as Class A.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      }
    ]
  },

  in_therapeutic_risk: {
    id: 'in_therapeutic_risk',
    text: 'What type of therapeutic influence does the software have?',
    description: 'Consider how the software affects treatment decisions.',
    options: [
      {
        id: 'direct_control',
        text: 'Direct control of therapy or drug delivery',
        helpText: 'Software directly controls therapeutic interventions',
        result: {
          class: 'Class D',
          rule: 'CDSCO MDR 2017 - High Risk Therapeutic Software',
          description: 'This software is classified as Class D under CDSCO regulations because it directly controls therapeutic delivery where errors could be life-threatening.',
          ruleText: 'Software with direct therapeutic control is classified as Class D.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'treatment_planning',
        text: 'Treatment planning or surgical guidance',
        helpText: 'Software assists in planning treatments or procedures',
        result: {
          class: 'Class C',
          rule: 'CDSCO MDR 2017 - Treatment Planning Software',
          description: 'This software is classified as Class C under CDSCO regulations because it provides treatment planning or surgical guidance.',
          ruleText: 'Treatment planning software is classified as Class C.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'recommendations',
        text: 'Treatment recommendations (clinician decides)',
        helpText: 'Software provides suggestions but clinician makes final decision',
        result: {
          class: 'Class B',
          rule: 'CDSCO MDR 2017 - Treatment Recommendation Software',
          description: 'This software is classified as Class B under CDSCO regulations because it provides treatment recommendations while clinician retains decision authority.',
          ruleText: 'Treatment recommendation software is classified as Class B.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'wellness',
        text: 'General wellness or rehabilitation guidance',
        helpText: 'Non-critical health recommendations',
        result: {
          class: 'Class A',
          rule: 'CDSCO MDR 2017 - Wellness Software',
          description: 'This software is classified as Class A under CDSCO regulations because it provides general wellness guidance.',
          ruleText: 'General wellness software is classified as Class A.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      }
    ]
  },

  in_monitoring_risk: {
    id: 'in_monitoring_risk',
    text: 'What type of monitoring does the software perform?',
    description: 'Consider the clinical setting and criticality of monitored parameters.',
    options: [
      {
        id: 'critical',
        text: 'Critical vital signs (ICU, emergency)',
        helpText: 'Monitoring where parameter changes require immediate action',
        result: {
          class: 'Class C',
          rule: 'CDSCO MDR 2017 - Critical Monitoring Software',
          description: 'This software is classified as Class C under CDSCO regulations because it monitors critical vital parameters.',
          ruleText: 'Critical vital signs monitoring software is classified as Class C.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'routine',
        text: 'Routine vital signs monitoring',
        helpText: 'Standard monitoring of vital signs',
        result: {
          class: 'Class B',
          rule: 'CDSCO MDR 2017 - Routine Monitoring Software',
          description: 'This software is classified as Class B under CDSCO regulations because it monitors vital parameters in routine settings.',
          ruleText: 'Routine vital signs monitoring software is classified as Class B.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'wellness',
        text: 'General health or fitness tracking',
        helpText: 'Non-medical monitoring for wellness purposes',
        result: {
          class: 'Class A',
          rule: 'CDSCO MDR 2017 - Wellness Tracking Software',
          description: 'This software is classified as Class A under CDSCO regulations or may not be a medical device if it only tracks general wellness.',
          ruleText: 'Wellness tracking software is classified as Class A or non-device.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      }
    ]
  },

  in_support_risk: {
    id: 'in_support_risk',
    text: 'How does the software support clinical decisions?',
    description: 'Consider the impact of the information on patient care.',
    options: [
      {
        id: 'critical_alerts',
        text: 'Critical clinical alerts or decision support',
        helpText: 'Software provides alerts that could affect critical care decisions',
        result: {
          class: 'Class B',
          rule: 'CDSCO MDR 2017 - Clinical Decision Support',
          description: 'This software is classified as Class B under CDSCO regulations because it provides clinical decision support or critical alerts.',
          ruleText: 'Clinical decision support software is classified as Class B.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'data_management',
        text: 'Health data management or display',
        helpText: 'Software manages or displays clinical information',
        result: {
          class: 'Class A',
          rule: 'CDSCO MDR 2017 - Data Management Software',
          description: 'This software is classified as Class A under CDSCO regulations because it manages or displays health data without clinical recommendations.',
          ruleText: 'Data management software is classified as Class A.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      },
      {
        id: 'administrative',
        text: 'Administrative or workflow support',
        helpText: 'Non-clinical administrative functions',
        result: {
          class: 'Class A',
          rule: 'CDSCO MDR 2017 - Administrative Software',
          description: 'This software may be classified as Class A or may not be a medical device if it performs only administrative functions.',
          ruleText: 'Administrative software is Class A or non-device.',
          ruleSource: 'Medical Devices Rules 2017, First Schedule, Rule 4'
        }
      }
    ]
  }
};
