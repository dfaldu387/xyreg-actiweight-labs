import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Circle, Home, ChevronRight, Target, Compass, Eye, Star } from 'lucide-react';
import { useInvestorPreview } from '@/contexts/InvestorPreviewContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRegisterRightRail } from '@/context/RightRailContext';
import { GENESIS_SECTIONS } from '@/config/genesisSections';
import {
  isInvestorEssentialSubstep,
  parseBlueprintTrack,
  BLUEPRINT_TRACK_PARAM,
} from '@/config/investorEssentialKeys';

interface BlueprintSidebarProps {
  /** completionKey -> isComplete */
  completion: Record<string, boolean>;
  disabled?: boolean;
}

/**
 * Direct mirror of GapAnnexIISidebar for the Venture Blueprint module.
 * Same fixed right rail, same "To Complete This Step" panel, same
 * "All Sections" grouped list with nested active sub-steps. Clicks update
 * the URL `?step=` param so the launch view shows the matching detail.
 */
export function BlueprintSidebar({ completion, disabled = false }: BlueprintSidebarProps) {
  useRegisterRightRail();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStepId = searchParams.get('step');
  const track = parseBlueprintTrack(searchParams.get(BLUEPRINT_TRACK_PARAM));
  const { isPreviewOpen, togglePreview } = useInvestorPreview();

  // Flat list of steps respecting the active track filter (used for current/next).
  const flatSteps = useMemo(
    () =>
      GENESIS_SECTIONS.flatMap((section, sectionIdx) =>
        section.subSteps
          .filter(
            (sub) => track === 'full' || isInvestorEssentialSubstep(sub.id),
          )
          .map((sub, subIdx) => ({
            section,
            sectionIdx,
            sub,
            subIdx,
            isComplete: Boolean(completion[sub.completionKey]),
          })),
      ),
    [completion, track],
  );

  const totalSteps = flatSteps.length;
  const completedCount = flatSteps.filter((s) => s.isComplete).length;
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const activeStep = flatSteps.find((s) => s.sub.id === activeStepId) || null;
  const firstIncomplete = flatSteps.find((s) => !s.isComplete) || null;
  const viewedStep = activeStep || firstIncomplete || flatSteps[flatSteps.length - 1];
  const viewedSection = viewedStep?.section;
  const isAllComplete = completedCount >= totalSteps;

  const setStep = (stepId: string | null) => {
    if (disabled) return;
    const next = new URLSearchParams(searchParams);
    if (stepId) next.set('step', stepId);
    else next.delete('step');
    if (!next.get('tab')) next.set('tab', 'venture-blueprint');
    setSearchParams(next, { replace: false });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sub-steps inside the actively viewed section (for the amber panel).
  const sectionSubSteps = useMemo(() => {
    if (!viewedSection) return [];
    return viewedSection.subSteps.map((sub) => ({
      id: sub.id,
      label: sub.title,
      complete: Boolean(completion[sub.completionKey]),
    }));
  }, [viewedSection, completion]);

  return (
    <div className="fixed right-0 top-16 w-[280px] lg:w-[300px] xl:w-[320px] bg-background border-l border-border flex flex-col h-[calc(100vh-64px)] z-30">
      {/* Back to Venture Blueprint list — only when viewing a specific step */}
      {activeStepId && (
        <div className="px-4 pt-3 pb-2 border-b flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(null)}
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="text-xs">Back to Venture Blueprint</span>
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Venture Blueprint
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={togglePreview}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    isPreviewOpen
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                  )}
                  aria-label={isPreviewOpen ? 'Close Investor Preview' : 'Preview Investor View'}
                >
                  <Eye className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isPreviewOpen ? 'Close Investor Preview' : 'Preview Investor View'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <h3 className="font-semibold text-foreground text-sm truncate">
          {viewedStep
            ? `§${viewedStep.sectionIdx + 1}.${viewedStep.subIdx + 1}: ${viewedStep.sub.title}`
            : 'Getting Started'}
        </h3>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progress >= 100
                  ? 'bg-emerald-500'
                  : progress >= 50
                    ? 'bg-blue-500'
                    : 'bg-amber-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
            {completedCount}/{totalSteps}
          </span>
        </div>
      </div>

      {/* "To Complete This Step" panel */}
      <div
        className={cn(
          'p-4 border-b flex-shrink-0',
          isAllComplete
            ? 'bg-emerald-50 dark:bg-emerald-950/20'
            : 'bg-amber-50 dark:bg-amber-950/20',
        )}
      >
        <h4
          className={cn(
            'text-sm font-medium flex items-center gap-2',
            isAllComplete
              ? 'text-emerald-800 dark:text-emerald-300'
              : 'text-amber-800 dark:text-amber-300',
          )}
        >
          <Target className="h-4 w-4" />
          {isAllComplete ? 'Section Complete ✓' : 'To Complete This Section'}
        </h4>
        <p
          className={cn(
            'text-xs mt-1',
            isAllComplete
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-amber-700 dark:text-amber-400',
          )}
        >
          {isAllComplete
            ? 'All Venture Blueprint steps have been addressed.'
            : viewedSection
              ? `§${(viewedStep?.sectionIdx ?? 0) + 1} ${viewedSection.title}`
              : ''}
        </p>
        {sectionSubSteps.length > 0 && !isAllComplete && (
          <div className="relative mt-2">
            {sectionSubSteps.length > 4 && (
              <span className="text-[10px] text-muted-foreground mb-1 block">
                {sectionSubSteps.filter((i) => !i.complete).length}/{sectionSubSteps.length} remaining
              </span>
            )}
            <div className="max-h-[120px] overflow-y-auto pr-1">
              <ul className="space-y-1.5">
                {sectionSubSteps.map((item) => {
                  const isActive = item.id === activeStepId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setStep(item.id)}
                        disabled={disabled}
                        className={cn(
                          'w-full flex items-start gap-2 text-xs text-left rounded px-1 py-0.5 hover:bg-amber-100/60 dark:hover:bg-amber-900/30',
                          isActive && 'bg-amber-100 dark:bg-amber-900/40 font-medium',
                        )}
                      >
                        {item.complete ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={cn(
                            'text-foreground',
                            item.complete && 'line-through opacity-60',
                          )}
                        >
                          {item.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
        {!isAllComplete && firstIncomplete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(firstIncomplete.sub.id)}
            disabled={disabled}
            className="mt-2 h-7 text-xs gap-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-2"
          >
            Go to step
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* All Sections list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          All Sections
        </h4>

        <div className="space-y-4">
          {GENESIS_SECTIONS.map((section, sectionIdx) => {
            const visibleSubs =
              track === 'investor'
                ? section.subSteps.filter((sub) => isInvestorEssentialSubstep(sub.id))
                : section.subSteps;
            if (visibleSubs.length === 0) return null;
            const groupCompleted = visibleSubs.filter((sub) =>
              Boolean(completion[sub.completionKey]),
            ).length;
            const groupTotal = visibleSubs.length;
            const groupAllComplete = groupCompleted === groupTotal && groupTotal > 0;
            const isActiveSec = activeStep?.sectionIdx === sectionIdx;

            return (
              <div key={section.id}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    §{sectionIdx + 1} {section.title}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] tabular-nums',
                      groupAllComplete
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {groupCompleted}/{groupTotal}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {visibleSubs.map((sub) => {
                    const subIdx = section.subSteps.findIndex((x) => x.id === sub.id);
                    const isComplete = Boolean(completion[sub.completionKey]);
                    const isActive = sub.id === activeStepId;
                    const essential = isInvestorEssentialSubstep(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setStep(sub.id)}
                        disabled={disabled}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left',
                          isActive &&
                            'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-medium',
                          !isActive && !isComplete && 'text-muted-foreground hover:bg-muted/50',
                          isComplete && !isActive && 'text-emerald-600 dark:text-emerald-400',
                          isActiveSec && !isActive && 'bg-indigo-50/40 dark:bg-indigo-950/10',
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                        ) : (
                          <Circle
                            className={cn(
                              'h-3.5 w-3.5 flex-shrink-0',
                              isActive ? 'text-indigo-500' : 'text-muted-foreground/50',
                            )}
                          />
                        )}
                        <span className="truncate flex-1">
                          §{sectionIdx + 1}.{subIdx + 1} {sub.title}
                        </span>
                        {essential && track === 'full' && (
                          <Star
                            className="h-3 w-3 flex-shrink-0 fill-amber-500 text-amber-500"
                            aria-label="Investor essential"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}