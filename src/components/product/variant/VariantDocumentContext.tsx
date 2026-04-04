import React, { createContext, useContext } from 'react';
import { VariantDocumentLink } from '@/hooks/useVariantDocuments';

interface VariantDocumentContextValue {
  isVariant: boolean;
  masterDeviceName: string | null;
  links: VariantDocumentLink[];
  getDocumentInheritanceStatus: (documentId: string) => {
    linkId: string;
    isInherited: boolean;
    isOverridden: boolean;
    masterDocumentName: string;
  } | null;
}

const VariantDocumentContext = createContext<VariantDocumentContextValue>({
  isVariant: false,
  masterDeviceName: null,
  links: [],
  getDocumentInheritanceStatus: () => null,
});

export const useVariantDocumentContext = () => useContext(VariantDocumentContext);

export function VariantDocumentProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: VariantDocumentContextValue;
}) {
  return (
    <VariantDocumentContext.Provider value={value}>
      {children}
    </VariantDocumentContext.Provider>
  );
}
