import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { showNoCreditDialog } from '@/context/AiCreditContext';

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'file';
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  defaultValue?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface TemplateSection {
  id: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  order: number;
}

export interface TemplateStructure {
  name: string;
  description?: string;
  document_type: string;
  tech_applicability: string;
  phase_assignment?: string;
  sections: TemplateSection[];
  metadata: {
    ai_generated: boolean;
    confidence_score: number;
    ai_provider: string;
    original_filename: string;
    analysis_timestamp: string;
  };
}

export interface TemplateAnalysisResult {
  success: boolean;
  structure: {
    title: string;
    sections: Array<{
      name: string;
      content: string;
      fields_identified: Array<{
        name: string;
        type: string;
        description: string;
        required: boolean;
      }>;
    }>;
  };
  metadata: {
    confidence_score: number;
    ai_provider: string;
    document_type: string;
    analysis_notes: string;
  };
  suggestions: {
    document_type: string;
    tech_applicability: string;
    recommended_phases: string[];
  };
}

export class AITemplateImporterService {
  static async extractTextFromFile(file: File): Promise<string> {
    
    
    try {
      if (file.type === 'text/plain') {
        return await file.text();
      }
      
      if (file.type === 'application/pdf') {
        // For PDF files, we'll send to the edge function for processing
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'extract_text');
        
        const { data, error } = await supabase.functions.invoke('ai-document-analyzer', {
          body: formData
        });

        if (error) throw error;
        if (data?.error === 'NO_CREDITS') {
          showNoCreditDialog();
          throw new Error('NO_CREDITS');
        }
        return data.extracted_text;
      }

      if (file.type.includes('wordprocessingml') || file.type.includes('msword')) {
        // For Word documents, we'll send to the edge function for processing
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'extract_text');

        const { data, error } = await supabase.functions.invoke('ai-document-analyzer', {
          body: formData
        });

        if (error) throw error;
        if (data?.error === 'NO_CREDITS') {
          showNoCreditDialog();
          throw new Error('NO_CREDITS');
        }
        return data.extracted_text;
      }
      
      throw new Error('Unsupported file type');
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  static async analyzeDocument(text: string, companyId: string): Promise<TemplateAnalysisResult> {
    
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-document-analyzer', {
        body: {
          action: 'analyze_document',
          text: text,
          company_id: companyId
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error === 'NO_CREDITS') {
        showNoCreditDialog();
        throw new Error('NO_CREDITS');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'AI analysis failed');
      }
      
      return data;
    } catch (error) {
      console.error('Error analyzing document with AI:', error);
      throw new Error('Failed to analyze document with AI');
    }
  }

  static convertAnalysisToTemplate(analysis: TemplateAnalysisResult): TemplateStructure {
    
    
    const sections: TemplateSection[] = analysis.structure?.sections?.map((section, index) => ({
      id: `section_${index + 1}`,
      name: section.name || `Section ${index + 1}`,
      description: section.content?.substring(0, 200) + (section.content?.length > 200 ? '...' : ''),
      order: index + 1,
      fields: section.fields_identified?.map((field, fieldIndex) => ({
        id: `field_${index + 1}_${fieldIndex + 1}`,
        name: field.name?.toLowerCase().replace(/\s+/g, '_') || `field_${fieldIndex + 1}`,
        type: this.mapFieldType(field.type),
        label: field.name || `Field ${fieldIndex + 1}`,
        description: field.description || '',
        required: field.required || false,
        placeholder: `Enter ${(field.name || 'value').toLowerCase()}...`,
        validation: this.getDefaultValidation(field.type)
      })) || []
    })) || [];

    // Clean the title - if it contains error text, use default
    const cleanTitle = (title: string) => {
      if (!title) return '';
      // Check for common error patterns
      const errorPatterns = [
        /not implemented/i,
        /error/i,
        /failed/i,
        /exception/i,
        /undefined/i,
        /null/i
      ];
      
      for (const pattern of errorPatterns) {
        if (pattern.test(title)) {
          return '';
        }
      }
      
      return title;
    };

    const cleanedTitle = cleanTitle(analysis.structure?.title || '');

    return {
      name: cleanedTitle || '',
      description: '',
      document_type: analysis.suggestions?.document_type || 'Standard',
      tech_applicability: analysis.suggestions?.tech_applicability || 'All device types',
      phase_assignment: analysis.suggestions?.recommended_phases?.[0],
      sections,
      metadata: {
        ai_generated: true,
        confidence_score: analysis.metadata?.confidence_score || 0,
        ai_provider: analysis.metadata?.ai_provider || '',
        original_filename: '',
        analysis_timestamp: new Date().toISOString()
      }
    };
  }

  private static mapFieldType(aiFieldType: string): TemplateField['type'] {
    const type = aiFieldType.toLowerCase();
    
    if (type.includes('date')) return 'date';
    if (type.includes('number') || type.includes('numeric')) return 'number';
    if (type.includes('select') || type.includes('dropdown') || type.includes('choice')) return 'select';
    if (type.includes('checkbox') || type.includes('boolean')) return 'checkbox';
    if (type.includes('file') || type.includes('upload') || type.includes('document')) return 'file';
    if (type.includes('textarea') || type.includes('multiline') || type.includes('description')) return 'textarea';
    
    return 'text'; // Default
  }

  private static getDefaultValidation(fieldType: string) {
    switch (fieldType) {
      case 'text':
        return { minLength: 1, maxLength: 255 };
      case 'textarea':
        return { minLength: 1, maxLength: 2000 };
      case 'number':
        return { min: 0 };
      default:
        return undefined;
    }
  }

  static async createTemplate(
    companyId: string, 
    structure: TemplateStructure, 
    analysisMetadata: any
  ): Promise<void> {
    
    
    try {
      // Create the template in company_document_templates with the complete structure
      const { data, error } = await supabase
        .from('company_document_templates')
        .insert({
          company_id: companyId,
          name: structure.name,
          document_type: structure.document_type,
          tech_applicability: structure.tech_applicability,
          description: structure.description,
          markets: [],
          classes_by_market: {},
          structure: JSON.parse(JSON.stringify(structure)) // Properly serialize the structure
        })
        .select()
        .single();
      
      if (error) {
        console.error('Database error creating template:', error);
        throw error;
      }
      
      
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to save template to database');
    }
  }

  static async getCompanyAIProviders(companyId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('company_api_keys')
        .select('key_type')
        .eq('company_id', companyId);
      
      if (error) throw error;
      
      const providers = [];
      if (data?.some(key => key.key_type === 'gemini')) providers.push('gemini');
      if (data?.some(key => key.key_type === 'openai')) providers.push('openai');
      if (data?.some(key => key.key_type === 'anthropic')) providers.push('anthropic');
      
      return providers;
    } catch (error) {
      console.error('Error fetching AI providers:', error);
      return [];
    }
  }
}