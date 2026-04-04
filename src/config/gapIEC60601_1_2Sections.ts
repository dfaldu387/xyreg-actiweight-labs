import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const IEC_60601_1_2_SECTIONS: GenericSectionItem[] = [
  // §4 General requirements
  { section: '4.1', title: 'General', description: 'Demonstrate that the ME equipment or ME system complies with the general EMC requirements of this collateral standard.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.2', title: 'Electromagnetic compatibility standard compliance', description: 'Document compliance with the applicable EMC standard edition and any deviations or justifications.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.3', title: 'Risk management for EMC', description: 'Apply the risk management process specifically to EMC-related hazards. Identify essential performance affected by electromagnetic disturbances.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence',
    subItems: [
      { letter: '1', description: 'General' },
      { letter: '2', description: 'Risk management process' },
      { letter: '3', description: 'Intended use and electromagnetic environment' },
      { letter: '4', description: 'Essential performance related to EMC' },
    ],
  },

  // §5 EMC test plan and documentation
  { section: '5.1', title: 'EMC test plan', description: 'Prepare an EMC test plan describing the equipment under test, test configuration, operating modes, and pass/fail criteria.', sectionGroup: 5, sectionGroupName: 'EMC Test Plan & Documentation', type: 'evidence' },
  { section: '5.2', title: 'EMC test configuration and setup', description: 'Document the test configuration, operating modes during testing, and accessories/cables/power supply arrangements used.', sectionGroup: 5, sectionGroupName: 'EMC Test Plan & Documentation', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Test configuration' },
      { letter: '2', description: 'Operating modes for testing' },
      { letter: '3', description: 'Accessories, cables, and power supply' },
    ],
  },
  { section: '5.3', title: 'Test report content', description: 'Ensure the EMC test report contains all required information: equipment identification, test setup photos, results, and deviations.', sectionGroup: 5, sectionGroupName: 'EMC Test Plan & Documentation', type: 'evidence' },

  // §6 Electromagnetic disturbances — Requirements and tests
  { section: '6.1', title: 'General — emission requirements', description: 'Document the applicable emission requirements and classifications (Group 1/2, Class A/B) for the ME equipment.', sectionGroup: 6, sectionGroupName: 'Electromagnetic Disturbances (Emissions)', type: 'evidence' },
  { section: '6.2', title: 'Conducted and radiated RF emissions', description: 'Provide test results for conducted and radiated RF emissions, differentiated by intended use environment (professional or home).', sectionGroup: 6, sectionGroupName: 'Electromagnetic Disturbances (Emissions)', type: 'evidence',
    subItems: [
      { letter: '1', description: 'ME equipment intended for use in professional healthcare facilities' },
      { letter: '2', description: 'ME equipment intended for use in the home healthcare environment' },
    ],
  },
  { section: '6.3', title: 'Harmonic distortion', description: 'Provide test results for harmonic current emissions per IEC 61000-3-2 or justification for exemption.', sectionGroup: 6, sectionGroupName: 'Electromagnetic Disturbances (Emissions)', type: 'evidence' },
  { section: '6.4', title: 'Voltage fluctuations and flicker', description: 'Provide test results for voltage fluctuations and flicker per IEC 61000-3-3 or justification for exemption.', sectionGroup: 6, sectionGroupName: 'Electromagnetic Disturbances (Emissions)', type: 'evidence' },

  // §7 Electromagnetic immunity — Requirements and tests
  { section: '7.1', title: 'General — immunity requirements', description: 'Document the applicable immunity requirements based on the intended electromagnetic environment and essential performance.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },
  { section: '7.2', title: 'Electrostatic discharge (ESD)', description: 'Provide ESD immunity test results per IEC 61000-4-2 at the specified test levels. Document pass/fail criteria related to essential performance.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },
  { section: '7.3', title: 'Radiated RF electromagnetic fields', description: 'Provide radiated RF immunity test results per IEC 61000-4-3 at the specified test levels and frequency ranges.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },
  { section: '7.4', title: 'Proximity fields from RF wireless communications equipment', description: 'Provide immunity test results for proximity fields from wireless communications equipment (e.g. mobile phones) per IEC 61000-4-3.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },
  { section: '7.5', title: 'Electrical fast transients / burst', description: 'Provide EFT/burst immunity test results per IEC 61000-4-4 at the specified test levels.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },
  { section: '7.6', title: 'Surges', description: 'Provide surge immunity test results per IEC 61000-4-5 at the specified test levels.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },
  { section: '7.7', title: 'Conducted disturbances induced by RF fields', description: 'Provide conducted RF immunity test results per IEC 61000-4-6 at the specified test levels.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },
  { section: '7.8', title: 'Power-frequency magnetic fields', description: 'Provide power-frequency magnetic field immunity test results per IEC 61000-4-8 at the specified test levels.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },
  { section: '7.9', title: 'Voltage dips and voltage interruptions', description: 'Provide voltage dip and interruption immunity test results per IEC 61000-4-11 at the specified levels and durations.', sectionGroup: 7, sectionGroupName: 'Electromagnetic Immunity', type: 'evidence' },

  // §8 Accompanying documents
  { section: '8.1', title: 'General — accompanying documents', description: 'Document the EMC-related information required in accompanying documents, including guidance on electromagnetic environment.', sectionGroup: 8, sectionGroupName: 'Accompanying Documents', type: 'evidence' },
  { section: '8.2', title: 'Professional healthcare facility environment', description: 'Provide the required EMC declaration tables for professional healthcare facility environments in the accompanying documents.', sectionGroup: 8, sectionGroupName: 'Accompanying Documents', type: 'evidence' },
  { section: '8.3', title: 'Home healthcare environment', description: 'Provide the required EMC declaration tables for home healthcare environments in the accompanying documents.', sectionGroup: 8, sectionGroupName: 'Accompanying Documents', type: 'evidence' },
  { section: '8.4', title: 'Special environment', description: 'If the ME equipment is intended for a special electromagnetic environment, document the specific requirements and test results.', sectionGroup: 8, sectionGroupName: 'Accompanying Documents', type: 'evidence' },

  // §9 ME systems
  { section: '9.1', title: 'General — ME system EMC', description: 'Document how EMC requirements apply to the complete ME system, including non-medical equipment components.', sectionGroup: 9, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '9.2', title: 'ME system emission requirements', description: 'Provide emission test results for the ME system as a whole, or justification for component-level testing.', sectionGroup: 9, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '9.3', title: 'ME system immunity requirements', description: 'Provide immunity test results for the ME system as a whole, or justification for component-level testing.', sectionGroup: 9, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '9.4', title: 'Cables and connections in ME systems', description: 'Document cable types, lengths, and routing used in the ME system and their impact on EMC performance.', sectionGroup: 9, sectionGroupName: 'ME Systems', type: 'evidence' },
];

export const IEC_60601_1_2_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  IEC_60601_1_2_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
