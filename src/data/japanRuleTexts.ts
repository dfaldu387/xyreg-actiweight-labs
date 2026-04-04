export interface JapanRule {
  id: string;
  title: string;
  text: string;
  source: string;
}

export const japanRuleTexts: Record<string, JapanRule> = {
  'rule_general_class1': {
    id: 'rule_general_class1',
    title: 'General Class I Definition',
    text: 'General Medical Devices (Class I) are medical devices that do not pose a risk of interfering with or adversely affecting human health when used defectively.',
    source: 'Japan PMD Act - Article 2, Paragraph 5'
  },
  'rule_general_class2': {
    id: 'rule_general_class2',
    title: 'General Class II Definition',
    text: 'Controlled Medical Devices (Class II) are medical devices that pose a risk of interfering with or adversely affecting human health when used defectively, and for which proper management is required.',
    source: 'Japan PMD Act - Article 2, Paragraph 6'
  },
  'rule_specially_controlled_class3': {
    id: 'rule_specially_controlled_class3',
    title: 'Specially Controlled Class III Definition',
    text: 'Specially Controlled Medical Devices (Class III) include devices that are implanted in the human body for long-term use or devices that directly support or sustain human life.',
    source: 'Japan PMD Act - Article 2, Paragraph 7'
  },
  'rule_specially_controlled_class4': {
    id: 'rule_specially_controlled_class4',
    title: 'Specially Controlled Class IV Definition',
    text: 'Specially Controlled Medical Devices (Class IV) are high-risk devices including those intended for use in contact with the central nervous system or central circulatory system, or those whose failure could lead to serious health consequences.',
    source: 'Japan PMD Act - Article 2, Paragraph 7 (High Risk Category)'
  },
  'rule_implantable': {
    id: 'rule_implantable',
    title: 'Implantable Device Classification',
    text: 'Medical devices that are intended to be implanted in the human body and remain for more than 30 days are classified as Class III or Class IV depending on the level of risk and body system contact.',
    source: 'Japan PMDA Classification Guidelines - Implantable Devices'
  },
  'rule_life_sustaining': {
    id: 'rule_life_sustaining',
    title: 'Life-Sustaining Device Classification',
    text: 'Medical devices that are used for life support or life-sustaining purposes, where failure could lead to death or serious deterioration of health, are classified as Class IV.',
    source: 'Japan PMDA Classification Guidelines - Life-Sustaining Devices'
  }
};

export const getRuleText = (ruleId: string): JapanRule | null => {
  return japanRuleTexts[ruleId] || null;
};

export const getRuleByNumber = (ruleNumber: number | string): JapanRule | null => {
  const ruleId = `rule_${ruleNumber}`;
  return getRuleText(ruleId);
};
