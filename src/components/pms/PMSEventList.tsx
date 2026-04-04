import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertTriangle, AlertCircle, Info, AlertOctagon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PMSEvent } from '@/hooks/usePMSData';
import { useTranslation } from '@/hooks/useTranslation';

interface PMSEventListProps {
  events: PMSEvent[] | undefined;
  isLoading: boolean;
}

export function PMSEventList({ events, isLoading }: PMSEventListProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">{lang('devicePMS.eventList.empty')}</p>
        <p className="text-sm">{lang('devicePMS.eventList.emptyHint')}</p>
      </div>
    );
  }

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'serious': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'moderate': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'minor': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'default';
      case 'investigating': return 'secondary';
      case 'escalated': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} className="hover:bg-accent/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {getSeverityIcon(event.severity)}
                  {event.event_type.replace('_', ' ').charAt(0).toUpperCase() + event.event_type.replace('_', ' ').slice(1)}
                  {event.is_reportable && (
                    <Badge variant="destructive" className="ml-2">{lang('devicePMS.eventList.reportable')}</Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(event.event_date), 'MMM dd, yyyy')}
                  {event.severity && <span className="ml-2">• {lang('devicePMS.eventList.severity')}: {event.severity}</span>}
                </p>
              </div>
              <Badge variant={getStatusColor(event.investigation_status)}>
                {event.investigation_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>{event.description}</p>
            
            {event.reporter_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{lang('devicePMS.eventList.reporter')}:</span>
                <span>{event.reporter_name}</span>
                {event.reporter_contact && <span>({event.reporter_contact})</span>}
              </div>
            )}

            {event.market_code && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{lang('devicePMS.eventList.market')}:</span>
                <span>{event.market_code}</span>
              </div>
            )}

            {event.reported_to_authority && event.authority_reference && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <span className="text-muted-foreground">{lang('devicePMS.eventList.authorityRef')}:</span>
                <span>{event.authority_reference}</span>
              </div>
            )}

            {event.root_cause && (
              <div className="mt-2 p-2 bg-muted rounded">
                <span className="font-medium">{lang('devicePMS.eventList.rootCause')}: </span>
                <span>{event.root_cause}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
