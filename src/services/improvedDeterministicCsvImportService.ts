
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { findOrCreatePhase, ensurePhaseCategory } from "./fixedBulkImportPhaseCreation";

export interface CsvRow {
  documentName: string;
  documentType: string;
  documentStatus: string;
  techApplicability: string;
  description: string;
  phaseName: string;
  phaseDescription: string;
  categoryName: string;
  markets?: string[];
  classesByMarket?: Record<string, string[]>;
}

export interface ImportResult {
  success: boolean;
  categoriesCreated: number;
  phasesCreated: number;
  documentsCreated: number;
  errors: string[];
  details: Array<{
    categoryName: string;
    phaseName: string;
    documentName: string;
    action: 'created' | 'found';
  }>;
}

export type ImportMode = 'append' | 'replace';

/**
 * Improved CSV Import Service with better error handling and duplicate resolution
 */
export class ImprovedDeterministicCsvImportService {
  
  /**
   * Parse CSV text into structured data
   */
  static parseCSVData(csvText: string): CsvRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const dataLines = lines.slice(1); // Skip header
    const parsed: CsvRow[] = [];

    dataLines.forEach((line, index) => {
      if (!line.trim()) return;

      const columns = this.parseCSVLine(line);
      
      if (columns.length >= 6) {
        parsed.push({
          documentName: columns[0]?.replace(/^"|"$/g, '').trim() || '',
          documentType: columns[1]?.replace(/^"|"$/g, '').trim() || 'Standard',
          documentStatus: columns[2]?.replace(/^"|"$/g, '').trim() || 'Not Started',
          techApplicability: columns[3]?.replace(/^"|"$/g, '').trim() || 'All device types',
          description: columns[4]?.replace(/^"|"$/g, '').trim() || '',
          phaseName: columns[5]?.replace(/^"|"$/g, '').trim() || '',
          phaseDescription: columns[6]?.replace(/^"|"$/g, '').trim() || '',
          categoryName: columns[7]?.replace(/^"|"$/g, '').trim() || '',
          markets: ['US', 'EU', 'CA', 'AU', 'JP'], // Default markets
          classesByMarket: {
            'US': ['I', 'II', 'III'],
            'EU': ['I', 'IIa', 'IIb', 'III'],
            'CA': ['I', 'II', 'III', 'IV']
          }
        });
      }
    });

    return parsed;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const columns = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    return columns;
  }

  /**
   * Validate CSV data structure
   */
  static validateCSVData(data: CsvRow[]): { isValid: boolean; errors: string[]; warnings: string[] } {
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
      if (!row.documentName && row.documentType) {
        warnings.push(`Row ${index + 1}: Document type specified but no document name`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Import CSV data using improved error handling
   */
  static async importStructureFromCSV(
    companyId: string,
    csvData: CsvRow[],
    mode: ImportMode = 'append'
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      categoriesCreated: 0,
      phasesCreated: 0,
      documentsCreated: 0,
      errors: [],
      details: []
    };

    try {
      console.log(`[ImprovedImport] Starting ${mode} import for company:`, companyId);

      // Step 1: Handle replace mode
      if (mode === 'replace') {
        await this.clearExistingStructure(companyId);
      }

      // Step 2: Process each CSV row with improved error handling
      for (const row of csvData) {
        try {
          // Get or create category
          let categoryId: string | null = null;
          if (row.categoryName) {
            categoryId = await ensurePhaseCategory(row.categoryName, companyId);
          }
          
          // Get or create phase using improved method
          const phaseData = {
            name: row.phaseName,
            description: row.phaseDescription,
            categoryName: row.categoryName
          };
          
          const { phaseId, wasCreated } = await findOrCreatePhase(phaseData, companyId);
          
          if (wasCreated) {
            result.phasesCreated++;
          }

          // Create document template if document name exists
          if (row.documentName) {
            await this.createDocumentTemplate(phaseId, row);
            result.documentsCreated++;

            result.details.push({
              categoryName: row.categoryName,
              phaseName: row.phaseName,
              documentName: row.documentName,
              action: 'created'
            });
          }

        } catch (error) {
          const errorMsg = `Failed to process row: ${row.phaseName} - ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('[ImprovedImport] Row processing error:', errorMsg);
          result.errors.push(errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      
      console.log('[ImprovedImport] Import completed:', result);
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ImprovedImport] Import failed:', errorMsg);
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Clear existing custom structure for replace mode
   */
  private static async clearExistingStructure(companyId: string): Promise<void> {
    console.log('[ImprovedImport] Clearing existing structure for replace mode');
    
    // Delete company phases (cascade will handle document templates)
    const { error } = await supabase
      .from('company_phases')
      .delete()
      .eq('company_id', companyId);

    if (error) {
      throw new Error(`Failed to clear existing structure: ${error.message}`);
    }

    // Delete categories
    await supabase
      .from('phase_categories')
      .delete()
      .eq('company_id', companyId);
  }

  /**
   * Create document template
   */
  private static async createDocumentTemplate(phaseId: string, row: CsvRow): Promise<void> {
    const { error } = await supabase
      .from('phase_document_templates')
      .insert({
        company_phase_id: phaseId,
        name: row.documentName,
        document_type: row.documentType,
        status: row.documentStatus,
        tech_applicability: row.techApplicability,
        markets: row.markets || [],
        classes_by_market: row.classesByMarket || {},
        document_scope: 'company_template'
      });

    if (error) {
      throw new Error(`Failed to create document template: ${error.message}`);
    }
  }
}
