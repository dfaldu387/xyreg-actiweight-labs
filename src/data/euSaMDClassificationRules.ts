import { Question } from '@/types/classification';

export const euSaMDClassificationQuestions: Record<string, Question> = {
  eu_samd_initial: {
    id: 'eu_samd_initial',
    text: 'What is the primary function of your SaMD (Software as a Medical Device)?',
    description: 'According to MDR Annex VIII Rule 11, classification depends on the software\'s intended purpose.',
    helpText: 'Select the category that best describes your software\'s main function.',
    options: [
      {
        id: 'diagnostic_therapeutic',
        text: 'Provides information for diagnostic or therapeutic decisions',
        helpText: 'Software that provides information which is used to take decisions with diagnosis or therapeutic purposes',
        nextQuestionId: 'eu_samd_diagnostic_impact'
      },
      {
        id: 'monitoring',
        text: 'Monitors physiological processes',
        helpText: 'Software intended to monitor physiological processes',
        nextQuestionId: 'eu_samd_monitoring_type'
      },
      {
        id: 'other',
        text: 'Other software functions',
        helpText: 'Software that doesn\'t fall into the above categories',
        result: {
          class: 'Class I',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'This software is classified as Class I under MDR Rule 11 because it does not provide information for diagnostic or therapeutic decisions, nor does it monitor physiological processes. Software that falls outside these specific use cases is classified in the lowest risk category.',
          ruleText: 'All other software is classified as class I.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Chapter III, Section 6.3, Rule 11'
        }
      }
    ]
  },

  eu_samd_diagnostic_impact: {
    id: 'eu_samd_diagnostic_impact',
    text: 'What is the potential impact of the diagnostic or therapeutic decisions your software informs?',
    description: 'Software providing information for diagnostic/therapeutic decisions is Class IIa, except for specific high-risk impacts.',
    options: [
      {
        id: 'death_irreversible',
        text: 'Could cause death or irreversible deterioration of health',
        helpText: 'Decisions have an impact that may cause death or an irreversible deterioration of a person\'s state of health',
        result: {
          class: 'Class III',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'This software is classified as Class III under MDR Rule 11 because it provides information used for diagnostic or therapeutic decisions where such decisions may have an impact that could cause death or an irreversible deterioration of a person\'s state of health. This represents the highest risk category for software under the MDR.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa, except if such decisions have an impact that may cause: death or an irreversible deterioration of a person\'s state of health, in which case it is in class III.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Chapter III, Section 6.3, Rule 11'
        }
      },
      {
        id: 'serious_deterioration',
        text: 'Could cause serious deterioration or require surgical intervention',
        helpText: 'Decisions may cause a serious deterioration of a person\'s state of health or a surgical intervention',
        result: {
          class: 'Class IIb',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'This software is classified as Class IIb under MDR Rule 11 because it provides information used for diagnostic or therapeutic decisions where such decisions may cause a serious deterioration of a person\'s state of health, or may require a surgical intervention. This represents a high-risk category requiring rigorous conformity assessment.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa, except if such decisions have an impact that may cause: a serious deterioration of a person\'s state of health or a surgical intervention, in which case it is classified as class IIb.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Chapter III, Section 6.3, Rule 11'
        }
      },
      {
        id: 'standard_impact',
        text: 'Standard diagnostic/therapeutic impact',
        helpText: 'Normal diagnostic or therapeutic decisions without the above high-risk impacts',
        result: {
          class: 'Class IIa',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'This software is classified as Class IIa under MDR Rule 11 because it provides information which is used to take decisions with diagnosis or therapeutic purposes, but such decisions do not have impacts that could cause death, irreversible deterioration, serious deterioration of health, or require surgical intervention.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Chapter III, Section 6.3, Rule 11'
        }
      }
    ]
  },

  eu_samd_monitoring_type: {
    id: 'eu_samd_monitoring_type',
    text: 'What type of physiological monitoring does your software perform?',
    description: 'Software for monitoring physiological processes is Class IIa, except for vital parameter monitoring with immediate danger potential.',
    options: [
      {
        id: 'vital_immediate_danger',
        text: 'Monitors vital physiological parameters with immediate danger potential',
        helpText: 'Monitoring of vital physiological parameters where variations could result in immediate danger to the patient',
        result: {
          class: 'Class IIb',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'This software is classified as Class IIb under MDR Rule 11 because it is intended to monitor vital physiological parameters, where the nature of variations of those parameters is such that it could result in immediate danger to the patient. Examples include software for continuous monitoring of cardiac rhythm, respiration rate, or central nervous system activity.',
          ruleText: 'Software intended to monitor physiological processes is classified as class IIa, except if it is intended for monitoring of vital physiological parameters, where the nature of variations of those parameters is such that it could result in immediate danger to the patient, in which case it is classified as class IIb.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Chapter III, Section 6.3, Rule 11'
        }
      },
      {
        id: 'standard_monitoring',
        text: 'Standard physiological process monitoring',
        helpText: 'Monitoring physiological processes without immediate danger from parameter variations',
        result: {
          class: 'Class IIa',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'This software is classified as Class IIa under MDR Rule 11 because it is intended to monitor physiological processes, but variations in the monitored parameters would not result in immediate danger to the patient. This includes general health monitoring software where the clinical consequences of parameter variations are not immediately life-threatening.',
          ruleText: 'Software intended to monitor physiological processes is classified as class IIa.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Chapter III, Section 6.3, Rule 11'
        }
      }
    ]
  }
};