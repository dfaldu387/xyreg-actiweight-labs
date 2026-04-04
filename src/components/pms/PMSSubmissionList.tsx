import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PMSReport } from '@/hooks/usePMSData';
import { useTranslation } from '@/hooks/useTranslation';

interface PMSSubmissionListProps {
  reports: PMSReport[] | undefined;
  isLoading: boolean;
}

export function PMSSubmissionList({ reports, isLoading }: PMSSubmissionListProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">{lang('devicePMS.submissionList.empty')}</p>
        <p className="text-sm">{lang('devicePMS.submissionList.emptyHint')}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'submitted': case 'under_review': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card key={report.id} className="hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {report.report_type} - {report.regulatory_body || lang('devicePMS.submissionList.general')}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang('devicePMS.submissionList.submitted')}: {format(new Date(report.submission_date), 'MMM dd, yyyy')}
                </p>
              </div>
              <Badge variant={getStatusColor(report.submission_status)}>
                {report.submission_status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {report.reporting_period_start && report.reporting_period_end && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{lang('devicePMS.submissionList.reportingPeriod')}:</span>
                <span>
                  {format(new Date(report.reporting_period_start), 'MMM dd, yyyy')} - {format(new Date(report.reporting_period_end), 'MMM dd, yyyy')}
                </span>
              </div>
            )}
            {report.market_code && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{lang('devicePMS.submissionList.market')}:</span>
                <span>{report.market_code}</span>
              </div>
            )}
            {report.next_due_date && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-muted-foreground">{lang('devicePMS.submissionList.nextDue')}:</span>
                <span>{format(new Date(report.next_due_date), 'MMM dd, yyyy')}</span>
              </div>
            )}
            {report.notes && (
              <p className="text-muted-foreground italic">{report.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
