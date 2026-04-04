import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BomDocumentService } from '@/services/bomDocumentService';
import type { BomDocumentType } from '@/types/bom';
import { toast } from 'sonner';

export function useBomItemDocuments(bomItemId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['bom-item-documents', bomItemId];

  const { data: documents = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => BomDocumentService.listDocuments(bomItemId!),
    enabled: !!bomItemId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, companyId, documentType }: { file: File; companyId: string; documentType: BomDocumentType }) =>
      BomDocumentService.uploadDocument(file, bomItemId!, companyId, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document uploaded');
    },
    onError: (err: Error) => toast.error(`Upload failed: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: BomDocumentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document removed');
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });

  return {
    documents,
    isLoading,
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    getPublicUrl: BomDocumentService.getPublicUrl,
  };
}
