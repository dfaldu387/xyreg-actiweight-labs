export interface BrazilRule {
  id: string;
  title: string;
  text: string;
  source: string;
}

export const brazilRuleTexts: Record<string, BrazilRule> = {
  'rule_class1': {
    id: 'rule_class1',
    title: 'Class I - Low Risk',
    text: 'Class I medical devices are those with low potential for individual risk and low sanitary risk. These devices include non-invasive devices and accessories that do not have direct contact with the patient or that have only surface contact with intact skin.',
    source: 'ANVISA RDC 185/2001 - Article 3, Class I Definition'
  },
  'rule_class2': {
    id: 'rule_class2',
    title: 'Class II - Medium Risk',
    text: 'Class II medical devices are those with medium potential for individual risk and medium sanitary risk. These include invasive devices with respect to body orifices or skin that are intended for short-term use, or active devices for diagnosis.',
    source: 'ANVISA RDC 185/2001 - Article 3, Class II Definition'
  },
  'rule_class3': {
    id: 'rule_class3',
    title: 'Class III - High Risk',
    text: 'Class III medical devices are those with high potential for individual risk. These include surgically invasive devices for long-term use, implantable devices, or devices in contact with the circulatory system.',
    source: 'ANVISA RDC 185/2001 - Article 3, Class III Definition'
  },
  'rule_class4': {
    id: 'rule_class4',
    title: 'Class IV - Maximum Risk',
    text: 'Class IV medical devices are those with maximum potential for individual risk and maximum sanitary risk. These include life-supporting or life-sustaining devices, devices in direct contact with the heart or central circulatory system, or implantable devices that undergo chemical change in the body.',
    source: 'ANVISA RDC 185/2001 - Article 3, Class IV Definition'
  },
  'rule_invasive': {
    id: 'rule_invasive',
    title: 'Invasive Device Classification',
    text: 'Invasive devices are classified based on the duration of use (transient, short-term, or long-term) and the degree of invasiveness. Surgically invasive devices and devices that penetrate inside the body through a body orifice or through the surface of the body are subject to higher classification.',
    source: 'ANVISA RDC 185/2001 - Classification Rules for Invasive Devices'
  },
  'rule_implantable': {
    id: 'rule_implantable',
    title: 'Implantable Device Classification',
    text: 'Implantable devices and devices intended for long-term use (more than 30 days) in contact with internal body systems are classified as Class III or Class IV depending on their contact with critical organs and life-supporting functions.',
    source: 'ANVISA RDC 185/2001 - Classification Rules for Implantable Devices'
  }
};

export const getRuleText = (ruleId: string): BrazilRule | null => {
  return brazilRuleTexts[ruleId] || null;
};

export const getRuleByNumber = (ruleNumber: number | string): BrazilRule | null => {
  const ruleId = `rule_${ruleNumber}`;
  return getRuleText(ruleId);
};
