import React, { useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCIDocumentMetadata } from '@/hooks/useCIDocumentMetadata';
import { CIPropertyPanel } from './CIPropertyPanel';
import { cn } from '@/lib/utils';

interface DocumentConfigPanelProps {
  documentId?: string | null;
  companyId?: string;
  productId?: string;
  showSectionNumbers?: boolean;
  onShowSectionNumbersChange?: (show: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** Notify parent when the Document↔Record toggle changes, so the body header re-renders immediately. */
  onIsRecordChange?: (isRecord: boolean) => void;
}

export function DocumentConfigPanel({
  documentId,
  companyId,
  productId,
  showSectionNumbers,
  onShowSectionNumbersChange,
  disabled = false,
  className,
  onIsRecordChange,
}: DocumentConfigPanelProps) {
  const { metadata, isLoading, updateField } = useCIDocumentMetadata(
    documentId || null,
    companyId
  );

  useEffect(() => {
    if (metadata && onIsRecordChange) {
      onIsRecordChange(metadata.is_record ?? false);
    }
  }, [metadata?.is_record, onIsRecordChange]);

  if (!documentId) {
    return (
      <div className={cn('bg-background flex flex-col w-[400px] border-r shrink-0', className)}>
        <div className="px-3 py-2 border-b text-sm font-medium text-muted-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Configure</span>
        </div>
        <div className="p-4 text-xs text-muted-foreground">
          Save the draft once to enable inline configuration.
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-background flex flex-col w-[400px] border-r shrink-0', className)}>
      <div className="px-3 py-2 border-b text-sm font-medium text-muted-foreground flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <span>Configure</span>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && !metadata ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading metadata…
          </div>
        ) : !metadata ? (
          <div className="py-10 px-4 text-center text-xs text-muted-foreground space-y-2">
            <div>No metadata is linked to this draft yet.</div>
            <div className="text-[11px]">Save the draft from a phase to enable inline configuration.</div>
          </div>
        ) : (
          <CIPropertyPanel
            documentId={metadata.id}
            companyId={companyId || ''}
            productId={metadata.product_id || productId || undefined}
            phaseId={metadata.phase_id || undefined}
            name={metadata.name}
            status={metadata.status}
            dueDate={metadata.due_date || undefined}
            documentType={metadata.document_type || undefined}
            section={metadata.sub_section || undefined}
            sectionId={metadata.section_ids?.[0] || undefined}
            authorsIds={metadata.authors_ids || []}
            referenceDocumentIds={metadata.reference_document_ids || []}
            version={metadata.version || undefined}
            tags={metadata.tags || []}
            isRecord={metadata.is_record ?? undefined}
            date={metadata.date || undefined}
            isCurrentEffectiveVersion={metadata.is_current_effective_version ?? undefined}
            needTemplateUpdate={metadata.need_template_update ?? undefined}
            reviewerGroupIds={metadata.reviewer_group_ids || []}
            recordId={metadata.record_id || undefined}
            nextReviewDate={metadata.next_review_date || undefined}
            documentNumber={metadata.document_number || undefined}
            showSectionNumbers={showSectionNumbers}
            onFieldChange={async (field, value) => {
              if (field === 'showSectionNumbers') {
                onShowSectionNumbersChange?.(value as boolean);
                return;
              }
              await updateField(field, value);
            }}
            disabled={disabled}
          />
        )}
      </ScrollArea>
    </div>
  );
}
