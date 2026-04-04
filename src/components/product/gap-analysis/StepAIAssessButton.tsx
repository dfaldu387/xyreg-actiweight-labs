import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';

interface FieldDef {
  id: string;
  label: string;
  type: string;
  options?: (string | { value: string; label: string })[];
}

interface Suggestion {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  suggestedValue: string;
  currentValue: string;
  rationale: string;
}

interface StepAIAssessButtonProps {
  productId: string;
  stepId: string;
  stepLabel: string;
  requirementText: string;
  fields: FieldDef[];
  responses: Record<string, any>;
  onApply: (updates: Record<string, string>) => void;
  frameworkId?: string;
}

export function StepAIAssessButton({
  productId,
  stepId,
  stepLabel,
  requirementText,
  fields,
  responses,
  onApply,
  frameworkId,
}: StepAIAssessButtonProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  // Filter to assessable fields including hazard_linker (notes) and doc_reference
  const assessableFields = fields.filter(f =>
    ['text', 'textarea', 'richtext', 'select', 'hazard_linker', 'doc_reference'].includes(f.type)
  );

  if (assessableFields.length === 0) return null;

  const handleConfirmAndAssess = () => {
    setConfirmOpen(false);
    handleAssess();
  };

  const handleAssess = async () => {
    setLoading(true);
    try {
      const fieldDefs = assessableFields.map(f => {
        if (f.type === 'hazard_linker') {
          return {
            id: `${f.id}_notes`,
            label: `${f.label} — Notes`,
            type: 'textarea',
            options: undefined,
            currentValue: responses[`${f.id}_notes`] || '',
          };
        }
        return {
          id: f.id,
          label: f.label,
          type: f.type === 'doc_reference' ? 'text' : f.type,
          options: f.options?.map(o => typeof o === 'string' ? o : o.value),
          currentValue: responses[f.id] || '',
        };
      });

      const { data, error } = await supabase.functions.invoke('ai-gap-step-assess', {
        body: {
          productId,
          stepId,
          stepLabel,
          requirementText: requirementText?.substring(0, 1000),
          fields: fieldDefs,
          frameworkId,
          outputLanguage,
          additionalPrompt,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const items: Suggestion[] = data.suggestions || [];
      // Only show suggestions that differ from current value
      const meaningful = items.filter(s =>
        s.suggestedValue && s.suggestedValue !== s.currentValue
      );

      if (meaningful.length === 0) {
        toast({ title: 'AI Assessment', description: 'No new suggestions — all fields look good.' });
        return;
      }

      setSuggestions(meaningful);
      setSelected(new Set(meaningful.map(s => s.fieldId)));
      setDialogOpen(true);
    } catch (e: any) {
      toast({ title: 'AI Assessment failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    const updates: Record<string, string> = {};
    suggestions.forEach(s => {
      if (selected.has(s.fieldId)) {
        updates[s.fieldId] = s.suggestedValue;
      }
    });
    onApply(updates);
    setDialogOpen(false);
    toast({ title: 'Suggestions applied', description: `${Object.keys(updates).length} field(s) updated` });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-300 text-violet-700 hover:from-violet-100 hover:to-purple-100 dark:from-violet-950/30 dark:to-purple-950/30 dark:border-violet-700 dark:text-violet-300"
      >
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        AI Fill All Fields
      </Button>

      {/* Pre-generation confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Fill All Fields
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Review the context sources that will be used for AI generation.
            </p>
          </DialogHeader>
          <AIContextSourcesPanel
            productId={productId}
            additionalSources={[`Requirement: ${stepLabel}`, frameworkId ? `Framework: ${frameworkId}` : ''].filter(Boolean)}
            mode="select"
            onLanguageChange={setOutputLanguage}
            onPromptChange={setAdditionalPrompt}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAndAssess}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Suggestions
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {stepLabel} — Select which suggestions to apply.
            </p>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {suggestions.map(s => (
              <label
                key={s.fieldId}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selected.has(s.fieldId) ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"
                )}
              >
                <Checkbox
                  checked={selected.has(s.fieldId)}
                  onCheckedChange={() => toggleSelect(s.fieldId)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{s.fieldLabel}</span>
                  {s.currentValue && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium">Current:</span>{' '}
                      <span className="truncate inline-block max-w-[300px] align-bottom">
                        {s.currentValue}
                      </span>
                    </div>
                  )}
                  <div className="mt-1.5 text-sm border-l-2 border-primary/40 pl-2">
                    <span className="font-medium text-xs text-muted-foreground">Suggested:</span>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none mt-0.5 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:text-sm"
                      dangerouslySetInnerHTML={{ __html: s.suggestedValue }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 italic">{s.rationale}</p>
                </div>
              </label>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={selected.size === 0}>
              Apply {selected.size} Suggestion{selected.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
