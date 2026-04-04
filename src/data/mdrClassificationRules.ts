import { Question, ClassificationResult } from '@/types/classification';

export const classificationQuestions: Record<string, Question> = {
  initial: {
    id: 'initial',
    text: 'Is this product a medical device?',
    description: 'A medical device is defined under MDR Article 2(1) as any instrument, apparatus, appliance, software, implant, reagent, material or other article intended by the manufacturer for use in human beings for medical purposes.',
    helpText: 'Medical purposes include diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of disease, injury or disability.',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is a medical device',
        nextQuestionId: 'principal_mode_of_action'
      },
      {
        id: 'no',
        text: 'No, this is not a medical device',
        result: {
          class: 'Not a medical device',
          rule: 'MDR Article 2(1)',
          description: 'Product does not meet the definition of a medical device under the Medical Device Regulation.',
          ruleText: '"Medical device" means any instrument, apparatus, appliance, software, implant, reagent, material or other article intended by the manufacturer to be used, alone or in combination, for human beings for one or more of the following specific medical purposes: diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of disease; diagnosis, monitoring, treatment, alleviation of, or compensation for, an injury or disability; investigation, replacement or modification of the anatomy or of a physiological or pathological process or state; providing information by means of in vitro examination of specimens derived from the human body, including organ, blood and tissue donations.',
          ruleSource: 'EU MDR 2017/745, Article 2(1)'
        }
      },
      {
        id: 'unsure',
        text: 'I\'m not sure',
        nextQuestionId: 'principal_mode_of_action'
      }
    ]
  },

  principal_mode_of_action: {
    id: 'principal_mode_of_action',
    text: 'Does the product achieve its principal intended action by pharmacological, immunological, or metabolic means?',
    description: 'Pharmacological means an interaction between the molecules of the substance in question and a cellular constituent of the user\'s body. Immunological means an action in or on the body by stimulating or mobilising cells or products of the immune system. Metabolic means an action that involves an alteration of a physiological function by an effect on the body\'s metabolism.',
    helpText: 'Medical devices typically achieve their principal action by other means (e.g., physical, mechanical, software-driven). They can be assisted by pharmacological, immunological, or metabolic means, but these should not be the principal mode of action defining the product.',
    options: [
      {
        id: 'yes_pharma_immuno_metabolic',
        text: 'Yes, its principal action is through these means',
        result: {
          class: 'Consultation required',
          rule: 'MDR Article 2(1)',
          description: 'Product may not be a medical device if its principal intended action is pharmacological, immunological, or metabolic. It might be a medicinal product or other regulated product. Consultation with a regulatory expert is advised.',
          ruleText: 'A product which achieves its principal intended action in or on the human body by pharmacological, immunological or metabolic means is not a medical device but may be a medicinal product as defined in Directive 2001/83/EC. Medical devices may be assisted in their function by pharmacological, immunological or metabolic means, but these should not be the principal mode of action.',
          ruleSource: 'EU MDR 2017/745, Article 2(1) and Directive 2001/83/EC'
        }
      },
      {
        id: 'no_other_means',
        text: 'No, its principal action is by other means',
        nextQuestionId: 'duration_contact'
      }
    ]
  },

  duration_contact: {
    id: 'duration_contact',
    text: 'What is the duration of contact with the patient or user?',
    description: 'Consider how long the device is intended to be in contact with the patient during normal use.',
    options: [
      {
        id: 'transient',
        text: 'Transient use (≤ 60 minutes)',
        nextQuestionId: 'invasiveness'
      },
      {
        id: 'short_term',
        text: 'Short term (> 60 minutes to 30 days)',
        nextQuestionId: 'invasiveness'
      },
      {
        id: 'long_term',
        text: 'Long term (> 30 days)',
        nextQuestionId: 'invasiveness'
      }
    ]
  },

  invasiveness: {
    id: 'invasiveness',
    text: 'Is the device invasive?',
    description: 'An invasive device partially or wholly penetrates the body, either through a body orifice or through the surface of the body.',
    options: [
      {
        id: 'non_invasive',
        text: 'Non-invasive',
        nextQuestionId: 'active_device'
      },
      {
        id: 'invasive',
        text: 'Invasive',
        nextQuestionId: 'surgically_invasive'
      }
    ]
  },

  surgically_invasive: {
    id: 'surgically_invasive',
    text: 'Is the device surgically invasive?',
    description: 'A surgically invasive device penetrates the body through the surface of the body with the aid or in the context of a surgical operation.',
    options: [
      {
        id: 'yes',
        text: 'Yes, surgically invasive',
        nextQuestionId: 'implantable'
      },
      {
        id: 'no',
        text: 'No, not surgically invasive',
        nextQuestionId: 'body_orifice'
      }
    ]
  },

  implantable: {
    id: 'implantable',
    text: 'Is the device implantable?',
    description: 'An implantable device is intended to be totally or partially introduced into the human body or to replace an epithelial surface or eye surface through clinical intervention and remain in place after the procedure.',
    options: [
      {
        id: 'yes',
        text: 'Yes, implantable',
        nextQuestionId: 'active_implantable'
      },
      {
        id: 'no',
        text: 'No, not implantable',
        nextQuestionId: 'cardiovascular_system'
      }
    ]
  },

  active_implantable: {
    id: 'active_implantable',
    text: 'Is this an active implantable device?',
    description: 'An active implantable device relies on a source of energy other than that directly generated by the human body or gravity.',
    options: [
      {
        id: 'yes',
        text: 'Yes, active implantable',
        result: {
          class: 'Class III',
          rule: 'MDR Annex VIII, Rule 9',
          description: 'All active implantable medical devices are classified as Class III.',
          ruleText: 'All active implantable devices and their accessories shall be classified as Class III.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 6.2, Rule 9'
        }
      },
      {
        id: 'no',
        text: 'No, not active implantable',
        nextQuestionId: 'cardiovascular_system'
      }
    ]
  },

  cardiovascular_system: {
    id: 'cardiovascular_system',
    text: 'Does the device come into contact with the cardiovascular system?',
    description: 'Consider if the device is intended to be used in direct contact with the heart, central circulatory system, or central nervous system.',
    options: [
      {
        id: 'yes',
        text: 'Yes, contacts cardiovascular system',
        result: {
          class: 'Class III',
          rule: 'MDR Annex VIII, Rule 6',
          description: 'Surgically invasive devices intended for contact with the cardiovascular system are Class III.',
          ruleText: 'All surgically invasive devices intended for transient use are in Class IIa unless they are: (a) intended specifically to control, diagnose, monitor or correct a defect of the heart or of the central circulatory system through direct contact with those parts of the body, in which case they are in Class III; (b) reusable surgical instruments, in which case they are in Class I.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 5.2, Rule 6(a)'
        }
      },
      {
        id: 'no',
        text: 'No, does not contact cardiovascular system',
        nextQuestionId: 'central_nervous_system'
      }
    ]
  },

  central_nervous_system: {
    id: 'central_nervous_system',
    text: 'Does the device come into contact with the central nervous system?',
    description: 'Consider if the device is intended to be used in direct contact with the brain, spinal cord, or meninges.',
    options: [
      {
        id: 'yes',
        text: 'Yes, contacts central nervous system',
        result: {
          class: 'Class III',
          rule: 'MDR Annex VIII, Rule 6',
          description: 'Surgically invasive devices intended for contact with the central nervous system are Class III.',
          ruleText: 'All surgically invasive devices intended for transient use are in Class IIa unless they are intended specifically for use in direct contact with the central nervous system, in which case they are in Class III.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 5.2, Rule 6(c)'
        }
      },
      {
        id: 'no',
        text: 'No, does not contact central nervous system',
        nextQuestionId: 'reusable_surgical'
      }
    ]
  },

  reusable_surgical: {
    id: 'reusable_surgical',
    text: 'Is this a reusable surgical instrument?',
    description: 'Reusable surgical instruments are intended for surgical purposes to cut, drill, saw, scratch, scrape, clamp, retract, clip or perform similar procedures, without connection to any active device.',
    options: [
      {
        id: 'yes',
        text: 'Yes, reusable surgical instrument',
        nextQuestionId: 'classI_subcategory'
      },
      {
        id: 'no',
        text: 'No, not a reusable surgical instrument',
        result: {
          class: 'Class IIa',
          rule: 'MDR Annex VIII, Rule 5',
          description: 'Surgically invasive devices for transient use or short-term use are generally Class IIa.',
          ruleText: 'All invasive devices with respect to body orifices, other than surgically invasive devices, which are not intended for connection to an active device or which are intended for connection to a Class I active device are in Class I if they are intended for transient use. All invasive devices with respect to body orifices, other than surgically invasive devices, intended for short-term use, are in Class IIa, except if they are used in the oral cavity as far as the pharynx, in an ear canal up to the ear drum or in the nasal cavity, in which case they are in Class I.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 5.1, Rule 5'
        }
      }
    ]
  },

  body_orifice: {
    id: 'body_orifice',
    text: 'Does the device enter the body through a body orifice?',
    description: 'Consider natural body openings such as mouth, nose, ears, eyes, or other natural openings.',
    options: [
      {
        id: 'yes',
        text: 'Yes, enters through body orifice',
        nextQuestionId: 'pharynx_ear_canal'
      },
      {
        id: 'no',
        text: 'No, does not enter body orifice',
        nextQuestionId: 'classI_subcategory'
      }
    ]
  },

  pharynx_ear_canal: {
    id: 'pharynx_ear_canal',
    text: 'Does the device go beyond the pharynx, ear canal, or nasal cavity?',
    description: 'Consider if the device penetrates deeper into the body beyond these initial entry points.',
    options: [
      {
        id: 'yes',
        text: 'Yes, goes beyond these areas',
        result: {
          class: 'Class IIa',
          rule: 'MDR Annex VIII, Rule 4',
          description: 'Invasive devices with respect to body orifices that go beyond the pharynx, ear canal, or nasal cavity are Class IIa.',
          ruleText: 'All non-invasive devices which come into contact with injured skin are in Class I if they are intended to be used as a mechanical barrier, for compression or for absorption of exudates. Such devices are in Class IIb if they are intended to be used principally for wounds which have breached the dermis and can only heal by secondary intent. All other such devices are in Class IIa, including devices principally intended to manage the micro-environment of a wound.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 4.2, Rule 4'
        }
      },
      {
        id: 'no',
        text: 'No, remains in these areas',
        nextQuestionId: 'classI_subcategory'
      }
    ]
  },

  active_device: {
    id: 'active_device',
    text: 'Is this an active device?',
    description: 'An active device relies on a source of energy other than that directly generated by the human body or gravity.',
    options: [
      {
        id: 'yes',
        text: 'Yes, active device',
        nextQuestionId: 'therapeutic_active'
      },
      {
        id: 'no',
        text: 'No, non-active device',
        nextQuestionId: 'classI_subcategory'
      }
    ]
  },

  therapeutic_active: {
    id: 'therapeutic_active',
    text: 'Is this an active therapeutic device?',
    description: 'An active therapeutic device is intended to administer or exchange energy, substances or other elements between the device and the patient.',
    options: [
      {
        id: 'yes',
        text: 'Yes, active therapeutic device',
        result: {
          class: 'Class IIa',
          rule: 'MDR Annex VIII, Rule 10',
          description: 'Active therapeutic devices intended to administer or exchange energy are generally Class IIa.',
          ruleText: 'Active devices intended for diagnosis and monitoring are in Class IIa: if they are intended to supply energy which will be absorbed by the human body, except for devices intended to illuminate the patient\'s body in the visible spectrum, in which case they are in Class I; if they are intended to image in vivo distribution of radiopharmaceuticals; if they are intended to allow direct diagnosis or monitoring of vital physiological processes, unless they are specifically intended for monitoring of vital physiological parameters where the nature of variations of those parameters is such that it could result in immediate danger to the patient, for instance variations in cardiac performance, respiration, activity of the central nervous system, or they are intended for diagnosis in clinical situations where the patient is in immediate danger, in which case they are in Class IIb.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 6.3, Rule 10'
        }
      },
      {
        id: 'no',
        text: 'No, active diagnostic device',
        nextQuestionId: 'ionizing_radiation'
      }
    ]
  },

  ionizing_radiation: {
    id: 'ionizing_radiation',
    text: 'Does the device emit ionizing radiation?',
    description: 'Consider if the device produces X-rays, gamma rays, or other forms of ionizing radiation.',
    options: [
      {
        id: 'yes',
        text: 'Yes, emits ionizing radiation',
        result: {
          class: 'Class IIb',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'Active devices intended to emit ionizing radiation for diagnostic purposes are Class IIb.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as Class IIa, except if such decisions have an impact that may cause: death or an irreversible deterioration of a person\'s state of health, in which case it is in Class III; or a serious deterioration of a person\'s state of health or a surgical intervention, in which case it is classified as Class IIb. Software intended to monitor physiological processes is classified as Class IIa, except if it is intended for monitoring of vital physiological parameters, where the nature of variations of those parameters is such that it could result in immediate danger to the patient, in which case it is classified as Class IIb. All other software is classified as Class I.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 6.3, Rule 11'
        }
      },
      {
        id: 'no',
        text: 'No, does not emit ionizing radiation',
        nextQuestionId: 'software_check'
      }
    ]
  },

  // Software-specific classification questions
  software_check: {
    id: 'software_check',
    text: 'Is this software as a medical device (SaMD)?',
    description: 'Software as a Medical Device (SaMD) is software intended to be used for one or more medical purposes that perform these purposes without being part of a hardware medical device.',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is SaMD',
        nextQuestionId: 'software_risk_category'
      },
      {
        id: 'no',
        text: 'No, not SaMD',
        nextQuestionId: 'classI_subcategory'
      }
    ]
  },

  software_risk_category: {
    id: 'software_risk_category',
    text: 'What is the SaMD risk categorization?',
    description: 'Based on the healthcare decision and healthcare situation that the SaMD informs or drives.',
    options: [
      {
        id: 'class_I',
        text: 'Class I SaMD - Low risk (inform healthcare decision, non-serious situation)',
        result: {
          class: 'Class I',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'Software as Medical Device (SaMD) that provides information to inform healthcare decisions in non-serious healthcare situations.',
          ruleText: 'All other software is classified as Class I. This includes software that does not provide information for diagnosis or therapeutic purposes and does not monitor physiological parameters.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 6.3, Rule 11'
        }
      },
      {
        id: 'class_IIa',
        text: 'Class IIa SaMD - Medium-low risk (inform healthcare decision, serious situation OR drive healthcare decision, non-serious situation)',
        result: {
          class: 'Class IIa',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'Software as Medical Device (SaMD) that either informs healthcare decisions in serious situations or drives healthcare decisions in non-serious situations.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as Class IIa. Software intended to monitor physiological processes is classified as Class IIa, except if it is intended for monitoring of vital physiological parameters, where the nature of variations of those parameters is such that it could result in immediate danger to the patient.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 6.3, Rule 11'
        }
      },
      {
        id: 'class_IIb',
        text: 'Class IIb SaMD - Medium-high risk (drive healthcare decision, serious situation)',
        result: {
          class: 'Class IIb',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'Software as Medical Device (SaMD) that drives healthcare decisions in serious healthcare situations.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as Class IIb if such decisions have an impact that may cause a serious deterioration of a person\'s state of health or a surgical intervention. Software intended to monitor physiological processes is classified as Class IIb if it is intended for monitoring of vital physiological parameters, where the nature of variations of those parameters is such that it could result in immediate danger to the patient.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 6.3, Rule 11'
        }
      },
      {
        id: 'class_III',
        text: 'Class III SaMD - High risk (drive healthcare decision, critical situation)',
        result: {
          class: 'Class III',
          rule: 'MDR Annex VIII, Rule 11',
          description: 'Software as Medical Device (SaMD) that drives healthcare decisions in critical healthcare situations.',
          ruleText: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as Class III if such decisions have an impact that may cause death or an irreversible deterioration of a person\'s state of health.',
          ruleSource: 'EU MDR 2017/745, Annex VIII, Section 6.3, Rule 11'
        }
      }
    ]
  },

  // Class I Subcategory Questions
  classI_subcategory: {
    id: 'classI_subcategory',
    text: 'Based on the MDR rules, your device appears to be Class I. Now let\'s determine the specific subcategory.',
    description: 'Class I devices may have additional requirements based on sterility, measuring function, or if they are reusable surgical instruments.',
    options: [
      {
        id: 'continue',
        text: 'Continue to determine subcategory',
        nextQuestionId: 'classI_sterile'
      }
    ]
  },

  classI_sterile: {
    id: 'classI_sterile',
    text: 'Is the device delivered in a sterile condition?',
    description: 'Class Is devices are Class I devices that are delivered sterile or have a sterilizing function.',
    options: [
      {
        id: 'yes',
        text: 'Yes, delivered sterile',
        nextQuestionId: 'classI_measuring'
      },
      {
        id: 'no',
        text: 'No, not delivered sterile',
        nextQuestionId: 'classI_measuring'
      }
    ]
  },

  classI_measuring: {
    id: 'classI_measuring',
    text: 'Does the device have a measuring function that is critical to patient safety?',
    description: 'Class Im devices are Class I devices with a measuring function where the accuracy of measurement is critical to patient safety.',
    options: [
      {
        id: 'yes',
        text: 'Yes, has critical measuring function',
        nextQuestionId: 'classI_reusable'
      },
      {
        id: 'no',
        text: 'No, no critical measuring function',
        nextQuestionId: 'classI_reusable'
      }
    ]
  },

  classI_reusable: {
    id: 'classI_reusable',
    text: 'Is this a reusable surgical instrument?',
    description: 'Class Ir devices are reusable surgical instruments intended for surgical purposes.',
    options: [
      {
        id: 'yes',
        text: 'Yes, reusable surgical instrument',
        nextQuestionId: 'final_classification'
      },
      {
        id: 'no',
        text: 'No, not a reusable surgical instrument',
        nextQuestionId: 'final_classification'
      }
    ]
  },

  final_classification: {
    id: 'final_classification',
    text: 'Classification Complete',
    description: 'Based on your answers, we have determined the classification of your device.',
    options: []
  }
};

// Helper function to determine Class I subcategory
export function determineClassISubcategory(
  sterile: boolean,
  measuring: boolean,
  reusable: boolean
): ClassificationResult {
  const subcategories: string[] = [];
  
  if (sterile) subcategories.push('Class Is (Sterile)');
  if (measuring) subcategories.push('Class Im (Measuring)');
  if (reusable) subcategories.push('Class Ir (Reusable surgical)');
  
  let finalClass: string;
  let rule: string;
  let description: string;
  let ruleText: string;
  let ruleSource: string;
  
  if (subcategories.length === 0) {
    finalClass = 'Class I';
    rule = 'MDR Annex VIII, Rule 1';
    description = 'Class I medical device with no additional conformity assessment requirements beyond CE marking.';
    ruleText = 'All non-invasive devices are in Class I, unless one of the rules set out hereinafter applies.';
    ruleSource = 'EU MDR 2017/745, Annex VIII, Section 4.1, Rule 1';
  } else {
    finalClass = subcategories.join(', ');
    rule = 'MDR Annex VIII, Rules 1-3';
    
    const requirements: string[] = [];
    const ruleTexts: string[] = [];
    if (sterile) {
      requirements.push('Notified Body involvement for sterility aspects');
      ruleTexts.push('Devices placed on the market in a sterile condition require involvement of a Notified Body for aspects relating to establishing, securing, and maintaining sterile conditions.');
    }
    if (measuring) {
      requirements.push('Notified Body involvement for measuring function');
      ruleTexts.push('Devices with a measuring function require involvement of a Notified Body for aspects relating to the conformity of the devices with the metrological requirements.');
    }
    if (reusable) {
      requirements.push('Notified Body involvement for reusable surgical instruments');
      ruleTexts.push('Reusable surgical instruments require involvement of a Notified Body for aspects relating to the reuse of the device, in particular cleaning, disinfection, sterilisation, maintenance and functional testing.');
    }
    
    description = `Class I medical device with additional requirements: ${requirements.join(', ')}.`;
    ruleText = ruleTexts.join(' ');
    ruleSource = 'EU MDR 2017/745, Annex VIII, Section 4.1, Rules 1-3 and Article 52(7)';
  }
  
  return {
    class: finalClass as any,
    rule,
    description,
    ruleText,
    ruleSource
  };
}
