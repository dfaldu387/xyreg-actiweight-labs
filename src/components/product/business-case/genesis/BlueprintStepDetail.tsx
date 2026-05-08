import React from 'react';
import { ArrowLeft, ExternalLink, CheckCircle2, Circle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  GenesisSubStepConfig,
  GenesisSectionConfig,
} from '@/config/genesisSections';
import { GenesisSsotEditor } from './GenesisSsotEditor';

interface BlueprintStepDetailProps {
  section: GenesisSectionConfig;
  sectionIndex: number;
  subStep: GenesisSubStepConfig;
  subIndex: number;
  isComplete: boolean;
  /** True when this sub-step is part of the investor-essential set. */
  isInvestorEssential?: boolean;
  disabled?: boolean;
  onBack: () => void;
  /** Optional CTA: open the dedicated full-module editor in a new context. */
  onOpenFullEditor?: () => void;
}

/**
 * In-place detail panel rendered inside the Venture Blueprint module.
 * Mirrors the Gap Analysis item detail flow: list → detail (same module,
 * same shell, no cross-module redirect).
 */
export function BlueprintStepDetail({
  section,
  sectionIndex,
  subStep,
  subIndex,
  isComplete,
  isInvestorEssential = false,
  disabled = false,
  onBack,
  onOpenFullEditor,
}: BlueprintStepDetailProps) {
  const badge = `${sectionIndex + 1}.${subIndex + 1}`;

  return (
    <div className="space-y-4">
      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Venture Blueprint
      </button>

      {/* Header */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
              isComplete
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {badge}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Section {sectionIndex + 1} · {section.title}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{subStep.title}</h2>
              {isInvestorEssential && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  Investor essential
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 text-xs">
            {isComplete ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  Complete
                </span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  Incomplete
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Requirement */}
      <Card>
        <CardContent className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            Requirement
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {subStep.requirement}
          </p>
        </CardContent>
      </Card>

      {/* Your response */}
      <Card>
        <CardContent className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">
            Your Response
          </div>
          {subStep.binding.kind === 'open-module' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This step is managed in a dedicated editor. You can open it in
                a new tab to keep your Venture Blueprint context here.
              </p>
              {onOpenFullEditor && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onOpenFullEditor}
                  disabled={disabled}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open dedicated editor in new tab
                </Button>
              )}
            </div>
          ) : (
            <GenesisSsotEditor
              binding={subStep.binding}
              label={subStep.title}
              disabled={disabled}
            />
          )}
        </CardContent>
      </Card>

      {/* Prev / Next handled by floating step pill in BlueprintStepDetailView */}
      <div className="pb-24" />
    </div>
  );
}