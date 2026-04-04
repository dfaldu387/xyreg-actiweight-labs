import { Question } from '@/types/classification';

/**
 * Swissmedic (Switzerland) Software as a Medical Device Classification Decision Tree
 * Based on Swiss Medical Device Ordinance (MedDO) - closely aligned with EU MDR
 * Reference: Swissmedic guidance, MedDO (SR 812.213)
 * Risk classes: I, IIa, IIb, III (III being highest risk)
 */
export const switzerlandSaMDClassificationQuestions: Record<string, Question> = {
  ch_samd_initial: {
    id: 'ch_samd_initial',
    text: 'What is the primary intended purpose of your software?',
    description: 'Swissmedic classifies software medical devices based on intended purpose and risk, following MedDO (aligned with EU MDR Rule 11).',
    helpText: 'Consider the main clinical function and intended use of your software.',
    options: [
      {
        id: 'diagnostic',
        text: 'Diagnosis or screening of disease/conditions',
        helpText: 'Software that diagnoses, screens, or detects medical conditions',
        nextQuestionId: 'ch_diagnostic_impact'
      },
      {
        id: 'therapeutic',
        text: 'Therapeutic decisions or treatment management',
        helpText: 'Software that influences treatment or therapy decisions',
        nextQuestionId: 'ch_therapeutic_impact'
      },
      {
        id: 'monitoring',
        text: 'Monitoring physiological processes',
        helpText: 'Software that monitors vital signs or physiological functions',
        nextQuestionId: 'ch_monitoring_type'
      },
      {
        id: 'inform_only',
        text: 'Clinical decision support or information display',
        helpText: 'Software that displays or supports clinical decisions',
        nextQuestionId: 'ch_inform_criticality'
      }
    ]
  },

  ch_diagnostic_impact: {
    id: 'ch_diagnostic_impact',
    text: 'What is the potential impact of incorrect diagnosis?',
    description: 'Consider the consequences if the software provides incorrect diagnostic information.',
    options: [
      {
        id: 'critical',
        text: 'Death or irreversible deterioration of health',
        helpText: 'Missed or incorrect diagnosis could result in death or permanent harm',
        result: {
          class: 'Class III',
          rule: 'MedDO Rule 11 - High Risk Diagnostic Software',
          description: 'This software is classified as Class III under Swiss MedDO (aligned with EU MDR Rule 11) because it provides diagnostic information where failure could result in death or irreversible deterioration of health. Requires Swissmedic registration, Swiss Authorized Representative (CH-REP), conformity assessment by Notified Body, and clinical evidence.',
          ruleText: 'Software intended for diagnosis is classified as Class III when decisions may cause death or irreversible deterioration.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      },
      {
        id: 'serious',
        text: 'Serious deterioration of health (but recoverable)',
        helpText: 'Incorrect diagnosis could cause significant but reversible harm',
        result: {
          class: 'Class IIb',
          rule: 'MedDO Rule 11 - Serious Risk Diagnostic Software',
          description: 'This software is classified as Class IIb under Swiss MedDO because it provides diagnostic information where failure could cause serious deterioration of health. Requires Swissmedic registration and conformity assessment.',
          ruleText: 'Software for diagnosis is classified as Class IIb when decisions may cause serious deterioration.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      },
      {
        id: 'moderate',
        text: 'Moderate impact on health management',
        helpText: 'Incorrect diagnosis would require intervention but unlikely to cause serious harm',
        result: {
          class: 'Class IIa',
          rule: 'MedDO Rule 11 - Moderate Risk Diagnostic Software',
          description: 'This software is classified as Class IIa under Swiss MedDO because it provides diagnostic information with moderate risk impact.',
          ruleText: 'Software for diagnosis is classified as Class IIa for moderate risk conditions.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      },
      {
        id: 'low',
        text: 'Low impact - screening or preliminary assessment',
        helpText: 'Results require confirmation by other means',
        result: {
          class: 'Class I',
          rule: 'MedDO Rule 11 - Low Risk Software',
          description: 'This software is classified as Class I under Swiss MedDO because it provides only preliminary diagnostic information requiring confirmation.',
          ruleText: 'All other software is classified as Class I.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      }
    ]
  },

  ch_therapeutic_impact: {
    id: 'ch_therapeutic_impact',
    text: 'What type of therapeutic influence does the software have?',
    description: 'Consider how the software affects treatment decisions.',
    options: [
      {
        id: 'direct_control',
        text: 'Direct control of therapy delivery',
        helpText: 'Software directly controls therapeutic interventions',
        result: {
          class: 'Class III',
          rule: 'MedDO Rule 11 - High Risk Therapeutic Software',
          description: 'This software is classified as Class III under Swiss MedDO because it directly controls therapeutic delivery where errors could result in death or irreversible harm.',
          ruleText: 'Software with direct therapeutic control where failure may cause death is Class III.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      },
      {
        id: 'treatment_planning',
        text: 'Treatment planning or surgical guidance',
        helpText: 'Software assists in planning treatments or procedures',
        result: {
          class: 'Class IIb',
          rule: 'MedDO Rule 11 - Treatment Planning Software',
          description: 'This software is classified as Class IIb under Swiss MedDO because it provides treatment planning or surgical guidance.',
          ruleText: 'Treatment planning software is classified as Class IIb.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      },
      {
        id: 'recommendations',
        text: 'Treatment recommendations (clinician decides)',
        helpText: 'Software provides suggestions but clinician makes final decision',
        result: {
          class: 'Class IIa',
          rule: 'MedDO Rule 11 - Treatment Recommendation Software',
          description: 'This software is classified as Class IIa under Swiss MedDO because it provides treatment recommendations while clinician retains authority.',
          ruleText: 'Treatment recommendation software is classified as Class IIa.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      },
      {
        id: 'rehabilitation',
        text: 'Rehabilitation or general wellness support',
        helpText: 'Software supports rehabilitation or general health',
        result: {
          class: 'Class I',
          rule: 'MedDO Rule 11 - Rehabilitation Software',
          description: 'This software is classified as Class I under Swiss MedDO because it provides rehabilitation support or general wellness guidance.',
          ruleText: 'Rehabilitation support software is classified as Class I.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      }
    ]
  },

  ch_monitoring_type: {
    id: 'ch_monitoring_type',
    text: 'What type of monitoring does the software perform?',
    description: 'Consider what parameters are monitored and the clinical setting.',
    options: [
      {
        id: 'vital_immediate',
        text: 'Vital parameters indicating immediate danger',
        helpText: 'Monitoring where parameter changes require immediate action',
        result: {
          class: 'Class IIb',
          rule: 'MedDO Rule 10 - Critical Monitoring Software',
          description: 'This software is classified as Class IIb under Swiss MedDO because it monitors vital parameters where variations could indicate immediate danger.',
          ruleText: 'Software monitoring vital parameters with immediate danger potential is Class IIb.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 10'
        }
      },
      {
        id: 'vital_standard',
        text: 'Routine vital signs monitoring',
        helpText: 'Standard monitoring of vital signs',
        result: {
          class: 'Class IIa',
          rule: 'MedDO Rule 10 - Standard Monitoring Software',
          description: 'This software is classified as Class IIa under Swiss MedDO because it monitors physiological processes in routine settings.',
          ruleText: 'Standard vital signs monitoring software is Class IIa.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 10'
        }
      },
      {
        id: 'wellness',
        text: 'General wellness or fitness tracking',
        helpText: 'Non-medical monitoring for wellness purposes',
        result: {
          class: 'Class I',
          rule: 'MedDO - Wellness Software',
          description: 'This software may be classified as Class I or fall outside regulation if it monitors general wellness without medical claims.',
          ruleText: 'Wellness tracking software is Class I or non-device.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII'
        }
      }
    ]
  },

  ch_inform_criticality: {
    id: 'ch_inform_criticality',
    text: 'How critical is the information provided?',
    description: 'Consider the potential impact if information is incorrect.',
    options: [
      {
        id: 'critical',
        text: 'Critical clinical decisions depend on this information',
        helpText: 'Information directly influences critical decisions',
        result: {
          class: 'Class IIa',
          rule: 'MedDO Rule 11 - Critical Information Display',
          description: 'This software is classified as Class IIa under Swiss MedDO because it provides critical clinical information.',
          ruleText: 'Software providing critical clinical information is Class IIa.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII, Rule 11'
        }
      },
      {
        id: 'routine',
        text: 'Routine clinical management support',
        helpText: 'Information supports routine clinical workflow',
        result: {
          class: 'Class I',
          rule: 'MedDO - Clinical Support Software',
          description: 'This software is classified as Class I under Swiss MedDO because it provides routine clinical support information.',
          ruleText: 'Routine clinical support software is Class I.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII'
        }
      },
      {
        id: 'administrative',
        text: 'Administrative or non-clinical information',
        helpText: 'Information for administrative purposes without clinical impact',
        result: {
          class: 'Class I',
          rule: 'MedDO - Administrative Software',
          description: 'This software may be classified as Class I or may not be a medical device if it provides only administrative information.',
          ruleText: 'Administrative software is Class I or non-device.',
          ruleSource: 'Swiss MedDO (SR 812.213), Annex VIII'
        }
      }
    ]
  }
};
