import React, { useMemo } from 'react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Video, Users, BookOpen, ExternalLink, CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUserTrainingRecords, useUserTrainingStats, useCompleteTraining } from '@/hooks/useTrainingRecords';
import { TrainingRecord, TrainingModuleType, TrainingStatus } from '@/types/training';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  userId: string;
  companyId: string;
}

const typeIcons: Record<TrainingModuleType, React.ElementType> = {
  sop: FileText,
  video: Video,
  workshop: Users,
  course: BookOpen,
  external: ExternalLink,
};

function getUrgencyColor(record: TrainingRecord): string {
  if (record.status === 'overdue' || record.status === 'expired') return 'border-l-destructive';
  if (!record.due_date) return 'border-l-muted';

  const dueDate = new Date(record.due_date);
  const now = new Date();

  if (isPast(dueDate)) return 'border-l-destructive';
  if (isWithinInterval(now, { start: now, end: addDays(now, 7) })) return 'border-l-amber-500';
  return 'border-l-green-500';
}

export function MyCompetencyRadar({ userId, companyId }: Props) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName: string }>();
  const { data: rawRecords = [], isLoading } = useUserTrainingRecords(userId, companyId);
  const stats = useUserTrainingStats(userId, companyId);
  const completeTraining = useCompleteTraining();

  // Defensive dedup: keep best record per training_module_id (completed > in_progress > not_started)
  const records = useMemo(() => {
    const statusPriority: Record<string, number> = { completed: 4, in_progress: 3, scheduled: 2, not_started: 1, overdue: 0, expired: 0 };
    const map = new Map<string, TrainingRecord>();
    for (const r of rawRecords) {
      const existing = map.get(r.training_module_id);
      if (!existing || (statusPriority[r.status] ?? 0) > (statusPriority[existing.status] ?? 0)) {
        map.set(r.training_module_id, r);
      }
    }
    return Array.from(map.values());
  }, [rawRecords]);

  // Status configuration with translated labels
  const statusConfig: Record<TrainingStatus, { label: string; color: string; icon: React.ElementType }> = {
    not_started: { label: lang('training.status.notStarted'), color: 'bg-muted text-muted-foreground', icon: Clock },
    scheduled: { label: lang('training.status.scheduled'), color: 'bg-blue-500/10 text-blue-500', icon: Calendar },
    in_progress: { label: lang('training.status.inProgress'), color: 'bg-amber-500/10 text-amber-500', icon: Clock },
    completed: { label: lang('training.status.completed'), color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
    overdue: { label: lang('training.status.overdue'), color: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
    expired: { label: lang('training.competencyRadar.expired'), color: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
  };

  // Filter to only show incomplete training, sorted by urgency
  const pendingRecords = records
    .filter(r => r.status !== 'completed')
    .sort((a, b) => {
      // Overdue first
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      // Then by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

  const handleComplete = (record: TrainingRecord) => {
    completeTraining.mutate({
      recordId: record.id,
      signature: record.training_module?.requires_signature,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {lang('training.competencyRadar.title')}
          </CardTitle>
          <Badge variant={stats.completionRate === 100 ? 'default' : 'secondary'}>
            {stats.completionRate}% {lang('training.competencyRadar.complete')}
          </Badge>
        </div>
        <Progress value={stats.completionRate} className="h-2" />
        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {stats.completed} {lang('training.competencyRadar.done')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {stats.in_progress} {lang('training.competencyRadar.inProgress')}
          </span>
          {stats.upcoming > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
              {stats.upcoming} {lang('training.competencyRadar.notStarted')}
            </span>
          )}
          {stats.overdue > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive"></span>
              {stats.overdue} {lang('training.competencyRadar.overdue')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">{lang('training.competencyRadar.allCaughtUp')}</p>
            <p className="text-sm">{lang('training.competencyRadar.noPendingTraining')}</p>
          </div>
        ) : (
          pendingRecords.slice(0, 5).map((record) => {
            const module = record.training_module;
            if (!module) return null;

            const TypeIcon = typeIcons[module.type];
            const status = statusConfig[record.status];
            const StatusIcon = status.icon;
            const urgencyColor = getUrgencyColor(record);

            return (
              <div
                key={record.id}
                className={`flex items-center gap-3 p-3 rounded-lg border border-l-4 ${urgencyColor} bg-card hover:bg-accent/50 transition-colors`}
              >
                <div className="p-2 rounded-lg bg-muted">
                  <TypeIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{module.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                    {record.due_date && (
                      <span>
                        {lang('training.competencyRadar.due')} {format(new Date(record.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={module.delivery_method === 'live_session' ? 'outline' : 'default'}
                  onClick={() => handleComplete(record)}
                  disabled={completeTraining.isPending}
                >
                  {module.delivery_method === 'live_session'
                    ? lang('training.competencyRadar.schedule')
                    : lang('training.competencyRadar.completeBtn')}
                </Button>
              </div>
            );
          })
        )}

        {pendingRecords.length > 5 && (
          <Button 
            variant="ghost" 
            className="w-full text-sm"
            onClick={() => navigate(`/app/company/${encodeURIComponent(companyName || '')}/training`)}
          >
            {lang('training.competencyRadar.viewAll') || 'View all'} ({pendingRecords.length} items)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
