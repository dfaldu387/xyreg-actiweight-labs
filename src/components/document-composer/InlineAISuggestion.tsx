import React, { useState, useEffect } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface InlineAISuggestionProps {
  originalContent: string;
  suggestedContent: string;
  contentId: string;
  onAccept: (contentId: string, newContent: string) => void;
  onReject: (contentId: string) => void;
}

export function InlineAISuggestion({ 
  originalContent, 
  suggestedContent, 
  contentId, 
  onAccept, 
  onReject 
}: InlineAISuggestionProps) {
  const cleanOriginalContent = originalContent.replace(/<[^>]*>/g, '').trim();
  const [displayedContent, setDisplayedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(true);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  // Streaming effect for AI content
  useEffect(() => {
    if (!suggestedContent) return;
    
    setIsStreaming(true);
    setDisplayedContent('');
    
    let currentIndex = 0;
    const streamInterval = setInterval(() => {
      if (currentIndex < suggestedContent.length) {
        setDisplayedContent(suggestedContent.slice(0, currentIndex + 1));
        currentIndex += Math.max(1, Math.floor(Math.random() * 3)); // Variable speed
      } else {
        setIsStreaming(false);
        clearInterval(streamInterval);
      }
    }, 20); // 20ms delay for smooth streaming

    return () => clearInterval(streamInterval);
  }, [suggestedContent]);

  const handleAccept = () => {
    setIsAccepted(true);
    setIsRejected(false);
    onAccept(contentId, suggestedContent);
  };

  const handleReject = () => {
    setIsRejected(true);
    setIsAccepted(false);
    onReject(contentId);
  };

  // Convert markdown to HTML for better display
  const formatMarkdown = (text: string) => {
    return text
      // Remove horizontal rules (---) that appear before headers or standalone
      .replace(/^---\s*$/gim, '')
      .replace(/^---\s+(?=#)/gim, '')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h2>')
      .replace(/### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">$1</h3>')
      .replace(/#### (.*$)/gim, '<h4 class="text-base font-semibold text-gray-700 mt-3 mb-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^-\s+(.*$)/gim, '<li class="ml-4 mb-1 list-disc">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>')
      .replace(/^(?!<[h|l])/gm, '<p class="mb-3">')
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc ml-6 mb-3">$1</ul>');
  };

  // If accepted, show only AI content
  if (isAccepted) {
    return (
      <div className="relative border border-green-300 bg-green-50 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Badge variant="secondary" className="bg-green-200 text-green-800 border-green-300">
              <Check className="w-3 h-3 mr-1" />
              AI Content Accepted
            </Badge>
          </div>
          
          <div className="flex-1">
            <div 
              className="text-sm text-green-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formatMarkdown(suggestedContent)
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // If rejected, show only original content
  if (isRejected) {
    return (
      <div className="relative border border-gray-300 bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Badge variant="secondary" className="bg-gray-200 text-gray-800 border-gray-300">
              <X className="w-3 h-3 mr-1" />
              Original Content Restored
            </Badge>
          </div>
          
          <div className="flex-1">
            <div className="text-sm text-gray-700">
              {cleanOriginalContent}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default state: show both original and AI content with action buttons
  return (
    <div className="relative border border-yellow-300 bg-yellow-50 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 border-yellow-300">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Suggestion
          </Badge>
        </div>
        
        <div className="flex-1 space-y-3">
          {/* Original content without strikethrough */}
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="text-sm text-red-600 font-medium mb-1">Original:</div>
            <div className="text-sm text-red-700">
              {cleanOriginalContent}
            </div>
          </div>
          
          {/* AI-generated content with streaming effect */}
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-2">
              <span>AI Generated:</span>
              {isStreaming && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">Generating...</span>
                </div>
              )}
            </div>
            <div 
              className="text-sm text-green-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: formatMarkdown(displayedContent) + (isStreaming ? '<span class="animate-pulse">|</span>' : '')
              }}
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex-shrink-0 flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-100"
            onClick={handleAccept}
            disabled={isStreaming}
          >
            <Check className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
            onClick={handleReject}
            disabled={isStreaming}
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}