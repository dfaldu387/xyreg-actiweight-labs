import { CompetencyArea, StaffMember, CompetencyEntry, RoleRequirement, ProficiencyLevel } from './types';

export const COMPETENCY_AREAS: CompetencyArea[] = [
  { id: 'iso13485', name: 'ISO 13485 QMS', shortName: 'QMS', isoReference: '§4-8' },
  { id: 'risk-mgt', name: 'Risk Management', shortName: 'Risk', isoReference: 'ISO 14971' },
  { id: 'clinical-eval', name: 'Clinical Evaluation', shortName: 'Clinical', isoReference: 'MDR Art.61' },
  { id: 'software-val', name: 'Software Validation', shortName: 'SW Val', isoReference: 'IEC 62304' },
  { id: 'sterilization', name: 'Sterilization', shortName: 'Steril.', isoReference: 'ISO 11135/11137' },
  { id: 'design-control', name: 'Design Control', shortName: 'Design', isoReference: '§7.3' },
  { id: 'biocompat', name: 'Biocompatibility', shortName: 'Biocompat', isoReference: 'ISO 10993' },
  { id: 'usability', name: 'Usability Engineering', shortName: 'Usability', isoReference: 'IEC 62366' },
];

export const MOCK_STAFF: StaffMember[] = [
  { id: 's1', name: 'Dr. Maria Chen', role: 'Quality Director', department: 'Quality', email: 'maria.chen@example.com', trainingStatus: 'current', certifications: [
    { id: 'c1', name: 'Lead Auditor ISO 13485', issuedBy: 'BSI', issuedDate: '2024-03-15', expiryDate: '2027-03-15', status: 'valid' },
    { id: 'c2', name: 'Six Sigma Black Belt', issuedBy: 'ASQ', issuedDate: '2022-06-01', status: 'valid' },
  ]},
  { id: 's2', name: 'Thomas Weber', role: 'RA Manager', department: 'Regulatory', email: 'thomas.weber@example.com', trainingStatus: 'current', certifications: [
    { id: 'c3', name: 'RAC (EU)', issuedBy: 'RAPS', issuedDate: '2023-09-01', expiryDate: '2026-09-01', status: 'valid' },
  ]},
  { id: 's3', name: 'Sarah Johnson', role: 'Clinical Specialist', department: 'Clinical', email: 'sarah.johnson@example.com', trainingStatus: 'expiring', certifications: [
    { id: 'c4', name: 'GCP Certificate', issuedBy: 'ACRP', issuedDate: '2023-01-10', expiryDate: '2026-01-10', status: 'expiring' },
  ]},
  { id: 's4', name: 'Erik Lindberg', role: 'Software Engineer', department: 'R&D', email: 'erik.lindberg@example.com', trainingStatus: 'current', certifications: [
    { id: 'c5', name: 'IEC 62304 Practitioner', issuedBy: 'TÜV SÜD', issuedDate: '2024-05-20', expiryDate: '2027-05-20', status: 'valid' },
  ]},
  { id: 's5', name: 'Priya Sharma', role: 'Process Engineer', department: 'Manufacturing', email: 'priya.sharma@example.com', trainingStatus: 'overdue', certifications: [] },
  { id: 's6', name: 'James O\'Brien', role: 'Design Engineer', department: 'R&D', email: 'james.obrien@example.com', trainingStatus: 'current', certifications: [
    { id: 'c6', name: 'DFMEA Practitioner', issuedBy: 'SAE', issuedDate: '2024-02-10', status: 'valid' },
  ]},
  { id: 's7', name: 'Yuki Tanaka', role: 'Biocompatibility Scientist', department: 'R&D', email: 'yuki.tanaka@example.com', trainingStatus: 'current', certifications: [
    { id: 'c7', name: 'ISO 10993 Specialist', issuedBy: 'Nelson Labs', issuedDate: '2023-11-01', expiryDate: '2026-11-01', status: 'valid' },
  ]},
  { id: 's8', name: 'Ana Kowalski', role: 'Sterilization Engineer', department: 'Manufacturing', email: 'ana.kowalski@example.com', trainingStatus: 'current', certifications: [
    { id: 'c8', name: 'EO Sterilization Specialist', issuedBy: 'AAMI', issuedDate: '2024-01-15', status: 'valid' },
  ]},
];

const makeEntry = (staffId: string, areaId: string, level: ProficiencyLevel, date: string): CompetencyEntry => ({
  staffId, areaId, level, lastAssessed: date, assessedBy: 'System',
  evidence: level > 0 ? [
    { id: `${staffId}-${areaId}-ev`, type: level >= 3 ? 'certificate' : 'training', title: `${level >= 3 ? 'Certification' : 'Training'} Record`, date, details: `Proficiency level ${level} verified.` }
  ] : [],
});

export const MOCK_ENTRIES: CompetencyEntry[] = [
  // Maria Chen - Quality Director (strong across QMS)
  makeEntry('s1', 'iso13485', 4, '2025-12-01'), makeEntry('s1', 'risk-mgt', 3, '2025-11-15'),
  makeEntry('s1', 'clinical-eval', 2, '2025-10-01'), makeEntry('s1', 'software-val', 1, '2025-09-01'),
  makeEntry('s1', 'sterilization', 2, '2025-08-01'), makeEntry('s1', 'design-control', 3, '2025-07-01'),
  makeEntry('s1', 'biocompat', 1, '2025-06-01'), makeEntry('s1', 'usability', 2, '2025-05-01'),
  // Thomas Weber - RA Manager
  makeEntry('s2', 'iso13485', 3, '2025-12-01'), makeEntry('s2', 'risk-mgt', 3, '2025-11-15'),
  makeEntry('s2', 'clinical-eval', 3, '2025-10-01'), makeEntry('s2', 'software-val', 1, '2025-09-01'),
  makeEntry('s2', 'sterilization', 1, '2025-08-01'), makeEntry('s2', 'design-control', 2, '2025-07-01'),
  makeEntry('s2', 'biocompat', 2, '2025-06-01'), makeEntry('s2', 'usability', 1, '2025-05-01'),
  // Sarah Johnson - Clinical
  makeEntry('s3', 'iso13485', 2, '2025-12-01'), makeEntry('s3', 'risk-mgt', 2, '2025-11-15'),
  makeEntry('s3', 'clinical-eval', 4, '2025-10-01'), makeEntry('s3', 'software-val', 0, '2025-09-01'),
  makeEntry('s3', 'sterilization', 0, '2025-08-01'), makeEntry('s3', 'design-control', 1, '2025-07-01'),
  makeEntry('s3', 'biocompat', 3, '2025-06-01'), makeEntry('s3', 'usability', 2, '2025-05-01'),
  // Erik Lindberg - Software
  makeEntry('s4', 'iso13485', 2, '2025-12-01'), makeEntry('s4', 'risk-mgt', 2, '2025-11-15'),
  makeEntry('s4', 'clinical-eval', 0, '2025-10-01'), makeEntry('s4', 'software-val', 4, '2025-09-01'),
  makeEntry('s4', 'sterilization', 0, '2025-08-01'), makeEntry('s4', 'design-control', 3, '2025-07-01'),
  makeEntry('s4', 'biocompat', 0, '2025-06-01'), makeEntry('s4', 'usability', 3, '2025-05-01'),
  // Priya Sharma - Process Engineer
  makeEntry('s5', 'iso13485', 1, '2025-12-01'), makeEntry('s5', 'risk-mgt', 1, '2025-11-15'),
  makeEntry('s5', 'clinical-eval', 0, '2025-10-01'), makeEntry('s5', 'software-val', 0, '2025-09-01'),
  makeEntry('s5', 'sterilization', 3, '2025-08-01'), makeEntry('s5', 'design-control', 2, '2025-07-01'),
  makeEntry('s5', 'biocompat', 1, '2025-06-01'), makeEntry('s5', 'usability', 0, '2025-05-01'),
  // James O'Brien - Design Engineer
  makeEntry('s6', 'iso13485', 2, '2025-12-01'), makeEntry('s6', 'risk-mgt', 3, '2025-11-15'),
  makeEntry('s6', 'clinical-eval', 1, '2025-10-01'), makeEntry('s6', 'software-val', 2, '2025-09-01'),
  makeEntry('s6', 'sterilization', 0, '2025-08-01'), makeEntry('s6', 'design-control', 4, '2025-07-01'),
  makeEntry('s6', 'biocompat', 1, '2025-06-01'), makeEntry('s6', 'usability', 3, '2025-05-01'),
  // Yuki Tanaka - Biocompat Scientist
  makeEntry('s7', 'iso13485', 2, '2025-12-01'), makeEntry('s7', 'risk-mgt', 2, '2025-11-15'),
  makeEntry('s7', 'clinical-eval', 2, '2025-10-01'), makeEntry('s7', 'software-val', 0, '2025-09-01'),
  makeEntry('s7', 'sterilization', 1, '2025-08-01'), makeEntry('s7', 'design-control', 1, '2025-07-01'),
  makeEntry('s7', 'biocompat', 4, '2025-06-01'), makeEntry('s7', 'usability', 1, '2025-05-01'),
  // Ana Kowalski - Sterilization Engineer
  makeEntry('s8', 'iso13485', 2, '2025-12-01'), makeEntry('s8', 'risk-mgt', 2, '2025-11-15'),
  makeEntry('s8', 'clinical-eval', 0, '2025-10-01'), makeEntry('s8', 'software-val', 0, '2025-09-01'),
  makeEntry('s8', 'sterilization', 4, '2025-08-01'), makeEntry('s8', 'design-control', 1, '2025-07-01'),
  makeEntry('s8', 'biocompat', 2, '2025-06-01'), makeEntry('s8', 'usability', 0, '2025-05-01'),
];

export const MOCK_ROLE_REQUIREMENTS: RoleRequirement[] = [
  { roleTitle: 'Quality Director', department: 'Quality', requirements: [
    { areaId: 'iso13485', requiredLevel: 4 }, { areaId: 'risk-mgt', requiredLevel: 3 },
    { areaId: 'design-control', requiredLevel: 3 }, { areaId: 'clinical-eval', requiredLevel: 2 },
  ]},
  { roleTitle: 'RA Manager', department: 'Regulatory', requirements: [
    { areaId: 'iso13485', requiredLevel: 3 }, { areaId: 'risk-mgt', requiredLevel: 3 },
    { areaId: 'clinical-eval', requiredLevel: 3 }, { areaId: 'design-control', requiredLevel: 2 },
  ]},
  { roleTitle: 'Clinical Specialist', department: 'Clinical', requirements: [
    { areaId: 'clinical-eval', requiredLevel: 4 }, { areaId: 'biocompat', requiredLevel: 3 },
    { areaId: 'iso13485', requiredLevel: 2 }, { areaId: 'risk-mgt', requiredLevel: 2 },
  ]},
  { roleTitle: 'Software Engineer', department: 'R&D', requirements: [
    { areaId: 'software-val', requiredLevel: 4 }, { areaId: 'design-control', requiredLevel: 3 },
    { areaId: 'usability', requiredLevel: 3 }, { areaId: 'risk-mgt', requiredLevel: 2 },
  ]},
  { roleTitle: 'Process Engineer', department: 'Manufacturing', requirements: [
    { areaId: 'sterilization', requiredLevel: 3 }, { areaId: 'design-control', requiredLevel: 2 },
    { areaId: 'iso13485', requiredLevel: 2 }, { areaId: 'risk-mgt', requiredLevel: 2 },
  ]},
  { roleTitle: 'Design Engineer', department: 'R&D', requirements: [
    { areaId: 'design-control', requiredLevel: 4 }, { areaId: 'risk-mgt', requiredLevel: 3 },
    { areaId: 'usability', requiredLevel: 3 }, { areaId: 'iso13485', requiredLevel: 2 },
  ]},
];

export function getDepartmentReadiness() {
  return COMPETENCY_AREAS.map(area => {
    const entries = MOCK_ENTRIES.filter(e => e.areaId === area.id);
    const qualified = entries.filter(e => e.level >= 3).length;
    return { areaId: area.id, areaName: area.shortName, qualified, total: entries.length };
  });
}
