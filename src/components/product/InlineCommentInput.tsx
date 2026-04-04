
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send } from 'lucide-react';
import { ReviewerGroupSelector } from './ReviewerGroupSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useReviewerGroups } from '@/hooks/useReviewerGroups';

interface InlineCommentInputProps {
  documentId: string;
  companyId?: string;
  position: { x: number; y: number };
  onClose: () => void;
  containerBounds: DOMRect | null;
  storePosition?: (x: number, y: number) => {
    x: number;
    y: number;
    scroll_top?: number;
    scroll_left?: number;
    viewport_width?: number;
    viewport_height?: number;
  };
}

export function InlineCommentInput({ 
  documentId, 
  companyId,
  position, 
  onClose, 
  containerBounds,
  storePosition 
}: InlineCommentInputProps) {
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
      let positionData = {
        x: position.x,
        y: position.y
      };

      // Use the simplified position storage if available
      if (storePosition) {
        positionData = storePosition(position.x, position.y);
      }

      // Find the selected reviewer group
      const selectedGroup = reviewerGroups.find(g => g.id === selectedGroupId);
      const isInternal = selectedGroup?.group_type === 'internal';

      const { data, error } = await supabase.rpc('create_new_comment_thread', {
        p_document_id: documentId,
        p_comment_content: comment.trim(),
        p_position_coords: {
          ...positionData,
          reviewer_group_id: selectedGroupId,
          reviewer_group_name: selectedGroup?.name
        },
        p_is_internal: isInternal
      });

      if (error) throw error;

      toast.success(`Comment sent to ${selectedGroup?.name || 'reviewers'}`);
      onClose();
      
      // Refresh the page to show the new comment
      window.location.reload();
    } catch (error) {
      console.error('Error creating comment:', error);
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

  // Calculate position for the comment input
  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    left: Math.min(position.x, (containerBounds?.width || 800) - 320),
    top: Math.min(position.y, (containerBounds?.height || 600) - 250),
    zIndex: 50,
    maxWidth: '320px',
    minWidth: '300px'
  };

  return (
    <div style={inputStyle} className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">Add Comment</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

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
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
