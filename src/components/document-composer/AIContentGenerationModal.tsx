import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, Lightbulb, FileText, Check, X, BookOpen, Shield, Pencil, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useReferenceDocuments } from '@/hooks/useReferenceDocuments';
import { ReferenceDocumentService } from '@/services/referenceDocumentService';
import { useAdvisoryContext } from '@/hooks/useAdvisoryContext';
import { useDocumentNumberingContext } from '@/hooks/useDocumentNumberingContext';
import { Checkbox } from '@/components/ui/checkbox';

const ALWAYS_PRECHECK = ['ISO 13485', 'ISO 14971', 'IEC 62366'];

interface AIContentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  currentContent: string;
  onContentGenerated: (newContent: string) => void;
  setShowAIModal: (show: boolean) => void;
  companyId?: string;
  documentId?: string | null;
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: React.ReactNode;
}

export function AIContentGenerationModal({
  isOpen,
  onClose,
  sectionTitle,
  currentContent,
  onContentGenerated,
  setShowAIModal,
  companyId,
  documentId
}: AIContentGenerationModalProps) {
  const { data: advisoryContext } = useAdvisoryContext(companyId, isOpen);
  const numberingContext = useDocumentNumberingContext(documentId, companyId);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showStreaming, setShowStreaming] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [selectedRefDocIds, setSelectedRefDocIds] = useState<string[]>([]);
  const [selectedStandardIds, setSelectedStandardIds] = useState<Set<string>>(new Set());
  const [standardsInitialized, setStandardsInitialized] = useState(false);
  const [mode, setMode] = useState<'generate' | 'edit'>(() => currentContent?.trim() ? 'edit' : 'generate');

  // Sync mode when currentContent changes (e.g. switching sections)
  React.useEffect(() => {
    setMode(currentContent?.trim() ? 'edit' : 'generate');
  }, [currentContent]);
  const { documents: refDocuments } = useReferenceDocuments(companyId);

  // Standards query
  const { data: standards = [] } = useQuery({
    queryKey: ['ai-section-standards', companyId],
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
        if (!seen.has(fw)) { seen.add(fw); results.push({ id, framework: fw, name }); }
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

  React.useEffect(() => {
    if (standards.length > 0 && !standardsInitialized) {
      const preChecked = new Set<string>();
      standards.forEach((s) => {
        const normalized = s.framework.replace(/_/g, ' ');
        if (ALWAYS_PRECHECK.some((p) => normalized.includes(p))) preChecked.add(s.id);
      });
      setSelectedStandardIds(preChecked);
      setStandardsInitialized(true);
    }
  }, [standards, standardsInitialized]);

  const toggleRefDoc = (id: string) => {
    setSelectedRefDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Section-aware AI Content Suggestions
  const suggestions: AISuggestion[] = useMemo(() => {
    const lower = (sectionTitle || '').toLowerCase();

    const useRefSuggestion: AISuggestion | null = selectedRefDocIds.length > 0 ? {
      id: 'use-references',
      title: 'Use References',
      description: `Generate content grounded in ${selectedRefDocIds.length} selected reference document(s)`,
      prompt: `Generate content for the "${sectionTitle}" section based on the selected reference documents. Extract relevant information, adapt terminology, and structure the content according to medical device documentation standards.`,
      icon: <BookOpen className="w-4 h-4" />,
    } : null;

    const prepend = (list: AISuggestion[]) => useRefSuggestion ? [useRefSuggestion, ...list] : list;

    if (lower.includes('risk')) return prepend([
      { id: 'risk-matrix', title: 'Create Risk Assessment Matrix', description: 'Generate a risk assessment matrix with severity and probability criteria', prompt: `Create a detailed risk assessment matrix for the "${sectionTitle}" section, including severity levels, probability ratings, and risk priority numbers per ISO 14971.`, icon: <Wand2 className="w-4 h-4" /> },
      { id: 'risk-severity', title: 'Define Severity Criteria', description: 'Establish severity classification criteria for identified hazards', prompt: `Define severity classification criteria for the "${sectionTitle}" section aligned with ISO 14971 and IEC 62304 for medical devices.`, icon: <FileText className="w-4 h-4" /> },
      { id: 'risk-mitigation', title: 'Add Mitigation Strategies', description: 'Generate risk mitigation and control measures', prompt: `Add comprehensive risk mitigation strategies and control measures for the "${sectionTitle}" section, including design controls and process controls.`, icon: <Lightbulb className="w-4 h-4" /> },
      { id: 'risk-pms', title: 'Include Post-Market Surveillance', description: 'Add post-market risk monitoring requirements', prompt: `Include post-market surveillance and risk monitoring requirements for the "${sectionTitle}" section per MDR/IVDR and FDA requirements.`, icon: <Sparkles className="w-4 h-4" /> },
    ]);

    if (lower.includes('purpose') || lower.includes('objective')) return prepend([
      { id: 'purpose-statement', title: 'Write Purpose Statement', description: 'Generate a clear and professional purpose statement', prompt: `Write a comprehensive purpose statement for the "${sectionTitle}" section aligned with medical device regulatory standards.`, icon: <FileText className="w-4 h-4" /> },
      { id: 'purpose-regulatory', title: 'Add Regulatory Context', description: 'Include applicable regulatory framework and standards', prompt: `Add regulatory context to the "${sectionTitle}" section, referencing applicable standards (ISO 13485, FDA 21 CFR 820, MDR).`, icon: <Sparkles className="w-4 h-4" /> },
      { id: 'purpose-objectives', title: 'Define Objectives', description: 'Outline specific, measurable objectives', prompt: `Define specific measurable objectives for the "${sectionTitle}" section with clear success criteria.`, icon: <Lightbulb className="w-4 h-4" /> },
    ]);

    if (lower.includes('scope')) return prepend([
      { id: 'scope-boundaries', title: 'Define Boundaries', description: 'Clearly define what is in and out of scope', prompt: `Define clear boundaries for the "${sectionTitle}" section, specifying inclusions and exclusions for this document.`, icon: <FileText className="w-4 h-4" /> },
      { id: 'scope-exclusions', title: 'Add Exclusions', description: 'Specify what is explicitly out of scope', prompt: `Add explicit exclusions and limitations for the "${sectionTitle}" section.`, icon: <Lightbulb className="w-4 h-4" /> },
      { id: 'scope-applications', title: 'Specify Applications', description: 'List applicable products, processes, or departments', prompt: `Specify the applicable products, processes, departments, and markets for the "${sectionTitle}" section.`, icon: <Wand2 className="w-4 h-4" /> },
    ]);

    if (lower.includes('reference') || lower.includes('standard')) return prepend([
      { id: 'ref-standards', title: 'List Applicable Standards', description: 'Add relevant ISO, IEC, and regulatory standards', prompt: `List all applicable regulatory standards and guidelines for the "${sectionTitle}" section (ISO 13485, ISO 14971, IEC 62304, FDA guidance, MDR/IVDR).`, icon: <FileText className="w-4 h-4" /> },
      { id: 'ref-regulatory', title: 'Add Regulatory References', description: 'Include FDA, EU MDR, and other regulatory references', prompt: `Add regulatory references for the "${sectionTitle}" section including FDA 21 CFR Part 820, EU MDR 2017/745, and relevant guidance documents.`, icon: <Sparkles className="w-4 h-4" /> },
      { id: 'ref-sops', title: 'Include Internal SOPs', description: 'Reference related internal procedures and work instructions', prompt: `Suggest internal SOP and work instruction references that should be linked in the "${sectionTitle}" section.`, icon: <Lightbulb className="w-4 h-4" /> },
    ]);

    if (lower.includes('procedure') || lower.includes('process') || lower.includes('method')) return prepend([
      { id: 'proc-steps', title: 'Generate Step-by-Step Instructions', description: 'Create detailed procedural steps', prompt: `Generate detailed step-by-step procedural instructions for the "${sectionTitle}" section with responsible roles and expected outputs.`, icon: <Wand2 className="w-4 h-4" /> },
      { id: 'proc-verification', title: 'Add Verification Steps', description: 'Include verification and validation checkpoints', prompt: `Add verification and validation checkpoints to the "${sectionTitle}" section with acceptance criteria.`, icon: <Lightbulb className="w-4 h-4" /> },
      { id: 'proc-acceptance', title: 'Include Acceptance Criteria', description: 'Define pass/fail criteria for each step', prompt: `Include clear acceptance criteria and pass/fail conditions for the "${sectionTitle}" section.`, icon: <FileText className="w-4 h-4" /> },
    ]);

    if (lower.includes('quality') || lower.includes('qc') || lower.includes('inspection')) return prepend([
      { id: 'qc-checkpoints', title: 'Define QC Checkpoints', description: 'Establish quality control checkpoints and frequency', prompt: `Define quality control checkpoints, inspection frequency, and responsible roles for the "${sectionTitle}" section.`, icon: <Wand2 className="w-4 h-4" /> },
      { id: 'qc-acceptance', title: 'Add Acceptance Criteria', description: 'Specify quantitative and qualitative acceptance criteria', prompt: `Add measurable acceptance criteria for the "${sectionTitle}" section with tolerances and limits.`, icon: <FileText className="w-4 h-4" /> },
      { id: 'qc-sampling', title: 'Include Sampling Plans', description: 'Define sampling methodology and AQL levels', prompt: `Include sampling plans with AQL levels and statistical rationale for the "${sectionTitle}" section per ISO 2859-1.`, icon: <Lightbulb className="w-4 h-4" /> },
    ]);

    if (lower.includes('design') || lower.includes('development')) return prepend([
      { id: 'design-inputs', title: 'Define Design Inputs', description: 'Specify design input requirements and sources', prompt: `Define design inputs for the "${sectionTitle}" section including user needs, regulatory requirements, and performance specifications.`, icon: <FileText className="w-4 h-4" /> },
      { id: 'design-outputs', title: 'Specify Design Outputs', description: 'List expected design outputs and deliverables', prompt: `Specify design outputs and deliverables for the "${sectionTitle}" section with traceability to design inputs.`, icon: <Wand2 className="w-4 h-4" /> },
      { id: 'design-review', title: 'Add Design Review Criteria', description: 'Include design review milestones and criteria', prompt: `Add design review milestones and evaluation criteria for the "${sectionTitle}" section per ISO 13485 clause 7.3.`, icon: <Sparkles className="w-4 h-4" /> },
    ]);

    if (lower.includes('validation') || lower.includes('verification') || lower.includes('testing')) return prepend([
      { id: 'val-protocol', title: 'Generate Test Protocol', description: 'Create a structured validation/verification protocol', prompt: `Generate a structured test protocol for the "${sectionTitle}" section with test cases, expected results, and pass/fail criteria.`, icon: <Wand2 className="w-4 h-4" /> },
      { id: 'val-acceptance', title: 'Define Acceptance Criteria', description: 'Set clear pass/fail acceptance criteria', prompt: `Define acceptance criteria for the "${sectionTitle}" section with statistical justification where applicable.`, icon: <FileText className="w-4 h-4" /> },
      { id: 'val-traceability', title: 'Add Traceability', description: 'Link tests to requirements and specifications', prompt: `Add traceability matrix elements linking test cases in the "${sectionTitle}" section to requirements and design inputs.`, icon: <Lightbulb className="w-4 h-4" /> },
    ]);

    // Generic fallback
    return prepend([
      { id: 'xyreg-sop-draft', title: 'Generate Xyreg SOP Draft', description: 'Create content describing the Xyreg digital workflow for this SOP section', prompt: `Generate SOP content for the "${sectionTitle}" section that describes the Xyreg digital workflow. Focus on: (1) how the process is managed within the Xyreg platform modules, (2) electronic signature and approval workflows, (3) automated audit trails and notifications, (4) dashboard-based monitoring and metrics, (5) integration with other Xyreg modules (CAPA, complaints, training, etc.). Write for a medical device QMS context with references to ISO 13485, FDA 21 CFR 820, and EU MDR where applicable. Use active voice and clear procedural steps.`, icon: <Sparkles className="w-4 h-4" /> },
      { id: 'gen-draft', title: 'Generate Draft Content', description: 'Create initial draft content for this section', prompt: `Generate comprehensive draft content for the "${sectionTitle}" section following medical device industry best practices and regulatory standards.`, icon: <Wand2 className="w-4 h-4" /> },
      { id: 'gen-compliance', title: 'Add Compliance Elements', description: 'Include regulatory compliance requirements', prompt: `Add compliance elements to the "${sectionTitle}" section referencing ISO 13485, FDA 21 CFR Part 820, and EU MDR requirements.`, icon: <Sparkles className="w-4 h-4" /> },
      { id: 'gen-expand', title: 'Expand Detail', description: 'Add more detail and specificity to existing content', prompt: `Expand the "${sectionTitle}" section with more detailed and specific content aligned with medical device documentation standards.`, icon: <Lightbulb className="w-4 h-4" /> },
      { id: 'gen-structure', title: 'Improve Structure', description: 'Reorganize and improve document structure', prompt: `Improve the structure and organization of the "${sectionTitle}" section with clear headings, numbered lists, and logical flow.`, icon: <FileText className="w-4 h-4" /> },
    ]);
  }, [sectionTitle, selectedRefDocIds]);

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    setSelectedSuggestion(suggestion.id);
    setCustomPrompt(suggestion.prompt);
  };

  const handleAccept = () => {
    if (generatedContent) {
      setIsAccepted(true);
      setIsRejected(false);
      onContentGenerated(generatedContent);
      toast.success('AI content accepted and applied!');
      setTimeout(() => {
        onClose();
      }, 1000);
      setShowAIModal(false);
      setGeneratedContent("")
      setShowStreaming(false);
      setIsGenerating(false);
      setIsAccepted(false);
      setIsRejected(false);
      setCustomPrompt("");
      setSelectedSuggestion(null);
    }
  };

  const handleReject = () => {
    setIsRejected(true);
    setIsAccepted(false);
    setGeneratedContent('');
    setShowStreaming(false);
    toast.info('AI content rejected. You can generate new content or close the modal.');
  };

  const handleGenerateContent = async () => {
    if (!customPrompt.trim()) {
      toast.error('Please enter a prompt or select a suggestion');
      return;
    }

    setIsGenerating(true);
    setShowStreaming(true);
    setGeneratedContent('');

    try {
      // Fetch text content from selected reference documents
      let referenceContext = '';
      if (selectedRefDocIds.length > 0) {
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
              // For binary files, include metadata only
              textParts.push(`[${doc.file_name}] (Binary file - ${doc.file_type || ext} - metadata only)`);
            }
          } catch (e) {
            console.warn(`Failed to fetch reference doc ${doc.file_name}:`, e);
            textParts.push(`[${doc.file_name}] (Could not fetch content)`);
          }
        }
        referenceContext = textParts.join('\n\n');
      }

      // Include selected standards in prompt
      let enhancedPrompt = customPrompt;
      const selectedStds = standards.filter((s) => selectedStandardIds.has(s.id));
      if (selectedStds.length > 0) {
        enhancedPrompt += `\n\nEnsure compliance with the following standards and regulations: ${selectedStds.map((s) => s.name || s.framework).join(', ')}.`;
      }

      // Append company system context (settings, prefixes, products) to reference context
      let fullReferenceContext = referenceContext || '';
      if (advisoryContext) {
        fullReferenceContext = fullReferenceContext ? `${fullReferenceContext}\n\n${advisoryContext}` : advisoryContext;
      }
      if (numberingContext) {
        fullReferenceContext = fullReferenceContext ? `${fullReferenceContext}\n\n${numberingContext}` : numberingContext;
      }

      // Call the AI content generator edge function
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          prompt: enhancedPrompt,
          sectionTitle,
          currentContent: mode === 'edit' ? currentContent : undefined,
          mode,
          referenceContext: fullReferenceContext || undefined,
        }
      });

      if (error) {
        console.error('[AIContentGenerationModal] Edge function error:', error);
        throw error;
      }

      if (!data?.success || !data?.content) {
        throw new Error(data?.error || 'Failed to generate content');
      }

      const fullGeneratedContent = data.content;
      // Simulate streaming effect for better UX
      let currentIndex = 0;
      const streamInterval = setInterval(() => {
        if (currentIndex < fullGeneratedContent.length) {
          setGeneratedContent(fullGeneratedContent.slice(0, currentIndex + 1));
          currentIndex += Math.max(1, Math.floor(Math.random() * 5)); // Variable speed
        } else {
          clearInterval(streamInterval);
          setIsGenerating(false);
          setShowStreaming(false);

          // Don't auto-apply content, wait for user to accept/reject
          toast.success('AI content generated! Please review and accept or reject.');
        }
      }, 20); // 20ms delay for smooth streaming

    } catch (error) {
      console.error('[AIContentGenerationModal] Error generating AI content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI content';
      toast.error(errorMessage);
      setIsGenerating(false);
      setShowStreaming(false);
    }
  };
  const handleClose = () => {
    setShowAIModal(false);
    setGeneratedContent("")
    setShowStreaming(false);
    setIsGenerating(false);
    setIsAccepted(false);
    setIsRejected(false);
    setCustomPrompt("");
    setSelectedSuggestion(null);
    setSelectedRefDocIds([]);
    setStandardsInitialized(false);
    setSelectedStandardIds(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="z-[1400] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI Content Generation - {sectionTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            <Button
              size="sm"
              variant={mode === 'generate' ? 'default' : 'ghost'}
              className="flex-1 gap-1.5"
              onClick={() => setMode('generate')}
              disabled={isGenerating}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate New
            </Button>
            <Button
              size="sm"
              variant={mode === 'edit' ? 'default' : 'ghost'}
              className="flex-1 gap-1.5"
              onClick={() => setMode('edit')}
              disabled={isGenerating || !currentContent?.trim()}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Existing
            </Button>
          </div>

          {/* Quick edit chips (edit mode only) */}
          {mode === 'edit' && currentContent?.trim() && (
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Add detail', prompt: `Add more detail and specificity to the "${sectionTitle}" section. Expand on key points while preserving the existing structure.` },
                { label: 'Fix grammar', prompt: `Fix grammar, spelling, and punctuation in the "${sectionTitle}" section. Preserve all content and meaning.` },
                { label: 'Add compliance reference', prompt: `Add relevant regulatory compliance references (ISO 13485, FDA 21 CFR 820, EU MDR) to the "${sectionTitle}" section where appropriate.` },
                { label: 'Simplify language', prompt: `Simplify the language in the "${sectionTitle}" section. Make it clearer and more concise while preserving technical accuracy.` },
              ].map((chip) => (
                <Badge
                  key={chip.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors text-xs py-1 px-2"
                  onClick={() => { setCustomPrompt(chip.prompt); setSelectedSuggestion(null); }}
                >
                  {chip.label}
                </Badge>
              ))}
            </div>
          )}

          {/* AI Input Sources Indicator */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              AI Input Sources
            </h4>
            <div className="divide-y divide-border rounded-md border bg-muted/20">
              <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                <span className="font-medium">Section</span>
                <span className="text-muted-foreground truncate">{sectionTitle}</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                {mode === 'edit' && currentContent?.trim() ? (
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium">Existing Content</span>
                <span className="text-muted-foreground truncate">
                  {mode === 'edit' && currentContent?.trim() ? `${currentContent.substring(0, 60)}...` : 'Not used (Generate New mode)'}
                </span>
              </div>
              {selectedRefDocIds.length > 0 && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="font-medium">Reference Docs</span>
                  <span className="text-muted-foreground">{selectedRefDocIds.length} document(s)</span>
                </div>
              )}
              {selectedStandardIds.size > 0 && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
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
              <div className="border rounded-lg max-h-[120px] overflow-y-auto p-2 space-y-1">
                {standards.map((std) => (
                  <label key={std.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
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
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Reference Documents as Context
              </h3>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">
                  Select documents to ground AI output in your company's actual content (text-based files: .txt, .md, .csv, .json, .xml, .html)
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

          {/* Current Content Display */}
          <div className="bg-gray-50 p-4 rounded-lg h-[200px] overflow-y-auto">
            <h3 className="font-semibold text-gray-700 mb-2">Current Content:</h3>
            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
              {currentContent || 'No content available for this section'}
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">AI Content Suggestions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedSuggestion === suggestion.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Custom AI Prompt:</h3>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter your custom prompt for AI content generation or modify the current content above..."
              className="min-h-[100px]"
              disabled={isGenerating}
            />
          </div>

          {/* Streaming Preview */}
          {showStreaming && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>AI Content Generating...</span>
              </div>
              <div className="text-sm text-green-700 bg-white p-3 rounded border min-h-[100px] max-h-[200px] overflow-y-auto">
                <div
                  className="prose prose-sm max-w-none prose-blue prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: generatedContent }}
                />
                {isGenerating && <span className="animate-pulse">|</span>}
              </div>
            </div>
          )}

          {/* Generated Content Review */}
          {generatedContent && !showStreaming && !isGenerating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Generated Content - Review & Decide</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={handleAccept}
                    disabled={isAccepted || isRejected}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                    onClick={handleReject}
                    disabled={isAccepted || isRejected}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
              <div className="text-sm text-blue-700 bg-white p-3 rounded border min-h-[100px] max-h-[200px] overflow-y-auto">
                <div
                  className="prose prose-sm max-w-none prose-blue prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: generatedContent }}
                />
              </div>
              {isAccepted && (
                <div className="mt-2 text-sm text-green-600 font-medium">
                  ✓ Content accepted and applied to section
                </div>
              )}
              {isRejected && (
                <div className="mt-2 text-sm text-red-600 font-medium">
                  ✗ Content rejected. You can generate new content.
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {!generatedContent || isRejected ? (
              <Button
                onClick={handleGenerateContent}
                disabled={isGenerating || !customPrompt.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                    Streaming...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate AI Content
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
