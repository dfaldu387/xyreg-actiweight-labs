import React, { useState, useEffect } from 'react';
import { ControlPanel, ControlPanelProps } from './ControlPanel';
import { CIPropertyPanel } from './CIPropertyPanel';
import { useCIDocumentMetadata } from '@/hooks/useCIDocumentMetadata';

interface DocumentEditorSidebarProps {
  // Sidebar collapse state
  collapsed: boolean;
  onToggleCollapse: () => void;

  // CI metadata lookup
  ciDocumentId: string | null;
  ciCompanyId?: string;
  productId?: string;
  showCIProperties?: boolean;

  // All ControlPanel props except reference doc ones (managed internally)
  controlPanelProps: Omit<ControlPanelProps, 'selectedReferenceIds' | 'onReferenceSelectionChange'>;
}

export function DocumentEditorSidebar({
  collapsed,
  onToggleCollapse,
  ciDocumentId,
  ciCompanyId,
  productId,
  showCIProperties = true,
  controlPanelProps,
}: DocumentEditorSidebarProps) {
  const { metadata: ciMetadata, updateField: updateCIField } = useCIDocumentMetadata(
    ciDocumentId,
    ciCompanyId
  );

  const [selectedReferenceDocIds, setSelectedReferenceDocIds] = useState<string[]>([]);

  // Sync reference doc IDs from CI metadata
  useEffect(() => {
    if (ciMetadata?.reference_document_ids) {
      setSelectedReferenceDocIds(ciMetadata.reference_document_ids);
    }
  }, [ciMetadata?.reference_document_ids]);

  return (
    <>
      {/* Collapsible Sidebar */}
      {!collapsed && (
        <div className="w-80 min-w-[280px] max-w-[320px] h-full border-r flex flex-col overflow-y-auto shrink-0">
          <ControlPanel
            {...controlPanelProps}
            selectedReferenceIds={selectedReferenceDocIds}
            onReferenceSelectionChange={(ids) => {
              setSelectedReferenceDocIds(ids);
              if (ciDocumentId) {
                updateCIField('reference_document_ids', ids);
              }
            }}
          />
          {showCIProperties && ciMetadata && (
            <CIPropertyPanel
              documentId={ciMetadata.id}
              companyId={ciCompanyId || ''}
              productId={ciMetadata.product_id || productId || undefined}
              phaseId={ciMetadata.phase_id || undefined}
              name={ciMetadata.name}
              status={ciMetadata.status}
              dueDate={ciMetadata.due_date || undefined}
              documentType={ciMetadata.document_type || undefined}
              section={ciMetadata.sub_section || undefined}
              sectionId={ciMetadata.section_ids?.[0] || undefined}
              authorsIds={ciMetadata.authors_ids || []}
              referenceDocumentIds={ciMetadata.reference_document_ids || []}
              onFieldChange={updateCIField}
              disabled={controlPanelProps.disabled}
            />
          )}
        </div>
      )}

      {/* Sidebar toggle */}
      <button
        onClick={onToggleCollapse}
        className="w-5 shrink-0 flex items-center justify-center border-r bg-muted/30 hover:bg-muted transition-colors cursor-pointer"
        title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        {collapsed ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        )}
      </button>
    </>
  );
}
