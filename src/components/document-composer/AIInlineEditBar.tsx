import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wand2, X, Maximize2, Loader2, Check, RotateCcw, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIInlineEditBarProps {
  sectionTitle: string;
  currentContent: string;
  companyId?: string;
  onContentGenerated: (content: string) => void;
  onClose: () => void;
  onOpenFullModal: () => void;
  mode?: 'edit' | 'review';
}

const EDIT_CHIPS = [
  { label: 'Add detail', instruction: 'Add more detail and depth to the existing content' },
  { label: 'Fix grammar', instruction: 'Fix grammar and improve readability while keeping the meaning' },
  { label: 'Add compliance ref', instruction: 'Add relevant regulatory/compliance references and citations' },
  { label: 'Simplify', instruction: 'Simplify the language while keeping technical accuracy' },
];

const REVIEW_CHIPS = [
  { label: 'Is this complete?', instruction: 'Review the following document content and identify if anything important is missing or incomplete. List any gaps.' },
  { label: 'Check compliance', instruction: 'Review the following document content for regulatory compliance. Identify any issues with ISO 13485, FDA 21 CFR Part 820, or MDR requirements.' },
  { label: "What's missing?", instruction: 'Analyze the following document content and list specific elements, sections, or details that are missing or should be added.' },
  { label: 'Is this good enough?', instruction: 'Evaluate the quality and completeness of the following document content. Provide honest, actionable feedback on its strengths and weaknesses.' },
];

export function AIInlineEditBar({
  sectionTitle,
  currentContent,
  companyId,
  onContentGenerated,
  onClose,
  onOpenFullModal,
  mode: initialMode = 'edit',
}: AIInlineEditBarProps) {
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultIsReview, setResultIsReview] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleGenerate = async (prompt: string, isReviewQuery: boolean = false) => {
    if (!prompt.trim() || isGenerating) return;

    // Cancel any previous request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setResult(null);
    setResultIsReview(isReviewQuery);

    try {
      const requestMode = isReviewQuery ? 'review' : 'edit';
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          prompt: isReviewQuery ? prompt : `Edit instruction: ${prompt}`,
          sectionTitle,
          currentContent: currentContent?.slice(0, 8000) || '',
          mode: requestMode,
        },
      });

      // If aborted, silently return
      if (controller.signal.aborted) return;

      if (error) throw error;
      if (!data?.success || !data?.content) {
        throw new Error(data?.error || 'Failed to generate content');
      }
      setResult(data.content);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      toast.error('AI generation failed', { description: err.message });
    } finally {
      if (!controller.signal.aborted) {
        setIsGenerating(false);
      }
    }
  };

  const handleAccept = () => {
    if (result) {
      onContentGenerated(result);
      onClose();
    }
  };

  const handleChipClick = (chipInstruction: string, isReview: boolean) => {
    setInstruction(chipInstruction);
    handleGenerate(chipInstruction, isReview);
  };

  const isReviewMode = initialMode === 'review';
  const chips = isReviewMode ? REVIEW_CHIPS : EDIT_CHIPS;

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
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={onOpenFullModal}>
              <Maximize2 className="w-3 h-3 mr-1" />
              Full editor
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1">
        {chips.map((chip) => (
          <Badge
            key={chip.label}
            variant="outline"
            className={`text-xs transition-colors ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-100 hover:border-amber-300'}`}
            onClick={() => !isGenerating && handleChipClick(chip.instruction, isReviewMode)}
          >
            {chip.label}
          </Badge>
        ))}
      </div>

      {/* Input + Generate */}
      <div className="flex gap-2">
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={isReviewMode ? 'Ask a question about this document...' : 'e.g. Add a paragraph about risk controls...'}
          className="text-sm h-8"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate(instruction, isReviewMode)}
          disabled={isGenerating}
        />
        <Button
          size="sm"
          className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => handleGenerate(instruction, isReviewMode)}
          disabled={isGenerating || !instruction.trim()}
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Result preview */}
      {result && (
        <div className="space-y-2">
          <div className="border rounded bg-background p-3 text-sm max-h-[300px] overflow-y-auto whitespace-pre-wrap">
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
                Accept
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
