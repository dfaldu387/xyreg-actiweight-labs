import React from 'react';
import { ChevronRight, FileText, Ban } from 'lucide-react';
import { CircularProgress } from '@/components/common/CircularProgress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QualityManualSection } from '@/hooks/useQualityManual';

interface QualityManualStepRowProps {
  section: QualityManualSection;
  isComplete: boolean;
  isExcluded: boolean;
  exclusionJustification?: string;
  onToggleExclusion: () => void;
  onClick: () => void;
}

export function QualityManualStepRow({ section, isComplete, isExcluded, exclusionJustification, onToggleExclusion, onClick }: QualityManualStepRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-4 py-3 rounded-lg border transition-all",
        isExcluded
          ? "bg-muted/30 border-border/50 opacity-60"
          : isComplete
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 cursor-pointer"
            : "bg-background border-border hover:border-primary/30 hover:bg-muted/30 cursor-pointer"
      )}
      onClick={isExcluded ? undefined : onClick}
    >
      {/* Section badge */}
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold",
        isExcluded
          ? "bg-muted/50 text-muted-foreground/50"
          : isComplete
            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground"
      )}>
        {section.clause}
      </div>

      {/* Circular progress */}
      <div className="flex-shrink-0">
        <CircularProgress percentage={isExcluded ? 0 : isComplete ? 100 : 0} size={36} />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn("font-medium text-sm truncate", isExcluded && "line-through text-muted-foreground")}>{section.title}</h4>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {isExcluded
            ? (exclusionJustification || 'Marked as Not Applicable')
            : (section.description || 'Write quality manual content')
          }
        </p>
      </div>

      {/* N/A or Type badge */}
      {isExcluded ? (
        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-muted-foreground bg-muted/50">
          <Ban className="h-3 w-3" />
          N/A
        </span>
      ) : (
        <span className={cn(
          "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium",
          "text-amber-600 bg-amber-50 dark:bg-amber-950/50"
        )}>
          <FileText className="h-3 w-3" />
          Narrative
        </span>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex-shrink-0 h-7 px-2 text-xs text-muted-foreground hover:text-foreground transition-opacity",
            !isExcluded && "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExclusion();
          }}
        >
          {isExcluded ? 'Restore' : 'N/A'}
        </Button>
        {!isExcluded && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
              isComplete && "text-emerald-600"
            )}
          >
            {isComplete ? 'Review' : 'Start'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
