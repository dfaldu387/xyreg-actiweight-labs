import React from 'react';
import { Loader2 } from 'lucide-react';

export interface GanttLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Loading overlay component for Gantt chart
 * Shows a blurred background with a spinner and message
 */
export function GanttLoadingOverlay({ isLoading, message = 'Loading...' }: GanttLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-3 rounded-lg bg-card p-6 shadow-lg border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}
