
import { supabase } from "@/integrations/supabase/client";
import { CsvAuthenticationService } from "./csvAuthenticationService";
import { BatchCsvImportService } from "./batchCsvImportService";

export interface DocumentImportRow {
  name: string;
  type: string;
  status: string;
  techApplicability?: string;
  description?: string;
  phaseName: string;
  phaseDescription?: string;
  categoryName?: string;
}

export interface DocumentImportResult {
  success: boolean;
  categoriesCreated: number;
  phasesCreated: number;
  documentsCreated: number;
  documentsSkipped: number;
  authErrors: number;
  errors: string[];
  details: Array<{
    action: string;
    item: string;
    result: string;
  }>;
}

/**
 * Enhanced Document Import Service with authentication management and batch processing
 * Fixes authentication issues and provides reliable CSV import functionality
 */
export class EnhancedDocumentImportService {
  
  /**
   * Import documents with enhanced authentication and batch processing
   */
  static async importDocuments(
    csvData: DocumentImportRow[],
    companyIdentifier: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<DocumentImportResult> {
    console.log('[EnhancedImport] Starting enhanced document import with authentication management');
    
    let actualCompanyId = companyIdentifier;
    
    // Resolve company ID if needed
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyIdentifier);
    if (!isUUID) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', decodeURIComponent(companyIdentifier))
        .maybeSingle();
        
      if (companyError || !companyData) {
        throw new Error(`Company not found: ${companyIdentifier}`);
      }
      actualCompanyId = companyData.id;
    }

    console.log('[EnhancedImport] Using company ID:', actualCompanyId);

    // Step 1: Comprehensive authentication validation
    onProgress?.(0, csvData.length, 'Validating authentication...');
    
    const authState = await CsvAuthenticationService.validateForImport(actualCompanyId);
    
    if (!authState.isValid) {
      throw new Error(authState.error || 'Authentication validation failed');
    }

    console.log('[EnhancedImport] Authentication validated successfully');

    // Step 2: Convert to batch format
    const batchData = csvData.map(row => ({
      documentName: row.name,
      documentType: row.type,
      documentStatus: row.status,
      techApplicability: row.techApplicability || 'All device types',
      description: row.description || '',
      phaseName: row.phaseName,
      phaseDescription: row.phaseDescription || '',
      categoryName: row.categoryName || ''
    }));

    // Step 3: Process in authenticated batches
    onProgress?.(0, csvData.length, 'Processing documents in batches...');
    
    const batchResult = await BatchCsvImportService.processBatches(
      batchData,
      actualCompanyId,
      onProgress
    );

    // Step 4: Format result
    const result: DocumentImportResult = {
      success: batchResult.success && batchResult.authErrors === 0,
      categoriesCreated: 0, // Not tracked in batch service yet
      phasesCreated: Math.max(0, batchResult.created - batchResult.skipped), // Estimate
      documentsCreated: batchResult.created,
      documentsSkipped: batchResult.skipped,
      authErrors: batchResult.authErrors,
      errors: batchResult.errors,
      details: [
        {
          action: 'processed',
          item: 'rows',
          result: `${batchResult.processed}/${csvData.length}`
        },
        {
          action: 'created',
          item: 'documents',
          result: batchResult.created.toString()
        },
        {
          action: 'skipped',
          item: 'duplicates',
          result: batchResult.skipped.toString()
        }
      ]
    };

    if (batchResult.authErrors > 0) {
      result.errors.unshift(`Authentication errors occurred (${batchResult.authErrors}). Please log out and log back in, then try again.`);
    }

    console.log('[EnhancedImport] Import completed:', result);
    return result;
  }

  /**
   * Parse CSV text with better delimiter detection
   */
  static parseCSVData(csvText: string): DocumentImportRow[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    // Auto-detect delimiter
    const delimiter = this.detectDelimiter(csvText);
    console.log('[EnhancedImport] Using delimiter:', delimiter);

    const dataLines = lines.slice(1); // Skip header
    const parsed: DocumentImportRow[] = [];

    dataLines.forEach((line, index) => {
      if (!line.trim()) return;

      const columns = this.parseCSVLine(line, delimiter);
      
      if (columns.length >= 6) {
        parsed.push({
          name: columns[0]?.replace(/^"|"$/g, '').trim() || '',
          type: columns[1]?.replace(/^"|"$/g, '').trim() || 'Standard',
          status: columns[2]?.replace(/^"|"$/g, '').trim() || 'Not Started',
          techApplicability: columns[3]?.replace(/^"|"$/g, '').trim() || 'All device types',
          description: columns[4]?.replace(/^"|"$/g, '').trim() || '',
          phaseName: columns[5]?.replace(/^"|"$/g, '').trim() || '',
          phaseDescription: columns[6]?.replace(/^"|"$/g, '').trim() || '',
          categoryName: columns[7]?.replace(/^"|"$/g, '').trim() || ''
        });
      }
    });

    console.log(`[EnhancedImport] Parsed ${parsed.length} rows from CSV`);
    return parsed;
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
