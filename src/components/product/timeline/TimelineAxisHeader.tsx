import React from 'react';
import { format, addMonths, startOfMonth, differenceInMonths, eachDayOfInterval, isWeekend, differenceInDays } from 'date-fns';
import { TimelineMetrics } from '@/utils/ganttDragHandlers';

interface TimelineAxisHeaderProps {
  metrics: TimelineMetrics;
}

export function TimelineAxisHeader({ metrics }: TimelineAxisHeaderProps) {
  const totalDays = differenceInDays(metrics.latestDate, metrics.earliestDate) + 1;
  const shouldShowDailyView = totalDays <= 90; // Show daily view for phases 3 months or less

  if (shouldShowDailyView) {
    // Daily view with weekend highlighting
    const days = eachDayOfInterval({
      start: metrics.earliestDate,
      end: metrics.latestDate
    });

    // Group days by month for month headers
    const monthGroups = days.reduce((groups: { month: Date; dayCount: number; startIndex: number }[], day, index) => {
      const monthKey = format(day, 'yyyy-MM');
      const existingMonth = groups.find(g => format(g.month, 'yyyy-MM') === monthKey);
      
      if (existingMonth) {
        existingMonth.dayCount++;
      } else {
        groups.push({ month: day, dayCount: 1, startIndex: index });
      }
      
      return groups;
    }, []);

    return (
      <div className="relative bg-background rounded border-b mb-2">
        {/* Month headers */}
        <div className="relative h-6 border-b border-border">
          {monthGroups.map((monthInfo) => {
            const widthPercent = (monthInfo.dayCount / totalDays) * 100;
            const leftPercent = (monthInfo.startIndex / totalDays) * 100;
            
            return (
              <div
                key={format(monthInfo.month, 'yyyy-MM')}
                className="absolute top-0 h-full flex items-center justify-center text-sm font-semibold text-foreground border-r border-border"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`
                }}
              >
                {format(monthInfo.month, 'MMM yyyy')}
              </div>
            );
          })}
        </div>
        
        {/* Daily grid background */}
        <div className="relative h-6">
          {days.map((day, index) => {
            const widthPercent = 100 / totalDays;
            const leftPercent = (index / totalDays) * 100;
            const isWeekendDay = isWeekend(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`absolute top-0 h-full flex items-center justify-center text-xs border-r border-border/50 ${
                  isWeekendDay 
                    ? 'bg-muted text-muted-foreground' 
                    : 'bg-background text-foreground'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`
                }}
                title={format(day, 'PPP')}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Monthly view for longer phases
  const startMonth = startOfMonth(metrics.earliestDate);
  const endMonth = startOfMonth(metrics.latestDate);
  const totalMonths = differenceInMonths(endMonth, startMonth) + 1;

  const months = [];
  for (let i = 0; i < totalMonths; i++) {
    months.push(addMonths(startMonth, i));
  }

  return (
    <div className="relative h-12 bg-background rounded border-b mb-2">
      {/* Year labels */}
      <div className="absolute top-0 left-0 right-0 h-6 border-b border-border">
        {months.reduce((years: { year: number; monthCount: number; startIndex: number }[], month, index) => {
          const year = month.getFullYear();
          const existingYear = years.find(y => y.year === year);
          
          if (existingYear) {
            existingYear.monthCount++;
          } else {
            years.push({ year, monthCount: 1, startIndex: index });
          }
          
          return years;
        }, []).map((yearInfo) => {
          const widthPercent = (yearInfo.monthCount / totalMonths) * 100;
          const leftPercent = (yearInfo.startIndex / totalMonths) * 100;
          
          return (
            <div
              key={yearInfo.year}
              className="absolute top-0 h-full flex items-center justify-center text-sm font-semibold text-foreground border-r border-border"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`
              }}
            >
              {yearInfo.year}
            </div>
          );
        })}
      </div>
      
      {/* Month labels */}
      <div className="absolute bottom-0 left-0 right-0 h-6">
        {months.map((month, index) => {
          const widthPercent = 100 / totalMonths;
          const leftPercent = (index / totalMonths) * 100;
          
          return (
            <div
              key={month.toISOString()}
              className="absolute top-0 h-full flex items-center justify-center text-xs text-muted-foreground border-r border-border"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`
              }}
            >
              {format(month, 'MMM')}
            </div>
          );
        })}
      </div>
    </div>
  );
}