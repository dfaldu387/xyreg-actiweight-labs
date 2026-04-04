
import { supabase } from "@/integrations/supabase/client";
import { processPhaseCreation } from "./bulkImportPhaseCreation";

export interface ParsedCSVRow {
  documentName: string;
  documentType: string;
  documentStatus: string;
  techApplicability: string;
  description: string;
  phaseName: string;
  phaseDescription: string;
  categoryName: string;
}

export interface ImportResult {
  categoriesCreated: number;
  phasesCreated: number;
  phasesUpdated: number;
  phasesSkipped: number;
  phasesRenamed: number;
  documentsCreated: number;
  documentsUpdated: number;
  documentsSkipped: number;
  errors: string[];
}

/**
 * Enhanced CSV Import with EXACT phase name preservation - NO modifications allowed
 */
export async function importCSVData(
  parsedData: ParsedCSVRow[],
  companyIdentifier: string,
  options: { renameExistingPhases?: boolean } = {}
): Promise<ImportResult> {
  console.log('[csvImportService] Starting EXACT name import - NO phase name modifications');
  
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

  console.log('[csvImportService] Using company ID:', actualCompanyId);

  const result: ImportResult = {
    categoriesCreated: 0,
    phasesCreated: 0,
    phasesUpdated: 0,
    phasesSkipped: 0,
    phasesRenamed: 0,
    documentsCreated: 0,
    documentsUpdated: 0,
    documentsSkipped: 0,
    errors: []
  };

  try {
    // Step 1: Process phase creation with EXACT names - NO modifications
    console.log('[csvImportService] Processing phase creation with EXACT CSV names');
    const phaseResults = await processPhaseCreation(parsedData, actualCompanyId);
    
    result.categoriesCreated = phaseResults.categoriesCreated;
    result.phasesCreated = phaseResults.phasesCreated;
    // Note: phasesReused maps to phasesSkipped in this context
    result.phasesSkipped = phaseResults.phasesReused;

    console.log('[csvImportService] Phase creation completed:', {
      categoriesCreated: result.categoriesCreated,
      phasesCreated: result.phasesCreated,
      phasesSkipped: result.phasesSkipped
    });

    // Step 2: Process documents - preserve EXACT phase names from CSV
    console.log('[csvImportService] Processing documents with EXACT phase names');
    
    for (const row of parsedData) {
      if (!row.documentName) continue;

      try {
        // Find phase by EXACT name - NO modifications or smart matching
        const { data: phase, error: phaseError } = await supabase
          .from('phases')
          .select('id')
          .eq('company_id', actualCompanyId)
          .eq('name', row.phaseName) // EXACT match only
          .maybeSingle();

        if (phaseError) {
          console.error('[csvImportService] Phase lookup error:', phaseError);
          result.errors.push(`Failed to find phase "${row.phaseName}": ${phaseError.message}`);
          continue;
        }

        if (!phase) {
          console.error('[csvImportService] Phase not found with EXACT name:', row.phaseName);
          result.errors.push(`Phase not found: "${row.phaseName}"`);
          continue;
        }

        // Check if document already exists in this phase
        const { data: existingDoc, error: docCheckError } = await supabase
          .from('phase_assigned_documents')
          .select('id')
          .eq('phase_id', phase.id)
          .eq('name', row.documentName)
          .maybeSingle();

        if (docCheckError) {
          console.error('[csvImportService] Document check error:', docCheckError);
          result.errors.push(`Failed to check existing document "${row.documentName}": ${docCheckError.message}`);
          continue;
        }

        if (existingDoc) {
          console.log('[csvImportService] Document already exists, skipping:', row.documentName);
          result.documentsSkipped++;
          continue;
        }

        // Create phase assigned document
        const { error: insertError } = await supabase
          .from('phase_assigned_documents')
          .insert({
            phase_id: phase.id,
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
          console.error('[csvImportService] Document insert error:', insertError);
          result.errors.push(`Failed to create document "${row.documentName}": ${insertError.message}`);
          continue;
        }

        result.documentsCreated++;
        console.log('[csvImportService] Document created successfully:', row.documentName);

      } catch (error) {
        console.error('[csvImportService] Error processing document row:', error);
        result.errors.push(`Error processing "${row.documentName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('[csvImportService] Import completed with EXACT names:', result);
    return result;

  } catch (error) {
    console.error('[csvImportService] Import failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}
