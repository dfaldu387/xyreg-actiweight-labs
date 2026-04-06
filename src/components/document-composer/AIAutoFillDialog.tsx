import React, { useState, useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, BookOpen, ChevronDown, Eye, Circle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DocumentTemplate } from '@/types/documentComposer';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { ReferenceDocumentService } from '@/services/referenceDocumentService';

/** Standards that should always be pre-checked */
const ALWAYS_PRECHECK = ['ISO 13485', 'ISO 14971', 'IEC 62366'];

interface AIAutoFillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentTemplate;
  companyId?: string;
  onContentUpdate: (contentId: string, newContent: string) => void;
}

type SectionStatus = 'pending' | 'generating' | 'done' | 'error';

interface SectionState {
  id: string;
  title: string;
  contentId: string;
  selected: boolean;
  status: SectionStatus;
  generatedContent?: string;
  approved: boolean;
}

export function AIAutoFillDialog({
  open,
  onOpenChange,
  template,
  companyId,
  onContentUpdate,
}: AIAutoFillDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<SectionState[]>(() => buildSections(template));
  const [isDone, setIsDone] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedRefDocIds, setSelectedRefDocIds] = useState<string[]>([]);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [currentGeneratingTitle, setCurrentGeneratingTitle] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [selectedStandardIds, setSelectedStandardIds] = useState<Set<string>>(new Set());
  const [standardsInitialized, setStandardsInitialized] = useState(false);
  const { documents: refDocuments } = useReferenceDocuments(companyId);

  // ── Standards query (same pattern as AIContextSourcesPanel) ──
  const { data: standards = [] } = useQuery({
    queryKey: ['ai-autofill-standards', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_gap_templates')
        .select('template_id, gap_analysis_templates!inner(id, framework, name, scope)')
        .eq('company_id', companyId!)
        .eq('is_enabled', true);
      if (error) throw error;

      const { data: alwaysData } = await supabase
        .from('gap_analysis_templates')
        .select('id, framework, name, scope')
        .eq('auto_enable_condition', 'always')
        .eq('is_active', true);

      const seen = new Set<string>();
      const results: { id: string; framework: string; name: string }[] = [];
      const addFw = (fw: string, name: string, id: string) => {
        if (!seen.has(fw)) {
          seen.add(fw);
          results.push({ id, framework: fw, name });
        }
      };
      (data || []).forEach((t: any) => {
        const tpl = t.gap_analysis_templates;
        if (tpl?.framework) addFw(tpl.framework, tpl.name || tpl.framework, tpl.id);
      });
      (alwaysData || []).forEach((t: any) => {
        if (t.framework) addFw(t.framework, t.name || t.framework, t.id);
      });
      return results;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // Pre-check core standards once loaded
  React.useEffect(() => {
    if (standards.length > 0 && !standardsInitialized) {
      const preChecked = new Set<string>();
      standards.forEach((s) => {
        const normalized = s.framework.replace(/_/g, ' ');
        if (ALWAYS_PRECHECK.some((p) => normalized.includes(p))) {
          preChecked.add(s.id);
        }
      });
      setSelectedStandardIds(preChecked);
      setStandardsInitialized(true);
    }
  }, [standards, standardsInitialized]);

  React.useEffect(() => {
    if (open) {
      setSections(buildSections(template));
      setIsDone(false);
      setIsGenerating(false);
      setSelectedRefDocIds([]);
      setExpandedSectionId(null);
      setCurrentGeneratingTitle('');
      setAdditionalInstructions('');
      setStandardsInitialized(false);
      setSelectedStandardIds(new Set());
      abortControllerRef.current = null;
    }
  }, [open, template]);

  function buildSections(tmpl: DocumentTemplate): SectionState[] {
    if (!tmpl?.sections) return [];
    return tmpl.sections
      .sort((a, b) => a.order - b.order)
      .map((section) => {
        const firstContent = (Array.isArray(section.content) ? section.content : [])
          .find((c) => c.type !== 'heading' && c.type !== 'table');
        return {
          id: section.id,
          title: section.title,
          contentId: firstContent?.id || '',
          selected: !!firstContent,
          status: 'pending' as SectionStatus,
          approved: false,
        };
      })
      .filter((s) => s.contentId);
  }

  const toggleRefDoc = (id: string) => {
    setSelectedRefDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSection = (id: string) => {
    if (isGenerating || isDone) return;
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const toggleAll = () => {
    if (isGenerating || isDone) return;
    const allSelected = sections.every((s) => s.selected);
    setSections((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
  };

  const selectedCount = sections.filter((s) => s.selected).length;

  // Shared helper to fetch reference content
  const fetchReferenceContext = async (): Promise<string> => {
    if (selectedRefDocIds.length === 0) return '';
    const selectedDocs = refDocuments.filter((d) => selectedRefDocIds.includes(d.id));
    const textParts: string[] = [];
    for (const doc of selectedDocs) {
      try {
        const ext = doc.file_name.split('.').pop()?.toLowerCase() || '';
        if (['txt', 'md', 'csv', 'json', 'xml', 'html'].includes(ext)) {
          const url = await ReferenceDocumentService.getDownloadUrl(doc.file_path);
          const resp = await fetch(url);
          if (resp.ok) {
            const text = await resp.text();
            textParts.push(`[${doc.file_name}]\n${text}`);
          }
        } else {
          textParts.push(`[${doc.file_name}] (Binary file - ${doc.file_type || ext} - metadata only)`);
        }
      } catch (e) {
        textParts.push(`[${doc.file_name}] (Could not fetch content)`);
      }
    }
    return textParts.join('\n\n');
  };

  // Shared helper to generate a single section
  const generateSection = async (section: SectionState, referenceContext: string): Promise<'done' | 'error' | 'aborted'> => {
    // Check if already aborted before starting
    if (abortControllerRef.current?.signal.aborted) return 'aborted';

    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, status: 'generating' } : s))
    );
    setCurrentGeneratingTitle(section.title);

    try {
      let prompt = `Generate comprehensive draft content for the "${section.title}" section following medical device industry best practices and regulatory standards (ISO 13485, FDA 21 CFR 820, EU MDR). Write professional, concise content appropriate for a ${template.type || 'QMS'} document titled "${template.name}".`;

      // Include selected standards
      const selectedStds = standards.filter((s) => selectedStandardIds.has(s.id));
      if (selectedStds.length > 0) {
        prompt += `\n\nEnsure compliance with the following standards and regulations: ${selectedStds.map((s) => s.name || s.framework).join(', ')}.`;
      }

      if (additionalInstructions.trim()) {
        prompt += `\n\nAdditional instructions: ${additionalInstructions.trim()}`;
      }
      if (referenceContext) {
        prompt += `\n\nUse the following reference documents as context to ground your output:\n\n${referenceContext}`;
      }

      const signal = abortControllerRef.current?.signal;

      // Race the supabase call against the abort signal so it cancels instantly
      const result = await new Promise<{ data: any; error: any }>((resolve, reject) => {
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }

        const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
        signal?.addEventListener('abort', onAbort, { once: true });

        supabase.functions.invoke('ai-content-generator', {
          body: {
            prompt,
            sectionTitle: section.title,
            currentContent: '',
            referenceContext: referenceContext || undefined,
          },
        }).then((res) => {
          signal?.removeEventListener('abort', onAbort);
          resolve(res);
        }).catch((err) => {
          signal?.removeEventListener('abort', onAbort);
          reject(err);
        });
      });

      const { data, error } = result;

      if (error || !data?.success || !data?.content) {
        throw new Error(data?.error || 'Failed to generate content');
      }

      setSections((prev) =>
        prev.map((s) =>
          s.id === section.id
            ? { ...s, status: 'done', generatedContent: data.content }
            : s
        )
      );
      return 'done';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // Reset section back to pending on abort
        setSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, status: 'pending' } : s))
        );
        return 'aborted';
      }
      console.error(`Error generating content for ${section.title}:`, err);
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, status: 'error' } : s))
      );
      return 'error';
    }
  };

  const handleGenerate = async () => {
    const toGenerate = sections.filter((s) => s.selected);
    if (toGenerate.length === 0) {
      toast.error('Please select at least one section');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    setIsDone(false);

    const referenceContext = await fetchReferenceContext();

    let successCount = 0;
    let errorCount = 0;

    for (const section of toGenerate) {
      const result = await generateSection(section, referenceContext);
      if (result === 'aborted') break;
      if (result === 'done') successCount++;
      else errorCount++;
    }

    const stopped = controller.signal.aborted;
    setIsGenerating(false);
    setCurrentGeneratingTitle('');
    abortControllerRef.current = null;

    if (stopped) {
      if (successCount > 0) setIsDone(true);
      toast.info(successCount > 0
        ? `Generation stopped — ${successCount} section${successCount > 1 ? 's' : ''} completed successfully.`
        : 'Generation stopped — no sections were completed.');
    } else {
      setIsDone(true);
      if (successCount > 0 && errorCount === 0) {
        toast.success(`AI content generated for all ${successCount} sections!`);
      } else if (successCount > 0) {
        toast.warning(`Generated ${successCount} sections, ${errorCount} failed.`);
      } else {
        toast.error('Failed to generate content for all sections.');
      }
    }
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const handleRetryFailed = async () => {
    const failedSections = sections.filter((s) => s.status === 'error');
    if (failedSections.length === 0) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    setIsDone(false);

    // Reset failed to pending
    setSections((prev) =>
      prev.map((s) => (s.status === 'error' ? { ...s, status: 'pending' as SectionStatus } : s))
    );

    const referenceContext = await fetchReferenceContext();

    let successCount = 0;
    let errorCount = 0;

    for (const section of failedSections) {
      const result = await generateSection(section, referenceContext);
      if (result === 'aborted') break;
      if (result === 'done') successCount++;
      else errorCount++;
    }

    const stopped = controller.signal.aborted;
    setIsGenerating(false);
    setCurrentGeneratingTitle('');
    abortControllerRef.current = null;

    if (stopped) {
      if (successCount > 0) setIsDone(true);
      toast.info(successCount > 0
        ? `Retry stopped — ${successCount} section${successCount > 1 ? 's' : ''} completed successfully.`
        : 'Retry stopped — no sections were completed.');
    } else {
      setIsDone(true);
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Retry successful for all ${successCount} sections!`);
      } else if (successCount > 0) {
        toast.warning(`Retried: ${successCount} succeeded, ${errorCount} still failing.`);
      } else {
        toast.error('Retry failed for all sections.');
      }
    }
  };

  const toggleApproval = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id && s.status === 'done' ? { ...s, approved: !s.approved } : s))
    );
  };

  const approveAll = () => {
    setSections((prev) =>
      prev.map((s) => (s.status === 'done' && s.generatedContent ? { ...s, approved: true } : s))
    );
  };

  const handleApplyAll = () => {
    const approved = sections.filter((s) => s.status === 'done' && s.approved && s.generatedContent);
    if (approved.length === 0) {
      toast.error('Please approve at least one section before applying.');
      return;
    }
    for (const section of approved) {
      onContentUpdate(section.contentId, section.generatedContent!);
    }
    toast.success(`Applied AI content to ${approved.length} sections.`);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (isGenerating) return;
    onOpenChange(false);
  };

  const generatedCount = sections.filter((s) => s.status === 'done').length;
  const failedCount = sections.filter((s) => s.status === 'error').length;
  const approvedCount = sections.filter((s) => s.status === 'done' && s.approved).length;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" style={{ zIndex: 1400 }} />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] max-h-[85vh] overflow-y-auto gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ zIndex: 1401 }}
        >
          {/* Header */}
          <div className="flex flex-col space-y-1.5 text-left mb-4">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Auto-Fill All Sections
            </DialogPrimitive.Title>
          </div>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div className="space-y-4">
            {/* AI Input Sources Indicator */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                AI Input Sources
              </h4>
              <div className="divide-y divide-border rounded-md border bg-muted/20">
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="font-medium">Template</span>
                  <span className="text-muted-foreground truncate">{template.name}</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="font-medium">Sections</span>
                  <span className="text-muted-foreground">{selectedCount} selected</span>
                </div>
                {selectedRefDocIds.length > 0 && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="font-medium">Reference Docs</span>
                    <span className="text-muted-foreground">{selectedRefDocIds.length} document(s)</span>
                  </div>
                )}
                {selectedStandardIds.size > 0 && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="font-medium">Standards</span>
                    <span className="text-muted-foreground">{selectedStandardIds.size} selected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Standards & Regulations Picker */}
            {standards.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Standards & Regulations
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  Selected standards will be included as context for AI generation
                </p>
                <div className="border rounded-lg max-h-[140px] overflow-y-auto p-2 space-y-1">
                  {standards.map((std) => (
                    <label
                      key={std.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedStandardIds.has(std.id)}
                        onCheckedChange={() => {
                          setSelectedStandardIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(std.id)) next.delete(std.id);
                            else next.add(std.id);
                            return next;
                          });
                        }}
                        disabled={isGenerating}
                      />
                      <span className="truncate flex-1">{std.name || std.framework}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Reference Documents Picker */}
            {refDocuments.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Reference Documents as Context
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    Select documents to ground AI output in your company's actual content
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => {
                      if (selectedRefDocIds.length === refDocuments.length) {
                        setSelectedRefDocIds([]);
                      } else {
                        setSelectedRefDocIds(refDocuments.map((d) => d.id));
                      }
                    }}
                    disabled={isGenerating}
                  >
                    {selectedRefDocIds.length === refDocuments.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="border rounded-lg max-h-[140px] overflow-y-auto p-2 space-y-1">
                  {refDocuments.map((doc) => (
                    <label
                      key={doc.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedRefDocIds.includes(doc.id)}
                        onCheckedChange={() => toggleRefDoc(doc.id)}
                        disabled={isGenerating}
                      />
                      <span className="truncate flex-1">{doc.file_name}</span>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1">
                          {doc.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                {selectedRefDocIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedRefDocIds.length} document(s) selected as context
                  </p>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Generate AI content for multiple sections at once. Select the sections you want to fill.
            </p>

            {/* Select All / Deselect All */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedCount} of {sections.length} sections selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
                disabled={isGenerating || isDone}
                className="text-xs h-7 px-2"
              >
                {sections.every((s) => s.selected) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Section List */}
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {sections.map((section) => (
                <div key={section.id}>
                  {/* Section row */}
                  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
                    {/* Checkbox: always for selection only */}
                    <Checkbox
                      checked={section.selected}
                      onCheckedChange={() => toggleSection(section.id)}
                      disabled={isGenerating || isDone}
                    />

                    {/* Section title - clickable to expand preview when done */}
                    <span
                      className={`flex-1 text-sm font-medium truncate ${
                        section.status === 'done' ? 'cursor-pointer hover:text-blue-600' : ''
                      }`}
                      onClick={() => {
                        if (section.status === 'done' && section.generatedContent) {
                          setExpandedSectionId(
                            expandedSectionId === section.id ? null : section.id
                          );
                        }
                      }}
                    >
                      {section.title}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Preview toggle button */}
                      {section.status === 'done' && section.generatedContent && (
                        <button
                          onClick={() =>
                            setExpandedSectionId(
                              expandedSectionId === section.id ? null : section.id
                            )
                          }
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          title="Preview generated content"
                        >
                          {expandedSectionId === section.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Approval toggle: separate from checkbox */}
                      {section.status === 'done' && section.generatedContent && (
                        <button
                          onClick={() => toggleApproval(section.id)}
                          className={`p-0.5 rounded-full transition-colors ${
                            section.approved
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-gray-300 hover:text-green-400'
                          }`}
                          title={section.approved ? 'Approved - click to unapprove' : 'Click to approve'}
                        >
                          {section.approved ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      )}

                      {/* Status icon: generating / error */}
                      {section.status === 'generating' && (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      )}
                      {section.status === 'error' && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded preview */}
                  {expandedSectionId === section.id && section.status === 'done' && section.generatedContent && (
                    <div className="px-4 pb-3 pt-1">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Generated Content Preview
                          </span>
                          <Button
                            size="sm"
                            variant={section.approved ? 'default' : 'outline'}
                            className={`h-6 text-xs px-2 ${
                              section.approved
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'border-green-300 text-green-700 hover:bg-green-50'
                            }`}
                            onClick={() => toggleApproval(section.id)}
                          >
                            {section.approved ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approved
                              </>
                            ) : (
                              'Approve'
                            )}
                          </Button>
                        </div>
                        <div className="text-sm text-gray-700 bg-white rounded border p-2 max-h-[200px] overflow-y-auto">
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: section.generatedContent }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress info - shows which section is being generated */}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Generating <strong>{currentGeneratingTitle}</strong>... Please wait.
                </span>
              </div>
            )}

            {/* Approval summary when done */}
            {isDone && generatedCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {approvedCount} of {generatedCount} generated sections approved
                </span>
                {approvedCount < generatedCount && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={approveAll}
                    className="text-xs h-7 px-2 text-green-600 hover:text-green-700"
                  >
                    Approve All
                  </Button>
                )}
              </div>
            )}

            {/* Additional Instructions */}
            <div>
              <label className="text-sm font-semibold text-gray-700">Additional instructions (optional)</label>
              <Textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                disabled={isGenerating || isDone}
                rows={3}
                className="mt-1.5 text-sm bg-blue-50/50 border-blue-100 focus:border-blue-300 resize-y"
                placeholder="Add specific instructions for the AI generation..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
                Cancel
              </Button>
              {!isDone ? (
                isGenerating ? (
                  <Button
                    onClick={handleStopGeneration}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Stop Generating
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={selectedCount === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate All ({selectedCount})
                  </Button>
                )
                ) : (
                <>
                  {failedCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleRetryFailed}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Retry Failed ({failedCount})
                    </Button>
                  )}
                  <Button
                    onClick={handleApplyAll}
                    disabled={approvedCount === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Apply Approved ({approvedCount})
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
