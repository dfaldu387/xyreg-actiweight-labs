import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileEdit, BookOpen } from 'lucide-react';
import { getSOPContentByName, SOPFullContent } from '@/data/sopFullContent';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';

interface SOPTemplatePreviewDialogProps {
  template: any;
  isOpen: boolean;
  onClose: () => void;
  onDraftCreated?: () => void;
  companyId: string;
  companyName: string;
}

export function SOPTemplatePreviewDialog({ template, isOpen, onClose, onDraftCreated, companyId, companyName }: SOPTemplatePreviewDialogProps) {
  const [showCIDialog, setShowCIDialog] = useState(false);

  if (!template) return null;

  const sopContent: SOPFullContent | null = getSOPContentByName(template.name);

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

  return (
    <>
      <Dialog open={isOpen && !showCIDialog} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg">{template.name}</DialogTitle>
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 -mr-4">
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
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button 
              onClick={() => setShowCIDialog(true)}
              disabled={!sopContent}
              className="gap-2"
            >
              <FileEdit className="h-4 w-4" />
              Generate CI Doc
            </Button>
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
