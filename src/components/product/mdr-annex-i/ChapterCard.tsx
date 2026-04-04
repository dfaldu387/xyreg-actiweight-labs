import React from 'react';
import { Chapter } from '@/data/annexIRequirements';
import { ProgressPieIcon } from './ProgressPieIcon';
import { cn } from '@/lib/utils';

interface ChapterCardProps {
  chapter: Chapter;
  progress: number;
  isActive: boolean;
  onClick: () => void;
}

const getColorClasses = (color: string, isActive: boolean) => {
  const baseClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 border-blue-500',
    green: 'bg-green-600 hover:bg-green-700 border-green-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500',
    amber: 'bg-amber-600 hover:bg-amber-700 border-amber-500',
  };
  
  return cn(
    baseClasses[color as keyof typeof baseClasses] || 'bg-primary hover:bg-primary/90',
    isActive && 'ring-2 ring-white ring-opacity-60'
  );
};

export function ChapterCard({ chapter, progress, isActive, onClick }: ChapterCardProps) {
  return (
    <div 
      className={cn(
        "relative rounded-xl p-6 cursor-pointer transition-all duration-300 shadow-lg border-2",
        "transform hover:scale-105 hover:shadow-xl",
        getColorClasses(chapter.color, isActive),
        !isActive && "opacity-100 hover:opacity-90",
        isActive && "scale-110 z-10"
      )}
      onClick={onClick}
    >
      <div className="text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1 leading-tight">
              {chapter.title}
            </h3>
            <p className="text-sm opacity-90 leading-relaxed">
              {chapter.subtitle}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">
              {chapter.gspRs.filter(g => g.isComplete).length} / {chapter.gspRs.length}
            </div>
            <div className="opacity-75 text-xs">
              Requirements Complete
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <ProgressPieIcon
              progress={progress}
              color={chapter.color}
              chapterId={chapter.id}
              size={60}
            />
          </div>
        </div>
      </div>
      
      {isActive && (
        <div className="absolute inset-0 bg-white bg-opacity-10 rounded-xl animate-pulse" />
      )}
    </div>
  );
}