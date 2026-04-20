import { useState, useEffect } from 'react';
import { documentTypeService, DocumentType } from '@/services/documentTypeService';

// Default document types to show when no custom types are configured
const DEFAULT_DOCUMENT_TYPES = [
  'Standard',
  'Regulatory',
  'Technical',
  'Clinical',
  'Quality',
  'Design',
  'SOP',
  'Report',
  'Manual'
];

interface UseDocumentTypesResult {
  documentTypes: string[];
  documentTypeRecords: DocumentType[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDocumentTypes(companyId: string | undefined): UseDocumentTypesResult {
  const [documentTypeRecords, setDocumentTypeRecords] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocumentTypes = async () => {
    if (!companyId) {
      setDocumentTypeRecords([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const types = await documentTypeService.getCompanyDocumentTypes(companyId);
      setDocumentTypeRecords(types);
    } catch (err) {
      console.error('Error fetching document types:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch document types'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, [companyId]);

  // If company has custom types, use them; otherwise use defaults
  const documentTypes = documentTypeRecords.length > 0
    ? documentTypeRecords.map(t => t.name)
    : DEFAULT_DOCUMENT_TYPES;

  return {
    documentTypes,
    documentTypeRecords,
    isLoading,
    error,
    refetch: fetchDocumentTypes
  };
}
