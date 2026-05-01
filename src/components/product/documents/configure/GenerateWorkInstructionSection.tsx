import React, { useState } from 'react';
import { Wand2, Loader2, ListChecks, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { XYREG_FEATURE_MAP } from '@/data/xyregFeatureMap';

interface Props {
  sourceCiId: string;
  sourceName?: string;
  sourceDocumentNumber?: string | null;
  /** Visible only for SOPs in the parent — pass false for everything else. */
  isSop: boolean;
  onCreated?: (newCiId: string) => void;
  disabled?: boolean;
}

export function GenerateWorkInstructionSection({
  sourceCiId,
  sourceName,
  sourceDocumentNumber,
  isSop,
  onCreated,
  disabled,
}: Props) {
  if (!isSop) return null;

  const [focus, setFocus] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    setBusy(true);
    try {
      // Server-side: AI auto-detects which XyReg modules this SOP touches.
      const { data, error } = await supabase.functions.invoke('generate-work-instruction', {
        body: {
          sourceCiId,
          focus: focus.trim() || undefined,
        },
      });
      if (error) throw error;
      const newCiId = (data as { newCiId?: string })?.newCiId;
      const newNumber = (data as { newDocumentNumber?: string })?.newDocumentNumber;
      const detected = ((data as { modules?: string[] })?.modules ?? [])
        .map((k) => XYREG_FEATURE_MAP[k]?.label ?? k)
        .filter(Boolean);
      // Auto-open the new WI draft as a tab adjacent to the source SOP
      if (newCiId && onCreated) onCreated(newCiId);
      toast.success(`Work Instruction ${newNumber ?? ''} opened`, {
        description: detected.length > 0
          ? `Auto-detected modules: ${detected.join(', ')}`
          : `Derived from ${sourceDocumentNumber ?? sourceName ?? 'SOP'}`,
      });
    } catch (e) {
      console.error(e);
      toast.error('WI generation failed', {
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-md bg-muted/30">
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50 rounded-md">
        <span className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-purple-600" />
          <span>Generate Work Instruction from this SOP</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-3">
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 mt-0.5 text-purple-600 shrink-0" />
          <span>
            Produces a click-by-click WI grounded in real XyReg navigation.
            The AI reads this SOP and auto-detects the modules it touches.
          </span>
        </p>

      <div className="space-y-1">
        <Label htmlFor="wi-focus" className="text-xs">Focus (optional)</Label>
        <Textarea
          id="wi-focus"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder='e.g. "Approving a CAPA after effectiveness check"'
          rows={2}
          className="text-xs"
          disabled={busy || disabled}
        />
      </div>

      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={busy || disabled}
        className="w-full h-8"
      >
        {busy ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1.5" />}
        {busy ? 'Generating WI…' : 'Generate Work Instruction'}
      </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}