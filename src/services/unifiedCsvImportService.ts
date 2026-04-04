
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedDocumentImportService, DocumentImportRow as BaseDocumentImportRow, DocumentImportResult } from "./enhancedDocumentImportService";

export interface CsvDocumentRow extends BaseDocumentImportRow {
  documentName: string;
  documentType: string;
  documentStatus: string;
  techApplicability: string;
  description: string;
  phaseName: string;
  phaseDescription: string;
  categoryName: string;
}

export interface UnifiedImportResult extends DocumentImportResult {}

/**
 * Unified CSV Import Service that uses the enhanced document import service
 * NOW FIXED: Handles authentication issues and uses batch processing
 */
export class UnifiedCsvImportService {
  
  /**
   * Detect CSV delimiter
   */
  static detectDelimiter(csvText: string): string {
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
   * Parse CSV text into structured data with automatic delimiter detection
   * NOW USES: Enhanced parsing from EnhancedDocumentImportService
   */
  static parseCSVData(csvText: string): CsvDocumentRow[] {
    // Use the enhanced parsing logic
    const baseRows = EnhancedDocumentImportService.parseCSVData(csvText);
    
    // Convert to our extended format
    return baseRows.map(row => ({
      ...row,
      documentName: row.name,
      documentType: row.type,
      documentStatus: row.status,
      techApplicability: row.techApplicability || 'All device types',
      description: row.description || '',
      phaseName: row.phaseName,
      phaseDescription: row.phaseDescription || '',
      categoryName: row.categoryName || ''
    }));
  }

  /**
   * Validate CSV data structure
   */
  static validateCSVData(data: CsvDocumentRow[]): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.length === 0) {
      errors.push('No valid rows found in CSV');
      return { isValid: false, errors, warnings };
    }

    console.log(`[UnifiedCsvImport] Validating ${data.length} parsed rows`);

    // Check for required fields
    data.forEach((row, index) => {
      if (!row.phaseName) {
        errors.push(`Row ${index + 1}: Phase name is required`);
      }
      if (!row.documentName && row.documentType) {
        warnings.push(`Row ${index + 1}: Document type specified but no document name`);
      }
    });

    console.log(`[UnifiedCsvImport] Validation complete - ${errors.length} errors, ${warnings.length} warnings`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Import documents using the enhanced document import service
   * NOW FIXED: Uses authentication-aware batch processing
   */
  static async importDocuments(
    csvData: CsvDocumentRow[],
    companyIdentifier: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<UnifiedImportResult> {
    console.log('[UnifiedCsvImport] Starting unified import using enhanced authentication-aware service');
    
    try {
      // Convert to the format expected by EnhancedDocumentImportService
      const enhancedData = csvData.map(row => ({
        name: row.documentName,
        type: row.documentType,
        status: row.documentStatus,
        techApplicability: row.techApplicability,
        description: row.description,
        phaseName: row.phaseName,
        phaseDescription: row.phaseDescription,
        categoryName: row.categoryName
      }));

      // Use the enhanced document import service with authentication management
      const result = await EnhancedDocumentImportService.importDocuments(
        enhancedData, 
        companyIdentifier,
        onProgress
      );

      if (result.authErrors > 0) {
        toast.error(`Authentication errors occurred. Please log out and log back in, then try again.`);
      }

      return result;

    } catch (error) {
      console.error('[UnifiedCsvImport] Import failed:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('auth')) {
        toast.error('Authentication failed. Please log out and log back in, then try again.');
        throw new Error('Authentication failed. Please log out and log back in, then try again.');
      }
      
      throw error;
    }
  }
}
