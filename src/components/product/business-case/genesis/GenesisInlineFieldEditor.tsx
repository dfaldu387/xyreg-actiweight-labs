import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { StepConfig } from '../blueprintStepMapping';

interface GenesisInlineFieldEditorProps {
  ssotField: NonNullable<StepConfig['ssotField']>;
  /** Current value loaded from SSOT; undefined while parent is still loading. */
  initialValue: string | number | null | undefined;
  /** When true, edits are disabled (e.g., plan restrictions). */
  disabled?: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Tier A inline editor for Genesis steps. Mirrors the IEC 60601 SSOT inline
 * pattern: edits a single column on `products` and saves on blur. The destination
 * page route is preserved as a fallback link in GenesisStepRow for advanced
 * editing (audit trail, related fields, comments).
 */
export function GenesisInlineFieldEditor({
  ssotField,
  initialValue,
  disabled,
}: GenesisInlineFieldEditorProps) {
  const { productId } = useParams<{ productId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toInputValue = (v: unknown): string =>
    v === null || v === undefined ? '' : String(v);

  const [value, setValue] = useState<string>(toInputValue(initialValue));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const lastSavedRef = useRef<string>(toInputValue(initialValue));

  // Keep input in sync with SSOT when parent finishes loading or refetches.
  useEffect(() => {
    const next = toInputValue(initialValue);
    if (next !== lastSavedRef.current) {
      lastSavedRef.current = next;
      setValue(next);
    }
  }, [initialValue]);

  const handleSave = async () => {
    if (!productId || disabled) return;
    if (value === lastSavedRef.current) return;

    // Coerce by inputType
    let payloadValue: string | number | null = value.trim() === '' ? null : value;
    if (payloadValue !== null && ssotField.inputType === 'number') {
      const n = Number(payloadValue);
      if (Number.isNaN(n)) {
        toast({
          title: 'Invalid number',
          description: `${ssotField.column} must be a number.`,
          variant: 'destructive',
        });
        setValue(lastSavedRef.current);
        return;
      }
      if (ssotField.min !== undefined && n < ssotField.min) {
        toast({ title: `Minimum is ${ssotField.min}`, variant: 'destructive' });
        setValue(lastSavedRef.current);
        return;
      }
      if (ssotField.max !== undefined && n > ssotField.max) {
        toast({ title: `Maximum is ${ssotField.max}`, variant: 'destructive' });
        setValue(lastSavedRef.current);
        return;
      }
      payloadValue = n;
    }

    setSaveState('saving');
    const { error } = await supabase
      .from('products')
      .update({ [ssotField.column]: payloadValue } as never)
      .eq('id', productId);

    if (error) {
      setSaveState('error');
      toast({
        title: 'Could not save',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    lastSavedRef.current = value;
    setSaveState('saved');
    // Invalidate every cache that derives from the products row so the
    // completion ticks (CheckCircle2 in GenesisStepRow) and the funnel sidebar
    // update immediately.
    queryClient.invalidateQueries({ queryKey: ['funnel-product', productId] });
    queryClient.invalidateQueries({ queryKey: ['funnel-blueprint', productId] });
    queryClient.invalidateQueries({ queryKey: ['genesis-step-row-product', productId] });
    window.setTimeout(() => setSaveState('idle'), 1500);
  };

  const inputId = `genesis-ssot-${ssotField.column}`;

  return (
    <div
      className="flex flex-col gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <Label htmlFor={inputId} className="sr-only">
          {ssotField.column}
        </Label>
        <Input
          id={inputId}
          type={ssotField.inputType === 'number' ? 'number' : 'text'}
          inputMode={ssotField.inputType === 'number' ? 'numeric' : undefined}
          min={ssotField.min}
          max={ssotField.max}
          placeholder={ssotField.placeholder}
          value={value}
          disabled={disabled || saveState === 'saving'}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="h-9 max-w-md"
        />
        <span
          className={cn(
            'flex items-center gap-1 text-xs text-muted-foreground transition-opacity',
            saveState === 'idle' && 'opacity-0',
          )}
          aria-live="polite"
        >
          {saveState === 'saving' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </>
          )}
          {saveState === 'saved' && (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              Saved
            </>
          )}
          {saveState === 'error' && (
            <span className="text-destructive">Error</span>
          )}
        </span>
      </div>
      {ssotField.helpText && (
        <p className="text-[11px] text-muted-foreground">{ssotField.helpText}</p>
      )}
    </div>
  );
}
