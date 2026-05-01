import React, { useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCIDocumentMetadata } from '@/hooks/useCIDocumentMetadata';
import { CIPropertyPanel } from './CIPropertyPanel';
import { cn } from '@/lib/utils';
import { TranslateSection } from '@/components/product/documents/configure/TranslateSection';
import { GenerateWorkInstructionSection } from '@/components/product/documents/configure/GenerateWorkInstructionSection';
import { LinkedWorkInstructionsSection } from '@/components/product/documents/configure/LinkedWorkInstructionsSection';
import { parseSopNumber, getSopTier } from '@/constants/sopAutoSeedTiers';

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
          <div className="space-y-3">
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
          <div className="px-3 pb-3 pt-1 space-y-2">
            <div className="border-t pt-3">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2 px-1">
                Derive new documents
              </div>
              <div className="space-y-2">
                <TranslateSection
                  sourceCiId={metadata.id}
                  sourceLanguage={(metadata as any).language ?? 'EN'}
                  sourceName={metadata.name}
                  sourceDocumentNumber={metadata.document_number ?? null}
                  onCreated={(newCiId) => {
                    window.dispatchEvent(new CustomEvent('xyreg:open-draft-by-id', { detail: { ciId: newCiId } }));
                  }}
                  disabled={disabled}
                />
                {(() => {
                  const isSop = (metadata.document_type ?? '').toUpperCase() === 'SOP';
                  if (!isSop) return null;
                  const sopKey = parseSopNumber(metadata.document_number)
                    ?? parseSopNumber(metadata.name);
                  const tier = getSopTier(metadata.document_number, metadata.name);
                  // Foundational (Tier-A) SOPs: show shared global WI catalog,
                  // not the per-company generator. Same SOP everywhere => same WIs.
                  if (tier === 'A' && sopKey) {
                    return (
                      <LinkedWorkInstructionsSection
                        sopTemplateKey={sopKey}
                        companyId={companyId || ''}
                        phaseId={metadata.phase_id ?? null}
                        onOpened={(ciId) => {
                          window.dispatchEvent(
                            new CustomEvent('xyreg:open-draft-by-id', { detail: { ciId } }),
                          );
                        }}
                      />
                    );
                  }
                  // Custom / non-foundational SOPs: per-company AI generation
                  // with auto-detected modules.
                  return (
                    <GenerateWorkInstructionSection
                      sourceCiId={metadata.id}
                      sourceName={metadata.name}
                      sourceDocumentNumber={metadata.document_number ?? null}
                      isSop={isSop}
                      onCreated={(newCiId) => {
                        window.dispatchEvent(
                          new CustomEvent('xyreg:open-draft-by-id', { detail: { ciId: newCiId } }),
                        );
                      }}
                      disabled={disabled}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
