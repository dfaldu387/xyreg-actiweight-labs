
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TextHighlight {
  id: string;
  document_id: string;
  user_id: string;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  color: string;
  page_number: number;
  position?: any;
  reviewer_group_id?: string;
  created_at: string;
}

interface CreateHighlightData {
  document_id: string;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  color?: string;
  page_number?: number;
  position?: any;
  reviewer_group_id?: string;
}

export function useTextHighlighting(documentId: string) {
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [selectedText, setSelectedText] = useState<Selection | null>(null);
  const queryClient = useQueryClient();

  // Fetch highlights for document
  const { data: highlights = [], isLoading } = useQuery({
    queryKey: ['document-highlights', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_highlights')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TextHighlight[];
    },
    enabled: !!documentId
  });

  // Create highlight mutation
  const createHighlightMutation = useMutation({
    mutationFn: async (data: CreateHighlightData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('document_highlights')
        .insert({
          document_id: data.document_id,
          start_offset: data.start_offset,
          end_offset: data.end_offset,
          highlighted_text: data.highlighted_text,
          color: data.color || '#ffff00',
          page_number: data.page_number || 1,
          position: data.position,
          reviewer_group_id: data.reviewer_group_id,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-highlights', documentId] });
      toast.success('Text highlighted successfully');
      setIsHighlighting(false);
      setSelectedText(null);
    },
    onError: (error) => {
      toast.error('Failed to create highlight');
      console.error('Error creating highlight:', error);
    }
  });

  // Delete highlight mutation
  const deleteHighlightMutation = useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase
        .from('document_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-highlights', documentId] });
      toast.success('Highlight removed');
    },
    onError: (error) => {
      toast.error('Failed to remove highlight');
      console.error('Error removing highlight:', error);
    }
  });

  const startHighlighting = useCallback(() => {
    setIsHighlighting(true);
  }, []);

  const stopHighlighting = useCallback(() => {
    setIsHighlighting(false);
    setSelectedText(null);
  }, []);

  const createHighlight = useCallback((data: Omit<CreateHighlightData, 'document_id'>) => {
    createHighlightMutation.mutate({
      ...data,
      document_id: documentId
    });
  }, [documentId, createHighlightMutation]);

  const deleteHighlight = useCallback((highlightId: string) => {
    deleteHighlightMutation.mutate(highlightId);
  }, [deleteHighlightMutation]);

  const handleTextSelection = useCallback(() => {
    if (!isHighlighting) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    setSelectedText(selection);
  }, [isHighlighting]);

  return {
    highlights,
    isLoading,
    isHighlighting,
    selectedText,
    startHighlighting,
    stopHighlighting,
    createHighlight,
    deleteHighlight,
    handleTextSelection,
    isCreating: createHighlightMutation.isPending,
    isDeleting: deleteHighlightMutation.isPending
  };
}
