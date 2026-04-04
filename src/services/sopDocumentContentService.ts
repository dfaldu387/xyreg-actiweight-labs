import { supabase } from '@/integrations/supabase/client';

export interface SOPDocumentContent {
  id: string;
  name: string;
  content: string;
  sections: Array<{
    title: string;
    content: string;
    level: number;
  }>;
  metadata: {
    file_path: string;
    file_name: string;
    file_size: number;
    public_url: string;
  };
}

export class SOPDocumentContentService {
  /**
   * Extract content from a SOP document by fetching the file and parsing it
   */
  static async extractContentFromSOP(documentId: string): Promise<SOPDocumentContent | null> {
    try {
      // First, get the document metadata from the database
      const { data: document, error: docError } = await supabase
        .from('default_document_templates')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        console.error('Error fetching document:', docError);
        return null;
      }

      // If the document has a public URL, fetch the content
      if (document.public_url) {
        const content = await this.fetchAndParseDocument(document.public_url, document.file_name);
        // console.log('Content:', content);
        if (content) {
          return {
            id: document.id,
            name: document.name,
            content: content.text,
            sections: content.sections,
            metadata: {
              file_path: document.file_path,
              file_name: document.file_name,
              file_size: document.file_size,
              public_url: document.public_url
            }
          };
        }
      }

      // Fallback: Create basic SOP content even if parsing fails
      // console.log('Creating fallback SOP content for document:', document.name);
      const fallbackContent = this.createBasicSOPContent(document.file_name);
      const fallbackSections = this.parseTextIntoSections(fallbackContent);
      
      return {
        id: document.id,
        name: document.name,
        content: fallbackContent,
        sections: fallbackSections,
        metadata: {
          file_path: document.file_path,
          file_name: document.file_name,
          file_size: document.file_size,
          public_url: document.public_url
        }
      };
    } catch (error) {
      console.error('Error extracting SOP content:', error);
      return null;
    }
  }
  static async extractContentFromSOPFromUploadedDocument(storage_path: string, file_name: string, file_size?: number): Promise<SOPDocumentContent | null> {
    try {
      // Convert storage path to public URL
      // console.log('Converting storage path to public URL:', storage_path);
      
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storage_path);
      
      const public_url = urlData.publicUrl;
      // console.log('Generated public URL:', public_url);

      // If we have a public URL, fetch the content
      if (public_url) {
        const content = await this.fetchAndParseDocument(public_url, file_name);
        // console.log('Extracted content:', content ? 'Success' : 'Failed');
        
        if (content) {
          return {
            id: `uploaded-${Date.now()}`,
            name: file_name.replace(/\.[^/.]+$/, ""),
            content: content.text,
            sections: content.sections,
            metadata: {
              file_path: storage_path,
              file_name: file_name,
              file_size: file_size || 0,
              public_url: public_url
            }
          };
        }
      }

      // Fallback: Create basic SOP content even if parsing fails
      // console.log('Creating fallback SOP content for document:', file_name);
      const fallbackContent = this.createBasicSOPContent(file_name);
      const fallbackSections = this.parseTextIntoSections(fallbackContent);
      
      return {
        id: `uploaded-${Date.now()}`,
        name: file_name.replace(/\.[^/.]+$/, ""),
        content: fallbackContent,
        sections: fallbackSections,
        metadata: {
          file_path: storage_path,
          file_name: file_name,
          file_size: file_size || 0,
          public_url: public_url || storage_path
        }
      };
    } catch (error) {
      console.error('Error extracting SOP content:', error);
      return null;
    }
  }
  /**
   * Fetch document from URL and parse it using client-side text extraction
   */
  private static async fetchAndParseDocument(url: string, fileName: string): Promise<{ text: string; sections: Array<{ title: string; content: string; level: number }> } | null> {
    try {
      // Fetch the document file
      // console.log('Fetching document from URL:', url);
      // console.log('File Name:', fileName);
      
      const response = await fetch(url);
      // console.log('Response:', response);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      const fileBlob = await response.blob();
      // console.log('File Blob:', fileBlob);
      
      // Extract text from the document using client-side parsing
      const extractedText = await this.extractTextFromBlob(fileBlob, fileName);
      
      if (extractedText && extractedText.length > 0) {
        // Parse the extracted text into sections
        const sections = this.parseTextIntoSections(extractedText);
        
        return {
          text: extractedText,
          sections
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching and parsing document:', error);
      return null;
    }
  }

  /**
   * Extract text from document blob using client-side parsing
   */
  private static async extractTextFromBlob(blob: Blob, fileName: string): Promise<string> {
    try {
      if (fileName.toLowerCase().endsWith('.docx')) {
        // Use mammoth.js to extract text from DOCX files
        const mammoth = await import('mammoth');
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        if (result.value && result.value.trim().length > 0) {
          // console.log('Successfully extracted text from DOCX:', result.value.substring(0, 200) + '...');
          return result.value;
        } else {
          console.warn('No text content found in DOCX file');
          return this.createBasicSOPContent(fileName);
        }
      } else if (fileName.toLowerCase().endsWith('.pdf')) {
        // For PDF files, we'd need a PDF parsing library
        console.warn('PDF text extraction not implemented yet');
        return this.createBasicSOPContent(fileName);
      } else {
        // For other file types, try to read as text
        const text = await blob.text();
        if (text && text.trim().length > 0) {
          return text;
        } else {
          return this.createBasicSOPContent(fileName);
        }
      }
    } catch (error) {
      console.error('Error extracting text from blob:', error);
      return this.createBasicSOPContent(fileName);
    }
  }

  /**
   * Create basic SOP content when text extraction fails
   */
  private static createBasicSOPContent(fileName: string): string {
    const sopName = fileName.replace('.docx', '').replace('.pdf', '');
    
    return `
${sopName}

PURPOSE
This Standard Operating Procedure (SOP) defines the process for [AI_PROMPT: Please specify the main purpose of this SOP].

SCOPE
This procedure applies to [AI_PROMPT: Please specify the scope and applicability of this SOP].

RESPONSIBILITIES
Quality Manager: Overall responsibility for [AI_PROMPT: Please specify the main responsibilities].

PROCEDURE
1. [AI_PROMPT: Please describe the first step of the procedure]
2. [AI_PROMPT: Please describe the second step of the procedure]
3. [AI_PROMPT: Please describe the third step of the procedure]

REFERENCES
- ISO 13485:2016
- FDA 21 CFR Part 820
- [AI_PROMPT: Please add any specific references relevant to this SOP]

DEFINITIONS
[AI_PROMPT: Please define any specific terms used in this SOP]
    `.trim();
  }

  /**
   * Parse extracted text into structured sections
   */
  private static parseTextIntoSections(text: string): Array<{ title: string; content: string; level: number }> {
    // console.log('Parsing text into sections:', text);
    const sections: Array<{ title: string; content: string; level: number }> = [];
    
    // Split text into lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    // console.log('Text lines:', lines);
    
    let currentSection: { title: string; content: string; level: number } | null = null;
    
    for (const line of lines) {
      // Check if line looks like a section header (numbered, all caps, or specific patterns)
      const isHeader = this.isSectionHeader(line);
      // console.log(`Line: "${line}", isHeader: ${isHeader}`);
      
      if (isHeader) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          title: line,
          content: '',
          level: this.getHeaderLevel(line)
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }
    
    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // console.log('Parsed sections:', sections);
    return sections;
  }

  /**
   * Determine if a line is a section header
   */
  private static isSectionHeader(line: string): boolean {
    // Check for numbered sections (1., 1.1, 1.1.1, etc.)
    if (/^\d+(\.\d+)*\.?\s+[A-Z]/.test(line)) {
      return true;
    }
    
    // Check for all caps headers (but not too long)
    if (line.length < 100 && /^[A-Z\s\d\-_]+$/.test(line) && line.length > 3) {
      return true;
    }
    
    // Check for common section patterns
    const sectionPatterns = [
      /^purpose/i,
      /^scope/i,
      /^responsibilities/i,
      /^procedure/i,
      /^references/i,
      /^definitions/i,
      /^background/i,
      /^overview/i
    ];
    
    return sectionPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Determine the header level based on numbering
   */
  private static getHeaderLevel(line: string): number {
    // Count the number of dots in numbered sections
    const match = line.match(/^(\d+(\.\d+)*)\.?\s/);
    if (match) {
      return match[1].split('.').length;
    }
    
    // Default to level 1 for non-numbered headers
    return 1;
  }

  /**
   * Convert SOP content to template format for LiveEditor
   */
  static convertSOPToTemplate(sopContent: SOPDocumentContent): any {
    // console.log('Converting SOP to template, sections:', sopContent.sections);
    
    // Ensure we have sections, create fallback if empty
    let sections = sopContent.sections;
    if (!sections || sections.length === 0) {
      // console.log('No sections found, creating fallback sections');
      sections = [
        {
          title: 'Document Content',
          content: sopContent.content || 'No content available',
          level: 1
        }
      ];
    }
    
    const templateSections = sections.map((section, index) => ({
      id: `section-${index + 1}`,
      title: section.title || `Section ${index + 1}`,
      order: index + 1,
      content: [
        {
          id: `content-${index + 1}`,
          type: 'paragraph' as const,
          content: section.content || 'No content available',
          isAIGenerated: false,
          metadata: {
            confidence: 1.0,
            lastModified: new Date(),
            author: 'user' as const,
            dataSource: 'manual' as const
          }
        }
      ]
    }));
    
    // console.log('Template sections created:', templateSections);

    return {
      id: sopContent.id,
      name: sopContent.name,
      type: 'SOP',
      sections: templateSections,
      productContext: {
        id: 'sop-context',
        name: 'SOP Document',
        riskClass: 'Unknown',
        phase: 'Implementation',
        description: 'Standard Operating Procedure',
        regulatoryRequirements: []
      },
      documentControl: {
        sopNumber: sopContent.name,
        documentTitle: sopContent.name,
        version: '1.0',
        effectiveDate: new Date(),
        documentOwner: 'Quality Manager',
        preparedBy: {
          name: 'System',
          title: 'Document Processor',
          date: new Date()
        },
        reviewedBy: {
          name: 'Pending',
          title: 'Quality Manager',
          date: new Date()
        },
        approvedBy: {
          name: 'Pending',
          title: 'Quality Director',
          date: new Date()
        }
      },
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        estimatedCompletionTime: '30 minutes',
        source: 'sop_document',
        file_name: sopContent.metadata.file_name,
        extracted_at: new Date().toISOString()
      }
    };
  }
}
