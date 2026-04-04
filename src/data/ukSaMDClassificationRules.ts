import { Question } from '@/types/classification';

/**
 * UK MHRA Software Classification Decision Tree
 * Based on MHRA guidance on standalone software (including apps)
 * Currently follows EU MDR-like principles with focus on indirect harm consideration
 * Reference: MHRA guidance "Software and AI as a Medical Device"
 */
export const ukSaMDClassificationQuestions: Record<string, Question> = {
  uk_samd_initial: {
    id: 'uk_samd_initial',
    text: 'What is the primary intended purpose of your software?',
    description: 'UK MHRA classifies software based on its intended purpose and the potential for harm to patients.',
    helpText: 'Consider what the software is designed to do and how healthcare professionals or patients will use it.',
    options: [
      {
        id: 'diagnostic',
        text: 'Diagnosis or screening of disease/conditions',
        helpText: 'Software that diagnoses, screens, or detects medical conditions',
        nextQuestionId: 'uk_diagnostic_impact'
      },
      {
        id: 'therapeutic',
        text: 'Therapeutic decisions or treatment planning',
        helpText: 'Software that influences treatment decisions or therapy',
        nextQuestionId: 'uk_therapeutic_impact'
      },
      {
        id: 'monitoring',
        text: 'Monitoring physiological processes or parameters',
        helpText: 'Software that monitors vital signs or physiological functions',
        nextQuestionId: 'uk_monitoring_type'
      },
      {
        id: 'inform_only',
        text: 'Information display or clinical decision support',
        helpText: 'Software that displays or aggregates information without driving decisions',
        nextQuestionId: 'uk_inform_criticality'
      }
    ]
  },

  uk_diagnostic_impact: {
    id: 'uk_diagnostic_impact',
    text: 'What is the potential impact of incorrect diagnosis?',
    description: 'Consider the consequences if the software provides incorrect diagnostic information.',
    options: [
      {
        id: 'critical',
        text: 'Death or irreversible deterioration of health',
        helpText: 'Missed or incorrect diagnosis could lead to death or permanent harm',
        result: {
          class: 'Class III',
          rule: 'UK MDR 2002 - High Risk Diagnostic Software',
          description: 'This software is classified as Class III under UK MDR because it provides diagnostic information where failure to correctly diagnose could result in death or irreversible deterioration of a person\'s state of health. This highest-risk classification requires comprehensive clinical evidence, extensive software validation per IEC 62304, and robust post-market surveillance under UK MDR.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis purposes is classified as class III when such decisions have an impact that may cause death or an irreversible deterioration of a person\'s state of health.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'serious',
        text: 'Serious deterioration of health (but recoverable)',
        helpText: 'Incorrect diagnosis could cause significant but reversible harm',
        result: {
          class: 'Class IIb',
          rule: 'UK MDR 2002 - Serious Risk Diagnostic Software',
          description: 'This software is classified as Class IIb under UK MDR because it provides diagnostic information where failure could cause serious deterioration of a person\'s state of health, or could result in a surgical intervention. While potentially severe, the harm is considered recoverable. Requires robust clinical validation, software lifecycle compliance per IEC 62304, and ongoing performance monitoring.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis purposes is classified as class IIb when such decisions may cause a serious deterioration of a person\'s state of health or a surgical intervention.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'moderate',
        text: 'Moderate impact on health management',
        helpText: 'Incorrect diagnosis would require intervention but unlikely to cause serious harm',
        result: {
          class: 'Class IIa',
          rule: 'UK MDR 2002 - Moderate Risk Diagnostic Software',
          description: 'This software is classified as Class IIa under UK MDR because it provides diagnostic information used for clinical decisions, but such decisions would not result in death, irreversible harm, serious deterioration, or require surgical intervention. Requires clinical validation, software quality management per IEC 62304, and appropriate risk controls.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis purposes is classified as class IIa.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'low',
        text: 'Low impact - screening or preliminary assessment',
        helpText: 'Results require confirmation by other means; standalone results not used for critical decisions',
        result: {
          class: 'Class I',
          rule: 'UK MDR 2002 - Low Risk Software',
          description: 'This software is classified as Class I under UK MDR because it provides only preliminary or supportive diagnostic information that is not used to take clinical decisions directly. Results require confirmation by other diagnostic means, and the software\'s output is not solely relied upon for critical healthcare decisions.',
          ruleText: 'All other software is classified as class I.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      }
    ]
  },

  uk_therapeutic_impact: {
    id: 'uk_therapeutic_impact',
    text: 'What type of therapeutic influence does the software have?',
    description: 'Consider how the software affects treatment decisions and patient outcomes.',
    options: [
      {
        id: 'direct_control',
        text: 'Direct control of therapy delivery (e.g., drug dosing)',
        helpText: 'Software directly controls or calculates therapeutic interventions',
        result: {
          class: 'Class III',
          rule: 'UK MDR 2002 - High Risk Therapeutic Control Software',
          description: 'This software is classified as Class III under UK MDR because it directly controls therapeutic delivery or calculates drug dosing where errors could result in death or irreversible deterioration of health. Requires the highest level of clinical validation, fail-safe mechanisms, extensive testing per IEC 62304 Class C, and continuous post-market surveillance.',
          ruleText: 'Software intended to provide information which is used to take decisions with therapeutic purposes is classified as class III when such decisions have an impact that may cause death or an irreversible deterioration of a person\'s state of health.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'treatment_decisions',
        text: 'Influences treatment decisions (recommendations)',
        helpText: 'Software provides treatment recommendations that clinicians may follow',
        nextQuestionId: 'uk_treatment_criticality'
      },
      {
        id: 'treatment_planning',
        text: 'Treatment planning or surgical guidance',
        helpText: 'Software assists in planning treatments or guiding procedures',
        result: {
          class: 'Class IIb',
          rule: 'UK MDR 2002 - Treatment Planning Software',
          description: 'This software is classified as Class IIb under UK MDR because it provides treatment planning or surgical guidance where errors could cause serious deterioration of health or necessitate surgical intervention. Requires robust clinical validation, verification of planning algorithms per IEC 62304 Class B minimum, and appropriate risk management.',
          ruleText: 'Software intended to provide information which is used to take decisions with therapeutic purposes is classified as class IIb when such decisions may cause a serious deterioration of a person\'s state of health or a surgical intervention.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'rehabilitation',
        text: 'Rehabilitation support or therapy monitoring',
        helpText: 'Software supports rehabilitation or monitors therapy progress',
        result: {
          class: 'Class IIa',
          rule: 'UK MDR 2002 - Rehabilitation Support Software',
          description: 'This software is classified as Class IIa under UK MDR because it supports rehabilitation or monitors therapy progress, where the therapeutic impact is moderate and decisions do not directly affect life-threatening situations. Requires appropriate clinical evidence and software quality management per IEC 62304.',
          ruleText: 'Software intended to provide information which is used to take decisions with therapeutic purposes is classified as class IIa.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      }
    ]
  },

  uk_treatment_criticality: {
    id: 'uk_treatment_criticality',
    text: 'What is the criticality of the treatment recommendations?',
    description: 'Consider the healthcare situation and potential consequences of incorrect recommendations.',
    options: [
      {
        id: 'critical_condition',
        text: 'Life-threatening or critical conditions',
        helpText: 'Treatment recommendations for critical or emergency situations',
        result: {
          class: 'Class III',
          rule: 'UK MDR 2002 - Critical Treatment Recommendation Software',
          description: 'This software is classified as Class III under UK MDR because it provides treatment recommendations for life-threatening or critical healthcare situations where incorrect guidance could result in death or irreversible deterioration of health. Requires extensive clinical validation, algorithm transparency, and comprehensive risk management per IEC 62304 Class C.',
          ruleText: 'Software intended to provide information which is used to take decisions with therapeutic purposes is classified as class III when such decisions have an impact that may cause death or an irreversible deterioration of a person\'s state of health.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'serious_condition',
        text: 'Serious conditions requiring timely intervention',
        helpText: 'Treatment recommendations where delays could cause significant harm',
        result: {
          class: 'Class IIb',
          rule: 'UK MDR 2002 - Serious Treatment Recommendation Software',
          description: 'This software is classified as Class IIb under UK MDR because it provides treatment recommendations for serious healthcare conditions where incorrect or delayed guidance could cause serious deterioration of health. While significant, the potential harm is considered recoverable. Requires robust clinical evidence and software safety processes per IEC 62304.',
          ruleText: 'Software intended to provide information which is used to take decisions with therapeutic purposes is classified as class IIb when such decisions may cause a serious deterioration of a person\'s state of health or a surgical intervention.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'non_serious',
        text: 'Non-serious or chronic condition management',
        helpText: 'Treatment recommendations for routine or non-urgent conditions',
        result: {
          class: 'Class IIa',
          rule: 'UK MDR 2002 - Standard Treatment Recommendation Software',
          description: 'This software is classified as Class IIa under UK MDR because it provides treatment recommendations for non-serious or chronic conditions where the healthcare situation is not critical and potential harm from incorrect recommendations is limited and manageable. Requires appropriate clinical validation and quality management.',
          ruleText: 'Software intended to provide information which is used to take decisions with therapeutic purposes is classified as class IIa.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      }
    ]
  },

  uk_monitoring_type: {
    id: 'uk_monitoring_type',
    text: 'What type of physiological monitoring does the software perform?',
    description: 'The risk classification depends on what is being monitored and the nature of any alerts.',
    options: [
      {
        id: 'vital_immediate',
        text: 'Vital parameters where variation indicates immediate danger',
        helpText: 'Monitoring of vital signs where abnormal values require immediate action (e.g., cardiac monitoring in ICU)',
        result: {
          class: 'Class IIb',
          rule: 'UK MDR 2002 - Critical Vital Signs Monitoring',
          description: 'This software is classified as Class IIb under UK MDR because it monitors vital physiological parameters where the nature of variations is such that it could result in immediate danger to the patient. Examples include cardiac rhythm monitoring in intensive care, where failure to detect or alert could result in patient harm. Requires robust alarm systems, fail-safe mechanisms, and comprehensive validation per IEC 62304.',
          ruleText: 'Software intended to monitor physiological processes is classified as class IIb if it is intended for monitoring of vital physiological parameters, where the nature of variations of those parameters is such that it could result in immediate danger to the patient.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'vital_standard',
        text: 'Vital parameters for routine monitoring',
        helpText: 'Standard monitoring of vital signs without immediate danger context',
        result: {
          class: 'Class IIa',
          rule: 'UK MDR 2002 - Standard Vital Signs Monitoring',
          description: 'This software is classified as Class IIa under UK MDR because it monitors physiological processes, but the monitoring context is not one where parameter variations would result in immediate danger. The software provides valuable clinical information but operates in settings with appropriate clinical oversight. Requires appropriate accuracy validation and software quality management.',
          ruleText: 'Software intended to monitor physiological processes is classified as class IIa.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'physiological_other',
        text: 'Other physiological parameters',
        helpText: 'Monitoring of non-vital physiological parameters',
        result: {
          class: 'Class IIa',
          rule: 'UK MDR 2002 - General Physiological Monitoring',
          description: 'This software is classified as Class IIa under UK MDR because it monitors non-vital physiological parameters. While the monitored data has clinical relevance, variations in these parameters would not result in immediate danger to the patient. Requires appropriate clinical validation and risk management.',
          ruleText: 'Software intended to monitor physiological processes is classified as class IIa.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'wellness_tracking',
        text: 'General wellness or fitness parameters',
        helpText: 'Non-medical monitoring of general health indicators',
        result: {
          class: 'Class I',
          rule: 'UK MDR 2002 - Low Risk Monitoring / Wellness',
          description: 'This software may be classified as Class I under UK MDR if it monitors general wellness or fitness parameters without making medical claims. If the software is intended for general health monitoring only and results are not used for medical decisions, it may fall outside medical device regulation. If medical claims are made, basic quality management is required.',
          ruleText: 'All other software is classified as class I.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      }
    ]
  },

  uk_inform_criticality: {
    id: 'uk_inform_criticality',
    text: 'How critical is the information provided by the software?',
    description: 'Consider the potential consequences if the information is incorrect or unavailable.',
    options: [
      {
        id: 'critical_decisions',
        text: 'Critical clinical decisions depend on this information',
        helpText: 'Information directly influences critical or time-sensitive decisions',
        result: {
          class: 'Class IIa',
          rule: 'UK MDR 2002 - Critical Information Display',
          description: 'This software is classified as Class IIa under UK MDR because it provides clinical information that supports critical decision-making, but the software\'s role is informational rather than directive. The clinician retains independent decision authority, but data accuracy is essential for patient safety. Requires data accuracy validation, appropriate display verification, and risk management for information integrity.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'routine_decisions',
        text: 'Routine clinical management decisions',
        helpText: 'Information supports routine clinical workflow and decisions',
        result: {
          class: 'Class IIa',
          rule: 'UK MDR 2002 - Clinical Decision Support',
          description: 'This software is classified as Class IIa under UK MDR because it provides information supporting routine clinical management decisions. The information contributes to clinical workflow but is not the sole basis for critical decisions. Requires appropriate validation of decision logic and data handling.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      },
      {
        id: 'administrative',
        text: 'Administrative or non-clinical information',
        helpText: 'Information display for administrative purposes without clinical impact',
        result: {
          class: 'Class I',
          rule: 'UK MDR 2002 - Administrative Software',
          description: 'This software may be classified as Class I or may fall outside medical device classification if it provides only administrative or non-clinical information. If the software makes no medical claims and its output does not influence clinical decisions, it may not constitute a medical device. If classified as a device, basic quality management is required.',
          ruleText: 'All other software is classified as class I.',
          ruleSource: 'UK MDR 2002 (as amended), Schedule 1 Part III, Rule 11 - Software Devices'
        }
      }
    ]
  }
};
