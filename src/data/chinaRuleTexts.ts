export interface ChinaRule {
  id: string;
  title: string;
  text: string;
  source: string;
}

export const chinaRuleTexts: Record<string, ChinaRule> = {
  'rule_class1': {
    id: 'rule_class1',
    title: 'Class I - Low Risk',
    text: 'Class I medical devices are those with low risk, where routine management is sufficient to ensure their safety and effectiveness. These devices have low potential risk to the human body.',
    source: 'China NMPA Medical Device Supervision Regulations - Article 5, Class I Definition'
  },
  'rule_class2': {
    id: 'rule_class2',
    title: 'Class II - Medium Risk',
    text: 'Class II medical devices are those with moderate risk, requiring control measures to ensure their safety and effectiveness. These devices have moderate potential risk to the human body and require product registration management.',
    source: 'China NMPA Medical Device Supervision Regulations - Article 5, Class II Definition'
  },
  'rule_class3': {
    id: 'rule_class3',
    title: 'Class III - High Risk',
    text: 'Class III medical devices are those with high risk, requiring special measures including strict control of their design, manufacturing, and use to ensure their safety and effectiveness. These devices are implanted in the human body to support or sustain life, or have important impact on the human body and whose potential risk to human body must be strictly controlled.',
    source: 'China NMPA Medical Device Supervision Regulations - Article 5, Class III Definition'
  },
  'rule_invasive_short': {
    id: 'rule_invasive_short',
    title: 'Short-term Invasive Device Classification',
    text: 'Medical devices that are invasive to the body through body orifices or surgical means for short-term use (less than 30 days) are generally classified as Class I or Class II, depending on the location and degree of invasiveness.',
    source: 'China NMPA Classification Rules - Short-term Invasive Devices'
  },
  'rule_invasive_long': {
    id: 'rule_invasive_long',
    title: 'Long-term Invasive Device Classification',
    text: 'Medical devices that are invasive to the body and intended for long-term use (more than 30 days) or implantable devices are classified as Class II or Class III depending on the body system involved and the criticality of the intended use.',
    source: 'China NMPA Classification Rules - Long-term Invasive Devices'
  },
  'rule_life_supporting': {
    id: 'rule_life_supporting',
    title: 'Life-Supporting Device Classification',
    text: 'Medical devices used to support or sustain life, or devices in direct contact with the heart, central circulatory system, or central nervous system are classified as Class III due to their critical nature and high potential risk.',
    source: 'China NMPA Classification Rules - Life-Supporting Devices'
  },
  'rule_implantable': {
    id: 'rule_implantable',
    title: 'Implantable Device Classification',
    text: 'Medical devices that are intended to be implanted in the human body and remain for more than 30 days are classified as Class III, especially if they are in contact with critical organs or undergo chemical change in the body.',
    source: 'China NMPA Classification Rules - Implantable Devices'
  }
};

export const getRuleText = (ruleId: string): ChinaRule | null => {
  return chinaRuleTexts[ruleId] || null;
};

export const getRuleByNumber = (ruleNumber: number | string): ChinaRule | null => {
  const ruleId = `rule_${ruleNumber}`;
  return getRuleText(ruleId);
};
