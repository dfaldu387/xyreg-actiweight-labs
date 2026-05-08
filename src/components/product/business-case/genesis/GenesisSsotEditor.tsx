import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SsotBinding } from '@/config/genesisSections';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface GenesisSsotEditorProps {
  binding: Extract<SsotBinding, { kind: 'product-column' | 'product-jsonb' }>;
  /** Sub-step title — used as visible label above the input. */
  label: string;
  disabled?: boolean;
}

/**
 * Drives a single SSOT field on the `products` row from the Genesis
 * section detail view. Supports plain columns (`product-column`) and
 * keys inside the `intended_purpose_data` / `key_technology_characteristics`
 * JSONB objects (`product-jsonb`). Save-on-blur, cache invalidation, and
 * a small status indicator — same UX as the Tier A pilot.
 */
export function GenesisSsotEditor({
  binding,
  label,
  disabled,
}: GenesisSsotEditorProps) {
  const { productId } = useParams<{ productId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Load current value from the products row.
  const { data: productRow } = useQuery({
    queryKey: ['genesis-ssot-row', productId, binding.column],
    queryFn: async () => {
      if (!productId) return null;
      const col = binding.column;
      const { data, error } = await supabase
        .from('products')
        .select(col)
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data as unknown as Record<string, unknown> | null;
    },
    enabled: !!productId,
    staleTime: 0,
  });

  const initialValue = (() => {
    if (!productRow) return '';
    if (binding.kind === 'product-column') {
      const v = productRow[binding.column];
      return v === null || v === undefined ? '' : String(v);
    }
    const obj = (productRow[binding.column] ?? {}) as Record<string, unknown>;
    const v = obj?.[binding.key];
    return v === null || v === undefined ? '' : String(v);
  })();

  const [value, setValue] = useState<string>(initialValue);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const lastSavedRef = useRef<string>(initialValue);

  useEffect(() => {
    if (initialValue !== lastSavedRef.current) {
      lastSavedRef.current = initialValue;
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const handleSave = async () => {
    if (!productId || disabled) return;
    if (value === lastSavedRef.current) return;

    let payload: Record<string, unknown>;

    if (binding.kind === 'product-column') {
      let payloadValue: string | number | null =
        value.trim() === '' ? null : value;
      if (payloadValue !== null && binding.inputType === 'number') {
        const n = Number(payloadValue);
        if (Number.isNaN(n)) {
          toast({ title: 'Must be a number', variant: 'destructive' });
          setValue(lastSavedRef.current);
          return;
        }
        if (binding.min !== undefined && n < binding.min) {
          toast({ title: `Minimum is ${binding.min}`, variant: 'destructive' });
          setValue(lastSavedRef.current);
          return;
        }
        if (binding.max !== undefined && n > binding.max) {
          toast({ title: `Maximum is ${binding.max}`, variant: 'destructive' });
          setValue(lastSavedRef.current);
          return;
        }
        payloadValue = n;
      }
      payload = { [binding.column]: payloadValue };
    } else {
      const existing =
        ((productRow?.[binding.column] ?? {}) as Record<string, unknown>) || {};
      const next = { ...existing, [binding.key]: value.trim() === '' ? null : value };
      payload = { [binding.column]: next };
    }

    setSaveState('saving');
    const { error } = await supabase
      .from('products')
      .update(payload as never)
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
    queryClient.invalidateQueries({ queryKey: ['genesis-ssot-row', productId] });
    queryClient.invalidateQueries({ queryKey: ['funnel-product', productId] });
    queryClient.invalidateQueries({ queryKey: ['funnel-blueprint', productId] });
    window.setTimeout(() => setSaveState('idle'), 1500);
  };

  const inputId = `genesis-editor-${binding.column}-${
    binding.kind === 'product-jsonb' ? binding.key : 'col'
  }`;

  const placeholder =
    'placeholder' in binding ? binding.placeholder : undefined;
  const helpText = 'helpText' in binding ? binding.helpText : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId} className="text-sm font-medium flex items-center gap-2">
        {label}
        <span
          className={cn(
            'flex items-center gap-1 text-xs font-normal text-muted-foreground transition-opacity',
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
      </Label>
      {binding.inputType === 'textarea' ? (
        <Textarea
          id={inputId}
          placeholder={placeholder}
          value={value}
          disabled={disabled || saveState === 'saving'}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          rows={5}
        />
      ) : (
        <Input
          id={inputId}
          type={binding.inputType === 'number' ? 'number' : 'text'}
          inputMode={binding.inputType === 'number' ? 'numeric' : undefined}
          min={binding.kind === 'product-column' ? binding.min : undefined}
          max={binding.kind === 'product-column' ? binding.max : undefined}
          placeholder={placeholder}
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
        />
      )}
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}