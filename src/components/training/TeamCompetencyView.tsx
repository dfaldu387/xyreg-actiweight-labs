import React, { useState, useMemo } from 'react';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useCompanyTrainingRecords } from '@/hooks/useTrainingRecords';
import { useTrainingModules } from '@/hooks/useTrainingModules';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Download, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { DirectUserAssignment } from './DirectUserAssignment';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Props {
  companyId: string;
  disabled?: boolean;
}

interface TeamMemberStats {
  userId: string;
  userName: string;
  email: string;
  role: string;
  department: string | null;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
  complianceRate: number;
  reading: number;
  quizFailed: number;
}

export function TeamCompetencyView({ companyId, disabled = false }: Props) {
  const { users, isLoading: usersLoading } = useCompanyUsers(companyId);
  const { data: records, isLoading: recordsLoading } = useCompanyTrainingRecords(companyId);
  const { data: modules } = useTrainingModules(companyId);
  const { lang } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [assignUserId, setAssignUserId] = useState<string | null>(null);

  const teamStats = useMemo(() => {
    if (!users || !records) return [];

    return users.map(user => {
      const userRecords = records.filter(r => r.user_id === user.id);
      const completed = userRecords.filter(r => r.status === 'completed').length;
      const inProgress = userRecords.filter(r => r.status === 'in_progress' || r.status === 'scheduled').length;
      const notStarted = userRecords.filter(r => r.status === 'not_started').length;
      const overdue = userRecords.filter(r => r.status === 'overdue').length;
      const total = userRecords.length;
      const reading = userRecords.filter((r: any) => r.phase === 'reading' || r.phase === 'quiz_ready' || r.phase === 'sign_ready').length;
      const quizFailed = userRecords.filter((r: any) => r.phase === 'quiz_failed').length;
      
      return {
        userId: user.id,
        userName: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        total,
        completed,
        inProgress,
        notStarted,
        overdue,
        reading,
        quizFailed,
        complianceRate: total > 0 ? Math.round((completed / total) * 100) : 100,
      };
    });
  }, [users, records]);

  const filteredStats = useMemo(() => {
    return teamStats.filter(stat => {
      const matchesSearch = 
        stat.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stat.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (statusFilter === 'compliant') return stat.complianceRate >= 90;
      if (statusFilter === 'at-risk') return stat.complianceRate >= 70 && stat.complianceRate < 90;
      if (statusFilter === 'non-compliant') return stat.complianceRate < 70;
      if (statusFilter === 'overdue') return stat.overdue > 0;
      
      return true;
    });
  }, [teamStats, searchTerm, statusFilter]);

  const toggleExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getComplianceBadge = (rate: number) => {
    if (rate >= 90) return <Badge variant="default" className="bg-emerald-500">{lang('training.teamView.complianceBadge.compliant')}</Badge>;
    if (rate >= 70) return <Badge variant="secondary" className="bg-yellow-500 text-black">{lang('training.teamView.complianceBadge.atRisk')}</Badge>;
    return <Badge variant="destructive">{lang('training.teamView.complianceBadge.nonCompliant')}</Badge>;
  };

  const getUserRecords = (userId: string) => {
    return records?.filter(r => r.user_id === userId) || [];
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Total', 'Completed', 'In Progress', 'Not Started', 'Overdue', 'Compliance %'];
    const rows = filteredStats.map(stat => [
      stat.userName,
      stat.email,
      stat.role,
      stat.total,
      stat.completed,
      stat.inProgress,
      stat.notStarted,
      stat.overdue,
      stat.complianceRate
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-training-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (usersLoading || recordsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={lang('training.teamView.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={lang('training.teamView.filterPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('training.teamView.filterAll')}</SelectItem>
            <SelectItem value="compliant">{lang('training.teamView.filterCompliant')}</SelectItem>
            <SelectItem value="at-risk">{lang('training.teamView.filterAtRisk')}</SelectItem>
            <SelectItem value="non-compliant">{lang('training.teamView.filterNonCompliant')}</SelectItem>
            <SelectItem value="overdue">{lang('training.teamView.filterOverdue')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportToCSV} disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          {lang('training.teamView.export')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{lang('training.teamView.stats.totalTeam')}</span>
          </div>
          <p className="text-2xl font-bold mt-1">{teamStats.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">{lang('training.teamView.stats.compliant')}</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-emerald-500">
            {teamStats.filter(s => s.complianceRate >= 90).length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">{lang('training.teamView.stats.atRisk')}</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-yellow-500">
            {teamStats.filter(s => s.complianceRate >= 70 && s.complianceRate < 90).length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">{lang('training.teamView.stats.overdueItems')}</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-destructive">
            {teamStats.reduce((sum, s) => sum + s.overdue, 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>{lang('training.teamView.table.teamMember')}</TableHead>
              <TableHead>{lang('training.teamView.table.role')}</TableHead>
              <TableHead className="text-center">{lang('training.teamView.table.compliance')}</TableHead>
              <TableHead className="text-center">{lang('training.teamView.table.completed')}</TableHead>
              <TableHead className="text-center">{lang('training.teamView.table.inProgress')}</TableHead>
              <TableHead className="text-center">{lang('training.teamView.table.notStarted')}</TableHead>
              <TableHead className="text-center">{lang('training.teamView.table.overdue')}</TableHead>
              <TableHead className="text-right">{lang('training.teamView.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {lang('training.teamView.noTeamMembers')}
                </TableCell>
              </TableRow>
            ) : (
              filteredStats.map(stat => (
                <React.Fragment key={stat.userId}>
                  <TableRow 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(stat.userId)}
                  >
                    <TableCell>
                      {expandedUsers.has(stat.userId) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{stat.userName}</p>
                        <p className="text-sm text-muted-foreground">{stat.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{stat.role}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <Progress value={stat.complianceRate} className="w-20 h-2" />
                        <span className="text-xs">{stat.complianceRate}%</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          {stat.completed > 0 && <span className="text-emerald-600">●{stat.completed}</span>}
                          {stat.reading > 0 && <span className="text-blue-600" title="Reading / quiz / signing">▶{stat.reading}</span>}
                          {stat.quizFailed > 0 && <span className="text-amber-600" title="Quiz failed — trainer review">⚠{stat.quizFailed}</span>}
                          {stat.overdue > 0 && <span className="text-rose-600" title="Overdue">⊗{stat.overdue}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                        {stat.completed}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                        {stat.inProgress}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{stat.notStarted}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.overdue > 0 ? (
                        <Badge variant="destructive">{stat.overdue}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignUserId(stat.userId);
                        }}
                        title={lang('training.directAssignment.assignTraining')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded row with training details */}
                  {expandedUsers.has(stat.userId) && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 p-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium mb-2">{lang('training.teamView.trainingDetails')}</p>
                          {getUserRecords(stat.userId).length === 0 ? (
                            <p className="text-sm text-muted-foreground">{lang('training.teamView.noTrainingAssigned')}</p>
                          ) : (
                            <div className="grid gap-2">
                              {getUserRecords(stat.userId).map(record => (
                                <div
                                  key={record.id}
                                  className="flex items-center justify-between p-2 rounded bg-background border"
                                >
                                  <div>
                                    <p className="text-sm font-medium">
                                      {record.training_module?.name || lang('training.teamView.unknownModule')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {lang('training.teamView.dueDate')} {record.due_date ? new Date(record.due_date).toLocaleDateString() : lang('training.teamView.noDueDate')}
                                    </p>
                                  </div>
                                  <Badge 
                                    variant={
                                      record.status === 'completed' ? 'default' :
                                      record.status === 'overdue' ? 'destructive' :
                                      'secondary'
                                    }
                                  >
                                    {record.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <DirectUserAssignment
        companyId={companyId}
        open={!!assignUserId}
        onOpenChange={(open) => { if (!open) setAssignUserId(null); }}
        preSelectedUserId={assignUserId ?? undefined}
      />
    </div>
  );
}
