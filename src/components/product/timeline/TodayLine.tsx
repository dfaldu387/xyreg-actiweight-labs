
import React from 'react';
import { format } from 'date-fns';
import { TimelineMetrics, calculatePositionFromDate } from '@/utils/ganttDragHandlers';

interface TimelineDateLinesProps {
  metrics: TimelineMetrics;
  designFreezeDate?: string | Date | null;
  projectedLaunchDate?: string | Date | null;
}

export function TimelineDateLines({ metrics, designFreezeDate, projectedLaunchDate }: TimelineDateLinesProps) {
  const today = new Date();
  
  const dates = [
    {
      date: today,
      label: 'Today',
      color: 'blue',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500'
    },
    designFreezeDate && {
      date: new Date(designFreezeDate),
      label: 'Design Freeze',
      color: 'red',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-500'
    },
    projectedLaunchDate && {
      date: new Date(projectedLaunchDate),
      label: 'Projected Launch',
      color: 'green',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500'
    }
  ].filter(Boolean);
  
  return (
    <>
      {dates.map((dateInfo, index) => {
        if (!dateInfo) return null;
        
        // Check if date is within the timeline range
        const isWithinRange = dateInfo.date >= metrics.earliestDate && dateInfo.date <= metrics.latestDate;
        
        if (!isWithinRange) {
          return null;
        }
        
        const position = calculatePositionFromDate(dateInfo.date, metrics);
        
        return (
          <div
            key={index}
            className="absolute top-0 bottom-0 z-10 pointer-events-none"
            style={{ left: `${position}%` }}
          >
            <div className={`h-full border-l-2 ${dateInfo.borderColor} border-dotted`} />
            
            {/* Date label with connector */}
            <div 
              className={`absolute left-1/2 transform -translate-x-1/2 ${dateInfo.bgColor} text-white text-xs px-3 py-2 rounded whitespace-nowrap shadow-lg z-20 text-center`}
              style={{ 
                top: dateInfo.label === 'Design Freeze' ? '-64px' : 
                     dateInfo.label === 'Projected Launch' ? '-64px' : 
                     '-59px' 
              }}
            >
              {dateInfo.label}
              <div className="text-xs opacity-90 mt-1">
                {format(dateInfo.date, 'MMM dd, yyyy')}
              </div>
              {/* Connector line from box to timeline */}
              <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 border-l-2 ${dateInfo.borderColor} border-dotted bg-transparent`} 
                style={{ 
                  height: dateInfo.label === 'Design Freeze' ? '64px' : 
                          dateInfo.label === 'Projected Launch' ? '64px' : 
                          '59px' 
                }}></div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// Keep the old TodayLine component for backward compatibility, but make it blue
export function TodayLine({ metrics }: { metrics: TimelineMetrics }) {
  return <TimelineDateLines metrics={metrics} />;
}
