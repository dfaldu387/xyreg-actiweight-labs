import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlueprintStepFloatingNavProps {
  currentLabel: string;
  currentIndex: number; // 0-based
  totalSteps: number;
  currentComplete: boolean;
  currentEssential?: boolean;
  prevLabel?: string;
  prevComplete?: boolean;
  prevEssential?: boolean;
  onPrev?: () => void;
  nextLabel: string;
  nextComplete?: boolean;
  nextEssential?: boolean;
  onNext: () => void;
}

/**
 * Fixed bottom step pill mirroring the Gap Analysis detail pill
 * (see ProductGapItemDetailPage.tsx). Same shape, same behavior, used in
 * Venture Blueprint detail view.
 */
export function BlueprintStepFloatingNav({
  currentLabel,
  currentIndex,
  totalSteps,
  currentComplete,
  currentEssential,
  prevLabel,
  prevComplete,
  prevEssential,
  onPrev,
  nextLabel,
  nextComplete,
  nextEssential,
  onNext,
}: BlueprintStepFloatingNavProps) {
  const btnBase =
    '!bg-slate-100 hover:!bg-slate-200 text-slate-700 border border-slate-500 shadow-sm';
  const btnDone =
    '!bg-emerald-50 hover:!bg-emerald-100 text-emerald-700 border border-emerald-400 shadow-sm';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-[28px] border shadow-xl px-3 py-1.5">
        {prevLabel && onPrev && (
          <Button
            onClick={onPrev}
            size="sm"
            className={`gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-start ${prevComplete ? btnDone : btnBase}`}
          >
            <ArrowLeft className="h-3.5 w-3.5 flex-shrink-0" />
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${prevComplete ? 'bg-emerald-500' : 'bg-slate-500'}`} />
            {prevEssential && <Star className="h-3 w-3 flex-shrink-0 text-amber-500 fill-amber-500" />}
            <span className="text-xs font-medium truncate flex-1 text-left">{prevLabel}</span>
          </Button>
        )}
        <div className="flex flex-col items-center px-6 py-2 min-w-[220px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mx-2">
          <div className="flex items-center gap-2">
            {currentComplete && <CheckCircle className="h-3.5 w-3.5 text-white" />}
            {currentEssential && !currentComplete && <Star className="h-3.5 w-3.5 text-white fill-white" />}
            <span className="text-xs font-semibold text-white truncate max-w-[180px]">{currentLabel}</span>
          </div>
          <span className="text-[10px] text-white/70">Step {currentIndex + 1}/{totalSteps}</span>
        </div>
        <Button
          onClick={onNext}
          size="sm"
          className={`gap-1.5 h-9 w-[180px] min-w-[180px] max-w-[180px] rounded-full justify-end ${nextComplete ? btnDone : btnBase}`}
        >
          <span className="text-xs font-medium truncate flex-1 text-right">{nextLabel}</span>
          {nextEssential && <Star className="h-3 w-3 flex-shrink-0 text-amber-500 fill-amber-500" />}
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${nextComplete ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
        </Button>
      </div>
    </div>
  );
}