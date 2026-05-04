import React from 'react';
import { MessageSquare, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useVerticalDragPosition } from '@/hooks/useVerticalDragPosition';


interface FeedbackButtonProps {
  onClick: () => void;
  className?: string;
}

export function FeedbackButton({ onClick, className }: FeedbackButtonProps) {
  const { style, dragging, onMouseDown, wasDragged, reset, hasCustomY } = useVerticalDragPosition({
    storageKey: 'xyreg.feedbackButton.y',
    defaultBottomPx: 24,
    buttonHeight: 56,
  });
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
        <button
          data-feedback-system
          onClick={(e) => {
            if (wasDragged()) { e.preventDefault(); e.stopPropagation(); return; }
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
          onMouseDown={onMouseDown}
          onContextMenu={(e) => { if (hasCustomY) { e.preventDefault(); reset(); } }}
          style={{ ...style, right: 24 }}
          className={cn(
            'fixed z-[9999] group',
            'h-14 w-14 rounded-full',
            'bg-primary text-primary-foreground',
            'shadow-lg hover:shadow-xl',
            'transition-shadow duration-200 ease-in-out',
            'hover:bg-primary/90',
            'flex items-center justify-center',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            dragging ? 'cursor-grabbing' : 'cursor-grab',
            className
          )}
            aria-label="Report a bug or suggest an improvement"
          >
            <GripVertical className="h-3 w-3 absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-70 transition-opacity text-primary-foreground" />
            <MessageSquare className="h-6 w-6 pointer-events-none" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p>Report a bug or suggest an improvement</p>
          <p className="text-[10px] opacity-70 mt-0.5">Drag vertically to move • Right-click to reset</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}