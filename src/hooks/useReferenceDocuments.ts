import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReferenceDocumentService, ReferenceDocument } from '@/services/referenceDocumentService';
import { toast } from 'sonner';

export function useReferenceDocuments(companyId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['reference-documents', companyId];

  const { data: documents = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => ReferenceDocumentService.listDocuments(companyId!),
    enabled: !!companyId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ files, tags }: { files: File[]; tags: string[] }) =>
      ReferenceDocumentService.bulkUpload(files, companyId!, tags),
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(`${results.length} file(s) uploaded successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath: string }) =>
      ReferenceDocumentService.deleteDocument(id, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document deleted');
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const updateTagsMutation = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      ReferenceDocumentService.updateTags(id, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Tags updated');
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { file_name?: string; tags?: string[]; file_type?: string } }) =>
      ReferenceDocumentService.updateDocument(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document updated');
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const downloadDocument = async (filePath: string) => {
    try {
      const url = await ReferenceDocumentService.getDownloadUrl(filePath);
      window.open(url, '_blank');
    } catch (error: any) {
      toast.error(`Download failed: ${error.message}`);
    }
  };

  return {
    documents,
    isLoading,
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    updateTags: updateTagsMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    downloadDocument,
  };
}
