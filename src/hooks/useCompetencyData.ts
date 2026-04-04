import { useMemo } from 'react';
import { useCompanyUsers } from './useCompanyUsers';
import { useCompanyTrainingRecords } from './useTrainingRecords';
import { useTrainingModules } from './useTrainingModules';
import { CompetencyArea, StaffMember, CompetencyEntry, ProficiencyLevel, DepartmentReadiness } from '@/components/competency-matrix/types';

/**
 * Maps training modules to competency areas.
 * Each training module's type/name is mapped to the closest ISO competency area.
 * This is a simple heuristic — in Phase 2 we'll add explicit area tagging to modules.
 */
const MODULE_AREA_KEYWORDS: Record<string, string[]> = {
  'iso13485': ['iso 13485', 'qms', 'quality management', 'quality system'],
  'risk-mgt': ['risk', 'iso 14971', 'fmea', 'hazard'],
  'clinical-eval': ['clinical', 'mdr', 'evaluation'],
  'software-val': ['software', 'iec 62304', 'validation', 'csv'],
  'sterilization': ['sterilization', 'sterile', 'iso 11135', 'iso 11137'],
  'design-control': ['design', 'design control', 'v&v'],
  'biocompat': ['biocompatibility', 'iso 10993', 'biological'],
  'usability': ['usability', 'iec 62366', 'human factors'],
};

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

function guessAreaFromModule(moduleName: string): string | null {
  const lower = moduleName.toLowerCase();
  for (const [areaId, keywords] of Object.entries(MODULE_AREA_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return areaId;
  }
  return null;
}

function statusToProficiency(status: string, hasCompletedBefore: boolean): ProficiencyLevel {
  switch (status) {
    case 'completed': return hasCompletedBefore ? 3 : 2;
    case 'in_progress':
    case 'scheduled': return 1;
    case 'not_started': return 0;
    case 'overdue': return 0;
    default: return 0;
  }
}

function trainingOverallStatus(records: any[]): 'current' | 'expiring' | 'overdue' {
  if (records.length === 0) return 'current';
  const hasOverdue = records.some(r => r.status === 'overdue');
  if (hasOverdue) return 'overdue';
  const hasExpiring = records.some(r => {
    if (!r.expires_at) return false;
    const daysUntilExpiry = (new Date(r.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry < 30 && daysUntilExpiry > 0;
  });
  if (hasExpiring) return 'expiring';
  return 'current';
}

export function useCompetencyData(companyId: string | undefined) {
  const { users, isLoading: usersLoading } = useCompanyUsers(companyId);
  const { data: trainingRecords = [], isLoading: recordsLoading } = useCompanyTrainingRecords(companyId);
  const { data: modules = [], isLoading: modulesLoading } = useTrainingModules(companyId);

  const isLoading = usersLoading || recordsLoading || modulesLoading;

  const { staff, entries, readiness } = useMemo(() => {
    if (!users.length) return { staff: [] as StaffMember[], entries: [] as CompetencyEntry[], readiness: [] as DepartmentReadiness[] };

    // Build staff from real users
    const staffList: StaffMember[] = users.map(u => {
      const userRecords = trainingRecords.filter(r => r.user_id === u.id);
      return {
        id: u.id,
        name: u.name,
        role: u.role || 'Unassigned',
        department: u.department || u.functional_area || 'General',
        email: u.email,
        trainingStatus: trainingOverallStatus(userRecords),
        certifications: [],
      };
    });

    // Build competency entries from training records
    const entryMap = new Map<string, CompetencyEntry>();

    for (const record of trainingRecords) {
      const mod = modules.find(m => m.id === record.training_module_id);
      if (!mod) continue;

      const areaId = guessAreaFromModule(mod.name);
      if (!areaId) continue;

      const key = `${record.user_id}-${areaId}`;
      const existing = entryMap.get(key);
      const level = statusToProficiency(record.status, false);

      if (!existing || level > existing.level) {
        entryMap.set(key, {
          staffId: record.user_id,
          areaId,
          level,
          lastAssessed: record.completed_at || record.assigned_at || record.created_at || '',
          assessedBy: 'Training System',
          evidence: [{
            id: record.id,
            type: record.status === 'completed' ? 'training' : 'assessment',
            title: mod.name,
            date: record.completed_at || record.created_at || '',
            details: `Status: ${record.status}`,
          }],
        });
      }
    }

    // Fill in Level 0 for all staff/area combos with no record
    for (const s of staffList) {
      for (const area of COMPETENCY_AREAS) {
        const key = `${s.id}-${area.id}`;
        if (!entryMap.has(key)) {
          entryMap.set(key, {
            staffId: s.id,
            areaId: area.id,
            level: 0,
            lastAssessed: '',
            evidence: [],
          });
        }
      }
    }

    const entriesList = Array.from(entryMap.values());

    // Readiness
    const readinessData: DepartmentReadiness[] = COMPETENCY_AREAS.map(area => {
      const areaEntries = entriesList.filter(e => e.areaId === area.id);
      const qualified = areaEntries.filter(e => e.level >= 3).length;
      return { areaId: area.id, areaName: area.shortName, qualified, total: areaEntries.length };
    });

    return { staff: staffList, entries: entriesList, readiness: readinessData };
  }, [users, trainingRecords, modules]);

  return { staff, entries, readiness, areas: COMPETENCY_AREAS, isLoading };
}
