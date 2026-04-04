import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const IEC_62366_SECTIONS: GenericSectionItem[] = [
  // §4 Usability engineering process
  { section: '4.1', title: 'Usability engineering process', description: 'Establish, document, and maintain a usability engineering process throughout the device lifecycle.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '4.2', title: 'Use specification', description: 'Document the intended medical indication, patient population, intended user profile, use environment, and operating principle.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '4.3', title: 'Identification of user interface characteristics related to safety', description: 'Identify characteristics of the user interface that could impact safety and potential use errors.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '4.4', title: 'Identification of known or foreseeable hazards and hazardous situations', description: 'Identify known and foreseeable hazards and hazardous situations related to use of the device.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '4.5', title: 'Identification of hazard-related use scenarios', description: 'Identify hazard-related use scenarios that could lead to harm including use errors and abnormal use.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '4.6', title: 'Selection of hazard-related use scenarios for summative evaluation', description: 'Select hazard-related use scenarios to be included in summative (validation) evaluation testing.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '4.7', title: 'User interface specification', description: 'Establish the user interface specification including measurable usability criteria for safety-related aspects.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '4.8', title: 'User interface design and implementation', description: 'Design and implement the user interface considering human factors principles and risk control measures.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '4.9', title: 'User interface evaluation plan', description: 'Plan formative and summative evaluations including objectives, methods, participants, and acceptance criteria.', sectionGroup: 4, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },

  // §5 Formative evaluation
  { section: '5.1', title: 'Formative evaluation — general', description: 'Conduct formative evaluations during development to identify usability issues and inform design improvements.', sectionGroup: 5, sectionGroupName: 'Formative Evaluation', type: 'evidence' },
  { section: '5.2', title: 'Formative evaluation methods', description: 'Select and apply appropriate formative evaluation methods (expert review, cognitive walkthrough, simulated use, etc.).', sectionGroup: 5, sectionGroupName: 'Formative Evaluation', type: 'evidence' },
  { section: '5.3', title: 'Formative evaluation documentation', description: 'Document formative evaluation results, identified usability issues, and design changes implemented.', sectionGroup: 5, sectionGroupName: 'Formative Evaluation', type: 'evidence' },

  // §5.7–5.9 Summative evaluation
  { section: '5.7', title: 'Summative evaluation planning', description: 'Plan summative (validation) evaluation including test protocol, sample size, user groups, and pass/fail criteria.', sectionGroup: 6, sectionGroupName: 'Summative Evaluation', type: 'evidence' },
  { section: '5.8', title: 'Summative evaluation execution', description: 'Execute summative evaluation with representative users performing critical tasks in simulated use environments.', sectionGroup: 6, sectionGroupName: 'Summative Evaluation', type: 'evidence' },
  { section: '5.9', title: 'Summative evaluation results and report', description: 'Document summative evaluation results, analyse findings, and provide a usability engineering report demonstrating acceptability.', sectionGroup: 6, sectionGroupName: 'Summative Evaluation', type: 'evidence' },
];

export const IEC_62366_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  IEC_62366_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
