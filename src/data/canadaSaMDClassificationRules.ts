import { Question } from '@/types/classification';

/**
 * Health Canada Software as a Medical Device (SaMD) Classification Decision Tree
 * Based on Health Canada's guidance document: "Software as a Medical Device (SaMD): Definition and Classification"
 * Reference: Health Canada Medical Device Regulations SOR/98-282
 * Risk classes: I, II, III, IV (IV being highest risk)
 */
export const canadaSaMDClassificationQuestions: Record<string, Question> = {
  ca_samd_initial: {
    id: 'ca_samd_initial',
    text: 'What is the healthcare situation or condition the software addresses?',
    description: 'Health Canada classifies SaMD based on the significance of the information provided by the SaMD to the healthcare decision and the state of the healthcare situation or condition.',
    helpText: 'Consider the criticality of the healthcare situation where the software will be used.',
    options: [
      {
        id: 'critical',
        text: 'Critical situation - Life threatening or requires urgent intervention',
        helpText: 'Situations where failure to take action could result in death or permanent disability (e.g., cardiac arrest, stroke)',
        nextQuestionId: 'ca_critical_significance'
      },
      {
        id: 'serious',
        text: 'Serious situation - Could progress to critical if not treated',
        helpText: 'Situations that are serious but not immediately life-threatening (e.g., chronic disease management, infection)',
        nextQuestionId: 'ca_serious_significance'
      },
      {
        id: 'non_serious',
        text: 'Non-serious situation - Unlikely to progress to serious',
        helpText: 'Situations that do not pose a significant risk to health (e.g., general wellness, minor conditions)',
        nextQuestionId: 'ca_non_serious_significance'
      }
    ]
  },

  ca_critical_significance: {
    id: 'ca_critical_significance',
    text: 'What is the significance of the information provided by the software?',
    description: 'For critical healthcare situations, the classification depends on how the software output influences clinical decisions.',
    options: [
      {
        id: 'treat_diagnose',
        text: 'To treat or to diagnose',
        helpText: 'Software provides information to treat, diagnose, or drive clinical management',
        result: {
          class: 'Class IV',
          rule: 'Health Canada SaMD Classification - Critical/Treat or Diagnose',
          description: 'This software is classified as Class IV under Health Canada Medical Device Regulations because it provides information used to treat or diagnose in critical healthcare situations. This is the highest risk class and requires a Medical Device License (MDL), Quality Management System certification (MDSAP preferred), clinical evidence, and pre-market review by Health Canada.',
          ruleText: 'SaMD that provides information to treat or diagnose in critical healthcare situations is classified as Class IV.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      },
      {
        id: 'drive_clinical',
        text: 'To drive clinical management',
        helpText: 'Software provides information that drives clinical management decisions',
        result: {
          class: 'Class IV',
          rule: 'Health Canada SaMD Classification - Critical/Drive Clinical Management',
          description: 'This software is classified as Class IV under Health Canada Medical Device Regulations because it provides information to drive clinical management in critical healthcare situations. Requires Medical Device License, MDSAP certification, and comprehensive clinical evidence.',
          ruleText: 'SaMD that provides information to drive clinical management in critical healthcare situations is classified as Class IV.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      },
      {
        id: 'inform_clinical',
        text: 'To inform clinical management',
        helpText: 'Software provides information that informs but does not drive clinical decisions',
        result: {
          class: 'Class III',
          rule: 'Health Canada SaMD Classification - Critical/Inform Clinical Management',
          description: 'This software is classified as Class III under Health Canada Medical Device Regulations because it provides information to inform clinical management in critical healthcare situations. Requires Medical Device License, quality management system certification, and appropriate clinical evidence.',
          ruleText: 'SaMD that provides information to inform clinical management in critical healthcare situations is classified as Class III.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      }
    ]
  },

  ca_serious_significance: {
    id: 'ca_serious_significance',
    text: 'What is the significance of the information provided by the software?',
    description: 'For serious healthcare situations, the classification depends on how the software output influences clinical decisions.',
    options: [
      {
        id: 'treat_diagnose',
        text: 'To treat or to diagnose',
        helpText: 'Software provides information to treat, diagnose, or drive clinical management',
        result: {
          class: 'Class III',
          rule: 'Health Canada SaMD Classification - Serious/Treat or Diagnose',
          description: 'This software is classified as Class III under Health Canada Medical Device Regulations because it provides information used to treat or diagnose in serious healthcare situations. Requires Medical Device License, quality management system certification (MDSAP preferred), and clinical evidence demonstrating safety and effectiveness.',
          ruleText: 'SaMD that provides information to treat or diagnose in serious healthcare situations is classified as Class III.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      },
      {
        id: 'drive_clinical',
        text: 'To drive clinical management',
        helpText: 'Software provides information that drives clinical management decisions',
        result: {
          class: 'Class III',
          rule: 'Health Canada SaMD Classification - Serious/Drive Clinical Management',
          description: 'This software is classified as Class III under Health Canada Medical Device Regulations because it provides information to drive clinical management in serious healthcare situations. Requires Medical Device License and quality management system certification.',
          ruleText: 'SaMD that provides information to drive clinical management in serious healthcare situations is classified as Class III.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      },
      {
        id: 'inform_clinical',
        text: 'To inform clinical management',
        helpText: 'Software provides information that informs but does not drive clinical decisions',
        result: {
          class: 'Class II',
          rule: 'Health Canada SaMD Classification - Serious/Inform Clinical Management',
          description: 'This software is classified as Class II under Health Canada Medical Device Regulations because it provides information to inform clinical management in serious healthcare situations. Requires Medical Device Establishment License (MDEL) registration and compliance with essential requirements.',
          ruleText: 'SaMD that provides information to inform clinical management in serious healthcare situations is classified as Class II.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      }
    ]
  },

  ca_non_serious_significance: {
    id: 'ca_non_serious_significance',
    text: 'What is the significance of the information provided by the software?',
    description: 'For non-serious healthcare situations, the classification depends on how the software output influences clinical decisions.',
    options: [
      {
        id: 'treat_diagnose',
        text: 'To treat or to diagnose',
        helpText: 'Software provides information to treat, diagnose, or drive clinical management',
        result: {
          class: 'Class II',
          rule: 'Health Canada SaMD Classification - Non-Serious/Treat or Diagnose',
          description: 'This software is classified as Class II under Health Canada Medical Device Regulations because it provides information used to treat or diagnose in non-serious healthcare situations. Requires Medical Device Establishment License (MDEL) registration and compliance with essential requirements for Class II devices.',
          ruleText: 'SaMD that provides information to treat or diagnose in non-serious healthcare situations is classified as Class II.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      },
      {
        id: 'drive_clinical',
        text: 'To drive clinical management',
        helpText: 'Software provides information that drives clinical management decisions',
        result: {
          class: 'Class II',
          rule: 'Health Canada SaMD Classification - Non-Serious/Drive Clinical Management',
          description: 'This software is classified as Class II under Health Canada Medical Device Regulations because it provides information to drive clinical management in non-serious healthcare situations. Requires MDEL registration.',
          ruleText: 'SaMD that provides information to drive clinical management in non-serious healthcare situations is classified as Class II.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      },
      {
        id: 'inform_clinical',
        text: 'To inform clinical management',
        helpText: 'Software provides information that informs but does not drive clinical decisions',
        result: {
          class: 'Class I',
          rule: 'Health Canada SaMD Classification - Non-Serious/Inform Clinical Management',
          description: 'This software is classified as Class I under Health Canada Medical Device Regulations because it provides information to inform clinical management in non-serious healthcare situations. This is the lowest risk class and requires basic quality management and Medical Device Establishment License (MDEL) registration.',
          ruleText: 'SaMD that provides information to inform clinical management in non-serious healthcare situations is classified as Class I.',
          ruleSource: 'Health Canada Medical Device Regulations SOR/98-282, Schedule 1, Rule 11'
        }
      }
    ]
  }
};
