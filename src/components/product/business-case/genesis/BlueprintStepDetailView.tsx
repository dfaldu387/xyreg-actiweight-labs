import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { GENESIS_SECTIONS } from '@/config/genesisSections';
import { BlueprintStepDetail } from './BlueprintStepDetail';
import { BlueprintStepFloatingNav } from './BlueprintStepFloatingNav';
import { isInvestorEssentialSubstep } from '@/config/investorEssentialKeys';

interface BlueprintStepDetailViewProps {
  /** completionKey -> isComplete */
  completion: Record<string, boolean>;
  selectedStepId: string;
  disabled?: boolean;
}

/**
 * Inline (main-column) detail view for a Venture Blueprint step.
 * Mirrors the Gap Analysis pattern: when a step is selected, the section
 * list is replaced by this detail view in the same main column.
 * Right-rail navigation lives in BlueprintSidebar.
 */
export function BlueprintStepDetailView({
  completion,
  selectedStepId,
  disabled = false,
}: BlueprintStepDetailViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const flatSteps = React.useMemo(
    () =>
      GENESIS_SECTIONS.flatMap((s) =>
        s.subSteps.map((x) => ({
          id: x.id,
          title: x.title,
          completionKey: x.completionKey,
        })),
      ),
    [],
  );

  const selected = React.useMemo(() => {
    for (let s = 0; s < GENESIS_SECTIONS.length; s++) {
      const section = GENESIS_SECTIONS[s];
      const subIdx = section.subSteps.findIndex((x) => x.id === selectedStepId);
      if (subIdx >= 0) {
        return {
          section,
          sectionIndex: s,
          subStep: section.subSteps[subIdx],
          subIndex: subIdx,
        };
      }
    }
    return null;
  }, [selectedStepId]);

  const setStep = (stepId: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (stepId) next.set('step', stepId);
    else next.delete('step');
    if (!next.get('tab')) next.set('tab', 'venture-blueprint');
    setSearchParams(next, { replace: false });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!selected) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Step not found.
        <button
          type="button"
          onClick={() => setStep(null)}
          className="ml-2 underline hover:text-foreground"
        >
          Back to Venture Blueprint
        </button>
      </div>
    );
  }

  const flatIdx = flatSteps.findIndex((s) => s.id === selected.subStep.id);
  const prev = flatIdx > 0 ? flatSteps[flatIdx - 1] : undefined;
  const next =
    flatIdx >= 0 && flatIdx < flatSteps.length - 1
      ? flatSteps[flatIdx + 1]
      : undefined;

  const currentComplete = Boolean(completion[selected.subStep.completionKey]);

  return (
    <>
      <BlueprintStepDetail
        section={selected.section}
        sectionIndex={selected.sectionIndex}
        subStep={selected.subStep}
        subIndex={selected.subIndex}
        isComplete={currentComplete}
        isInvestorEssential={isInvestorEssentialSubstep(selected.subStep.id)}
        disabled={disabled}
        onBack={() => setStep(null)}
        onOpenFullEditor={
          selected.subStep.fallbackRoute
            ? () => {
                const path = `${window.location.pathname.split('/business-case')[0]}/${selected.subStep.fallbackRoute}`;
                window.open(path, '_blank', 'noopener');
              }
            : undefined
        }
      />
      <BlueprintStepFloatingNav
        currentLabel={selected.subStep.title}
        currentIndex={flatIdx}
        totalSteps={flatSteps.length}
        currentComplete={currentComplete}
        currentEssential={isInvestorEssentialSubstep(selected.subStep.id)}
        prevLabel={prev?.title}
        prevComplete={prev ? Boolean(completion[prev.completionKey]) : undefined}
        prevEssential={prev ? isInvestorEssentialSubstep(prev.id) : undefined}
        onPrev={prev ? () => setStep(prev.id) : undefined}
        nextLabel={next ? next.title : 'Back to Venture Blueprint'}
        nextComplete={next ? Boolean(completion[next.completionKey]) : undefined}
        nextEssential={next ? isInvestorEssentialSubstep(next.id) : undefined}
        onNext={next ? () => setStep(next.id) : () => setStep(null)}
      />
    </>
  );
}