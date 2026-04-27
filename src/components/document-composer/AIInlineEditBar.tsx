import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, X, Loader2, Check, RotateCcw, MessageSquare, Plus, Replace } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdvisoryContext } from '@/hooks/useAdvisoryContext';
import { useDocumentNumberingContext } from '@/hooks/useDocumentNumberingContext';
import { toast } from 'sonner';

interface AIInlineEditBarProps {
  sectionTitle: string;
  currentContent: string;
  companyId?: string;
  documentId?: string | null;
  onContentGenerated: (content: string) => void;
  onClose: () => void;
  mode?: 'edit' | 'review';
}

type EditMode = 'append' | 'replace';

interface EditChip {
  label: string;
  instruction: string;
  editMode: EditMode;
}

const EDIT_CHIPS: EditChip[] = [
  { label: 'Add detail', instruction: 'Generate ONLY the new paragraph(s) to add. Do NOT rewrite existing content. Return only the new text to insert.', editMode: 'append' },
  { label: 'Fix grammar', instruction: 'Fix grammar and improve readability while keeping the meaning. Return the corrected full text.', editMode: 'replace' },
  { label: 'Add compliance ref', instruction: 'Generate ONLY the new compliance/regulatory references to add. Do NOT rewrite existing content. Return only the new references.', editMode: 'append' },
  { label: 'Simplify', instruction: 'Simplify the language while keeping technical accuracy. Return the simplified full text.', editMode: 'replace' },
];

const REVIEW_CHIPS = [
  { label: 'Is this complete?', instruction: 'Review the following document content and identify if anything important is missing or incomplete. List any gaps.' },
  { label: 'Check compliance', instruction: 'Review the following document content for regulatory compliance. Identify any issues with ISO 13485, FDA 21 CFR Part 820, or MDR requirements.' },
  { label: "What's missing?", instruction: 'Analyze the following document content and list specific elements, sections, or details that are missing or should be added.' },
  { label: 'Is this good enough?', instruction: 'Evaluate the quality and completeness of the following document content. Provide honest, actionable feedback on its strengths and weaknesses.' },
];

const WORD_COUNT_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: '50', label: '~50 words' },
  { value: '100', label: '~100 words' },
  { value: '200', label: '~200 words' },
  { value: '400', label: '~400 words' },
];

export function AIInlineEditBar({
  sectionTitle,
  currentContent,
  companyId,
  documentId,
  onContentGenerated,
  onClose,
  mode: initialMode = 'edit',
}: AIInlineEditBarProps) {
  const { data: advisoryContext } = useAdvisoryContext(companyId, true);
  const numberingContext = useDocumentNumberingContext(documentId, companyId);
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultIsReview, setResultIsReview] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('append');
  const [wordCount, setWordCount] = useState('auto');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleGenerate = async (prompt: string, isReviewQuery: boolean = false, forceMode?: EditMode) => {
    if (!prompt.trim() || isGenerating) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setResult(null);
    setResultIsReview(isReviewQuery);

    const activeMode = forceMode || editMode;

    try {
      const requestMode = isReviewQuery ? 'review' : 'edit';
      
      // For append mode, instruct AI to return only new content
      let editPrompt = prompt;
      if (!isReviewQuery && activeMode === 'append') {
        editPrompt = `${prompt}\n\nIMPORTANT: Return ONLY the new content to ADD. Do NOT include or rewrite the existing content. Generate only the new paragraph(s) or text to insert after the existing content.`;
      }

      // Append word count instruction if not auto
      if (wordCount !== 'auto') {
        editPrompt = `${editPrompt}\n\nLimit your response to approximately ${wordCount} words.`;
      }

      const combinedContext = [advisoryContext, numberingContext].filter(Boolean).join('\n\n') || undefined;
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          prompt: isReviewQuery ? editPrompt : `Edit instruction: ${editPrompt}`,
          sectionTitle,
          currentContent: currentContent?.slice(0, 8000) || '',
          mode: requestMode,
          referenceContext: combinedContext,
        },
      });

      if (controller.signal.aborted) return;
      if (error) throw error;
      if (!data?.success || !data?.content) {
        throw new Error(data?.error || 'Failed to generate content');
      }
      setResult(data.content);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      if (err?.message !== 'NO_CREDITS') {
        toast.error('AI generation failed', { description: err.message });
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsGenerating(false);
      }
    }
  };

  const handleAccept = () => {
    if (!result) return;
    if (editMode === 'append') {
      const separator = currentContent.trim() ? '\n\n' : '';
      onContentGenerated(currentContent + separator + result);
    } else {
      onContentGenerated(result);
    }
    onClose();
  };

  const handleChipClick = (chip: EditChip) => {
    setEditMode(chip.editMode);
    setInstruction(chip.instruction);
    handleGenerate(chip.instruction, false, chip.editMode);
  };

  const handleCustomGenerate = () => {
    handleGenerate(instruction, isReviewMode);
  };

  const isReviewMode = initialMode === 'review';

  return (
    <div className="border rounded-md bg-amber-50/50 border-amber-200 p-3 space-y-2 my-2">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
          {isReviewMode ? <MessageSquare className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
          {isReviewMode ? 'AI Review' : 'Edit with AI'}
        </div>
        <div className="flex items-center gap-1">
          {!isReviewMode && (
            <>
              <Select value={wordCount} onValueChange={setWordCount}>
                <SelectTrigger className="h-6 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORD_COUNT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center bg-muted rounded-md p-0.5 gap-0.5">
                <Button
                  variant={editMode === 'append' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setEditMode('append')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add to section
                </Button>
                <Button
                  variant={editMode === 'replace' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setEditMode('replace')}
                >
                  <Replace className="w-3 h-3 mr-1" />
                  Replace
                </Button>
              </div>
            </>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1">
        {isReviewMode ? (
          REVIEW_CHIPS.map((chip) => (
            <Badge
              key={chip.label}
              variant="outline"
              className={`text-xs transition-colors ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-100 hover:border-amber-300'}`}
              onClick={() => !isGenerating && (() => {
                setInstruction(chip.instruction);
                handleGenerate(chip.instruction, true);
              })()}
            >
              {chip.label}
            </Badge>
          ))
        ) : (
          EDIT_CHIPS.map((chip) => (
            <Badge
              key={chip.label}
              variant="outline"
              className={`text-xs transition-colors ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-100 hover:border-amber-300'}`}
              onClick={() => !isGenerating && handleChipClick(chip)}
            >
              {chip.editMode === 'append' ? <Plus className="w-3 h-3 mr-1" /> : <Replace className="w-3 h-3 mr-1" />}
              {chip.label}
            </Badge>
          ))
        )}
      </div>

      {/* Input + Generate */}
      <div className="flex gap-2">
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={isReviewMode ? 'Ask a question about this document...' : 'e.g. Add a paragraph about risk controls...'}
          className="text-sm h-8"
          onKeyDown={(e) => e.key === 'Enter' && handleCustomGenerate()}
          disabled={isGenerating}
        />
        <Button
          size="sm"
          className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white"
          onClick={handleCustomGenerate}
          disabled={isGenerating || !instruction.trim()}
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Result preview */}
      {result && (
        <div className="space-y-2">
          {/* Show context for append mode */}
          {!resultIsReview && editMode === 'append' && currentContent.trim() && (
            <div className="border rounded bg-muted/30 p-3 text-sm max-h-[120px] overflow-y-auto">
              <div className="text-xs font-medium text-muted-foreground mb-1">Existing content:</div>
              <div className="whitespace-pre-wrap text-muted-foreground text-xs line-clamp-4">
                {currentContent.replace(/<[^>]*>/g, '').slice(0, 300)}
                {currentContent.length > 300 ? '...' : ''}
              </div>
            </div>
          )}

          {/* Label */}
          {!resultIsReview && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1 h-4 rounded-full ${editMode === 'append' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-xs font-medium text-muted-foreground">
                {editMode === 'append' ? 'AI will add:' : 'AI will replace with:'}
              </span>
            </div>
          )}

          <div className={`border rounded p-3 text-sm max-h-[300px] overflow-y-auto whitespace-pre-wrap ${
            !resultIsReview && editMode === 'append' 
              ? 'bg-emerald-50/50 border-emerald-200' 
              : 'bg-background'
          }`}>
            <div dangerouslySetInnerHTML={{ __html: result }} />
          </div>

          {resultIsReview ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setResult(null)}>
                Dismiss
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleAccept}>
                <Check className="w-3 h-3 mr-1" />
                {editMode === 'append' ? 'Add to section' : 'Accept'}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setResult(null)}>
                <RotateCcw className="w-3 h-3 mr-1" />
                Discard
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
