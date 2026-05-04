import React, { useMemo, useState } from 'react';
import { useTrainingModules } from '@/hooks/useTrainingModules';
import { useCompanyRolesList } from '@/hooks/useCompanyRolesList';
import {
  useRoleTrainingRequirements,
  useCreateRoleRequirement,
} from '@/hooks/useRoleTrainingRequirements';
import {
  isModuleRecommendedForRole,
  getRecommendedGroupsForRole,
  getRecommendedGroupsForUser,
  getInferredRoleLabel,
  getGroupForSOP,
} from '@/constants/trainingGroups';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useCompanyTrainingRecords } from '@/hooks/useTrainingRecords';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Sparkles, CheckCircle2, AlertCircle, Wand2, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TrainingModule } from '@/types/training';

interface Props {
  companyId: string;
  disabled?: boolean;
}

interface RoleRow {
  roleId: string;
  roleName: string;
  recommended: TrainingModule[];
  recommendedGroups: string[];
  assignedCount: number;
  missing: TrainingModule[];
}

export function TrainingSetupWizard({ companyId, disabled }: Props) {
  const { data: modules, isLoading: modulesLoading } = useTrainingModules(companyId);
  const { data: roles, isLoading: rolesLoading } = useCompanyRolesList(companyId);
  const { data: requirements, isLoading: reqLoading } = useRoleTrainingRequirements(companyId);
  const createRequirement = useCreateRoleRequirement(companyId);
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const activeModules = useMemo(
    () => (modules || []).filter(m => m.is_active),
    [modules]
  );

  const rows: RoleRow[] = useMemo(() => {
    if (!roles) return [];
    return roles.map(role => {
      const recommended = activeModules.filter(m =>
        isModuleRecommendedForRole(m.name, role.role_name)
      );
      const recommendedGroups = getRecommendedGroupsForRole(role.role_name);
      const assignedForRole = (requirements || []).filter(r => r.role_id === role.id);
      const assignedModuleIds = new Set(assignedForRole.map(r => r.training_module_id));
      const missing = recommended.filter(m => !assignedModuleIds.has(m.id));
      return {
        roleId: role.id,
        roleName: role.role_name,
        recommended,
        recommendedGroups,
        assignedCount: assignedForRole.length,
        missing,
      };
    });
  }, [roles, activeModules, requirements]);

  const totalMissing = rows.reduce((sum, r) => sum + r.missing.length, 0);

  const applyRowMissing = async (row: RoleRow) => {
    if (disabled || row.missing.length === 0) return;
    setBusyRoleId(row.roleId);
    try {
      for (const m of row.missing) {
        await createRequirement.mutateAsync({
          role_id: row.roleId,
          training_module_id: m.id,
          is_mandatory: true,
          due_type: 'days_after_assignment',
          due_days: 30,
        });
      }
      toast.success(`Applied ${row.missing.length} recommended module(s) to ${row.roleName}`);
    } catch (e) {
      toast.error('Failed to apply recommendations');
      console.error(e);
    } finally {
      setBusyRoleId(null);
    }
  };

  const applyAll = async () => {
    if (disabled || totalMissing === 0) return;
    setBulkBusy(true);
    try {
      for (const row of rows) {
        for (const m of row.missing) {
          await createRequirement.mutateAsync({
            role_id: row.roleId,
            training_module_id: m.id,
            is_mandatory: true,
            due_type: 'days_after_assignment',
            due_days: 30,
          });
        }
      }
      toast.success(`Applied ${totalMissing} recommendation(s) across ${rows.length} role(s)`);
    } catch (e) {
      toast.error('Bulk apply failed partway through');
      console.error(e);
    } finally {
      setBulkBusy(false);
    }
  };

  const isLoading = modulesLoading || rolesLoading || reqLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!roles || roles.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No roles defined</AlertTitle>
        <AlertDescription>
          Define your company's roles in Settings → Roles & Permissions first. Once roles
          exist, this wizard will recommend a default training set per role based on the
          ISO 13485 Section 6.2 competency framework.
        </AlertDescription>
      </Alert>
    );
  }

  if (activeModules.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No training modules</AlertTitle>
        <AlertDescription>
          The Training Library is empty. Approve at least one SOP, or open the Library tab
          and sync from approved SOPs to populate modules.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-primary/40 bg-primary/5">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertTitle>Recommended training per role</AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm">
            Based on the {roles.length} role(s) defined in your company Settings, Xyreg
            suggests a default Locked Workflow training set per role. Apply per row, or
            apply everything in one click.
          </p>
          <Button
            onClick={applyAll}
            disabled={disabled || bulkBusy || totalMissing === 0}
            size="sm"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {totalMissing === 0
              ? 'All recommendations applied'
              : bulkBusy
              ? 'Applying…'
              : `Apply all (${totalMissing} missing across ${rows.filter(r => r.missing.length > 0).length} role(s))`}
          </Button>
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Recommended set</th>
              <th className="px-4 py-2 font-medium text-center">Recommended</th>
              <th className="px-4 py-2 font-medium text-center">Assigned</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const upToDate = row.missing.length === 0 && row.recommended.length > 0;
              return (
                <tr key={row.roleId} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.roleName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.recommendedGroups.map(g => (
                        <Badge key={g} variant="secondary" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {row.recommended.length}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    {row.assignedCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {upToDate ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Up to date
                      </span>
                    ) : row.recommended.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No recommendation</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={disabled || busyRoleId === row.roleId || bulkBusy}
                        onClick={() => applyRowMissing(row)}
                      >
                        {busyRoleId === row.roleId
                          ? 'Applying…'
                          : row.assignedCount === 0
                          ? `Apply ${row.missing.length}`
                          : `Sync ${row.missing.length} missing`}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Recommendations come from the SOP grouping in <code>src/constants/trainingGroups.ts</code>
        mapped to each role's name. After applying, fine-tune individual mandatory flags and
        due dates in the Matrix tab → Role Assignment dialog.
      </p>

      <PeopleRecommendationTable
        companyId={companyId}
        activeModules={activeModules}
        disabled={disabled}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// By-person recommendation table (uses functional_area / external_role signals
// from user_company_access — covers users whose role isn't formalised in the
// company_roles table yet).
// ---------------------------------------------------------------------------

interface PeopleProps {
  companyId: string;
  activeModules: TrainingModule[];
  disabled?: boolean;
}

function PeopleRecommendationTable({ companyId, activeModules, disabled }: PeopleProps) {
  const { users, isLoading: usersLoading, updateUserPermissions } = useCompanyUsers(companyId);
  const { data: records, isLoading: recLoading } = useCompanyTrainingRecords(companyId);
  const queryClient = useQueryClient();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [titleEdits, setTitleEdits] = useState<Record<string, string>>({});
  const [savingTitleFor, setSavingTitleFor] = useState<string | null>(null);

  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, moduleIds }: { userId: string; moduleIds: string[] }) => {
      const due = new Date();
      due.setDate(due.getDate() + 30);
      const dueDate = due.toISOString().slice(0, 10);
      const rows = moduleIds.map(moduleId => ({
        user_id: userId,
        training_module_id: moduleId,
        company_id: companyId,
        status: 'not_started',
        due_date: dueDate,
      }));
      const { error } = await supabase.from('training_records').insert(rows);
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-records'] });
    },
  });

  const peopleRows = useMemo(() => {
    return (users || []).map(u => {
      const signals = {
        functional_area: u.functional_area ?? null,
        external_role: u.external_role ?? null,
        department: u.department ?? null,
        title: (u as any).job_title ?? null,
        is_internal: u.is_internal,
      };
      const groups = getRecommendedGroupsForUser(signals);
      const recommended = activeModules.filter(m => {
        const g = getGroupForSOP(m.name);
        return g ? groups.includes(g) : false;
      });
      const userRecords = (records || []).filter(r => r.user_id === u.id);
      const assignedModuleIds = new Set(userRecords.map(r => r.training_module_id));
      const missing = recommended.filter(m => !assignedModuleIds.has(m.id));
      const role = getInferredRoleLabel(signals);
      return {
        userId: u.id,
        name: u.name,
        roleLabel: role.label,
        needsDefinition: role.needsDefinition,
        groups,
        recommended,
        assignedCount: userRecords.length,
        missing,
      };
    });
  }, [users, records, activeModules]);

  const totalMissing = peopleRows.reduce((s, r) => s + r.missing.length, 0);
  const skippedCount = peopleRows.filter(r => r.needsDefinition && r.missing.length > 0).length;

  const applyOne = async (row: typeof peopleRows[number]) => {
    if (disabled || row.missing.length === 0 || row.needsDefinition) return;
    setBusyUserId(row.userId);
    try {
      await assignUserMutation.mutateAsync({
        userId: row.userId,
        moduleIds: row.missing.map(m => m.id),
      });
      toast.success(`Assigned ${row.missing.length} module(s) to ${row.name}`);
    } catch (e) {
      toast.error('Failed to assign training');
      console.error(e);
    } finally {
      setBusyUserId(null);
    }
  };

  const applyAllPeople = async () => {
    if (disabled || totalMissing === 0) return;
    setBulkBusy(true);
    let assigned = 0;
    try {
      for (const row of peopleRows) {
        if (row.missing.length === 0 || row.needsDefinition) continue;
        await assignUserMutation.mutateAsync({
          userId: row.userId,
          moduleIds: row.missing.map(m => m.id),
        });
        assigned += row.missing.length;
      }
      const skipped = peopleRows.filter(r => r.needsDefinition && r.missing.length > 0).length;
      toast.success(
        `Assigned ${assigned} module(s)` +
          (skipped > 0 ? ` — ${skipped} person(s) skipped (role undefined)` : '')
      );
    } catch (e) {
      toast.error('Bulk assignment failed partway through');
      console.error(e);
    } finally {
      setBulkBusy(false);
    }
  };

  const saveTitle = async (userId: string) => {
    const value = (titleEdits[userId] || '').trim();
    if (!value) return;
    setSavingTitleFor(userId);
    try {
      const ok = await updateUserPermissions(userId, { job_title: value });
      if (ok) {
        setTitleEdits(prev => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
      }
    } finally {
      setSavingTitleFor(null);
    }
  };

  if (usersLoading || recLoading) return null;
  if (peopleRows.length === 0) return null;

  return (
    <div className="space-y-3 pt-4">
      <Alert className="border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20">
        <UserCircle2 className="h-4 w-4 text-amber-600" />
        <AlertTitle>Recommended training per person</AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm">
            For users whose role isn't formalised in Settings → Roles, Xyreg infers a
            recommended set from their functional area, external role, or department title.
            Apply per row, or assign everything in one click.
          </p>
          <Button
            onClick={applyAllPeople}
            disabled={disabled || bulkBusy || totalMissing === 0}
            size="sm"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {totalMissing === 0
              ? 'Everyone is up to date'
              : bulkBusy
              ? 'Assigning…'
              : `Assign all (${totalMissing} missing across ${peopleRows.filter(r => r.missing.length > 0).length} person(s))`}
          </Button>
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Person</th>
              <th className="px-4 py-2 font-medium">Inferred role</th>
              <th className="px-4 py-2 font-medium">Recommended set</th>
              <th className="px-4 py-2 font-medium text-center">Recommended</th>
              <th className="px-4 py-2 font-medium text-center">Assigned</th>
              <th className="px-4 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {peopleRows.map(row => {
              const upToDate = row.missing.length === 0 && row.recommended.length > 0;
              return (
                <tr key={row.userId} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{row.roleLabel}</span>
                      {row.needsDefinition && (
                        <div className="flex items-center gap-1">
                          <Input
                            value={titleEdits[row.userId] ?? ''}
                            onChange={e =>
                              setTitleEdits(prev => ({ ...prev, [row.userId]: e.target.value }))
                            }
                            placeholder="e.g. CEO"
                            className="h-7 w-28 text-xs"
                            disabled={savingTitleFor === row.userId}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={
                              !titleEdits[row.userId]?.trim() || savingTitleFor === row.userId
                            }
                            onClick={() => saveTitle(row.userId)}
                          >
                            {savingTitleFor === row.userId ? '…' : 'Set'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.groups.map(g => (
                        <Badge key={g} variant="secondary" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{row.recommended.length}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{row.assignedCount}</td>
                  <td className="px-4 py-3 text-right">
                    {row.needsDefinition ? (
                      <span className="text-xs text-amber-700">Define role first</span>
                    ) : upToDate ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Up to date
                      </span>
                    ) : row.recommended.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No recommendation</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={disabled || busyUserId === row.userId || bulkBusy}
                        onClick={() => applyOne(row)}
                      >
                        {busyUserId === row.userId
                          ? 'Assigning…'
                          : row.assignedCount === 0
                          ? `Assign ${row.missing.length}`
                          : `Sync ${row.missing.length} missing`}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}