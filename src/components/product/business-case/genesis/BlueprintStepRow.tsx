import React from 'react';
import { Eye, Star } from 'lucide-react';
import { CircularProgress } from '@/components/common/CircularProgress';
import { cn } from '@/lib/utils';

interface BlueprintStepRowProps {
  /** Display label like "1.2" — section number + sub-step index. */
  badge: string;
  title: string;
  subtitle?: string;
  isComplete: boolean;
  /** True when this row is part of the investor-essential set. */
  isInvestorEssential?: boolean;
  /** Called when the row is clicked — opens the in-place detail panel. */
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Mirror of GapAnnexIIStepRow — indented launch row. Clicking it stays
 * inside the Venture Blueprint module and opens the detail panel in-place
 * (same pattern as Gap Analysis Annex II → in-module detail view).
 */
export function BlueprintStepRow({
  badge,
  title,
  subtitle,
  isComplete,
  isInvestorEssential = false,
  onSelect,
  disabled = false,
}: BlueprintStepRowProps) {
  const handleClick = () => {
    if (disabled) return;
    onSelect();
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-4 px-4 py-3 rounded-lg border transition-all',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        isComplete
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
          : 'bg-background border-border hover:border-primary/30 hover:bg-muted/30',
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold',
          isComplete
            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {badge}
      </div>

      <div className="flex-shrink-0">
        <CircularProgress percentage={isComplete ? 100 : 0} size={36} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          {isInvestorEssential && (
            <span
              title="Investor essential"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300/70 dark:border-amber-700/50 flex-shrink-0"
            >
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              Investor
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onSelect();
        }}
        aria-label="Open step details"
        className="flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Eye className="h-4 w-4" />
      </button>
    </div>
  );
}