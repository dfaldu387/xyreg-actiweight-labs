import React from 'react';
import { TimelineMetrics } from '@/utils/ganttDragHandlers';

interface CISubTaskBarProps {
  type: 'document' | 'gap' | 'activity' | 'audit';
  title: string;
  count: number;
  completed: number;
  position: { left: number; width: number };
  metrics: TimelineMetrics;
  phaseStartDate?: Date;
  phaseEndDate?: Date;
  items?: any[]; // Individual CI items with names
}

const ciTypeColors = {
  document: 'bg-green-500',
  gap: 'bg-red-500', 
  activity: 'bg-orange-500',
  audit: 'bg-blue-500'
};

const ciTypePatterns = {
  completed: 'bg-opacity-100',
  in_progress: 'bg-opacity-60',
  pending: 'bg-opacity-30'
};

export function CISubTaskBar({
  type,
  title,
  count,
  completed,
  position,
  metrics,
  phaseStartDate,
  phaseEndDate,
  items
}: CISubTaskBarProps) {
  const completionPercentage = count > 0 ? (completed / count) * 100 : 0;
  const baseColor = ciTypeColors[type];
  
  // If we have individual items, display them separately
  if (items && items.length > 0) {
    return (
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={item.id || index} className="relative h-5 bg-muted rounded-sm">
            {/* CI task bar for individual item */}
            <div 
              className={`absolute top-0 h-full ${baseColor} rounded-sm transition-all duration-200 hover:bg-opacity-80`}
              style={{
                left: `${position.left}%`,
                width: `${position.width}%`,
                minWidth: '2px'
              }}
            >
              {/* Status indicator */}
              <div 
                className={`h-full rounded-sm ${
                  item.status === 'completed' ? 'bg-white bg-opacity-20' : 
                  item.status === 'in_progress' ? 'bg-white bg-opacity-10' : 'bg-transparent'
                }`}
                style={{ width: '100%' }}
              ></div>
            </div>
            
            {/* Individual CI name */}
            <div className="absolute left-2 top-0 h-full flex items-center">
              <span className="text-xs font-medium text-foreground bg-background/80 px-1 rounded truncate max-w-[200px]">
                {item.name || item.title || `${title} ${index + 1}`}
              </span>
            </div>
            
            {/* Status badge */}
            <div className="absolute right-2 top-0 h-full flex items-center">
              <span className="text-xs bg-background/80 px-1 rounded capitalize">
                {item.status || 'planned'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback to aggregated view if no items
  return (
    <div className="relative h-6 bg-muted rounded-sm">
      {/* CI type indicator */}
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-sm bg-border"></div>
      
      {/* CI task bar */}
      <div 
        className={`absolute top-0 h-full ${baseColor} rounded-sm transition-all duration-200 hover:bg-opacity-80`}
        style={{
          left: `${position.left}%`,
          width: `${position.width}%`,
          minWidth: '2px'
        }}
      >
        {/* Progress overlay */}
        <div 
          className="h-full bg-white bg-opacity-20 rounded-sm"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>
      
      {/* CI info label */}
      <div className="absolute left-2 top-0 h-full flex items-center">
        <span className="text-xs font-medium text-foreground bg-background/80 px-1 rounded">
          {title}
        </span>
      </div>
      
      {/* Completion badge */}
      <div className="absolute right-2 top-0 h-full flex items-center">
        <span className="text-xs bg-background/80 px-1 rounded">
          {Math.round(completionPercentage)}%
        </span>
      </div>
    </div>
  );
}