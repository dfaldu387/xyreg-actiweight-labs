import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Loader2, Link2, X, Check, PlusCircle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DeviceComponentsService } from '@/services/deviceComponentsService';
import { toast } from 'sonner';

interface AvailableComponent {
  name: string;
  description: string;
}

interface ComponentSuggestion {
  componentName: string;
  rationale: string;
}

interface NewComponentSuggestion {
  name: string;
  description: string;
  component_type: 'hardware' | 'software' | 'sub_assembly';
  rationale: string;
}

interface AIFeatureComponentSuggestionsProps {
  featureName: string;
  featureDescription: string;
  productName?: string;
  productId?: string;
  companyId?: string;
  availableComponents: AvailableComponent[];
  selectedComponents: string[];
  onToggle: (componentName: string) => void;
  onComponentCreated?: (component: { name: string; description: string }) => void;
}

export function AIFeatureComponentSuggestions({
  featureName,
  featureDescription,
  productName,
  productId,
  companyId,
  availableComponents,
  selectedComponents,
  onToggle,
  onComponentCreated,
}: AIFeatureComponentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ComponentSuggestion[]>([]);
  const [newSuggestions, setNewSuggestions] = useState<NewComponentSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedIndices, setDismissedIndices] = useState<Set<string>>(new Set());
  const [creatingIndices, setCreatingIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!featureName.trim()) {
      toast.error('Enter a feature name first');
      return;
    }
    if (availableComponents.length === 0) {
      toast.error('No components available to suggest from');
      return;
    }

    setIsLoading(true);
    setIsVisible(true);
    setDismissedIndices(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('ai-feature-component-suggester', {
        body: {
          featureName,
          featureDescription,
          productName,
          componentNames: availableComponents.map(c => ({ name: c.name, description: c.description })),
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Filter to only valid component names
      const validNames = new Set(availableComponents.map(c => c.name));
      const filtered = (data?.suggestions || []).filter(
        (s: ComponentSuggestion) => validNames.has(s.componentName)
      );
      setSuggestions(filtered);
      setNewSuggestions(data?.newSuggestions || []);
    } catch (err: any) {
      console.error('AI component suggestion error:', err);
      if (err?.message !== 'NO_CREDITS') {
        toast.error('Failed to generate suggestions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = (componentName: string, key: string) => {
    if (!selectedComponents.includes(componentName)) {
      onToggle(componentName);
    }
    toast.success(`Linked ${componentName}`);
    setDismissedIndices(prev => new Set(prev).add(key));
  };

  const handleCreateAndLink = async (suggestion: NewComponentSuggestion, index: number) => {
    if (!productId || !companyId) {
      toast.error('Product context missing — cannot create component');
      return;
    }

    setCreatingIndices(prev => new Set(prev).add(index));
    try {
      const created = await DeviceComponentsService.create({
        product_id: productId,
        company_id: companyId,
        name: suggestion.name,
        description: suggestion.description,
        component_type: suggestion.component_type,
      });

      onComponentCreated?.({ name: created.name, description: created.description });
      onToggle(created.name);
      toast.success(`Created & linked ${created.name}`);
      setDismissedIndices(prev => new Set(prev).add(`new-${index}`));
    } catch (err) {
      console.error('Failed to create component:', err);
      toast.error('Failed to create component');
    } finally {
      setCreatingIndices(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const visibleExisting = suggestions.filter((_, i) => !dismissedIndices.has(`existing-${i}`));
  const visibleNew = newSuggestions.filter((_, i) => !dismissedIndices.has(`new-${i}`));
  const hasVisible = visibleExisting.length > 0 || visibleNew.length > 0;

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleGenerate}
              disabled={isLoading || !featureName.trim() || availableComponents.length === 0}
              className="h-6 w-6 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
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
              <p className="font-medium text-xs">AI Suggest Components</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Database className="h-3 w-3 shrink-0" />
                Using: Feature Name, Description{productName ? `, ${productName}` : ''}, {availableComponents.length} components
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isVisible && !isLoading && hasVisible && (
        <div className="border border-amber-200 dark:border-amber-800 rounded-md p-3 space-y-2 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Suggested Components
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

          {/* Existing component suggestions */}
          {suggestions.map((suggestion, index) => {
            const key = `existing-${index}`;
            if (dismissedIndices.has(key)) return null;
            const isAlreadyLinked = selectedComponents.includes(suggestion.componentName);

            return (
              <div key={key} className="p-2.5 border rounded bg-background text-sm space-y-1.5">
                <p className="text-foreground font-medium">{suggestion.componentName}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground italic truncate max-w-[250px]">
                    {suggestion.rationale}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isAlreadyLinked ? (
                      <Badge variant="secondary" className="text-[10px] gap-0.5">
                        <Check className="h-2.5 w-2.5" />
                        Linked
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] gap-1"
                        onClick={() => handleLink(suggestion.componentName, key)}
                      >
                        <Link2 className="h-3 w-3" />
                        Link
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setDismissedIndices(prev => new Set(prev).add(key))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* New component suggestions */}
          {visibleNew.length > 0 && visibleExisting.length > 0 && (
            <div className="border-t border-amber-200 dark:border-amber-700 pt-2 mt-2">
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1.5">
                <PlusCircle className="h-3 w-3" />
                Consider adding these missing components
              </span>
            </div>
          )}
          {visibleNew.length > 0 && visibleExisting.length === 0 && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <PlusCircle className="h-3 w-3" />
              Consider adding these missing components
            </span>
          )}

          {newSuggestions.map((suggestion, index) => {
            const key = `new-${index}`;
            if (dismissedIndices.has(key)) return null;
            const isCreating = creatingIndices.has(index);

            return (
              <div key={key} className="p-2.5 border border-dashed border-amber-300 dark:border-amber-700 rounded bg-amber-50/30 dark:bg-amber-950/10 text-sm space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-foreground font-medium">{suggestion.name}</p>
                  <Badge variant="outline" className="text-[9px] h-4 px-1">
                    {suggestion.component_type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{suggestion.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground italic truncate max-w-[250px]">
                    {suggestion.rationale}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px] gap-1"
                      disabled={isCreating || !productId || !companyId}
                      onClick={() => handleCreateAndLink(suggestion, index)}
                    >
                      {isCreating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <PlusCircle className="h-3 w-3" />
                      )}
                      Create & Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setDismissedIndices(prev => new Set(prev).add(key))}
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

      {isVisible && !isLoading && suggestions.length === 0 && newSuggestions.length === 0 && (
        <p className="text-xs text-muted-foreground">No suggestions generated. Try adding more detail to the feature.</p>
      )}
    </div>
  );
}
