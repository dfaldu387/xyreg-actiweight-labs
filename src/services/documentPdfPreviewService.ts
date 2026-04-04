import { supabase } from '@/integrations/supabase/client';
import { DocToPdfConverterService, ContentItem } from './docToPdfConverterService';
import { format } from 'date-fns';

export class DocumentPdfPreviewService {
  /**
   * Generate a PDF preview for a document, including the Document Control header
   * populated with e-signature data, and open it in a new browser tab.
   *
   * Content source: the latest shared-for-review DOCX file (from PADT file_path).
   * If no shared-for-review file exists, a header-only PDF is generated with a note.
   */
  static async generatePreviewPdf(
    documentId: string,
    companyId: string,
    productId?: string
  ): Promise<void> {
    const cleanDocId = documentId.replace(/^template-/, '');

    // 1. Fetch PADT record for file_path (the shared-for-review DOCX) and document name
    const { data: padtRow } = await supabase
      .from('phase_assigned_document_template')
      .select('file_path, file_name, name, document_reference')
      .eq('id', cleanDocId)
      .maybeSingle();

    const rawFilePath = padtRow?.file_path || '';
    const documentName = padtRow?.name || 'Untitled Document';

    // Only use file_path if it's a review-draft (exported by "Send for Review")
    const reviewFilePath = rawFilePath.includes('/review-draft-') ? rawFilePath : '';

    // 2. Collect e-signature data
    const signatureEntries: { name: string; meaning: string; date: Date }[] = [];

    // Path A: Direct esign_records (inline review signing via OnlyOfficeReviewViewer)
    const { data: directRecords } = await supabase
      .from('esign_records')
      .select('full_legal_name, meaning, signed_at')
      .eq('document_id', cleanDocId);

    if (directRecords && directRecords.length > 0) {
      for (const r of directRecords) {
        signatureEntries.push({
          name: r.full_legal_name || '',
          meaning: r.meaning,
          date: r.signed_at ? new Date(r.signed_at) : new Date(),
        });
      }
    }

    // Path B: ESignPopup flow via esign_requests → esign_signers
    const { data: esignRequests } = await supabase
      .from('esign_requests')
      .select('id')
      .eq('document_id', cleanDocId);

    if (esignRequests && esignRequests.length > 0) {
      const requestIds = esignRequests.map(r => r.id);
      const { data: signerRows } = await supabase
        .from('esign_signers')
        .select('display_name, meaning, signed_at, status')
        .in('request_id', requestIds)
        .eq('status', 'signed');

      if (signerRows && signerRows.length > 0) {
        for (const s of signerRows) {
          signatureEntries.push({
            name: s.display_name || '',
            meaning: s.meaning,
            date: s.signed_at ? new Date(s.signed_at) : new Date(),
          });
        }
      }
    }

    // 3. Fetch company name
    let companyName = '';
    const { data: companyData } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .maybeSingle();
    companyName = companyData?.name || '';

    // Fetch document control data (from studio draft or assignment)
    let studioDocControl: Record<string, any> | null = null;

    // Try loading document_control from studio draft via DS- reference
    if (padtRow?.document_reference?.startsWith('DS-')) {
      const { data: studioRow } = await supabase
        .from('document_studio_templates')
        .select('document_control')
        .eq('id', padtRow.document_reference.replace(/^DS-/, ''))
        .eq('company_id', companyId)
        .maybeSingle();
      studioDocControl = studioRow?.document_control as Record<string, any> | null || null;
    }

    const { data: dcAssignment } = await supabase
      .from('document_control_assignments')
      .select('control_data')
      .eq('document_id', cleanDocId)
      .eq('company_id', companyId)
      .maybeSingle();

    // Build pdfmake header
    const headerContent = this.buildPdfMakeHeader(
      signatureEntries, companyName, documentName,
      dcAssignment?.control_data as Record<string, any> | null,
      studioDocControl
    );

    // 4. If we have a review-draft DOCX → download and convert to PDF with header
    if (reviewFilePath) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('document-templates')
        .download(reviewFilePath);

      if (downloadError || !fileData) {
        throw new Error('Failed to download the shared-for-review document file');
      }

      const docxBlob = new Blob([fileData], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const pdfBlob = await DocToPdfConverterService.convertDocxToPdfWithHeader(docxBlob, headerContent);

      if (!pdfBlob) {
        throw new Error('Failed to convert document to PDF');
      }

      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      return;
    }

    // 5. No shared-for-review file — generate header-only PDF with note
    const pdfBlob = await this.generateHeaderOnlyPdf([
      ...headerContent,
      { text: '\n\nNo document has been shared for review yet.', italics: true, fontSize: 10, color: '#888888', margin: [0, 20, 0, 0] } as ContentItem,
    ]);

    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      return;
    }

    throw new Error('Failed to generate PDF preview');
  }

  /**
   * Generate a PDF from pdfmake content (header-only, no document body).
   */
  private static async generateHeaderOnlyPdf(content: ContentItem[]): Promise<Blob | null> {
    try {
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfMake = pdfMakeModule.default || pdfMakeModule;

      // vfs_fonts.js uses a global assignment pattern: it sets window.pdfMake.vfs
      const _global = typeof window !== 'undefined' ? window : globalThis;
      if (!(_global as any).pdfMake) {
        (_global as any).pdfMake = pdfMake;
      }

      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      const pdfFonts = pdfFontsModule.default || pdfFontsModule;

      if (pdfMake.vfs && Object.keys(pdfMake.vfs).length > 0) {
        // Already set via global side-effect
      } else if ((_global as any).pdfMake?.vfs && Object.keys((_global as any).pdfMake.vfs).length > 0) {
        pdfMake.vfs = (_global as any).pdfMake.vfs;
      } else if (pdfFonts?.pdfMake?.vfs) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
      } else if (pdfFonts?.vfs) {
        pdfMake.vfs = pdfFonts.vfs;
      } else {
        // Check for top-level .ttf keys
        const fontKeys = Object.keys(pdfFontsModule).filter(k => k.endsWith('.ttf'));
        if (fontKeys.length > 0) {
          const vfs: Record<string, string> = {};
          fontKeys.forEach(k => { vfs[k] = (pdfFontsModule as any)[k]; });
          pdfMake.vfs = vfs;
        } else {
          pdfMake.vfs = {};
        }
      }

      // Build font mapping
      const fonts = {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: pdfMake.vfs['Roboto-Bold.ttf'] ? 'Roboto-Bold.ttf' : 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: pdfMake.vfs['Roboto-BoldItalic.ttf'] ? 'Roboto-BoldItalic.ttf' : 'Roboto-MediumItalic.ttf',
        },
      };

      return new Promise((resolve, reject) => {
        try {
          const docDefinition = {
            content,
            defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.4 },
            pageSize: 'A4' as const,
            pageMargins: [40, 60, 40, 60] as [number, number, number, number],
          };
          const pdfDocGenerator = pdfMake.createPdf(docDefinition, null, fonts, pdfMake.vfs);
          pdfDocGenerator.getBlob((blob: Blob) => {
            if (blob && blob.size > 0) resolve(blob);
            else reject(new Error('Generated PDF is empty'));
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      console.error('Failed to generate header-only PDF:', error);
      return null;
    }
  }

  /**
   * Build a pdfmake content array for the Document Control header.
   */
  private static buildPdfMakeHeader(
    signatureEntries: { name: string; meaning: string; date: Date }[],
    companyName: string,
    documentName: string,
    controlAssignment: Record<string, any> | null,
    studioDocControl: Record<string, any> | null
  ): ContentItem[] {
    const content: ContentItem[] = [];

    const fmtDate = (d: Date | string | undefined) => {
      if (!d) return '';
      try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return String(d); }
    };

    // Resolve document control fields from either source
    const dc = studioDocControl || {};
    const ca = controlAssignment || {};

    const sopNumber = dc.sopNumber || ca.sopNumber || '';
    const docTitle = dc.documentTitle || documentName || '';
    const version = dc.version || ca.version || '';
    const effectiveDate = dc.effectiveDate ? fmtDate(dc.effectiveDate) : '';
    const documentOwner = dc.documentOwner || ca.documentOwner || '';

    const gray = '#f3f4f6';
    const darkGray = '#e5e7eb';

    // --- Company Name + Document Title ---
    if (companyName) {
      content.push({ text: companyName, bold: true, fontSize: 14, margin: [0, 0, 0, 4] } as ContentItem);
    }
    if (docTitle) {
      content.push({ text: docTitle, bold: true, fontSize: 11, margin: [0, 0, 0, 10] } as ContentItem);
    }

    // --- Document Control Info Table ---
    const infoRows: ContentItem[][] = [];
    const makeInfoRow = (label: string, value: string): ContentItem[] => [
      { text: label, bold: true, fontSize: 10, fillColor: gray } as ContentItem,
      { text: value, fontSize: 10 } as ContentItem,
    ];

    if (sopNumber) infoRows.push(makeInfoRow('SOP Number', sopNumber));
    infoRows.push(makeInfoRow('Document Title', docTitle));
    if (version) infoRows.push(makeInfoRow('Version', version));
    if (effectiveDate) infoRows.push(makeInfoRow('Effective Date', effectiveDate));
    if (documentOwner) infoRows.push(makeInfoRow('Document Owner', documentOwner));

    if (infoRows.length > 0) {
      content.push({
        table: {
          widths: ['30%', '70%'],
          body: infoRows,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#999999',
          vLineColor: () => '#999999',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        margin: [0, 0, 0, 8],
      } as unknown as ContentItem);
    }

    // --- Approval / Signature Table ---
    const meaningLabels: Record<string, string> = {
      author: 'Prepared by\n(Name/Signature)',
      reviewer: 'Reviewed by\n(Name/Signature)',
      approver: 'Approved by\n(Name/Signature)',
    };

    const fmtTimestamp = (d: Date | string | undefined) => {
      if (!d) return '';
      try {
        const dt = new Date(d);
        return format(dt, 'dd/MM/yyyy HH:mm');
      } catch { return String(d); }
    };

    // Always show all 3 columns; fill in data from signatures if available
    const signMap = new Map(signatureEntries.map(e => [e.meaning, e]));

    const columns: { header: string; name: string; timestamp: string }[] = [
      {
        header: meaningLabels.author,
        name: signMap.get('author')?.name || '',
        timestamp: fmtTimestamp(signMap.get('author')?.date),
      },
      {
        header: meaningLabels.reviewer,
        name: signMap.get('reviewer')?.name || '',
        timestamp: fmtTimestamp(signMap.get('reviewer')?.date),
      },
      {
        header: meaningLabels.approver,
        name: signMap.get('approver')?.name || '',
        timestamp: fmtTimestamp(signMap.get('approver')?.date),
      },
    ];

    // Build table rows
    const headerRow: ContentItem[] = columns.map(col => ({
      text: col.header, bold: true, fontSize: 9, fillColor: darkGray,
    }));

    const dataRow: ContentItem[] = columns.map(col => {
      if (!col.name) return { text: '', fontSize: 9 } as ContentItem;
      return {
        text: [
          { text: col.name + '\n', fontSize: 9, bold: true },
          { text: col.timestamp, fontSize: 8, color: '#666666' },
        ],
      } as ContentItem;
    });

    const colWidths = columns.map(() => `${Math.floor(100 / columns.length)}%`);

    content.push({
      table: {
        widths: colWidths,
        body: [headerRow, dataRow],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#999999',
        vLineColor: () => '#999999',
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
      margin: [0, 0, 0, 20],
    } as unknown as ContentItem);

    return content;
  }
}
