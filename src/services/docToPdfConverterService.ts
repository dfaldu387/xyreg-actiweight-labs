import mammoth from 'mammoth';
import { toast } from 'sonner';

// Dynamic import for pdfmake to handle ESM/CJS compatibility
let pdfMakeInstance: any = null;
let pdfMakeFonts: Record<string, any> | null = null;

const initPdfMake = async () => {
  // If cached instance has valid fonts, reuse it
  if (pdfMakeInstance && pdfMakeInstance.vfs && Object.keys(pdfMakeInstance.vfs).length > 0) {
    return pdfMakeInstance;
  }

  try {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfMake = pdfMakeModule.default || pdfMakeModule;

    // vfs_fonts.js uses a global assignment pattern: it sets window.pdfMake.vfs
    // We MUST set window.pdfMake BEFORE importing vfs_fonts so the side-effect works
    const _global = typeof window !== 'undefined' ? window : globalThis;
    (_global as any).pdfMake = pdfMake;

    // Force re-import of vfs_fonts to trigger the global side-effect
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;

    // Try multiple ways to access vfs
    if (pdfMake.vfs && Object.keys(pdfMake.vfs).length > 0) {
      // Already set via global side-effect
    } else if ((_global as any).pdfMake?.vfs && Object.keys((_global as any).pdfMake.vfs).length > 0) {
      pdfMake.vfs = (_global as any).pdfMake.vfs;
    } else if (pdfFonts?.pdfMake?.vfs) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    } else if (pdfFonts?.vfs) {
      pdfMake.vfs = pdfFonts.vfs;
    } else {
      // The vfs_fonts module may export font files directly as top-level keys
      // (e.g. { 'Roboto-Regular.ttf': '...', 'Roboto-Bold.ttf': '...' })
      const fontKeys = Object.keys(pdfFontsModule).filter(k => k.endsWith('.ttf'));
      if (fontKeys.length > 0) {
        const vfs: Record<string, string> = {};
        fontKeys.forEach(k => { vfs[k] = (pdfFontsModule as any)[k]; });
        pdfMake.vfs = vfs;
      } else {
        console.warn('[pdfMake] Could not find vfs fonts, using empty vfs');
        pdfMake.vfs = {};
      }
    }

    // Map Roboto font variants — the vfs may have Medium instead of Bold
    // Store fonts separately to pass explicitly to createPdf()
    pdfMakeFonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: pdfMake.vfs['Roboto-Bold.ttf'] ? 'Roboto-Bold.ttf' : 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: pdfMake.vfs['Roboto-BoldItalic.ttf'] ? 'Roboto-BoldItalic.ttf' : 'Roboto-MediumItalic.ttf',
      },
    };
    pdfMake.fonts = pdfMakeFonts;

    pdfMakeInstance = pdfMake;
    return pdfMake;
  } catch (error) {
    console.error('[pdfMake] Failed to initialize:', error);
    throw error;
  }
};

export interface ConversionOptions {
  fileName?: string;
  quality?: number;
  format?: 'a4' | 'letter';
}

// Types for pdfmake content
export type ContentItem = string | ContentObject | ContentItem[];
interface ContentObject {
  text?: string | ContentItem[];
  style?: string | string[];
  bold?: boolean;
  italics?: boolean;
  decoration?: string;
  fontSize?: number;
  margin?: number[];
  ul?: ContentItem[];
  ol?: ContentItem[];
  table?: {
    body: ContentItem[][];
    widths?: (string | number)[];
  };
  layout?: string;
  link?: string;
  color?: string;
}

export class DocToPdfConverterService {
  /**
   * Check if a file is a DOC or DOCX file
   */
  static isDocFile(fileName: string, fileType?: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    const isDocExtension = lowerFileName.endsWith('.doc') || lowerFileName.endsWith('.docx');

    if (fileType) {
      const lowerFileType = fileType.toLowerCase();
      const isDocMimeType =
        lowerFileType.includes('msword') ||
        lowerFileType.includes('wordprocessingml') ||
        lowerFileType === 'application/msword' ||
        lowerFileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      return isDocExtension || isDocMimeType;
    }

    return isDocExtension;
  }

  /**
   * Check if a file is old .doc (binary) format vs .docx (XML/ZIP).
   * Old .doc files cannot be converted client-side — upload as-is.
   */
  static isOldDocFormat(fileName: string, fileType?: string): boolean {
    const lowerFileName = fileName.toLowerCase();
    if (lowerFileName.endsWith('.doc') && !lowerFileName.endsWith('.docx')) {
      return true;
    }
    if (fileType) {
      return fileType.toLowerCase() === 'application/msword';
    }
    return false;
  }

  /**
   * Check if file is a .docx file (convertible to PDF).
   * Returns true only for .docx, NOT old .doc files.
   */
  static isConvertibleDoc(fileName: string, fileType?: string): boolean {
    return this.isDocFile(fileName, fileType) && !this.isOldDocFormat(fileName, fileType);
  }

  /**
   * Parse HTML content from mammoth and convert to pdfmake document definition
   */
  private static htmlToPdfContent(htmlContent: string): ContentItem[] {
    const content: ContentItem[] = [];

    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Process body children
    const processNode = (node: Node): ContentItem | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          return text;
        }
        return null;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        // Process children first
        const children: ContentItem[] = [];
        element.childNodes.forEach(child => {
          const processed = processNode(child);
          if (processed !== null) {
            children.push(processed);
          }
        });

        switch (tagName) {
          case 'p': {
            if (children.length === 0) {
              return { text: ' ', margin: [0, 5, 0, 5] };
            }
            // When a single child (e.g. a bold object), use it directly and add margin
            if (children.length === 1 && typeof children[0] === 'object') {
              return { ...(children[0] as any), margin: [0, 5, 0, 5] };
            }
            return { text: children, margin: [0, 5, 0, 5] };
          }

          case 'h1':
            return { text: children, style: 'header1', margin: [0, 15, 0, 10] };

          case 'h2':
            return { text: children, style: 'header2', margin: [0, 12, 0, 8] };

          case 'h3':
            return { text: children, style: 'header3', margin: [0, 10, 0, 6] };

          case 'h4':
          case 'h5':
          case 'h6':
            return { text: children, style: 'header4', margin: [0, 8, 0, 4] };

          case 'strong':
          case 'b':
            return { text: children.length === 1 && typeof children[0] === 'string' ? children[0] : children, bold: true };

          case 'em':
          case 'i':
            return { text: children.length === 1 && typeof children[0] === 'string' ? children[0] : children, italics: true };

          case 'u':
            return { text: children.length === 1 && typeof children[0] === 'string' ? children[0] : children, decoration: 'underline' };

          case 's':
          case 'del':
          case 'strike':
            return { text: children.length === 1 && typeof children[0] === 'string' ? children[0] : children, decoration: 'lineThrough' };

          case 'a': {
            const href = element.getAttribute('href') || '';
            return { text: children, link: href, color: 'blue', decoration: 'underline' };
          }

          case 'ul': {
            const items: ContentItem[] = [];
            element.querySelectorAll(':scope > li').forEach(li => {
              const liContent = processNode(li);
              if (liContent) {
                items.push(liContent);
              }
            });
            return { ul: items, margin: [0, 5, 0, 5] };
          }

          case 'ol': {
            const items: ContentItem[] = [];
            element.querySelectorAll(':scope > li').forEach(li => {
              const liContent = processNode(li);
              if (liContent) {
                items.push(liContent);
              }
            });
            return { ol: items, margin: [0, 5, 0, 5] };
          }

          case 'li':
            return children.length === 1 ? children[0] : { text: children };

          case 'table': {
            const rows: ContentItem[][] = [];
            element.querySelectorAll('tr').forEach(tr => {
              const row: ContentItem[] = [];
              tr.querySelectorAll('td, th').forEach(cell => {
                const cellContent = processNode(cell);
                row.push(cellContent || '');
              });
              if (row.length > 0) {
                rows.push(row);
              }
            });
            if (rows.length > 0) {
              const maxCols = Math.max(...rows.map(r => r.length));
              const widths = Array(maxCols).fill('*');
              return {
                table: { body: rows, widths },
                layout: 'lightHorizontalLines',
                margin: [0, 10, 0, 10]
              };
            }
            return null;
          }

          case 'td':
          case 'th':
            return children.length === 1 ? children[0] : { text: children };

          case 'img': {
            const src = element.getAttribute('src') || '';
            if (src) {
              try {
                // pdfmake supports base64 data URIs directly
                if (src.startsWith('data:')) {
                  return { image: src, width: 400, margin: [0, 5, 0, 5] } as any;
                }
                // For external URLs, pdfmake can't fetch them directly —
                // show placeholder text
                return { text: '[Image]', italics: true, color: '#999999', margin: [0, 5, 0, 5] };
              } catch {
                return { text: '[Image]', italics: true, color: '#999999' };
              }
            }
            return null;
          }

          case 'br':
            return '\n';

          case 'hr':
            return { text: '─'.repeat(50), margin: [0, 10, 0, 10] };

          case 'blockquote':
            return {
              text: children,
              margin: [20, 10, 20, 10],
              italics: true,
              color: '#555555'
            };

          case 'code':
          case 'pre':
            return {
              text: children,
              fontSize: 10,
              margin: [10, 5, 10, 5]
            };

          case 'div':
          case 'span':
          case 'section':
          case 'article':
          case 'header':
          case 'footer':
          case 'main':
          case 'nav':
          case 'aside':
            // Container elements - return children
            if (children.length === 1) {
              return children[0];
            }
            if (children.length > 1) {
              return { text: children };
            }
            return null;

          default:
            // Unknown tag - just return text content
            if (children.length === 1) {
              return children[0];
            }
            if (children.length > 1) {
              return { text: children };
            }
            return null;
        }
      }

      return null;
    };

    // Process all body children
    doc.body.childNodes.forEach(node => {
      const processed = processNode(node);
      if (processed !== null) {
        content.push(processed);
      }
    });

    // If no content was extracted, add a placeholder
    if (content.length === 0) {
      content.push({ text: 'Document content could not be extracted.', italics: true });
    }

    return content;
  }

  /**
   * Convert DOCX file to PDF with proper text layer.
   * Only supports .docx files (not old .doc binary format).
   * Old .doc files should be uploaded as-is.
   */
  static async convertDocxToPdf(
    file: File | Blob,
    options: ConversionOptions = {}
  ): Promise<Blob | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const htmlContent = result.value;

      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('No content extracted from DOCX file');
      }

      const pdfContent = this.htmlToPdfContent(htmlContent);

      // Initialize pdfMake
      const pdfMake = await initPdfMake();

      // Create PDF document definition
      const docDefinition = {
        content: pdfContent,
        defaultStyle: {
          font: 'Roboto',
          fontSize: 11,
          lineHeight: 1.4
        },
        styles: {
          header1: { fontSize: 22, bold: true },
          header2: { fontSize: 18, bold: true },
          header3: { fontSize: 14, bold: true },
          header4: { fontSize: 12, bold: true }
        },
        pageSize: options.format?.toUpperCase() || 'A4',
        pageMargins: [40, 60, 40, 60] as [number, number, number, number]
      };

      // Generate PDF — pass fonts and vfs explicitly to createPdf
      return new Promise((resolve, reject) => {
        try {
          const pdfDocGenerator = pdfMake.createPdf(docDefinition, null, pdfMakeFonts, pdfMake.vfs);

          pdfDocGenerator.getBlob((blob: Blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              reject(new Error('Generated PDF is empty'));
            }
          });
        } catch (error) {
          reject(error);
        }
      });

    } catch (error) {
      throw new Error(`Failed to convert DOC/DOCX to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert DOCX to PDF with a document control header prepended.
   * headerContent is an array of pdfmake content items rendered before the document body.
   */
  static async convertDocxToPdfWithHeader(
    file: File | Blob,
    headerContent: ContentItem[],
    options: ConversionOptions = {}
  ): Promise<Blob | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const htmlContent = result.value;

      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('No content extracted from DOCX file');
      }

      const bodyContent = this.htmlToPdfContent(htmlContent);

      const combinedContent: ContentItem[] = [...headerContent, ...bodyContent];

      const pdfMake = await initPdfMake();
      const docDefinition = {
        content: combinedContent,
        defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.4 },
        styles: {
          header1: { fontSize: 22, bold: true },
          header2: { fontSize: 18, bold: true },
          header3: { fontSize: 14, bold: true },
          header4: { fontSize: 12, bold: true },
        },
        pageSize: options.format?.toUpperCase() || 'A4',
        pageMargins: [40, 60, 40, 60] as [number, number, number, number],
      };

      return new Promise((resolve, reject) => {
        try {
          const pdfDocGenerator = pdfMake.createPdf(docDefinition, null, pdfMakeFonts, pdfMake.vfs);
          pdfDocGenerator.getBlob((blob: Blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              reject(new Error('Generated PDF is empty'));
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw new Error(`Failed to convert DOCX to PDF with header: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert DOCX file to PDF and download it
   */
  static async convertAndDownload(
    file: File | Blob,
    options: ConversionOptions = {}
  ): Promise<void> {
    try {
      const pdfBlob = await this.convertDocxToPdf(file, options);

      if (!pdfBlob) {
        throw new Error('Failed to generate PDF');
      }

      // Generate PDF filename - always ensure .pdf extension
      let fileName: string;
      if (options.fileName) {
        // Remove any existing extension and add .pdf
        fileName = options.fileName.replace(/\.(doc|docx|pdf)$/i, '') + '.pdf';
      } else if (file instanceof File) {
        // Remove .doc or .docx extension and add .pdf
        fileName = file.name.replace(/\.(doc|docx)$/i, '.pdf');
      } else {
        fileName = 'converted.pdf';
      }

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document converted to PDF and downloaded');
    } catch (error) {
      toast.error(`Failed to convert and download: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Convert DOCX file to PDF and return as Blob URL
   */
  static async convertToPdfBlobUrl(
    file: File | Blob,
    options: ConversionOptions = {}
  ): Promise<string | null> {
    try {
      const pdfBlob = await this.convertDocxToPdf(file, options);

      if (!pdfBlob) {
        return null;
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      return blobUrl;
    } catch (error) {
      return null;
    }
  }

  /**
   * Download a file from a URL and convert to PDF
   */
  static async downloadAndConvertToPdf(
    fileUrl: string,
    fileName: string,
    options: ConversionOptions = {}
  ): Promise<Blob | null> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      return await this.convertDocxToPdf(file, options);
    } catch (error) {
      throw error;
    }
  }
}
