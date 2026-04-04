import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, BookOpen, ChevronDown, Eye, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DocumentTemplate } from '@/types/documentComposer';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { ReferenceDocumentService } from '@/services/referenceDocumentService';

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
  errorMessage?: string;
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
  const [selectedRefDocIds, setSelectedRefDocIds] = useState<string[]>([]);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [currentGeneratingTitle, setCurrentGeneratingTitle] = useState('');
  const { documents: refDocuments } = useReferenceDocuments(companyId);

  React.useEffect(() => {
    if (open) {
      setSections(buildSections(template));
      setIsDone(false);
      setIsGenerating(false);
      setSelectedRefDocIds([]);
      setExpandedSectionId(null);
      setCurrentGeneratingTitle('');
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
        const url = await ReferenceDocumentService.getDownloadUrl(doc.file_path);
        const resp = await fetch(url);
        if (!resp.ok) {
          textParts.push(`[${doc.file_name}] (Could not fetch content)`);
          continue;
        }

        if (['txt', 'md', 'csv', 'json', 'xml', 'html'].includes(ext)) {
          const text = await resp.text();
          textParts.push(`[${doc.file_name}]\n${text}`);
        } else if (['doc', 'docx'].includes(ext)) {
          // Extract text from .doc/.docx using mammoth
          const mammoth = await import('mammoth');
          const arrayBuffer = await resp.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (result.value) {
            textParts.push(`[${doc.file_name}]\n${result.value}`);
          } else {
            textParts.push(`[${doc.file_name}] (Could not extract text from document)`);
          }
        } else {
          textParts.push(`[${doc.file_name}] (Unsupported file format: ${ext})`);
        }
      } catch (e) {
        console.warn(`Failed to fetch reference doc ${doc.file_name}:`, e);
        textParts.push(`[${doc.file_name}] (Could not fetch content)`);
      }
    }
    return textParts.join('\n\n');
  };

  // Shared helper to generate a single section
  const generateSection = async (section: SectionState, referenceContext: string): Promise<boolean> => {
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, status: 'generating' } : s))
    );
    setCurrentGeneratingTitle(section.title);

    try {
      if (!referenceContext) {
        throw new Error('No reference documents selected. Please select at least one reference document to generate content.');
      }

      const { data, error } = await supabase.functions.invoke('ai-document-autofill', {
        body: {
          sectionTitle: section.title,
          currentContent: '',
          referenceContext,
          documentName: template.name,
          documentType: template.type,
          companyId,
        },
      });

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
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate content';
      console.error(`Error generating content for ${section.title}:`, err);
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, status: 'error', errorMessage: errorMsg } : s))
      );
      return false;
    }
  };

  const handleGenerate = async () => {
    const toGenerate = sections.filter((s) => s.selected);
    if (toGenerate.length === 0) {
      toast.error('Please select at least one section');
      return;
    }

    if (selectedRefDocIds.length === 0) {
      toast.error('Please select at least one reference document. Content is generated from reference documents only.');
      return;
    }

    setIsGenerating(true);
    setIsDone(false);

    const referenceContext = await fetchReferenceContext();

    let successCount = 0;
    let errorCount = 0;

    for (const section of toGenerate) {
      const ok = await generateSection(section, referenceContext);
      if (ok) successCount++;
      else errorCount++;
    }

    setIsGenerating(false);
    setCurrentGeneratingTitle('');
    setIsDone(true);

    if (successCount > 0 && errorCount === 0) {
      toast.success(`AI content generated for all ${successCount} sections!`);
    } else if (successCount > 0) {
      toast.warning(`Generated ${successCount} sections, ${errorCount} failed.`);
    } else {
      toast.error('Failed to generate content for all sections.');
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
            {/* Reference Documents Picker */}
            {refDocuments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                        <span title={section.errorMessage}><XCircle className="w-4 h-4 text-red-500" /></span>
                      )}
                    </div>
                  </div>

                  {/* Error message */}
                  {section.status === 'error' && section.errorMessage && (
                    <div className="px-4 pb-2">
                      <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-xs text-red-600">
                        {section.errorMessage}
                      </div>
                    </div>
                  )}

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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
                Cancel
              </Button>
              {!isDone ? (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedCount === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate All ({selectedCount})
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleApplyAll}
                  disabled={approvedCount === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply Approved ({approvedCount})
                </Button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
