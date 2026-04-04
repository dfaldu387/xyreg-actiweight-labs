import { Question } from '@/types/classification';

/**
 * FDA Software as Medical Device (SaMD) Classification Decision Tree
 * Based on FDA SaMD Guidance and IMDRF N12 Risk Categorization Framework
 * 
 * The IMDRF framework uses a 2-dimensional matrix:
 * - Significance of information: Treat/Diagnose, Drive, Inform
 * - Healthcare situation: Critical, Serious, Non-serious
 */
export const fdaSaMDClassificationQuestions: Record<string, Question> = {
  fda_samd_initial: {
    id: 'fda_samd_initial',
    text: 'What is the significance of the information provided by your software?',
    description: 'FDA uses the IMDRF framework to categorize SaMD based on the significance of information and the healthcare situation.',
    helpText: 'Consider what role the software output plays in clinical decision-making.',
    options: [
      {
        id: 'treat_diagnose',
        text: 'Treat or Diagnose',
        helpText: 'Software output is used to take immediate or near-term action (treat, diagnose, screen, detect, triage)',
        nextQuestionId: 'fda_situation_treat'
      },
      {
        id: 'drive_management',
        text: 'Drive Clinical Management',
        helpText: 'Software output is used to drive clinical management but user can independently review the basis for recommendations',
        nextQuestionId: 'fda_situation_drive'
      },
      {
        id: 'inform_management',
        text: 'Inform Clinical Management',
        helpText: 'Software output informs clinical management but does not drive immediate actions (aggregate, display, trend)',
        nextQuestionId: 'fda_situation_inform'
      }
    ]
  },

  fda_situation_treat: {
    id: 'fda_situation_treat',
    text: 'What is the healthcare situation or condition?',
    description: 'For software that treats or diagnoses, the healthcare situation determines the final risk category.',
    helpText: 'Consider the state of the patient\'s condition and potential consequences.',
    options: [
      {
        id: 'critical',
        text: 'Critical situation or condition',
        helpText: 'Situation is life-threatening or requires immediate action to prevent death or serious deterioration',
        result: {
          class: 'Class III',
          rule: 'FDA SaMD - IMDRF Category IV (Treat/Diagnose + Critical)',
          description: 'This software is classified as Class III under IMDRF Category IV because it provides information used to treat or diagnose a critical healthcare situation. When software directly influences treatment or diagnosis decisions in life-threatening conditions, the highest level of regulatory oversight is required. This classification typically requires Pre-Market Approval (PMA) or De Novo classification, with extensive clinical validation and post-market surveillance.',
          ruleText: 'SaMD that provides information to treat or diagnose a critical situation or condition is classified as IMDRF Category IV, requiring the highest level of regulatory control.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      },
      {
        id: 'serious',
        text: 'Serious situation or condition',
        helpText: 'Situation could result in significant morbidity if not properly treated or diagnosed',
        result: {
          class: 'Class III',
          rule: 'FDA SaMD - IMDRF Category III (Treat/Diagnose + Serious)',
          description: 'This software is classified as Class III under IMDRF Category III because it provides information used to treat or diagnose a serious healthcare situation. While not immediately life-threatening, erroneous treatment or diagnosis decisions could result in significant patient harm requiring medical intervention. This typically requires PMA or De Novo classification with robust clinical evidence.',
          ruleText: 'SaMD that provides information to treat or diagnose a serious situation or condition is classified as IMDRF Category III.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      },
      {
        id: 'non_serious',
        text: 'Non-serious situation or condition',
        helpText: 'Situation is unlikely to result in significant harm if not properly treated or diagnosed',
        result: {
          class: 'Class II',
          rule: 'FDA SaMD - IMDRF Category II (Treat/Diagnose + Non-serious)',
          description: 'This software is classified as Class II under IMDRF Category II because it provides information used to treat or diagnose a non-serious healthcare situation. While the software directly influences clinical decisions, the potential for patient harm from erroneous output is limited. This typically requires 510(k) clearance with clinical validation and software documentation per 21 CFR Part 820.',
          ruleText: 'SaMD that provides information to treat or diagnose a non-serious situation or condition is classified as IMDRF Category II.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      }
    ]
  },

  fda_situation_drive: {
    id: 'fda_situation_drive',
    text: 'What is the healthcare situation or condition?',
    description: 'For software that drives clinical management, the healthcare situation determines the final risk category.',
    options: [
      {
        id: 'critical',
        text: 'Critical situation or condition',
        helpText: 'Situation is life-threatening or requires immediate action',
        result: {
          class: 'Class III',
          rule: 'FDA SaMD - IMDRF Category III (Drive + Critical)',
          description: 'This software is classified as Class III under IMDRF Category III because it drives clinical management decisions in a critical healthcare situation. Although the clinician can independently review the basis for recommendations, the life-threatening nature of the condition requires comprehensive clinical validation and post-market surveillance.',
          ruleText: 'SaMD that drives clinical management in a critical situation is classified as IMDRF Category III.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      },
      {
        id: 'serious',
        text: 'Serious situation or condition',
        helpText: 'Situation could result in significant morbidity',
        result: {
          class: 'Class II',
          rule: 'FDA SaMD - IMDRF Category II (Drive + Serious)',
          description: 'This software is classified as Class II under IMDRF Category II because it drives clinical management decisions for a serious healthcare situation. The clinician retains ability to independently review recommendations, and the clinical context, while significant, does not present immediate life-threatening consequences. This typically requires 510(k) clearance.',
          ruleText: 'SaMD that drives clinical management in a serious situation is classified as IMDRF Category II.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      },
      {
        id: 'non_serious',
        text: 'Non-serious situation or condition',
        helpText: 'Situation is unlikely to result in significant harm',
        result: {
          class: 'Class II',
          rule: 'FDA SaMD - IMDRF Category I (Drive + Non-serious)',
          description: 'This software is classified as Class II (lower risk) under IMDRF Category I because it drives clinical management decisions for a non-serious healthcare situation. The limited potential for patient harm combined with clinician oversight justifies the lower risk classification. This may qualify for 510(k) exemption or require basic 510(k) clearance.',
          ruleText: 'SaMD that drives clinical management in a non-serious situation is classified as IMDRF Category I.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      }
    ]
  },

  fda_situation_inform: {
    id: 'fda_situation_inform',
    text: 'What is the healthcare situation or condition?',
    description: 'For software that informs clinical management, classification depends on the healthcare situation.',
    options: [
      {
        id: 'critical',
        text: 'Critical situation or condition',
        helpText: 'Information supports decisions in life-threatening situations',
        result: {
          class: 'Class II',
          rule: 'FDA SaMD - IMDRF Category II (Inform + Critical)',
          description: 'This software is classified as Class II under IMDRF Category II because it informs clinical management decisions in a critical healthcare situation. While the clinical context is serious, the software\'s role is to provide supportive information rather than direct treatment or diagnostic guidance, allowing for appropriate clinical oversight. This typically requires 510(k) clearance with data accuracy validation.',
          ruleText: 'SaMD that informs clinical management in a critical situation is classified as IMDRF Category II.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      },
      {
        id: 'serious',
        text: 'Serious situation or condition',
        helpText: 'Information supports decisions in serious conditions',
        result: {
          class: 'Class II',
          rule: 'FDA SaMD - IMDRF Category I (Inform + Serious)',
          description: 'This software is classified as Class II (lower risk) under IMDRF Category I because it informs clinical management decisions for a serious healthcare situation. The software provides supportive information without directly driving clinical decisions, and the clinical context allows for appropriate clinician oversight. This may qualify for 510(k) exemption.',
          ruleText: 'SaMD that informs clinical management in a serious situation is classified as IMDRF Category I.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      },
      {
        id: 'non_serious',
        text: 'Non-serious situation or condition',
        helpText: 'Information supports routine clinical management',
        result: {
          class: 'Class I',
          rule: 'FDA SaMD - IMDRF Category I (Inform + Non-serious)',
          description: 'This software is classified as Class I under IMDRF Category I because it informs clinical management decisions for a non-serious healthcare situation. The combination of limited clinical risk and supportive (rather than directive) role results in the lowest risk classification. This is typically 510(k) exempt and may be subject to enforcement discretion. Basic quality management is required.',
          ruleText: 'SaMD that informs clinical management in a non-serious situation is classified as IMDRF Category I.',
          ruleSource: 'FDA SaMD Guidance (Software as a Medical Device), IMDRF N12 Risk Categorization Framework'
        }
      }
    ]
  }
};
