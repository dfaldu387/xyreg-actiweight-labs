import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DraftField = 'description' | 'justification';

const FIELD_LABELS: Record<DraftField, string> = {
  description: 'Description',
  justification: 'Justification',
};

interface AiDraftAssistPopoverProps {
  field: DraftField;
  currentValue: string;
  onInsert: (value: string) => void;
  disabled?: boolean;
  // Pre-creation context
  companyId: string;
  productId?: string | null;
  title?: string;
  changeType?: string;
  sourceType?: string;
  sourceReference?: string;
  affectedDocumentIds?: string[];
  affectedDocumentNames?: string[];
  targetObjectType?: string;
  targetObjectLabel?: string;
}

function mergeValue(current: string, suggestion: string): string {
  if (!current?.trim()) return suggestion;
  return `${current.trim()}\n\n${suggestion}`;
}

export function AiDraftAssistPopover({
  field,
  currentValue,
  onInsert,
  disabled,
  companyId,
  productId,
  title,
  changeType,
  sourceType,
  sourceReference,
  affectedDocumentIds,
  affectedDocumentNames,
  targetObjectType,
  targetObjectLabel,
}: AiDraftAssistPopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [contextPreview, setContextPreview] = useState('');

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSuggestion('');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSuggestion('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-ccr-draft-assist', {
        body: {
          field,
          companyId,
          productId,
          title,
          changeType,
          sourceType,
          sourceReference,
          affectedDocumentIds,
          affectedDocumentNames,
          targetObjectType,
          targetObjectLabel,
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
                  'Title, change type, source, product context, and a short purpose/scope blurb for each attached document will be sent. Press Generate to fetch the exact preview.'}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`ai-draft-instr-${field}`} className="text-xs">
              Additional instructions (optional)
            </Label>
            <Textarea
              id={`ai-draft-instr-${field}`}
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              rows={2}
              placeholder='e.g. "Emphasise post-market complaint trend and supplier requalification"'
              className="text-sm"
            />
          </div>

          {suggestion && (
            <div className="space-y-1.5">
              <Label className="text-xs">Suggested draft</Label>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto text-sm whitespace-pre-wrap bg-muted/30">
                {suggestion}
              </div>
            </div>
          )}

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