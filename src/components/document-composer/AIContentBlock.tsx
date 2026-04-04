import React, { useState } from 'react';
import { Bot, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentContent } from '@/types/documentComposer';
import { HighlightedContent } from './HighlightedContent';
import { AIPromptDialog } from './AIPromptDialog';
import { AIChangeTrackingService } from '@/services/aiChangeTrackingService';
import { AIContentRecommendationService, ContentRecommendation } from '@/services/aiContentRecommendationService';
import { useCompanyRole } from '@/context/CompanyRoleContext';
import { toast } from 'sonner';

interface AIContentBlockProps {
  content: DocumentContent;
  className?: string;
  sectionTitle?: string;
  onContentUpdate?: (contentId: string, newContent: string) => void;
}

export function AIContentBlock({ content, className = '', sectionTitle, onContentUpdate }: AIContentBlockProps) {
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { activeCompanyRole } = useCompanyRole();
  
  // Check if this is an AI prompt that needs user input
  const isAIPrompt = content.content.includes('[AI_PROMPT_NEEDED:');
  
  const handlePromptResponse = async (response: string) => {
    if (!activeCompanyRole?.companyId) {
      toast.error('Company information not available');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate AI content based on user response - create a mock recommendation object
      const mockRecommendation: ContentRecommendation = {
        id: `prompt-${content.id}`,
        title: 'AI Content Generation',
        description: response,
        sectionTitle: sectionTitle || 'Content', 
        priority: 'important',
        recommendationType: 'missing_content',
        contentSnippet: content.content.replace(/\[AI_PROMPT_NEEDED:\s*/, '').replace(/\]$/, ''),
        metadata: {
          confidence: 0.8,
          relevanceScore: 0.9,
          gapType: 'missing_requirement'
        }
      };
      
      const aiContent = await AIContentRecommendationService.generateContentForRecommendation(
        mockRecommendation,
        { name: activeCompanyRole.companyName || 'Company' },
        activeCompanyRole.companyId
      );

      if (aiContent && aiContent.trim()) {
        // Track the AI change for highlighting
        AIChangeTrackingService.trackChange(
          content.id,
          content.content,
          aiContent,
          'ai-generated',
          'AI Content Generation'
        );

        // Update content with AI-generated text and highlighting
        const highlightedContent = AIChangeTrackingService.markAsAIGenerated(aiContent);
        
        
        if (onContentUpdate) {
          onContentUpdate(content.id, highlightedContent);
        }

        toast.success('AI content generated successfully!', {
          description: 'The content has been added inline and highlighted'
        });
      } else {
        toast.error('Failed to generate content - empty response');
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast.error('Failed to generate AI content');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle AI prompts differently
  if (isAIPrompt) {
    return (
      <>
        <div className={`relative group ${className}`}>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 mb-1">AI Input Needed</h4>
                <p className="text-amber-700 text-sm leading-relaxed">
                  {content.content.replace(/\[AI_PROMPT_NEEDED:\s*/, '').replace(/\]$/, '')}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsPromptDialogOpen(true)}
                disabled={isGenerating}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                {isGenerating ? 'Generating...' : 'Provide Info'}
              </Button>
            </div>
          </div>
        </div>
        
        <AIPromptDialog
          isOpen={isPromptDialogOpen}
          onClose={() => setIsPromptDialogOpen(false)}
          onSubmit={handlePromptResponse}
          prompt={content.content}
          sectionTitle={sectionTitle}
        />
      </>
    );
  }

  const isAIGenerated = content.isAIGenerated || content.metadata?.aiUsed || AIChangeTrackingService.isAIModified(content.id);
  const companyDataUsed = content.metadata?.companyDataUsed;

  if (!isAIGenerated) {
    return (
      <div className={`${className}`}>
        <HighlightedContent 
          content={content.content} 
          contentId={content.id}
          isHighlighted={content.metadata?.isHighlighted}
          dataSource={content.metadata?.dataSource}
          aiUsed={content.metadata?.aiUsed}
          companyDataUsed={companyDataUsed}
          onAIGenerate={(prompt) => {
            // Handle AI generation request for non-AI content
            handlePromptResponse(prompt);
          }}
        />
      </div>
    );
  }

  const sourcesTooltipContent = (
    <Card className="w-80 border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          AI Sources ({content.aiSources?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {content.aiSources?.map((source) => (
          <div key={source.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{source.title}</h4>
                <Badge 
                  variant="outline" 
                  className="text-xs mt-1"
                >
                  {source.type.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(source.relevanceScore * 100)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {source.excerpt}
            </p>
            {source.url && (
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
        {content.metadata && (
          <div className="pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              Confidence: {Math.round((content.metadata.confidence || 0) * 100)}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={`relative group ${className}`}>
      <HighlightedContent 
        content={content.content}
        contentId={content.id}
        isHighlighted={true}
        aiUsed={isAIGenerated}
        companyDataUsed={companyDataUsed}
        dataSource={content.metadata?.dataSource}
        onAIGenerate={(prompt) => {
          // Handle AI generation request from HighlightedContent
          handlePromptResponse(prompt);
        }}
      />
      
      {/* AI indicator for generated content */}
      {content.aiSources && content.aiSources.length > 0 && (
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-help">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              align="start"
              className="p-0 bg-transparent border-0 shadow-none"
            >
              {sourcesTooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}