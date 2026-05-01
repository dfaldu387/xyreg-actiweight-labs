import React, { useState, useEffect } from 'react';
import { ControlPanel, ControlPanelProps } from './ControlPanel';
import { CIPropertyPanel } from './CIPropertyPanel';
import { useCIDocumentMetadata } from '@/hooks/useCIDocumentMetadata';

interface DocumentEditorSidebarProps {
  // Sidebar collapse state
  collapsed: boolean;
  onToggleCollapse: () => void;

  // Optional width override for wider layouts (e.g. draft drawer)
  widthClassName?: string;

  // CI metadata lookup
  ciDocumentId: string | null;
  ciCompanyId?: string;
  productId?: string;
  showCIProperties?: boolean;

  // Expose is_record, record_id, and next_review_date state to parent
  onIsRecordChange?: (isRecord: boolean) => void;
  onRecordIdChange?: (recordId: string | null) => void;
  onNextReviewDateChange?: (nextReviewDate: string | null) => void;
  onDocumentNumberChange?: (documentNumber: string | null) => void;
  onChangeControlRefChange?: (changeControlRef: string | null) => void;
  onShowSectionNumbersChange?: (show: boolean) => void;
  showSectionNumbers?: boolean;

  // Edit mode
  isEditing?: boolean;
  onEditModeChange?: (editing: boolean) => void;

  // All ControlPanel props except reference doc ones (managed internally)
  controlPanelProps: Omit<ControlPanelProps, 'selectedReferenceIds' | 'onReferenceSelectionChange' | 'isEditing' | 'onEditModeChange'>;
}

export function DocumentEditorSidebar({
  collapsed,
  onToggleCollapse,
  widthClassName,
  ciDocumentId,
  ciCompanyId,
  productId,
  showCIProperties = true,
  onIsRecordChange,
  onRecordIdChange,
  onNextReviewDateChange,
  onDocumentNumberChange,
  onChangeControlRefChange,
  onShowSectionNumbersChange,
  showSectionNumbers,
  isEditing,
  onEditModeChange,
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

  // Notify parent of is_record changes
  useEffect(() => {
    if (ciMetadata && onIsRecordChange) {
      onIsRecordChange(ciMetadata.is_record ?? false);
    }
  }, [ciMetadata?.is_record, onIsRecordChange]);

  // Notify parent of record_id changes
  useEffect(() => {
    if (ciMetadata && onRecordIdChange) {
      onRecordIdChange(ciMetadata.record_id ?? null);
    }
  }, [ciMetadata?.record_id, onRecordIdChange]);

  // Notify parent of next_review_date changes
  useEffect(() => {
    if (ciMetadata && onNextReviewDateChange) {
      onNextReviewDateChange(ciMetadata.next_review_date ?? null);
    }
  }, [ciMetadata?.next_review_date, onNextReviewDateChange]);

  // Notify parent of document_number changes
  useEffect(() => {
    if (ciMetadata && onDocumentNumberChange) {
      onDocumentNumberChange(ciMetadata.document_number ?? null);
    }
  }, [ciMetadata?.document_number, onDocumentNumberChange]);

  // Notify parent of change_control_ref changes
  useEffect(() => {
    if (ciMetadata && onChangeControlRefChange) {
      onChangeControlRefChange(ciMetadata.change_control_ref ?? null);
    }
  }, [ciMetadata?.change_control_ref, onChangeControlRefChange]);

  return (
    <>
      {/* Collapsible Sidebar */}
      {!collapsed && (
        <div className={`${widthClassName || 'w-96 min-w-[320px] max-w-[384px]'} h-full border-r flex flex-col overflow-y-auto shrink-0`}>
          <ControlPanel
            {...controlPanelProps}
            selectedReferenceIds={selectedReferenceDocIds}
            onReferenceSelectionChange={(ids) => {
              setSelectedReferenceDocIds(ids);
              if (ciDocumentId) {
                updateCIField('reference_document_ids', ids);
              }
            }}
            isEditing={isEditing}
            onEditModeChange={onEditModeChange}
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
              version={ciMetadata.version || undefined}
              tags={ciMetadata.tags || []}
              isRecord={ciMetadata.is_record ?? undefined}
              date={ciMetadata.date || undefined}
              isCurrentEffectiveVersion={ciMetadata.is_current_effective_version ?? undefined}
              needTemplateUpdate={ciMetadata.need_template_update ?? undefined}
              reviewerGroupIds={ciMetadata.reviewer_group_ids || []}
              recordId={ciMetadata.record_id || undefined}
              nextReviewDate={ciMetadata.next_review_date || undefined}
              documentNumber={ciMetadata.document_number || undefined}
              changeControlRef={ciMetadata.change_control_ref || undefined}
              showSectionNumbers={showSectionNumbers}
              onFieldChange={async (field, value) => {
                if (field === 'showSectionNumbers') {
                  onShowSectionNumbersChange?.(value as boolean);
                  return;
                }
                await updateCIField(field, value);
              }}
              disabled={controlPanelProps.disabled}
            />
          )}
        </div>
      )}
    </>
  );
}
