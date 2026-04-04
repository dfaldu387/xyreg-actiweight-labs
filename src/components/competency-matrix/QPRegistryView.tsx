import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StaffMember, CompetencyEntry, ProficiencyLevel } from './types';
import { User, Mail, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  staff: StaffMember[];
  entries: CompetencyEntry[];
}

function getOverallStatus(staffId: string, entries: CompetencyEntry[]): 'green' | 'yellow' | 'red' {
  const staffEntries = entries.filter(e => e.staffId === staffId);
  if (staffEntries.length === 0) return 'red';
  const avg = staffEntries.reduce((s, e) => s + e.level, 0) / staffEntries.length;
  if (avg >= 2.5) return 'green';
  if (avg >= 1.5) return 'yellow';
  return 'red';
}

const statusConfig = {
  green: { labelKey: 'training.competency.qpRegistry.qualified', icon: CheckCircle2, badgeClass: 'bg-green-100 text-green-700 border-0' },
  yellow: { labelKey: 'training.competency.qpRegistry.gapsExist', icon: AlertTriangle, badgeClass: 'bg-yellow-100 text-yellow-700 border-0' },
  red: { labelKey: 'training.competency.qpRegistry.notQualified', icon: Shield, badgeClass: 'bg-red-100 text-red-700 border-0' },
};

const trainingConfig = {
  current: { labelKey: 'training.competency.qpRegistry.trainingCurrent', class: 'bg-green-100 text-green-700 border-0' },
  expiring: { labelKey: 'training.competency.qpRegistry.trainingExpiring', class: 'bg-yellow-100 text-yellow-700 border-0' },
  overdue: { labelKey: 'training.competency.qpRegistry.trainingOverdue', class: 'bg-red-100 text-red-700 border-0' },
};

export function QPRegistryView({ staff, entries }: Props) {
  const { lang } = useTranslation();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {staff.map(s => {
        const status = getOverallStatus(s.id, entries);
        const sc = statusConfig[status];
        const tc = trainingConfig[s.trainingStatus];
        const Icon = sc.icon;

        return (
          <Card key={s.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.role} · {s.department}</p>
                  </div>
                </div>
                <Badge variant="outline" className={sc.badgeClass}>
                  <Icon className="h-3 w-3 mr-1" />
                  {lang(sc.labelKey)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{s.email}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge variant="outline" className={tc.class}>{lang(tc.labelKey)}</Badge>
              </div>

              {s.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{lang('training.competency.qpRegistry.certifications')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.certifications.map(cert => (
                      <Badge key={cert.id} variant="outline" className="text-xs">
                        {cert.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
