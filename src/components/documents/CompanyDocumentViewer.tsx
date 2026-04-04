import React from 'react';
import { DocumentViewer } from '@/components/product/DocumentViewer';

interface CompanyDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    name: string;
    file_path?: string;
    file_name?: string;
    company_id?: string;
    document_type?: string;
    status?: string;
    description?: string;
    document_reference?: string;
  };
  companyId: string;
  companyRole: string;
}

export function CompanyDocumentViewer({
  open,
  onOpenChange,
  document,
  companyId,
  companyRole
}: CompanyDocumentViewerProps) {
  // Convert company document to the format expected by DocumentViewer
  const documentFile = document.file_path ? {
    path: document.file_path,
    name: document.file_name || document.name,
    type: undefined,
    size: undefined,
    uploadedAt: undefined
  } : null;

  // Enhanced document name with type and status information
  const enhancedDocumentName = `${document.name}${document.document_type ? ` (${document.document_type})` : ''}`;

  return (
    <DocumentViewer
      open={open}
      onOpenChange={onOpenChange}
      documentId={document.id}
      documentName={enhancedDocumentName}
      companyId={companyId}
      documentFile={documentFile}
      companyRole={companyRole}
      reviewerGroupId="default"
      documentReference={document.document_reference}
    />
  );
}