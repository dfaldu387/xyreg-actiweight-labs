import React from 'react';
import { cn } from '@/lib/utils';

interface StatusCirclesProps {
  status: string;
  progress?: number;
  className?: string;
}

export function StatusCircles({ status, progress, className }: StatusCirclesProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-500";
      case "At Risk":
        return "bg-red-500";
      case "Needs Attention":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getProgressColor = (progress?: number) => {
    if (!progress) return "bg-gray-300";
    if (progress >= 75) return "bg-green-400";
    if (progress >= 50) return "bg-yellow-400";
    if (progress >= 25) return "bg-orange-400";
    return "bg-red-400";
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Status Circle */}
      <div 
        className={cn("w-3 h-3 rounded-full", getStatusColor(status))}
        title={`Status: ${status}`}
      />
      
      {/* Progress Circle */}
      <div 
        className={cn("w-3 h-3 rounded-full", getProgressColor(progress))}
        title={`Progress: ${progress || 0}%`}
      />
    </div>
  );
}