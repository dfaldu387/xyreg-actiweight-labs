import { DocumentTemplate, DocumentSection, DocumentContent } from '@/types/documentComposer';
import { format } from 'date-fns';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, TableLayoutType, ImageRun, ShadingType, LevelFormat, VerticalAlign } from 'docx';

export interface ExportOptions {
  format: 'docx' | 'pdf' | 'html';
  includeHighlighting?: boolean;
  filename?: string;
  companyLogoUrl?: string;
  companyName?: string;
}

export class DocumentExportService {
  /**
   * Export document to various formats
   */
  static async exportDocument(template: DocumentTemplate, options: ExportOptions): Promise<void> {
    const { format, includeHighlighting = true, filename } = options;
    
    switch (format) {
      case 'docx':
        await this.exportToDocx(template, filename, includeHighlighting, options);
        break;
      case 'pdf':
        await this.exportToPdf(template, filename);
        break;
      case 'html':
        await this.exportToHtml(template, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate a DOCX blob from a template without downloading it.
   * Used for programmatic PDF conversion and storage upload.
   */
  static async generateDocxBlob(template: DocumentTemplate): Promise<Blob> {
    // Reuse the internal DOCX generation logic
    const documentSections = [];

    for (const section of template.sections) {
      documentSections.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      for (const content of section.content) {
        if (content.type === 'table') {
          const elements = await this.convertContentToWordElements(content, false);
          documentSections.push(...elements);
        } else if (content.type === 'heading') {
          const headingText = this.stripHtmlTags(content.content);
          documentSections.push(
            new Paragraph({
              text: headingText,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 }
            })
          );
        } else {
          const elements = await this.convertContentToWordElements(content, false);
          documentSections.push(...elements);
        }
      }

      documentSections.push(new Paragraph({ text: "" }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: documentSections,
      }],
      title: template.name,
      description: `${template.type} document generated on ${new Date().toLocaleDateString()}`,
      creator: "Document Studio",
    });

    return await Packer.toBlob(doc);
  }

  /**
   * Generate a DOCX blob that includes the full Document Control header + sections.
   * Like exportToDocx() but returns a Blob instead of triggering a download.
   */
  static async generateFullDocxBlob(
    template: DocumentTemplate,
    options?: ExportOptions
  ): Promise<Blob> {
    const documentSections: (Paragraph | Table)[] = [];

    // Add document control header
    const headerElements = await this.generateDocumentControlHeader(template, options);
    documentSections.push(...headerElements);

    // Process each template section
    for (const section of template.sections) {
      documentSections.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      for (const content of section.content) {
        if (content.type === 'table') {
          const elements = await this.convertContentToWordElements(content, false);
          documentSections.push(...elements);
        } else if (content.type === 'heading') {
          const headingText = this.stripHtmlTags(content.content);
          documentSections.push(
            new Paragraph({
              text: headingText,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 }
            })
          );
        } else {
          const elements = await this.convertContentToWordElements(content, false);
          documentSections.push(...elements);
        }
      }

      documentSections.push(new Paragraph({ text: "" }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: documentSections,
      }],
      title: template.name,
      description: `${template.type} document generated on ${new Date().toLocaleDateString()}`,
      creator: "Document Studio",
    });

    return await Packer.toBlob(doc);
  }

  /**
   * Export to Microsoft Word format (.docx)
   */
  private static async exportToDocx(template: DocumentTemplate, filename?: string, includeHighlighting = true, options?: ExportOptions): Promise<void> {
    const finalFilename = filename || `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
    
    // Create document sections
    const documentSections: (Paragraph | Table)[] = [];

    // Add document control header
    const headerElements = await this.generateDocumentControlHeader(template, options);
    documentSections.push(...headerElements);

    // Let the template sections handle the document control content
    // The parseMultiLineHeader will properly extract effective date and other fields

    // Process each template section with proper numbering
    for (const section of template.sections) {
      documentSections.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );

      for (const content of section.content) {
        if (content.type === 'table') {
          const elements = await this.convertContentToWordElements(content, includeHighlighting);
          documentSections.push(...elements);
        } else if (content.type === 'heading') {
          const headingText = this.stripHtmlTags(content.content);
          documentSections.push(
            new Paragraph({
              text: headingText,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 120 }
            })
          );
        } else {
          const elements = await this.convertContentToWordElements(content, includeHighlighting);
          documentSections.push(...elements);
        }
      }

      documentSections.push(new Paragraph({ text: "" }));
    }

    // Create the Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: documentSections,
      }],
      title: template.name,
      description: `${template.type} document generated on ${new Date().toLocaleDateString()}`,
      creator: "Document Studio",
    });

    // Generate and download the document
    try {
      const buffer = await Packer.toBlob(doc);
      this.downloadBlob(buffer, finalFilename);
      
      // console.log(`Document exported successfully as: ${finalFilename}`);
      // console.log('File saved to your default Downloads folder');
      
      // Show user-friendly message about download location
      if (typeof window !== 'undefined' && window.navigator?.platform) {
        const platform = window.navigator.platform.toLowerCase();
        let downloadPath = '';
        
        if (platform.includes('mac')) {
          downloadPath = 'Finder → Downloads';
        } else if (platform.includes('win')) {
          downloadPath = 'File Explorer → Downloads';
        } else {
          downloadPath = 'Downloads folder';
        }
        
        // You can emit an event or call a callback here to show this info in the UI
        // console.log(`✅ Document saved to: ${downloadPath}/${finalFilename}`);
      }
      
    } catch (error) {
      console.error('Error generating Word document:', error);
      throw new Error('Failed to create Word document. Please try again.');
    }
  }

  /**
   * Export to PDF format
   */
  private static async exportToPdf(template: DocumentTemplate, filename?: string): Promise<void> {
    const htmlContent = this.convertTemplateToHtml(template, false);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check popup blockers.');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${template.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .auto-filled { background-color: #fef08a; padding: 2px 4px; }
            .missing-data { background-color: #fed7aa; padding: 2px 4px; }
            h1, h2, h3 { color: #333; }
            .section { margin-bottom: 20px; }
            .content-block { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  /**
   * Export to HTML format
   */
  private static async exportToHtml(template: DocumentTemplate, filename?: string): Promise<void> {
    const htmlContent = this.convertTemplateToHtml(template, true);
    
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${template.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              line-height: 1.6; 
            }
            .auto-filled { 
              background-color: #fef08a; 
              padding: 2px 4px; 
              border-radius: 2px;
            }
            .missing-data { 
              background-color: #fed7aa; 
              padding: 2px 4px; 
              border: 1px solid #fb923c;
              border-radius: 2px;
            }
            h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            h3 { color: #4b5563; }
            .section { margin-bottom: 30px; }
            .content-block { margin-bottom: 15px; }
            .document-header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 1px solid #e5e7eb; 
              padding-bottom: 20px; 
            }
            .metadata { 
              background-color: #f9fafb; 
              padding: 15px; 
              border-radius: 8px; 
              margin-top: 30px; 
            }
          </style>
        </head>
        <body>
          <div class="document-header">
            <h1>${template.name}</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          ${htmlContent}
          <div class="metadata">
            <h3>Document Information</h3>
            <p><strong>Type:</strong> ${template.type}</p>
            <p><strong>Version:</strong> ${template.metadata.version}</p>
            <p><strong>Last Updated:</strong> ${new Date(template.metadata.lastUpdated).toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const finalFilename = filename || `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    
    this.downloadBlob(blob, finalFilename);
  }

  /**
   * Strip HTML tags and convert to plain text
   */
  private static stripHtmlTags(html: string): string {
    // Create a temporary div element to parse HTML
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    }
    
    // Fallback for server-side: use regex to remove HTML tags
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
  }

  /**
   * Parse HTML table and convert to Word Table structure
   */
  private static parseHtmlTable(html: string): Table | null {
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const table = tempDiv.querySelector('table');
      
      if (table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        const tableRows = rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const tableCells = cells.map(cell => {
            const cellContent = cell.textContent?.trim() || '';
            const htmlCell = cell as HTMLElement;
            const isHeader = cell.tagName.toLowerCase() === 'th' || 
                           cell.classList.contains('bg-gray-50') ||
                           cell.className.includes('font-semibold') ||
                           cell.className.includes('bg-gray-');
            
            return new TableCell({
              children: [new Paragraph({
                children: [new TextRun({
                  text: cellContent,
                  bold: isHeader
                })],
                alignment: htmlCell.style.textAlign === 'center' ? AlignmentType.CENTER : 
                          htmlCell.style.textAlign === 'right' ? AlignmentType.RIGHT : 
                          AlignmentType.LEFT
              })],
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: isHeader ? { fill: "f3f4f6" } : undefined
            });
          });
          
          return new TableRow({ children: tableCells });
        });

        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
          layout: TableLayoutType.FIXED,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
          },
          margins: {
            top: 0,
            bottom: 200,
            left: 0,
            right: 0
          }
        });
      }
    }
    return null;
  }

  /**
   * Parse markdown-style table and convert to Word Table structure
   */
  private static parseMarkdownTable(content: string): Table | null {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 1) return null;
    
    // Handle special case: document header with pipe-separated key-value pairs
    if (lines.length === 1 && lines[0].includes(' | ')) {
      // console.log('Detected single line header format, parsing:', lines[0]);
      const result = this.parseDocumentHeaderLine(lines[0]);
      if (result) {
        // console.log('Successfully parsed single line header');
        return result;
      }
    }
    
    // Handle multi-line header format (like the document control content)
    if (lines.length >= 3 && lines.some(line => line.includes('Title:') || line.includes('Effective Date:'))) {
      // console.log('Detected multi-line header format, parsing all lines');
      const result = this.parseMultiLineHeader(lines);
      if (result) {
        // console.log('Successfully parsed multi-line header');
        return result;
      }
    }
    
    // Also try multi-line parsing if any line contains pipe separators with common header fields
    if (lines.some(line => line.includes(' | ') && (line.includes('Document Number') || line.includes('Title') || line.includes('Effective Date')))) {
      // console.log('Detected header fields in multi-line format, parsing with enhanced logic');
      const result = this.parseMultiLineHeader(lines);
      if (result) {
        // console.log('Successfully parsed enhanced multi-line header');
        return result;
      }
    }
    
    // Find lines that look like table rows (contain |)
    const tableLines = lines.filter(line => line.includes('|'));
    if (tableLines.length < 2) return null;
    
    const tableRows = [];
    let currentRole = ''; // Track the current role for row spanning
    
    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i].trim();
      
      // Skip separator lines (like |---|---|)
      if (line.match(/^[\s|:\-]+$/) && line.includes('-')) continue;
      
      // Split by | and clean up cells
      const cells = line.split('|')
        .map(cell => cell.trim())
        .filter((cell, index) => index === 0 || cell.length > 0 || index === 1); // Keep empty cells for second column
      
      if (cells.length >= 2) {
        let roleCell = cells[0];
        const responsibilityCell = cells[1];
        
        // Handle row spanning - if first cell is empty, use previous role
        if (!roleCell || roleCell === '') {
          roleCell = currentRole;
        } else {
          currentRole = roleCell;
        }
        
        const tableCells = [
          // Role cell
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: this.stripHtmlTags(roleCell),
                bold: i === 0,
                font: "Arial"
              })],
              alignment: AlignmentType.LEFT,
              spacing: { before: 100, after: 100 }
            })],
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: i === 0 ? { fill: "e5e7eb" } : undefined,
            margins: {
              top: 150,
              bottom: 150, 
              left: 200,
              right: 200
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
            }
          }),
          // Responsibilities cell  
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: this.stripHtmlTags(responsibilityCell),
                bold: i === 0,
                font: "Arial"
              })],
              alignment: AlignmentType.LEFT,
              spacing: { before: 100, after: 100 }
            })],
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: i === 0 ? { fill: "e5e7eb" } : undefined,
            margins: {
              top: 150,
              bottom: 150, 
              left: 200,
              right: 200
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
            }
          })
        ];
        
        tableRows.push(new TableRow({ children: tableCells }));
      }
    }
    
    if (tableRows.length === 0) return null;
    
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
      layout: TableLayoutType.FIXED,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
      },
      margins: {
        top: 0,
        bottom: 200,
        left: 0,
        right: 0
      }
    });
  }

  /**
   * Parse document header line with pipe-separated key-value pairs
   */
   private static parseDocumentHeaderLine(headerLine: string): Table | null {
    // console.log('Parsing document header line:', headerLine);
    
    // Handle both "|key|value|" and "key | value" formats
    const parts = headerLine.includes(' | ') 
      ? headerLine.split(' | ').map(part => part.trim())
      : headerLine.split('|').map(part => part.trim()).filter(part => part);
    
    // console.log('Header parts:', parts);
    
    if (parts.length < 2) {
      // console.log('Not enough parts for header table');
      return null;
    }
    
    // Create 2-column table with key-value pairs
    const tableRows = [];
    
    // Handle different formats - if odd number, treat as key-value pairs
    for (let i = 0; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        const key = this.stripHtmlTags(parts[i]);
        const value = this.stripHtmlTags(parts[i + 1]);
        
        // console.log(`Adding header row: ${key} = ${value}`);
        
        const tableCells = [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: key,
                bold: true,
                font: "Arial"
              })],
              alignment: AlignmentType.LEFT,
              spacing: { before: 100, after: 100 }
            })],
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: "e5e7eb" },
            margins: {
              top: 150,
              bottom: 150, 
              left: 200,
              right: 200
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
            }
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({
                text: value,
                font: "Arial"
              })],
              alignment: AlignmentType.LEFT,
              spacing: { before: 100, after: 100 }
            })],
            width: { size: 70, type: WidthType.PERCENTAGE },
            margins: {
              top: 150,
              bottom: 150, 
              left: 200,
              right: 200
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
            }
          })
        ];
        
        tableRows.push(new TableRow({ children: tableCells }));
      }
    }
    
    if (tableRows.length === 0) return null;
    
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
      layout: TableLayoutType.FIXED,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
      },
      margins: {
        top: 0,
        bottom: 200,
        left: 0,
        right: 0
      }
    });
  }

  /**
   * Convert content to Word elements with proper formatting (including tables)
   */
  /**
   * Convert basic markdown syntax to HTML so the HTML parser can handle it.
   */
  private static markdownToHtml(text: string): string {
    return text
      // Headings: ## text → <h2>text</h2> (must be before bold)
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Strikethrough: ~~text~~
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n/g, '<br/>');
  }

  private static async convertContentToWordElements(content: DocumentContent, includeHighlighting: boolean): Promise<(Paragraph | Table)[]> {
    const elements = [];

    // Pre-process: convert markdown syntax to HTML (handles pure markdown and mixed HTML+markdown)
    const processedContent = { ...content };
    if (content.content && (content.content.includes('**') || content.content.includes('## ') || content.content.includes('__') || content.content.includes('~~'))) {
      processedContent.content = this.markdownToHtml(content.content);
    }
    const contentRef = processedContent;

    // Determine highlighting based on content metadata
    let highlightColor: "yellow" | undefined = undefined;
    if (includeHighlighting && content.metadata?.dataSource) {
      if (content.metadata.dataSource === 'auto-populated') {
        highlightColor = 'yellow';
      } else if (content.metadata.dataSource === 'missing') {
        // Note: docx doesn't support 'lightOrange', using 'yellow' instead
        highlightColor = 'yellow';
      }
    }

    switch (contentRef.type) {
      case 'heading':
        elements.push(
          new Paragraph({
            text: this.stripHtmlTags(contentRef.content),
            heading: HeadingLevel.HEADING_2,
          })
        );
        break;

      case 'list':
        const cleanListContent = this.stripHtmlTags(contentRef.content);
        const listItems = cleanListContent.split('\n').filter(item => item.trim());
        listItems.forEach(item => {
          const cleanItem = item.replace(/^[-*]\s*/, '').trim();
          if (cleanItem) {
            elements.push(
              new Paragraph({
                children: [
                  new TextRun({ 
                    text: `• ${cleanItem}`,
                    highlight: highlightColor 
                  })
                ],
              })
            );
          }
        });
        break;
        
      case 'table':

        // Check if this is HTML table content that should be converted to Word table
        const htmlTable = this.parseHtmlTable(contentRef.content);
        if (htmlTable) {
          elements.push(htmlTable);
        } else if (contentRef.content.includes('|')) {
          // Try parsing as markdown-style table
          const markdownTable = this.parseMarkdownTable(contentRef.content);
          if (markdownTable) {
            elements.push(markdownTable);
          } else {
            // console.log('Failed to parse markdown table, falling back to paragraph');
            const cleanTableContent = this.stripHtmlTags(contentRef.content);
            elements.push(new Paragraph({ text: cleanTableContent }));
          }
        } else {
          // Fallback to simple paragraph representation
          const cleanTableContent = this.stripHtmlTags(contentRef.content);
          const tableRows = cleanTableContent.split('\n').filter(row => row.trim());
          tableRows.forEach(row => {
            elements.push(
              new Paragraph({
                children: [
                  new TextRun({ 
                    text: row.trim(),
                    highlight: highlightColor 
                  })
                ]
              })
            );
          });
        }
        break;
        
      default:
        // Check if content contains HTML tables first
        if (contentRef.content.includes('<table')) {
          const htmlTable2 = this.parseHtmlTable(contentRef.content);
          if (htmlTable2) {
            elements.push(htmlTable2);
            const nonTableContent = contentRef.content.replace(/<table[^>]*>.*?<\/table>/gi, '').trim();
            if (nonTableContent) {
              elements.push(...await this.parseHtmlToDocxParagraphs(nonTableContent, highlightColor));
            }
          } else {
            elements.push(...await this.parseHtmlToDocxParagraphs(contentRef.content, highlightColor));
          }
        } else if (contentRef.content.includes('|') && contentRef.content.split('\n').filter(l => l.includes('|')).length >= 2) {
          // Try parsing as markdown table
          const mdTable = this.parseMarkdownTable(contentRef.content);
          if (mdTable) {
            elements.push(mdTable);
          } else {
            elements.push(...await this.parseHtmlToDocxParagraphs(contentRef.content, highlightColor));
          }
        } else {
          // Parse rich HTML content into proper docx paragraphs
          const parsed = await this.parseHtmlToDocxParagraphs(contentRef.content, highlightColor);
          if (parsed.length > 0) {
            elements.push(...parsed);
          }
        }
        break;
    }

    return elements;
  }

  /**
   * Convert template to HTML string
   */
  private static convertTemplateToHtml(template: DocumentTemplate, includeStyles: boolean): string {
    let htmlContent = '';
    
    // Add document header if available
    if (template.documentControl) {
      htmlContent += `
        <div class="document-control">
          <h1>${template.documentControl.documentTitle}</h1>
          <div class="control-info">
            <p><strong>SOP Number:</strong> ${template.documentControl.sopNumber}</p>
            <p><strong>Version:</strong> ${template.documentControl.version}</p>
            <p><strong>Effective Date:</strong> ${format(template.documentControl.effectiveDate, 'dd/MM/yyyy')}</p>
            <p><strong>Document Owner:</strong> ${template.documentControl.documentOwner}</p>
          </div>
        </div>
      `;
    }
    
    // Process each section
    template.sections.forEach((section, sectionIndex) => {
      htmlContent += `<div class="section">`;
      htmlContent += `<h2>${section.title}</h2>`;
      
      section.content.forEach((content, contentIndex) => {
        htmlContent += `<div class="content-block">`;
        
        // Apply highlighting classes based on metadata
        let className = '';
        if (includeStyles && content.metadata?.dataSource) {
          if (content.metadata.dataSource === 'auto-populated') {
            className = 'auto-filled';
          } else if (content.metadata.dataSource === 'missing') {
            className = 'missing-data';
          }
        }
        
        switch (content.type) {
          case 'heading':
            htmlContent += `<h3 class="${className}">${content.content}</h3>`;
            break;
          case 'list':
            const listItems = content.content.split('\n').filter(item => item.trim());
            htmlContent += '<ul>';
            listItems.forEach(item => {
              const cleanItem = item.replace(/^[-*]\s*/, '').trim();
              if (cleanItem) {
                htmlContent += `<li class="${className}">${cleanItem}</li>`;
              }
            });
            htmlContent += '</ul>';
            break;
          case 'table':
            // For HTML export, just use the content as-is if it's already HTML table
            if (content.content.includes('<table')) {
              htmlContent += `<div class="${className}">${content.content}</div>`;
            } else {
              // Convert plain text table to HTML
              const rows = content.content.split('\n').filter(row => row.trim());
              if (rows.length > 0) {
                htmlContent += `<table border="1" cellpadding="8" cellspacing="0" class="${className}">`;
                rows.forEach((row, index) => {
                  if (row.includes('|')) {
                    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
                    htmlContent += '<tr>';
                    cells.forEach(cell => {
                      const tag = index === 0 ? 'th' : 'td';
                      htmlContent += `<${tag}>${cell}</${tag}>`;
                    });
                    htmlContent += '</tr>';
                  }
                });
                htmlContent += '</table>';
              } else {
                htmlContent += `<p class="${className}">${content.content}</p>`;
              }
            }
            break;
          default:
            htmlContent += `<div class="${className}">${content.content}</div>`;
            break;
        }
        
        htmlContent += '</div>';
      });
      
      htmlContent += '</div>';
    });
    
    return htmlContent;
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body temporarily for Firefox compatibility
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Log for user feedback
    // console.log('📁 File downloaded:', filename);
    // console.log('💡 Check your browser\'s Downloads folder or download notifications');
  }

  /**
   * Share document via email or link
   */
  static async shareDocument(template: DocumentTemplate, method: 'email' | 'link'): Promise<string> {
    // For demonstration - in real implementation, this would upload to cloud storage
    const htmlContent = this.convertTemplateToHtml(template, false);
    
    if (method === 'email') {
      const subject = `Document: ${template.name}`;
      const body = `Please find the attached document: ${template.name}\n\nGenerated on ${new Date().toLocaleDateString()}`;
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      return mailtoLink;
    } else {
      // Generate a temporary blob URL for sharing
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const shareUrl = URL.createObjectURL(htmlBlob);
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: template.name,
            text: `Document: ${template.name}`,
            url: shareUrl
          });
        } catch (error) {
          // console.log('Error sharing:', error);
        }
      }
      
      return shareUrl;
    }
  }

  /**
   * Parse multi-line document header content
   */
  private static parseMultiLineHeader(lines: string[]): Table | null {
    // console.log('Parsing multi-line header:', lines);
    
    const tableRows = [];
    
    // Process each line to extract key-value pairs
    for (const line of lines) {
      if (line.includes(' | ')) {
        const parts = line.split(' | ').map(part => part.trim());
        
        // Track current person and their date to merge them
        let pendingPerson = null;
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          
          if (part.includes(':')) {
            const colonIndex = part.indexOf(':');
            const key = part.substring(0, colonIndex).trim();
            const value = this.stripHtmlTags(part.substring(colonIndex + 1).trim());
            
            // Handle person fields (Prepared By, Reviewed By, Approved By)
            if (key.includes('By') && !key.includes('Date')) {
              pendingPerson = { key, value };
            }
            // Handle Effective Date separately (not merged with names)
            else if (key === 'Effective Date') {
              // console.log(`Adding header row: ${key} = ${value}`);
              
              const tableCells = [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: key + ':',
                      bold: true,
                      font: "Arial"
                    })],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 }
                  })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  shading: { fill: "e5e7eb" },
                  margins: {
                    top: 150,
                    bottom: 150, 
                    left: 200,
                    right: 200
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                  }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: value,
                      font: "Arial"
                    })],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 }
                  })],
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  margins: {
                    top: 150,
                    bottom: 150, 
                    left: 200,
                    right: 200
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                  }
                })
              ];
              
              tableRows.push(new TableRow({ children: tableCells }));
            }
            // Handle Date fields - merge with previous person if available
            else if (key === 'Date' && pendingPerson) {
              const mergedValue = `${pendingPerson.value} (${value})`;
              
              // console.log(`Adding merged header row: ${pendingPerson.key} = ${mergedValue}`);
              
              const tableCells = [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: pendingPerson.key + ':',
                      bold: true,
                      font: "Arial"
                    })],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 }
                  })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  shading: { fill: "e5e7eb" },
                  margins: {
                    top: 150,
                    bottom: 150, 
                    left: 200,
                    right: 200
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                  }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: mergedValue,
                      font: "Arial"
                    })],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 }
                  })],
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  margins: {
                    top: 150,
                    bottom: 150, 
                    left: 200,
                    right: 200
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                  }
                })
              ];
              
              tableRows.push(new TableRow({ children: tableCells }));
              pendingPerson = null; // Reset after processing
            }
            // Handle other fields normally (Document Number, Version, Title, Effective Date)
            else if (key && value && !key.includes('Date')) {
              // console.log(`Adding header row: ${key} = ${value}`);
              
              const tableCells = [
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: key + ':',
                      bold: true,
                      font: "Arial"
                    })],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 }
                  })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  shading: { fill: "e5e7eb" },
                  margins: {
                    top: 150,
                    bottom: 150, 
                    left: 200,
                    right: 200
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                  }
                }),
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: value,
                      font: "Arial"
                    })],
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 100, after: 100 }
                  })],
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  margins: {
                    top: 150,
                    bottom: 150, 
                    left: 200,
                    right: 200
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
                  }
                })
              ];
              
              tableRows.push(new TableRow({ children: tableCells }));
            }
          }
        }
      }
    }
    
    if (tableRows.length === 0) return null;
    
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
      layout: TableLayoutType.FIXED,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
      },
      margins: {
        top: 0,
        bottom: 200,
        left: 0,
        right: 0
      }
    });
  }

  /**
   * Generate document control header elements for DOCX export
   */
  private static async generateDocumentControlHeader(
    template: DocumentTemplate,
    options?: ExportOptions
  ): Promise<(Paragraph | Table)[]> {
    const elements: (Paragraph | Table)[] = [];
    const dc = template.documentControl;
    const companyName = options?.companyName || '';
    const companyLogoUrl = options?.companyLogoUrl;

    // Document title from template or document control
    const docTitle = dc?.documentTitle || template.name || '';

    // Try to add company logo + company name + doc title as a side-by-side table
    if (companyLogoUrl) {
      try {
        const response = await fetch(companyLogoUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const ext = companyLogoUrl.toLowerCase().includes('.png') ? 'png' : 'jpg';

        // Load image to get natural dimensions for aspect-ratio-preserving sizing
        const imgDims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 120, h: 60 });
          img.src = companyLogoUrl;
        });

        const maxH = 60;
        const maxW = 180;
        const aspect = imgDims.w / imgDims.h;
        let drawW = maxH * aspect;
        let drawH = maxH;
        if (drawW > maxW) { drawW = maxW; drawH = maxW / aspect; }

        const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
        const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

        elements.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorders,
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        children: [
                          new ImageRun({
                            type: ext as 'png' | 'jpg',
                            data: uint8,
                            transformation: { width: Math.round(drawW), height: Math.round(drawH) },
                            altText: { title: 'Company Logo', description: 'Company Logo', name: 'logo' },
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: noBorders,
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: companyName, bold: true, size: 28, font: 'Arial' })],
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: docTitle, bold: true, size: 22, font: 'Arial' })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
        // Add spacing after header table
        elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
      } catch {
        // Logo fetch failed, show text-only header
        if (companyName) {
          elements.push(
            new Paragraph({
              children: [new TextRun({ text: companyName, bold: true, size: 28, font: 'Arial' })],
              spacing: { after: 100 },
            })
          );
        }
        if (docTitle) {
          elements.push(
            new Paragraph({
              children: [new TextRun({ text: docTitle, bold: true, size: 22, font: 'Arial' })],
              spacing: { after: 200 },
            })
          );
        }
      }
    } else if (companyName || docTitle) {
      if (companyName) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: companyName, bold: true, size: 28, font: 'Arial' })],
            spacing: { after: 100 },
          })
        );
      }
      if (docTitle) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: docTitle, bold: true, size: 22, font: 'Arial' })],
            spacing: { after: 200 },
          })
        );
      }
    }

    if (!dc) return elements;

    // Document control info table
    const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: '999999' };
    const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
    const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

    const makeRow = (label: string, value: string) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: 'Arial', size: 20 })] })],
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: 'f3f4f6', type: ShadingType.CLEAR },
            borders,
            margins: cellMargins,
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: value, font: 'Arial', size: 20 })] })],
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders,
            margins: cellMargins,
          }),
        ],
      });

    const formatDate = (d: Date | string | undefined) => {
      if (!d) return '';
      try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return String(d); }
    };

    const controlRows = [
      makeRow('SOP Number', dc.sopNumber || ''),
      makeRow('Document Title', dc.documentTitle || ''),
      makeRow('Version', dc.version || ''),
      makeRow('Effective Date', formatDate(dc.effectiveDate)),
      makeRow('Document Owner', dc.documentOwner || ''),
    ];
    if (dc.nextReviewDate) {
      controlRows.push(makeRow('Next Review Date', formatDate(dc.nextReviewDate)));
    }

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: controlRows,
        layout: TableLayoutType.FIXED,
      })
    );
    elements.push(new Paragraph({ text: '', spacing: { after: 100 } }));

    // Approval table — meaning as header, name + timestamp in data row
    const formatTimestamp = (d: Date | string | undefined) => {
      if (!d) return '';
      try { return format(new Date(d), 'dd/MM/yyyy HH:mm'); } catch { return String(d); }
    };

    const approvalHeaderRow = new TableRow({
      children: ['', 'Issued By', 'Reviewed By', 'Approved By'].map(label =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: 'Arial', size: 18 })] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: 'e5e7eb', type: ShadingType.CLEAR },
          borders,
          margins: cellMargins,
        })
      ),
    });

    const approvalDataRow = new TableRow({
      children: [
        { label: 'Name/Signature' },
        { person: dc.preparedBy },
        { person: dc.reviewedBy },
        { person: dc.approvedBy },
      ].map(col => {
        if ('label' in col) {
          return new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: col.label, bold: true, font: 'Arial', size: 18 })] })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: 'e5e7eb', type: ShadingType.CLEAR },
            borders,
            margins: cellMargins,
          });
        }
        const p = col.person;
        const name = p?.name || '';
        const timestamp = formatTimestamp(p?.date);
        const children = [];
        if (name) {
          children.push(new Paragraph({ children: [new TextRun({ text: name, bold: true, font: 'Arial', size: 18 })] }));
        }
        if (timestamp) {
          children.push(new Paragraph({ children: [new TextRun({ text: timestamp, font: 'Arial', size: 16, color: '666666' })] }));
        }
        if (children.length === 0) {
          children.push(new Paragraph({ children: [] }));
        }
        return new TableCell({
          children,
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders,
          margins: cellMargins,
        });
      }),
    });

    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [approvalHeaderRow, approvalDataRow],
        layout: TableLayoutType.FIXED,
      })
    );

    elements.push(new Paragraph({ text: '', spacing: { after: 300 } }));

    return elements;
  }

  /**
   * Parse rich HTML content into proper docx Paragraph/Table elements
   */
  private static async parseHtmlToDocxParagraphs(html: string, highlightColor?: "black" | "blue" | "cyan" | "darkBlue" | "darkCyan" | "darkGray" | "darkGreen" | "darkMagenta" | "darkRed" | "darkYellow" | "green" | "lightGray" | "magenta" | "none" | "red" | "white" | "yellow"): Promise<(Paragraph | Table)[]> {
    if (!html || !html.trim()) return [];

    if (typeof document === 'undefined') {
      // Fallback for server-side
      const clean = this.stripHtmlTags(html);
      if (!clean.trim()) return [];
      return [new Paragraph({ children: [new TextRun({ text: clean, highlight: highlightColor })] })];
    }

    const container = document.createElement('div');
    container.innerHTML = html;
    const results: (Paragraph | Table)[] = [];
    const pendingImages: { src: string; index: number }[] = [];

    const collectInlineRuns = (node: Node, inheritBold = false, inheritItalic = false, inheritStrike = false, inheritUnderline = false): TextRun[] => {
      const runs: TextRun[] = [];
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || '';
          if (text) {
            runs.push(new TextRun({
              text,
              bold: inheritBold || undefined,
              italics: inheritItalic || undefined,
              strike: inheritStrike || undefined,
              underline: inheritUnderline ? {} as any : undefined,
              highlight: highlightColor,
              font: 'Arial',
            }));
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          const tag = el.tagName.toLowerCase();
          if (tag === 'strong' || tag === 'b') {
            runs.push(...collectInlineRuns(el, true, inheritItalic, inheritStrike, inheritUnderline));
          } else if (tag === 'em' || tag === 'i') {
            runs.push(...collectInlineRuns(el, inheritBold, true, inheritStrike, inheritUnderline));
          } else if (tag === 'br') {
            runs.push(new TextRun({ break: 1 }));
          } else if (tag === 'u') {
            runs.push(...collectInlineRuns(el, inheritBold, inheritItalic, inheritStrike, true));
          } else if (tag === 's' || tag === 'del' || tag === 'strike') {
            runs.push(...collectInlineRuns(el, inheritBold, inheritItalic, true, inheritUnderline));
          } else {
            runs.push(...collectInlineRuns(el, inheritBold, inheritItalic, inheritStrike, inheritUnderline));
          }
        }
      });
      return runs;
    };

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || '').trim();
        if (text) {
          results.push(new Paragraph({ children: [new TextRun({ text, highlight: highlightColor, font: 'Arial' })] }));
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
        const level = tag === 'h1' ? HeadingLevel.HEADING_1
          : tag === 'h2' ? HeadingLevel.HEADING_2
          : tag === 'h3' ? HeadingLevel.HEADING_3
          : HeadingLevel.HEADING_4;
        results.push(new Paragraph({
          children: collectInlineRuns(el),
          heading: level,
          spacing: { before: 200, after: 120 },
        }));
      } else if (tag === 'p') {
        const runs = collectInlineRuns(el);
        if (runs.length > 0) {
          results.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
        }
      } else if (tag === 'ul' || tag === 'ol') {
        const items = el.querySelectorAll(':scope > li');
        let olIndex = 1;
        items.forEach(li => {
          const runs = collectInlineRuns(li);
          if (runs.length > 0) {
            const prefix = tag === 'ul'
              ? '• '
              : `${olIndex++}. `;
            results.push(new Paragraph({
              children: [new TextRun({ text: prefix, font: 'Arial' }), ...runs],
              indent: { left: 720 },
              spacing: { after: 60 },
            }));
          }
        });
      } else if (tag === 'img') {
        // Queue image for async loading — store placeholder and resolve later
        const src = el.getAttribute('src');
        if (src) {
          const imgPlaceholder = new Paragraph({
            children: [new TextRun({ text: '[Image]', italics: true, color: '999999', font: 'Arial' })],
            spacing: { after: 120 },
          });
          results.push(imgPlaceholder);
          // Try to load and replace with actual image
          pendingImages.push({ src, index: results.length - 1 });
        }
      } else if (tag === 'table') {
        const tbl = this.parseHtmlTable(el.outerHTML);
        if (tbl) results.push(tbl);
      } else if (tag === 'br') {
        results.push(new Paragraph({ text: '' }));
      } else if (tag === 'blockquote') {
        const runs = collectInlineRuns(el);
        results.push(new Paragraph({ children: runs, indent: { left: 720 }, spacing: { after: 120 } }));
      } else {
        // Recurse into divs, spans, etc.
        el.childNodes.forEach(child => processNode(child));
      }
    };

    container.childNodes.forEach(child => processNode(child));

    // Resolve pending images
    for (const img of pendingImages) {
      try {
        const response = await fetch(img.src);
        if (!response.ok) continue;
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const ext = img.src.toLowerCase().includes('.png') ? 'png' : 'jpg';

        // Get image dimensions
        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const imgEl = new Image();
          imgEl.onload = () => resolve({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });
          imgEl.onerror = () => resolve({ w: 400, h: 300 });
          imgEl.src = img.src;
        });

        // Scale to fit page width (max ~500px)
        const maxW = 500;
        const scale = dims.w > maxW ? maxW / dims.w : 1;
        const drawW = Math.round(dims.w * scale);
        const drawH = Math.round(dims.h * scale);

        results[img.index] = new Paragraph({
          children: [
            new ImageRun({
              type: ext as 'png' | 'jpg',
              data: uint8,
              transformation: { width: drawW, height: drawH },
              altText: { title: 'Document Image', description: 'Embedded image', name: 'image' },
            }),
          ],
          spacing: { after: 120 },
        });
      } catch {
        // Keep the [Image] placeholder on failure
      }
    }

    // If nothing was parsed but there was text, fallback
    if (results.length === 0) {
      const clean = this.stripHtmlTags(html);
      if (clean.trim()) {
        results.push(new Paragraph({ children: [new TextRun({ text: clean, highlight: highlightColor, font: 'Arial' })] }));
      }
    }

    return results;
  }
}