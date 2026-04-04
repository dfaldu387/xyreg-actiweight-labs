import React from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FeedbackButtonProps {
  onClick: () => void;
  className?: string;
}

export function FeedbackButton({ onClick, className }: FeedbackButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
        <button
          data-feedback-system
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
          className={cn(
            'fixed bottom-6 right-6 z-[40]',
            'h-14 w-14 rounded-full',
            'bg-primary text-primary-foreground',
            'shadow-lg hover:shadow-xl',
            'transition-all duration-200 ease-in-out',
            'hover:scale-110 hover:bg-primary/90',
            'flex items-center justify-center',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            className
          )}
            aria-label="Report a bug or suggest an improvement"
          >
            <MessageSquare className="h-6 w-6" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p>Report a bug or suggest an improvement</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}