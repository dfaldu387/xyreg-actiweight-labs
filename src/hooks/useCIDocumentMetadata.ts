import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CIDocumentMetadata {
  id: string;
  name: string;
  status: string;
  due_date: string | null;
  document_type: string | null;
  sub_section: string | null;
  section_ids: string[] | null;
  authors_ids: string[] | null;
  assigned_to: string | null;
  reference_document_ids: string[] | null;
  phase_id: string | null;
  product_id: string | null;
}

/**
 * Hook to fetch and update CI metadata for a document from phase_assigned_document_template.
 * Used by the CIPropertyPanel for inline editing.
 */
export function useCIDocumentMetadata(documentId: string | null, companyId: string | undefined) {
  const [metadata, setMetadata] = useState<CIDocumentMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetadata = useCallback(async () => {
    if (!documentId || !companyId) {
      setMetadata(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, status, due_date, document_type, sub_section, section_ids, authors_ids, reference_document_ids, phase_id, product_id')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching CI metadata:', error);
        setMetadata(null);
      } else {
        setMetadata({
          id: data.id,
          name: data.name || '',
          status: data.status || 'Not Started',
          due_date: data.due_date,
          document_type: data.document_type,
          sub_section: data.sub_section,
          section_ids: data.section_ids as string[] | null,
          authors_ids: data.authors_ids as string[] | null,
          assigned_to: null, // Not stored yet
          reference_document_ids: data.reference_document_ids as string[] | null,
          phase_id: data.phase_id,
          product_id: data.product_id,
        });
      }
    } catch (err) {
      console.error('Error fetching CI metadata:', err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, companyId]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const updateField = useCallback(async (field: string, value: any) => {
    if (!documentId) return;

    const { error } = await supabase
      .from('phase_assigned_document_template')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    if (error) {
      console.error(`Error updating ${field}:`, error);
      throw error;
    }

    // Update local state
    setMetadata(prev => prev ? { ...prev, [field]: value } : null);
  }, [documentId]);

  return { metadata, isLoading, updateField, refetch: fetchMetadata };
}
