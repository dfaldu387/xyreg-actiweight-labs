
import { supabase } from "@/integrations/supabase/client";
import { CsvAuthenticationService } from "./csvAuthenticationService";

export interface BatchRow {
  documentName: string;
  documentType: string;
  documentStatus: string;
  techApplicability: string;
  description: string;
  phaseName: string;
  phaseDescription: string;
  categoryName: string;
}

export interface BatchResult {
  success: boolean;
  processed: number;
  created: number;
  skipped: number;
  errors: string[];
  authErrors: number;
}

/**
 * Batch processing service for CSV imports with authentication management
 * Processes imports in small batches to avoid session timeouts
 */
export class BatchCsvImportService {
  private static readonly BATCH_SIZE = 5; // Small batches to avoid timeout
  private static readonly MAX_RETRIES = 3;

  /**
   * Process CSV data in authenticated batches
   */
  static async processBatches(
    csvData: BatchRow[],
    companyId: string,
    onProgress?: (processed: number, total: number, currentOperation: string) => void
  ): Promise<BatchResult> {
    console.log('[BatchImport] Starting batch processing for', csvData.length, 'rows');
    
    // Initialize authentication monitoring
    await CsvAuthenticationService.initializeAuthMonitoring();
    
    const result: BatchResult = {
      success: false,
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [],
      authErrors: 0
    };

    try {
      // Split data into batches
      const batches = this.createBatches(csvData, this.BATCH_SIZE);
      console.log('[BatchImport] Created', batches.length, 'batches');

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNumber = i + 1;
        
        onProgress?.(result.processed, csvData.length, `Processing batch ${batchNumber}/${batches.length}`);
        
        try {
          const batchResult = await this.processBatch(batch, companyId, batchNumber);
          
          result.processed += batchResult.processed;
          result.created += batchResult.created;
          result.skipped += batchResult.skipped;
          result.errors.push(...batchResult.errors);
          result.authErrors += batchResult.authErrors;
          
          // Small delay between batches to avoid overwhelming the server
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (error) {
          console.error(`[BatchImport] Batch ${batchNumber} failed:`, error);
          result.errors.push(`Batch ${batchNumber} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.authErrors === 0 && result.errors.length < csvData.length / 2;
      
      console.log('[BatchImport] Batch processing completed:', result);
      return result;

    } finally {
      // Stop authentication monitoring
      CsvAuthenticationService.stopAuthMonitoring();
    }
  }

  /**
   * Process a single batch with authentication validation
   */
  private static async processBatch(
    batch: BatchRow[],
    companyId: string,
    batchNumber: number
  ): Promise<BatchResult> {
    console.log(`[BatchImport] Processing batch ${batchNumber} with ${batch.length} rows`);
    
    const result: BatchResult = {
      success: false,
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [],
      authErrors: 0
    };

    for (const row of batch) {
      try {
        // Process with authentication check
        await CsvAuthenticationService.withAuthCheck(async () => {
          await this.processRow(row, companyId);
          result.created++;
        }, `processing row: ${row.documentName}`);
        
        result.processed++;
        
      } catch (error) {
        console.error('[BatchImport] Row processing error:', error);
        
        if (error instanceof Error && error.message.includes('Authentication')) {
          result.authErrors++;
        }
        
        result.errors.push(`${row.documentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.processed++;
      }
    }

    result.success = result.authErrors === 0;
    return result;
  }

  /**
   * Process a single row with proper error handling
   */
  private static async processRow(row: BatchRow, companyId: string): Promise<void> {
    // Step 1: Find or create phase
    const phase = await this.findOrCreatePhase(row, companyId);
    
    // Step 2: Create document if it doesn't exist
    if (row.documentName) {
      await this.createDocumentIfNotExists(phase.id, row);
    }
  }

  /**
   * Find or create phase using exact name matching
   */
  private static async findOrCreatePhase(row: BatchRow, companyId: string): Promise<{ id: string; name: string }> {
    // Try to find existing phase in company_phases
    const { data: existingPhase, error: findError } = await supabase
      .from('company_phases')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('name', row.phaseName)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to lookup phase "${row.phaseName}": ${findError.message}`);
    }

    if (existingPhase) {
      return existingPhase;
    }

    // Create new phase
    const { data: newPhase, error: createError } = await supabase
      .from('company_phases')
      .insert({
        company_id: companyId,
        name: row.phaseName,
        description: row.phaseDescription,
        position: await this.getNextPhasePosition(companyId),
        is_active: true,
        duration_days: 30 // Default duration
      })
      .select('id, name')
      .single();

    if (createError) {
      throw new Error(`Failed to create phase "${row.phaseName}": ${createError.message}`);
    }

    return newPhase;
  }

  /**
   * Create document if it doesn't already exist
   */
  private static async createDocumentIfNotExists(phaseId: string, row: BatchRow): Promise<void> {
    // Check if document already exists
    const { data: existingDoc, error: checkError } = await supabase
      .from('phase_assigned_documents')
      .select('id')
      .eq('phase_id', phaseId)
      .eq('name', row.documentName)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Failed to check existing document "${row.documentName}": ${checkError.message}`);
    }

    if (existingDoc) {
      return; // Document already exists, skip
    }

    // Create new document
    const { error: insertError } = await supabase
      .from('phase_assigned_documents')
      .insert({
        phase_id: phaseId,
        name: row.documentName,
        document_type: row.documentType || 'Standard',
        status: row.documentStatus || 'Not Started',
        tech_applicability: row.techApplicability || 'All device types',
        document_scope: 'company_template' as const,
        markets: ['US', 'EU', 'CA', 'AU', 'JP'],
        classes_by_market: {
          "US": ["I", "II", "III"],
          "EU": ["I", "IIa", "IIb", "III"],
          "CA": ["I", "II", "III", "IV"]
        }
      });

    if (insertError) {
      throw new Error(`Failed to create document "${row.documentName}": ${insertError.message}`);
    }
  }

  /**
   * Get next position for phase
   */
  private static async getNextPhasePosition(companyId: string): Promise<number> {
    const { data, error } = await supabase
      .from('company_phases')
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

  /**
   * Split array into batches
   */
  private static createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }
}
