import React from 'react';
import { format, startOfDay, endOfDay, differenceInDays, parseISO } from 'date-fns';
import { Activity } from '@/types/activities';
import { ProductAudit } from '@/types/audit';
import { FileText, AlertTriangle, Zap, Shield } from 'lucide-react';

interface MiniGanttChartProps {
  activities: Activity[];
  audits?: ProductAudit[];
  phaseStartDate?: string;
  phaseEndDate?: string;
}

export function MiniGanttChart({ activities, audits = [], phaseStartDate, phaseEndDate }: MiniGanttChartProps) {
  // Mock data for demonstration - in real app these would come from props
  const documents = [
    { id: '1', name: 'Requirements Document', status: 'completed', start_date: '2025-01-01', end_date: '2025-01-15' },
    { id: '2', name: 'Design Specification', status: 'in_progress', start_date: '2025-01-10', end_date: '2025-01-25' },
  ].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  const gapAnalysis = [
    { id: '1', name: 'Regulatory Gap Analysis', status: 'planned', start_date: '2025-01-05', end_date: '2025-01-20' },
  ].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const activitiesWithDates = activities.filter(a => a.start_date && a.end_date)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());
  const auditsWithDates = audits.filter(a => a.start_date && a.end_date)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());
  
  if (!activitiesWithDates.length && !auditsWithDates.length && !documents.length && !gapAnalysis.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No CI items to display
      </div>
    );
  }

  // Use phase dates as the timeline bounds - ensure proper date parsing
  const startDate = phaseStartDate ? startOfDay(parseISO(phaseStartDate)) : startOfDay(new Date('2025-01-01'));
  const endDate = phaseEndDate ? endOfDay(parseISO(phaseEndDate)) : endOfDay(new Date('2025-02-10'));
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const getStatusColor = (status: string, type: 'document' | 'gap' | 'activity' | 'audit' = 'activity') => {
    const statusLower = status.toLowerCase();
    
    switch (type) {
      case 'document':
        switch (statusLower) {
          case 'completed': return 'bg-blue-600';
          case 'in_progress': return 'bg-blue-400';
          case 'planned': return 'bg-blue-300';
          default: return 'bg-blue-200';
        }
      case 'gap':
        switch (statusLower) {
          case 'completed': return 'bg-yellow-600';
          case 'in_progress': return 'bg-yellow-400';
          case 'planned': return 'bg-yellow-300';
          default: return 'bg-yellow-200';
        }
      case 'activity':
        switch (statusLower) {
          case 'completed': return 'bg-emerald-500';
          case 'in_progress': return 'bg-emerald-400';
          case 'planned': return 'bg-emerald-300';
          case 'cancelled': return 'bg-red-500';
          default: return 'bg-gray-300';
        }
      case 'audit':
        switch (statusLower) {
          case 'completed': return 'bg-purple-600';
          case 'in_progress': case 'in progress': return 'bg-purple-400';
          case 'planned': return 'bg-purple-300';
          case 'overdue': return 'bg-red-600';
          default: return 'bg-purple-200';
        }
      default:
        return 'bg-gray-300';
    }
  };

  const getItemPosition = (item: any) => {
    const itemStart = parseISO(item.start_date!);
    const itemEnd = parseISO(item.end_date!);
    
    const startOffset = differenceInDays(itemStart, startDate);
    const duration = differenceInDays(itemEnd, itemStart) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const renderCIItem = (item: any, type: 'document' | 'gap' | 'activity' | 'audit', icon: React.ReactNode) => {
    const position = getItemPosition(item);
    const displayName = item.name || item.audit_name || `${type} ${item.id}`;
    
    return (
      <div key={`${type}-${item.id}`} className="relative h-8 flex items-center">
        {/* Item icon and name */}
        <div className="w-72 text-sm text-gray-600 truncate pr-4 flex items-center gap-2">
          {icon}
          {displayName}
        </div>
        
        {/* Gantt bar container */}
        <div className="flex-1 relative h-6 bg-gray-50 rounded">
          {/* Item bar */}
          <div
            className={`absolute h-full rounded ${getStatusColor(item.status, type)} 
              flex items-center justify-center text-white text-xs font-medium
              transition-all duration-200 hover:opacity-80`}
            style={position}
            title={`${displayName} (${format(parseISO(item.start_date!), 'MMM dd')} - ${format(parseISO(item.end_date!), 'MMM dd')})`}
          >
            <span className="truncate px-1">
              {item.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Generate time scale markers
  const timeMarkers = [];
  const markerCount = Math.min(6, totalDays); // Show max 6 markers
  for (let i = 0; i <= markerCount; i++) {
    const markerDate = new Date(startDate.getTime() + (i * (totalDays - 1) / markerCount) * 24 * 60 * 60 * 1000);
    const position = (i / markerCount) * 100;
    timeMarkers.push({
      date: markerDate,
      position: `${position}%`,
      label: format(markerDate, 'MMM dd')
    });
  }

  return (
    <div className="space-y-4">
      {/* Time scale */}
      <div className="flex items-end">
        <div className="w-72 flex-shrink-0"></div>
        <div className="flex-1 relative h-8 border-b border-border">
          {timeMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 text-xs text-muted-foreground"
              style={{ left: marker.position, transform: 'translateX(-50%)' }}
            >
              <div className="h-2 w-px bg-border mb-1"></div>
              <span>{marker.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All CI Items */}
      <div className="space-y-2">
        {/* Documents Section */}
        {documents.length > 0 && (
          <>
            <div className="text-base font-semibold text-black mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </div>
            {documents.map((doc) => renderCIItem(doc, 'document', <FileText className="h-3 w-3" />))}
            <div className="h-2" />
          </>
        )}

        {/* Gap Analysis Section */}
        {gapAnalysis.length > 0 && (
          <>
            <div className="text-base font-semibold text-black mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Gap Analysis
            </div>
            {gapAnalysis.map((gap) => renderCIItem(gap, 'gap', <AlertTriangle className="h-3 w-3" />))}
            <div className="h-2" />
          </>
        )}
        
        {/* Activities Section */}
        {activitiesWithDates.length > 0 && (
          <>
            <div className="text-base font-semibold text-black mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Activities
            </div>
            {activitiesWithDates.map((activity) => renderCIItem(activity, 'activity', <Zap className="h-3 w-3" />))}
            <div className="h-2" />
          </>
        )}

        {/* Audits Section */}
        {auditsWithDates.length > 0 && (
          <>
            <div className="text-base font-semibold text-black mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audits
            </div>
            {auditsWithDates.map((audit) => renderCIItem(audit, 'audit', <Shield className="h-3 w-3" />))}
          </>
        )}
      </div>

    </div>
  );
}