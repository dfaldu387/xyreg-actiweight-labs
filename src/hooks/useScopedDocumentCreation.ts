
import { useState } from 'react';
import { DocumentCreationService, DocumentCreationParams } from '@/services/documentCreationService';

/**
 * Hook for creating documents with proper scope and table routing
 */
export const useScopedDocumentCreation = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createDocument = async (params: DocumentCreationParams): Promise<string | null> => {
    setIsCreating(true);
    try {
      return await DocumentCreationService.createDocument(params);
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createDocument,
    isCreating
  };
};
