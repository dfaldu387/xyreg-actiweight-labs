import React, { useState, useCallback } from 'react';
import { annexIRequirements, Chapter } from '@/data/annexIRequirements';
import { ChapterCard } from './ChapterCard';
import { ChapterDetailView } from './ChapterDetailView';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';

interface AnnexIComplianceDashboardProps {
  onClose: () => void;
}

export function AnnexIComplianceDashboard({ onClose }: AnnexIComplianceDashboardProps) {
  const [chapters, setChapters] = useState<Chapter[]>(annexIRequirements);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  const calculateProgress = (chapter: Chapter) => {
    const applicableGsprs = chapter.gspRs.filter(g => g.isApplicable);
    if (applicableGsprs.length === 0) return 0;
    const completedGsprs = applicableGsprs.filter(g => g.isComplete);
    return (completedGsprs.length / applicableGsprs.length) * 100;
  };

  const handleToggleComplete = useCallback((gspr_id: string) => {
    setChapters(prevChapters =>
      prevChapters.map(chapter => ({
        ...chapter,
        gspRs: chapter.gspRs.map(gspr =>
          gspr.id === gspr_id
            ? { ...gspr, isComplete: !gspr.isComplete }
            : gspr
        )
      }))
    );
  }, []);

  const handleToggleApplicable = useCallback((gspr_id: string) => {
    setChapters(prevChapters =>
      prevChapters.map(chapter => ({
        ...chapter,
        gspRs: chapter.gspRs.map(gspr =>
          gspr.id === gspr_id
            ? { ...gspr, isApplicable: !gspr.isApplicable, isComplete: gspr.isApplicable ? false : gspr.isComplete }
            : gspr
        )
      }))
    );
  }, []);

  const handleResetProgress = () => {
    setChapters(annexIRequirements);
    setActiveChapterId(null);
  };

  const activeChapter = chapters.find(c => c.id === activeChapterId);

  const overallProgress = chapters.reduce((acc, chapter) => {
    const totalApplicable = chapter.gspRs.filter(g => g.isApplicable).length;
    const totalCompleted = chapter.gspRs.filter(g => g.isComplete).length;
    return {
      applicable: acc.applicable + totalApplicable,
      completed: acc.completed + totalCompleted
    };
  }, { applicable: 0, completed: 0 });

  const overallPercentage = overallProgress.applicable > 0 
    ? (overallProgress.completed / overallProgress.applicable) * 100 
    : 0;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              MDR Annex I Compliance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Interactive view of the 177 General Safety and Performance Requirements
            </p>
            <div className="mt-2 text-sm">
              <span className="font-medium">Overall Progress: </span>
              <span className="text-primary font-bold">
                {overallProgress.completed} / {overallProgress.applicable} requirements 
                ({Math.round(overallPercentage)}%)
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetProgress}
            >
              <RotateCcw size={16} className="mr-2" />
              Reset Progress
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X size={16} className="mr-2" />
              Close Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Chapter Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {chapters.map(chapter => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                progress={calculateProgress(chapter)}
                isActive={activeChapterId === chapter.id}
                onClick={() => setActiveChapterId(chapter.id)}
              />
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Click on any chapter card to explore detailed requirements and track your compliance progress
            </p>
          </div>
        </div>
      </div>

      {/* Detail View Modal */}
      {activeChapter && (
        <ChapterDetailView
          chapter={activeChapter}
          progress={calculateProgress(activeChapter)}
          onClose={() => setActiveChapterId(null)}
          onToggleComplete={handleToggleComplete}
          onToggleApplicable={handleToggleApplicable}
        />
      )}
    </div>
  );
}