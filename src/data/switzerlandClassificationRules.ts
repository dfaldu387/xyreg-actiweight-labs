import { Question, ClassificationResult } from '@/types/classification';

// Switzerland Swissmedic Medical Device Classification Rules
// Based on Swiss Medical Devices Ordinance (MepV/MedDO - SR 812.213)
// Classification system aligned with EU MDR but administered independently by Swissmedic

export const switzerlandClassificationQuestions: Record<string, Question> = {
  initial: {
    id: 'initial',
    text: 'Is this product a medical device?',
    description: 'Under Swiss MedDO, a medical device is any instrument, apparatus, appliance, software, implant, reagent, material or other article intended by the manufacturer for use in human beings for medical purposes.',
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
          rule: 'Swiss MedDO Art. 3',
          description: 'Product does not meet the definition of a medical device under Swiss regulations.'
        }
      }
    ]
  },

  principal_mode_of_action: {
    id: 'principal_mode_of_action',
    text: 'Does the product achieve its principal intended action by pharmacological, immunological, or metabolic means?',
    description: 'Medical devices typically achieve their principal action by other means (e.g., physical, mechanical, software-driven). They can be assisted by pharmacological, immunological, or metabolic means, but these should not be the principal mode of action.',
    options: [
      {
        id: 'yes_pharma',
        text: 'Yes, its principal action is through these means',
        result: {
          class: 'Consultation required',
          rule: 'Swiss MedDO Art. 3',
          description: 'Product may not be a medical device if its principal intended action is pharmacological, immunological, or metabolic. Consultation with Swissmedic advised.'
        }
      },
      {
        id: 'no_other',
        text: 'No, its principal action is by other means',
        nextQuestionId: 'ivd_device'
      }
    ]
  },

  ivd_device: {
    id: 'ivd_device',
    text: 'Is this an in vitro diagnostic (IVD) medical device?',
    description: 'An IVD is a device intended for in vitro examination of specimens derived from the human body to provide information for diagnostic, monitoring, or compatibility purposes.',
    options: [
      {
        id: 'yes',
        text: 'Yes, this is an IVD device',
        result: {
          class: 'Not an IVD device',
          rule: 'Swiss IvDO',
          description: 'IVD devices are classified separately under the Swiss Ordinance on In Vitro Diagnostic Medical Devices (IvDO). Please use the IVD classification pathway.'
        }
      },
      {
        id: 'no',
        text: 'No, this is not an IVD device',
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
    description: 'A surgically invasive device penetrates the body through the surface with the aid or in the context of a surgical operation.',
    options: [
      {
        id: 'yes',
        text: 'Yes, surgically invasive',
        nextQuestionId: 'duration_surgical'
      },
      {
        id: 'no',
        text: 'No, not surgically invasive',
        nextQuestionId: 'body_orifice'
      }
    ]
  },

  duration_surgical: {
    id: 'duration_surgical',
    text: 'What is the intended duration of use?',
    description: 'Transient: intended for continuous use for less than 60 minutes. Short-term: intended for continuous use for not more than 30 days. Long-term: intended for continuous use for more than 30 days.',
    options: [
      {
        id: 'transient',
        text: 'Transient use (less than 60 minutes)',
        nextQuestionId: 'reusable_surgical'
      },
      {
        id: 'short_term',
        text: 'Short-term use (up to 30 days)',
        nextQuestionId: 'cardiovascular_system'
      },
      {
        id: 'long_term',
        text: 'Long-term use (more than 30 days) or implantable',
        nextQuestionId: 'implantable'
      }
    ]
  },

  implantable: {
    id: 'implantable',
    text: 'Is the device implantable?',
    description: 'An implantable device is intended to be totally or partially introduced into the human body or to replace an epithelial surface through clinical intervention and remain in place after the procedure.',
    options: [
      {
        id: 'yes',
        text: 'Yes, implantable',
        nextQuestionId: 'active_implantable'
      },
      {
        id: 'no',
        text: 'No, not implantable (but long-term use)',
        nextQuestionId: 'cardiovascular_long_term'
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
          rule: 'Swiss MedDO Annex VIII, Rule 8',
          description: 'All active implantable medical devices are classified as Class III under Swiss regulations.'
        }
      },
      {
        id: 'no',
        text: 'No, not active implantable',
        nextQuestionId: 'cardiovascular_long_term'
      }
    ]
  },

  cardiovascular_long_term: {
    id: 'cardiovascular_long_term',
    text: 'Is the device intended for direct contact with the heart, central circulatory system, or central nervous system?',
    description: 'Consider if the device is used in direct contact with the heart, central blood vessels, brain, spinal cord, or meninges.',
    options: [
      {
        id: 'yes',
        text: 'Yes, direct contact with heart/CNS',
        result: {
          class: 'Class III',
          rule: 'Swiss MedDO Annex VIII, Rule 7',
          description: 'Long-term surgically invasive devices intended for direct contact with the heart, central circulatory system, or central nervous system are Class III.'
        }
      },
      {
        id: 'no',
        text: 'No, no direct contact with these systems',
        nextQuestionId: 'biological_effect'
      }
    ]
  },

  biological_effect: {
    id: 'biological_effect',
    text: 'Does the device undergo chemical change in the body or is it intended to administer medicinal products?',
    description: 'Consider if the device is absorbed, degraded, or delivers drugs in a potentially hazardous manner.',
    options: [
      {
        id: 'yes',
        text: 'Yes, chemical change or drug delivery',
        result: {
          class: 'Class III',
          rule: 'Swiss MedDO Annex VIII, Rule 7',
          description: 'Implantable devices that undergo chemical change or administer medicinal products are Class III.'
        }
      },
      {
        id: 'no',
        text: 'No biological effect of this nature',
        nextQuestionId: 'breast_implant'
      }
    ]
  },

  breast_implant: {
    id: 'breast_implant',
    text: 'Is this a breast implant, hip/knee/shoulder joint replacement, or spinal disc replacement?',
    description: 'These specific implant types have special classification requirements.',
    options: [
      {
        id: 'yes',
        text: 'Yes, it is one of these specific implants',
        result: {
          class: 'Class III',
          rule: 'Swiss MedDO Annex VIII, Rule 8',
          description: 'Breast implants, total joint replacements, and spinal disc replacements are specifically Class III.'
        }
      },
      {
        id: 'no',
        text: 'No, it is another type of implant',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 8',
          description: 'Other implantable devices and long-term surgically invasive devices are generally Class IIb.'
        }
      }
    ]
  },

  cardiovascular_system: {
    id: 'cardiovascular_system',
    text: 'Does the device come into direct contact with the cardiovascular system or central nervous system?',
    description: 'Consider if the device is intended to be used in direct contact with the heart, central circulatory system, brain, or spinal cord.',
    options: [
      {
        id: 'yes',
        text: 'Yes, contacts cardiovascular/CNS',
        result: {
          class: 'Class III',
          rule: 'Swiss MedDO Annex VIII, Rule 6',
          description: 'Surgically invasive devices intended for short-term direct contact with the cardiovascular system or central nervous system are Class III.'
        }
      },
      {
        id: 'no',
        text: 'No, does not contact these systems',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 6',
          description: 'Surgically invasive devices for short-term use are generally Class IIa.'
        }
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
        result: {
          class: 'Class Ir (Reusable surgical)',
          rule: 'Swiss MedDO Annex VIII, Rule 6',
          description: 'Reusable surgical instruments are Class I with special requirements for reprocessing instructions.'
        }
      },
      {
        id: 'no',
        text: 'No, not a reusable surgical instrument',
        nextQuestionId: 'transient_diagnosis'
      }
    ]
  },

  transient_diagnosis: {
    id: 'transient_diagnosis',
    text: 'Is the device specifically intended to diagnose, monitor, or correct a defect of the heart or central circulatory system?',
    description: 'Even for transient use, devices interacting with critical systems may have higher classifications.',
    options: [
      {
        id: 'yes',
        text: 'Yes, for heart/circulatory diagnosis/correction',
        result: {
          class: 'Class III',
          rule: 'Swiss MedDO Annex VIII, Rule 6',
          description: 'Even transiently used devices specifically for diagnosing or correcting heart defects are Class III.'
        }
      },
      {
        id: 'no',
        text: 'No, general transient surgical use',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 5',
          description: 'Surgically invasive devices for transient use are generally Class IIa.'
        }
      }
    ]
  },

  body_orifice: {
    id: 'body_orifice',
    text: 'What is the intended duration of use through the body orifice?',
    description: 'Consider how long the device is intended to remain in the body orifice.',
    options: [
      {
        id: 'transient',
        text: 'Transient use (less than 60 minutes)',
        nextQuestionId: 'pharynx_ear_canal'
      },
      {
        id: 'short_term',
        text: 'Short-term use (up to 30 days)',
        nextQuestionId: 'pharynx_short_term'
      },
      {
        id: 'long_term',
        text: 'Long-term use (more than 30 days)',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 5',
          description: 'Invasive devices with respect to body orifices for long-term use are Class IIb.'
        }
      }
    ]
  },

  pharynx_ear_canal: {
    id: 'pharynx_ear_canal',
    text: 'Does the device go beyond the pharynx, ear drum, or nasal cavity?',
    description: 'Consider if the device penetrates deeper into the body beyond these initial entry points.',
    options: [
      {
        id: 'yes',
        text: 'Yes, goes beyond these areas',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 5',
          description: 'Invasive devices that go beyond the pharynx, ear drum, or nasal cavity are Class IIa.'
        }
      },
      {
        id: 'no',
        text: 'No, remains in these areas',
        result: {
          class: 'Class I',
          rule: 'Swiss MedDO Annex VIII, Rule 5',
          description: 'Invasive devices through body orifices that remain in pharynx, ear canal, or nasal cavity for transient use are Class I.'
        }
      }
    ]
  },

  pharynx_short_term: {
    id: 'pharynx_short_term',
    text: 'Does the device go beyond the pharynx, ear drum, or nasal cavity?',
    description: 'For short-term use, consider where in the body the device is placed.',
    options: [
      {
        id: 'yes',
        text: 'Yes, goes beyond these areas',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 5',
          description: 'Invasive devices for short-term use that go beyond the pharynx, ear drum, or nasal cavity are Class IIa.'
        }
      },
      {
        id: 'no',
        text: 'No, remains in these areas',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 5',
          description: 'Invasive devices through body orifices for short-term use are Class IIa.'
        }
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
        nextQuestionId: 'non_invasive_special'
      }
    ]
  },

  non_invasive_special: {
    id: 'non_invasive_special',
    text: 'What is the device\'s function?',
    description: 'Non-invasive devices are classified based on their specific function and intended use.',
    options: [
      {
        id: 'channelling',
        text: 'Channelling or storing blood/body liquids for infusion',
        nextQuestionId: 'connected_active'
      },
      {
        id: 'modifying',
        text: 'Modifying biological/chemical composition of blood or body liquids',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 3',
          description: 'Non-invasive devices for modifying biological/chemical composition of blood or body liquids are Class IIb (or Class IIa if treatment is filtration, centrifugation, or gas/heat exchange).'
        }
      },
      {
        id: 'wound_contact',
        text: 'Contact with injured skin (wound care)',
        nextQuestionId: 'wound_type'
      },
      {
        id: 'general',
        text: 'General non-invasive use',
        result: {
          class: 'Class I',
          rule: 'Swiss MedDO Annex VIII, Rule 1',
          description: 'Non-invasive devices that do not fall into specific higher risk categories are Class I.'
        }
      }
    ]
  },

  connected_active: {
    id: 'connected_active',
    text: 'May the device be connected to a Class IIa, IIb, or III active device?',
    description: 'Consider if the device is designed to be used with active medical devices.',
    options: [
      {
        id: 'yes',
        text: 'Yes, can connect to Class IIa, IIb, or III active device',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 2',
          description: 'Non-invasive devices for channelling or storing that may connect to Class IIa or higher active devices are Class IIa.'
        }
      },
      {
        id: 'no',
        text: 'No, standalone or connects to Class I only',
        result: {
          class: 'Class I',
          rule: 'Swiss MedDO Annex VIII, Rule 2',
          description: 'Non-invasive devices for channelling or storing that only connect to Class I devices are Class I.'
        }
      }
    ]
  },

  wound_type: {
    id: 'wound_type',
    text: 'What type of wound is the device intended for?',
    description: 'Classification depends on the wound severity and healing mechanism.',
    options: [
      {
        id: 'dermis_secondary',
        text: 'Wounds that have breached the dermis and heal by secondary intent',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 4',
          description: 'Devices for wounds that have breached the dermis and can only heal by secondary intent are Class IIb.'
        }
      },
      {
        id: 'micro_environment',
        text: 'Managing the micro-environment of wounds',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 4',
          description: 'Devices principally intended to manage the micro-environment of wounds are Class IIa.'
        }
      },
      {
        id: 'mechanical_barrier',
        text: 'Mechanical barrier, compression, or absorption of exudates',
        result: {
          class: 'Class I',
          rule: 'Swiss MedDO Annex VIII, Rule 4',
          description: 'Devices used as mechanical barriers, for compression, or absorption of exudates for minor wounds are Class I.'
        }
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
        nextQuestionId: 'energy_type'
      },
      {
        id: 'no',
        text: 'No, active diagnostic device',
        nextQuestionId: 'diagnostic_imaging'
      }
    ]
  },

  energy_type: {
    id: 'energy_type',
    text: 'What type of energy does the device administer or exchange?',
    description: 'The nature of energy and potential hazard determines the classification.',
    options: [
      {
        id: 'ionizing',
        text: 'Ionizing radiation',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 9',
          description: 'Active therapeutic devices intended to emit ionizing radiation are Class IIb.'
        }
      },
      {
        id: 'potentially_hazardous',
        text: 'Energy in a potentially hazardous manner (high intensity EMF, ultrasound, etc.)',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 9',
          description: 'Active therapeutic devices that administer or exchange energy in a potentially hazardous manner are Class IIb.'
        }
      },
      {
        id: 'controlled_drug',
        text: 'Controls/monitors infusion of potentially hazardous substances',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 9',
          description: 'Active devices intended to control or monitor infusion of potentially hazardous substances are Class IIb.'
        }
      },
      {
        id: 'general_therapeutic',
        text: 'General therapeutic energy (not hazardous)',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 9',
          description: 'Active therapeutic devices for administering or exchanging energy in a non-hazardous manner are Class IIa.'
        }
      }
    ]
  },

  diagnostic_imaging: {
    id: 'diagnostic_imaging',
    text: 'Is this an active device intended for diagnosis?',
    description: 'Consider what type of diagnostic function the device performs.',
    options: [
      {
        id: 'ionizing',
        text: 'Uses ionizing radiation',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 10',
          description: 'Active devices intended to emit ionizing radiation for diagnostic purposes are Class IIb.'
        }
      },
      {
        id: 'direct_diagnosis',
        text: 'Allows direct diagnosis or monitoring of vital functions',
        nextQuestionId: 'vital_functions'
      },
      {
        id: 'imaging',
        text: 'Supplies energy for imaging (non-ionizing)',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 10',
          description: 'Active devices that supply energy for imaging transmitted substances are Class IIa.'
        }
      },
      {
        id: 'general_diagnostic',
        text: 'General diagnostic function',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 10',
          description: 'Active diagnostic devices are generally Class IIa.'
        }
      }
    ]
  },

  vital_functions: {
    id: 'vital_functions',
    text: 'Is monitoring/diagnosis of vital physiological parameters where variations could result in immediate danger?',
    description: 'Consider parameters like cardiac function, respiration, or CNS activity.',
    options: [
      {
        id: 'yes',
        text: 'Yes, immediate danger from variations possible',
        result: {
          class: 'Class IIb',
          rule: 'Swiss MedDO Annex VIII, Rule 10',
          description: 'Active diagnostic devices for monitoring vital functions where variations could result in immediate danger are Class IIb.'
        }
      },
      {
        id: 'no',
        text: 'No, variations do not cause immediate danger',
        result: {
          class: 'Class IIa',
          rule: 'Swiss MedDO Annex VIII, Rule 10',
          description: 'Active diagnostic devices for general vital function monitoring are Class IIa.'
        }
      }
    ]
  }
};
