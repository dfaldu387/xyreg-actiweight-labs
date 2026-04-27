import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Check, Plus, Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BenefitSuggestion {
  benefit: string;
  rationale: string;
}

interface DetailsResult {
  description: string;
  tag: string;
  clinicalBenefits: BenefitSuggestion[];
}

/** Shared hook: fetches all three suggestions in one call, caches result */
export function useFeatureDetailsSuggestions(featureName: string, productName?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetailsResult | null>(null);

  const generate = async () => {
    if (!featureName.trim()) {
      toast.error('Enter a feature name first');
      return null;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-feature-details-suggester', {
        body: { featureName, productName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      return data as DetailsResult;
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      if (err?.message !== 'NO_CREDITS') {
        toast.error(err.message || 'Failed to generate suggestions');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, result, generate, clear: () => setResult(null) };
}

/* ─── Sparkles trigger button (icon-only) ─── */
interface AIFieldTriggerProps {
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export function AIFieldTrigger({ isLoading, onClick, disabled, tooltip }: AIFieldTriggerProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
            onClick={onClick}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <div className="space-y-1">
            <p className="font-medium text-xs">AI Generate</p>
            {tooltip && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Database className="h-3 w-3 shrink-0" />
                Using: {tooltip}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ─── Description suggestion inline panel ─── */
interface AIDescriptionSuggestionProps {
  suggestion: string;
  onApply: (desc: string) => void;
  onDismiss: () => void;
}

export function AIDescriptionSuggestion({ suggestion, onApply, onDismiss }: AIDescriptionSuggestionProps) {
  const [applied, setApplied] = useState(false);

  return (
    <div className="mt-1.5 p-2 border border-amber-300 dark:border-amber-700 rounded-md bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-foreground/80 flex-1">{suggestion}</p>
        <div className="flex gap-1 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => { onApply(suggestion); setApplied(true); }}
            disabled={applied}
          >
            {applied ? <><Check className="w-3 h-3 mr-1" /> Applied</> : 'Apply'}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={onDismiss}>✕</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Tag suggestion inline panel ─── */
interface AITagSuggestionProps {
  suggestion: string;
  onApply: (tag: string) => void;
  onDismiss: () => void;
}

export function AITagSuggestion({ suggestion, onApply, onDismiss }: AITagSuggestionProps) {
  const [applied, setApplied] = useState(false);

  return (
    <div className="mt-1.5 p-2 border border-amber-300 dark:border-amber-700 rounded-md bg-amber-50/50 dark:bg-amber-950/20">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Suggested:</span>
          <Badge variant="secondary" className="text-xs">{suggestion}</Badge>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => { onApply(suggestion); setApplied(true); }}
            disabled={applied}
          >
            {applied ? <><Check className="w-3 h-3 mr-1" /> Applied</> : 'Apply'}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={onDismiss}>✕</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Clinical Benefits suggestion inline panel ─── */
interface AIClinicalBenefitsSuggestionProps {
  suggestions: BenefitSuggestion[];
  existingBenefits: string[];
  selectedBenefits: string[];
  onToggleBenefit: (benefit: string) => void;
  onAddClinicalBenefit?: (benefit: string) => void;
  onDismiss: () => void;
}

export function AIClinicalBenefitsSuggestion({
  suggestions,
  existingBenefits,
  selectedBenefits,
  onToggleBenefit,
  onAddClinicalBenefit,
  onDismiss,
}: AIClinicalBenefitsSuggestionProps) {
  const isBenefitExisting = (benefit: string) =>
    existingBenefits.some(b => b.toLowerCase() === benefit.toLowerCase());

  const isBenefitLinked = (benefit: string) =>
    selectedBenefits.some(b => b.toLowerCase() === benefit.toLowerCase());

  const handleLink = (benefit: string) => {
    const match = existingBenefits.find(b => b.toLowerCase() === benefit.toLowerCase());
    if (match && !selectedBenefits.includes(match)) {
      onToggleBenefit(match);
    }
  };

  const handleCreateAndLink = (benefit: string) => {
    onAddClinicalBenefit?.(benefit);
    onToggleBenefit(benefit);
  };

  return (
    <div className="mt-1.5 p-2 border border-amber-300 dark:border-amber-700 rounded-md bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Suggested Benefits
        </span>
        <Button type="button" variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={onDismiss}>✕</Button>
      </div>
      {suggestions.map((cb, i) => {
        const existing = isBenefitExisting(cb.benefit);
        const linked = isBenefitLinked(cb.benefit);

        return (
          <div key={i} className="flex items-start justify-between gap-2 p-1.5 bg-background/50 rounded border text-xs">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground/90">{cb.benefit}</p>
              <p className="text-muted-foreground italic mt-0.5">{cb.rationale}</p>
            </div>
            {linked ? (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Check className="w-3 h-3 mr-1" /> Linked
              </Badge>
            ) : existing ? (
              <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-xs shrink-0" onClick={() => handleLink(cb.benefit)}>
                Link
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-xs shrink-0 border-dashed" onClick={() => handleCreateAndLink(cb.benefit)}>
                <Plus className="w-3 h-3 mr-1" /> Create & Link
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
