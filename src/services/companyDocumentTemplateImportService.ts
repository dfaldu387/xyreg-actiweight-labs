
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentTemplateRow {
  documentName: string;
  documentType: string;
  documentStatus: string;
  techApplicability: string;
  description: string;
  phaseName: string;
}

export interface CompanyPhase {
  id: string;
  name: string;
  position: number;
}

export interface DocumentTemplateImportResult {
  success: boolean;
  matchedPhases: string[];
  unmatchedPhases: string[];
  documentsCreated: number;
  documentsSkipped: number;
  errors: string[];
  details: Array<{
    phaseName: string;
    documentsAdded: number;
    documentsSkipped: number;
  }>;
}

/**
 * Company Document Template Import Service
 * Only works with existing company phases - does not create new phases
 */
export class CompanyDocumentTemplateImportService {
  
  /**
   * Parse CSV text into document template rows
   */
  static parseCSVData(csvText: string): DocumentTemplateRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    // Auto-detect delimiter
    const delimiter = this.detectDelimiter(csvText);
    console.log('[DocumentTemplateImport] Using delimiter:', delimiter);

    const dataLines = lines.slice(1); // Skip header
    const parsed: DocumentTemplateRow[] = [];

    dataLines.forEach((line, index) => {
      if (!line.trim()) return;

      const columns = this.parseCSVLine(line, delimiter);
      
      if (columns.length >= 6) {
        parsed.push({
          documentName: columns[0]?.replace(/^"|"$/g, '').trim() || '',
          documentType: columns[1]?.replace(/^"|"$/g, '').trim() || 'Standard',
          documentStatus: columns[2]?.replace(/^"|"$/g, '').trim() || 'Not Started',
          techApplicability: columns[3]?.replace(/^"|"$/g, '').trim() || 'All device types',
          description: columns[4]?.replace(/^"|"$/g, '').trim() || '',
          phaseName: columns[5]?.replace(/^"|"$/g, '').trim() || ''
        });
      }
    });

    console.log(`[DocumentTemplateImport] Parsed ${parsed.length} rows from CSV`);
    return parsed;
  }

  /**
   * Get existing active phases for a company
   */
  static async getCompanyActivePhases(companyId: string): Promise<CompanyPhase[]> {
    try {
      const { data: companyPhases, error } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(
            id,
            name,
            position
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (error) {
        throw error;
      }

      const phases = (companyPhases || []).map(cp => ({
        id: cp.company_phases.id,
        name: cp.company_phases.name,
        position: cp.position
      }));

      console.log(`[DocumentTemplateImport] Found ${phases.length} active phases for company ${companyId}`);
      return phases;
    } catch (error) {
      console.error('[DocumentTemplateImport] Error fetching company phases:', error);
      throw new Error(`Failed to fetch company phases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import document templates for existing phases only
   */
  static async importDocumentTemplates(
    csvData: DocumentTemplateRow[],
    companyId: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<DocumentTemplateImportResult> {
    console.log('[DocumentTemplateImport] Starting document template import for existing phases only');
    
    try {
      onProgress?.(0, csvData.length, 'Loading company phases...');
      
      // Get existing active phases for the company
      const existingPhases = await this.getCompanyActivePhases(companyId);
      const phaseMap = new Map(existingPhases.map(phase => [phase.name.toLowerCase(), phase]));
      
      // Group CSV data by phase name and separate matched vs unmatched
      const matchedPhases: string[] = [];
      const unmatchedPhases: string[] = [];
      const documentsByPhase = new Map<string, DocumentTemplateRow[]>();
      
      csvData.forEach(row => {
        if (!row.phaseName) return;
        
        const normalizedPhaseName = row.phaseName.trim();
        const matchedPhase = phaseMap.get(normalizedPhaseName.toLowerCase());
        
        if (matchedPhase) {
          if (!matchedPhases.includes(normalizedPhaseName)) {
            matchedPhases.push(normalizedPhaseName);
          }
          
          if (!documentsByPhase.has(matchedPhase.id)) {
            documentsByPhase.set(matchedPhase.id, []);
          }
          documentsByPhase.get(matchedPhase.id)!.push(row);
        } else {
          if (!unmatchedPhases.includes(normalizedPhaseName)) {
            unmatchedPhases.push(normalizedPhaseName);
          }
        }
      });

      console.log(`[DocumentTemplateImport] Matched phases: ${matchedPhases.length}, Unmatched: ${unmatchedPhases.length}`);
      
      let totalDocumentsCreated = 0;
      let totalDocumentsSkipped = 0;
      const details: Array<{ phaseName: string; documentsAdded: number; documentsSkipped: number }> = [];
      const errors: string[] = [];
      
      let processed = 0;
      
      // Process each matched phase
      for (const [phaseId, documents] of documentsByPhase.entries()) {
        const phase = existingPhases.find(p => p.id === phaseId);
        if (!phase) continue;
        
        onProgress?.(processed, csvData.length, `Processing phase: ${phase.name}...`);
        
        let phaseDocumentsCreated = 0;
        let phaseDocumentsSkipped = 0;
        
        // Get existing documents for this phase to avoid duplicates
        const { data: existingDocs } = await supabase
          .from('phase_assigned_documents')
          .select('name')
          .eq('phase_id', phaseId);
        
        const existingDocNames = new Set((existingDocs || []).map(doc => doc.name.toLowerCase()));
        
        // Create document templates for this phase
        for (const doc of documents) {
          if (!doc.documentName) {
            processed++;
            continue;
          }
          
          // Check for duplicates
          if (existingDocNames.has(doc.documentName.toLowerCase())) {
            phaseDocumentsSkipped++;
            processed++;
            continue;
          }
          
          try {
            const { error: insertError } = await supabase
              .from('phase_assigned_documents')
              .insert({
                phase_id: phaseId,
                name: doc.documentName,
                document_type: doc.documentType,
                status: doc.documentStatus,
                tech_applicability: doc.techApplicability,
                description: doc.description
              });
            
            if (insertError) {
              errors.push(`Failed to create document "${doc.documentName}" in phase "${phase.name}": ${insertError.message}`);
              phaseDocumentsSkipped++;
            } else {
              phaseDocumentsCreated++;
              existingDocNames.add(doc.documentName.toLowerCase()); // Prevent duplicates in same batch
            }
          } catch (error) {
            errors.push(`Error creating document "${doc.documentName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            phaseDocumentsSkipped++;
          }
          
          processed++;
        }
        
        details.push({
          phaseName: phase.name,
          documentsAdded: phaseDocumentsCreated,
          documentsSkipped: phaseDocumentsSkipped
        });
        
        totalDocumentsCreated += phaseDocumentsCreated;
        totalDocumentsSkipped += phaseDocumentsSkipped;
      }
      
      onProgress?.(csvData.length, csvData.length, 'Import completed!');
      
      const result: DocumentTemplateImportResult = {
        success: errors.length === 0,
        matchedPhases,
        unmatchedPhases,
        documentsCreated: totalDocumentsCreated,
        documentsSkipped: totalDocumentsSkipped,
        errors,
        details
      };
      
      console.log('[DocumentTemplateImport] Import completed:', result);
      return result;
      
    } catch (error) {
      console.error('[DocumentTemplateImport] Import failed:', error);
      throw error;
    }
  }

  /**
   * Validate CSV data for document template import
   */
  static validateCSVData(data: DocumentTemplateRow[]): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.length === 0) {
      errors.push('No valid rows found in CSV');
      return { isValid: false, errors, warnings };
    }

    // Check for required fields
    data.forEach((row, index) => {
      if (!row.phaseName) {
        errors.push(`Row ${index + 1}: Phase name is required`);
      }
      if (!row.documentName) {
        warnings.push(`Row ${index + 1}: Document name is empty - will be skipped`);
      }
    });

    console.log(`[DocumentTemplateImport] Validation - ${errors.length} errors, ${warnings.length} warnings`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect CSV delimiter
   */
  private static detectDelimiter(csvText: string): string {
    const lines = csvText.trim().split('\n').slice(0, 3);
    let commaCount = 0;
    let semicolonCount = 0;
    
    lines.forEach(line => {
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (!inQuotes) {
          if (char === ',') commaCount++;
          if (char === ';') semicolonCount++;
        }
      }
    });
    
    return semicolonCount > commaCount ? ';' : ',';
  }

  /**
   * Parse CSV line with custom delimiter
   */
  private static parseCSVLine(line: string, delimiter: string = ','): string[] {
    const columns = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    return columns;
  }
}
