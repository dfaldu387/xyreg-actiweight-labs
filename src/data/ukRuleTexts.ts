export interface UKRule {
  id: string;
  title: string;
  text: string;
  source: string;
}

export const ukRuleTexts: Record<string, UKRule> = {
  'rule_1': {
    id: 'rule_1',
    title: 'Rule 1 - Non-invasive devices',
    text: 'All non-invasive devices are in Class I, unless one of the rules set out hereinafter applies.',
    source: 'UK Medical Devices Regulations 2002 (as amended) - Schedule 1, Rule 1'
  },
  'rule_2': {
    id: 'rule_2',
    title: 'Rule 2 - Channelling or storing',
    text: 'All non-invasive devices intended for channelling or storing blood, body liquids or tissues, liquids or gases for the purpose of eventual infusion, administration or introduction into the body are in Class IIa if they may be connected to a Class IIa, Class IIb or Class III active device, or in Class I in all other cases.',
    source: 'UK Medical Devices Regulations 2002 (as amended) - Schedule 1, Rule 2'
  },
  'rule_3': {
    id: 'rule_3',
    title: 'Rule 3 - Modifying biological/chemical composition',
    text: 'All non-invasive devices intended for modifying the biological or chemical composition of blood, body liquids or other liquids intended for infusion into the body are in Class IIb, unless the treatment consists of filtration, centrifugation or exchanges of gas, heat, in which case they are in Class IIa.',
    source: 'UK Medical Devices Regulations 2002 (as amended) - Schedule 1, Rule 3'
  },
  'rule_4': {
    id: 'rule_4',
    title: 'Rule 4 - Contact with injured skin',
    text: 'All non-invasive devices which come into contact with injured skin are in Class I if they are intended to be used as a mechanical barrier, for compression or for absorption of exudates; or in Class IIb if they are intended to be used principally with wounds which have breached the dermis and can only heal by secondary intent; or in Class IIa in all other cases including devices principally intended to manage the micro-environment of a wound.',
    source: 'UK Medical Devices Regulations 2002 (as amended) - Schedule 1, Rule 4'
  },
  'rule_5': {
    id: 'rule_5',
    title: 'Rule 5 - Devices invasive to body orifices',
    text: 'All invasive devices with respect to body orifices, other than surgically invasive devices, which are intended for transient use are in Class I if they are not intended for use in the oral cavity as far as the pharynx, in an ear canal up to the ear drum or in the nasal cavity, in which case they are in Class IIa.',
    source: 'UK Medical Devices Regulations 2002 (as amended) - Schedule 1, Rule 5'
  },
  'rule_6': {
    id: 'rule_6',
    title: 'Rule 6 - Short-term surgically invasive devices',
    text: 'All surgically invasive devices intended for short-term use are in Class IIa unless they are intended specifically to control, diagnose, monitor or correct a defect of the heart or of the central circulatory system through direct contact with those parts of the body, in which case they are in Class III.',
    source: 'UK Medical Devices Regulations 2002 (as amended) - Schedule 1, Rule 6'
  },
  'rule_7': {
    id: 'rule_7',
    title: 'Rule 7 - Long-term surgically invasive devices',
    text: 'All surgically invasive devices intended for long-term use are in Class IIa unless they are intended to be placed in the teeth, in which case they are in Class IIa; or to be used in direct contact with the heart, the central circulatory system or the central nervous system, in which case they are in Class III; or to undergo chemical change in the body except if the devices are placed in the teeth, in which case they are in Class IIb; or to administer medicinal products, in which case they are in Class IIb.',
    source: 'UK Medical Devices Regulations 2002 (as amended) - Schedule 1, Rule 7'
  },
  'rule_8': {
    id: 'rule_8',
    title: 'Rule 8 - Implantable devices',
    text: 'All implantable devices and long-term surgically invasive devices are in Class IIb unless they are intended to be placed in the teeth, in which case they are in Class IIa; or to be used in direct contact with the heart, the central circulatory system or the central nervous system, in which case they are in Class III; or to undergo chemical change in the body except if the devices are placed in the teeth, in which case they are in Class III; or to administer medicinal products, in which case they are in Class III.',
    source: 'UK Medical Devices Regulations 2002 (as amended) - Schedule 1, Rule 8'
  }
};

export const getRuleText = (ruleId: string): UKRule | null => {
  return ukRuleTexts[ruleId] || null;
};

export const getRuleByNumber = (ruleNumber: number | string): UKRule | null => {
  const ruleId = `rule_${ruleNumber}`;
  return getRuleText(ruleId);
};
