import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle2, Clock, AlertTriangle, MinusCircle } from 'lucide-react';
import { XYREG_MODULE_GROUPS } from '@/data/xyregModuleGroups';
import { useAllModuleGroupValidations } from '@/hooks/useModuleGroupValidation';
import { useCompanyId } from '@/hooks/useCompanyId';

type ValidationStatus = 'validated' | 'pending' | 'invalidated' | 'not_started';

const STATUS_CONFIG: Record<ValidationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  validated: { label: 'Validated', color: 'bg-emerald-500', icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: 'In Progress', color: 'bg-amber-500', icon: <Clock className="h-3 w-3" /> },
  invalidated: { label: 'Re-validation Required', color: 'bg-red-500', icon: <AlertTriangle className="h-3 w-3" /> },
  not_started: { label: 'Not Started', color: 'bg-muted-foreground/40', icon: <MinusCircle className="h-3 w-3" /> },
};

interface ValidationCoverageDashboardProps {
  adoptedReleaseId?: string | null;
}

export function ValidationCoverageDashboard({ adoptedReleaseId = null }: ValidationCoverageDashboardProps) {
  const groups = XYREG_MODULE_GROUPS;
  const companyId = useCompanyId() || '';
  const { data: dbValidations = [] } = useAllModuleGroupValidations(companyId, adoptedReleaseId);

  // Derive status from real DB data instead of fake hash
  function getModuleStatus(groupId: string): ValidationStatus {
    const record = dbValidations.find(v => v.module_group_id === groupId);
    if (!record) return 'not_started';
    if (record.overall_verdict === 'validated') return 'validated';
    if (record.overall_verdict === 'validated_with_conditions') return 'validated';
    if (record.overall_verdict === 'not_validated') return 'invalidated';
    // Has some data but no overall verdict yet = in progress
    if (record.iq_verdict || record.oq_verdict || record.pq_verdict) return 'pending';
    return 'not_started';
  }

  const statuses = groups.map(g => ({ group: g, status: getModuleStatus(g.id) }));

  const counts: Record<ValidationStatus, number> = { validated: 0, pending: 0, invalidated: 0, not_started: 0 };
  statuses.forEach(s => counts[s.status]++);

  const total = groups.length;
  const coveragePct = Math.round((counts.validated / total) * 100);

  return (
    <Card className="border-primary/20">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Software Validation Coverage (CSV-VP-001)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Overall coverage */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{coveragePct}%</p>
            <p className="text-xs text-muted-foreground">Coverage</p>
          </div>
          <div className="flex-1 space-y-1.5">
            <Progress value={coveragePct} className="h-2.5" />
            <div className="flex items-center gap-3 flex-wrap">
              {(Object.keys(STATUS_CONFIG) as ValidationStatus[]).map(key => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[key].color}`} />
                  <span>{STATUS_CONFIG[key].label}: <strong className="text-foreground">{counts[key]}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-group mini bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {statuses.map(({ group, status }) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={group.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md border bg-muted/10">
                <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.color}`} />
                <span className="text-xs font-medium truncate flex-1">{group.name}</span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 shrink-0">
                  {cfg.icon}
                  <span className="ml-0.5">{cfg.label}</span>
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
