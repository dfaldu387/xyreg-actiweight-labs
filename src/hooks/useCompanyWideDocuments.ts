import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyWideDocument {
  id: string;
  name: string;
  status: string;
  document_type: string;
  tech_applicability?: string;
  created_at: string;
  updated_at: string;
  file_path?: string;
  file_name?: string;
  description?: string;
  due_date?: string;
  tags?: string[];
  sub_section?: string;
  authors_ids?: string[];
  document_number?: string | null;
}

export function useCompanyWideDocuments(companyId: string) {
  const [documents, setDocuments] = useState<CompanyWideDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyWideDocuments = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('phase_assigned_document_template')
        .select('*')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .order('updated_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }


      const transformedDocs: CompanyWideDocument[] = (data || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        status: doc.status || 'Not Started',
        document_type: doc.document_type || 'Standard',
        tech_applicability: doc.tech_applicability,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        file_path: doc.file_path,
        file_name: doc.file_name,
        description: doc.description,
        due_date: doc.due_date,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        sub_section: doc.sub_section || null,
        authors_ids: Array.isArray(doc.authors_ids) ? doc.authors_ids : [],
        document_number: doc.document_number || null,
      }));

      setDocuments(transformedDocs);
    } catch (err) {
      console.error('Error loading company-wide documents:', err);
      setError('Failed to load company-wide documents');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadCompanyWideDocuments();
  }, [loadCompanyWideDocuments]);

  return {
    documents,
    loading,
    error,
    refetch: loadCompanyWideDocuments
  };
}
