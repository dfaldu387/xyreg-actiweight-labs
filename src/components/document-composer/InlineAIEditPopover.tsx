import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Check, X as XIcon, ArrowUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { markdownToHtml } from '@/utils/markdownToHtml';
import { fetchFullAIContext } from '@/services/aiContextAggregatorService';
import { toast } from 'sonner';

interface InlineAIEditPopoverProps {
  editor: any;
  selectedText: string;
  selectedHTML: string;
  selectionFrom: number;
  selectionTo: number;
  anchorRect: { top: number; left: number; bottom: number; right: number };
  sectionTitle?: string;
  companyId?: string;
  /** Scope of the document being edited — 'product' means the AI should ground on the active device. */
  scope?: 'company' | 'product';
  /** The active device id when scope is 'product'. */
  productId?: string;
  onClose: () => void;
}

type Status = 'idle' | 'generating' | 'preview' | 'error';

const POPOVER_WIDTH = 460;

export function InlineAIEditPopover({
  editor,
  selectedText,
  selectedHTML,
  selectionFrom,
  selectionTo,
  anchorRect,
  sectionTitle,
  companyId,
  scope,
  productId,
  onClose,
}: InlineAIEditPopoverProps) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [generated, setGenerated] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Prefetch the active device's context when the popover opens so the AI
  // grounds the edit on the right device. The promise is awaited at submit
  // time — if the user types fast the request just waits a beat.
  const deviceContextPromiseRef = useRef<Promise<string> | null>(null);

  // Position below the selection, clamped to the viewport. anchorRect comes
  // from editor.view.coordsAtPos(), which returns viewport-relative coords —
  // so we use `position: fixed` with these values directly (no scroll offset).
  const POPOVER_ESTIMATED_HEIGHT = 140;
  const wouldOverflowBottom = anchorRect.bottom + 8 + POPOVER_ESTIMATED_HEIGHT > window.innerHeight;
  const top = wouldOverflowBottom
    ? Math.max(8, anchorRect.top - 8 - POPOVER_ESTIMATED_HEIGHT)
    : anchorRect.bottom + 8;
  const left = Math.max(
    8,
    Math.min(window.innerWidth - POPOVER_WIDTH - 8, anchorRect.left)
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Always fetch context so company name/country is available even in
    // company-scoped docs. The aggregator no-ops on missing ids, so passing
    // an undefined productId in company scope just yields company-only context.
    const effectiveProductId = scope === 'product' ? productId : undefined;
    if (!companyId && !effectiveProductId) {
      deviceContextPromiseRef.current = Promise.resolve('');
      return;
    }
    deviceContextPromiseRef.current = fetchFullAIContext(effectiveProductId, companyId)
      .then((res) => res.text)
      .catch((err) => {
        console.warn('[InlineAIEditPopover] context fetch failed', err);
        return '';
      });
  }, [scope, productId, companyId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    // Delay attaching the mousedown-outside listener by one frame so the
    // same gesture that opened the popover (or the immediately-following
    // mouseup) cannot accidentally close it.
    const timer = setTimeout(
      () => window.addEventListener('mousedown', handleClickOutside),
      50,
    );
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoGrow = () => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  useEffect(() => { autoGrow(); }, [prompt]);

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const submit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setStatus('generating');
    setErrorMessage(null);
    abortRef.current = new AbortController();
    try {
      const referenceContext = (await deviceContextPromiseRef.current) || undefined;
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          prompt: trimmed,
          sectionTitle: sectionTitle || 'Selected content',
          currentContent: selectedHTML || selectedText,
          mode: 'edit',
          companyId,
          referenceContext,
        },
      });
      if (error) throw error;
      if (!data?.success || !data?.content) {
        throw new Error(data?.error || 'Failed to generate content');
      }
      setGenerated(String(data.content));
      setStatus('preview');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (err?.message === 'NO_CREDITS') return;
      const msg = err?.message || 'AI request failed';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const accept = () => {
    if (!generated || !editor) {
      onClose();
      return;
    }
    try {
      editor
        .chain()
        .focus()
        .insertContentAt({ from: selectionFrom, to: selectionTo }, markdownToHtml(generated))
        .run();
      toast.success('Applied AI edit');
    } catch (e) {
      console.error('[InlineAIEditPopover] Failed to apply edit:', e);
      toast.error('Could not apply edit');
    }
    onClose();
  };

  const reject = () => {
    setGenerated(null);
    setStatus('idle');
  };

  const retry = () => {
    setStatus('idle');
    setErrorMessage(null);
  };

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Edit with AI"
      data-xyreg-edit-popover
      style={{
        position: 'fixed',
        top,
        left,
        width: POPOVER_WIDTH,
        zIndex: 9999,
      }}
      className="rounded-lg border-2 border-primary bg-background shadow-2xl overflow-hidden"
    >
      {status !== 'preview' && (
        <>
          <div className="flex items-start gap-2 px-3 pt-3">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Edit selected content…"
              disabled={status === 'generating'}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm leading-5 text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{ minHeight: 20, maxHeight: 120 }}
            />
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {status === 'error' && errorMessage && (
            <div className="mx-3 mt-2 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-1.5 mt-2">
            <div className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/80">Edit selection</span>
              <span className="mx-1.5">·</span>
              <span>{selectedText.length} chars</span>
            </div>
            <div className="flex items-center gap-1">
              {status === 'error' && (
                <Button type="button" variant="ghost" size="sm" onClick={retry} className="h-6 px-2 text-xs">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={!prompt.trim() || status === 'generating'}
                aria-label="Submit"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90"
              >
                {status === 'generating' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {status === 'preview' && generated !== null && (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">AI suggestion</div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div
            className="max-h-60 overflow-y-auto rounded-md border border-border bg-muted/30 p-2 text-sm prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(generated) }}
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={reject} className="h-7 px-2 text-xs">
              Discard
            </Button>
            <Button type="button" size="sm" onClick={accept} className="h-7 px-2 text-xs">
              <Check className="h-3.5 w-3.5 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
