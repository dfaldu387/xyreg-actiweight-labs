import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { GenesisSectionConfig } from '@/config/genesisSections';

interface GenesisSubstepNavProps {
  section: GenesisSectionConfig;
  currentSubstepId: string;
}

/**
 * Bottom step navigator (mirrors image 3 — "Plan Scope 1/4 → Responsibilities & ...").
 */
export function GenesisSubstepNav({
  section,
  currentSubstepId,
}: GenesisSubstepNavProps) {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();

  const idx = section.subSteps.findIndex((s) => s.id === currentSubstepId);
  const total = section.subSteps.length;
  if (idx < 0) return null;

  const prev = idx > 0 ? section.subSteps[idx - 1] : null;
  const next = idx < total - 1 ? section.subSteps[idx + 1] : null;

  const goTo = (substepId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('genesisSection', section.id);
    params.set('genesisSubstep', substepId);
    navigate(
      `/app/product/${productId}/business-case?${params.toString()}`,
    );
  };

  return (
    <div className="sticky bottom-4 mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3 rounded-full border bg-background/95 backdrop-blur px-2 py-2 shadow-lg">
        <Button
          variant={prev ? 'secondary' : 'ghost'}
          size="sm"
          disabled={!prev}
          onClick={() => prev && goTo(prev.id)}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {prev ? prev.title : 'Start'}
        </Button>

        <div className="text-xs text-muted-foreground tabular-nums px-2">
          Step {idx + 1} / {total}
        </div>

        <Button
          variant={next ? 'default' : 'ghost'}
          size="sm"
          disabled={!next}
          onClick={() => next && goTo(next.id)}
          className="rounded-full"
        >
          {next ? next.title : 'Done'}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}