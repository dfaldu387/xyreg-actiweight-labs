import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

export interface EudamedCsvRow {
  udi_di: string;
  organization?: string;
  id_srn: string;
  organization_status?: string;
  address?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  prrc_first_name?: string;
  prrc_last_name?: string;
  prrc_email?: string;
  prrc_phone?: string;
  prrc_responsible_for?: string;
  prrc_address?: string;
  prrc_postcode?: string;
  prrc_country?: string;
  ca_name?: string;
  ca_address?: string;
  ca_postcode?: string;
  ca_country?: string;
  ca_email?: string;
  ca_phone?: string;
  applicable_legislation?: string;
  basic_udi_di_code?: string;
  risk_class?: string;
  implantable?: string;
  measuring?: string;
  reusable?: string;
  active?: string;
  administering_medicine?: string;
  device_model?: string;
  device_name?: string;
  issuing_agency?: string;
  status?: string;
  nomenclature_codes?: string;
  trade_names?: string;
  reference_number?: string;
  direct_marking?: string;
  quantity_of_device?: string;
  single_use?: string;
  max_reuses?: string;
  sterilization_need?: string;
  sterile?: string;
  contain_latex?: string;
  reprocessed?: string;
  placed_on_the_market?: string;
  market_distribution?: string;
}

export interface EudamedImportResult {
  totalRows: number;
  imported: number;
  errors: string[];
  warnings?: string[];
  success: boolean;
}

export class EudamedImportService {
  private static readonly EXPECTED_COLUMNS = [
    'udi_di', 'organization', 'id_srn', 'organization_status', 'address', 'postcode', 'country', 'phone', 'email', 'website',
    'prrc_first_name', 'prrc_last_name', 'prrc_email', 'prrc_phone', 'prrc_responsible_for', 'prrc_address', 'prrc_postcode', 'prrc_country',
    'ca_name', 'ca_address', 'ca_postcode', 'ca_country', 'ca_email', 'ca_phone',
    'applicable_legislation', 'basic_udi_di_code', 'risk_class', 'implantable', 'measuring', 'reusable', 'active', 'administering_medicine',
    'device_model', 'device_name', 'issuing_agency', 'status', 'nomenclature_codes', 'trade_names', 'reference_number', 'direct_marking',
    'quantity_of_device', 'single_use', 'max_reuses', 'sterilization_need', 'sterile', 'contain_latex', 'reprocessed', 'placed_on_the_market', 'market_distribution'
  ];

  static detectDelimiter(csvText: string): string {
    const firstLine = csvText.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    
    
    
    // For EUDAMED exports, tabs are most common, prioritize them
    if (tabCount > 0) return '\t';
    if (commaCount >= semicolonCount) return ',';
    return ';';
  }

  static parseCSVData(csvText: string): EudamedCsvRow[] {
    const delimiter = this.detectDelimiter(csvText);
    // console.log('[EudamedImportService] Using delimiter:', JSON.stringify(delimiter));
    
    // Log first few lines of CSV for debugging
    const lines = csvText.split('\n');
    // console.log('[EudamedImportService] CSV first 3 lines:', lines.slice(0, 3));
    // console.log('[EudamedImportService] Total CSV lines:', lines.length);
    
    const result = Papa.parse(csvText, {
      header: true,
      delimiter,
      skipEmptyLines: true,
      trimHeaders: true,
      fastMode: false, // Disable fast mode for better malformed quote handling
      quoteChar: '"',
      escapeChar: '"',
      skipFirstNLines: 0,
      // Better error recovery - continue parsing even with malformed quotes
      error: (error: any) => {
        console.warn('[EudamedImportService] CSV parsing warning (continuing):', error.message);
      },
      transform: (value: string, field: string) => {
        // Clean up field values during parsing
        if (typeof value === 'string') {
          return value.trim().replace(/^"+|"+$/g, ''); // Remove extra quotes
        }
        return value;
      },
      transformHeader: (header: string) => {
        // Normalize header names to lowercase with underscores
        const trimmed = header.trim();
        const normalized = trimmed
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        // console.log('[EudamedImportService] Header transformation:', trimmed, '->', normalized);
        
        // Direct mapping for Excel headers to database columns
        const directMappings: Record<string, string> = {
          'udi_di': 'udi_di',
          'organization': 'organization',
          'id_srn': 'id_srn',
          'organization_status': 'organization_status',
          'address': 'address',
          'postcode': 'postcode',
          'country': 'country',
          'phone': 'phone',
          'email': 'email',
          'website': 'website',
          'prrc_first_name': 'prrc_first_name',
          'prrc_last_name': 'prrc_last_name',
          'prrc_email': 'prrc_email',
          'prrc_phone': 'prrc_phone',
          'prrc_responsible_for': 'prrc_responsible_for',
          'prrc_address': 'prrc_address',
          'prrc_postcode': 'prrc_postcode',
          'prrc_country': 'prrc_country',
          'ca_name': 'ca_name',
          'ca_address': 'ca_address',
          'ca_postcode': 'ca_postcode',
          'ca_country': 'ca_country',
          'ca_email': 'ca_email',
          'ca_phone': 'ca_phone',
          'applicable_legislation': 'applicable_legislation',
          'basic_udi_di_code': 'basic_udi_di_code',
          'risk_class': 'risk_class',
          'implantable': 'implantable',
          'measuring': 'measuring',
          'reusable': 'reusable',
          'active': 'active',
          'administering_medicine': 'administering_medicine',
          'device_model': 'device_model',
          'device_name': 'device_name',
          'issuing_agency': 'issuing_agency',
          'status': 'status',
          'nomenclature_codes': 'nomenclature_codes',
          'trade_names': 'trade_names',
          'reference_number': 'reference_number',
          'direct_marking': 'direct_marking',
          'quantity_of_device': 'quantity_of_device',
          'single_use': 'single_use',
          'max_reuses': 'max_reuses',
          'sterilization_need': 'sterilization_need',
          'sterile': 'sterile',
          'contain_latex': 'contain_latex',
          'reprocessed': 'reprocessed',
          'placed_on_the_market': 'placed_on_the_market',
          'market_distribution': 'market_distribution'
        };
        
        // Check direct mappings first
        if (directMappings[normalized]) {
          return directMappings[normalized];
        }
        
        // Check if the normalized header matches any expected column
        if (this.EXPECTED_COLUMNS.includes(normalized)) {
          return normalized;
        }
        
        // console.log('[EudamedImportService] Unmapped header:', normalized);
        return normalized;
      }
    });

    // Log parsing results for debugging
   
    
    if (result.errors.length > 0) {
      console.warn('[EudamedImportService] CSV parsing errors (continuing with valid rows):', result.errors);
      // Don't return empty array, continue with valid rows
    }

   
    
    
    const filteredData = result.data
      .map((row: any) => {
        const cleanRow: any = {
          udi_di: String(row.udi_di || '').trim(),
          id_srn: String(row.id_srn || row.udi_di || '').trim() // Use udi_di as fallback for id_srn
        };
        
        // Map all other columns with field length validation
        this.EXPECTED_COLUMNS.slice(2).forEach(col => {
          if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
            // Ensure value is a string and handle undefined/null cases
            const rawValue = row[col];
            if (rawValue === undefined || rawValue === null) return;
            
            let value = String(rawValue).trim();
            if (!value) return; // Skip empty strings after trimming
            
            // Apply field length constraints to prevent data corruption
            const fieldLimits: Record<string, number> = {
              'device_name': 1000,
              'device_model': 500,
              'organization': 300,
              'trade_names': 1000,
              'address': 500,
              'ca_address': 500,
              'prrc_address': 500,
              'ca_name': 300,
              'nomenclature_codes': 2000,
              'id_srn': 50,
              'udi_di': 100
            };
            
            // Check if value exists and has length property before accessing it
            if (fieldLimits[col] && value && typeof value === 'string' && value.length > fieldLimits[col]) {
              console.warn(`[EudamedImportService] Truncating ${col} from ${value.length} to ${fieldLimits[col]} characters`);
              value = value.substring(0, fieldLimits[col]);
            }
            
            cleanRow[col] = value;
          }
        });
        
        // Validate that id_srn is not empty
        if (!cleanRow.id_srn) {
          console.warn('[EudamedImportService] Row missing id_srn, using udi_di as fallback:', cleanRow.udi_di);
          cleanRow.id_srn = cleanRow.udi_di;
        }
        
        return cleanRow;
      })
      .filter(row => row.udi_di && row.id_srn); // Only keep rows with both UDI_DI and ID_SRN

    // console.log('[EudamedImportService] Filtered data count:', filteredData.length);
    if (filteredData.length > 0) {
      // console.log('[EudamedImportService] Sample filtered row:', filteredData[0]);
    }

    return filteredData;
  }

  static async importEudamedData(
    csvText: string,
    onProgress?: (processed: number, total: number, operation: string) => void
  ): Promise<EudamedImportResult> {
    // console.log('[EudamedImportService] EUDAMED import re-enabled with correct primary key (udi_di)');
    
    try {
      // console.log('[EudamedImportService] Starting EUDAMED import with corrected schema');
      
      // 1. Verify user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('[EudamedImportService] Authentication failed:', authError);
        return {
          totalRows: 0,
          imported: 0,
          errors: ['User not authenticated. Please sign in and try again.'],
          success: false
        };
      }
      
      // console.log('[EudamedImportService] User authenticated:', user.id);
      
      const csvRows = this.parseCSVData(csvText);
      if (csvRows.length === 0) {
        return {
          totalRows: 0,
          imported: 0,
          errors: ['No valid data found in CSV. Ensure UDI_DI column is present and not empty.'],
          success: false
        };
      }

      // console.log(`[EudamedImportService] Parsed ${csvRows.length} rows`);
      onProgress?.(0, csvRows.length, 'Preparing data');

      // Batch insert with smaller batches for large datasets
      const batchSize = 25; // Smaller batches for better reliability
      let imported = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Pre-validate all rows have required udi_di (primary key)
      const validRows = csvRows.filter(row => {
        if (!row.udi_di || row.udi_di.trim() === '') {
          console.warn('[EudamedImportService] Skipping row with empty udi_di:', row);
          return false;
        }
        return true;
      });

      if (validRows.length !== csvRows.length) {
        const skipped = csvRows.length - validRows.length;
        warnings.push(`Skipped ${skipped} rows with missing udi_di values`);
      }

      // console.log(`[EudamedImportService] Processing ${validRows.length} valid rows in batches of ${batchSize}`);

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        // console.log(`[EudamedImportService] Processing batch ${batchNumber}: ${batch.length} items`);
        onProgress?.(i, validRows.length, `Processing batch ${batchNumber}`);
        
        // Verify auth context before each batch
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          console.error('[EudamedImportService] Lost authentication during import');
          errors.push(`Batch ${batchNumber}: Authentication lost during import`);
          break;
        }

        try {
          // Use udi_di as the conflict resolution key (now the primary key)
          const { error: insertError } = await (supabase as any)
            .from('eudamed_device_registry')
            .upsert(batch, {
              onConflict: 'udi_di',  // Changed from 'id_srn' to 'udi_di'
              ignoreDuplicates: false
            });

          if (insertError) {
            console.error(`[EudamedImportService] Batch ${batchNumber} error details:`, {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint
            });
            
            const errorMessage = insertError.message || 'Unknown database error';
            
            // For constraint violations, try individual inserts with better error handling
            if (insertError.code === '23505' || errorMessage.toLowerCase().includes('duplicate')) {
              // console.log(`[EudamedImportService] Handling duplicates individually for batch ${batchNumber}`);
              let batchImported = 0;
              
              for (let j = 0; j < batch.length; j++) {
                const rowData = batch[j];
                
                try {
                  const { error: singleError } = await (supabase as any)
                    .from('eudamed_device_registry')
                    .upsert([rowData], {
                      onConflict: 'udi_di', // Changed from 'id_srn' to 'udi_di'
                      ignoreDuplicates: false
                    });
                    
                  if (!singleError) {
                    batchImported++;
                  } else if (singleError.code === '23505' || singleError.message?.toLowerCase().includes('duplicate')) {
                    // Duplicate - this is expected and counts as successful update
                    batchImported++;
                    // console.log(`[EudamedImportService] Updated existing record: ${rowData.udi_di}`);
                  } else {
                    const rowErrorMsg = singleError.message || 'Unknown error';
                    console.error(`[EudamedImportService] Individual insert failed for row ${i + j + 1}:`, singleError);
                    errors.push(`Row ${i + j + 1} (${rowData.udi_di}): ${rowErrorMsg}`);
                  }
                } catch (rowError) {
                  const rowErrorMsg = rowError instanceof Error ? rowError.message : 'Unknown error';
                  console.error(`[EudamedImportService] Exception in individual insert for row ${i + j + 1}:`, rowError);
                  errors.push(`Row ${i + j + 1} (${rowData.udi_di}): ${rowErrorMsg}`);
                }
              }
              
              imported += batchImported;
              // console.log(`[EudamedImportService] Batch ${batchNumber} individual processing: ${batchImported}/${batch.length} successful`);
              
            } else {
              // Non-duplicate error - this is a real failure
              errors.push(`Batch ${batchNumber}: ${errorMessage}`);
              console.error(`[EudamedImportService] Batch ${batchNumber} failed completely:`, insertError);
            }
            
          } else {
            imported += batch.length;
            // console.log(`[EudamedImportService] Batch ${batchNumber} successful: ${batch.length} items imported`);
          }
          
        } catch (batchError) {
          const batchErrorMsg = batchError instanceof Error ? batchError.message : 'Unknown error';
          console.error(`[EudamedImportService] Exception in batch ${batchNumber}:`, batchError);
          errors.push(`Batch ${batchNumber}: ${batchErrorMsg}`);
        }
        
        // Add delay between batches to prevent timeout issues
        if (i + batchSize < validRows.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      onProgress?.(csvRows.length, csvRows.length, 'Import completed');
      // console.log(`[EudamedImportService] Import completed: ${imported}/${csvRows.length} items imported`);

      return {
        totalRows: csvRows.length,
        imported,
        errors,
        warnings,
        success: imported > 0 && errors.length < csvRows.length * 0.1 // Success if >90% imported
      };

    } catch (error) {
      console.error('[EudamedImportService] Import failed:', error);
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
      // First parse raw CSV to get original headers with robust error handling
      const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        trimHeaders: true,
        fastMode: false, // Better malformed quote handling
        transformHeader: (header: string) => header.trim(), // Only trim, don't transform
        error: (error: any) => {
          console.warn('[EudamedImportService] Validation parsing warning:', error.message);
        }
      });
      
      if (result.errors.length > 0) {
        console.warn('[EudamedImportService] Validation parsing errors (continuing):', result.errors);
        // Only add errors for critical parsing failures, not malformed quotes
        result.errors.forEach(error => {
          if (error.type === 'Delimiter' || error.type === 'FieldMismatch') {
            errors.push(`CSV parsing error: ${error.message}`);
          } else {
            console.warn('[EudamedImportService] Non-critical parsing warning:', error.message);
          }
        });
      }
      
      const rawData = result.data as any[];
      const rawHeaders = result.meta.fields || [];
      
      if (rawData.length === 0) {
        errors.push('No valid data rows found. Ensure UDI_DI column is present and contains data.');
        return { isValid: false, errors, warnings };
      }

      // Now parse with our column mapping for further validation
      const csvRows = this.parseCSVData(csvText);
      
      if (csvRows.length === 0) {
        errors.push('No valid data rows found. Ensure UDI_DI column is present and contains data.');
        return { isValid: false, errors, warnings };
      }

      // Check for required UDI_DI column
      const firstRow = csvRows[0];
      if (!firstRow.udi_di) {
        errors.push('UDI_DI column is missing or empty - this is the primary key and is required');
      }

      // Check for duplicate UDI_DI values
      const udiSet = new Set();
      const duplicates = new Set();
      csvRows.forEach((row, index) => {
        if (udiSet.has(row.udi_di)) {
          duplicates.add(row.udi_di);
        }
        udiSet.add(row.udi_di);
      });

      if (duplicates.size > 0) {
        warnings.push(`Duplicate UDI_DI values found (${duplicates.size}). These will be updated instead of inserted.`);
      }

      // Check data size warnings
      if (csvRows.length > 1000) {
        warnings.push(`Large dataset detected (${csvRows.length} rows). Import may take several minutes.`);
      }

      if (csvRows.length > 10000) {
        warnings.push(`Very large dataset (${csvRows.length} rows). Consider splitting into smaller files for better performance.`);
      }

      // Check for column count (should be close to 49 expected columns)
      const firstRowKeys = Object.keys(firstRow).filter(key => firstRow[key as keyof EudamedCsvRow] !== undefined);
      if (firstRowKeys.length < 5) {
        warnings.push(`Only ${firstRowKeys.length} columns detected. Expected up to ${this.EXPECTED_COLUMNS.length} columns for complete EUDAMED data.`);
      }

      // Debug logging for headers
      // console.log('[EudamedImportService] Raw headers:', rawHeaders);
      // console.log('[EudamedImportService] First row keys:', Object.keys(firstRow));
      // console.log('[EudamedImportService] First row organization value:', firstRow.organization);
      
      // Check for column presence (not content validity) - "-" is a valid EUDAMED value
      const hasOrganization = rawHeaders.some(header => 
        header.toLowerCase().includes('organization') || header.toLowerCase().includes('organisation')
      ) || Object.keys(firstRow).some(key => key.toLowerCase().includes('organization'));
      
      const hasDeviceName = rawHeaders.some(header => 
        header.toLowerCase().includes('device') && header.toLowerCase().includes('name')
      ) || Object.keys(firstRow).some(key => key.toLowerCase().includes('device') && key.toLowerCase().includes('name'));
      
      const hasRiskClass = rawHeaders.some(header => 
        header.toLowerCase().includes('risk') && header.toLowerCase().includes('class')
      ) || Object.keys(firstRow).some(key => key.toLowerCase().includes('risk') && key.toLowerCase().includes('class'));

      // Only show warnings if columns are truly missing
      if (!hasOrganization) warnings.push('No organization names found - consider adding organization column');
      if (!hasDeviceName) warnings.push('No device names found - consider adding device_name column');
      if (!hasRiskClass) warnings.push('No risk classifications found - consider adding risk_class column');

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