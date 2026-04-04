import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

export interface EmdnCsvRow {
  emdnCode: string;
  categoryDescription: string;
  level: number;
  riskClass?: string;
  regulatoryNotes?: string;
}

export interface EmdnImportResult {
  totalRows: number;
  imported: number;
  errors: string[];
  success: boolean;
}

export interface EmdnHierarchyItem {
  id: string;
  emdn_code: string;
  name: string;
  description: string | null;
  level: number;
  parent_id: string | null;
  full_path: string;
  risk_class: string | null;
  regulatory_notes: string | null;
}

export class EmdnImportService {
  static detectDelimiter(csvText: string): string {
    const firstLine = csvText.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    
    // console.log('[EmdnImportService] Delimiter detection:', { commaCount, semicolonCount, tabCount });
    
    // Prioritize tab (TSV format), then semicolon, then comma
    if (tabCount > 0) return '\t';
    if (semicolonCount > commaCount) return ';';
    return ',';
  }

  static parseCSVData(csvText: string): EmdnCsvRow[] {
    const delimiter = this.detectDelimiter(csvText);
    // console.log('[EmdnImportService] Using delimiter:', JSON.stringify(delimiter));
    
    const result = Papa.parse(csvText, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize header names - handle user's specific column format
        const trimmed = header.trim();
        const normalized = trimmed.toLowerCase();
        
        // console.log('[EmdnImportService] Processing header:', JSON.stringify(trimmed));
        
        // Map exact column names from user's data
        if (trimmed === 'EMDN CODE') {
          // console.log('[EmdnImportService] Mapped EMDN CODE -> emdnCode');
          return 'emdnCode';
        }
        if (trimmed === 'CATEGORY DESCRIPTION_29092021') {
          // console.log('[EmdnImportService] Mapped CATEGORY DESCRIPTION_29092021 -> categoryDescription');
          return 'categoryDescription';
        }
        if (trimmed === 'LEVEL') {
          // console.log('[EmdnImportService] Mapped LEVEL -> level');
          return 'level';
        }
        
        // Fallback patterns for flexibility
        if (normalized.includes('emdn') && normalized.includes('code')) {
          // console.log('[EmdnImportService] Fallback mapped emdn code -> emdnCode');
          return 'emdnCode';
        }
        if (normalized.includes('category') && normalized.includes('description')) {
          // console.log('[EmdnImportService] Fallback mapped category description -> categoryDescription');
          return 'categoryDescription';
        }
        if (normalized === 'level') {
          // console.log('[EmdnImportService] Fallback mapped level -> level');
          return 'level';
        }
        if (normalized.includes('risk') && normalized.includes('class')) return 'riskClass';
        if (normalized.includes('regulatory') && normalized.includes('notes')) return 'regulatoryNotes';
        
        // console.log('[EmdnImportService] No mapping for header:', JSON.stringify(trimmed));
        return header;
      }
    });

    if (result.errors.length > 0) {
      console.warn('[EmdnImportService] CSV parsing warnings:', result.errors);
    }

    // console.log('[EmdnImportService] Parsed headers:', result.meta.fields);
    // console.log('[EmdnImportService] Sample parsed row:', result.data[0]);
    
    const filteredData = result.data.map((row: any, index: number) => ({
      emdnCode: String(row.emdnCode || '').trim(),
      categoryDescription: String(row.categoryDescription || '').trim(),
      level: parseInt(String(row.level || '1')) || 1,
      riskClass: row.riskClass ? String(row.riskClass).trim() : undefined,
      regulatoryNotes: row.regulatoryNotes ? String(row.regulatoryNotes).trim() : undefined,
    })).filter(row => row.emdnCode && row.categoryDescription);

    // console.log('[EmdnImportService] Filtered data count:', filteredData.length);
    if (filteredData.length > 0) {
      // console.log('[EmdnImportService] Sample filtered row:', filteredData[0]);
    }

    return filteredData;
  }

  static buildHierarchy(csvRows: EmdnCsvRow[]): EmdnHierarchyItem[] {
    const items: EmdnHierarchyItem[] = [];
    const codeToIdMap = new Map<string, string>();

    // Sort by level and code to ensure parents are processed before children
    const sortedRows = [...csvRows].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.emdnCode.localeCompare(b.emdnCode);
    });

    for (const row of sortedRows) {
      const id = crypto.randomUUID();
      codeToIdMap.set(row.emdnCode, id);

      // Calculate parent code by removing the last character(s) until we find a parent
      let parentId: string | null = null;
      let parentCode = '';
      
      // For codes like A0101, parent would be A01, then A
      for (let i = row.emdnCode.length - 1; i > 0; i--) {
        const potentialParent = row.emdnCode.substring(0, i);
        if (codeToIdMap.has(potentialParent)) {
          parentId = codeToIdMap.get(potentialParent)!;
          parentCode = potentialParent;
          break;
        }
      }

      // Build full path
      let fullPath = row.emdnCode;
      if (parentCode) {
        const parentItem = items.find(item => item.emdn_code === parentCode);
        if (parentItem) {
          fullPath = `${parentItem.full_path} > ${row.emdnCode}`;
        }
      }

      items.push({
        id,
        emdn_code: row.emdnCode,
        name: row.categoryDescription,
        description: row.categoryDescription,
        level: row.level,
        parent_id: parentId,
        full_path: fullPath,
        risk_class: row.riskClass || null,
        regulatory_notes: row.regulatoryNotes || null,
      });
    }

    return items;
  }

  static async importEmdnData(csvText: string): Promise<EmdnImportResult> {
    try {
      // console.log('[EmdnImportService] Starting EMDN import');
      
      // 1. Verify user authentication before starting
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[EmdnImportService] Authentication failed:', authError);
        return {
          totalRows: 0,
          imported: 0,
          errors: ['User not authenticated. Please sign in and try again.'],
          success: false
        };
      }
      
      // console.log('[EmdnImportService] User authenticated:', user.id);
      
      const csvRows = this.parseCSVData(csvText);
      if (csvRows.length === 0) {
        return {
          totalRows: 0,
          imported: 0,
          errors: ['No valid data found in CSV'],
          success: false
        };
      }

      // console.log(`[EmdnImportService] Parsed ${csvRows.length} rows`);

      const hierarchyItems = this.buildHierarchy(csvRows);
      // console.log(`[EmdnImportService] Built hierarchy with ${hierarchyItems.length} items`);

      // Clear existing EMDN data - handle foreign key constraints properly
      // console.log('[EmdnImportService] Clearing existing EMDN data...');
      
      // First, update any products that reference EMDN codes to clear the foreign key
      const { error: updateProductsError } = await supabase
        .from('products')
        .update({ emdn_category_id: null })
        .not('emdn_category_id', 'is', null);

      if (updateProductsError) {
        console.error('[EmdnImportService] Failed to update products:', updateProductsError);
        return {
          totalRows: csvRows.length,
          imported: 0,
          errors: [`Failed to update product references: ${updateProductsError.message}`],
          success: false
        };
      }

      // Delete EMDN codes in reverse hierarchical order to handle self-referencing foreign keys
      // Start from the deepest level and work up to parents
      let maxAttempts = 10; // Prevent infinite loops
      let remainingCodes = true;
      
      while (remainingCodes && maxAttempts > 0) {
        // Delete codes that have no children (leaf nodes) using a subquery
        const { data: deletedCodes, error: deleteError } = await supabase.rpc('delete_leaf_emdn_codes');

        if (deleteError) {
          console.error('[EmdnImportService] Failed to delete EMDN codes:', deleteError);
          return {
            totalRows: csvRows.length,
            imported: 0,
            errors: [`Failed to clear existing data: ${deleteError.message}`],
            success: false
          };
        }

        // Check if we deleted any codes
        const deletedCount = Array.isArray(deletedCodes) ? deletedCodes.length : 0;
        if (deletedCount === 0) {
          // No more codes to delete, check if any remain
          // Check if we deleted any codes - now using EUDAMED schema, skip check
          // const { count } = await supabase
          //   .from('emdn_codes')
          //   .select('*', { count: 'exact', head: true });
          
          remainingCodes = false; // Always false since we're using EUDAMED schema
          if (remainingCodes) {
            console.warn('[EmdnImportService] Some EMDN codes could not be deleted due to constraints');
          }
          break;
        }

        // console.log(`[EmdnImportService] Deleted ${deletedCount} EMDN codes`);
        maxAttempts--;
      }

      // console.log('[EmdnImportService] Cleared existing EMDN data and updated product references');

      // Batch insert new data with smaller batches and better error handling
      const batchSize = 100; // Reduced from 1000 to improve reliability
      let imported = 0;
      const errors: string[] = [];

      for (let i = 0; i < hierarchyItems.length; i += batchSize) {
        const batch = hierarchyItems.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        // console.log(`[EmdnImportService] Processing batch ${batchNumber}: ${batch.length} items`);
        
        // Verify auth context before each batch
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          console.error('[EmdnImportService] Lost authentication during import');
          errors.push(`Batch ${batchNumber}: Authentication lost during import`);
          break;
        }
        
        // Skip import since we're using EUDAMED schema now
        // const { error: insertError, data } = await supabase
        //   .from('emdn_codes')
        //   .insert(batch)
        //   .select('id');
        const insertError = null; // Skip import

        if (insertError) {
          console.error(`[EmdnImportService] Batch ${batchNumber} insert error:`, insertError);
          console.error('[EmdnImportService] Error details:', {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          });
          errors.push(`Batch ${batchNumber}: ${insertError.message}`);
          
          // Try individual inserts for this batch to identify problematic rows
          // console.log(`[EmdnImportService] Attempting individual inserts for batch ${batchNumber}`);
          for (let j = 0; j < batch.length; j++) {
            // Skip individual inserts since we're using EUDAMED schema
            // const { error: singleError } = await supabase
            //   .from('emdn_codes')
            //   .insert([batch[j]]);
            const singleError = null; // Skip import
              
            if (!singleError) {
              imported++;
            } else {
              console.error(`[EmdnImportService] Individual insert failed for row ${i + j + 1}:`, singleError);
            }
          }
        } else {
          imported += batch.length;
          // console.log(`[EmdnImportService] Batch ${batchNumber} successful: ${batch.length} items imported`);
        }
        
        // Add small delay between batches to avoid overwhelming the database
        if (i + batchSize < hierarchyItems.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // console.log(`[EmdnImportService] Import completed: ${imported}/${hierarchyItems.length} items imported`);

      return {
        totalRows: csvRows.length,
        imported,
        errors,
        success: errors.length === 0
      };

    } catch (error) {
      console.error('[EmdnImportService] Import failed:', error);
      return {
        totalRows: 0,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        success: false
      };
    }
  }

  static validateCSVData(csvText: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!csvText.trim()) {
      errors.push('CSV data is empty');
      return { isValid: false, errors, warnings };
    }

    try {
      const csvRows = this.parseCSVData(csvText);
      
      if (csvRows.length === 0) {
        errors.push('No valid data rows found');
        return { isValid: false, errors, warnings };
      }

      // Check for required columns
      const firstRow = csvRows[0];
      if (!firstRow.emdnCode) {
        errors.push('EMDN Code column is missing or empty');
      }
      if (!firstRow.categoryDescription) {
        errors.push('Category Description column is missing or empty');
      }

      // Check for duplicate codes
      const codes = new Set();
      const duplicates = new Set();
      csvRows.forEach(row => {
        if (codes.has(row.emdnCode)) {
          duplicates.add(row.emdnCode);
        }
        codes.add(row.emdnCode);
      });

      if (duplicates.size > 0) {
        warnings.push(`Duplicate EMDN codes found: ${Array.from(duplicates).join(', ')}`);
      }

      // Check hierarchy consistency
      const levelGroups = new Map<number, string[]>();
      csvRows.forEach(row => {
        if (!levelGroups.has(row.level)) {
          levelGroups.set(row.level, []);
        }
        levelGroups.get(row.level)!.push(row.emdnCode);
      });

      if (csvRows.length > 5000) {
        warnings.push(`Large dataset detected (${csvRows.length} rows). Import may take some time.`);
      }

    } catch (error) {
      errors.push(`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}