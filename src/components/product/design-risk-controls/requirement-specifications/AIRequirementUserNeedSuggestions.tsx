import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Loader2, Link2, PlusCircle, X, Check, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UserNeedsService } from '@/services/userNeedsService';
import { toast } from 'sonner';

interface UserNeedOption {
  id: string;
  user_need_id: string;
  description: string;
}

interface Suggestion {
  description: string;
  category: string;
  rationale: string;
}

interface AIRequirementUserNeedSuggestionsProps {
  requirementDescription: string;
  productId: string;
  companyId: string;
  productName?: string;
  existingUserNeeds: UserNeedOption[];
  selectedIds: string[];
  onSelect: (userNeedId: string) => void;
  onUserNeedCreated: (newNeed: UserNeedOption) => void;
}

function fuzzyMatch(a: string, b: string): number {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;
  const wordsA = la.split(/\s+/);
  const wordsB = lb.split(/\s+/);
  let matches = 0;
  for (const w of wordsA) {
    if (wordsB.some(wb => wb.includes(w) || w.includes(wb))) matches++;
  }
  return matches / Math.max(wordsA.length, wordsB.length);
}

export function AIRequirementUserNeedSuggestions({
  requirementDescription,
  productId,
  companyId,
  productName,
  existingUserNeeds,
  selectedIds,
  onSelect,
  onUserNeedCreated,
}: AIRequirementUserNeedSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null);
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!requirementDescription.trim()) {
      toast.error('Enter a requirement description first');
      return;
    }
    setIsLoading(true);
    setIsVisible(true);
    setDismissedIndices(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('ai-feature-user-needs-suggester', {
        body: {
          featureName: requirementDescription.substring(0, 80),
          featureDescription: requirementDescription,
          productName,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSuggestions(data?.suggestions || []);
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      if (err?.message !== 'NO_CREDITS') {
        toast.error('Failed to generate suggestions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const findMatch = (suggestion: Suggestion): UserNeedOption | null => {
    let bestMatch: UserNeedOption | null = null;
    let bestScore = 0;
    for (const un of existingUserNeeds) {
      const score = fuzzyMatch(suggestion.description, un.description);
      if (score > 0.4 && score > bestScore) {
        bestScore = score;
        bestMatch = un;
      }
    }
    return bestMatch;
  };

  const handleCreateAndLink = async (suggestion: Suggestion, index: number) => {
    setCreatingIndex(index);
    try {
      const newNeed = await UserNeedsService.createUserNeed({
        product_id: productId,
        company_id: companyId,
        description: suggestion.description,
        category: suggestion.category,
        status: 'Not Met',
      });

      const option: UserNeedOption = {
        id: newNeed.id,
        user_need_id: newNeed.user_need_id,
        description: newNeed.description,
      };

      onUserNeedCreated(option);
      onSelect(newNeed.user_need_id);
      toast.success(`Created & linked ${newNeed.user_need_id}`);
      setDismissedIndices(prev => new Set(prev).add(index));
    } catch (err) {
      console.error('Failed to create user need:', err);
      toast.error('Failed to create user need');
    } finally {
      setCreatingIndex(null);
    }
  };

  const handleLink = (match: UserNeedOption, index: number) => {
    if (!selectedIds.includes(match.user_need_id)) {
      onSelect(match.user_need_id);
    }
    toast.success(`Linked ${match.user_need_id}`);
    setDismissedIndices(prev => new Set(prev).add(index));
  };

  const visibleSuggestions = suggestions.filter((_, i) => !dismissedIndices.has(i));

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isLoading || !requirementDescription.trim()}
              className="h-8 gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/30"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="text-xs font-medium">
                {isLoading ? 'Suggesting…' : 'Suggest with AI'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px]">
            <div className="space-y-1">
              <p className="font-medium text-xs">AI Suggest User Needs</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Database className="h-3 w-3 shrink-0" />
                Using: Requirement Description{productName ? `, ${productName}` : ''}, {existingUserNeeds.length} existing needs
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isVisible && !isLoading && visibleSuggestions.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-800 rounded-md p-3 space-y-2 bg-amber-50/50 dark:bg-amber-950/20 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Suggested User Needs
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {suggestions.map((suggestion, index) => {
            if (dismissedIndices.has(index)) return null;
            const match = findMatch(suggestion);
            const isAlreadyLinked = match ? selectedIds.includes(match.user_need_id) : false;

            return (
              <div key={index} className="p-2.5 border rounded bg-background text-sm space-y-1.5">
                <p className="text-foreground">{suggestion.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {suggestion.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">
                      {suggestion.rationale}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {match ? (
                      isAlreadyLinked ? (
                        <Badge variant="secondary" className="text-[10px] gap-0.5">
                          <Check className="h-2.5 w-2.5" />
                          Linked ({match.user_need_id})
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={() => handleLink(match, index)}
                        >
                          <Link2 className="h-3 w-3" />
                          Link ({match.user_need_id})
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] gap-1"
                        disabled={creatingIndex === index}
                        onClick={() => handleCreateAndLink(suggestion, index)}
                      >
                        {creatingIndex === index ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <PlusCircle className="h-3 w-3" />
                        )}
                        Create & Link
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setDismissedIndices(prev => new Set(prev).add(index))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isVisible && !isLoading && suggestions.length === 0 && (
        <p className="text-xs text-muted-foreground mt-1">No suggestions generated. Try adding more detail to the requirement.</p>
      )}
    </div>
  );
}
