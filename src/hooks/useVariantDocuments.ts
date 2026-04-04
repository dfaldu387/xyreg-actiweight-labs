import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VariantDocumentLink {
  id: string;
  variant_product_id: string;
  master_document_id: string;
  is_overridden: boolean;
  override_document_id: string | null;
  master_document?: {
    id: string;
    name: string;
    status: string;
    document_type: string;
    phase_id: string | null;
    description: string | null;
  };
}

export function useVariantDocuments(productId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['variant-document-links', productId];

  // Check if this product is a variant
  const { data: variantInfo } = useQuery({
    queryKey: ['variant-info-docs', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('parent_product_id, parent_relationship_type, name')
        .eq('id', productId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 30_000,
  });

  const isVariant = !!(
    variantInfo?.parent_product_id &&
    variantInfo?.parent_relationship_type === 'variant'
  );
  const parentProductId = isVariant ? variantInfo?.parent_product_id : null;

  // Fetch master device name
  const { data: masterDevice } = useQuery({
    queryKey: ['master-device-name', parentProductId],
    queryFn: async () => {
      if (!parentProductId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('id', parentProductId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!parentProductId,
    staleTime: 60_000,
  });

  // Fetch variant document links with master document details
  const { data: links = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('variant_document_links')
        .select(`
          id,
          variant_product_id,
          master_document_id,
          is_overridden,
          override_document_id
        `)
        .eq('variant_product_id', productId);
      if (error) throw error;

      // Fetch master document details for each link
      if (!data || data.length === 0) return [];
      const masterDocIds = data.map(l => l.master_document_id);
      const { data: masterDocs, error: docsError } = await supabase
        .from('documents')
        .select('id, name, status, document_type, phase_id, description')
        .in('id', masterDocIds);
      if (docsError) throw docsError;

      const docMap = new Map((masterDocs || []).map(d => [d.id, d]));
      return data.map(link => ({
        ...link,
        master_document: docMap.get(link.master_document_id) || undefined,
      })) as VariantDocumentLink[];
    },
    enabled: !!productId && isVariant,
    staleTime: 15_000,
  });

  // Sync: create links for all master device documents that don't already have links
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!productId || !parentProductId) throw new Error('Not a variant');
      
      // Get all master device documents
      const { data: masterDocs, error: mdErr } = await supabase
        .from('documents')
        .select('id')
        .eq('product_id', parentProductId);
      if (mdErr) throw mdErr;
      if (!masterDocs || masterDocs.length === 0) return 0;

      // Get existing links
      const { data: existing, error: exErr } = await supabase
        .from('variant_document_links')
        .select('master_document_id')
        .eq('variant_product_id', productId);
      if (exErr) throw exErr;

      const existingSet = new Set((existing || []).map(e => e.master_document_id));
      const newLinks = masterDocs
        .filter(d => !existingSet.has(d.id))
        .map(d => ({
          variant_product_id: productId,
          master_document_id: d.id,
          is_overridden: false,
        }));

      if (newLinks.length === 0) return 0;

      const { error: insertErr } = await supabase
        .from('variant_document_links')
        .insert(newLinks);
      if (insertErr) throw insertErr;
      return newLinks.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey });
      if (count > 0) {
        toast.success(`Linked ${count} document(s) from master device`);
      } else {
        toast.info('All master documents already linked');
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Break link: mark as overridden
  const breakLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('variant_document_links')
        .update({ is_overridden: true })
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document link broken — you can now upload a variant-specific version');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Restore link: set overridden back to false, clear override doc
  const restoreLinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('variant_document_links')
        .update({ is_overridden: false, override_document_id: null })
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Document link restored — now inheriting from master device');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Check if a document ID is inherited from master
  const getDocumentInheritanceStatus = (documentId: string) => {
    const link = links.find(l => l.master_document_id === documentId || l.override_document_id === documentId);
    if (!link) return null;
    return {
      linkId: link.id,
      isInherited: !link.is_overridden,
      isOverridden: link.is_overridden,
      masterDocumentName: link.master_document?.name || 'Unknown',
    };
  };

  return {
    isVariant,
    masterDevice: masterDevice ? { id: masterDevice.id, name: masterDevice.name } : null,
    links,
    isLoading,
    syncFromMaster: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    breakLink: (linkId: string) => breakLinkMutation.mutate(linkId),
    restoreLink: (linkId: string) => restoreLinkMutation.mutate(linkId),
    getDocumentInheritanceStatus,
    isBreaking: breakLinkMutation.isPending,
    isRestoring: restoreLinkMutation.isPending,
  };
}
