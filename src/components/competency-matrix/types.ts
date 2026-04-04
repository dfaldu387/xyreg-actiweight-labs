export type ProficiencyLevel = 0 | 1 | 2 | 3 | 4;

export interface CompetencyArea {
  id: string;
  name: string;
  shortName: string;
  isoReference?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  trainingStatus: 'current' | 'expiring' | 'overdue';
  certifications: Certification[];
}

export interface Certification {
  id: string;
  name: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
  status: 'valid' | 'expiring' | 'expired';
}

export interface CompetencyEntry {
  staffId: string;
  areaId: string;
  level: ProficiencyLevel;
  evidence: EvidenceItem[];
  lastAssessed: string;
  assessedBy?: string;
}

export interface EvidenceItem {
  id: string;
  type: 'certificate' | 'training' | 'assessment' | 'experience';
  title: string;
  date: string;
  details?: string;
}

export interface RoleRequirement {
  roleTitle: string;
  department: string;
  requirements: { areaId: string; requiredLevel: ProficiencyLevel }[];
}

export interface DepartmentReadiness {
  areaId: string;
  areaName: string;
  qualified: number;
  total: number;
}

export const PROFICIENCY_CONFIG: Record<ProficiencyLevel, { labelKey: string; colorClass: string; bgClass: string }> = {
  0: { labelKey: 'training.competency.proficiency.noKnowledge', colorClass: 'text-muted-foreground', bgClass: 'bg-muted' },
  1: { labelKey: 'training.competency.proficiency.theoretical', colorClass: 'text-blue-600', bgClass: 'bg-blue-100' },
  2: { labelKey: 'training.competency.proficiency.supervised', colorClass: 'text-yellow-600', bgClass: 'bg-yellow-100' },
  3: { labelKey: 'training.competency.proficiency.competent', colorClass: 'text-green-600', bgClass: 'bg-green-100' },
  4: { labelKey: 'training.competency.proficiency.expertTrainer', colorClass: 'text-amber-600', bgClass: 'bg-amber-100' },
};
