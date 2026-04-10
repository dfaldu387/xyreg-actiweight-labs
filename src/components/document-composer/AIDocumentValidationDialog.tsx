import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Link2Off,
  Sparkles,
} from 'lucide-react';
import { computeWordDiff } from '@/utils/textDiff';
import { cn } from '@/lib/utils';
import { DocumentTemplate } from '@/types/documentComposer';
import { DocumentValidationService, ValidationFinding, ValidationResult } from '@/services/documentValidationService';
import { toast } from 'sonner';

interface AIDocumentValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentTemplate;
  companyId?: string;
  companyName?: string;
  onContentUpdate?: (contentId: string, newContent: string) => void;
}

const severityConfig = {
  error: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', badge: 'destructive' as const, label: 'Error' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', badge: 'secondary' as const, label: 'Warning' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', badge: 'outline' as const, label: 'Info' },
};

const issueTypeLabels: Record<string, string> = {
  cross_reference: 'Cross-Reference',
  regulatory_gap: 'Regulatory Gap',
  terminology: 'Terminology',
  missing_content: 'Missing Content',
  structural: 'Structural',
};

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function AIDocumentValidationDialog({
  open,
  onOpenChange,
  template,
  companyId,
  companyName,
  onContentUpdate,
}: AIDocumentValidationDialogProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [findings, setFindings] = useState<ValidationFinding[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const suggestedRef = useRef<HTMLDivElement>(null);

  // Start validation when dialog opens
  useEffect(() => {
    if (open && !result && !isValidating) {
      runValidation();
    }
  }, [open]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setResult(null);
      setFindings([]);
      setSelectedIndex(null);
      setSelectedText('');
      setIsValidating(false);
    }
  }, [open]);

  const runValidation = async () => {
    if (!companyId) {
      toast.error('Company information not available');
      return;
    }
    setIsValidating(true);
    try {
      const validationResult = await DocumentValidationService.validateDocument(
        companyId,
        template,
        companyName
      );
      setResult(validationResult);
      setFindings(validationResult.findings);
      if (validationResult.findings.length === 0) {
        toast.success('Document validation passed — no issues found!');
      }
    } catch (error: any) {
      console.error('Validation failed:', error);
      toast.error('Validation failed', { description: error.message });
    } finally {
      setIsValidating(false);
    }
  };

  // Track text selection in suggestion panel
  const handleMouseUp = useCallback((e: MouseEvent) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text && suggestedRef.current?.contains(selection.anchorNode)) {
        setSelectedText(text);
        return;
      }
    }
    if (suggestedRef.current?.contains(e.target as Node)) {
      setSelectedText('');
    }
  }, []);

  useEffect(() => {
    if (open && selectedIndex !== null) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [open, selectedIndex, handleMouseUp]);

  const selectedFinding = selectedIndex !== null ? findings[selectedIndex] : null;
  const pendingFindings = findings.filter(f => f.status === 'pending');
  const unresolvedRefs = findings.filter(f => f.unresolvedReference);

  const handleAcceptAll = () => {
    if (!selectedFinding || !onContentUpdate) return;
    // Find matching content in the section
    const section = template.sections.find(s => s.title === selectedFinding.sectionTitle);
    if (section?.content?.[0]) {
      onContentUpdate(section.content[0].id, selectedFinding.suggestedContent);
    }
    setFindings(prev => prev.map((f, i) => i === selectedIndex ? { ...f, status: 'accepted' } : f));
    goToNext();
  };

  const handleAcceptSelection = () => {
    if (!selectedText || !selectedFinding || !onContentUpdate) return;
    const section = template.sections.find(s => s.title === selectedFinding.sectionTitle);
    if (section?.content?.[0]) {
      onContentUpdate(section.content[0].id, selectedText);
    }
    setFindings(prev => prev.map((f, i) => i === selectedIndex ? { ...f, status: 'accepted' } : f));
    setSelectedText('');
    goToNext();
  };

  const handleSkip = () => {
    setFindings(prev => prev.map((f, i) => i === selectedIndex ? { ...f, status: 'skipped' } : f));
    goToNext();
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    const nextPending = findings.findIndex((f, i) => i > selectedIndex && f.status === 'pending');
    if (nextPending >= 0) {
      setSelectedIndex(nextPending);
      setSelectedText('');
    } else {
      setSelectedIndex(null);
      setSelectedText('');
      toast.success('All findings reviewed!');
    }
  };

  const goToPrevious = () => {
    if (selectedIndex === null || selectedIndex === 0) return;
    setSelectedIndex(selectedIndex - 1);
    setSelectedText('');
  };

  // Diff for current finding
  const diffSegments = selectedFinding
    ? computeWordDiff(stripHtml(selectedFinding.originalContent), stripHtml(selectedFinding.suggestedContent))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(96vw,76rem)] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            AI Document Validation
            {result && (
              <Badge variant="secondary" className="ml-2">
                {findings.length} issue{findings.length !== 1 ? 's' : ''} found
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Loading state */}
        {isValidating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">Analyzing document...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Checking cross-references, regulatory compliance, terminology consistency, and more
              </p>
            </div>
          </div>
        )}

        {/* Findings list view */}
        {!isValidating && result && selectedIndex === null && (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
            {findings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ShieldCheck className="h-12 w-12 text-green-500" />
                <p className="text-lg font-medium text-green-700 dark:text-green-400">No issues found!</p>
                <p className="text-sm text-muted-foreground">Your document passes validation checks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Action findings */}
                {findings.map((finding, index) => {
                  const config = severityConfig[finding.severity];
                  const Icon = config.icon;
                  return (
                    <button
                      key={finding.id}
                      onClick={() => { setSelectedIndex(index); setSelectedText(''); }}
                      className={cn(
                        'w-full text-left rounded-lg border p-4 transition-all hover:shadow-md',
                        finding.status === 'accepted' && 'opacity-50 border-green-300 bg-green-50/50 dark:bg-green-900/10',
                        finding.status === 'skipped' && 'opacity-40',
                        finding.status === 'pending' && 'hover:border-primary/50',
                        config.bg
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={config.badge} className="text-xs">
                              {config.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {issueTypeLabels[finding.issueType] || finding.issueType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">§ {finding.sectionTitle}</span>
                            {finding.status === 'accepted' && (
                              <Badge className="bg-green-600 text-xs">Accepted</Badge>
                            )}
                            {finding.status === 'skipped' && (
                              <Badge variant="secondary" className="text-xs">Skipped</Badge>
                            )}
                          </div>
                          <p className="text-sm">{finding.description}</p>
                          {finding.unresolvedReference && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
                              <Link2Off className="h-3 w-3" />
                              <span>References <strong>{finding.unresolvedReference}</strong> — not yet created</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}

                {/* Unresolved references summary */}
                {unresolvedRefs.length > 0 && (
                  <div className="mt-6 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2Off className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-sm">Unresolved Document References</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      These documents are referenced but don't exist yet. They'll be tracked and validated when created.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(unresolvedRefs.map(f => f.unresolvedReference))].map(ref => (
                        <Badge key={ref} variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
                          {ref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Split-screen review for selected finding */}
        {!isValidating && selectedFinding && selectedIndex !== null && (
          <>
            <div className="shrink-0 mx-6 mb-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
              <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>Tip:</strong> Highlight text in the AI Suggestion panel to select specific portions, then click <strong>"Accept Selection"</strong>. Or click <strong>"Accept All"</strong> to use the entire suggestion.
              </span>
            </div>

            <div className="shrink-0 mx-6 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={severityConfig[selectedFinding.severity].badge}>
                  {severityConfig[selectedFinding.severity].label}
                </Badge>
                <Badge variant="outline">{issueTypeLabels[selectedFinding.issueType]}</Badge>
                <span className="text-sm text-muted-foreground">§ {selectedFinding.sectionTitle}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevious} disabled={selectedIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>{selectedIndex + 1} / {findings.length}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                  if (selectedIndex < findings.length - 1) {
                    setSelectedIndex(selectedIndex + 1);
                    setSelectedText('');
                  }
                }} disabled={selectedIndex === findings.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="shrink-0 mx-6 mb-3 text-sm">{selectedFinding.description}</div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 flex flex-col gap-4">
              {/* Original content */}
              <div className="flex min-h-0 flex-col">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Current Content</div>
                <div className="min-h-[80px] max-h-[22vh] overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {stripHtml(selectedFinding.originalContent) || <span className="italic text-muted-foreground">Empty</span>}
                </div>
              </div>

              {/* Diff view */}
              {stripHtml(selectedFinding.originalContent) && stripHtml(selectedFinding.suggestedContent) && (
                <div className="flex min-h-0 flex-col">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Changes</div>
                  <div className="min-h-[80px] max-h-[22vh] overflow-y-auto rounded-md border border-border bg-muted/20 p-3 text-sm leading-relaxed">
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

              {/* AI Suggestion */}
              <div className="flex min-h-0 flex-col">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  AI Suggestion
                  {selectedText && <span className="ml-2 text-xs font-normal text-primary">(text selected)</span>}
                </div>
                <div
                  ref={suggestedRef}
                  className="min-h-[80px] max-h-[22vh] overflow-y-auto rounded-md border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed select-text cursor-text prose prose-sm max-w-none whitespace-pre-wrap"
                >
                  {stripHtml(selectedFinding.suggestedContent) || <span className="italic text-muted-foreground">No suggestion</span>}
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4 sm:justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedIndex(null); setSelectedText(''); }}>
                  ← Back to list
                </Button>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline" size="sm" onClick={handleSkip} className="gap-2">
                  <X className="h-4 w-4" />
                  Skip
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAcceptSelection}
                  disabled={!selectedText}
                  className="gap-2"
                >
                  <MousePointerClick className="h-4 w-4" />
                  Accept Selection
                </Button>
                <Button size="sm" onClick={handleAcceptAll} className="gap-2">
                  <Check className="h-4 w-4" />
                  Accept All
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {/* Footer for list view */}
        {!isValidating && result && selectedIndex === null && (
          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4 sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {pendingFindings.length > 0 && (
              <Button onClick={() => { setSelectedIndex(findings.findIndex(f => f.status === 'pending')); setSelectedText(''); }} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Review {pendingFindings.length} Finding{pendingFindings.length !== 1 ? 's' : ''}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
