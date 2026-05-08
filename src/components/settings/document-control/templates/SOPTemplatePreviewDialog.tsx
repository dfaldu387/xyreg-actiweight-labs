import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileEdit, BookOpen, Copy as CopyIcon, Loader2 } from 'lucide-react';
import { getSOPContentByName, SOPFullContent } from '@/data/sopFullContent';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { formatSopDisplayName } from '@/constants/sopAutoSeedTiers';
import { DocumentStudioPersistenceService, DocumentStudioData } from '@/services/documentStudioPersistenceService';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface SOPTemplatePreviewDialogProps {
  template: any;
  isOpen: boolean;
  onClose: () => void;
  onDraftCreated?: () => void;
  companyId: string;
  companyName: string;
  /** When true, hides the "Generate CI Doc" CTA — pure read-only preview. */
  viewOnly?: boolean;
}

export function SOPTemplatePreviewDialog({ template, isOpen, onClose, onDraftCreated, companyId, companyName, viewOnly = false }: SOPTemplatePreviewDialogProps) {
  const [showCIDialog, setShowCIDialog] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const queryClient = useQueryClient();

  if (!template) return null;

  const sopContent: SOPFullContent | null = getSOPContentByName(template.name);
  const displayName = formatSopDisplayName(template.name);

  const buildHtmlContent = (): string => {
    if (!sopContent) return `<h1>${template.name}</h1><p>${template.description || ''}</p>`;

    return sopContent.sections.map((section) => {
      let content = section.content;

      // Convert numbered sub-sections (e.g., "6.1 Title") to h3
      content = content.replace(/^(\d+\.\d+(?:\.\d+)?)\s+([^\n]+)/gm, '<h3>$1 $2</h3>');

      // Convert bullet lines (• or -) to proper HTML list
      content = content.replace(/((?:^|\n)\s*[•\-]\s+[^\n]+(?:\n\s*[•\-]\s+[^\n]+)*)/g, (match) => {
        const items = match.trim().split('\n').map(line => {
          const text = line.replace(/^\s*[•\-]\s+/, '').trim();
          return text ? `<li>${text}</li>` : '';
        }).filter(Boolean).join('\n');
        return `\n<ul>\n${items}\n</ul>\n`;
      });

      // Convert markdown tables (|...|) to HTML tables
      content = content.replace(/((?:\|[^\n]+\|\n?)+)/g, (match) => {
        const rows = match.trim().split('\n').filter(r => r.trim());
        if (rows.length < 2) return match;
        const isSep = (r: string) => /^\|[\s\-:|]+\|$/.test(r.trim());
        const hasSep = rows.length > 1 && isSep(rows[1]);
        let html = '<table>';
        rows.forEach((row, i) => {
          if (hasSep && i === 1) return;
          const cells = row.split('|').filter(c => c.trim() !== '');
          const tag = hasSep && i === 0 ? 'th' : 'td';
          if (hasSep && i === 0) html += '<thead>';
          if ((hasSep && i === 2) || (!hasSep && i === 0)) html += '<tbody>';
          html += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
          if (hasSep && i === 0) html += '</thead>';
        });
        if (hasSep && rows.length > 2) html += '</tbody>';
        html += '</table>';
        return html;
      });

      // Convert **bold** to <strong>
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Split remaining plain text by double newlines into paragraphs
      const parts = content.split(/\n{2,}/);
      content = parts.map(part => {
        const trimmed = part.trim();
        // Don't wrap if already an HTML block element
        if (/^<(h[1-6]|ul|ol|table|div|blockquote)/i.test(trimmed)) return trimmed;
        // Convert single newlines to <br>
        return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
      }).join('\n');

      return `<h2>${section.title}</h2>\n${content}`;
    }).join('\n');
  };

  const templateKey = `SOP-TPL-${template.name?.replace(/\s+/g, '-')}`;

  // One-click copy of this Enterprise Template into the company's Documents
  // tab. Each click creates a NEW document with the same name and content.
  // We bypass `syncToDocumentCI`'s reference-based idempotency by tagging
  // each copy with a unique `documentReference` (timestamped) so multiple
  // copies coexist instead of overwriting one shared row.
  const handleCopyToDocuments = async () => {
    if (!sopContent || !companyId) return;
    setIsCopying(true);
    try {
      const html = buildHtmlContent();
      const uniqueRef = `${templateKey}-COPY-${Date.now()}`;

      const syncResult = await DocumentStudioPersistenceService.syncToDocumentCI({
        companyId,
        name: template.name,
        documentReference: uniqueRef,
        documentScope: 'company_document',
        documentType: 'Manual',
      });
      if (!syncResult.success || !syncResult.id) {
        throw new Error(syncResult.error || 'Failed to create document');
      }
      const ciUUID = syncResult.id;

      const sections = [
        {
          id: 'exported-content',
          title: template.name,
          content: [{ id: 'content-1', type: 'paragraph', content: html }],
          order: 0,
        },
      ];

      const studioData: DocumentStudioData = {
        company_id: companyId,
        template_id: ciUUID,
        name: template.name,
        type: 'Manual',
        sections,
        metadata: { source: 'enterprise-template-copy', templateIdKey: uniqueRef, ciId: ciUUID },
      };

      const saveResult = await DocumentStudioPersistenceService.saveTemplate(studioData);
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save document content');
      }

      queryClient.invalidateQueries({ queryKey: ['company-documents', companyId] });
      toast.success(`Copied "${template.name}" to Documents`);
      onDraftCreated?.();
      onClose();
    } catch (err: any) {
      console.error('Copy to Documents failed:', err);
      toast.error(`Failed to copy: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showCIDialog} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg">{displayName}</DialogTitle>
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            )}
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-4">
            {sopContent ? (
              <div className="space-y-4 py-2">
                {sopContent.sections.map((section, idx) => (
                  <div key={section.id} className="border rounded-lg p-4 bg-muted/30">
                    <h3 className="font-semibold text-sm text-foreground mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No SOP content available for this template.</p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t shrink-0">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button
              variant="outline"
              onClick={handleCopyToDocuments}
              disabled={!sopContent || isCopying || !companyId}
              className="gap-2"
              title="Copy this template to the Documents tab with the same name and content"
            >
              {isCopying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              Copy to Documents
            </Button>
            {!viewOnly && (
              <Button
                onClick={() => setShowCIDialog(true)}
                disabled={!sopContent}
                className="gap-2"
              >
                <FileEdit className="h-4 w-4" />
                Generate CI Doc
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {companyId && (
        <SaveContentAsDocCIDialog
          open={showCIDialog}
          onOpenChange={(open) => {
            setShowCIDialog(open);
            if (!open) {
              onDraftCreated?.();
              onClose();
            }
          }}
          title={template.name}
          htmlContent={buildHtmlContent()}
          templateIdKey={templateKey}
          companyId={companyId}
          companyName={companyName || 'Company'}
          defaultScope="enterprise"
        />
      )}
    </>
  );
}
