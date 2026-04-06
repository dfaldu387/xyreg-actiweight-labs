import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, MousePointerClick, Sparkles } from 'lucide-react';
import { computeWordDiff, DiffSegment } from '@/utils/textDiff';
import { cn } from '@/lib/utils';

interface AISuggestionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldLabel: string;
  originalContent: string;
  suggestedContent: string;
  onAccept: (content: string) => void;
  onReject: () => void;
}

/**
 * Strips HTML tags for plain-text diffing, preserving readable text.
 */
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function AISuggestionReviewDialog({
  open,
  onOpenChange,
  fieldLabel,
  originalContent,
  suggestedContent,
  onAccept,
  onReject,
}: AISuggestionReviewDialogProps) {
  const [selectedText, setSelectedText] = useState('');
  const suggestedRef = useRef<HTMLDivElement>(null);

  // Track text selection in the suggestion panel
  const handleMouseUp = useCallback((e: MouseEvent) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text && suggestedRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text);
        return;
      }
    }
    // Only clear if the click was inside the suggested panel (not on buttons)
    if (suggestedRef.current?.contains(e.target as Node)) {
      setSelectedText('');
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [open, handleMouseUp]);

  // Compute diff for visual highlighting
  const origPlain = stripHtml(originalContent);
  const sugPlain = stripHtml(suggestedContent);
  const diffSegments = computeWordDiff(origPlain, sugPlain);

  const handleAcceptAll = () => {
    onAccept(suggestedContent);
    onOpenChange(false);
  };

  const handleAcceptSelection = () => {
    if (selectedText) {
      onAccept(selectedText);
      onOpenChange(false);
    }
  };

  const handleReject = () => {
    onReject();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(96vw,72rem)] max-w-5xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Review AI Suggestion — {fieldLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="shrink-0 mx-6 mb-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
          <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Tip:</strong> Highlight text in the bottom AI Suggestion panel to select specific words or sentences you want to keep, then click <strong>"Accept Selection"</strong> to replace your current content with only the highlighted portion. Or click <strong>"Accept All"</strong> to use the entire suggestion.
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 flex flex-col gap-4">
          <div className="flex min-h-0 flex-col">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Current Content</div>
            <div className="min-h-[100px] max-h-[25vh] overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed">
              {origPlain || <span className="italic text-muted-foreground">Empty</span>}
            </div>
          </div>

          {origPlain && sugPlain && (
            <div className="flex min-h-0 flex-col">
              <div className="mb-2 text-sm font-medium text-muted-foreground">Changes</div>
              <div className="min-h-[100px] max-h-[25vh] overflow-y-auto rounded-md border border-border bg-muted/20 p-3 text-sm leading-relaxed">
                {diffSegments.map((seg, i) => (
                  <span
                    key={i}
                    className={cn(
                      seg.type === 'added' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                      seg.type === 'removed' && 'bg-red-100 text-red-800 line-through dark:bg-red-900/30 dark:text-red-300'
                    )}
                  >
                    {seg.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-col">
            <div className="mb-2 text-sm font-medium text-muted-foreground">
              AI Suggestion
              {selectedText && (
                <span className="ml-2 text-xs font-normal text-primary">(text selected)</span>
              )}
            </div>
            <div
              ref={suggestedRef}
              className="min-h-[100px] max-h-[25vh] overflow-y-auto rounded-md border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed select-text cursor-text prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: suggestedContent || '<span class="italic text-muted-foreground">Empty</span>' }}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4 sm:justify-between">
          <Button variant="outline" onClick={handleReject} className="gap-2">
            <X className="h-4 w-4" />
            Reject
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="secondary"
              onClick={handleAcceptSelection}
              disabled={!selectedText}
              className="gap-2"
            >
              <MousePointerClick className="h-4 w-4" />
              Accept Selection
            </Button>
            <Button onClick={handleAcceptAll} className="gap-2">
              <Check className="h-4 w-4" />
              Accept All
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
