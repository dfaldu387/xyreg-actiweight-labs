import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, AlertCircle, Activity, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PhaseCIDisplayProps {
  phaseId: string;
  data: {
    documents: {
      total: number;
      completed: number;
      pending: number;
      overdue: number;
    };
    gapAnalysis: {
      total: number;
      completed: number;
      pending: number;
      overdue: number;
    };
    activities: Array<{
      id: string;
      title: string;
      status: string;
      due_date?: string;
      date?: string;
    }>;
    audits: Array<{
      id: string;
      title: string;
      status: string;
      due_date?: string;
      date?: string;
    }>;
  };
  phaseStartDate?: Date;
  phaseEndDate?: Date;
}

export function PhaseCIDisplay({ data, phaseStartDate, phaseEndDate }: PhaseCIDisplayProps) {
  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'compliant':
        return 'bg-green-500';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-500';
      case 'overdue':
        return 'bg-red-500';
      case 'blocked':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'MMM dd');
    } catch {
      return null;
    }
  };

  const calculateEventPosition = (eventDate: string) => {
    if (!phaseStartDate || !phaseEndDate) return 0;
    
    const event = new Date(eventDate);
    const start = phaseStartDate;
    const end = phaseEndDate;
    
    const totalDuration = end.getTime() - start.getTime();
    const eventOffset = event.getTime() - start.getTime();
    
    return Math.max(0, Math.min(100, (eventOffset / totalDuration) * 100));
  };

  return (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary/30 space-y-3">
      {/* Documents & Gap Analysis Progress Bars */}
      <div className="grid grid-cols-2 gap-4">
        {/* Documents */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Documents</span>
            <Badge variant="outline" className="text-xs">
              {data.documents.completed}/{data.documents.total}
            </Badge>
          </div>
          {data.documents.total > 0 && (
            <div className="space-y-1">
              <Progress 
                value={calculateProgress(data.documents.completed, data.documents.total)} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{calculateProgress(data.documents.completed, data.documents.total)}% complete</span>
                {data.documents.overdue > 0 && (
                  <span className="text-red-500">{data.documents.overdue} overdue</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Gap Analysis */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Gap Analysis</span>
            <Badge variant="outline" className="text-xs">
              {data.gapAnalysis.completed}/{data.gapAnalysis.total}
            </Badge>
          </div>
          {data.gapAnalysis.total > 0 && (
            <div className="space-y-1">
              <Progress 
                value={calculateProgress(data.gapAnalysis.completed, data.gapAnalysis.total)} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{calculateProgress(data.gapAnalysis.completed, data.gapAnalysis.total)}% complete</span>
                {data.gapAnalysis.overdue > 0 && (
                  <span className="text-red-500">{data.gapAnalysis.overdue} overdue</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Timeline - Activities & Audits */}
      {(data.activities.length > 0 || data.audits.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Scheduled Events</span>
          </div>
          
          <div className="relative">
            {/* Timeline bar */}
            <div className="h-2 bg-gray-200 rounded-full relative">
              {/* Event markers */}
              {[...data.activities, ...data.audits].map((event, index) => {
                const eventDate = event.due_date || event.date;
                if (!eventDate) return null;
                
                const position = calculateEventPosition(eventDate);
                const isActivity = 'title' in event && data.activities.includes(event as any);
                
                return (
                  <div
                    key={`${event.id}-${index}`}
                    className="absolute top-0 h-2 w-1 rounded-full transform -translate-x-1/2"
                    style={{ left: `${position}%` }}
                  >
                    <div 
                      className={`h-full w-full rounded-full ${getStatusColor(event.status)}`}
                      title={`${event.title} - ${formatEventDate(eventDate)}`}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Event legend */}
            <div className="mt-2 flex flex-wrap gap-2">
              {data.activities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center gap-1 text-xs">
                  <Activity className="h-3 w-3 text-green-600" />
                  <span className="truncate max-w-20">{activity.title}</span>
                  {activity.due_date && (
                    <span className="text-muted-foreground">
                      {formatEventDate(activity.due_date)}
                    </span>
                  )}
                </div>
              ))}
              {data.audits.slice(0, 3).map((audit) => (
                <div key={audit.id} className="flex items-center gap-1 text-xs">
                  <Shield className="h-3 w-3 text-blue-600" />
                  <span className="truncate max-w-20">{audit.title}</span>
                  {audit.due_date && (
                    <span className="text-muted-foreground">
                      {formatEventDate(audit.due_date)}
                    </span>
                  )}
                </div>
              ))}
              {(data.activities.length + data.audits.length) > 6 && (
                <span className="text-xs text-muted-foreground">
                  +{(data.activities.length + data.audits.length) - 6} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}