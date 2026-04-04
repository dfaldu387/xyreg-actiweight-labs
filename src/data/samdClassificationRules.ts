import { Question } from '@/types/classification';

export const samdClassificationQuestions: Record<string, Question> = {
  samd_initial: {
    id: 'samd_initial',
    text: 'What type of software medical device is this?',
    description: 'Software as a Medical Device (SaMD) can be standalone software or software within a medical device. Understanding the type helps determine the applicable regulatory pathway.',
    helpText: 'Standalone SaMD operates independently, while software in a medical device is part of a larger system.',
    options: [
      {
        id: 'standalone',
        text: 'Standalone Software as Medical Device (SaMD)',
        helpText: 'Software that operates independently to provide medical functions',
        nextQuestionId: 'samd_function'
      },
      {
        id: 'embedded',
        text: 'Software within a Medical Device',
        helpText: 'Software that is part of a larger medical device system',
        nextQuestionId: 'software_safety_class'
      },
      {
        id: 'mobile_app',
        text: 'Mobile Medical App',
        helpText: 'Mobile application with medical functionality',
        nextQuestionId: 'mobile_app_function'
      }
    ]
  },

  samd_function: {
    id: 'samd_function',
    text: 'What is the primary function of your SaMD?',
    description: 'The SaMD framework categorizes software based on its healthcare decision and healthcare situation to determine risk classification.',
    helpText: 'Healthcare decisions range from informing to driving clinical management. Healthcare situations consider the patient condition criticality.',
    options: [
      {
        id: 'inform',
        text: 'Inform healthcare decision',
        helpText: 'Provides information to inform healthcare decisions without driving actions',
        nextQuestionId: 'healthcare_situation'
      },
      {
        id: 'drive',
        text: 'Drive healthcare decision',
        helpText: 'Directly drives or triggers immediate healthcare actions',
        nextQuestionId: 'healthcare_situation_critical'
      },
      {
        id: 'diagnose',
        text: 'Diagnose or detect conditions',
        helpText: 'Actively diagnoses conditions or detects anomalies',
        nextQuestionId: 'diagnostic_criticality'
      },
      {
        id: 'treat',
        text: 'Treat or intervene',
        helpText: 'Provides treatment recommendations or direct interventions',
        nextQuestionId: 'treatment_criticality'
      }
    ]
  },

  healthcare_situation: {
    id: 'healthcare_situation',
    text: 'What healthcare situation does your SaMD address?',
    description: 'The healthcare situation considers the patient condition and the criticality of the healthcare decision.',
    options: [
      {
        id: 'non_serious',
        text: 'Non-serious healthcare situation',
        helpText: 'Healthcare decisions in routine or non-critical situations',
        result: {
          class: 'Class A',
          rule: 'IMDRF SaMD N12 - Category I (Inform + Non-serious)',
          description: 'Low risk SaMD that informs healthcare decisions in non-serious situations. Requires basic software lifecycle processes per IEC 62304 Class A.',
          ruleText: 'Category I SaMD provides information that is not intended to be used as the sole means of clinical management decisions. The state of a healthcare situation or condition is non-serious and does not require immediate or near term action.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      },
      {
        id: 'serious',
        text: 'Serious healthcare situation',
        helpText: 'Healthcare decisions that could impact patient safety if incorrect',
        result: {
          class: 'Class B',
          rule: 'IMDRF SaMD N12 - Category II (Inform + Serious)',
          description: 'Moderate risk SaMD that informs healthcare decisions in serious situations. Requires enhanced software lifecycle processes per IEC 62304 Class B.',
          ruleText: 'Category II SaMD provides information that may be used to drive clinical management but the clinician has the ability to independently review the basis for the recommendations. The state of a healthcare situation or condition is serious, but intervention is typically non-emergent.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      },
      {
        id: 'critical',
        text: 'Critical healthcare situation',
        helpText: 'Healthcare decisions in life-threatening or critical conditions',
        result: {
          class: 'Class C',
          rule: 'IMDRF SaMD N12 - Category III (Inform + Critical)',
          description: 'High risk SaMD that informs healthcare decisions in critical situations. Requires comprehensive software lifecycle processes per IEC 62304 Class C.',
          ruleText: 'Category III SaMD provides information that may be used to drive clinical management. The state of a healthcare situation or condition is critical, which means life-threatening or requires immediate action to prevent death or serious deterioration.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      }
    ]
  },

  healthcare_situation_critical: {
    id: 'healthcare_situation_critical',
    text: 'What healthcare situation does your decision-driving SaMD address?',
    description: 'SaMD that drives healthcare decisions typically carries higher risk classifications.',
    options: [
      {
        id: 'non_serious_drive',
        text: 'Non-serious healthcare situation',
        result: {
          class: 'Class B',
          rule: 'IMDRF SaMD N12 - Category II (Drive + Non-serious)',
          description: 'Moderate risk SaMD that drives healthcare decisions in non-serious situations. Requires enhanced software lifecycle processes and clinical validation.',
          ruleText: 'Category II SaMD may drive clinical management where the clinician can independently review the basis for recommendations. The state of a healthcare situation or condition is non-serious.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      },
      {
        id: 'serious_drive',
        text: 'Serious healthcare situation',
        result: {
          class: 'Class C',
          rule: 'IMDRF SaMD N12 - Category III (Drive + Serious)',
          description: 'High risk SaMD that drives healthcare decisions in serious situations. Requires comprehensive software lifecycle processes, extensive clinical validation, and robust risk management.',
          ruleText: 'Category III SaMD drives clinical management in serious healthcare situations. The state of a healthcare situation or condition could result in serious deterioration of health.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      },
      {
        id: 'critical_drive',
        text: 'Critical healthcare situation',
        result: {
          class: 'Class C',
          rule: 'IMDRF SaMD N12 - Category IV (Drive + Critical)',
          description: 'Highest risk SaMD that drives healthcare decisions in critical situations. Requires the most rigorous software lifecycle processes, extensive clinical validation, cybersecurity measures, and continuous post-market surveillance.',
          ruleText: 'Category IV SaMD drives clinical management where the state of a healthcare situation or condition is critical, meaning it is life-threatening or requires immediate action to prevent death or serious deterioration.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      }
    ]
  },

  diagnostic_criticality: {
    id: 'diagnostic_criticality',
    text: 'How critical is the diagnostic accuracy for patient safety?',
    description: 'Diagnostic SaMD classification depends on the consequences of misdiagnosis.',
    options: [
      {
        id: 'low_impact',
        text: 'Low impact - Screening or early detection',
        result: {
          class: 'Class B',
          rule: 'IMDRF SaMD N12 - Diagnostic (Screening/Low Impact)',
          description: 'Moderate risk diagnostic SaMD with low impact from false results. Requires clinical validation of diagnostic accuracy and IEC 62304 Class B processes.',
          ruleText: 'SaMD intended for screening or early detection where false results have limited direct impact on clinical management falls into Category II. Results typically require confirmation by other diagnostic means.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      },
      {
        id: 'moderate_impact',
        text: 'Moderate impact - Diagnostic aid for treatment decisions',
        result: {
          class: 'Class C',
          rule: 'IMDRF SaMD N12 - Diagnostic (Treatment Impact)',
          description: 'High risk diagnostic SaMD where accuracy impacts treatment decisions. Requires extensive clinical validation, algorithm transparency, and comprehensive software lifecycle management.',
          ruleText: 'SaMD that provides diagnostic information directly influencing treatment decisions falls into Category III or IV. Inaccurate diagnosis could lead to inappropriate treatment with potential for serious patient harm.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      },
      {
        id: 'high_impact',
        text: 'High impact - Critical diagnostic decisions',
        result: {
          class: 'Class C',
          rule: 'IMDRF SaMD N12 - Diagnostic (Critical Impact)',
          description: 'Highest risk diagnostic SaMD for critical decisions. Requires rigorous clinical validation, real-world performance monitoring, algorithm bias assessment, and the highest software safety standards.',
          ruleText: 'SaMD used for diagnosis in critical healthcare situations where inaccurate results could lead to death or irreversible deterioration of health requires Category IV classification and the most stringent controls.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      }
    ]
  },

  treatment_criticality: {
    id: 'treatment_criticality',
    text: 'What level of treatment intervention does your SaMD provide?',
    description: 'Treatment SaMD carries the highest risk classifications due to direct patient impact.',
    options: [
      {
        id: 'recommendation',
        text: 'Treatment recommendations only',
        result: {
          class: 'Class C',
          rule: 'IMDRF SaMD N12 - Treatment Recommendation',
          description: 'High risk SaMD providing treatment recommendations. Requires extensive clinical validation, evidence-based algorithms, comprehensive risk management, and continuous performance monitoring.',
          ruleText: 'SaMD that provides treatment recommendations to healthcare providers falls into Category III or IV depending on the healthcare situation. Such software directly influences therapeutic decisions.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      },
      {
        id: 'direct_control',
        text: 'Direct device control or dosing',
        result: {
          class: 'Class C',
          rule: 'IMDRF SaMD N12 - Treatment Control (Category IV)',
          description: 'Highest risk SaMD with direct treatment control. Requires the most rigorous software lifecycle processes, fail-safe mechanisms, extensive clinical validation, cybersecurity measures, and real-time monitoring capabilities.',
          ruleText: 'SaMD that directly controls therapy delivery, calculates drug dosing, or autonomously makes treatment decisions requires Category IV classification. Failure or malfunction could directly result in patient death or serious injury.',
          ruleSource: 'IMDRF SaMD N12: Software as a Medical Device: Possible Framework for Risk Categorization'
        }
      }
    ]
  },

  software_safety_class: {
    id: 'software_safety_class',
    text: 'According to IEC 62304, what is the potential harm from software failure?',
    description: 'IEC 62304 classifies medical device software based on the potential for the software to contribute to a hazardous situation.',
    helpText: 'This classification determines the rigor of software lifecycle processes required.',
    options: [
      {
        id: 'class_a',
        text: 'Class A - No injury or damage to health possible',
        result: {
          class: 'Class A',
          rule: 'IEC 62304 Software Safety Class A',
          description: 'Software where failure cannot result in death, serious injury, or damage to health. Requires basic software lifecycle documentation and processes.',
          ruleText: 'Software system is classified as Class A if: the software system cannot contribute to a hazardous situation; or the software system can contribute to a hazardous situation which does not result in unacceptable risk after consideration of risk control measures external to the software system.',
          ruleSource: 'IEC 62304:2006+AMD1:2015, Clause 4.3 - Software safety classification'
        }
      },
      {
        id: 'class_b',
        text: 'Class B - Non-serious injury possible',
        result: {
          class: 'Class B',
          rule: 'IEC 62304 Software Safety Class B',
          description: 'Software where failure could result in non-serious injury. Requires enhanced software lifecycle processes, risk analysis, and verification activities.',
          ruleText: 'Software system is classified as Class B if: the software system can contribute to a hazardous situation which results in unacceptable risk after consideration of risk control measures external to the software system; and the resulting possible harm is non-serious injury.',
          ruleSource: 'IEC 62304:2006+AMD1:2015, Clause 4.3 - Software safety classification'
        }
      },
      {
        id: 'class_c',
        text: 'Class C - Death or serious injury possible',
        result: {
          class: 'Class C',
          rule: 'IEC 62304 Software Safety Class C',
          description: 'Software where failure could result in death or serious injury. Requires comprehensive software lifecycle processes, extensive testing, risk management, and validation.',
          ruleText: 'Software system is classified as Class C if: the software system can contribute to a hazardous situation which results in unacceptable risk after consideration of risk control measures external to the software system; and the resulting possible harm is death or serious injury.',
          ruleSource: 'IEC 62304:2006+AMD1:2015, Clause 4.3 - Software safety classification'
        }
      }
    ]
  },

  mobile_app_function: {
    id: 'mobile_app_function',
    text: 'What medical function does your mobile app perform?',
    description: 'Mobile medical apps are classified based on their functionality and risk to patient safety.',
    helpText: 'FDA and EU guidance provide specific pathways for mobile medical applications.',
    options: [
      {
        id: 'wellness',
        text: 'General wellness or fitness tracking',
        result: {
          class: 'Not a medical device',
          rule: 'FDA Mobile Medical App Guidance - Wellness',
          description: 'General wellness apps that promote healthy lifestyle are typically not regulated as medical devices. However, claims must be carefully managed to avoid medical device classification.',
          ruleText: 'General wellness products are excluded from device regulations when they: (1) are intended only for general wellness use, and (2) present a low risk to users. General wellness claims relate to maintaining or encouraging a general state of health or well-being.',
          ruleSource: 'FDA General Wellness: Policy for Low Risk Devices (2019)'
        }
      },
      {
        id: 'low_risk_medical',
        text: 'Low-risk medical functions (e.g., medication reminders)',
        result: {
          class: 'Class A',
          rule: 'Mobile Medical App - Low Risk (Enforcement Discretion)',
          description: 'Low-risk mobile medical apps require basic quality management and software lifecycle processes. Must comply with data privacy and cybersecurity requirements.',
          ruleText: 'FDA intends to exercise enforcement discretion for mobile apps that: provide simple tools for organizing and tracking health information, provide access to information related to health conditions, help patients document their condition for later review.',
          ruleSource: 'FDA Policy for Device Software Functions and Mobile Medical Applications (2019)'
        }
      },
      {
        id: 'moderate_risk_medical',
        text: 'Moderate-risk medical functions (e.g., clinical decision support)',
        result: {
          class: 'Class B',
          rule: 'Mobile Medical App - Moderate Risk (510(k))',
          description: 'Moderate-risk mobile medical apps require enhanced software validation, clinical evidence, cybersecurity measures, and post-market surveillance.',
          ruleText: 'Software functions that provide patient-specific analysis and recommendations to healthcare providers for use in clinical decision making are subject to FDA oversight. Such functions are typically Class II devices requiring 510(k) clearance.',
          ruleSource: 'FDA Policy for Device Software Functions and Mobile Medical Applications (2019)'
        }
      },
      {
        id: 'high_risk_medical',
        text: 'High-risk medical functions (e.g., diagnostic algorithms)',
        result: {
          class: 'Class C',
          rule: 'Mobile Medical App - High Risk (PMA/De Novo)',
          description: 'High-risk mobile medical apps require comprehensive clinical validation, algorithm transparency, cybersecurity compliance, and continuous performance monitoring.',
          ruleText: 'Mobile apps that provide diagnostic functions in critical or serious healthcare situations, or that directly influence treatment decisions, are classified as Class III devices requiring PMA or De Novo classification pathway.',
          ruleSource: 'FDA Policy for Device Software Functions and Mobile Medical Applications (2019)'
        }
      }
    ]
  }
};