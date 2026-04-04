import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const IEC_62304_SECTIONS: GenericSectionItem[] = [
  // §4 General requirements
  { section: '4.1', title: 'Quality management system', description: 'Demonstrate that software development is covered under a QMS compliant with ISO 13485 or equivalent. Provide QMS certificate or quality manual reference.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.2', title: 'Risk management', description: 'Show that a risk management process per ISO 14971 is applied to software. Provide risk management plan referencing software.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.3', title: 'Software safety classification', description: 'Classify software into Class A, B, or C based on severity of harm. Document the classification rationale and approval.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.4', title: 'Legacy software', description: 'Determine if legacy software is acceptable for continued use. Perform gap analysis against IEC 62304, assess risks, and create a remediation plan or justify continued use.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Determine if legacy software is legacy software' },
      { letter: '2', description: 'Obtain and document a legacy software risk assessment' },
      { letter: '3', description: 'Perform a gap analysis against IEC 62304 requirements' },
      { letter: '4', description: 'Create a plan to address identified gaps or justify continued use' },
    ],
  },

  // §5 Software development process
  { section: '5.1', title: 'Software development planning', description: 'Create and maintain a software development plan covering standards, tools, integration, verification, risk management, documentation, and configuration management.', sectionGroup: 5, sectionGroupName: 'Software Development Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Software development plan' },
      { letter: '2', description: 'Keep software development plan updated' },
      { letter: '3', description: 'Software development plan reference to design and development' },
      { letter: '4', description: 'Software development standards, methods and tools planning' },
      { letter: '5', description: 'Software integration and integration testing planning' },
      { letter: '6', description: 'Software verification planning' },
      { letter: '7', description: 'Software risk management planning' },
      { letter: '8', description: 'Documentation planning' },
      { letter: '9', description: 'Software configuration management planning' },
      { letter: '10', description: 'Supporting items to be controlled' },
      { letter: '11', description: 'Software configuration item control before verification' },
    ],
  },
  { section: '5.2', title: 'Software requirements analysis', description: 'Define and document software requirements derived from system requirements, including risk control measures. Verify completeness and correctness.', sectionGroup: 5, sectionGroupName: 'Software Development Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Define and document software requirements from system requirements' },
      { letter: '2', description: 'Software requirements content' },
      { letter: '3', description: 'Include risk control measures in software requirements' },
      { letter: '4', description: 'Re-evaluate medical device risk analysis' },
      { letter: '5', description: 'Update system requirements' },
      { letter: '6', description: 'Verify software requirements' },
    ],
  },
  { section: '5.3', title: 'Software architectural design', description: 'Transform requirements into a documented architecture showing software items, interfaces, SOUP items, and segregation for risk control.', sectionGroup: 5, sectionGroupName: 'Software Development Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Transform software requirements into an architecture' },
      { letter: '2', description: 'Develop an architecture for the interfaces of software items' },
      { letter: '3', description: 'Specify functional and performance requirements of SOUP item' },
      { letter: '4', description: 'Specify system hardware and software required by SOUP item' },
      { letter: '5', description: 'Identify segregation necessary for risk control' },
      { letter: '6', description: 'Verify software architecture' },
    ],
  },
  { section: '5.4', title: 'Software detailed design', description: 'Subdivide into software units with detailed designs and interfaces. Verify the detailed design against architecture and requirements.', sectionGroup: 5, sectionGroupName: 'Software Development Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Subdivide software into software units' },
      { letter: '2', description: 'Develop detailed design for each software unit' },
      { letter: '3', description: 'Develop detailed design for interfaces' },
      { letter: '4', description: 'Verify detailed design' },
    ],
  },
  { section: '5.5', title: 'Software unit implementation and verification', description: 'Implement and verify each software unit against acceptance criteria. Document unit test results.', sectionGroup: 5, sectionGroupName: 'Software Development Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Implement each software unit' },
      { letter: '2', description: 'Establish software unit verification process' },
      { letter: '3', description: 'Software unit acceptance criteria' },
      { letter: '4', description: 'Additional software unit acceptance criteria' },
      { letter: '5', description: 'Software unit verification' },
    ],
  },
  { section: '5.6', title: 'Software integration and integration testing', description: 'Integrate software units and verify integration through testing. Document test procedures, results, and conduct regression tests.', sectionGroup: 5, sectionGroupName: 'Software Development Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Integrate software units' },
      { letter: '2', description: 'Verify software integration' },
      { letter: '3', description: 'Software integration testing' },
      { letter: '4', description: 'Software integration testing content' },
      { letter: '5', description: 'Evaluate integration test procedures' },
      { letter: '6', description: 'Conduct regression tests' },
      { letter: '7', description: 'Integration test record contents' },
      { letter: '8', description: 'Use problem resolution process' },
    ],
  },
  { section: '5.7', title: 'Software system testing', description: 'Establish and execute system-level tests to verify all software requirements are met. Evaluate test procedures and document results.', sectionGroup: 5, sectionGroupName: 'Software Development Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Establish tests for software requirements' },
      { letter: '2', description: 'Use problem resolution process' },
      { letter: '3', description: 'Retest after changes' },
      { letter: '4', description: 'Verify software system test record contents' },
      { letter: '5', description: 'Evaluate test procedures' },
    ],
  },
  { section: '5.8', title: 'Software release', description: 'Ensure all verification is complete, document residual anomalies, archive released software, and assure repeatability of the release.', sectionGroup: 5, sectionGroupName: 'Software Development Process', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Ensure software verification is complete' },
      { letter: '2', description: 'Document known residual anomalies' },
      { letter: '3', description: 'Evaluate known residual anomalies' },
      { letter: '4', description: 'Document released versions' },
      { letter: '5', description: 'Document how released software was created' },
      { letter: '6', description: 'Ensure activities and tasks are complete' },
      { letter: '7', description: 'Archive software' },
      { letter: '8', description: 'Assure repeatability of software release' },
    ],
  },

  // §6 Software maintenance process
  { section: '6.1', title: 'Establish software maintenance plan', description: 'Define a plan for maintaining the software post-release, including criteria for using the software development process for modifications.', sectionGroup: 6, sectionGroupName: 'Software Maintenance', type: 'evidence' },
  { section: '6.2', title: 'Problem and modification analysis', description: 'Evaluate problem reports, analyse change requests for risk impact, approve changes, and communicate to users/regulators as needed.', sectionGroup: 6, sectionGroupName: 'Software Maintenance', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Document and evaluate each problem report' },
      { letter: '2', description: 'Use software problem resolution process' },
      { letter: '3', description: 'Analyse change requests for impact including risks' },
      { letter: '4', description: 'Approve change requests' },
      { letter: '5', description: 'Communicate to users and regulators' },
    ],
  },
  { section: '6.3', title: 'Implementation of modification', description: 'Implement approved modifications using the established software development process, ensuring traceability and re-verification.', sectionGroup: 6, sectionGroupName: 'Software Maintenance', type: 'evidence' },

  // §7 Software risk management process
  { section: '7.1', title: 'Analysis of software contributing to hazardous situations', description: 'Identify software items that could contribute to hazardous situations, evaluate SOUP anomaly lists, and document potential causes.', sectionGroup: 7, sectionGroupName: 'Software Risk Management', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Identify software items that could contribute to a hazardous situation' },
      { letter: '2', description: 'Identify potential causes of contribution to a hazardous situation' },
      { letter: '3', description: 'Evaluate published SOUP anomaly lists' },
      { letter: '4', description: 'Document potential causes' },
    ],
  },
  { section: '7.2', title: 'Risk control measures', description: 'Define and verify software risk control measures for identified hazardous situations.', sectionGroup: 7, sectionGroupName: 'Software Risk Management', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Define risk control measures' },
      { letter: '2', description: 'Verify risk control measures' },
    ],
  },
  { section: '7.3', title: 'Verification of risk control measures', description: 'Verify that all risk control measures have been correctly implemented and are effective.', sectionGroup: 7, sectionGroupName: 'Software Risk Management', type: 'evidence' },
  { section: '7.4', title: 'Risk management of software changes', description: 'Analyse software changes for new hazards or impact on existing risk control measures. Update risk documentation accordingly.', sectionGroup: 7, sectionGroupName: 'Software Risk Management', type: 'evidence' },

  // §8 Software configuration management
  { section: '8.1', title: 'Configuration identification', description: 'Establish means to uniquely identify configuration items, SOUP items, and system configuration documentation.', sectionGroup: 8, sectionGroupName: 'Software Configuration Management', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Establish means to identify configuration items' },
      { letter: '2', description: 'Identify SOUP configuration items' },
      { letter: '3', description: 'Identify system configuration documentation' },
    ],
  },
  { section: '8.2', title: 'Change control', description: 'Approve and implement changes with verification and traceability. Document all change requests and their outcomes.', sectionGroup: 8, sectionGroupName: 'Software Configuration Management', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Approve change requests' },
      { letter: '2', description: 'Implement changes' },
      { letter: '3', description: 'Verify changes' },
      { letter: '4', description: 'Provide means for the traceability of change' },
    ],
  },
  { section: '8.3', title: 'Configuration status accounting', description: 'Maintain records of the configuration status of all software items throughout the lifecycle.', sectionGroup: 8, sectionGroupName: 'Software Configuration Management', type: 'evidence' },

  // §9 Software problem resolution
  { section: '9.1', title: 'Prepare problem reports', description: 'Create documented problem reports for each identified software problem, including classification and priority.', sectionGroup: 9, sectionGroupName: 'Software Problem Resolution', type: 'evidence' },
  { section: '9.2', title: 'Investigate the problem', description: 'Investigate each reported problem to determine root cause and potential impact on safety.', sectionGroup: 9, sectionGroupName: 'Software Problem Resolution', type: 'evidence' },
  { section: '9.3', title: 'Advise relevant parties', description: 'Notify users, regulators, and other relevant parties of safety-related software problems.', sectionGroup: 9, sectionGroupName: 'Software Problem Resolution', type: 'evidence' },
  { section: '9.4', title: 'Use change control process', description: 'Apply the change control process to implement approved corrections for reported problems.', sectionGroup: 9, sectionGroupName: 'Software Problem Resolution', type: 'evidence' },
  { section: '9.5', title: 'Maintain records', description: 'Maintain complete records of all software problems, investigations, and resolutions.', sectionGroup: 9, sectionGroupName: 'Software Problem Resolution', type: 'evidence' },
  { section: '9.6', title: 'Analyse problems for trends', description: 'Analyse software problem reports to identify trends that may indicate systemic issues.', sectionGroup: 9, sectionGroupName: 'Software Problem Resolution', type: 'evidence' },
  { section: '9.7', title: 'Verify software problem resolution', description: 'Verify that each software problem has been resolved and the resolution does not introduce new problems.', sectionGroup: 9, sectionGroupName: 'Software Problem Resolution', type: 'evidence' },
  { section: '9.8', title: 'Test documentation contents', description: 'Ensure test documentation records contain all required information for regulatory review.', sectionGroup: 9, sectionGroupName: 'Software Problem Resolution', type: 'evidence' },
];

export const IEC_62304_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  IEC_62304_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
