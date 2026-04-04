
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDocumentExclusion(phaseId: string | undefined) {
  const [excludedDocuments, setExcludedDocuments] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchExcludedDocuments = useCallback(async () => {
    if (!phaseId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('excluded_documents')
        .select('document_name')
        .eq('phase_id', phaseId);

      if (error) {
        console.error('Error fetching excluded documents:', error);
        toast.error('Failed to load document exclusions');
        return;
      }

      const excludedNames = new Set(data?.map(doc => doc.document_name) || []);
      setExcludedDocuments(excludedNames);
    } catch (error) {
      console.error('Error in fetchExcludedDocuments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [phaseId]);

  useEffect(() => {
    fetchExcludedDocuments();
  }, [fetchExcludedDocuments]);

  const isDocumentExcluded = useCallback((documentName: string) => {
    return excludedDocuments.has(documentName);
  }, [excludedDocuments]);

  const refreshExclusions = useCallback(() => {
    fetchExcludedDocuments();
  }, [fetchExcludedDocuments]);

  return {
    isDocumentExcluded,
    refreshExclusions,
    isLoading
  };
}
