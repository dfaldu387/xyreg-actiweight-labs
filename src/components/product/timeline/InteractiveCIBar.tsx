import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TimelineMetrics, calculatePositionFromDate, getDragZone } from '@/utils/ganttDragHandlers';
import { format, addDays, differenceInDays } from 'date-fns';

interface InteractiveCIBarProps {
  type: 'document' | 'gap' | 'activity' | 'audit';
  title: string;
  count: number;
  completed: number;
  position: { left: number; width: number };
  metrics: TimelineMetrics;
  phaseStartDate?: Date;
  phaseEndDate?: Date;
  items?: any[]; // Individual CI items with names
  onItemUpdate?: (itemId: string, updates: any) => void;
}

interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  itemId: string | null;
  startX: number;
  originalStartDate: Date | null;
  originalEndDate: Date | null;
}

const ciTypeColors = {
  document: 'bg-green-500',
  gap: 'bg-red-500', 
  activity: 'bg-orange-500',
  audit: 'bg-blue-500'
};

export function InteractiveCIBar({
  type,
  title,
  count,
  completed,
  position,
  metrics,
  phaseStartDate,
  phaseEndDate,
  items,
  onItemUpdate
}: InteractiveCIBarProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    itemId: null,
    startX: 0,
    originalStartDate: null,
    originalEndDate: null
  });
  
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [previewDates, setPreviewDates] = useState<{ startDate: Date; endDate: Date } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const completionPercentage = count > 0 ? (completed / count) * 100 : 0;
  const baseColor = ciTypeColors[type];

  // Get table name based on CI type
  const getTableName = (type: string) => {
    switch (type) {
      case 'activity': return 'activities'; // Use activities table, not ci_instances
      case 'document': return 'documents';
      case 'gap': return 'gap_analysis_items';
      case 'audit': return 'product_audits';
      default: return 'activities';
    }
  };

  // Get date fields based on CI type
  const getDateFields = (type: string) => {
    switch (type) {
      case 'activity': return { start: 'start_date', end: 'due_date' }; // Activities table has start_date and due_date
      case 'document': return { start: 'created_at', end: 'due_date' };
      case 'gap': return { start: 'created_at', end: 'milestone_due_date' };
      case 'audit': return { start: 'start_date', end: 'deadline_date' };
      default: return { start: 'start_date', end: 'due_date' };
    }
  };

  // Calculate dates from mouse position
  const calculateDatesFromMouse = (mouseX: number, item: any): { startDate: Date; endDate: Date } | null => {
    if (!containerRef.current || !dragState.originalStartDate || !dragState.originalEndDate) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = mouseX - rect.left;
    const timelineWidth = rect.width;
    const pixelsPerDay = timelineWidth / (metrics.latestDate.getTime() - metrics.earliestDate.getTime()) * (24 * 60 * 60 * 1000);
    
    const deltaX = relativeX - dragState.startX;
    const deltaDays = Math.round(deltaX / pixelsPerDay);

    let newStartDate = new Date(dragState.originalStartDate);
    let newEndDate = new Date(dragState.originalEndDate);

    if (dragState.dragType === 'move') {
      newStartDate = addDays(dragState.originalStartDate, deltaDays);
      newEndDate = addDays(dragState.originalEndDate, deltaDays);
    } else if (dragState.dragType === 'resize-start') {
      newStartDate = addDays(dragState.originalStartDate, deltaDays);
      // Ensure start date doesn't go past end date
      if (newStartDate >= newEndDate) {
        newStartDate = addDays(newEndDate, -1);
      }
    } else if (dragState.dragType === 'resize-end') {
      newEndDate = addDays(dragState.originalEndDate, deltaDays);
      // Ensure end date doesn't go before start date
      if (newEndDate <= newStartDate) {
        newEndDate = addDays(newStartDate, 1);
      }
    }

    // Constrain to phase boundaries if they exist
    if (phaseStartDate && newStartDate < phaseStartDate) {
      newStartDate = new Date(phaseStartDate);
    }
    if (phaseEndDate && newEndDate > phaseEndDate) {
      newEndDate = new Date(phaseEndDate);
    }

    return { startDate: newStartDate, endDate: newEndDate };
  };

  // Update CI item dates in database
  const updateItemDates = async (itemId: string, startDate: Date, endDate: Date) => {
    const tableName = getTableName(type);
    const dateFields = getDateFields(type);
    
    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      // Set appropriate date fields based on type
      if (dateFields.start === 'created_at') {
        // For items where start date is creation date, we only update end date
        updates[dateFields.end] = endDate.toISOString().split('T')[0];
      } else {
        // For items with proper start/end dates, update both
        updates[dateFields.start] = startDate.toISOString().split('T')[0];
        updates[dateFields.end] = endDate.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', itemId);

      if (error) {
        console.error('Error updating CI item:', error);
        toast.error('Failed to update item timeline');
        return false;
      }

      toast.success('Timeline updated successfully');
      
      // Call the parent update callback to trigger data refresh
      onItemUpdate?.(itemId, updates);
      
      return true;
    } catch (error) {
      console.error('Error updating CI item:', error);
      toast.error('Failed to update item timeline');
      return false;
    }
  };

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragState.isDragging || !dragState.itemId) return;

      const item = items?.find(i => i.id === dragState.itemId);
      if (!item) return;

      const newDates = calculateDatesFromMouse(event.clientX, item);
      if (newDates) {
        setPreviewDates(newDates);
      }
    };

    const handleMouseUp = async () => {
      if (dragState.isDragging && dragState.itemId && previewDates) {
        const success = await updateItemDates(
          dragState.itemId,
          previewDates.startDate,
          previewDates.endDate
        );
        
        // Don't clear preview dates immediately if successful
        if (!success) {
          setPreviewDates(null);
        }
      }
      
      setDragState({
        isDragging: false,
        dragType: null,
        itemId: null,
        startX: 0,
        originalStartDate: null,
        originalEndDate: null
      });
      
      // Clear preview dates after a short delay to allow for smooth transition
      setTimeout(() => {
        setPreviewDates(null);
      }, 500);
      setHoverItem(null);
      setHoverZone(null);
      
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.dragType === 'move' ? 'grabbing' : 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, previewDates, items, type]);

  const handleMouseDown = (event: React.MouseEvent, item: any) => {
    if (!barRefs.current[item.id] || !containerRef.current) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const dragType = getDragZone(event, barRefs.current[item.id]!);
    const rect = containerRef.current.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    
    // Get item dates
    const dateFields = getDateFields(type);
    const startDate = item[dateFields.start] ? new Date(item[dateFields.start]) : (phaseStartDate || new Date());
    const endDate = item[dateFields.end] ? new Date(item[dateFields.end]) : (phaseEndDate || addDays(startDate, 7));
    
    setDragState({
      isDragging: true,
      dragType,
      itemId: item.id,
      startX,
      originalStartDate: startDate,
      originalEndDate: endDate
    });
  };

  const handleMouseMove = (event: React.MouseEvent, item: any) => {
    if (!dragState.isDragging && barRefs.current[item.id]) {
      const zone = getDragZone(event, barRefs.current[item.id]!);
      setHoverItem(item.id);
      setHoverZone(zone);
    }
  };

  const handleMouseLeave = () => {
    if (!dragState.isDragging) {
      setHoverItem(null);
      setHoverZone(null);
    }
  };

  const getCursor = (itemId: string) => {
    if (dragState.isDragging && dragState.itemId === itemId) {
      return dragState.dragType === 'move' ? 'grabbing' : 'col-resize';
    }
    if (hoverItem === itemId) {
      if (hoverZone === 'move') return 'grab';
      if (hoverZone === 'resize-start' || hoverZone === 'resize-end') return 'col-resize';
    }
    return 'default';
  };

  // Calculate item position on timeline
  const getItemPosition = (item: any): { left: number; width: number } => {
    const dateFields = getDateFields(type);
    const startDate = item[dateFields.start] ? new Date(item[dateFields.start]) : phaseStartDate;
    const endDate = item[dateFields.end] ? new Date(item[dateFields.end]) : phaseEndDate;
    
    if (!startDate || !endDate) {
      return { left: position.left, width: position.width };
    }

    // Use preview dates if this item is being dragged
    const displayStartDate = (dragState.itemId === item.id && previewDates) ? previewDates.startDate : startDate;
    const displayEndDate = (dragState.itemId === item.id && previewDates) ? previewDates.endDate : endDate;
    
    const left = calculatePositionFromDate(displayStartDate, metrics);
    const right = calculatePositionFromDate(displayEndDate, metrics);
    const width = Math.max(right - left, 1); // Minimum width of 1%
    
    return { left, width };
  };

  // If we have individual items, display them separately with drag functionality
  if (items && items.length > 0) {
    return (
      <div ref={containerRef} className="space-y-1">
        {items.map((item, index) => {
          const itemPosition = getItemPosition(item);
          const isHovered = hoverItem === item.id;
          const isDragging = dragState.isDragging && dragState.itemId === item.id;
          
          return (
            <div key={item.id || index} className="relative h-5 bg-muted rounded-sm">
              {/* CI task bar for individual item */}
              <div 
                ref={el => barRefs.current[item.id] = el}
                className={`absolute top-0 h-full ${baseColor} rounded-sm transition-all duration-200 hover:bg-opacity-80 ${
                  isHovered ? 'ring-2 ring-blue-300' : ''
                } ${isDragging ? 'opacity-70 ring-2 ring-orange-300' : ''}`}
                style={{
                  left: `${itemPosition.left}%`,
                  width: `${itemPosition.width}%`,
                  minWidth: '2px',
                  cursor: getCursor(item.id)
                }}
                onMouseDown={(e) => handleMouseDown(e, item)}
                onMouseMove={(e) => handleMouseMove(e, item)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Status indicator */}
                <div 
                  className={`h-full rounded-sm ${
                    item.status === 'completed' ? 'bg-white bg-opacity-20' : 
                    item.status === 'in_progress' ? 'bg-white bg-opacity-10' : 'bg-transparent'
                  }`}
                  style={{ width: '100%' }}
                />
                
                {/* Resize handles */}
                <div className="absolute left-0 top-0 w-1 h-full bg-white bg-opacity-50 cursor-col-resize opacity-0 hover:opacity-100" />
                <div className="absolute right-0 top-0 w-1 h-full bg-white bg-opacity-50 cursor-col-resize opacity-0 hover:opacity-100" />
              </div>
              
              {/* Individual CI name */}
              <div className="absolute left-2 top-0 h-full flex items-center pointer-events-none">
                <span className="text-xs font-medium text-foreground bg-background/80 px-1 rounded truncate max-w-[200px]">
                  {item.name || item.title || `${title} ${index + 1}`}
                </span>
              </div>
              
              {/* Status badge and dates */}
              <div className="absolute right-2 top-0 h-full flex items-center gap-2 pointer-events-none">
                {(dragState.itemId === item.id && previewDates) && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                    {format(previewDates.startDate, 'MMM dd')} - {format(previewDates.endDate, 'MMM dd')}
                  </span>
                )}
                <span className="text-xs bg-background/80 px-1 rounded capitalize">
                  {item.status || 'planned'}
                </span>
              </div>
            </div>
          );
        })}
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
        />
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