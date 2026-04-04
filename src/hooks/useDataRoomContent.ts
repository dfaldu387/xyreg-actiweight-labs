import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DataRoomContent, AddContentInput } from '@/types/dataRoom';
import { toast } from 'sonner';

export function useDataRoomContent(dataRoomId?: string) {
  const queryClient = useQueryClient();

  // Get all content for a data room
  const { data: contentList = [], isLoading, error } = useQuery({
    queryKey: ['data-room-content', dataRoomId],
    queryFn: async () => {
      if (!dataRoomId) return [];
      
      const { data, error } = await supabase
        .from('data_room_content')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as DataRoomContent[];
    },
    enabled: !!dataRoomId,
  });

  // Add auto-generated content
  const addGeneratedContentMutation = useMutation({
    mutationFn: async ({ 
      dataRoomId: drId, 
      productId,
      input 
    }: { 
      dataRoomId: string;
      productId: string;
      input: AddContentInput 
    }) => {
      const { data, error } = await supabase
        .from('data_room_content')
        .insert({
          data_room_id: drId,
          content_type: input.content_type,
          content_source: 'auto_generated',
          document_title: input.document_title,
          document_description: input.document_description,
          display_order: input.display_order || 0,
          is_visible: input.is_visible !== false,
          auto_refresh: true,
          source_data_query: {
            type: input.content_type,
            product_id: productId,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data as DataRoomContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-content'] });
      toast.success('Content added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add content: ${error.message}`);
    },
  });

  // Upload document and create content record (legacy, for manual uploads)
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ 
      dataRoomId: drId, 
      file, 
      metadata 
    }: { 
      dataRoomId: string; 
      file: File; 
      metadata: AddContentInput 
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${drId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('data-room-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create content record
      const { data, error } = await supabase
        .from('data_room_content')
        .insert({
          data_room_id: drId,
          content_type: metadata.content_type,
          content_source: 'manual_upload',
          document_title: metadata.document_title,
          document_description: metadata.document_description,
          file_path: uploadData.path,
          display_order: metadata.display_order || 0,
          is_visible: metadata.is_visible !== false,
          auto_refresh: false,
          metadata: {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data as DataRoomContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-content'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });

  // Add content without file upload
  const addContentMutation = useMutation({
    mutationFn: async ({ dataRoomId: drId, input }: { dataRoomId: string; input: AddContentInput }) => {
      const { data, error } = await supabase
        .from('data_room_content')
        .insert({
          data_room_id: drId,
          content_type: input.content_type,
          content_source: 'manual_upload',
          document_title: input.document_title,
          document_description: input.document_description,
          display_order: input.display_order || 0,
          is_visible: input.is_visible !== false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DataRoomContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-content'] });
      toast.success('Content added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add content: ${error.message}`);
    },
  });

  // Remove content
  const removeContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      // Get content to delete associated file
      const { data: content } = await supabase
        .from('data_room_content')
        .select('file_path')
        .eq('id', contentId)
        .single();

      // Delete file from storage if exists
      if (content?.file_path) {
        await supabase.storage
          .from('data-room-documents')
          .remove([content.file_path]);
      }

      // Delete content record
      const { error } = await supabase
        .from('data_room_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-content'] });
      toast.success('Content removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove content: ${error.message}`);
    },
  });

  // Reorder content
  const reorderContentMutation = useMutation({
    mutationFn: async ({ contentIds }: { contentIds: { id: string; display_order: number }[] }) => {
      const updates = contentIds.map(({ id, display_order }) =>
        supabase
          .from('data_room_content')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-content'] });
      toast.success('Content reordered successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder content: ${error.message}`);
    },
  });

  // Update content visibility
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ contentId, isVisible }: { contentId: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from('data_room_content')
        .update({ is_visible: isVisible })
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-room-content'] });
      toast.success('Visibility updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update visibility: ${error.message}`);
    },
  });

  return {
    contentList,
    isLoading,
    error,
    uploadDocument: uploadDocumentMutation.mutate,
    addContent: addContentMutation.mutate,
    addGeneratedContent: addGeneratedContentMutation.mutate,
    removeContent: removeContentMutation.mutate,
    reorderContent: reorderContentMutation.mutate,
    updateVisibility: updateVisibilityMutation.mutate,
    isUploading: uploadDocumentMutation.isPending,
    isAdding: addContentMutation.isPending || addGeneratedContentMutation.isPending,
    isRemoving: removeContentMutation.isPending,
    isReordering: reorderContentMutation.isPending,
    isUpdatingVisibility: updateVisibilityMutation.isPending,
  };
}
