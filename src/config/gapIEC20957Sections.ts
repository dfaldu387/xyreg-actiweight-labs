import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const IEC_20957_SECTIONS: GenericSectionItem[] = [
  // §4 General safety requirements
  { section: '4.1', title: 'Materials', description: 'Verify materials used are non-toxic, durable, and suitable for the intended environment. Provide material safety data sheets or test reports.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.2', title: 'Manufacture and assembly', description: 'Demonstrate that manufacturing and assembly processes produce a safe and consistent product. Provide production procedures and quality records.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.3', title: 'Edges and corners', description: 'Show that accessible edges and corners are rounded or protected to prevent injury. Provide inspection reports or design verification results.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.4', title: 'Entrapment and shearing', description: 'Demonstrate that the design prevents entrapment of body parts and shearing hazards during use. Provide gap measurements and test results.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.5', title: 'Pinch points and moving parts', description: 'Verify that pinch points and moving parts are guarded or designed to prevent finger/body trapping. Provide test evidence.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.6', title: 'Weights and weight stacks', description: 'Ensure weight stacks are properly guided, secured, and shielded. Provide guard design specifications and test results.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.7', title: 'Cables, chains, belts and cords', description: 'Verify that cables, chains, belts and cords have adequate strength, are properly routed, and have safety factors documented.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.8', title: 'Pulleys and sprockets', description: 'Show that pulleys and sprockets are guarded to prevent cable/chain derailment and user contact. Provide design/test evidence.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.9', title: 'Resistance mechanisms', description: 'Verify that resistance mechanisms operate safely and predictably across the full range. Provide performance test results.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.10', title: 'Adjusting mechanisms', description: 'Demonstrate that adjusting mechanisms are secure, clearly marked, and cannot release unintentionally. Provide test evidence.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.11', title: 'Foot supports and pedals', description: 'Show that foot supports and pedals have adequate grip, dimensions, and strength. Provide slip-resistance and load test results.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.12', title: 'Hand grips', description: 'Verify hand grips have adequate dimensions, grip surface, and strength for intended use. Provide ergonomic and load test results.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.13', title: 'Seats and backrests', description: 'Demonstrate that seats and backrests are stable, adjustable (if applicable), and support the intended user weight. Provide test evidence.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },
  { section: '4.14', title: 'Heart rate measurement (if provided)', description: 'If heart rate measurement is provided, verify accuracy and display appropriate disclaimers. Provide accuracy test results and labelling.', sectionGroup: 4, sectionGroupName: 'General Safety Requirements', type: 'evidence' },

  // §5 Stability requirements
  { section: '5.1', title: 'General stability', description: 'Demonstrate that the equipment is stable during normal use and does not tip over. Provide stability analysis and test plan.', sectionGroup: 5, sectionGroupName: 'Stability Requirements', type: 'evidence' },
  { section: '5.2', title: 'Static stability test', description: 'Provide results of static stability testing per the standard, showing the equipment remains stable under specified loading conditions.', sectionGroup: 5, sectionGroupName: 'Stability Requirements', type: 'evidence' },
  { section: '5.3', title: 'Dynamic stability test', description: 'Provide results of dynamic stability testing showing the equipment remains stable during simulated use conditions.', sectionGroup: 5, sectionGroupName: 'Stability Requirements', type: 'evidence' },

  // §6 Strength / durability requirements
  { section: '6.1', title: 'Static load test', description: 'Provide results of static load testing verifying structural integrity under maximum user weight plus safety factor.', sectionGroup: 6, sectionGroupName: 'Strength & Durability', type: 'evidence' },
  { section: '6.2', title: 'Dynamic fatigue test', description: 'Provide results of dynamic fatigue testing simulating expected lifetime usage cycles without structural failure.', sectionGroup: 6, sectionGroupName: 'Strength & Durability', type: 'evidence' },
  { section: '6.3', title: 'Drop test', description: 'Provide results of drop testing (where applicable) verifying the equipment withstands handling and transport forces.', sectionGroup: 6, sectionGroupName: 'Strength & Durability', type: 'evidence' },

  // §7 Labelling and marking
  { section: '7.1', title: 'Permanent markings', description: 'Verify all required permanent markings are present: manufacturer name, model, serial number, manufacturing date, maximum user weight.', sectionGroup: 7, sectionGroupName: 'Labelling & Marking', type: 'evidence' },
  { section: '7.2', title: 'Warning labels', description: 'Show that all required warning labels are present, visible, durable, and compliant with the standard requirements.', sectionGroup: 7, sectionGroupName: 'Labelling & Marking', type: 'evidence' },
  { section: '7.3', title: 'Maximum user weight marking', description: 'Verify that maximum user weight is clearly and permanently marked on the equipment in a visible location.', sectionGroup: 7, sectionGroupName: 'Labelling & Marking', type: 'evidence' },

  // §8 Instructions and information
  { section: '8.1', title: 'Assembly instructions', description: 'Provide clear, illustrated assembly instructions that enable safe and correct assembly by the intended user.', sectionGroup: 8, sectionGroupName: 'Instructions & Information', type: 'evidence' },
  { section: '8.2', title: 'User manual', description: 'Provide a comprehensive user manual covering safe operation, adjustments, training exercises, and contraindications.', sectionGroup: 8, sectionGroupName: 'Instructions & Information', type: 'evidence' },
  { section: '8.3', title: 'Training instructions', description: 'Provide training instructions describing proper exercise techniques and safety precautions for each exercise position.', sectionGroup: 8, sectionGroupName: 'Instructions & Information', type: 'evidence' },
  { section: '8.4', title: 'Safety warnings in documentation', description: 'Verify that all required safety warnings and precautions are included in the user documentation.', sectionGroup: 8, sectionGroupName: 'Instructions & Information', type: 'evidence' },
  { section: '8.5', title: 'Maintenance instructions', description: 'Provide maintenance instructions covering inspection intervals, wear part replacement, lubrication, and safety checks.', sectionGroup: 8, sectionGroupName: 'Instructions & Information', type: 'evidence' },

  // §9 Accuracy of displays (if applicable)
  { section: '9.1', title: 'Speed display accuracy', description: 'If speed is displayed, verify accuracy within the tolerances specified by the standard. Provide calibration test results.', sectionGroup: 9, sectionGroupName: 'Accuracy of Displays', type: 'evidence' },
  { section: '9.2', title: 'Distance display accuracy', description: 'If distance is displayed, verify accuracy within the tolerances specified by the standard. Provide calibration test results.', sectionGroup: 9, sectionGroupName: 'Accuracy of Displays', type: 'evidence' },
  { section: '9.3', title: 'Power/resistance display accuracy', description: 'If power or resistance level is displayed, verify accuracy within the tolerances specified by the standard. Provide calibration test results.', sectionGroup: 9, sectionGroupName: 'Accuracy of Displays', type: 'evidence' },
];

export const IEC_20957_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  IEC_20957_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
