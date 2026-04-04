import { DocumentTemplate, DocumentSection, DocumentContent, ProductContext } from '@/types/documentComposer';

export interface ParsedDocumentContent {
  text: string;
  images: Array<{ path: string; page: number }>;
  pages: number;
}

export class DocumentParsingService {
  static async parseTemplate(filePath: string, fileName: string, productContext: ProductContext): Promise<DocumentTemplate> {
    try {
      // Import supabase client
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Use Supabase edge function to parse document
      const { data, error } = await supabase.functions.invoke('parse-document', {
        body: {
          filePath,
          fileName,
        },
      });

      if (error) {
        throw new Error(`Failed to parse document: ${error.message}`);
      }

      const parsedContent: ParsedDocumentContent = data;
      
      // Convert parsed content to DocumentTemplate format
      return this.convertParsedContentToTemplate(parsedContent, fileName, productContext);
    } catch (error) {
      console.error('Error parsing document:', error);
      // Fallback to mock content if parsing fails
      throw error;
    }
  }

  private static convertParsedContentToTemplate(
    parsedContent: ParsedDocumentContent,
    fileName: string,
    productContext: ProductContext
  ): DocumentTemplate {
    const sections = this.extractSectionsFromText(parsedContent.text);
    
    return {
      id: fileName,
      name: this.extractTitleFromText(parsedContent.text) || fileName.replace(/\.[^/.]+$/, ""),
      type: this.inferTemplateType(parsedContent.text),
      sections,
      productContext,
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        estimatedCompletionTime: '30-45 minutes',
      },
    };
  }

  private static extractSectionsFromText(text: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = text.split('\n');
    let currentSection: DocumentSection | null = null;
    let currentContent: string[] = [];
    let sectionOrder = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this line is a heading (starts with number or is all caps, etc.)
      if (this.isHeading(trimmedLine)) {
        // Save previous section if exists
        if (currentSection && currentContent.length > 0) {
          currentSection.content.push({
            id: `content-${currentSection.id}-${currentSection.content.length}`,
            type: 'paragraph',
            content: currentContent.join('\n').trim(),
            isAIGenerated: false,
          });
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          id: `section-${sectionOrder}`,
          title: this.cleanHeading(trimmedLine),
          content: [],
          order: sectionOrder++,
        };
        currentContent = [];
      } else if (trimmedLine && currentSection) {
        // Add content to current section
        currentContent.push(trimmedLine);
        
        // Check if this content needs AI assistance
        if (this.needsAIAssistance(trimmedLine)) {
          currentSection.content.push({
            id: `content-${currentSection.id}-${currentSection.content.length}`,
            type: 'paragraph',
            content: trimmedLine,
            isAIGenerated: true,
            metadata: {
              confidence: 0.5,
              lastModified: new Date(),
              author: 'ai',
            },
          });
          currentContent = [];
        }
      }
    }

    // Add final section
    if (currentSection && currentContent.length > 0) {
      currentSection.content.push({
        id: `content-${currentSection.id}-${currentSection.content.length}`,
        type: 'paragraph',
        content: currentContent.join('\n').trim(),
        isAIGenerated: false,
      });
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : this.createDefaultSections();
  }

  private static isHeading(line: string): boolean {
    // Check for numbered headings (1., 1.1, etc.)
    if (/^\d+\./.test(line)) return true;
    
    // Check for all caps headings
    if (line.length > 3 && line === line.toUpperCase() && /[A-Z]/.test(line)) return true;
    
    // Check for title case headings with specific keywords
    const headingKeywords = ['Purpose', 'Scope', 'Procedure', 'Responsibilities', 'Records', 'References'];
    if (headingKeywords.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()))) return true;
    
    return false;
  }

  private static cleanHeading(heading: string): string {
    return heading.replace(/^\d+\.?\s*/, '').trim();
  }

  private static needsAIAssistance(content: string): boolean {
    const aiPromptIndicators = [
      '[insert',
      '[add',
      '[specify',
      '[list',
      '[define',
      'TBD',
      'to be determined',
      '___',
      'placeholder',
      'example:'
    ];
    
    return aiPromptIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  private static extractTitleFromText(text: string): string | null {
    const lines = text.split('\n').slice(0, 10); // Check first 10 lines
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 10 && trimmedLine.length < 100) {
        // Skip version numbers, dates, etc.
        if (!/^\d+\./.test(trimmedLine) && !/\d{4}/.test(trimmedLine)) {
          return trimmedLine;
        }
      }
    }
    
    return null;
  }

  private static inferTemplateType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('measuring') || lowerText.includes('calibration') || lowerText.includes('monitoring equipment')) {
      return 'control-of-measuring';
    }
    if (lowerText.includes('risk management') || lowerText.includes('risk analysis')) {
      return 'risk-management-plan';
    }
    if (lowerText.includes('design control') || lowerText.includes('design history')) {
      return 'design-control';
    }
    if (lowerText.includes('corrective action') || lowerText.includes('capa')) {
      return 'corrective-action';
    }
    if (lowerText.includes('control of records') || lowerText.includes('document control')) {
      return 'control-of-records';
    }
    
    return 'general-procedure';
  }

  private static createDefaultSections(): DocumentSection[] {
    return [
      {
        id: 'section-0',
        title: 'Document Content',
        content: [{
          id: 'content-0-0',
          type: 'paragraph',
          content: 'Document content could not be parsed into sections. Please review the source document structure.',
          isAIGenerated: false,
        }],
        order: 0,
      }
    ];
  }
}