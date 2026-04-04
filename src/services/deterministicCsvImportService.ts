import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
 * Deterministic CSV Import Service - Fixed to use company_phases table consistently
 * Uses exact string matching and strict cascade logic for predictable results
 * NO name cleaning or fuzzy matching - preserves exact CSV names
 */
export class DeterministicCsvImportService {
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
   * Import CSV data using deterministic cascade logic with EXACT name matching
   * Fixed to use company_phases table consistently
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
      console.log(`[DeterministicImport] Starting ${mode} import for company:`, companyId);

      // Step 1: Handle replace mode
      if (mode === 'replace') {
        await this.clearExistingStructure(companyId);
      }

      // Step 2: Process each CSV row with cascade logic using EXACT names
      for (const row of csvData) {
        try {
          // Get or create category using exact name
          const categoryId = await this.getOrCreateCategory(companyId, row.categoryName);
          
          // Get or create phase using EXACT name from CSV (no cleaning) - Fixed to use company_phases
          const { phaseId, wasCreated: phaseCreated } = await this.getOrCreatePhase(
            companyId, 
            row.phaseName, // Use EXACT CSV name - preserve numbering format
            row.phaseDescription, 
            categoryId
          );
          
          if (phaseCreated) {
            result.phasesCreated++;
          }

          // Always create document template if document name exists
          if (row.documentName) {
            await this.createDocumentTemplate(phaseId, row);
            result.documentsCreated++;

            result.details.push({
              categoryName: row.categoryName,
              phaseName: row.phaseName, // Show exact CSV name in results
              documentName: row.documentName,
              action: 'created'
            });
          }

        } catch (error) {
          const errorMsg = `Failed to process row: ${row.phaseName} - ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error('[DeterministicImport] Row processing error:', errorMsg);
          result.errors.push(errorMsg);
        }
      }

      result.success = result.errors.length === 0;
      
      console.log('[DeterministicImport] Import completed:', result);
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DeterministicImport] Import failed:', errorMsg);
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Clear existing custom structure for replace mode - Fixed to use company_phases
   */
  private static async clearExistingStructure(companyId: string): Promise<void> {
    console.log('[DeterministicImport] Clearing existing structure for replace mode');
    
    // Delete company phases (cascade will handle document templates)
    const { error } = await supabase
      .from('company_phases') // Use company_phases consistently
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
   * Get or create category using exact name matching
   */
  private static async getOrCreateCategory(companyId: string, categoryName: string): Promise<string | null> {
    if (!categoryName) return null;

    // Try to find existing category
    const { data: existingCategory, error: findError } = await supabase
      .from('phase_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', categoryName)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to lookup category: ${findError.message}`);
    }

    if (existingCategory) {
      return existingCategory.id;
    }

    // Create new category
    const { data: newCategory, error: createError } = await supabase
      .from('phase_categories')
      .insert({
        company_id: companyId,
        name: categoryName,
        position: await this.getNextCategoryPosition(companyId)
      })
      .select('id')
      .single();

    if (createError) {
      throw new Error(`Failed to create category: ${createError.message}`);
    }

    return newCategory.id;
  }

  /**
   * Get or create phase using EXACT name matching - NO name cleaning
   * Fixed to use company_phases table consistently
   */
  private static async getOrCreatePhase(
    companyId: string,
    phaseName: string,
    phaseDescription: string,
    categoryId: string | null
  ): Promise<{ phaseId: string; wasCreated: boolean }> {
    console.log(`[DeterministicImport] Looking for phase with EXACT name: "${phaseName}" in company_phases table`);
    
    // Try to find existing phase using EXACT name matching - no cleaning
    const { data: existingPhase, error: findError } = await supabase
      .from('company_phases') // Use company_phases consistently
      .select('id')
      .eq('company_id', companyId)
      .eq('name', phaseName) // EXACT match - preserve CSV format like "(01) Concept & Feasibility"
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to lookup phase: ${findError.message}`);
    }

    if (existingPhase) {
      console.log(`[DeterministicImport] Found existing phase with EXACT name: "${phaseName}"`);
      return { phaseId: existingPhase.id, wasCreated: false };
    }

    // Create new phase with EXACT CSV name - no modifications
    console.log(`[DeterministicImport] Creating new phase with EXACT CSV name: "${phaseName}"`);
    const { data: newPhase, error: createError } = await supabase
      .from('company_phases') // Use company_phases consistently
      .insert({
        company_id: companyId,
        name: phaseName, // Use EXACT name from CSV - preserve numbering format
        description: phaseDescription,
        category_id: categoryId,
        position: await this.getNextPhasePosition(companyId),
        is_active: true,
        duration_days: 30
      })
      .select('id')
      .single();

    if (createError) {
      throw new Error(`Failed to create phase: ${createError.message}`);
    }

    console.log(`[DeterministicImport] Successfully created phase with EXACT name: "${phaseName}"`);
    return { phaseId: newPhase.id, wasCreated: true };
  }

  /**
   * Create document template - Fixed to use company_phases
   */
  private static async createDocumentTemplate(phaseId: string, row: CsvRow): Promise<void> {
    const { error } = await supabase
      .from('phase_document_templates') // This should reference company_phases
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

  /**
   * Get next position for category
   */
  private static async getNextCategoryPosition(companyId: string): Promise<number> {
    const { data, error } = await supabase
      .from('phase_categories')
      .select('position')
      .eq('company_id', companyId)
      .order('position', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting category position:', error);
      return 0;
    }

    return (data?.[0]?.position || -1) + 1;
  }

  /**
   * Get next position for phase - Fixed to use company_phases
   */
  private static async getNextPhasePosition(companyId: string): Promise<number> {
    const { data, error } = await supabase
      .from('company_phases') // Use company_phases consistently
      .select('position')
      .eq('company_id', companyId)
      .order('position', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting phase position:', error);
      return 0;
    }

    return (data?.[0]?.position || -1) + 1;
  }
}
