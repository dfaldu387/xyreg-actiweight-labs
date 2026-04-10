import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Loader2,
  Link2Off,
  Sparkles,
  FileText,
} from 'lucide-react';
import { computeWordDiff } from '@/utils/textDiff';
import { cn } from '@/lib/utils';
import { ValidationFinding } from '@/services/documentValidationService';
import { toast } from 'sonner';

export interface BulkValidationFinding extends ValidationFinding {
  sourceDocumentName: string;
}

interface BulkDocumentValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isValidating: boolean;
  findings: BulkValidationFinding[];
  documentCount: number;
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

export function BulkDocumentValidationDialog({
  open,
  onOpenChange,
  isValidating,
  findings,
  documentCount,
}: BulkDocumentValidationDialogProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<BulkValidationFinding | null>(null);

  // Group findings by source document
  const groupedFindings = findings.reduce<Record<string, BulkValidationFinding[]>>((acc, f) => {
    const key = f.sourceDocumentName || 'Unknown Document';
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const errorCount = findings.filter(f => f.severity === 'error').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;
  const unresolvedRefs = [...new Set(findings.filter(f => f.unresolvedReference).map(f => f.unresolvedReference))];

  const diffSegments = selectedFinding
    ? computeWordDiff(stripHtml(selectedFinding.originalContent), stripHtml(selectedFinding.suggestedContent))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(96vw,76rem)] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            Bulk Cross-Document Validation
            {!isValidating && (
              <Badge variant="secondary" className="ml-2">
                {documentCount} document{documentCount !== 1 ? 's' : ''} · {findings.length} finding{findings.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Loading state */}
        {isValidating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-lg font-medium">Analyzing {documentCount} documents...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Checking cross-references, terminology consistency, and regulatory gaps across documents
              </p>
            </div>
          </div>
        )}

        {/* Detail view for selected finding */}
        {!isValidating && selectedFinding && (
          <>
            <div className="shrink-0 mx-6 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={severityConfig[selectedFinding.severity].badge}>
                  {severityConfig[selectedFinding.severity].label}
                </Badge>
                <Badge variant="outline">{issueTypeLabels[selectedFinding.issueType] || selectedFinding.issueType}</Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedFinding.sourceDocumentName} · § {selectedFinding.sectionTitle}
                </span>
              </div>
            </div>

            <div className="shrink-0 mx-6 mb-3 text-sm">{selectedFinding.description}</div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 flex flex-col gap-4">
              <div className="flex min-h-0 flex-col">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Current Content</div>
                <div className="min-h-[80px] max-h-[22vh] overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {stripHtml(selectedFinding.originalContent) || <span className="italic text-muted-foreground">Empty</span>}
                </div>
              </div>

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

              <div className="flex min-h-0 flex-col">
                <div className="mb-2 text-sm font-medium text-muted-foreground">AI Suggestion</div>
                <div className="min-h-[80px] max-h-[22vh] overflow-y-auto rounded-md border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {stripHtml(selectedFinding.suggestedContent) || <span className="italic text-muted-foreground">No suggestion</span>}
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedFinding(null)}>
                ← Back to list
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Findings list grouped by document */}
        {!isValidating && !selectedFinding && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
              {findings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <ShieldCheck className="h-12 w-12 text-green-500" />
                  <p className="text-lg font-medium text-green-700 dark:text-green-400">No cross-document issues found!</p>
                  <p className="text-sm text-muted-foreground">All {documentCount} documents pass cross-validation checks.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="flex gap-3 flex-wrap mb-4">
                    {errorCount > 0 && <Badge variant="destructive">{errorCount} Error{errorCount !== 1 ? 's' : ''}</Badge>}
                    {warningCount > 0 && <Badge variant="secondary" className="border-amber-300 text-amber-700">{warningCount} Warning{warningCount !== 1 ? 's' : ''}</Badge>}
                    {infoCount > 0 && <Badge variant="outline">{infoCount} Info</Badge>}
                  </div>

                  {/* Grouped by document */}
                  {Object.entries(groupedFindings).map(([docName, docFindings]) => {
                    const isExpanded = expandedDoc === docName || expandedDoc === null;
                    const docErrors = docFindings.filter(f => f.severity === 'error').length;
                    const docWarnings = docFindings.filter(f => f.severity === 'warning').length;

                    return (
                      <div key={docName} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                          onClick={() => setExpandedDoc(isExpanded && expandedDoc !== null ? '__none__' : docName)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm font-medium flex-1 truncate">{docName}</span>
                          <div className="flex gap-1.5">
                            {docErrors > 0 && <Badge variant="destructive" className="text-xs">{docErrors}</Badge>}
                            {docWarnings > 0 && <Badge variant="secondary" className="text-xs">{docWarnings}</Badge>}
                            <Badge variant="outline" className="text-xs">{docFindings.length} total</Badge>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-2 space-y-2">
                            {docFindings.map((finding) => {
                              const config = severityConfig[finding.severity];
                              const Icon = config.icon;
                              return (
                                <button
                                  key={finding.id}
                                  onClick={() => setSelectedFinding(finding)}
                                  className={cn(
                                    'w-full text-left rounded-lg border p-3 transition-all hover:shadow-md',
                                    config.bg
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.color)} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <Badge variant={config.badge} className="text-xs">{config.label}</Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {issueTypeLabels[finding.issueType] || finding.issueType}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">§ {finding.sectionTitle}</span>
                                      </div>
                                      <p className="text-sm">{finding.description}</p>
                                      {finding.unresolvedReference && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                                          <Link2Off className="h-3 w-3" />
                                          <span>References <strong>{finding.unresolvedReference}</strong></span>
                                        </div>
                                      )}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Unresolved references summary */}
                  {unresolvedRefs.length > 0 && (
                    <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2Off className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-sm">Unresolved Document References</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {unresolvedRefs.map(ref => (
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

            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
