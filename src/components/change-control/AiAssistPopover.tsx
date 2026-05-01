import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AiAssistField =
  | 'regulatory_impact_description'
  | 'implementation_plan'
  | 'verification_plan'
  | 'description'
  | 'justification';

const FIELD_LABELS: Record<AiAssistField, string> = {
  regulatory_impact_description: 'Regulatory Impact Description',
  implementation_plan: 'Implementation Plan',
  verification_plan: 'Verification Plan',
  description: 'Description',
  justification: 'Justification',
};

interface AiAssistPopoverProps {
  ccrId: string;
  field: AiAssistField;
  currentValue: string;
  /** Called with the merged value (current + suggestion, or replaces if empty). */
  onInsert: (mergedValue: string) => void;
  disabled?: boolean;
}

function mergeValue(current: string, suggestion: string): string {
  return current.trim() ? `${current.trim()}\n\n---\n${suggestion}` : suggestion;
}

export function AiAssistPopover({
  ccrId,
  field,
  currentValue,
  onInsert,
  disabled,
}: AiAssistPopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');
  const [contextPreview, setContextPreview] = useState<string>('');
  const [suggestion, setSuggestion] = useState<string>('');
  const [showContext, setShowContext] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);

  // Fetch context preview (without generating) when popover opens.
  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Reset on close
      setSuggestion('');
      setUserInstructions('');
      return;
    }
    if (!contextPreview && !contextLoading) {
      setContextLoading(true);
      try {
        // Lightweight fetch — call function with a dummy generate just to get the preview
        // To avoid wasting tokens we skip and instead surface a placeholder until Generate is pressed.
      } finally {
        setContextLoading(false);
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSuggestion('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-ccr-impact-assist', {
        body: {
          ccrId,
          field,
          userInstructions: userInstructions.trim() || undefined,
        },
      });
      if (error) throw error;
      const s: string = (data as any)?.suggestion?.trim() ?? '';
      const ctx: string = (data as any)?.contextPreview ?? '';
      if (ctx) setContextPreview(ctx);
      if (!s) {
        toast.error('No suggestion returned');
        return;
      }
      setSuggestion(s);
    } catch (e: any) {
      toast.error(e?.message || 'AI assist failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!suggestion) return;
    onInsert(mergeValue(currentValue, suggestion));
    toast.success('AI draft inserted');
    setOpen(false);
    setSuggestion('');
    setUserInstructions('');
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                className="inline-flex items-center justify-center h-6 w-6 rounded-md text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 disabled:opacity-50 transition-colors"
                aria-label="Draft with AI"
              >
                <Sparkles className="h-4 w-4 fill-yellow-400" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Draft with AI</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="w-[420px] z-[110] p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-400" />
            <h4 className="text-sm font-semibold">AI Draft — {FIELD_LABELS[field]}</h4>
          </div>

          {/* Context preview */}
          <div className="border rounded-md">
            <button
              type="button"
              onClick={() => setShowContext((s) => !s)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40"
            >
              <span>Context sent to AI</span>
              {showContext ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            {showContext && (
              <div className="px-3 pb-2 max-h-36 overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                {contextPreview ||
                  'CCR metadata (ID, title, change type, risk, regulatory impact, affected docs/requirements, products) will be sent. Press Generate to fetch the exact preview.'}
              </div>
            )}
          </div>

          {/* Manual input */}
          <div className="space-y-1.5">
            <Label htmlFor={`ai-instr-${field}`} className="text-xs">
              Additional instructions (optional)
            </Label>
            <Textarea
              id={`ai-instr-${field}`}
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              rows={2}
              placeholder='e.g. "Focus on supplier requalification and EU notified body notification"'
              className="text-sm"
            />
          </div>

          {/* Suggestion preview */}
          {suggestion && (
            <div className="space-y-1.5">
              <Label className="text-xs">Suggested draft</Label>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto text-sm whitespace-pre-wrap bg-muted/30">
                {suggestion}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            {suggestion ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Regenerate
                </Button>
                <Button size="sm" onClick={handleInsert}>
                  Insert
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {loading ? 'Generating…' : 'Generate'}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}