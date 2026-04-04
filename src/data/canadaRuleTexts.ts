export interface CanadaRule {
  id: string;
  title: string;
  text: string;
  source: string;
}

export const canadaRuleTexts: Record<string, CanadaRule> = {
  'rule_1': {
    id: 'rule_1',
    title: 'Rule 1 - General',
    text: 'A device is in Class I if it is not in Class II, Class III or Class IV.',
    source: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1, Rule 1'
  },
  'rule_2': {
    id: 'rule_2',
    title: 'Rule 2 - Invasive Devices',
    text: 'A device is in Class II if it is invasive, is intended for short-term use and is a surgical instrument that may be reused, or is a device that is intended for short-term use and is invasive with respect to a body orifice or a topical body opening.',
    source: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1, Rule 2'
  },
  'rule_3': {
    id: 'rule_3',
    title: 'Rule 3 - Long-term Invasive Devices',
    text: 'A device is in Class III if it is invasive, is intended for long-term use, and may be used in contact with the circulatory system. A device is in Class IV if it is intended to be placed in the heart or in direct contact with the central nervous system.',
    source: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1, Rule 3'
  },
  'rule_4': {
    id: 'rule_4',
    title: 'Rule 4 - Active Therapeutic Devices',
    text: 'A device is in Class II if it is an active device for diagnosis or for monitoring of vital physiological processes unless it is intended specifically for monitoring of vital physiological parameters where variations in those parameters could result in immediate danger to the patient, in which case it is in Class III.',
    source: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1, Rule 4'
  },
  'rule_5': {
    id: 'rule_5',
    title: 'Rule 5 - Active Therapeutic Devices',
    text: 'A device is in Class III if it is an active device intended to administer or exchange drugs, body liquids or other substances to or from the body.',
    source: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1, Rule 5'
  },
  'rule_6': {
    id: 'rule_6',
    title: 'Rule 6 - Life-Sustaining/Life-Supporting',
    text: 'A device is in Class IV if it is used for life support or to sustain life and where failure of the device could result in death.',
    source: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1, Rule 6'
  },
  'rule_7': {
    id: 'rule_7',
    title: 'Rule 7 - Implantable Devices',
    text: 'A device is in Class III if it is intended to be totally or partially absorbed by the body or to remain in place for more than 30 days and is an implant.',
    source: 'Health Canada Medical Devices Regulations (SOR/98-282) - Schedule 1, Rule 7'
  }
};

export const getRuleText = (ruleId: string): CanadaRule | null => {
  return canadaRuleTexts[ruleId] || null;
};

export const getRuleByNumber = (ruleNumber: number | string): CanadaRule | null => {
  const ruleId = `rule_${ruleNumber}`;
  return getRuleText(ruleId);
};
