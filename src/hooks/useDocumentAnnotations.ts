
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnnotationPosition {
  page_number: number;
  page_x: number;
  page_y: number;
  width: number;
  height: number;
}

interface DocumentAnnotation {
  id: string;
  document_id: string;
  user_id: string;
  type: 'highlight' | 'note';
  content: string;
  position: AnnotationPosition;
  color?: string;
  created_at: string;
  updated_at: string;
}

interface CommentThread {
  id: string;
  annotation_id?: string;
  document_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface AddAnnotationData {
  type: 'highlight' | 'note';
  content: string;
  position: AnnotationPosition;
  color?: string;
  comment?: string;
}

// Helper function to safely convert AnnotationPosition to Json
const positionToJson = (position: AnnotationPosition): Record<string, any> => {
  return {
    page_number: position.page_number,
    page_x: position.page_x,
    page_y: position.page_y,
    width: position.width,
    height: position.height
  };
};

// Helper function to safely parse position from Json
const jsonToPosition = (json: any): AnnotationPosition => {
  if (typeof json === 'string') {
    try {
      const parsed = JSON.parse(json);
      return {
        page_number: parsed.page_number || 1,
        page_x: parsed.page_x || 0,
        page_y: parsed.page_y || 0,
        width: parsed.width || 100,
        height: parsed.height || 20
      };
    } catch {
      return {
        page_number: 1,
        page_x: 0,
        page_y: 0,
        width: 100,
        height: 20
      };
    }
  }
  
  if (json && typeof json === 'object') {
    return {
      page_number: json.page_number || 1,
      page_x: json.page_x || 0,
      page_y: json.page_y || 0,
      width: json.width || 100,
      height: json.height || 20
    };
  }
  
  return {
    page_number: 1,
    page_x: 0,
    page_y: 0,
    width: 100,
    height: 20
  };
};

export function useDocumentAnnotations(documentId: string) {
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnnotations = useCallback(async () => {
    if (!documentId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_highlights')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to load annotations');
        return;
      }

      const formattedAnnotations: DocumentAnnotation[] = data.map(item => ({
        id: item.id,
        document_id: item.document_id,
        user_id: item.user_id,
        type: 'highlight',
        content: item.highlighted_text || '',
        position: jsonToPosition(item.position),
        color: item.color || '#FFD700',
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setAnnotations(formattedAnnotations);
    } catch (error) {
      toast.error('Failed to load annotations');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  const loadCommentThreads = useCallback(async () => {
    if (!documentId) return;

    try {
      const { data, error } = await supabase
        .from('comment_threads')
        .select(`
          *,
          comments!inner(
            *,
            user_profiles(first_name, last_name, email)
          )
        `)
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) {
        return;
      }

      // Flatten the threads and comments structure
      const flatThreads: CommentThread[] = [];
      data?.forEach(thread => {
        if (thread.comments && Array.isArray(thread.comments)) {
          thread.comments.forEach((comment: any) => {
            flatThreads.push({
              id: comment.id,
              annotation_id: thread.position ? thread.id : undefined,
              document_id: thread.document_id,
              user_id: comment.user_id,
              content: comment.content,
              parent_id: comment.parent_id,
              created_at: comment.created_at,
              updated_at: comment.updated_at,
              user_profiles: comment.user_profiles
            });
          });
        }
      });

      setThreads(flatThreads);
    } catch (error) {
      // Error loading comment threads
    }
  }, [documentId]);

  const addAnnotation = useCallback(async (data: AddAnnotationData) => {
    if (!documentId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Create the highlight annotation
      const { data: annotationData, error: annotationError } = await supabase
        .from('document_highlights')
        .insert({
          document_id: documentId,
          user_id: user.id,
          highlighted_text: data.content,
          page_number: data.position.page_number,
          start_offset: 0,
          end_offset: data.content.length,
          color: data.color || '#FFD700',
          position: positionToJson(data.position)
        })
        .select()
        .single();

      if (annotationError) {
        console.error('Error creating annotation:', annotationError);
        toast.error('Failed to create annotation');
        return;
      }

      // If there's a comment, create a comment thread
      if (data.comment?.trim()) {
        const { error: threadError } = await supabase.rpc('create_new_comment_thread', {
          p_document_id: documentId,
          p_comment_content: data.comment.trim(),
          p_position_coords: positionToJson(data.position),
          p_is_internal: true
        });

        if (threadError) {
          console.error('Error creating comment thread:', threadError);
          // Don't toast error here as the annotation was created successfully
        }
      }

      // Reload data
      await loadAnnotations();
      await loadCommentThreads();
    } catch (error) {
      console.error('Error adding annotation:', error);
      toast.error('Failed to add annotation');
    }
  }, [documentId, loadAnnotations, loadCommentThreads]);

  const addComment = useCallback(async (content: string, annotationId?: string) => {
    if (!documentId || !content.trim()) return;

    try {
      const result = await supabase.rpc('create_new_comment_thread', {
        p_document_id: documentId,
        p_comment_content: content.trim(),
        p_position_coords: annotationId ? null : undefined,
        p_is_internal: true
      });

      if (result.error) {
        console.error('Error creating comment:', result.error);
        toast.error('Failed to add comment');
        return;
      }

      await loadCommentThreads();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  }, [documentId, loadCommentThreads]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', commentId);

      if (error) {
        console.error('Error updating comment:', error);
        toast.error('Failed to update comment');
        return;
      }

      await loadCommentThreads();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  }, [loadCommentThreads]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        toast.error('Failed to delete comment');
        return;
      }

      await loadCommentThreads();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  }, [loadCommentThreads]);

  return {
    annotations,
    threads,
    isLoading,
    addAnnotation,
    addComment,
    updateComment,
    deleteComment,
    loadAnnotations,
    loadCommentThreads
  };
}
