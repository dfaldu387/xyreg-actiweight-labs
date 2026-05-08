import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Layers } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GENESIS_SECTIONS } from '@/config/genesisSections';
import {
  INVESTOR_ESSENTIAL_COMPLETION_KEYS,
  INVESTOR_ESSENTIAL_TOTAL,
  isInvestorEssentialSubstep,
  parseBlueprintTrack,
  BLUEPRINT_TRACK_PARAM,
} from '@/config/investorEssentialKeys';
import { BlueprintSectionGroup } from './BlueprintSectionGroup';
import { BlueprintStepRow } from './BlueprintStepRow';

interface BlueprintLaunchViewProps {
  /** completionKey -> isComplete */
  completion: Record<string, boolean>;
  disabled?: boolean;
  headerActions?: React.ReactNode;
  /** Notify parent when a row is selected — parent opens the side drawer. */
  onSelectStep?: (stepId: string | null) => void;
}

/**
 * Mirror of GapAnnexIILaunchView for Venture Blueprint:
 * indigo info banner → overall progress → numbered section groups → step rows.
 * When `selectedStepId` is set, the detail panel is rendered in-place
 * instead of the section list — never navigating out of the module.
 */
export function BlueprintLaunchView({
  completion,
  disabled = false,
  headerActions,
  onSelectStep,
}: BlueprintLaunchViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const track = parseBlueprintTrack(searchParams.get(BLUEPRINT_TRACK_PARAM));

  const setTrack = (next: 'investor' | 'full') => {
    const sp = new URLSearchParams(searchParams);
    sp.set(BLUEPRINT_TRACK_PARAM, next);
    setSearchParams(sp, { replace: false });
  };

  const totalSteps = GENESIS_SECTIONS.reduce(
    (sum, s) => sum + s.subSteps.length,
    0,
  );
  const completedCount = GENESIS_SECTIONS.reduce(
    (sum, s) =>
      sum + s.subSteps.filter((sub) => Boolean(completion[sub.completionKey])).length,
    0,
  );
  const progress =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Investor-essential completion (derived).
  const investorCompleted = Array.from(INVESTOR_ESSENTIAL_COMPLETION_KEYS).filter(
    (k) => Boolean(completion[k]),
  ).length;
  const investorProgress =
    INVESTOR_ESSENTIAL_TOTAL > 0
      ? Math.round((investorCompleted / INVESTOR_ESSENTIAL_TOTAL) * 100)
      : 0;

  const nextIncomplete = GENESIS_SECTIONS.flatMap((s) => s.subSteps).find(
    (sub) =>
      !completion[sub.completionKey] &&
      (track === 'full' || isInvestorEssentialSubstep(sub.id)),
  );

  return (
    <div>
      {/* Track Toggle */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div
          role="tablist"
          aria-label="Blueprint track"
          className="inline-flex rounded-full border bg-muted/40 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={track === 'investor'}
            onClick={() => setTrack('investor')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              track === 'investor'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Star className={cn('h-3.5 w-3.5', track === 'investor' && 'fill-white')} />
            Investor Essentials
            <span className="text-[10px] opacity-80 tabular-nums">
              {investorCompleted}/{INVESTOR_ESSENTIAL_TOTAL}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={track === 'full'}
            onClick={() => setTrack('full')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              track === 'full'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Full Plan
            <span className="text-[10px] opacity-80 tabular-nums">
              {completedCount}/{totalSteps}
            </span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {track === 'investor'
            ? 'Showing only the steps required for an investor-ready presentation.'
            : 'Showing every step across the full development plan.'}
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {track === 'investor' ? 'Investor Essentials Progress' : 'Overall Progress'}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {track === 'investor'
                ? `${investorCompleted}/${INVESTOR_ESSENTIAL_TOTAL} investor-essential steps complete`
                : `${completedCount}/${totalSteps} steps complete`}
              {nextIncomplete && ` · Next: ${nextIncomplete.title}`}
              {!nextIncomplete && ' · All steps addressed'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {headerActions}
            <div
              className={cn(
                'text-2xl font-bold tabular-nums',
                (track === 'investor' ? investorProgress : progress) >= 100
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : (track === 'investor' ? investorProgress : progress) >= 50
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400',
              )}
            >
              {track === 'investor' ? investorProgress : progress}%
            </div>
          </div>
        </div>
        <Progress value={track === 'investor' ? investorProgress : progress} className="h-2" />
      </div>

      {/* Section Groups */}
      <div className="space-y-6">
        {GENESIS_SECTIONS.map((section, sectionIdx) => {
          const visibleSubs =
            track === 'investor'
              ? section.subSteps.filter((sub) => isInvestorEssentialSubstep(sub.id))
              : section.subSteps;

          if (visibleSubs.length === 0) return null;

          const groupTotal = visibleSubs.length;
          const groupCompleted = visibleSubs.filter((sub) =>
            Boolean(completion[sub.completionKey]),
          ).length;

          return (
            <BlueprintSectionGroup
              key={section.id}
              groupNumber={sectionIdx + 1}
              groupName={section.title}
              tagline={section.tagline}
              completedCount={groupCompleted}
              totalCount={groupTotal}
            >
              {visibleSubs.map((sub) => {
                const subIdx = section.subSteps.findIndex((x) => x.id === sub.id);
                return (
                  <BlueprintStepRow
                    key={sub.id}
                    badge={`${sectionIdx + 1}.${subIdx + 1}`}
                    title={sub.title}
                    subtitle={sub.requirement}
                    isComplete={Boolean(completion[sub.completionKey])}
                    isInvestorEssential={isInvestorEssentialSubstep(sub.id)}
                    onSelect={() => onSelectStep?.(sub.id)}
                    disabled={disabled}
                  />
                );
              })}
            </BlueprintSectionGroup>
          );
        })}

        {track === 'investor' && (
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Layers className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Beyond the investor pitch — full development plan
                </p>
                <p className="text-xs text-muted-foreground">
                  Phases 3–6 (Design, V&amp;V, Submission, Post-Market) are part
                  of the full plan but not required to share with investors.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setTrack('full')}>
              Switch to Full Plan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}