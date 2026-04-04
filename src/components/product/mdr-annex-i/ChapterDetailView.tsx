import React from 'react';
import { Chapter } from '@/data/annexIRequirements';
import { GSPRListItem } from './GSPRListItem';
import { ProgressPieIcon } from './ProgressPieIcon';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChapterDetailViewProps {
  chapter: Chapter;
  progress: number;
  onClose: () => void;
  onToggleComplete: (gspr_id: string) => void;
  onToggleApplicable: (gspr_id: string) => void;
}

export function ChapterDetailView({
  chapter,
  progress,
  onClose,
  onToggleComplete,
  onToggleApplicable
}: ChapterDetailViewProps) {
  const completedCount = chapter.gspRs.filter(g => g.isComplete).length;
  const applicableCount = chapter.gspRs.filter(g => g.isApplicable).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="mr-3"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Overview
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {chapter.title}
              </h2>
              <p className="text-muted-foreground">
                {chapter.subtitle}
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                {completedCount} of {applicableCount} applicable requirements completed
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <ProgressPieIcon
                progress={progress}
                color={chapter.color}
                chapterId={chapter.id}
                size={100}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              {chapter.gspRs.map((gspr, index) => (
                <div 
                  key={gspr.id}
                  className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                >
                  <GSPRListItem
                    gspr={gspr}
                    onToggleComplete={onToggleComplete}
                    onToggleApplicable={onToggleApplicable}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}