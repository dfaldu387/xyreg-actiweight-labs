
import { supabase } from "@/integrations/supabase/client";

export interface PhaseCreationData {
  name: string;
  description: string;
  categoryName: string;
}

export interface CategoryCreationData {
  name: string;
  companyId: string;
}

/**
 * Find existing phase by EXACT name only - NO name cleaning or smart matching
 * Fixed to use company_phases table consistently
 */
async function findExactPhaseMatch(phaseName: string, companyId: string): Promise<{ id: string; name: string } | null> {
  // console.log(`[PhaseCreation] Looking for EXACT phase match: "${phaseName}" in company: ${companyId}`);
  
  const { data: phase, error } = await supabase
    .from('company_phases') // Use company_phases consistently
    .select('id, name')
    .eq('company_id', companyId)
    .eq('name', phaseName) // EXACT match only - no name cleaning
    .maybeSingle();

  if (error) {
    console.error('[PhaseCreation] Error in exact phase lookup:', error);
    return null;
  }

  if (phase) {
    // console.log(`[PhaseCreation] Found EXACT phase match: "${phase.name}"`);
    return phase;
  }

  // console.log(`[PhaseCreation] No EXACT phase match found for: "${phaseName}"`);
  return null;
}

/**
 * Create a new phase category if it doesn't exist
 */
export async function ensurePhaseCategory(categoryName: string, companyId: string): Promise<string> {
  // console.log(`[PhaseCreation] Ensuring category exists: "${categoryName}" for company: ${companyId}`);
  
  // Check if category already exists
  const { data: existingCategory, error: lookupError } = await supabase
    .from('phase_categories')
    .select('id')
    .eq('company_id', companyId)
    .eq('name', categoryName)
    .maybeSingle();

  if (lookupError) {
    console.error('[PhaseCreation] Error looking up category:', lookupError);
    throw new Error(`Failed to lookup category "${categoryName}": ${lookupError.message}`);
  }

  if (existingCategory) {
    // console.log(`[PhaseCreation] Found existing category: "${categoryName}" with ID: ${existingCategory.id}`);
    return existingCategory.id;
  }

  // Create new category
  // console.log(`[PhaseCreation] Creating new category: "${categoryName}"`);
  const { data: newCategory, error: createError } = await supabase
    .from('phase_categories')
    .insert({
      company_id: companyId,
      name: categoryName
    })
    .select('id')
    .single();

  if (createError) {
    console.error('[PhaseCreation] Error creating category:', createError);
    throw new Error(`Failed to create category "${categoryName}": ${createError.message}`);
  }

  // console.log(`[PhaseCreation] Successfully created category: "${categoryName}" with ID: ${newCategory.id}`);
  return newCategory.id;
}

/**
 * Find or create a phase with EXACT name matching only - preserves CSV naming format
 * Fixed to use company_phases table consistently
 */
export async function findOrCreatePhase(phaseData: PhaseCreationData, companyId: string): Promise<{ phaseId: string; wasCreated: boolean }> {
  // console.log(`[PhaseCreation] =====================================`);
  // console.log(`[PhaseCreation] Processing phase with EXACT CSV name: "${phaseData.name}"`);
  // console.log(`[PhaseCreation] Company ID: ${companyId}`);

  // Try to find existing phase using EXACT matching only - no name cleaning
  const existingPhase = await findExactPhaseMatch(phaseData.name, companyId);
  
  if (existingPhase) {
    // console.log(`[PhaseCreation] ✅ Reusing existing phase with EXACT name: "${existingPhase.name}" (ID: ${existingPhase.id})`);
    return { phaseId: existingPhase.id, wasCreated: false };
  }

  // Phase doesn't exist, create it with EXACT name from CSV (preserve numbering format)
  // console.log(`[PhaseCreation] 🆕 Creating new phase with EXACT CSV name: "${phaseData.name}"`);

  try {
    // Ensure category exists first
    // console.log(`[PhaseCreation] Ensuring category exists: "${phaseData.categoryName}"`);
    const categoryId = await ensurePhaseCategory(phaseData.categoryName, companyId);
    // console.log(`[PhaseCreation] Category ID obtained: ${categoryId}`);

    // Get the next position for this company
    // console.log(`[PhaseCreation] Getting next position for company: ${companyId}`);
    const { data: maxPosition, error: positionError } = await supabase
      .from('company_phases') // Use company_phases consistently
      .select('position')
      .eq('company_id', companyId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (positionError) {
      console.error('[PhaseCreation] Error getting max position:', positionError);
      // Continue with position 1 as fallback
    }

    const nextPosition = (maxPosition?.position || 0) + 1;
    // console.log(`[PhaseCreation] Next position will be: ${nextPosition}`);

    // Create new phase with EXACT CSV name - NO name cleaning or modifications
    // console.log(`[PhaseCreation] Inserting phase with data:`, { company_id: companyId, name: phaseData.name, description: phaseData.description, position: nextPosition, category_id: categoryId, is_active: true });

    const { data: newPhase, error: createError } = await supabase
      .from('company_phases') // Use company_phases consistently
      .insert({
        company_id: companyId,
        name: phaseData.name, // Use EXACT name from CSV - preserve format like "(01) Concept & Feasibility"
        description: phaseData.description,
        position: nextPosition,
        category_id: categoryId,
        is_active: true,
        duration_days: 30 // Default duration
      })
      .select('id')
      .single();

    if (createError) {
      console.error(`[PhaseCreation] ❌ Database error creating phase "${phaseData.name}":`, createError);
      console.error('[PhaseCreation] Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });
      
      // Check if this is a constraint error (duplicate name)
      if (createError.message.includes('already exists') || 
          createError.code === '23505' || 
          createError.message.includes('duplicate') ||
          createError.message.includes('unique')) {
        // console.log(`[PhaseCreation] 🔄 Constraint error detected, attempting EXACT name recovery...`);
        
        // Try to find the conflicting phase with EXACT name
        const conflictingPhase = await findExactPhaseMatch(phaseData.name, companyId);
        
        if (conflictingPhase) {
          // console.log(`[PhaseCreation] ✅ Recovery successful: found conflicting phase with EXACT name "${conflictingPhase.name}"`);
          return { phaseId: conflictingPhase.id, wasCreated: false };
        }
      }
      
      throw new Error(`Failed to create phase "${phaseData.name}": ${createError.message}`);
    }

    // console.log(`[PhaseCreation] ✅ Successfully created phase with EXACT CSV name: "${phaseData.name}" with ID: ${newPhase.id}`);
    return { phaseId: newPhase.id, wasCreated: true };

  } catch (error) {
    console.error(`[PhaseCreation] ❌ Error in findOrCreatePhase for "${phaseData.name}":`, error);
    
    // Last attempt - try to find any matching phase with EXACT name
    // console.log(`[PhaseCreation] 🚨 Last attempt EXACT name recovery...`);
    const lastResort = await findExactPhaseMatch(phaseData.name, companyId);
    if (lastResort) {
      // console.log(`[PhaseCreation] ✅ Last attempt recovery successful with EXACT name: "${lastResort.name}"`);
      return { phaseId: lastResort.id, wasCreated: false };
    }
    
    throw error;
  }
}

/**
 * Process CSV data to create/find phases and add documents - handles existing phases gracefully
 * Fixed to use company_phases table consistently
 */
export async function processPhaseCreation(parsedData: any[], companyId: string): Promise<{
  categoriesCreated: number;
  phasesCreated: number;
  phasesReused: number;
  createdItems: { type: 'category' | 'phase' | 'phase-reused', name: string }[];
}> {
  const createdItems: { type: 'category' | 'phase' | 'phase-reused', name: string }[] = [];
  const processedCategories = new Set<string>();
  let categoriesCreated = 0;
  let phasesCreated = 0;
  let phasesReused = 0;

  // console.log(`[PhaseCreation] Processing ${parsedData.length} rows for company ${companyId}`);

  // First pass: identify unique phases from CSV
  const uniquePhases = new Map<string, PhaseCreationData>();
  
  for (const row of parsedData) {
    if (row.phaseName && row.phaseDescription && row.categoryName) {
      const key = `${row.phaseName}:${row.categoryName}`;
      if (!uniquePhases.has(key)) {
        uniquePhases.set(key, {
          name: row.phaseName,
          description: row.phaseDescription,
          categoryName: row.categoryName
        });
      }
    }
  }

  // console.log(`[PhaseCreation] Found ${uniquePhases.size} unique phases to process`);

  // Second pass: find or create categories and phases
  for (const phaseData of uniquePhases.values()) {
    try {
      // console.log(`[PhaseCreation] Processing phase: "${phaseData.name}" in category: "${phaseData.categoryName}"`);
      
      // Create category if not already processed in this batch
      if (!processedCategories.has(phaseData.categoryName)) {
        const { data: existingCategory } = await supabase
          .from('phase_categories')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', phaseData.categoryName)
          .maybeSingle();

        if (!existingCategory) {
          await ensurePhaseCategory(phaseData.categoryName, companyId);
          createdItems.push({ type: 'category', name: phaseData.categoryName });
          categoriesCreated++;
          // console.log(`[PhaseCreation] Created new category: "${phaseData.categoryName}"`);
        } else {
          // console.log(`[PhaseCreation] Reusing existing category: "${phaseData.categoryName}"`);
        }
        processedCategories.add(phaseData.categoryName);
      }

      // Find or create phase
      const { phaseId, wasCreated } = await findOrCreatePhase(phaseData, companyId);
      
      if (wasCreated) {
        createdItems.push({ type: 'phase', name: phaseData.name });
        phasesCreated++;
        // console.log(`[PhaseCreation] ✅ Created new phase: "${phaseData.name}"`);
      } else {
        createdItems.push({ type: 'phase-reused', name: phaseData.name });
        phasesReused++;
        // console.log(`[PhaseCreation] ✅ Reused existing phase: "${phaseData.name}"`);
      }

    } catch (error) {
      console.error(`[PhaseCreation] Error processing phase/category:`, error);
      throw error;
    }
  }

  // console.log(`[PhaseCreation] Completed: ${categoriesCreated} categories created, ${phasesCreated} phases created, ${phasesReused} phases reused`);
  return { categoriesCreated, phasesCreated, phasesReused, createdItems };
}
