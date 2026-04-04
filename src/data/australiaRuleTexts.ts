export interface AustraliaRule {
  id: string;
  title: string;
  text: string;
  source: string;
}

export const australiaRuleTexts: Record<string, AustraliaRule> = {
  'rule_1': {
    id: 'rule_1',
    title: 'Rule 1 - Non-invasive devices',
    text: 'A medical device that is non-invasive is classified as Class I unless a higher classification is specified under these Rules.',
    source: 'TGA Therapeutic Goods (Medical Devices) Regulations 2002 - Schedule 2, Rule 1'
  },
  'rule_2': {
    id: 'rule_2',
    title: 'Rule 2 - Non-invasive devices channelling substances',
    text: 'A medical device that is non-invasive and intended for channelling or storing body liquids or tissues, gases or other substances to or from the body, or for storing or channelling body liquids or tissues is classified as Class IIa unless the device is intended to be used with a Class III or Class IIb medical device, in which case it is classified as Class IIb.',
    source: 'TGA Therapeutic Goods (Medical Devices) Regulations 2002 - Schedule 2, Rule 2'
  },
  'rule_3': {
    id: 'rule_3',
    title: 'Rule 3 - Modifying biological/chemical composition',
    text: 'A medical device that is non-invasive and intended to modify the biological or chemical composition of body liquids or tissues, gases or other liquids intended for infusion into the body is classified as Class IIb, unless the treatment involves filtration, centrifugation or exchanges of gas or heat, in which case it is classified as Class IIa.',
    source: 'TGA Therapeutic Goods (Medical Devices) Regulations 2002 - Schedule 2, Rule 3'
  },
  'rule_4': {
    id: 'rule_4',
    title: 'Rule 4 - Invasive devices - body orifices',
    text: 'A medical device that is invasive with respect to a body orifice and is not a surgically invasive device is classified as Class I if it is intended for transient use, unless it is intended for use in the oral cavity as far as the pharynx, in an ear canal up to the ear drum or in the nasal cavity, in which case it is classified as Class IIa.',
    source: 'TGA Therapeutic Goods (Medical Devices) Regulations 2002 - Schedule 2, Rule 4'
  },
  'rule_5': {
    id: 'rule_5',
    title: 'Rule 5 - Surgically invasive devices',
    text: 'A medical device that is surgically invasive and intended for short term use is classified as Class IIa unless it is intended specifically to diagnose, monitor or correct a defect of the heart or of the central circulatory system through direct contact with these parts of the body, in which case it is classified as Class III.',
    source: 'TGA Therapeutic Goods (Medical Devices) Regulations 2002 - Schedule 2, Rule 5'
  },
  'rule_6': {
    id: 'rule_6',
    title: 'Rule 6 - Implantable devices',
    text: 'A medical device that is an implant or is a long term surgically invasive device is classified as Class IIb unless it is intended to be placed in the teeth, in which case it is classified as Class IIa, or it is intended to be used in direct contact with the heart, the central circulatory system or the central nervous system, in which case it is classified as Class III.',
    source: 'TGA Therapeutic Goods (Medical Devices) Regulations 2002 - Schedule 2, Rule 6'
  },
  'rule_7': {
    id: 'rule_7',
    title: 'Rule 7 - Active therapeutic devices',
    text: 'A medical device that is an active therapeutic device intended to administer or exchange energy is classified as Class IIa unless its characteristics are such that it may administer or exchange energy to or with the human body in a potentially hazardous way, taking account of the nature, the density and site of application of the energy, in which case it is classified as Class IIb.',
    source: 'TGA Therapeutic Goods (Medical Devices) Regulations 2002 - Schedule 2, Rule 7'
  }
};

export const getRuleText = (ruleId: string): AustraliaRule | null => {
  return australiaRuleTexts[ruleId] || null;
};

export const getRuleByNumber = (ruleNumber: number | string): AustraliaRule | null => {
  const ruleId = `rule_${ruleNumber}`;
  return getRuleText(ruleId);
};
