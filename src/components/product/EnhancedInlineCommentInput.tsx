
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Send, MapPin } from 'lucide-react';
import { ReviewerGroupSelector } from './ReviewerGroupSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';

interface EnhancedCommentPosition {
  x: number;
  y: number;
  pageNumber: number;
  pageX: number;
  pageY: number;
  scale: number;
  textContext?: {
    selectedText: string;
    beforeText: string;
    afterText: string;
  };
  documentDimensions?: {
    pageWidth: number;
    pageHeight: number;
    documentWidth: number;
    documentHeight: number;
  };
}

interface EnhancedInlineCommentInputProps {
  documentId: string;
  companyId?: string;
  position: EnhancedCommentPosition;
  selectedText?: string;
  onClose: () => void;
  containerBounds: DOMRect | null;
}

export function EnhancedInlineCommentInput({ 
  documentId, 
  companyId,
  position, 
  selectedText,
  onClose, 
  containerBounds
}: EnhancedInlineCommentInputProps) {
  const [comment, setComment] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get reviewer groups
  const { groups: reviewerGroups } = useReviewerGroups(companyId);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    // Auto-select first available group if available
    if (reviewerGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(reviewerGroups[0].id);
    }
  }, [reviewerGroups, selectedGroupId]);

  const handleSubmit = async () => {
    if (!comment.trim() || !selectedGroupId) return;

    setIsSubmitting(true);

    try {
      // Prepare enhanced position data
      const enhancedPositionData = {
        x: position.x,
        y: position.y,
        page_number: position.pageNumber,
        page_x: position.pageX,
        page_y: position.pageY,
        scale: position.scale,
        text_context: position.textContext,
        document_dimensions: position.documentDimensions,
        scroll_top: 0, // Will be updated by scroll tracking
        scroll_left: 0,
        viewport_width: position.documentDimensions?.documentWidth,
        viewport_height: position.documentDimensions?.documentHeight
      };

      // Find the selected reviewer group
      const selectedGroup = reviewerGroups.find(g => g.id === selectedGroupId);
      const isInternal = selectedGroup?.group_type === 'internal';

      // Add reviewer group info to position
      const positionWithGroup = {
        ...enhancedPositionData,
        reviewer_group_id: selectedGroupId,
        reviewer_group_name: selectedGroup?.name
      };

      const { data, error } = await supabase.rpc('create_new_comment_thread', {
        p_document_id: documentId,
        p_comment_content: comment.trim(),
        p_position_coords: positionWithGroup,
        p_is_internal: isInternal
      });

      if (error) throw error;

      toast.success(`Comment placed on page ${position.pageNumber} and sent to ${selectedGroup?.name || 'reviewers'}`);
      onClose();
      
      // Refresh the page to show the new comment
      window.location.reload();
    } catch (error) {
      console.error('Error creating enhanced comment:', error);
      toast.error('Failed to create comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Calculate position for the comment input with better positioning logic
  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    left: Math.min(position.x + 20, (containerBounds?.width || 800) - 350),
    top: Math.max(10, Math.min(position.y - 100, (containerBounds?.height || 600) - 300)),
    zIndex: 50,
    maxWidth: '350px',
    minWidth: '320px'
  };

  return (
    <div style={inputStyle} className="bg-white border border-gray-300 rounded-lg shadow-xl p-4">
      {/* Header with position info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">Add Comment</h4>
          <Badge variant="secondary" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            Page {position.pageNumber}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Selected text context */}
      {selectedText && (
        <div className="mb-3 p-2 bg-purple-50 border border-purple-200 rounded">
          <div className="text-xs font-medium text-purple-600 mb-1">Selected Text:</div>
          <div className="text-xs text-purple-800 italic">
            "{selectedText.length > 80 ? selectedText.substring(0, 80) + '...' : selectedText}"
          </div>
        </div>
      )}

      {/* Text context indicator */}
      {position.textContext && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="text-xs font-medium text-blue-600 mb-1">Text Context Available</div>
          <div className="text-xs text-blue-700">
            This comment will be anchored to specific text in the document
          </div>
        </div>
      )}

      {/* Reviewer Group Selection */}
      <div className="mb-3">
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Send to Review Group
        </label>
        <ReviewerGroupSelector
          selectedGroupId={selectedGroupId}
          onGroupSelect={setSelectedGroupId}
          showManageButton={false}
        />
      </div>

      {/* Comment Input */}
      <Textarea
        ref={textareaRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add your comment..."
        className="mb-3 min-h-[80px] resize-none text-sm"
        disabled={isSubmitting}
      />

      {/* Position info */}
      <div className="mb-3 text-xs text-muted-foreground">
        Position: Page {position.pageNumber} ({Math.round(position.pageX)}%, {Math.round(position.pageY)}%)
        {position.scale !== 1.0 && <span> • Scale: {position.scale}x</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Press Enter to submit, Shift+Enter for new line
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!comment.trim() || !selectedGroupId || isSubmitting}
          size="sm"
          className="flex items-center gap-1"
        >
          <Send className="h-3 w-3" />
          {isSubmitting ? 'Placing...' : 'Place Comment'}
        </Button>
      </div>
    </div>
  );
}
