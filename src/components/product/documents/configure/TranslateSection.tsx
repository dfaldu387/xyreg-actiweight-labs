import React, { useMemo, useState } from 'react';
import { Languages, Loader2, Sparkles, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TRANSLATION_LANGUAGES } from '@/data/xyregFeatureMap';

interface TranslateSectionProps {
  sourceCiId: string;
  sourceLanguage?: string | null;
  sourceName?: string;
  sourceDocumentNumber?: string | null;
  /** Optional callback to open the new draft as a tab right after creation. */
  onCreated?: (newCiId: string) => void;
  disabled?: boolean;
}

export function TranslateSection({
  sourceCiId,
  sourceLanguage,
  sourceName,
  sourceDocumentNumber,
  onCreated,
  disabled,
}: TranslateSectionProps) {
  const sourceLang = (sourceLanguage || 'GB').toUpperCase();
  const availableLanguages = useMemo(
    () => TRANSLATION_LANGUAGES.filter((l) => l.code !== sourceLang),
    [sourceLang],
  );

  const [target, setTarget] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const handleTranslate = async () => {
    if (!target) {
      toast.error('Pick a target language');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-document', {
        body: { sourceCiId, targetLang: target },
      });
      if (error) throw error;
      const newCiId = (data as { newCiId?: string })?.newCiId;
      const newNumber = (data as { newDocumentNumber?: string })?.newDocumentNumber;
      // Auto-open the new translated draft as a tab adjacent to the source
      if (newCiId && onCreated) onCreated(newCiId);
      toast.success(`Translated copy ${newNumber ?? ''} opened`, {
        description: `${sourceName ?? 'Document'} → ${target}`,
      });
      setTarget('');
    } catch (e) {
      console.error(e);
      toast.error('Translation failed', {
        description: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setBusy(false);
    }
  };

  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-md bg-muted/30">
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50 rounded-md">
        <span className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-blue-600" />
          <span>Translate this document</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-2">
        <p className="text-xs text-muted-foreground">
        Creates a new linked draft in the chosen language.
        Source language: <span className="font-mono">{sourceLang}</span>
        {sourceDocumentNumber ? (
          <> · New ID will be <span className="font-mono">{sourceDocumentNumber}-&lt;CC&gt;</span> (2-letter country code)</>
        ) : null}
      </p>
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="translate-target" className="text-xs">Target language</Label>
          <Select value={target} onValueChange={setTarget} disabled={busy || disabled}>
            <SelectTrigger id="translate-target" className="h-8 text-xs">
              <SelectValue placeholder="Select language…" />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((l) => (
                <SelectItem key={l.code} value={l.code} className="text-xs">
                  <span className="inline-flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span className="font-mono font-medium">{l.code}</span>
                    <span className="text-muted-foreground">— {l.country}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={handleTranslate}
          disabled={!target || busy || disabled}
          className="h-8"
        >
          {busy ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
          {busy ? 'Translating…' : 'Translate'}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground flex items-start gap-1">
        <ExternalLink className="w-3 h-3 mt-0.5 shrink-0" />
        New draft is created with “AI-translated · Needs review” flags. Review before signing.
      </p>
      </CollapsibleContent>
    </Collapsible>
  );
}