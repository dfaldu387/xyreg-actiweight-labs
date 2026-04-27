import { supabase } from '@/integrations/supabase/client';

/**
 * Extract text from uploaded documents (PDF, DOCX, XLSX, TXT)
 * Uses PDF.js for high-fidelity page-by-page text extraction from PDFs.
 */
export async function extractTextFromChecklistFile(file: File): Promise<string> {
  const { type, name } = file;

  // Plain text
  if (type === 'text/plain' || name.endsWith('.txt') || name.endsWith('.csv')) {
    return await file.text();
  }

  // XLSX — client-side with xlsx library
  if (type.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const lines: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      lines.push(`--- Sheet: ${sheetName} ---`);
      lines.push(csv);
    }
    return lines.join('\n');
  }

  // DOCX — client-side with mammoth
  if (type.includes('wordprocessingml') || type.includes('msword') || name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }

  // PDF — use PDF.js for client-side page-by-page text extraction
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return await extractPdfTextWithPdfJs(file);
  }

  throw new Error(`Unsupported file type: ${type || name}`);
}

/**
 * Convenience wrapper: extract text from a Blob (e.g. downloaded from storage)
 * by wrapping it in a File so the same extraction pipeline applies.
 */
export async function extractTextFromBlob(blob: Blob, fileName: string): Promise<string> {
  const file = new File([blob], fileName, { type: blob.type || guessMimeFromName(fileName) });
  return extractTextFromChecklistFile(file);
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.csv')) return 'text/csv';
  return '';
}

/**
 * Extract text from PDF using PDF.js (pdfjs-dist) page by page.
 * Falls back to the edge function if PDF.js extraction yields low-quality text.
 */
async function extractPdfTextWithPdfJs(file: File): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    const version = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.mjs`;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      if (pageText.trim()) {
        pageTexts.push(pageText);
      }
    }

    const fullText = pageTexts.join('\n\n');

    // Check if extracted text is meaningful (not just metadata)
    if (isLowQualityText(fullText)) {
      console.warn('PDF.js extracted low-quality text, falling back to edge function');
      return await extractPdfViaEdgeFunction(file);
    }

    return fullText;
  } catch (err) {
    console.warn('PDF.js extraction failed, falling back to edge function:', err);
    return await extractPdfViaEdgeFunction(file);
  }
}

/**
 * Detect if extracted text is mostly metadata/gibberish rather than real content.
 */
function isLowQualityText(text: string): boolean {
  if (!text || text.trim().length < 100) return true;
  
  // Check for metadata-heavy patterns
  const metadataPatterns = ['BitsPerComponent', 'CDEFGHIJSTUVWXYZcdefghijstuvwxyz', 'ViewerPreferences', 'ModDate(D:'];
  const metadataHits = metadataPatterns.filter(p => text.includes(p)).length;
  if (metadataHits >= 2) return true;

  // If average word length is too high (gibberish), flag it
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 20) return true;
  const avgLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  if (avgLen > 20) return true;

  return false;
}

/**
 * Fallback: use the existing edge function for server-side PDF extraction.
 */
async function extractPdfViaEdgeFunction(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('action', 'extract_text');

  const { data, error } = await supabase.functions.invoke('ai-document-analyzer', {
    body: formData,
  });

  if (error) throw new Error(`PDF extraction failed: ${error.message}`);
  return data?.extracted_text || '';
}
