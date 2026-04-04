import React, { useState } from 'react';
import { Sparkles, Zap, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { AIContentRecommendationService } from '@/services/aiContentRecommendationService';
import { toast } from 'sonner';

interface EmptySectionPromptProps {
  sectionTitle: string;
  sectionId: string;
  contentId: string;
  companyId?: string;
  onContentUpdate: (contentId: string, newContent: string) => void;
  onOpenAutoFill?: () => void;
}

export function EmptySectionPrompt({
  sectionTitle,
  sectionId,
  contentId,
  companyId,
  onContentUpdate,
  onOpenAutoFill,
}: EmptySectionPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (customPrompt?: string) => {
    if (!companyId) {
      toast.error('Company information not available');
      return;
    }

    setIsGenerating(true);
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('name, country, industry')
        .eq('id', companyId)
        .single();

      const promptText = customPrompt || `Generate comprehensive content for the "${sectionTitle}" section`;

      const aiContent = await AIContentRecommendationService.generateContentForRecommendation(
        {
          id: `section-${sectionId}`,
          title: `Generate content for ${sectionTitle}`,
          description: promptText,
          sectionTitle: sectionTitle,
          priority: 'important' as const,
          recommendationType: 'missing_content' as const,
          bracketSuggestion: `[AI_PROMPT: ${promptText}]`,
        },
        company || {},
        companyId
      );

      if (aiContent) {
        onContentUpdate(contentId, aiContent);
        toast.success(`Content generated for ${sectionTitle}`);
      } else {
        toast.error('AI generation returned no content');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border border-dashed border-border rounded-lg p-6 bg-muted/30">
      <div className="text-center mb-4">
        <Sparkles className="w-5 h-5 mx-auto mb-2 text-primary opacity-70" />
        <p className="text-sm text-muted-foreground">This section is empty</p>
      </div>

      <Textarea
        placeholder={`Describe what you want in this section... (e.g. "Write a purpose statement for our Class IIa cardiac monitoring device")`}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="mb-3 min-h-[72px] text-sm resize-none"
        disabled={isGenerating}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleGenerate(prompt || undefined)}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          )}
          {prompt.trim() ? 'Generate with Prompt' : 'Quick Generate'}
        </Button>

        {prompt.trim() && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate()}
            disabled={isGenerating}
          >
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Quick AI
          </Button>
        )}

        {onOpenAutoFill && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenAutoFill}
            disabled={isGenerating}
            className="ml-auto text-xs text-muted-foreground"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
            AI Auto-Fill All Sections
          </Button>
        )}
      </div>
    </div>
  );
}
