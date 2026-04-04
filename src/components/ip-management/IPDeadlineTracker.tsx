import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useIPDeadlines, useUpdateIPDeadline, IPDeadline } from '@/hooks/useIPDeadlines';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { useTranslation } from '@/hooks/useTranslation';

type DeadlineStatus = Database['public']['Enums']['deadline_status'];

interface IPDeadlineTrackerProps {
  companyId: string;
  disabled?: boolean;
}

export function IPDeadlineTracker({ companyId, disabled }: IPDeadlineTrackerProps) {
  const { data: deadlines, isLoading } = useIPDeadlines(companyId);
  const updateDeadline = useUpdateIPDeadline();
  const [statusFilter, setStatusFilter] = useState<string>('upcoming');
  const { lang } = useTranslation();

  const handleStatusChange = async (deadlineId: string, newStatus: DeadlineStatus) => {
    if (disabled) return;
    try {
      await updateDeadline.mutateAsync({ id: deadlineId, status: newStatus });
      toast.success(lang('ipPortfolio.deadlineTracker.statusUpdated'));
    } catch (error) {
      toast.error(lang('ipPortfolio.deadlineTracker.statusUpdateFailed'));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredDeadlines = deadlines?.filter(d => 
    statusFilter === 'all' || d.status === statusFilter
  ) || [];

  const getUrgencyColor = (date: string, status: string) => {
    if (status !== 'upcoming') return 'outline';
    const daysUntil = differenceInDays(new Date(date), new Date());
    if (daysUntil < 0) return 'destructive';
    if (daysUntil <= 7) return 'destructive';
    if (daysUntil <= 30) return 'secondary';
    return 'outline';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'missed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <X className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {lang('ipPortfolio.deadlineTracker.title')}
            </CardTitle>
            <CardDescription>{lang('ipPortfolio.deadlineTracker.description')}</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter} disabled={disabled}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={lang('ipPortfolio.deadlineTracker.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('ipPortfolio.deadlineTracker.allDeadlines')}</SelectItem>
              <SelectItem value="upcoming">{lang('ipPortfolio.deadlineTracker.upcoming')}</SelectItem>
              <SelectItem value="completed">{lang('ipPortfolio.deadlineTracker.completed')}</SelectItem>
              <SelectItem value="missed">{lang('ipPortfolio.deadlineTracker.missed')}</SelectItem>
              <SelectItem value="cancelled">{lang('ipPortfolio.deadlineTracker.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDeadlines.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{lang('ipPortfolio.deadlineTracker.noDeadlinesFound')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeadlines.map((deadline) => {
              const daysUntil = differenceInDays(new Date(deadline.due_date), new Date());
              return (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {getStatusIcon(deadline.status)}
                    </div>
                    <div>
                      <div className="font-medium">{deadline.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        <span>{deadline.ip_asset?.title || lang('ipPortfolio.deadlineTracker.general')}</span>
                        <span>•</span>
                        <span>{deadline.deadline_type}</span>
                        <span>•</span>
                        <span>{format(new Date(deadline.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                      {deadline.description && (
                        <p className="text-sm text-muted-foreground mt-1">{deadline.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getUrgencyColor(deadline.due_date, deadline.status)}>
                      {deadline.status === 'upcoming'
                        ? daysUntil < 0
                          ? lang('ipPortfolio.deadlineTracker.daysOverdue').replace('{{count}}', String(Math.abs(daysUntil)))
                          : lang('ipPortfolio.deadlineTracker.days').replace('{{count}}', String(daysUntil))
                        : deadline.status}
                    </Badge>
                    {deadline.status === 'upcoming' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(deadline.id, 'completed')}
                          disabled={disabled}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(deadline.id, 'cancelled')}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
