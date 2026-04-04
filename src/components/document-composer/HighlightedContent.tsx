import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { EnhancedContentIndicator, getContentHighlighting } from './EnhancedContentIndicator';
import { InlineAISuggestion } from './InlineAISuggestion';
import { AISuggestionService } from '@/services/aiSuggestionService';
import { AIChangeTrackingService } from '@/services/aiChangeTrackingService';
import { toast } from 'sonner';

interface HighlightedContentProps {
  content: string;
  contentId: string;
  isHighlighted?: boolean;
  dataSource?: string;
  aiUsed?: boolean;
  companyDataUsed?: boolean;
  onAIGenerate?: (prompt: string) => void;
  onContentUpdate?: (contentId: string, newContent: string) => void;
  refreshTrigger?: number;
  showAIControls?: boolean; // Control whether to show AI highlighting and Accept/Reject buttons
}

export function HighlightedContent({ content, contentId, isHighlighted, dataSource, aiUsed, companyDataUsed, onAIGenerate, onContentUpdate, refreshTrigger, showAIControls = false }: HighlightedContentProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  
  // Check if this content has a pending AI suggestion
  const [pendingSuggestion, setPendingSuggestion] = useState(AISuggestionService.getPendingSuggestion(contentId));
  
  // Re-check suggestions when refreshTrigger changes
  useEffect(() => {
    const suggestion = AISuggestionService.getPendingSuggestion(contentId);
    setPendingSuggestion(suggestion);
  }, [contentId, refreshTrigger]);
  
  // Check if content was AI-modified and needs highlighting (even if HTML is missing)
  const isAIModified = AIChangeTrackingService.isAIModified(contentId);
  
  // Helper function to parse markdown to HTML
  const formatMarkdown = (text: string): string => {
    return text
      // Remove horizontal rules (---) that appear before headers or standalone
      .replace(/^---\s*$/gim, '')
      .replace(/^---\s+(?=#)/gim, '')
      // Headers (must be processed in order from most specific to least)
      .replace(/^### (.+)$/gim, '<h3 class="text-lg font-bold text-foreground mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gim, '<h2 class="text-xl font-bold text-foreground mt-6 mb-3">$1</h2>')
      .replace(/^# (.+)$/gim, '<h1 class="text-2xl font-bold text-foreground mt-8 mb-4">$1</h1>')
      // Bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      // Italic text
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      // Line breaks
      .replace(/\n/g, '<br/>');
  };
  
  const handleAccept = () => {
    setIsAccepted(true);
    toast.success('AI content accepted');
  };
  
  const handleReject = () => {
    setIsRejected(true);
    // Get original content and restore it
    const changeInfo = AIChangeTrackingService.getAllChanges().get(contentId);
    if (changeInfo?.originalContent && onContentUpdate) {
      onContentUpdate(contentId, changeInfo.originalContent);
    }
    toast.info('AI content rejected, original content restored');
  };
  
  const handleAcceptSuggestion = (suggestionContentId: string, newContent: string) => {
    const acceptedContent = AISuggestionService.acceptSuggestion(suggestionContentId) || newContent;
    if (acceptedContent && onContentUpdate) {
      // Track and visually mark accepted AI content
      AIChangeTrackingService.trackChange(
        suggestionContentId,
        content,
        acceptedContent,
        'ai-modified',
        'AI Suggestion'
      );
      // Update content with AI-generated content (no highlighting)
      onContentUpdate(suggestionContentId, acceptedContent);
      toast.success('AI content accepted and applied');
    }
  };

  const handleRejectSuggestion = (suggestionContentId: string) => {
    const originalContent = AISuggestionService.rejectSuggestion(suggestionContentId);
    if (originalContent && onContentUpdate) {
      onContentUpdate(suggestionContentId, originalContent);
      toast.info('AI suggestion rejected, showing original content');
    }
  };

  // If there's a pending suggestion, show the inline suggestion component
  if (pendingSuggestion) {
    return (
      <InlineAISuggestion
        originalContent={pendingSuggestion.originalContent}
        suggestedContent={pendingSuggestion.suggestedContent}
        contentId={contentId}
        onAccept={handleAcceptSuggestion}
        onReject={handleRejectSuggestion}
      />
    );
  }
  
  // Handle missing data markers - only show if showAIControls is true
  if (showAIControls && (content.includes('<span style="background-color: #fed7aa') || content.includes('Missing:'))) {
    // Extract the missing content message and clean it up
    const missingMatch = content.match(/Missing:\s*([^<]+)/);
    const missingText = missingMatch ? missingMatch[1].trim() : 'Content needed';
    
    // Remove the HTML span and show just the clean missing text
    const cleanContent = content.replace(/<span[^>]*>.*?<\/span>/g, '').trim();
    
    return (
      <div className="space-y-2">
        {cleanContent && (
          <div>{cleanContent}</div>
        )}
        <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 border border-orange-300 rounded-md text-sm font-medium cursor-pointer hover:bg-orange-200 transition-colors"
             onClick={() => {
               const prompt = `Generate content for: ${missingText}`;
               onAIGenerate?.(prompt);
             }}>
          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          Missing: {missingText} - Click to generate with AI ✨
        </div>
      </div>
    );
  }
  
  // If showAIControls is false and we have missing markers, strip them and show clean content
  if (!showAIControls && (content.includes('<span style="background-color: #fed7aa') || content.includes('Missing:'))) {
    // Remove all missing content markers and their HTML
    let cleanContent = content.replace(/<span[^>]*background-color:\s*#fed7aa[^>]*>.*?<\/span>/g, '');
    cleanContent = cleanContent.replace(/Missing:[^<\n]*/g, '').trim();
    
    // If there's still content after cleaning, show it
    if (cleanContent && cleanContent.length > 0) {
      if (/<[a-z][\s\S]*>/i.test(cleanContent)) {
        return (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />
        );
      }
      return <div>{cleanContent}</div>;
    }
    
    // If no content remains, return empty
    return null;
  }

  // Check if content has HTML highlighting OR if it's tracked as AI-modified
  const hasHTMLHighlighting = content.includes('background-color: #fef08a') || 
                               content.includes('background-color: yellow') || 
                               content.includes('background-color: #dcfce7');
  
  // Get original content from tracking service
  const changeInfo = AIChangeTrackingService.getAllChanges().get(contentId);
  const originalContent = changeInfo?.originalContent;
  
  // Don't show rejected content
  if (isRejected) {
    return null;
  }
  
  // If showAIControls is false, just render the content cleanly without highlighting
  if (!showAIControls && (hasHTMLHighlighting || isAIModified || aiUsed || companyDataUsed)) {
    // Strip HTML highlighting from content for clean display
    let cleanContent = content;
    
    // Remove yellow/green highlighting spans but keep the text content
    cleanContent = cleanContent.replace(/<span[^>]*background-color:\s*#fef08a[^>]*>(.*?)<\/span>/g, '$1');
    cleanContent = cleanContent.replace(/<span[^>]*background-color:\s*yellow[^>]*>(.*?)<\/span>/g, '$1');
    cleanContent = cleanContent.replace(/<span[^>]*background-color:\s*#dcfce7[^>]*>(.*?)<\/span>/g, '$1');
    
    // Check if content has markdown and parse it
    const hasMarkdown = /(\*\*.*?\*\*|^#{1,3}\s+|\*.*?\*)/m.test(cleanContent);
    if (hasMarkdown && !/<[a-z][\s\S]*>/i.test(cleanContent)) {
      cleanContent = formatMarkdown(cleanContent);
    }
    
    // Render general HTML content safely
    if (/<[a-z][\s\S]*>/i.test(cleanContent)) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
      );
    }
    
    return <div>{cleanContent}</div>;
  }
  
  // If content contains HTML highlighting OR is tracked as AI-modified, render with highlighting (only when showAIControls is true)
  if (showAIControls && (hasHTMLHighlighting || isAIModified || aiUsed || companyDataUsed)) {
    const isCompanyDataGenerated = content.includes('background-color: #dcfce7') || companyDataUsed;
    const isAIContent = hasHTMLHighlighting && content.includes('background-color: #fef08a') || isAIModified || aiUsed;
    
    // If content doesn't have HTML highlighting but should, wrap it
    let displayContent = content;
    if (!hasHTMLHighlighting && (isAIModified || aiUsed)) {
      displayContent = AIChangeTrackingService.markAsAIGenerated(content);
    } else if (!hasHTMLHighlighting && companyDataUsed) {
      displayContent = AIChangeTrackingService.markAsCompanyData(content);
    }
    
    return (
      <div className="relative group">
        <div className="flex gap-2 mb-2 items-center justify-between">
          <div className="flex gap-2 items-center">
            {isCompanyDataGenerated && (
              <EnhancedContentIndicator source="company-data" />
            )}
            {isAIContent && !isCompanyDataGenerated && (
              <EnhancedContentIndicator source="ai-generated" />
            )}
          </div>
          
          {/* Accept/Reject buttons for AI content */}
          {isAIContent && !isAccepted && !isCompanyDataGenerated && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                onClick={handleAccept}
              >
                <Check className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                onClick={handleReject}
              >
                <X className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          )}
          
          {/* Accepted badge */}
          {isAccepted && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <Check className="w-3 h-3 mr-1" />
              Accepted
            </Badge>
          )}
        </div>
        
        {/* Show original content if it exists and differs from new content (for AI content only) */}
        {originalContent && originalContent.trim() && originalContent !== content && isAIContent && !isAccepted && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
            <div className="font-medium text-gray-600 mb-2 flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Original Content:
            </div>
            <div className="text-gray-700 italic">{originalContent}</div>
          </div>
        )}
        
        <div 
          dangerouslySetInnerHTML={{ __html: formatMarkdown(displayContent) }}
          className={`prose prose-sm max-w-none ${
            isCompanyDataGenerated ? getContentHighlighting('company-data') :
            isAIContent ? getContentHighlighting('ai-generated') : ''
          }`}
        />
      </div>
    );
  }

  // Render general HTML content safely (for stored rich text like <p>, <ul>, etc.)
  if (/<[a-z][\s\S]*>/i.test(content)) {
    // Also parse any markdown that might be mixed in
    const hasMarkdown = /(\*\*.*?\*\*|^#{1,3}\s+|\*.*?\*)/m.test(content);
    const finalContent = hasMarkdown ? formatMarkdown(content) : content;
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: finalContent }}
      />
    );
  }
  
  // For missing data or regular content, just render as text
  if (content.includes('[MISSING:') || content.includes('[COMPANY INPUT NEEDED:')) {
    return (
      <div className="relative p-2 border border-orange-200 bg-orange-50 rounded">
        <span className="text-orange-800">{content}</span>
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 text-xs"
        >
          Needs Input
        </Badge>
      </div>
    );
  }
  
  // Check if content has markdown formatting
  const hasMarkdown = /(\*\*.*?\*\*|^#{1,3}\s+|\*.*?\*)/m.test(content);
  
  if (hasMarkdown) {
    const formattedHtml = formatMarkdown(content);
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedHtml }}
      />
    );
  }

  // Convert line breaks to proper formatting
  const formatContent = (text: string) => {
    // Split by line breaks and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if this is a bullet point or numbered item
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('○') || /^\d+\./.test(trimmedLine)) {
        return (
          <div key={index} className="mb-2">
            {trimmedLine}
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <div key={index} className="mb-2">
          {trimmedLine}
        </div>
      );
    });
  };

  return <div>{formatContent(content)}</div>;
}