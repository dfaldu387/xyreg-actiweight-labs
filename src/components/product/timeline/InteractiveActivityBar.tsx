import React, { useState, useRef, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Edit } from "lucide-react";
import { 
  getDragZone, 
  calculateNewDates, 
  calculatePositionFromDate,
  DragState, 
  TimelineMetrics
} from '@/utils/ganttDragHandlers';

interface Activity {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status: string;
  type: string;
  phase_id?: string;
}

interface InteractiveActivityBarProps {
  activity: Activity;
  position: { left: number; width: number };
  metrics: TimelineMetrics;
  phaseStartDate?: Date;
  phaseEndDate?: Date;
  onDateChange: (activityId: string, startDate: Date | undefined, endDate: Date | undefined) => void;
  disabled?: boolean;
}

export function InteractiveActivityBar({ 
  activity, 
  position, 
  metrics, 
  phaseStartDate,
  phaseEndDate,
  onDateChange,
  disabled = false
}: InteractiveActivityBarProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    phaseId: null,
    startX: 0,
    startDate: null,
    startEndDate: null,
    originalDuration: 0
  });
  
  const [hoverZone, setHoverZone] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [previewDates, setPreviewDates] = useState<{ startDate: Date; endDate: Date; isValid?: boolean; violations?: string[]; warnings?: string[] } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activityStartDate = activity.start_date ? new Date(activity.start_date) : undefined;
  const activityEndDate = activity.end_date ? new Date(activity.end_date) : undefined;
  const hasValidDates = activityStartDate && activityEndDate;

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragState.isDragging || !containerRef.current || disabled) return;

      const rect = containerRef.current.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      
      console.log('[InteractiveActivityBar] Mouse move during drag:', {
        activityId: activity.id,
        currentX
      });
      
    // Calculate new dates with phase boundaries as constraints
    const newDates = calculateActivityNewDates(
      dragState, 
      currentX, 
      metrics,
      phaseStartDate,
      phaseEndDate
    );
    
    console.log('[InteractiveActivityBar] Calculated new dates:', {
      activityId: activity.id,
      activityName: activity.name,
      newDates,
      currentX,
      deltaX: currentX - dragState.startX
    });
    
    if (newDates) {
      setPreviewDates(newDates);
    }
    };

    const handleMouseUp = async () => {
      if (dragState.isDragging && previewDates && !disabled) {
        console.log('[InteractiveActivityBar] Mouse up - applying changes:', {
          activityId: activity.id,
          startDate: previewDates.startDate,
          endDate: previewDates.endDate
        });

        // Apply changes only if no violations
        if (!previewDates.violations || previewDates.violations.length === 0) {
          onDateChange(activity.id, previewDates.startDate, previewDates.endDate);
        }
      }
      
      setDragState({
        isDragging: false,
        dragType: null,
        phaseId: null,
        startX: 0,
        startDate: null,
        startEndDate: null,
        originalDuration: 0
      });
      setPreviewDates(null);
      setHoverZone(null);
    };

    if (dragState.isDragging && !disabled) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.dragType === 'move' ? 'grabbing' : 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragState, previewDates, metrics, onDateChange, disabled, activity.id, phaseStartDate, phaseEndDate]);

  const calculateActivityNewDates = (
    dragState: DragState,
    currentX: number,
    metrics: TimelineMetrics,
    phaseStartDate?: Date,
    phaseEndDate?: Date
  ) => {
    if (!dragState.startDate || !dragState.startEndDate) {
      console.error('[InteractiveActivityBar] Missing drag state dates:', {
        startDate: dragState.startDate,
        startEndDate: dragState.startEndDate
      });
      return null;
    }

    const originalDuration = differenceInDays(dragState.startEndDate, dragState.startDate);
    const deltaX = currentX - dragState.startX;
    const deltaDays = Math.round((deltaX / metrics.containerWidth) * metrics.totalDays);
    
    console.log('[InteractiveActivityBar] DRAG CALCULATION DEBUG:', {
      activityId: activity.id,
      activityName: activity.name,
      dragType: dragState.dragType,
      deltaX,
      containerWidth: metrics.containerWidth,
      totalDays: metrics.totalDays,
      deltaDays,
      originalDates: {
        start: dragState.startDate.toISOString().split('T')[0],
        end: dragState.startEndDate.toISOString().split('T')[0]
      },
      timelineMetrics: {
        earliest: metrics.earliestDate.toISOString().split('T')[0],
        latest: metrics.latestDate.toISOString().split('T')[0]
      }
    });
    
    let newStartDate = new Date(dragState.startDate);
    let newEndDate = new Date(dragState.startEndDate);
    let violations: string[] = [];

    if (dragState.dragType === 'move') {
      // CRITICAL FIX: Use addDays instead of setDate to avoid month boundary issues
      newStartDate = new Date(dragState.startDate.getTime() + (deltaDays * 24 * 60 * 60 * 1000));
      newEndDate = new Date(dragState.startEndDate.getTime() + (deltaDays * 24 * 60 * 60 * 1000));
      
      console.log('[InteractiveActivityBar] MOVE calculation:', {
        deltaDays,
        newStartDate: newStartDate.toISOString().split('T')[0],
        newEndDate: newEndDate.toISOString().split('T')[0]
      });
    } else if (dragState.dragType === 'resize-start') {
      // Allow extending start date in both directions
      newStartDate = new Date(dragState.startDate.getTime() + (deltaDays * 24 * 60 * 60 * 1000));
      // Only constrain if it would make duration negative
      if (newStartDate >= newEndDate) {
        newStartDate = new Date(newEndDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before end
      }
      
      console.log('[InteractiveActivityBar] RESIZE-START calculation:', {
        deltaDays,
        newStartDate: newStartDate.toISOString().split('T')[0],
        keptEndDate: newEndDate.toISOString().split('T')[0]
      });
    } else if (dragState.dragType === 'resize-end') {
      // Allow extending end date in both directions
      newEndDate = new Date(dragState.startEndDate.getTime() + (deltaDays * 24 * 60 * 60 * 1000));
      // Only constrain if it would make duration negative
      if (newEndDate <= newStartDate) {
        newEndDate = new Date(newStartDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after start
      }
      
      console.log('[InteractiveActivityBar] RESIZE-END calculation:', {
        deltaDays,
        keptStartDate: newStartDate.toISOString().split('T')[0],
        newEndDate: newEndDate.toISOString().split('T')[0]
      });
    }

    // Show warnings for phase boundary violations but don't block
    let warnings: string[] = [];
    if (phaseStartDate && newStartDate < phaseStartDate) {
      warnings.push(`Activity starts before phase start date (${format(phaseStartDate, 'MMM dd, yyyy')})`);
    }
    if (phaseEndDate && newEndDate > phaseEndDate) {
      warnings.push(`Activity ends after phase end date (${format(phaseEndDate, 'MMM dd, yyyy')})`);
    }

    const result = {
      startDate: newStartDate,
      endDate: newEndDate,
      isValid: true, // Always allow moves, just show warnings
      violations: [], // No hard blocks
      warnings
    };
    
    console.log('[InteractiveActivityBar] FINAL RESULT:', {
      activityId: activity.id,
      startDate: result.startDate.toISOString().split('T')[0],
      endDate: result.endDate.toISOString().split('T')[0],
      warnings: result.warnings
    });

    return result;
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!hasValidDates || !barRef.current || !containerRef.current || disabled) return;
    
    event.preventDefault();
    
    const dragType = getDragZone(event, barRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    
    console.log('[InteractiveActivityBar] Starting drag:', {
      activityId: activity.id,
      dragType,
      startX
    });
    
    setDragState({
      isDragging: true,
      dragType,
      phaseId: activity.id, // Reusing field for activity ID
      startX,
      startDate: activityStartDate!,
      startEndDate: activityEndDate!,
      originalDuration: 0
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!dragState.isDragging && barRef.current && !disabled) {
      const zone = getDragZone(event, barRef.current);
      setHoverZone(zone);
    }
  };

  const handleMouseLeave = () => {
    if (!dragState.isDragging) {
      setHoverZone(null);
    }
  };

  const getCursor = () => {
    if (disabled) return 'not-allowed';
    if (dragState.isDragging) {
      return dragState.dragType === 'move' ? 'grabbing' : 'col-resize';
    }
    if (hoverZone === 'move') return 'grab';
    if (hoverZone === 'resize-start' || hoverZone === 'resize-end') return 'col-resize';
    return 'default';
  };

  const calculateActivityDuration = (startDate?: Date, endDate?: Date): string => {
    if (!startDate || !endDate) return "";
    
    const days = differenceInDays(endDate, startDate);
    
    if (days < 0) return "Invalid dates";
    if (days === 0) return "Same day";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const displayDates = previewDates || (hasValidDates ? { startDate: activityStartDate!, endDate: activityEndDate! } : null);
  const hasViolations = previewDates?.violations && previewDates.violations.length > 0;
  const hasWarnings = previewDates?.warnings && previewDates.warnings.length > 0;

  // Calculate duration text
  const durationText = displayDates ? calculateActivityDuration(displayDates.startDate, displayDates.endDate) : "";

  // CRITICAL DEBUG: Log position and dates for debugging
  console.log(`[InteractiveActivityBar] RENDER DEBUG for ${activity.name}:`, {
    activityId: activity.id,
    activityDates: {
      start_date: activity.start_date,
      end_date: activity.end_date
    },
    positionProp: position,
    hasValidDates,
    activityStartDate: activityStartDate?.toISOString().split('T')[0],
    activityEndDate: activityEndDate?.toISOString().split('T')[0]
  });

  return (
    <div ref={containerRef} className="relative ml-6 mb-1"> {/* Indent activities under phases */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium truncate text-muted-foreground">
            {activity.name}
          </span>
          
          {/* Activity type badge */}
          <Badge 
            variant="outline"
            className="text-xs h-4 flex items-center justify-center"
          >
            {activity.type}
          </Badge>
          
          {/* Status badge */}
          <Badge 
            variant="secondary"
            className="text-xs h-4 flex items-center justify-center"
          >
            {activity.status}
          </Badge>
          
          {/* Duration display */}
          {durationText && (
            <Badge variant="secondary" className="text-xs h-4 flex items-center justify-center">
              {durationText}
            </Badge>
          )}
          
          {displayDates && (
            <span className="text-xs text-muted-foreground">
              {format(displayDates.startDate, 'MMM dd, yyyy')} - {format(displayDates.endDate, 'MMM dd, yyyy')}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 min-h-[16px]">
          {hasViolations && (
            <Badge variant="destructive" className="text-xs h-4 flex items-center justify-center">
              <AlertTriangle className="h-2 w-2 mr-1" />
              Blocked
            </Badge>
          )}
          {hasWarnings && !hasViolations && (
            <Badge variant="secondary" className="text-xs h-4 flex items-center justify-center">
              <AlertTriangle className="h-2 w-2 mr-1" />
              Warning
            </Badge>
          )}
        </div>
      </div>
      
      <div className="relative h-4 bg-gray-50 rounded min-w-[40px]"> {/* Increased height and minimum width for better interaction */}
        {hasValidDates && (
          <div
            ref={barRef}
            className={`absolute h-full rounded transition-all cursor-pointer ${
              dragState.isDragging ? 'opacity-70' : ''
            } ${
              hoverZone ? 'ring-1 ring-blue-300' : ''
            } ${disabled ? 'opacity-50' : ''} ${
              hasViolations ? 'ring-1 ring-red-500' : ''
            }`}
            style={{
              left: `${position.left}%`,
              width: `${position.width}%`,
              cursor: getCursor()
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Activity bar - different color scheme */}
            <div 
              className={`absolute inset-0 rounded ${
                (() => {
                  // Activity-specific color logic
                  if (activity.status === 'completed') return 'bg-emerald-400';
                  if (activity.status === 'in_progress') return 'bg-blue-400';
                  if (activity.status === 'blocked') return 'bg-red-400';
                  return 'bg-slate-400';
                })()
              }`}
            />
          </div>
        )}
        
        {!hasValidDates && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-gray-400">No dates scheduled</span>
          </div>
        )}
      </div>
      
      {/* Violation and warning messages */}
      {hasViolations && previewDates?.violations && (
        <div className="mt-1 text-xs text-red-600">
          {previewDates.violations.map((violation, index) => (
            <div key={index}>• {violation}</div>
          ))}
        </div>
      )}
      {hasWarnings && !hasViolations && previewDates?.warnings && (
        <div className="mt-1 text-xs text-amber-600">
          {previewDates.warnings.map((warning, index) => (
            <div key={index}>• {warning}</div>
          ))}
        </div>
      )}
    </div>
  );
}