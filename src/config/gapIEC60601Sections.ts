import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

export const IEC_60601_SECTIONS: GenericSectionItem[] = [
  // §1 Scope, object and related standards
  { section: '1.1', title: 'Scope', description: 'Determine whether the ME equipment falls within the scope of IEC 60601-1.', sectionGroup: 1, sectionGroupName: 'Scope & Normative References', type: 'evidence' },
  { section: '1.2', title: 'Object', description: 'Establish the safety objectives of ME equipment and ME systems.', sectionGroup: 1, sectionGroupName: 'Scope & Normative References', type: 'evidence' },
  { section: '1.3', title: 'Collateral standards', description: 'Identify applicable collateral standards (IEC 60601-1-X series).', sectionGroup: 1, sectionGroupName: 'Scope & Normative References', type: 'evidence' },
  { section: '1.4', title: 'Particular standards', description: 'Identify applicable particular standards (IEC 60601-2-X series).', sectionGroup: 1, sectionGroupName: 'Scope & Normative References', type: 'evidence' },

  // §2 Normative references
  { section: '2.1', title: 'Normative references', description: 'List all normative references applicable to the ME equipment.', sectionGroup: 2, sectionGroupName: 'Normative References', type: 'evidence' },

  // §3 Terms and definitions
  { section: '3.1', title: 'Terms and definitions', description: 'Confirm understanding and correct application of defined terms used throughout the standard.', sectionGroup: 3, sectionGroupName: 'Terms & Definitions', type: 'evidence' },

  // §4 General requirements
  { section: '4.1', title: 'Conditions for application to ME equipment', description: 'General conditions under which the standard applies, including intended use environment and normal conditions.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.2', title: 'Hazards identified in the IEC 60601-series', description: 'Risk acceptability criteria and hazards not specifically addressed by the standard.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.3', title: 'Essential performance', description: 'Identify and document the essential performance of the ME equipment.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.4', title: 'Expected service life', description: 'Define and document the expected service life of the ME equipment.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.5', title: 'Alternative risk control measures', description: 'Justification for alternative risk control measures or test methods.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.6', title: 'Parts that contact the patient', description: 'Assessment of applied parts, accessible parts and parts contacting the patient.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.7', title: 'Single fault condition', description: 'Single fault conditions and safety under each condition.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.8', title: 'Components of ME equipment', description: 'Components used outside their ratings and risk justification.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.9', title: 'High-integrity components', description: 'Components with high-integrity characteristics for safety-critical functions.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.10', title: 'Environmental conditions', description: 'Environmental conditions (temperature, humidity, altitude, pressure) for transport, storage, and use.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },
  { section: '4.11', title: 'Supply mains conditions', description: 'Rated supply voltage, frequency, and power supply conditions for the ME equipment.', sectionGroup: 4, sectionGroupName: 'General Requirements', type: 'evidence' },

  // §5 Testing requirements
  { section: '5.1', title: 'Type tests — simultaneous faults', description: 'Simultaneous independent faults documented in the RMF.', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.2', title: 'Number of samples', description: 'Number of samples required for type testing.', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.3', title: 'Conditioning', description: 'Conditioning of samples before testing (humidity pre-conditioning).', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.4', title: 'Humidity pre-treatment', description: 'Humidity pretreatment conditions and test procedures.', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.5', title: 'Temperature and humidity during testing', description: 'Ambient conditions (temperature and humidity) during type testing.', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.6', title: 'Supply voltage during testing', description: 'Supply voltage conditions during testing (rated voltage ±10%).', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.7', title: 'Supply frequency during testing', description: 'Supply frequency conditions during testing.', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.8', title: 'Other testing conditions', description: 'Other testing conditions as specified by the manufacturer.', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.9', title: 'Loading during tests', description: 'Loading conditions during type tests.', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },
  { section: '5.10', title: 'Operating mode during testing', description: 'Most unfavourable operating mode and position during testing.', sectionGroup: 5, sectionGroupName: 'Testing Requirements', type: 'evidence' },

  // §6 Classification of ME equipment and ME systems
  { section: '6.1', title: 'Classification against electric shock', description: 'Classification of ME equipment according to protection against electric shock (Class I, II or internally powered).', sectionGroup: 6, sectionGroupName: 'Classification', type: 'evidence' },
  { section: '6.2', title: 'Classification of applied parts', description: 'Classification of applied parts (Type B, BF, CF).', sectionGroup: 6, sectionGroupName: 'Classification', type: 'evidence' },
  { section: '6.3', title: 'Degree of protection against ingress of water', description: 'IP classification for water ingress protection (IPX0–IPX8).', sectionGroup: 6, sectionGroupName: 'Classification', type: 'evidence' },
  { section: '6.4', title: 'Degree of safety in flammable environments', description: 'Classification for use with flammable anaesthetic agents (AP/APG categories).', sectionGroup: 6, sectionGroupName: 'Classification', type: 'evidence' },
  { section: '6.5', title: 'Mode of operation', description: 'Classification by mode of operation (continuous, short-time, intermittent).', sectionGroup: 6, sectionGroupName: 'Classification', type: 'evidence' },
  { section: '6.6', title: 'Conditions for portability', description: 'Classification for portability — portable, mobile, fixed, stationary, or hand-held equipment.', sectionGroup: 6, sectionGroupName: 'Classification', type: 'evidence' },
  { section: '6.7', title: 'ME equipment rated supply', description: 'Classification by supply type and rated characteristics.', sectionGroup: 6, sectionGroupName: 'Classification', type: 'evidence' },
  { section: '6.8', title: 'Sterility', description: 'Sterile and non-sterile classification.', sectionGroup: 6, sectionGroupName: 'Classification', type: 'evidence' },

  // §7 Identification, marking & documents
  { section: '7.1', title: 'General marking requirements', description: 'General requirements for marking legibility, durability, and placement on ME equipment.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },
  { section: '7.2', title: 'Identification of detachable components', description: 'Marking of detachable components to prevent misidentification risks.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },
  { section: '7.3', title: 'Safety signs, warnings & markings', description: 'Primary risk control via information, physiological effects, packaging, batteries, supply terminals.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },
  { section: '7.4', title: 'Marking on the outside of ME equipment', description: 'Required markings on the outside — manufacturer, model, serial number, ratings, classification symbols.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },
  { section: '7.5', title: 'Marking on the inside of ME equipment', description: 'Required markings on the inside — fuse ratings, wiring diagrams, component identification.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },
  { section: '7.6', title: 'Marking of controls and instruments', description: 'Marking requirements for controls, indicators, and instrument displays.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },
  { section: '7.7', title: 'Indicator lights and push buttons', description: 'Colour coding requirements for indicator lights and push buttons.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },
  { section: '7.8', title: 'Accompanying documents — general', description: 'General requirements for accompanying documents including language, format, and availability.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },
  { section: '7.9', title: 'Instructions for use', description: 'Content requirements for instructions for use — intended use, contraindications, warnings, installation, operation, maintenance, disposal.', sectionGroup: 7, sectionGroupName: 'Marking & Documents', type: 'evidence' },

  // §8 Protection against electrical hazards
  { section: '8.1', title: 'Fundamental rule of protection', description: 'Fundamental requirement for protection against electric shock — two independent means of protection.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.2', title: 'Classification requirements', description: 'Requirements derived from the classification of ME equipment (Class I, II, internally powered).', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.3', title: 'Means of protection (MOPs)', description: 'Specification of means of operator protection (MOOP) and means of patient protection (MOPP).', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.4', title: 'Allowable touch current and patient leakage current', description: 'Limits for touch current, earth leakage current, and patient leakage current in normal and single fault conditions.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.5', title: 'Separation of parts & applied parts', description: 'MOPP considerations, Type B applied parts, patient leads and cables.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.6', title: 'Protective earthing of moving parts', description: 'Reliability of protective earth connections for moving parts.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.7', title: 'Creepage distances and air clearances', description: 'Creepage distances and air clearances for insulation between parts.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.8', title: 'Mechanical strength & resistance to heat', description: 'Insulation integrity during expected service life.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.9', title: 'Voltage and/or energy limitations', description: 'Voltage and energy limitation as a means of protection.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.10', title: 'Overcurrent and overvoltage protection', description: 'Protection against overcurrent, overvoltage, and overload conditions.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },
  { section: '8.11', title: 'Separation devices and switching', description: 'Requirements for mains isolation and disconnection devices.', sectionGroup: 8, sectionGroupName: 'Electrical Hazards', type: 'evidence' },

  // §9 Protection against mechanical hazards
  { section: '9.1', title: 'General requirements for mechanical hazards', description: 'General requirements for protection against mechanical hazards.', sectionGroup: 9, sectionGroupName: 'Mechanical Hazards', type: 'evidence' },
  { section: '9.2', title: 'Moving parts — risk control', description: 'Risk control measures for moving parts, trapping zones, gaps and guards.', sectionGroup: 9, sectionGroupName: 'Mechanical Hazards', type: 'evidence' },
  { section: '9.3', title: 'Speed, unintended movement & emergency stop', description: 'Speed limits, overtravel, unintended movement, emergency stopping devices.', sectionGroup: 9, sectionGroupName: 'Mechanical Hazards', type: 'evidence' },
  { section: '9.4', title: 'Release of patient', description: 'Means for quick and safe release of the patient.', sectionGroup: 9, sectionGroupName: 'Mechanical Hazards', type: 'evidence' },
  { section: '9.5', title: 'Expelled parts', description: 'Protection against risks from expelled parts.', sectionGroup: 9, sectionGroupName: 'Mechanical Hazards', type: 'evidence' },
  { section: '9.6', title: 'Acoustic energy & vibration', description: 'Acoustic energy, infrasound and ultrasound risk assessment.', sectionGroup: 9, sectionGroupName: 'Mechanical Hazards', type: 'evidence' },
  { section: '9.7', title: 'Pressure vessels & pneumatic/hydraulic', description: 'Pressure vessels, pneumatic/hydraulic parts, pressure-relief devices.', sectionGroup: 9, sectionGroupName: 'Mechanical Hazards', type: 'evidence' },
  { section: '9.8', title: 'Support systems', description: 'Support systems, tensile safety factors, patient support/suspension.', sectionGroup: 9, sectionGroupName: 'Mechanical Hazards', type: 'evidence' },

  // §10 Radiation hazards
  { section: '10.1', title: 'X-radiation', description: 'Unintended X-radiation assessment for diagnostic/therapeutic equipment.', sectionGroup: 10, sectionGroupName: 'Radiation Hazards', type: 'evidence' },
  { section: '10.2', title: 'Alpha, beta, gamma & particle radiation', description: 'Particle radiation risk assessment.', sectionGroup: 10, sectionGroupName: 'Radiation Hazards', type: 'evidence' },
  { section: '10.3', title: 'Microwave radiation', description: 'Microwave radiation risk assessment and limits.', sectionGroup: 10, sectionGroupName: 'Radiation Hazards', type: 'evidence' },
  { section: '10.4', title: 'Laser radiation', description: 'Laser radiation risk assessment, classification, and protective measures per IEC 60825-1.', sectionGroup: 10, sectionGroupName: 'Radiation Hazards', type: 'evidence' },
  { section: '10.5', title: 'Visible electromagnetic radiation', description: 'Visible electromagnetic radiation risk assessment.', sectionGroup: 10, sectionGroupName: 'Radiation Hazards', type: 'evidence' },
  { section: '10.6', title: 'Infrared radiation', description: 'Infrared radiation risk assessment.', sectionGroup: 10, sectionGroupName: 'Radiation Hazards', type: 'evidence' },
  { section: '10.7', title: 'Ultraviolet radiation', description: 'Ultraviolet radiation risk assessment.', sectionGroup: 10, sectionGroupName: 'Radiation Hazards', type: 'evidence' },

  // §11 Temperatures & other hazards
  { section: '11.1', title: 'Excessive temperatures', description: 'Temperature limits for accessible and applied parts.', sectionGroup: 11, sectionGroupName: 'Temperatures & Other Hazards', type: 'evidence' },
  { section: '11.2', title: 'Fire prevention', description: 'Fire risk in oxygen rich environments.', sectionGroup: 11, sectionGroupName: 'Temperatures & Other Hazards', type: 'evidence' },
  { section: '11.3', title: 'Fire enclosures', description: 'Constructional requirements for fire enclosures.', sectionGroup: 11, sectionGroupName: 'Temperatures & Other Hazards', type: 'evidence' },
  { section: '11.4', title: 'Biocompatibility', description: 'Biocompatibility of materials in contact with patient, operator, or other persons per ISO 10993 series.', sectionGroup: 11, sectionGroupName: 'Temperatures & Other Hazards', type: 'evidence' },
  { section: '11.5', title: 'Flammable agents', description: 'Risk assessment for use with flammable agents.', sectionGroup: 11, sectionGroupName: 'Temperatures & Other Hazards', type: 'evidence' },
  { section: '11.6', title: 'Fluids — overflow, spillage, cleaning, sterilization', description: 'Overflow, spillage, cleaning/disinfection, sterilization, compatibility.', sectionGroup: 11, sectionGroupName: 'Temperatures & Other Hazards', type: 'evidence' },
  { section: '11.7', title: 'Interrupted operation', description: 'Assessment of risks from interrupted operation and subsequent restart of ME equipment.', sectionGroup: 11, sectionGroupName: 'Temperatures & Other Hazards', type: 'evidence' },

  // §12 Accuracy & hazardous outputs
  { section: '12.1', title: 'Accuracy of controls and instruments', description: 'Risk assessment for accuracy of controls and instruments.', sectionGroup: 12, sectionGroupName: 'Accuracy & Hazardous Outputs', type: 'evidence' },
  { section: '12.2', title: 'Usability', description: 'Human factors and usability requirements for controls, displays, and user interface elements.', sectionGroup: 12, sectionGroupName: 'Accuracy & Hazardous Outputs', type: 'evidence' },
  { section: '12.3', title: 'Alarm systems', description: 'Requirements for alarm systems including priority, signals, default settings, and distributed alarm systems.', sectionGroup: 12, sectionGroupName: 'Accuracy & Hazardous Outputs', type: 'evidence' },
  { section: '12.4', title: 'Hazardous output conditions', description: 'Safety limits, indications, excessive output, incorrect output, radiation, acoustic pressure.', sectionGroup: 12, sectionGroupName: 'Accuracy & Hazardous Outputs', type: 'evidence' },

  // §13 Hazardous situations and fault conditions
  { section: '13.1', title: 'General requirements for hazardous situations', description: 'General requirements for protection against hazardous situations and fault conditions.', sectionGroup: 13, sectionGroupName: 'Hazardous Situations', type: 'evidence' },
  { section: '13.2', title: 'Leakage of liquid', description: 'Risk from liquid leakage in single fault condition.', sectionGroup: 13, sectionGroupName: 'Hazardous Situations', type: 'evidence' },

  // §14 Programmable electrical medical systems (PEMS)
  { section: '14.1', title: 'General requirements for PEMS', description: 'General requirements for programmable electrical medical systems including documentation and lifecycle.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.2', title: 'PEMS development life cycle', description: 'Requirements for PEMS development lifecycle including planning, design, and documentation.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.3', title: 'Problem resolution and change management', description: 'Problem resolution process and change management for PEMS throughout the lifecycle.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.4', title: 'PEMS requirements', description: 'PEMS requirements specification, including functional and safety requirements.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.5', title: 'PEMS architecture', description: 'PEMS architecture design including hardware/software partitioning and risk controls.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.6', title: 'PEMS design and implementation', description: 'PEMS detailed design, coding standards, and implementation requirements.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.7', title: 'PEMS verification', description: 'PEMS verification activities including unit testing, integration testing, and code reviews.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.8', title: 'PEMS validation', description: 'PEMS validation to confirm that the system meets the defined requirements and intended use.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.9', title: 'PEMS modification', description: 'Requirements for managing modifications to PEMS after initial release.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.10', title: 'Connection of PEMS by network/data coupling', description: 'Requirements for PEMS connected to networks or data coupling interfaces.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.11', title: 'PEMS intended for compilation', description: 'Requirements for PEMS components intended for compilation into larger systems.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.12', title: 'Documentation requirements for PEMS', description: 'Documentation requirements specific to PEMS including design history files and test records.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },
  { section: '14.13', title: 'PEMS risk management', description: 'Risk management process specific to PEMS including software hazard analysis.', sectionGroup: 14, sectionGroupName: 'PEMS (Software)', type: 'evidence' },

  // §15 Construction of ME equipment
  { section: '15.1', title: 'Voltage and/or energy in construction', description: 'Construction requirements for voltage and energy constraints in the design.', sectionGroup: 15, sectionGroupName: 'Construction', type: 'evidence' },
  { section: '15.2', title: 'Enclosures and protective covers', description: 'Construction requirements for enclosures, covers, and access to live parts.', sectionGroup: 15, sectionGroupName: 'Construction', type: 'evidence' },
  { section: '15.3', title: 'Wiring, connectors and interconnections', description: 'Construction requirements for internal wiring, connectors, and interconnections.', sectionGroup: 15, sectionGroupName: 'Construction', type: 'evidence' },
  { section: '15.4', title: 'Mains parts, components and layout', description: 'Construction requirements for mains parts, components layout, and PCB design (creepage/clearance).', sectionGroup: 15, sectionGroupName: 'Construction', type: 'evidence' },
  { section: '15.5', title: 'Supply connection and ME equipment power inlet', description: 'Construction requirements for supply connections, power inlets, and appliance couplers.', sectionGroup: 15, sectionGroupName: 'Construction', type: 'evidence' },

  // §16 ME systems
  { section: '16.1', title: 'General requirements for ME systems', description: 'General requirements applicable to ME systems formed by combination of equipment.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '16.2', title: 'ME system enclosures and protective covers', description: 'Enclosure and protective cover requirements for ME systems.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '16.3', title: 'Protection of non-ME equipment in ME system', description: 'Requirements for non-medical equipment used within an ME system.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '16.4', title: 'Leakage currents of ME systems', description: 'Combined leakage current requirements for ME systems including earth leakage and patient leakage.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '16.5', title: 'Separation requirements for ME systems', description: 'Separation (creepage and clearance) requirements specific to ME systems.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '16.6', title: 'ME system alarm systems', description: 'Requirements for alarm systems within ME systems.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '16.7', title: 'Power supply of ME systems', description: 'Power supply requirements and overload protection for ME systems.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '16.8', title: 'ME system marking and documentation', description: 'Marking and documentation requirements specific to ME systems.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },
  { section: '16.9', title: 'Network/data coupling for ME systems', description: 'Requirements for network and data coupling interfaces in ME systems.', sectionGroup: 16, sectionGroupName: 'ME Systems', type: 'evidence' },

  // §17 Electromagnetic compatibility (EMC)
  { section: '17.1', title: 'General EMC requirements', description: 'General electromagnetic compatibility requirements (detailed requirements in IEC 60601-1-2).', sectionGroup: 17, sectionGroupName: 'EMC', type: 'evidence' },
  { section: '17.2', title: 'Electromagnetic emissions', description: 'Electromagnetic emission limits and test requirements.', sectionGroup: 17, sectionGroupName: 'EMC', type: 'evidence' },
  { section: '17.3', title: 'Electromagnetic immunity', description: 'Electromagnetic immunity requirements and test levels.', sectionGroup: 17, sectionGroupName: 'EMC', type: 'evidence' },
  { section: '17.4', title: 'EMC documentation', description: 'Documentation requirements for EMC compliance including test reports and rationale.', sectionGroup: 17, sectionGroupName: 'EMC', type: 'evidence' },
];

export const IEC_60601_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  IEC_60601_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
