
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CsvRow {
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

interface ImportRequest {
  companyId: string;
  csvData: CsvRow[];
  mode: 'append' | 'replace';
}

interface ImportResult {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { companyId, csvData, mode = 'append' }: ImportRequest = await req.json()

    console.log(`[CreateStructureFromCsv] Starting ${mode} import for company:`, companyId)

    if (!companyId || !csvData || !Array.isArray(csvData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: companyId and csvData are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result: ImportResult = {
      success: false,
      categoriesCreated: 0,
      phasesCreated: 0,
      documentsCreated: 0,
      errors: [],
      details: []
    }

    // Step 1: Handle replace mode
    if (mode === 'replace') {
      console.log('[CreateStructureFromCsv] Clearing existing structure for replace mode')
      
      // Delete company phases (cascade will handle document templates)
      const { error: deleteError } = await supabaseClient
        .from('company_phases')
        .delete()
        .eq('company_id', companyId)

      if (deleteError) {
        throw new Error(`Failed to clear existing phases: ${deleteError.message}`)
      }

      // Delete categories
      await supabaseClient
        .from('phase_categories')
        .delete()
        .eq('company_id', companyId)
    }

    // Step 2: Process each CSV row with cascade logic
    for (const row of csvData) {
      try {
        // Get or create category
        const categoryId = await getOrCreateCategory(supabaseClient, companyId, row.categoryName)
        
        // Get or create phase
        const { phaseId, wasCreated: phaseCreated } = await getOrCreatePhase(
          supabaseClient,
          companyId, 
          row.phaseName, 
          row.phaseDescription, 
          categoryId
        )
        
        if (phaseCreated) {
          result.phasesCreated++
        }

        // Always create document template if document name exists
        if (row.documentName) {
          await createDocumentTemplate(supabaseClient, phaseId, row)
          result.documentsCreated++

          result.details.push({
            categoryName: row.categoryName,
            phaseName: row.phaseName,
            documentName: row.documentName,
            action: 'created'
          })
        }

      } catch (error) {
        const errorMsg = `Failed to process row: ${row.phaseName} - ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error('[CreateStructureFromCsv] Row processing error:', errorMsg)
        result.errors.push(errorMsg)
      }
    }

    result.success = result.errors.length === 0
    
    console.log('[CreateStructureFromCsv] Import completed:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CreateStructureFromCsv] Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions
async function getOrCreateCategory(supabaseClient: any, companyId: string, categoryName: string): Promise<string | null> {
  if (!categoryName) return null

  // Try to find existing category
  const { data: existingCategory, error: findError } = await supabaseClient
    .from('phase_categories')
    .select('id')
    .eq('company_id', companyId)
    .eq('name', categoryName)
    .maybeSingle()

  if (findError) {
    throw new Error(`Failed to lookup category: ${findError.message}`)
  }

  if (existingCategory) {
    return existingCategory.id
  }

  // Get next position
  const { data: posData } = await supabaseClient
    .from('phase_categories')
    .select('position')
    .eq('company_id', companyId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (posData?.[0]?.position || -1) + 1

  // Create new category
  const { data: newCategory, error: createError } = await supabaseClient
    .from('phase_categories')
    .insert({
      company_id: companyId,
      name: categoryName,
      position: nextPosition
    })
    .select('id')
    .single()

  if (createError) {
    throw new Error(`Failed to create category: ${createError.message}`)
  }

  return newCategory.id
}

async function getOrCreatePhase(
  supabaseClient: any,
  companyId: string,
  phaseName: string,
  phaseDescription: string,
  categoryId: string | null
): Promise<{ phaseId: string; wasCreated: boolean }> {
  // Try to find existing phase
  const { data: existingPhase, error: findError } = await supabaseClient
    .from('company_phases')
    .select('id')
    .eq('company_id', companyId)
    .eq('name', phaseName)
    .maybeSingle()

  if (findError) {
    throw new Error(`Failed to lookup phase: ${findError.message}`)
  }

  if (existingPhase) {
    return { phaseId: existingPhase.id, wasCreated: false }
  }

  // Get next position
  const { data: posData } = await supabaseClient
    .from('company_phases')
    .select('position')
    .eq('company_id', companyId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (posData?.[0]?.position || -1) + 1

  // Create new phase
  const { data: newPhase, error: createError } = await supabaseClient
    .from('company_phases')
    .insert({
      company_id: companyId,
      name: phaseName,
      description: phaseDescription,
      category_id: categoryId,
      position: nextPosition,
      is_active: true
    })
    .select('id')
    .single()

  if (createError) {
    throw new Error(`Failed to create phase: ${createError.message}`)
  }

  return { phaseId: newPhase.id, wasCreated: true }
}

async function createDocumentTemplate(supabaseClient: any, phaseId: string, row: CsvRow): Promise<void> {
  const { error } = await supabaseClient
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
    })

  if (error) {
    throw new Error(`Failed to create document template: ${error.message}`)
  }
}
