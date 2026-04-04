import React, { useState, useMemo } from 'react';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useCompanyTrainingRecords } from '@/hooks/useTrainingRecords';
import { useTrainingModules } from '@/hooks/useTrainingModules';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Download,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TrainingModule } from '@/types/training';
import { MatrixCellAction } from './MatrixCellAction';
import { GROUP_ORDER } from '@/constants/trainingGroups';

interface Props {
  companyId: string;
  onOpenRoleAssignment?: () => void;
  onOpenDirectAssignment?: () => void;
  onOpenAssignment?: () => void;
  disabled?: boolean;
}

type CellStatus = 'completed' | 'overdue' | 'in_progress' | 'scheduled' | 'upcoming' | 'not_required';

// Status dot component - replaces the old icon-based approach
function StatusDot({ status }: { status: CellStatus }) {
  const dotClass = {
    completed: 'bg-emerald-500',
    overdue: 'bg-destructive',
    in_progress: 'bg-blue-500',
    scheduled: 'border-2 border-orange-500 bg-transparent',
    upcoming: 'border-2 border-muted-foreground/40 bg-transparent',
    not_required: '',
  }[status];

  if (status === 'not_required') {
    return <span className="text-muted-foreground/30 text-xs">—</span>;
  }

  // Half-filled dot for in_progress
  if (status === 'in_progress') {
    return (
      <span className="relative inline-block w-3 h-3 rounded-full border-2 border-blue-500 overflow-hidden">
        <span className="absolute bottom-0 left-0 right-0 h-1/2 bg-blue-500" />
      </span>
    );
  }

  return <span className={`inline-block w-3 h-3 rounded-full ${dotClass}`} />;
}

export function TrainingMatrix({ companyId, onOpenRoleAssignment, onOpenDirectAssignment, disabled = false }: Props) {
  const { users, isLoading: usersLoading } = useCompanyUsers(companyId);
  const { data: records, isLoading: recordsLoading } = useCompanyTrainingRecords(companyId);
  const { data: modules, isLoading: modulesLoading } = useTrainingModules(companyId);
  const { lang } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAllModules, setShowAllModules] = useState(false);

  // Build matrix data
  const matrixData = useMemo(() => {
    if (!records) return new Map<string, Map<string, { status: CellStatus; recordId?: string; dueDate?: string }>>();

    const matrix = new Map<string, Map<string, { status: CellStatus; recordId?: string; dueDate?: string }>>();

    records.forEach(record => {
      if (!matrix.has(record.user_id)) {
        matrix.set(record.user_id, new Map());
      }

      let cellStatus: CellStatus = 'not_required';
      if (record.status === 'completed') cellStatus = 'completed';
      else if (record.status === 'overdue') cellStatus = 'overdue';
      else if (record.status === 'in_progress') cellStatus = 'in_progress';
      else if (record.status === 'scheduled') cellStatus = 'scheduled';
      else if (record.status === 'not_started') cellStatus = 'upcoming';

      matrix.get(record.user_id)!.set(record.training_module_id, {
        status: cellStatus,
        recordId: record.id,
        dueDate: record.due_date,
      });
    });

    return matrix;
  }, [records]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      const userStatuses = matrixData.get(user.id);
      if (!userStatuses) return statusFilter === 'not_required';
      const statuses = Array.from(userStatuses.values());
      if (statusFilter === 'completed') return statuses.every(s => s.status === 'completed');
      if (statusFilter === 'overdue') return statuses.some(s => s.status === 'overdue');
      if (statusFilter === 'in_progress') return statuses.some(s => s.status === 'in_progress' || s.status === 'scheduled');
      return true;
    });
  }, [users, searchTerm, statusFilter, matrixData]);

  // Collect module IDs that have at least one training record
  const assignedModuleIds = useMemo(() => {
    const ids = new Set<string>();
    matrixData.forEach(userMap => {
      userMap.forEach((_, moduleId) => ids.add(moduleId));
    });
    return ids;
  }, [matrixData]);

  const activeModules = useMemo(() => {
    const allActive = modules?.filter(m => m.is_active) || [];
    if (showAllModules) return allActive;
    return allActive.filter(m => assignedModuleIds.has(m.id));
  }, [modules, showAllModules, assignedModuleIds]);

  // Group active modules by group_name for column headers
  const groupedModules = useMemo(() => {
    const groups = new Map<string, TrainingModule[]>();
    activeModules.forEach(module => {
      const group = module.group_name || 'Other';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(module);
    });
    
    // Sort by GROUP_ORDER
    const ordered: { group: string; modules: TrainingModule[] }[] = [];
    GROUP_ORDER.forEach(name => {
      if (groups.has(name)) {
        ordered.push({ group: name, modules: groups.get(name)! });
        groups.delete(name);
      }
    });
    groups.forEach((mods, name) => ordered.push({ group: name, modules: mods }));
    return ordered;
  }, [activeModules]);

  // Flat ordered list for rendering cells
  const orderedModules = useMemo(() => {
    return groupedModules.flatMap(g => g.modules);
  }, [groupedModules]);

  const getStatusLabel = (status: CellStatus) => {
    switch (status) {
      case 'completed': return lang('training.status.completed');
      case 'overdue': return lang('training.status.overdue');
      case 'in_progress': return lang('training.status.inProgress');
      case 'scheduled': return lang('training.status.scheduled');
      case 'upcoming': return lang('training.status.notStarted');
      default: return lang('training.status.notRequired');
    }
  };

  const exportToCSV = () => {
    if (!orderedModules || !filteredUsers) return;
    const headers = ['Name', 'Email', ...orderedModules.map(m => m.name)];
    const rows = filteredUsers.map(user => {
      const userStatuses = matrixData.get(user.id) || new Map();
      return [
        user.name,
        user.email,
        ...orderedModules.map(m => {
          const cellData = userStatuses.get(m.id);
          return getStatusLabel(cellData?.status || 'not_required');
        })
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const isLoading = usersLoading || recordsLoading || modulesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!activeModules || activeModules.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">{lang('training.matrix.noActiveModules')}</p>
        <p className="text-sm text-muted-foreground mt-2">{lang('training.matrix.createModulesHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={lang('training.matrix.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={lang('training.matrix.filterPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('training.matrix.filterAll')}</SelectItem>
              <SelectItem value="completed">{lang('training.matrix.filterCompleted')}</SelectItem>
              <SelectItem value="overdue">{lang('training.matrix.filterOverdue')}</SelectItem>
              <SelectItem value="in_progress">{lang('training.matrix.filterInProgress')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          {onOpenDirectAssignment && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" onClick={onOpenDirectAssignment} disabled={disabled}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {lang('training.matrix.assignToUsers')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{lang('training.matrix.directAssignment')}</p>
                  <p className="text-xs text-muted-foreground">
                    {lang('training.matrix.directAssignmentDesc')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onOpenRoleAssignment && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={onOpenRoleAssignment} disabled={disabled}>
                    <Users className="h-4 w-4 mr-2" />
                    {lang('training.matrix.assignByRole')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{lang('training.matrix.roleBasedAssignment')}</p>
                  <p className="text-xs text-muted-foreground">
                    {lang('training.matrix.roleBasedAssignmentDesc')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button
            variant={showAllModules ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowAllModules(prev => !prev)}
          >
            {showAllModules ? lang('training.matrix.assignedOnly') : lang('training.matrix.showAll')}
          </Button>

          <Button variant="outline" onClick={exportToCSV} disabled={disabled}>
            <Download className="h-4 w-4 mr-2" />
            {lang('training.matrix.export')}
          </Button>
        </div>
      </div>

      {/* Compact Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>{lang('training.status.completed')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-destructive" />
          <span>{lang('training.status.overdue')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative inline-block w-2.5 h-2.5 rounded-full border-2 border-blue-500 overflow-hidden">
            <span className="absolute bottom-0 left-0 right-0 h-1/2 bg-blue-500" />
          </span>
          <span>{lang('training.status.inProgress')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-orange-500" />
          <span>{lang('training.status.scheduled')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-muted-foreground/40" />
          <span>{lang('training.status.notStarted')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/30">—</span>
          <span>{lang('training.status.notRequired')}</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="rounded-lg border">
        <ScrollArea className="w-full">
          <div className="min-w-max">
            <table className="w-full">
              <thead>
                {/* Group header row */}
                <tr className="border-b bg-muted/30">
                  <th className="sticky left-0 z-10 bg-muted/30 p-2" />
                  {groupedModules.map(({ group, modules: groupMods }) => (
                    <th
                      key={group}
                      colSpan={groupMods.length}
                      className="p-2 text-center text-xs font-semibold text-muted-foreground border-l first:border-l-0 uppercase tracking-wider"
                    >
                      {group}
                    </th>
                  ))}
                </tr>
                {/* Module name row */}
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 p-2 text-left font-medium text-sm min-w-[200px]">
                    {lang('training.matrix.teamMember')}
                  </th>
                  {orderedModules.map(module => (
                    <th key={module.id} className="p-2 text-center min-w-[60px] max-w-[80px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="text-xs font-medium truncate">{module.name.replace(/^SOP-0*/, 'SOP-')}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{module.name}</p>
                            {module.description && (
                              <p className="text-sm text-muted-foreground max-w-[250px]">
                                {module.description}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={orderedModules.length + 1} className="p-8 text-center text-muted-foreground">
                      {lang('training.matrix.noTeamMembers')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const userStatuses = matrixData.get(user.id) || new Map();
                    const hasAnyAssignment = assignedModuleIds.size > 0 && 
                      orderedModules.some(m => userStatuses.has(m.id));
                    
                    // User has no assignments at all — show a single-cell message
                    if (!hasAnyAssignment && orderedModules.length > 0) {
                      return (
                        <tr key={user.id} className="border-b hover:bg-muted/30">
                          <td className="sticky left-0 z-10 bg-background p-2 border-r">
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.role}</p>
                            </div>
                          </td>
                          <td colSpan={orderedModules.length} className="p-2 text-center text-xs text-muted-foreground italic">
                            {lang('training.matrix.noTrainingAssigned')}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={user.id} className="border-b hover:bg-muted/30">
                        <td className="sticky left-0 z-10 bg-background p-2 border-r">
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.role}</p>
                          </div>
                        </td>
                        {orderedModules.map(module => {
                          const cellData = userStatuses.get(module.id);
                          const status = cellData?.status || 'not_required';
                          return (
                            <td key={module.id} className="p-1 text-center">
                              <MatrixCellAction
                                userId={user.id}
                                userName={user.name}
                                moduleId={module.id}
                                moduleName={module.name}
                                companyId={companyId}
                                status={status}
                                recordId={cellData?.recordId}
                                dueDate={cellData?.dueDate}
                              >
                                <StatusDot status={status} />
                              </MatrixCellAction>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
