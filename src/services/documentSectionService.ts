import { supabase } from '@/integrations/supabase/client';

export interface DocumentSection {
  id: string;
  document_id: string;
  section_title: string;
  page_start: number;
  page_end: number;
  extraction_status: string;
  extracted_text?: string | null;
  error_message?: string | null;
  section_type?: string | null;
  extracted_data?: any;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TOCItem {
  title: string;
  pageStart: number;
  pageEnd: number;
  level: number;
}

export const documentSectionService = {
  /**
   * Analyze document structure and get TOC
   */
  async analyzeDocumentStructure(documentId: string): Promise<TOCItem[]> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-document-structure', {
        body: { documentId }
      });

      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze document');
      }

      return data.tableOfContents || [];
    } catch (error) {
      console.error('[documentSectionService] Error analyzing document:', error);
      throw error;
    }
  },

  /**
   * Create a new document section
   */
  async createSection(
    documentId: string,
    sectionTitle: string,
    pageStart: number,
    pageEnd: number
  ): Promise<DocumentSection> {
    try {
      const { data, error } = await supabase
        .from('document_sections')
        .insert({
          document_id: documentId,
          section_title: sectionTitle,
          page_start: pageStart,
          page_end: pageEnd,
          extraction_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[documentSectionService] Error creating section:', error);
      throw error;
    }
  },

  /**
   * Extract text from a document section
   */
  async extractSection(sectionId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('extract-document-section', {
        body: { sectionId }
      });

      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error || 'Failed to extract section');
      }
    } catch (error) {
      console.error('[documentSectionService] Error extracting section:', error);
      throw error;
    }
  },

  /**
   * Get all sections for a document
   */
  async getDocumentSections(documentId: string): Promise<DocumentSection[]> {
    try {
      const { data, error } = await supabase
        .from('document_sections')
        .select('*')
        .eq('document_id', documentId)
        .order('page_start', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[documentSectionService] Error fetching sections:', error);
      throw error;
    }
  },

  /**
   * Get a specific section
   */
  async getSection(sectionId: string): Promise<DocumentSection | null> {
    try {
      const { data, error } = await supabase
        .from('document_sections')
        .select('*')
        .eq('id', sectionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[documentSectionService] Error fetching section:', error);
      throw error;
    }
  },

  /**
   * Delete a section
   */
  async deleteSection(sectionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
    } catch (error) {
      console.error('[documentSectionService] Error deleting section:', error);
      throw error;
    }
  },

  /**
   * Parse competitor table from extracted text
   */
  async parseCompetitorTable(sectionId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('parse-competitor-table', {
        body: { sectionId }
      });

      if (error) throw error;
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse competitor table');
      }

      return data.competitors || [];
    } catch (error) {
      console.error('[documentSectionService] Error parsing competitor table:', error);
      throw error;
    }
  }
};
