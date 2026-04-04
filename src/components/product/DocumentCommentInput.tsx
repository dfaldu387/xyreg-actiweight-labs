
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReviewerGroupSelector } from './ReviewerGroupSelector';
import { useToast } from '@/hooks/use-toast';

interface DocumentCommentInputProps {
  documentId: string;
  onCommentAdded?: () => void;
}

export function DocumentCommentInput({ documentId, onCommentAdded }: DocumentCommentInputProps) {
  const [content, setContent] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!content.trim() || !selectedGroupId) {
        throw new Error('Comment content and reviewer group are required');
      }

      // Create a general comment without position (for general discussion)
      const { data, error } = await supabase.rpc('create_new_comment_thread', {
        p_document_id: documentId,
        p_comment_content: content.trim(),
        p_position_coords: {
          reviewer_group_id: selectedGroupId
        },
        p_is_internal: false // Will be determined by reviewer group permissions
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-threads', documentId] });
      setContent('');
      setSelectedGroupId('');
      onCommentAdded?.();
      toast({ title: 'Comment added successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Error adding comment',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = () => {
    if (!content.trim() || !selectedGroupId) return;
    createCommentMutation.mutate();
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Add General Comment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Send to Review Group
          </label>
          <ReviewerGroupSelector
            selectedGroupId={selectedGroupId}
            onGroupSelect={setSelectedGroupId}
            showManageButton={false}
          />
        </div>

        <Textarea
          placeholder="Write a general comment about this document..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || !selectedGroupId || createCommentMutation.isPending}
            size="sm"
          >
            {createCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          💡 Tip: Double-click on the document to add comments at specific locations
        </div>
      </CardContent>
    </Card>
  );
}
