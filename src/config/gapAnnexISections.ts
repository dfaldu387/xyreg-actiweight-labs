import type { GenericSectionItem, GenericSectionGroup } from '@/components/company/gap-analysis/GenericGapLaunchView';

/**
 * MDR Annex I — General Safety and Performance Requirements (GSPRs)
 */
export const ANNEX_I_SECTIONS: GenericSectionItem[] = [
  // Chapter I — General requirements
  { section: '1', title: 'Devices shall achieve intended performance and be safe', description: 'Demonstrate that the device achieves its intended performance and is designed to be safe for patients, users, and third parties under normal conditions of use.', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },
  { section: '2', title: 'Risk management system — eliminate or reduce risks (ALARP)', description: 'Implement a risk management system to eliminate or reduce risks as far as possible (ALARP principle). Provide risk management plan and residual risk assessment.', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },
  { section: '3', title: 'Devices shall meet applicable GSPRs considering intended purpose', description: 'Identify which GSPRs apply to the device based on its intended purpose, and justify why non-applicable requirements do not apply.', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },
  { section: '4', title: 'Risk management measures and information for safety', description: 'Apply risk management measures in priority order: inherently safe design, adequate protection, information for safety. Document the rationale.', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },
  { section: '5', title: 'Devices shall not adversely affect clinical condition/safety of patients', description: 'Demonstrate that the device does not compromise the clinical condition or safety of patients when used as intended.', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },
  { section: '6', title: 'Known and foreseeable risks vs clinical benefits assessment', description: 'Provide a benefit-risk assessment demonstrating that known and foreseeable risks are acceptable when weighed against the clinical benefits.', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },
  { section: '7', title: 'Performance during intended lifetime', description: 'Demonstrate that the device maintains performance and safety throughout its intended service life under normal use and maintenance conditions.', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },
  { section: '8', title: 'Transport, storage and use conditions', description: 'Demonstrate that the device is safe when subject to the stresses of transport, storage, and conditions of use (e.g. temperature, humidity).', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },
  { section: '9', title: 'Undesirable side-effects — acceptable risk-benefit', description: 'Identify undesirable side-effects and demonstrate they constitute an acceptable risk when weighed against the intended benefits.', sectionGroup: 1, sectionGroupName: 'Chapter I — General Requirements', type: 'evidence' },

  // Chapter II — Requirements regarding design and manufacture
  { section: '10', title: 'Chemical, physical and biological properties', description: 'Address material selection (biocompatibility, toxicology), substances in contact with the body, CMR/endocrine disruptors, and contamination risks.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Material choice (toxicological, biocompatibility, compatibility with substances)' },
      { letter: '2', description: 'Biocompatibility of materials in contact with body' },
      { letter: '3', description: 'Substances considered CMR, endocrine disruptors' },
      { letter: '4', description: 'Device is designed to reduce contamination/residue risks' },
    ],
  },
  { section: '11', title: 'Infection and microbial contamination', description: 'Minimise infection risks, ensure sterility where required, validate sterilisation methods, and provide appropriate packaging for sterile devices.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Minimise infection risk to patient, user and third parties' },
      { letter: '2', description: 'Tissues of animal origin — safety of sourcing and processing' },
      { letter: '3', description: 'Devices labelled sterile — designed to ensure sterility' },
      { letter: '4', description: 'Devices intended to be sterilised — suitable validated methods' },
      { letter: '5', description: 'Packaging system for sterile devices' },
      { letter: '6', description: 'Sterile and non-sterile products distinguishable (labelling/packaging)' },
    ],
  },
  { section: '12', title: 'Devices incorporating a substance considered a medicinal product', description: 'If the device incorporates a medicinal substance, provide evidence of safety, quality, and usefulness of the substance. Consult relevant competent authority.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence' },
  { section: '13', title: 'Devices composed of substances absorbed by or dispersed in the body', description: 'For devices composed of substances absorbed/dispersed in the body, provide toxicological, pharmacological, and biocompatibility data.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence' },
  { section: '14', title: 'Devices and their connection to other devices and energy sources', description: 'Address EMC, environmental risks, unauthorised access, software/IT integration, and remote management for connected devices.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Design to remove or reduce electromagnetic interference risks' },
      { letter: '2', description: 'Designed and manufactured to avoid environmental risks' },
      { letter: '3', description: 'Protection against unauthorised access to settings' },
      { letter: '4', description: 'Software and IT integration requirements' },
      { letter: '5', description: 'Devices networked with other products or managed remotely' },
    ],
  },
  { section: '15', title: 'Protection against mechanical and thermal risks', description: 'Demonstrate protection against mechanical risks (moving parts, surfaces, instability) and thermal risks (burns, heat dissipation).', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence' },
  { section: '16', title: 'Protection against risks from energy sources (electrical, thermal, fire)', description: 'Address electrical safety, thermal protection, and fire prevention for active devices. Provide test results per applicable standards.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence' },
  { section: '17', title: 'Protection against risks from diagnostic and therapeutic radiation', description: 'For radiation-emitting devices, demonstrate appropriate radiation levels and quality. For ionising radiation, justify dose vs clinical purpose.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Designed to ensure appropriate radiation level and quality' },
      { letter: '2', description: 'Devices emitting ionising radiation — intended clinical purpose vs dose' },
    ],
  },
  { section: '18', title: 'Software and digital health requirements', description: 'Develop software per state of the art (lifecycle, risk management, verification/validation). Implement IT security measures against unauthorised access.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Software developed according to state of the art (lifecycle, risk, verification)' },
      { letter: '2', description: 'IT security measures including protection against unauthorised access' },
    ],
  },
  { section: '19', title: 'Active devices and connected systems', description: 'For active devices, address alarm systems, warning indicators, and protection against unintended or hazardous output.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence' },
  { section: '20', title: 'Devices with measuring function — accuracy and calibration', description: 'Demonstrate measuring accuracy and stability. Provide calibration procedures and measurement uncertainty analysis.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence' },
  { section: '21', title: 'Devices with diagnostic or monitoring function', description: 'Demonstrate sufficient accuracy and reliability of diagnostic/monitoring information provided to the user or patient.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence' },
  { section: '22', title: 'Devices incorporating materials of biological origin', description: 'For devices using biological materials, address sourcing, processing, preservation, and testing to minimise infection and immunological risks.', sectionGroup: 2, sectionGroupName: 'Chapter II — Design & Manufacture', type: 'evidence' },

  // Chapter III — Requirements regarding information supplied with the device
  { section: '23', title: 'Label and instructions for use — general requirements', description: 'Provide compliant labels (manufacturer details, UDI, safety info, symbols) and instructions for use (intended purpose, residual risks, installation, maintenance).', sectionGroup: 3, sectionGroupName: 'Chapter III — Information Supplied with Device', type: 'evidence',
    subItems: [
      { letter: '1', description: 'Labels shall include manufacturer details, device identification, safety info' },
      { letter: '2', description: 'Information on label expressed using internationally recognised symbols' },
      { letter: '3', description: 'UDI carrier on label or on device itself' },
      { letter: '4', description: 'Instructions for use shall contain manufacturer info, intended purpose, residual risks' },
    ],
  },
];

export const ANNEX_I_GROUPS: GenericSectionGroup[] = (() => {
  const seen = new Map<number, string>();
  ANNEX_I_SECTIONS.forEach(s => {
    if (!seen.has(s.sectionGroup)) seen.set(s.sectionGroup, s.sectionGroupName);
  });
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
})();
