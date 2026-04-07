import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { DocumentStudioPersistenceService, DocumentStudioData } from '@/services/documentStudioPersistenceService';
import { toast } from 'sonner';
import { Building2, Box, Layers, FileEdit, Loader2, Check, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

type DocScope = 'enterprise' | 'device' | 'phase';

export interface SaveContentAsDocCIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  htmlContent: string;
  templateIdKey: string;
  companyId: string;
  companyName: string;
  productId?: string;
  defaultScope?: DocScope;
  onDocumentCreated?: (docId: string, docName: string, docType: string) => void;
}

export function SaveContentAsDocCIDialog({
  open,
  onOpenChange,
  title,
  htmlContent,
  templateIdKey,
  companyId,
  companyName,
  productId,
  defaultScope = 'enterprise',
  onDocumentCreated,
}: SaveContentAsDocCIDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<DocScope>(defaultScope);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [phases, setPhases] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [savedStudioId, setSavedStudioId] = useState<string | null>(null);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (scope === 'phase' && companyId) {
      supabase
        .from('company_chosen_phases')
        .select('position, company_phases!inner(id, name)')
        .eq('company_id', companyId)
        .order('position')
        .then(({ data }) => {
          const mapped = (data || []).map((cp: any) => ({
            id: cp.company_phases.id,
            name: cp.company_phases.name,
          }));
          setPhases(mapped);
          if (mapped.length > 0 && !selectedPhaseId) setSelectedPhaseId(mapped[0].id);
        });
    }
  }, [scope, companyId]);

  const handleSave = async () => {
    const resolvedContent = htmlContent.trim() || '<p>[Document content pending]</p>';
    setIsSaving(true);
    try {
      const docScope = scope === 'enterprise' ? 'company' : 'product';
      const scopeProductId = scope !== 'enterprise' ? productId : undefined;

      // Step 1: Create the CI first to get a stable UUID
      const syncResult = await DocumentStudioPersistenceService.syncToDocumentCI({
        companyId,
        productId: scopeProductId,
        phaseId: scope === 'phase' ? selectedPhaseId : undefined,
        name: title,
        documentReference: templateIdKey,
        documentScope: docScope === 'company' ? 'company_document' : 'product_document',
      });
      if (!syncResult.success || !syncResult.id) {
        throw new Error(syncResult.error || 'Failed to create Document CI record');
      }

      const ciUUID = syncResult.id;

      // Step 2: Save studio draft using the CI UUID as template_id (single identity)
      const sections = [
        {
          id: 'exported-content',
          title,
          content: [{ id: 'content-1', type: 'paragraph', content: resolvedContent }],
          order: 0,
        },
      ];

      const existing = await DocumentStudioPersistenceService.loadTemplate(
        companyId, ciUUID, scopeProductId
      );

      const studioData: DocumentStudioData = {
        ...(existing.data?.id ? { id: existing.data.id } : {}),
        company_id: companyId,
        product_id: scopeProductId,
        template_id: ciUUID,
        name: title,
        type: 'Technical',
        sections,
        metadata: { source: 'content-export', templateIdKey, ciId: ciUUID },
      };

      const saveResult = await DocumentStudioPersistenceService.saveTemplate(studioData);
      if (!saveResult.success || !saveResult.id) {
        throw new Error(saveResult.error || 'Failed to save studio template');
      }

      // No rebinding needed — CI UUID is the template_id from the start

      setSavedStudioId(saveResult.id);
      setSavedTemplateId(ciUUID);
      queryClient.invalidateQueries({ queryKey: ['company-documents', companyId] });
      toast.success('Document created successfully');

      if (onDocumentCreated) {
        handleClose();
        onDocumentCreated(ciUUID, title, 'Report');
      }
    } catch (err: any) {
      console.error('Save as Doc CI failed:', err);
      toast.error(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatHtmlContent = (content: string): string => {
    let formatted = content;

    // Convert markdown-style headers (### heading) to HTML if not already
    formatted = formatted.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Convert numbered subsections like "6.1 Title" to proper headings — only if content has no existing h3 tags
    if (!/<h3[\s>]/i.test(formatted)) {
      formatted = formatted.replace(/^(\d+\.\d+(?:\.\d+)?)\s+([A-Z][^\n<]{2,})$/gm, '<h3>$1 $2</h3>');
    }

    // Convert markdown bullet lists (- item or • item) to proper HTML lists
    formatted = formatted.replace(/((?:^|\n)(?:\s*[-•]\s+.+\n?)+)/g, (match) => {
      const items = match.trim().split(/\n/).map(line => {
        const text = line.replace(/^\s*[-•]\s+/, '').trim();
        return text ? `<li>${text}</li>` : '';
      }).filter(Boolean).join('\n');
      return `<ul>\n${items}\n</ul>`;
    });

    // Convert markdown tables to HTML tables
    formatted = formatted.replace(/((?:\|[^\n]+\|\n?)+)/g, (match) => {
      const rows = match.trim().split('\n').filter(row => row.trim());
      if (rows.length < 2) return match;

      // Check if second row is separator (|---|---|)
      const isSeparator = (row: string) => /^\|[\s-:|]+\|$/.test(row.trim());
      const hasSeparator = rows.length > 1 && isSeparator(rows[1]);

      let html = '<table>\n';
      rows.forEach((row, i) => {
        if (hasSeparator && i === 1) return; // skip separator row
        const cells = row.split('|').filter(cell => cell.trim() !== '');
        const tag = (hasSeparator && i === 0) ? 'th' : 'td';
        const rowTag = (hasSeparator && i === 0) ? 'thead' : (i === 2 || (!hasSeparator && i === 0) ? 'tbody' : '');
        if (rowTag === 'thead') html += '<thead>\n';
        if (rowTag === 'tbody') html += '<tbody>\n';
        html += '<tr>';
        cells.forEach(cell => {
          html += `<${tag}>${cell.trim()}</${tag}>`;
        });
        html += '</tr>\n';
        if (hasSeparator && i === 0) html += '</thead>\n';
      });
      if (hasSeparator && rows.length > 2) html += '</tbody>\n';
      html += '</table>';
      return html;
    });

    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert newlines within plain text blocks to <br> for proper spacing
    // But don't add <br> after HTML tags
    formatted = formatted.replace(/([^>])\n([^<\n])/g, '$1<br>\n$2');

    return formatted;
  };

  const handleDownload = () => {
    const formattedContent = formatHtmlContent(htmlContent);
    const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.7; color: #1a1a1a; }
h1 { color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px; margin-top: 32px; font-size: 1.8em; }
h2 { color: #374151; margin-top: 28px; font-size: 1.5em; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
h3 { color: #4B5563; margin-top: 20px; font-size: 1.2em; }
h4 { color: #6B7280; margin-top: 16px; font-size: 1.05em; }
p { margin: 8px 0; }
ul, ol { margin: 8px 0 16px 24px; padding: 0; }
li { margin: 4px 0; line-height: 1.6; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.95em; }
th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
th { background-color: #f3f4f6; font-weight: 600; }
tr:nth-child(even) { background-color: #f9fafb; }
img { max-width: 100%; height: auto; }
.meta { color: #666; font-size: 0.9em; margin-bottom: 24px; }
strong { font-weight: 600; }
</style></head>
<body><h1>${title}</h1>
<div class="meta">Generated: ${new Date().toLocaleDateString()}</div>
${formattedContent}</body></html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const html2pdf = (await import('html2pdf.js')).default;
      const formattedContent = formatHtmlContent(htmlContent);

      // Use iframe to fully isolate rendering from the main page
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;height:1px;opacity:0;pointer-events:none;z-index:-1;border:none;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        document.body.removeChild(iframe);
        throw new Error('Could not create render frame');
      }

      // Apply inline styles to HTML content for html2canvas compatibility
      let styledContent = formattedContent;
      styledContent = styledContent.replace(/<h1([^>]*)>/g, '<h1$1 style="color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:8px;font-size:18pt;margin-top:24px;font-family:Arial,sans-serif">');
      styledContent = styledContent.replace(/<h2([^>]*)>/g, '<h2$1 style="color:#374151;margin-top:20px;font-size:14pt;border-bottom:1px solid #ccc;padding-bottom:4px;font-family:Arial,sans-serif">');
      styledContent = styledContent.replace(/<h3([^>]*)>/g, '<h3$1 style="color:#4B5563;margin-top:16px;font-size:12pt;font-family:Arial,sans-serif;font-weight:bold">');
      styledContent = styledContent.replace(/<h4([^>]*)>/g, '<h4$1 style="color:#6B7280;margin-top:12px;font-size:11pt;font-family:Arial,sans-serif;font-weight:bold">');
      styledContent = styledContent.replace(/<p([^>]*)>/g, '<p$1 style="margin:6px 0;line-height:1.7;font-family:Arial,sans-serif;font-size:11pt">');
      styledContent = styledContent.replace(/<ul([^>]*)>/g, '<ul$1 style="margin:6px 0 12px 24px;padding:0;font-family:Arial,sans-serif;font-size:11pt">');
      styledContent = styledContent.replace(/<li([^>]*)>/g, '<li$1 style="margin:3px 0;line-height:1.5">');
      styledContent = styledContent.replace(/<table([^>]*)>/g, '<table$1 style="width:100%;border-collapse:collapse;margin:12px 0;font-size:10pt;font-family:Arial,sans-serif">');
      styledContent = styledContent.replace(/<th([^>]*)>/g, '<th$1 style="border:1px solid #999;padding:6px 8px;text-align:left;background-color:#e5e7eb;font-weight:600">');
      styledContent = styledContent.replace(/<td([^>]*)>/g, '<td$1 style="border:1px solid #999;padding:6px 8px;text-align:left">');

      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html><html><head></head><body style="margin:0;padding:20px 0;font-family:Arial,sans-serif;line-height:1.7;color:#1a1a1a;font-size:11pt;background:white">
        <h1 style="color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:8px;font-size:18pt;margin-top:0;font-family:Arial,sans-serif">${title}</h1>
        <div style="color:#666;font-size:9pt;margin-bottom:16px;font-family:Arial,sans-serif">Generated: ${new Date().toLocaleDateString()}</div>
        ${styledContent}
      </body></html>`);
      iframeDoc.close();

      await new Promise(resolve => setTimeout(resolve, 300));

      await html2pdf()
        .set({
          margin: [15, 12, 15, 12],
          filename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.85 },
          html2canvas: { scale: 1.5, useCORS: true, logging: false, windowWidth: 794 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        } as any)
        .from(iframeDoc.body)
        .save();

      document.body.removeChild(iframe);
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleOpenInStudio = () => {
    if (savedTemplateId) {
      const params = new URLSearchParams();
      params.set('templateId', savedTemplateId);
      if (scope !== 'enterprise' && productId) params.set('productId', productId);
      navigate(`/app/company/${encodeURIComponent(companyName)}/document-studio?${params.toString()}`);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSavedStudioId(null);
    setSavedTemplateId(null);
    setScope(defaultScope);
    setSelectedPhaseId('');
    onOpenChange(false);
  };

  const isSaveDisabled = isSaving || (scope === 'phase' && !selectedPhaseId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Document</DialogTitle>
          <DialogDescription>
            Export "{title}" as a document in Document Studio.
          </DialogDescription>
        </DialogHeader>

        {!savedStudioId ? (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Location of Document CI</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as DocScope)} className="space-y-2">
                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="enterprise" />
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Enterprise Level</p>
                    <p className="text-xs text-muted-foreground">Company-wide document</p>
                  </div>
                </label>
                {productId && (
                  <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="device" />
                    <Box className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Device Specific (No Phase)</p>
                      <p className="text-xs text-muted-foreground">Linked to this device</p>
                    </div>
                  </label>
                )}
                {productId && (
                  <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="phase" />
                    <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Phase Specific</p>
                      <p className="text-xs text-muted-foreground">Linked to a lifecycle phase</p>
                    </div>
                  </label>
                )}
              </RadioGroup>
            </div>

            {scope === 'phase' && (
              <div className="space-y-2">
                <Label className="text-sm">Select Phase</Label>
                <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
                  <SelectTrigger><SelectValue placeholder="Choose a lifecycle phase..." /></SelectTrigger>
                  <SelectContent>
                    {phases.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaveDisabled}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Document
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              Document CI saved successfully
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="h-auto py-4 flex flex-col items-center gap-2">
                <Download className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-sm font-medium">{isGeneratingPdf ? 'Downloading PDF...' : 'Download PDF'}</p>
                  <p className="text-xs text-muted-foreground">Save as PDF file</p>
                </div>
              </Button>
              <Button variant="outline" onClick={handleOpenInStudio} className="h-auto py-4 flex flex-col items-center gap-2">
                <FileEdit className="h-5 w-5" />
                <div className="text-center">
                  <p className="text-sm font-medium">Edit in Studio</p>
                  <p className="text-xs text-muted-foreground">Open in Document Studio</p>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
