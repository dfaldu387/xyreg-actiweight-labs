export interface SouthKoreaRule {
  id: string;
  title: string;
  text: string;
  source: string;
}

export const southKoreaRuleTexts: Record<string, SouthKoreaRule> = {
  'rule_class1': {
    id: 'rule_class1',
    title: 'Class 1 - Low Risk',
    text: 'Class 1 medical devices are those with low potential risk to the human body. These are medical devices that do not directly affect the human body or have minimal contact with the human body for a very short period.',
    source: 'South Korea Medical Device Act - Article 2, Class 1 Definition'
  },
  'rule_class2': {
    id: 'rule_class2',
    title: 'Class 2 - Medium Risk',
    text: 'Class 2 medical devices are those with moderate potential risk to the human body. These include devices that come into contact with body surfaces or body orifices for short-term use and require safety and performance management.',
    source: 'South Korea Medical Device Act - Article 2, Class 2 Definition'
  },
  'rule_class3': {
    id: 'rule_class3',
    title: 'Class 3 - High Risk',
    text: 'Class 3 medical devices are those with high potential risk to the human body. These include devices that are invasive to the body, devices used for long-term contact, or devices that could have significant impact on vital physiological processes.',
    source: 'South Korea Medical Device Act - Article 2, Class 3 Definition'
  },
  'rule_class4': {
    id: 'rule_class4',
    title: 'Class 4 - Very High Risk',
    text: 'Class 4 medical devices are those with very high potential risk to the human body. These include life-supporting or life-sustaining devices, devices implanted in the body for long-term use, devices in direct contact with the heart or central nervous system, or devices whose failure could result in death or serious injury.',
    source: 'South Korea Medical Device Act - Article 2, Class 4 Definition'
  },
  'rule_invasive': {
    id: 'rule_invasive',
    title: 'Invasive Device Classification',
    text: 'Medical devices that penetrate inside the body through a body orifice or through the surface of the body are classified based on the degree and duration of invasiveness. Short-term invasive devices are generally Class 2, while long-term invasive devices are Class 3 or Class 4.',
    source: 'South Korea MFDS Classification Guidelines - Invasive Devices'
  },
  'rule_implantable': {
    id: 'rule_implantable',
    title: 'Implantable Device Classification',
    text: 'Medical devices intended to be totally or partially implanted in the human body or to remain in place after the procedure for at least 30 days are classified as Class 3 or Class 4 depending on the location of implantation and the criticality of the body system.',
    source: 'South Korea MFDS Classification Guidelines - Implantable Devices'
  }
};

export const getRuleText = (ruleId: string): SouthKoreaRule | null => {
  return southKoreaRuleTexts[ruleId] || null;
};

export const getRuleByNumber = (ruleNumber: number | string): SouthKoreaRule | null => {
  const ruleId = `rule_${ruleNumber}`;
  return getRuleText(ruleId);
};
