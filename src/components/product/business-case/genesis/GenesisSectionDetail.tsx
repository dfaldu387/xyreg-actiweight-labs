import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  GENESIS_SECTION_BY_ID,
  type GenesisSectionConfig,
  type GenesisSubStepConfig,
} from '@/config/genesisSections';
import { GenesisSsotEditor } from './GenesisSsotEditor';
import { GenesisSubstepNav } from './GenesisSubstepNav';
import { cn } from '@/lib/utils';

interface GenesisSectionDetailProps {
  sectionId: string;
  /** Optional — defaults to first sub-step. */
  substepId?: string;
  /** Map of completionKey -> isComplete (from useViabilityFunnelProgress). */
  completion: Record<string, boolean>;
  disabled?: boolean;
  /** Called when user clicks the back arrow to return to section list. */
  onBack: () => void;
}

export function GenesisSectionDetail({
  sectionId,
  substepId,
  completion,
  disabled,
  onBack,
}: GenesisSectionDetailProps) {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();

  const section: GenesisSectionConfig | undefined =
    GENESIS_SECTION_BY_ID[sectionId];
  if (!section) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Section not found.</p>
        <Button variant="link" onClick={onBack} className="px-0">
          Back to Genesis
        </Button>
      </Card>
    );
  }

  const activeSubstep: GenesisSubStepConfig =
    section.subSteps.find((s) => s.id === substepId) ?? section.subSteps[0];

  const goToSubstep = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('genesisSection', section.id);
    next.set('genesisSubstep', id);
    navigate(
      `/app/product/${productId}/business-case?${next.toString()}`,
    );
  };

  const openFullEditor = () => {
    if (!activeSubstep.fallbackRoute) return;
    const sep = activeSubstep.fallbackRoute.includes('?') ? '&' : '?';
    navigate(
      `/app/product/${productId}/${activeSubstep.fallbackRoute}${sep}returnTo=venture-blueprint`,
    );
  };

  const isComplete = (key: string) => Boolean(completion[key]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 max-w-5xl mx-auto">
      {/* Main column */}
      <div className="space-y-6 pb-20">
        {/* Breadcrumb / back */}
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-2 h-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            All sections
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{section.title}</span>
        </div>

        {/* Title block */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono">
              {section.number}.{section.subSteps.indexOf(activeSubstep) + 1}
            </Badge>
            <h1 className="text-2xl font-semibold">{activeSubstep.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{section.title}</p>
        </div>

        {/* Requirement card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">
              Requirement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{activeSubstep.requirement}</p>
          </CardContent>
        </Card>

        {/* YOUR RESPONSE card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Response
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled
              title="AI Fill is coming soon for Genesis"
            >
              <Sparkles className="h-4 w-4" />
              AI Fill
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSubstep.binding.kind === 'open-module' ? (
              <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  This step is captured in its dedicated module.
                </p>
                <div className="flex items-center justify-center gap-2">
                  {isComplete(activeSubstep.completionKey) ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-900">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {activeSubstep.summaryLabel ?? 'Complete'}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Circle className="h-3 w-3 mr-1" />
                      Not started
                    </Badge>
                  )}
                </div>
                {activeSubstep.fallbackRoute && (
                  <Button onClick={openFullEditor} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open full editor
                  </Button>
                )}
              </div>
            ) : (
              <>
                <GenesisSsotEditor
                  binding={activeSubstep.binding}
                  label={activeSubstep.title}
                  disabled={disabled}
                />
                {activeSubstep.fallbackRoute && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={openFullEditor}
                    className="px-0 h-auto gap-1 text-muted-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open full editor
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Bottom step navigator */}
        <GenesisSubstepNav section={section} currentSubstepId={activeSubstep.id} />
      </div>

      {/* Right rail — sub-step list */}
      <aside className="space-y-2 lg:sticky lg:top-4 self-start">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {section.title}
        </div>
        {section.subSteps.map((sub, i) => {
          const active = sub.id === activeSubstep.id;
          const done = isComplete(sub.completionKey);
          return (
            <button
              key={sub.id}
              onClick={() => goToSubstep(sub.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md border text-sm transition-colors flex items-center gap-2',
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-transparent hover:bg-muted/60 text-muted-foreground',
              )}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span className="text-xs font-mono shrink-0 opacity-60">
                {i + 1}.
              </span>
              <span className="truncate">{sub.title}</span>
            </button>
          );
        })}
      </aside>
    </div>
  );
}