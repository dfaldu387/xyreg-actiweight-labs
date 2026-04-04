export interface SwitzerlandRule {
  id: string;
  title: string;
  text: string;
  source: string;
}

// Swiss Medical Devices Ordinance (MepV/MedDO - SR 812.213) Rule Texts
// Based on Annex VIII classification rules (aligned with EU MDR structure)
export const switzerlandRuleTexts: Record<string, SwitzerlandRule> = {
  'rule_1': {
    id: 'rule_1',
    title: 'Rule 1 - Non-invasive devices',
    text: 'All non-invasive devices are in Class I, unless one of the rules set out hereinafter applies.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 1'
  },
  'rule_2': {
    id: 'rule_2',
    title: 'Rule 2 - Channelling or storing',
    text: 'All non-invasive devices intended for channelling or storing blood, body liquids, cells or tissues, liquids or gases for the purpose of eventual infusion, administration or introduction into the body are in Class IIa if they may be connected to a Class IIa, Class IIb or Class III active device, or if they are intended for use for channelling or storing blood or other body liquids or for storing organs, parts of organs or body cells and tissues, except for blood bags which are Class IIb. In all other cases they are in Class I.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 2'
  },
  'rule_3': {
    id: 'rule_3',
    title: 'Rule 3 - Modifying biological/chemical composition',
    text: 'All non-invasive devices intended for modifying the biological or chemical composition of human tissues or cells, blood, other body liquids or other liquids intended for implantation or administration into the body are in Class IIb. If the treatment for which the device is used consists of filtration, centrifugation or exchanges of gas, heat, or if the device is used for treatment of blood intended for imminent transfusion where no substances are added, it is in Class IIa.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 3'
  },
  'rule_4': {
    id: 'rule_4',
    title: 'Rule 4 - Contact with injured skin',
    text: 'All non-invasive devices which come into contact with injured skin are in Class I if they are intended to be used as a mechanical barrier, for compression or for absorption of exudates. They are in Class IIb if they are intended to be used principally for wounds which have breached the dermis and can only heal by secondary intent. They are in Class IIa in all other cases, including devices principally intended to manage the micro-environment of a wound.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 4'
  },
  'rule_5': {
    id: 'rule_5',
    title: 'Rule 5 - Devices invasive to body orifices',
    text: 'All invasive devices with respect to body orifices, other than surgically invasive devices, which are not intended for connection to an active device or which are intended for connection to a Class I active device: are in Class I if they are intended for transient use; are in Class IIa if they are intended for short-term use, except if they are used in the oral cavity as far as the pharynx, in an ear canal up to the ear drum or in a nasal cavity, in which case they are in Class I; are in Class IIb if they are intended for long-term use.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 5'
  },
  'rule_6': {
    id: 'rule_6',
    title: 'Rule 6 - Surgically invasive devices for transient use',
    text: 'All surgically invasive devices intended for transient use are in Class IIa unless they are specifically intended to control, diagnose, monitor or correct a defect of the heart or of the central circulatory system through direct contact with those parts of the body, in which case they are in Class III; or they are reusable surgical instruments, in which case they are in Class I; or they are specifically intended for use in direct contact with the central nervous system, in which case they are in Class III.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 6'
  },
  'rule_7': {
    id: 'rule_7',
    title: 'Rule 7 - Surgically invasive devices for short-term use',
    text: 'All surgically invasive devices intended for short-term use are in Class IIa unless they are specifically intended to control, diagnose, monitor or correct a defect of the heart or of the central circulatory system through direct contact with those parts of the body, in which case they are in Class III; or they are specifically intended for use in direct contact with the central nervous system, in which case they are in Class III; or they are intended to supply energy in the form of ionizing radiation, in which case they are in Class IIb; or they have a biological effect or are wholly or mainly absorbed, in which case they are in Class III.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 7'
  },
  'rule_8': {
    id: 'rule_8',
    title: 'Rule 8 - Implantable devices and long-term surgically invasive',
    text: 'All implantable devices and long-term surgically invasive devices are in Class IIb unless they are intended to be placed in the teeth, in which case they are in Class IIa; or they are intended to be used in direct contact with the heart, the central circulatory system or the central nervous system, in which case they are in Class III; or they have a biological effect or are wholly or mainly absorbed, in which case they are in Class III; or they are intended to undergo chemical change in the body, in which case they are in Class III; or they are intended to administer medicinal products, in which case they are in Class III; or they are active implantable devices or their accessories, in which case they are in Class III; or they are breast implants, total or partial joint replacements, or spinal disc replacement implants, in which case they are in Class III.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 8'
  },
  'rule_9': {
    id: 'rule_9',
    title: 'Rule 9 - Active therapeutic devices',
    text: 'All active therapeutic devices intended to administer or exchange energy are in Class IIa unless their characteristics are such that they may administer energy to or exchange energy with the human body in a potentially hazardous way, in which case they are in Class IIb. All active devices intended to control or monitor the performance of active therapeutic Class IIb devices, or intended directly to influence the performance of such devices are in Class IIb.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 9'
  },
  'rule_10': {
    id: 'rule_10',
    title: 'Rule 10 - Active diagnostic devices',
    text: 'Active devices intended for diagnosis and monitoring are in Class IIa if they are intended to supply energy which will be absorbed by the human body, except for devices used to illuminate the patient\'s body in the visible spectrum; if they are intended to image in vivo distribution of radiopharmaceuticals; if they are intended to allow direct diagnosis or monitoring of vital physiological processes. They are in Class IIb if they are specifically intended to monitor vital physiological parameters where variations could result in immediate danger to the patient, such as variations in cardiac performance, respiration, or CNS activity.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 10'
  },
  'rule_11': {
    id: 'rule_11',
    title: 'Rule 11 - Software devices',
    text: 'Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is in Class IIa, except if such decisions have an impact that may cause death or irreversible deterioration of health, in which case it is in Class III; or if such decisions may cause serious deterioration of health or surgical intervention, in which case it is in Class IIb. Software intended to monitor physiological processes is in Class IIa, except if it is intended for monitoring of vital physiological parameters where variations could result in immediate danger, in which case it is in Class IIb. All other software is in Class I.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 11'
  },
  'rule_12': {
    id: 'rule_12',
    title: 'Rule 12 - Active devices administering substances',
    text: 'All active devices intended to administer and/or remove medicinal products, body liquids or other substances to or from the body are in Class IIa unless this is done in a manner that is potentially hazardous, in which case they are in Class IIb.',
    source: 'Swiss Medical Devices Ordinance (MedDO/MepV) - Annex VIII, Rule 12'
  }
};

export const getSwitzerlandRuleText = (ruleId: string): SwitzerlandRule | null => {
  return switzerlandRuleTexts[ruleId] || null;
};

export const getSwitzerlandRuleByNumber = (ruleNumber: number | string): SwitzerlandRule | null => {
  const ruleId = `rule_${ruleNumber}`;
  return getSwitzerlandRuleText(ruleId);
};
