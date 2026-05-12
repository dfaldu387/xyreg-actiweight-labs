import React, { useState, useRef, useEffect } from 'react';
import { showNoCreditDialog } from '@/context/AiCreditContext';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, BookOpen, ChevronDown, Eye, Circle, ArrowLeft, Upload, FileText, MinusCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand2, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DocumentTemplate } from '@/types/documentComposer';
import { useApiKeyStatus } from '@/hooks/useCompanyApiKeys';
import { DocToPdfConverterService } from '@/services/docToPdfConverterService';

interface AIAutoFillFromDocxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DocumentTemplate;
  companyId?: string;
  productId?: string;
  onContentUpdate: (contentId: string, newContent: string) => void;
  onBack?: () => void;
}

type SectionStatus = 'pending' | 'generating' | 'done' | 'error' | 'not_found';

const NOT_FOUND_MARKER = '__NOT_FOUND__';

interface SectionState {
  id: string;
  title: string;
  contentId: string;
  selected: boolean;
  status: SectionStatus;
  generatedContent?: string;
  approved: boolean;
}

// Hard ceiling on the docx the user can upload. ConvertAPI handles larger
// files, but the resulting PDF still has to fit inside a single Gemini
// inline_data part on every per-section call (~20MB per request body).
const MAX_DOCX_BYTES = 15 * 1024 * 1024; // 15MB

export function AIAutoFillFromDocxDialog({
  open,
  onOpenChange,
  template,
  companyId,
  productId,
  onContentUpdate,
  onBack,
}: AIAutoFillFromDocxDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<SectionState[]>(() => buildSections(template));
  const [isDone, setIsDone] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [currentGeneratingTitle, setCurrentGeneratingTitle] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const isMountedRef = useRef(true);
  const { googleVertexAvailable, isLoading: isKeyStatusLoading } = useApiKeyStatus(companyId || '');

  // Uploaded-docx state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  // PDF base64 (no data: prefix) of the user's uploaded .docx after server
  // conversion via the convert-doc-to-pdf edge function. Sent as an
  // inline_data part to Gemini on each per-section extract call so the
  // model can read the rendered document with layout, tables, and images
  // intact — not just plain text.
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [extractionState, setExtractionState] = useState<'idle' | 'extracting' | 'ready' | 'error'>('idle');
  const [extractionInfo, setExtractionInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoPickTriggeredRef = useRef(false);

  const isAborted = () => !isMountedRef.current || !!abortControllerRef.current?.signal.aborted;

  const safelySetGeneratingState = (generating: boolean) => {
    if (!isMountedRef.current) return;
    setIsGenerating(generating);
  };

  const safelySetDoneState = (done: boolean) => {
    if (!isMountedRef.current) return;
    setIsDone(done);
  };

  const safelySetCurrentGeneratingTitle = (title: string) => {
    if (!isMountedRef.current) return;
    setCurrentGeneratingTitle(title);
  };

  const safelyUpdateSections = (updater: React.SetStateAction<SectionState[]>) => {
    if (!isMountedRef.current) return;
    setSections(updater);
  };

  // Reset state when (re)opened, then auto-open the OS file picker once.
  useEffect(() => {
    if (open) {
      setSections(buildSections(template));
      setIsDone(false);
      setIsGenerating(false);
      setExpandedSectionId(null);
      setCurrentGeneratingTitle('');
      setAdditionalInstructions('');
      setUploadedFile(null);
      setPdfBase64('');
      setExtractionState('idle');
      setExtractionInfo('');
      abortControllerRef.current = null;
      autoPickTriggeredRef.current = false;
      // Auto-open OS file picker shortly after the dialog mounts so the user
      // is prompted to choose a .docx as the first action.
      const t = setTimeout(() => {
        if (!autoPickTriggeredRef.current) {
          autoPickTriggeredRef.current = true;
          fileInputRef.current?.click();
        }
      }, 100);
      return () => clearTimeout(t);
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

  const toggleSection = (id: string) => {
    if (isGenerating) return;
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const toggleAll = () => {
    if (isGenerating) return;
    const allSelected = sections.every((s) => s.selected);
    setSections((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
  };

  const selectedCount = sections.filter((s) => s.selected).length;
  // Selected sections that haven't been extracted yet — drives the "Extract"
  // button so the user can add more sections to the batch after the first run.
  const pendingSelectedCount = sections.filter(
    (s) => s.selected && s.status === 'pending',
  ).length;

  // Convert the file's bytes to a base64 string without the data: prefix.
  // FileReader yields a "data:<mime>;base64,<...>" URL; we strip the prefix
  // because the convert-doc-to-pdf edge function and Gemini's inlineData
  // both expect raw base64.
  const fileToBase64 = (file: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
      };
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });

  const handleFileChosen = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext !== 'docx' && ext !== 'doc') {
      toast.error('Only .doc / .docx files can be uploaded.');
      return;
    }
    if (file.size > MAX_DOCX_BYTES) {
      toast.error(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The max supported size is ${(MAX_DOCX_BYTES / 1024 / 1024).toFixed(0)} MB.`,
      );
      return;
    }
    setUploadedFile(file);
    setExtractionState('extracting');
    setExtractionInfo('');
    try {
      // Client-side .docx → PDF conversion using mammoth + pdfmake. Same
      // service every other module in the app uses (CompanyDocumentEditDialog,
      // ProductDocumentCreationDialog, etc.). No external API, no API key.
      const pdfBlob = await DocToPdfConverterService.convertDocxToPdf(file, {
        fileName: file.name,
      });
      if (!isMountedRef.current) return;
      if (!pdfBlob || pdfBlob.size === 0) {
        setPdfBase64('');
        setExtractionState('error');
        setExtractionInfo('');
        toast.error('Could not convert the uploaded file to PDF.');
        return;
      }
      const pdf = await fileToBase64(pdfBlob);
      if (!isMountedRef.current) return;
      setPdfBase64(pdf);
      setExtractionState('ready');
      setExtractionInfo('Done');
    } catch (err: any) {
      console.error('Failed to convert uploaded .docx to PDF:', err);
      if (!isMountedRef.current) return;
      setPdfBase64('');
      setExtractionState('error');
      setExtractionInfo('');
      toast.error('Could not convert the uploaded file to PDF.');
    }
  };

  const handleReplaceFile = () => {
    if (isGenerating) return;
    fileInputRef.current?.click();
  };

  // Extract a single section's content from the uploaded PDF (converted from
  // the user's .docx). The PDF is sent to Gemini as an inline_data part so
  // the model reads the rendered document directly — tables, layout, images
  // and headings are all preserved without client-side text extraction.
  const generateSection = async (section: SectionState, referencePdf: string): Promise<'done' | 'error' | 'aborted' | 'no_credits' | 'not_found'> => {
    if (isAborted()) return 'aborted';

    safelyUpdateSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, status: 'generating' } : s))
    );
    safelySetCurrentGeneratingTitle(section.title);

    try {
      // Extraction-mode prompt: locate the section in the uploaded PDF and
      // return its exact content, or the not-found marker if absent.
      let prompt = `You are extracting an existing section from the attached PDF (converted from the user's uploaded Word document). Do NOT generate, rewrite, summarize, or invent content.

TASK: Locate the section titled "${section.title}" (or its closest equivalent heading — match on meaning, not exact wording) inside the attached PDF, and return ONLY the content that belongs to that section.

RULES:
- Preserve the original wording, terminology, lists, tables, and ordering from the PDF. Do not paraphrase.
- Return the content as clean HTML (use <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <tr>, <td>, <th> as appropriate). Do NOT include the section heading itself.
- Include only the content that is unambiguously part of the requested section. Do not pull in content from neighboring sections.
- If the requested section is NOT present in the PDF (no matching heading and no clearly equivalent content), return EXACTLY the literal string ${NOT_FOUND_MARKER} on its own, with no HTML tags, no explanation, and no other text.
- If the section heading exists in the PDF but its body is empty, still return ${NOT_FOUND_MARKER}.

Target section title: "${section.title}"
Document type: ${template.type || 'QMS'} — "${template.name}"`;

      if (additionalInstructions.trim()) {
        prompt += `\n\nAdditional user instructions (apply only while extracting, never to invent content): ${additionalInstructions.trim()}`;
      }

      const signal = abortControllerRef.current?.signal;

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
            companyId: companyId || undefined,
            referencePdfBase64: referencePdf || undefined,
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

      if (isAborted()) return 'aborted';

      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        return 'no_credits';
      }

      if (error || !data?.success || !data?.content) {
        throw new Error(data?.error || 'Failed to generate content');
      }

      // Detect the not-found marker (strip any HTML the model may have wrapped around it).
      const strippedText = String(data.content).replace(/<[^>]*>/g, '').trim();
      const isNotFound =
        strippedText === NOT_FOUND_MARKER ||
        strippedText.toUpperCase() === NOT_FOUND_MARKER ||
        /^_{2}NOT_FOUND_{2}$/i.test(strippedText);

      if (isNotFound) {
        safelyUpdateSections((prev) =>
          prev.map((s) =>
            s.id === section.id
              ? { ...s, status: 'not_found', generatedContent: undefined, approved: false }
              : s
          )
        );
        return 'not_found';
      }

      safelyUpdateSections((prev) =>
        prev.map((s) =>
          s.id === section.id
            ? { ...s, status: 'done', generatedContent: data.content }
            : s
        )
      );
      return 'done';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        safelyUpdateSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, status: 'pending' } : s))
        );
        return 'aborted';
      }
      console.error(`Error generating content for ${section.title}:`, err);
      if (isAborted()) return 'aborted';
      safelyUpdateSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, status: 'error' } : s))
      );
      return 'error';
    }
  };

  const runGenerationLoop = async (sectionsToRun: SectionState[]): Promise<{ stopped: boolean; successCount: number; errorCount: number; notFoundCount: number; noCredits: boolean }> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    safelySetGeneratingState(true);
    safelySetDoneState(false);

    // Extraction mode: the uploaded PDF IS the sole source of truth.
    // Do NOT mix in device/company context — that would invite hallucination
    // beyond what's actually written in the file.
    const referencePdf = pdfBase64;

    if (controller.signal.aborted || !isMountedRef.current) {
      abortControllerRef.current = null;
      safelySetGeneratingState(false);
      safelySetCurrentGeneratingTitle('');
      return { stopped: true, successCount: 0, errorCount: 0, notFoundCount: 0, noCredits: false };
    }

    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    let noCredits = false;

    for (const section of sectionsToRun) {
      const result = await generateSection(section, referencePdf);
      if (result === 'no_credits') { noCredits = true; break; }
      if (result === 'aborted') break;
      if (result === 'done') successCount++;
      else if (result === 'not_found') notFoundCount++;
      else errorCount++;
    }

    const stopped = controller.signal.aborted;
    safelySetGeneratingState(false);
    safelySetCurrentGeneratingTitle('');
    abortControllerRef.current = null;

    return { stopped, successCount, errorCount, notFoundCount, noCredits };
  };

  const handleGenerate = async () => {
    // Only run extraction for selected sections that haven't been processed yet.
    // Already-extracted sections keep their content; users can use the per-section
    // retry button to re-run a single done/not-found section explicitly.
    const toGenerate = sections.filter((s) => s.selected && s.status === 'pending');
    if (toGenerate.length === 0) {
      toast.error('Please select at least one section that hasn\'t been extracted yet.');
      return;
    }
    if (extractionState !== 'ready') {
      toast.error('Please upload a .docx file first.');
      return;
    }

    const { stopped, successCount, errorCount, notFoundCount, noCredits } = await runGenerationLoop(toGenerate);

    if (noCredits) return;

    const summarize = () => {
      const parts: string[] = [];
      if (successCount > 0) parts.push(`${successCount} extracted`);
      if (notFoundCount > 0) parts.push(`${notFoundCount} not in document`);
      if (errorCount > 0) parts.push(`${errorCount} failed`);
      return parts.join(', ') || 'no sections processed';
    };

    if (stopped) {
      if (successCount > 0 || notFoundCount > 0) safelySetDoneState(true);
      toast.info(`Extraction stopped — ${summarize()}.`);
    } else {
      safelySetDoneState(true);
      if (successCount > 0 && errorCount === 0 && notFoundCount === 0) {
        toast.success(`Extracted content for all ${successCount} sections from the uploaded document.`);
      } else if (successCount > 0) {
        toast.info(`Extraction finished: ${summarize()}.`);
      } else if (notFoundCount > 0 && errorCount === 0) {
        toast.info(`No matching content found in the uploaded document for the selected sections.`);
      } else {
        toast.error('Extraction failed for all selected sections.');
      }
    }
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  // Re-extract a single section. Used by the inline retry button shown next to
  // each section in the review step.
  const handleRetrySection = async (sectionId: string) => {
    if (isGenerating) return;
    if (extractionState !== 'ready') {
      toast.error('Please upload a .docx file first.');
      return;
    }
    const target = sections.find((s) => s.id === sectionId);
    if (!target) return;

    // Reset just this section back to a clean pending state before re-running.
    safelyUpdateSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, status: 'pending' as SectionStatus, generatedContent: undefined, approved: false }
          : s,
      ),
    );
    setExpandedSectionId(null);

    const { stopped, successCount, errorCount, notFoundCount, noCredits } = await runGenerationLoop([target]);

    if (noCredits) return;

    // Stay in the "done" review screen regardless of single-section outcome.
    safelySetDoneState(true);

    if (stopped) {
      toast.info('Retry stopped.');
    } else if (successCount > 0) {
      toast.success(`Re-extracted "${target.title}".`);
    } else if (notFoundCount > 0) {
      toast.info(`"${target.title}" is not in the uploaded document.`);
    } else if (errorCount > 0) {
      toast.error(`Retry failed for "${target.title}".`);
    }
  };

  const handleRetryFailed = async () => {
    const failedSections = sections.filter((s) => s.status === 'error');
    if (failedSections.length === 0) return;

    safelyUpdateSections((prev) =>
      prev.map((s) => (s.status === 'error' ? { ...s, status: 'pending' as SectionStatus } : s))
    );

    const { stopped, successCount, errorCount, notFoundCount, noCredits } = await runGenerationLoop(failedSections);

    if (noCredits) return;
    if (stopped) {
      if (successCount > 0 || notFoundCount > 0) safelySetDoneState(true);
      toast.info(successCount > 0
        ? `Retry stopped — ${successCount} section${successCount > 1 ? 's' : ''} extracted successfully.`
        : 'Retry stopped — no sections were extracted.');
    } else {
      safelySetDoneState(true);
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Retry succeeded for ${successCount} section${successCount > 1 ? 's' : ''}.`);
      } else if (successCount > 0) {
        toast.warning(`Retried: ${successCount} succeeded, ${errorCount} still failing${notFoundCount > 0 ? `, ${notFoundCount} not in document` : ''}.`);
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleClose = () => {
    abortControllerRef.current?.abort();
    onOpenChange(false);
  };

  const handleBack = () => {
    abortControllerRef.current?.abort();
    onOpenChange(false);
    onBack?.();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
      return;
    }
    onOpenChange(true);
  };

  const generatedCount = sections.filter((s) => s.status === 'done').length;
  const failedCount = sections.filter((s) => s.status === 'error').length;
  const notFoundCount = sections.filter((s) => s.status === 'not_found').length;
  const approvedCount = sections.filter((s) => s.status === 'done' && s.approved).length;

  const canGenerate = pendingSelectedCount > 0 && extractionState === 'ready' && googleVertexAvailable;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleDialogOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" style={{ zIndex: 1400 }} />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] max-h-[85vh] overflow-y-auto gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ zIndex: 1401 }}
        >
          {/* Header */}
          <div className="flex flex-col space-y-1.5 text-left mb-4">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={handleBack}
                  aria-label="Back"
                  className="h-7 w-7 -ml-1 inline-flex items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Auto-Fill from Uploaded .docx
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Upload a Word document. AI extracts each selected section's content directly from the document. Sections not present in the file are skipped.
            </DialogPrimitive.Description>
          </div>

          <DialogPrimitive.Close onClick={handleClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Hidden file input — auto-clicked when the dialog opens */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileChosen(f);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />

          <div className="space-y-4">
            {/* Vertex AI not configured alert */}
            {!isKeyStatusLoading && !googleVertexAvailable && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Google Vertex AI not configured</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Auto-Fill requires a Google Vertex AI service account key. Please ask your administrator to add a <strong>google_vertex</strong> key in Settings &gt; API Keys.
                  </p>
                </div>
              </div>
            )}

            {/* Reference Document (uploaded .docx) */}
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Reference Documents as Context
              </h3>
              {!uploadedFile ? (
                <div className="border border-dashed rounded-lg p-4 flex items-center justify-between gap-3 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Upload a .docx file. It will be converted to PDF and used as the source for AI extraction.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              ) : extractionState === 'error' ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-destructive">
                      Couldn't read this file
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Please make sure it's a valid Word (.docx) document and try uploading again.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReplaceFile}
                    disabled={isGenerating}
                    className="shrink-0"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload .docx
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-2 space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded text-sm">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate flex-1">{uploadedFile.name}</span>
                    {extractionState === 'extracting' && (
                      <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading…
                      </span>
                    )}
                    {extractionState === 'ready' && (
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-green-100 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:text-green-300">
                        <CheckCircle2 className="w-3 h-3" />
                        {extractionInfo || 'Ready'}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={handleReplaceFile}
                      disabled={isGenerating || extractionState === 'extracting'}
                    >
                      Replace
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              AI will locate each selected section inside the uploaded document and extract its existing content. Sections not present in the document are skipped.
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
                disabled={isGenerating}
                className="text-xs h-7 px-2"
              >
                {sections.every((s) => s.selected) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Section List */}
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
                    <Checkbox
                      checked={section.selected}
                      onCheckedChange={() => toggleSection(section.id)}
                      disabled={isGenerating}
                    />

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

                      {(section.status === 'done' || section.status === 'not_found') && (
                        <button
                          onClick={() => handleRetrySection(section.id)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Re-extract this section from the uploaded document"
                          disabled={isGenerating || extractionState !== 'ready'}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

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

                      {section.status === 'generating' && (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      )}
                      {section.status === 'error' && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      {section.status === 'not_found' && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <MinusCircle className="w-4 h-4" />
                          Not in document
                        </span>
                      )}
                    </div>
                  </div>

                  {expandedSectionId === section.id && section.status === 'done' && section.generatedContent && (
                    <div className="px-4 pb-3 pt-1">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Generated Content Preview
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs px-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => handleRetrySection(section.id)}
                              disabled={isGenerating || extractionState !== 'ready'}
                              title="Re-extract this section"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry extraction
                            </Button>
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

            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  Extracting <strong>{currentGeneratingTitle}</strong>... Please wait.
                </span>
              </div>
            )}

            {isDone && (generatedCount > 0 || notFoundCount > 0) && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {approvedCount} of {generatedCount} extracted sections approved
                  {notFoundCount > 0 && (
                    <span className="ml-2 text-amber-700 dark:text-amber-400">
                      · {notFoundCount} not in document
                    </span>
                  )}
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

            <div>
              <label className="text-sm font-semibold text-gray-700">Additional instructions (optional)</label>
              <Textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                disabled={isGenerating}
                rows={3}
                className="mt-1.5 text-sm bg-blue-50/50 border-blue-100 focus:border-blue-300 resize-y"
                placeholder="Add specific instructions for the AI generation..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {isGenerating ? (
                <Button
                  onClick={handleStopGeneration}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Stop Extracting
                </Button>
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
                  {pendingSelectedCount > 0 && (
                    <Button
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Extract from .docx ({pendingSelectedCount})
                    </Button>
                  )}
                  {(isDone || generatedCount > 0) && (
                    <Button
                      onClick={handleApplyAll}
                      disabled={approvedCount === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Apply Approved ({approvedCount})
                    </Button>
                  )}
                  {!isDone && generatedCount === 0 && pendingSelectedCount === 0 && (
                    <Button
                      onClick={handleGenerate}
                      disabled
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Extract from .docx (0)
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
