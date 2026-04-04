import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const IEC_60601_1_6_SECTIONS: GenericSectionItem[] = [
  // §4 General requirements
  { section: '4.1', title: 'Application of usability engineering process', description: 'Demonstrate that a usability engineering process per IEC 62366-1 is applied throughout the device lifecycle. Provide the usability engineering plan.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.2', title: 'Usability engineering file', description: 'Maintain a usability engineering file containing all records and documents produced by the usability engineering process.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },

  // §5 Usability engineering process
  { section: '5.1', title: 'Prepare USE specification', description: 'Define the use specification: intended medical indication, patient population, intended users, use environment, and operating principle.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Intended medical indication, intended patient population, intended part of the body' },
      { letter: '2', description: 'Intended user profile' },
      { letter: '3', description: 'Intended use environment' },
      { letter: '4', description: 'Operating principle' },
    ],
  },
  { section: '5.2', title: 'Identify user interface characteristics related to safety and potential use errors', description: 'Analyse the user interface to identify characteristics that could lead to use errors and hazardous situations. Document hazard-related use scenarios.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Identify known or foreseeable hazards and hazardous situations' },
      { letter: '2', description: 'Identify and describe hazard-related use scenarios' },
    ],
  },
  { section: '5.3', title: 'Identify hazard-related use scenarios', description: 'Systematically identify hazard-related use scenarios that could result in harm. Document task analyses and failure modes.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '5.4', title: 'Select hazard-related use scenarios for summative evaluation', description: 'Select the critical hazard-related use scenarios that must be evaluated during summative usability testing.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '5.5', title: 'Establish user interface specification', description: 'Define user interface requirements addressing identified hazards and use errors. Include specifications for displays, controls, alarms, and labelling.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '5.6', title: 'Establish user interface evaluation plan', description: 'Create a plan for evaluating the user interface through formative and summative methods. Define acceptance criteria.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence' },
  { section: '5.7', title: 'Perform user interface design, implementation and formative evaluation', description: 'Design and implement the user interface, then conduct formative evaluations (expert reviews, cognitive walkthroughs, early user tests) to identify and fix usability issues.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Design and implement user interface' },
      { letter: '2', description: 'Perform formative evaluation' },
      { letter: '3', description: 'Results of formative evaluation' },
    ],
  },
  { section: '5.8', title: 'Perform summative evaluation of the usability of the user interface', description: 'Conduct summative usability testing with representative users to validate that critical use scenarios can be completed safely. Document test plan and results.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'General' },
      { letter: '2', description: 'Summative evaluation test plan' },
      { letter: '3', description: 'Summative evaluation test results' },
    ],
  },
  { section: '5.9', title: 'User interface of ME equipment for self-use', description: 'For self-use ME equipment, apply additional requirements for lay user interfaces and training considerations.', sectionGroup: 5, sectionGroupName: 'Usability Engineering Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Lay user interface' },
      { letter: '2', description: 'Training for self-use ME equipment' },
    ],
  },
];

export const IEC_60601_1_6_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  IEC_60601_1_6_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
