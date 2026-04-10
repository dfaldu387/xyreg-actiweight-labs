import { supabase } from '@/integrations/supabase/client';
import { DocumentTemplate } from '@/types/documentComposer';

export interface ValidationFinding {
  id: string;
  sectionTitle: string;
  issueType: 'cross_reference' | 'regulatory_gap' | 'terminology' | 'missing_content' | 'structural';
  severity: 'error' | 'warning' | 'info';
  description: string;
  originalContent: string;
  suggestedContent: string;
  unresolvedReference?: string;
  status: 'pending' | 'accepted' | 'skipped';
}

export interface ValidationResult {
  findings: ValidationFinding[];
  unresolvedReferences: string[];
  validatedAt: Date;
}

const UNRESOLVED_REFS_KEY = 'xyreg_unresolved_refs_';
const UNRESOLVED_REFS_INDEX_KEY = 'xyreg_unresolved_refs_index';

export interface UnresolvedReferenceSource {
  sourceDocId: string;
  sourceDocName: string;
}

export class DocumentValidationService {
  /**
   * Fetch all existing document numbers for a company to check cross-references.
   */
  static async getExistingDocumentNumbers(companyId: string): Promise<string[]> {
    const { data } = await supabase
      .from('phase_assigned_document_template')
      .select('document_number')
      .eq('company_id', companyId)
      .not('document_number', 'is', null);

    return (data || [])
      .map((d: any) => d.document_number)
      .filter(Boolean) as string[];
  }

  /**
   * Call the AI validation edge function.
   */
  static async validateDocument(
    companyId: string,
    template: DocumentTemplate,
    companyName?: string
  ): Promise<ValidationResult> {
    const existingDocumentNumbers = await this.getExistingDocumentNumbers(companyId);

    const { data, error } = await supabase.functions.invoke('ai-document-validator', {
      body: {
        sections: template.sections.map(s => ({
          id: s.id,
          title: s.title,
          content: s.content.map(c => ({ type: c.type, content: c.content })),
        })),
        documentName: template.name,
        documentType: template.type,
        existingDocumentNumbers,
        companyName: companyName || '',
      },
    });

    if (error) {
      throw new Error(error.message || 'Validation failed');
    }

    const rawFindings = data?.findings || [];
    const findings: ValidationFinding[] = rawFindings.map((f: any, i: number) => ({
      id: `finding_${Date.now()}_${i}`,
      sectionTitle: f.sectionTitle,
      issueType: f.issueType,
      severity: f.severity,
      description: f.description,
      originalContent: f.originalContent,
      suggestedContent: f.suggestedContent,
      unresolvedReference: f.unresolvedReference || undefined,
      status: 'pending' as const,
    }));

    const unresolvedReferences = findings
      .filter(f => f.unresolvedReference)
      .map(f => f.unresolvedReference!);

    // Persist unresolved references in localStorage
    if (unresolvedReferences.length > 0) {
      this.saveUnresolvedReferences(template.id, unresolvedReferences);
      this.saveUnresolvedReferenceIndex(template.id, template.name, unresolvedReferences);
    }

    return {
      findings,
      unresolvedReferences,
      validatedAt: new Date(),
    };
  }

  static saveUnresolvedReferences(documentId: string, refs: string[]): void {
    try {
      const existing = this.getUnresolvedReferences(documentId);
      const merged = [...new Set([...existing, ...refs])];
      localStorage.setItem(`${UNRESOLVED_REFS_KEY}${documentId}`, JSON.stringify(merged));
    } catch (e) {
      console.error('Failed to save unresolved references:', e);
    }
  }

  static getUnresolvedReferences(documentId: string): string[] {
    try {
      const stored = localStorage.getItem(`${UNRESOLVED_REFS_KEY}${documentId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save a global reverse index: maps each unresolved document number
   * to the source documents that reference it.
   */
  static saveUnresolvedReferenceIndex(
    sourceDocId: string,
    sourceDocName: string,
    refs: string[]
  ): void {
    try {
      const index = this.getUnresolvedReferenceIndex();
      for (const ref of refs) {
        const normalizedRef = ref.toUpperCase().trim();
        if (!index[normalizedRef]) {
          index[normalizedRef] = [];
        }
        // Avoid duplicates
        if (!index[normalizedRef].some(s => s.sourceDocId === sourceDocId)) {
          index[normalizedRef].push({ sourceDocId, sourceDocName });
        }
      }
      localStorage.setItem(UNRESOLVED_REFS_INDEX_KEY, JSON.stringify(index));
    } catch (e) {
      console.error('Failed to save unresolved reference index:', e);
    }
  }

  /**
   * Get the full global reverse index.
   */
  static getUnresolvedReferenceIndex(): Record<string, UnresolvedReferenceSource[]> {
    try {
      const stored = localStorage.getItem(UNRESOLVED_REFS_INDEX_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Check if a document number is referenced by other documents.
   * Returns the list of source documents that reference it.
   */
  static getReferencingDocuments(documentNumber: string): UnresolvedReferenceSource[] {
    if (!documentNumber) return [];
    try {
      const index = this.getUnresolvedReferenceIndex();
      const normalizedNumber = documentNumber.toUpperCase().trim();
      return index[normalizedNumber] || [];
    } catch {
      return [];
    }
  }

  /**
   * Validate multiple documents together for cross-document consistency.
   */
  static async validateMultipleDocuments(
    companyId: string,
    documents: Array<{
      documentName: string;
      documentNumber?: string;
      documentType: string;
      sections: Array<{ id: string; title: string; content: Array<{ type: string; content: string }> }>;
    }>,
    companyName?: string
  ): Promise<{ findings: Array<ValidationFinding & { sourceDocumentName: string }>; validatedAt: Date }> {
    const existingDocumentNumbers = await this.getExistingDocumentNumbers(companyId);

    const { data, error } = await supabase.functions.invoke('ai-bulk-document-validator', {
      body: {
        documents: documents.map(d => ({
          documentName: d.documentName,
          documentNumber: d.documentNumber || '',
          documentType: d.documentType,
          sections: d.sections,
        })),
        existingDocumentNumbers,
        companyName: companyName || '',
      },
    });

    if (error) {
      throw new Error(error.message || 'Bulk validation failed');
    }

    const rawFindings = data?.findings || [];
    const findings = rawFindings.map((f: any, i: number) => ({
      id: `bulk_finding_${Date.now()}_${i}`,
      sourceDocumentName: f.sourceDocumentName || 'Unknown',
      sectionTitle: f.sectionTitle,
      issueType: f.issueType,
      severity: f.severity,
      description: f.description,
      originalContent: f.originalContent,
      suggestedContent: f.suggestedContent,
      unresolvedReference: f.unresolvedReference || undefined,
      status: 'pending' as const,
    }));

    return { findings, validatedAt: new Date() };
  }

  /**
   * Remove a document number from the global index once it has been created/resolved.
   */
  static clearResolvedReference(documentNumber: string): void {
    if (!documentNumber) return;
    try {
      const index = this.getUnresolvedReferenceIndex();
      const normalizedNumber = documentNumber.toUpperCase().trim();
      if (index[normalizedNumber]) {
        delete index[normalizedNumber];
        localStorage.setItem(UNRESOLVED_REFS_INDEX_KEY, JSON.stringify(index));
      }
    } catch (e) {
      console.error('Failed to clear resolved reference:', e);
    }
  }
}
