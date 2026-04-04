import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, CheckCircle2, AlertTriangle, Clock, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useUserTrainingRecords, useUserTrainingStats } from '@/hooks/useTrainingRecords';
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';

interface TrainingStatusCardProps {
  companyId?: string;
  onRemove?: () => void;
}

export function TrainingStatusCard({ companyId, onRemove }: TrainingStatusCardProps) {
  const { user } = useAuth();
  const { lang } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const stats = useUserTrainingStats(user?.id, companyId);
  const { data: records, isLoading } = useUserTrainingRecords(user?.id, companyId);

  const nextTraining = records
    ?.filter(r => r.status === 'not_started' || r.status === 'scheduled')
    ?.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })?.[0];

  const overdueRecords = records?.filter(r => r.status === 'overdue') || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4" />
              {lang('missionControl.widgets.trainingStatus')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isAllComplete = stats.total > 0 && stats.overdue === 0 && stats.upcoming === 0 && stats.in_progress === 0;
  const hasNoTraining = stats.total === 0;

  const cardBody = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {stats.completed > 0 && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {stats.completed} {lang('missionControl.widgets.completed')}
          </Badge>
        )}
        {stats.in_progress > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            {stats.in_progress} {lang('missionControl.widgets.inProgress')}
          </Badge>
        )}
        {stats.overdue > 0 && (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {stats.overdue} {lang('missionControl.widgets.overdueTraining')}
          </Badge>
        )}
      </div>

      {hasNoTraining ? (
        <p className="text-sm text-muted-foreground">
          {lang('missionControl.widgets.noTrainingAssigned')}
        </p>
      ) : isAllComplete ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {lang('missionControl.widgets.allTrainingComplete')}
        </div>
      ) : overdueRecords.length > 0 ? (
        <div className="text-sm">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="h-4 w-4" />
            {overdueRecords.length} {lang('missionControl.widgets.trainingOverdue')}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {overdueRecords[0]?.training_module?.name}
          </p>
        </div>
      ) : nextTraining ? (
        <div className="text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {lang('missionControl.widgets.nextTraining')}
          </div>
          <p className="font-medium mt-1">{nextTraining.training_module?.name}</p>
          {nextTraining.due_date && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang('missionControl.widgets.dueBy')} {new Date(nextTraining.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
      ) : null}

      {stats.total > 0 && (
        <div className="pt-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{lang('missionControl.widgets.completionRate')}</span>
            <span>{stats.completionRate}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                stats.completionRate === 100
                  ? 'bg-emerald-500'
                  : stats.overdue > 0
                  ? 'bg-destructive'
                  : 'bg-primary'
              }`}
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            {lang('missionControl.widgets.trainingStatus')}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
            {onRemove && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{cardBody}</CardContent>
    </Card>
  );
}
