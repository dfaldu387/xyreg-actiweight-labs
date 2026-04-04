
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
 * Fixed bulk import phase creation service with EXACT name matching only
 * No normalization, no filtering, no "smart" matching - respects exact phase names
 */

/**
 * Find existing phase by EXACT name only
 */
async function findPhaseByName(phaseName: string, companyId: string): Promise<{ id: string; name: string } | null> {
  // console.log(`[FixedPhaseCreation] Looking for phase with EXACT name: "${phaseName}" in company: ${companyId}`);
  
  // Only exact match - no normalization, no filtering, no "smart" matching
  const { data: exactMatch, error: exactError } = await supabase
    .from('company_phases')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('name', phaseName)
    .maybeSingle();

  if (exactError) {
    console.error('[FixedPhaseCreation] Error in exact phase lookup:', exactError);
    return null;
  }

  if (exactMatch) {
    // console.log(`[FixedPhaseCreation] Found exact match: "${exactMatch.name}"`);
    return exactMatch;
  }

  // console.log(`[FixedPhaseCreation] No exact match found for: "${phaseName}"`);
  return null;
}

/**
 * Create a new phase category if it doesn't exist
 */
export async function ensurePhaseCategory(categoryName: string, companyId: string): Promise<string> {
  // console.log(`[FixedPhaseCreation] Ensuring category exists: "${categoryName}" for company: ${companyId}`);
  
  // Check if category already exists
  const { data: existingCategory, error: lookupError } = await supabase
    .from('phase_categories')
    .select('id')
    .eq('company_id', companyId)
    .eq('name', categoryName)
    .maybeSingle();

  if (lookupError) {
    console.error('[FixedPhaseCreation] Error looking up category:', lookupError);
    throw new Error(`Failed to lookup category "${categoryName}": ${lookupError.message}`);
  }

  if (existingCategory) {
    // console.log(`[FixedPhaseCreation] Found existing category: "${categoryName}" with ID: ${existingCategory.id}`);
    return existingCategory.id;
  }

  // Create new category
  // console.log(`[FixedPhaseCreation] Creating new category: "${categoryName}"`);
  const { data: newCategory, error: createError } = await supabase
    .from('phase_categories')
    .insert({
      company_id: companyId,
      name: categoryName
    })
    .select('id')
    .single();

  if (createError) {
    console.error('[FixedPhaseCreation] Error creating category:', createError);
    throw new Error(`Failed to create category "${categoryName}": ${createError.message}`);
  }

  // console.log(`[FixedPhaseCreation] Successfully created category: "${categoryName}" with ID: ${newCategory.id}`);
  return newCategory.id;
}

/**
 * Find or create a phase with EXACT name matching only
 */
export async function findOrCreatePhase(phaseData: PhaseCreationData, companyId: string): Promise<{ phaseId: string; wasCreated: boolean }> {
  // console.log(`[FixedPhaseCreation] Processing phase with EXACT name: "${phaseData.name}"`);
  // console.log(`[FixedPhaseCreation] Company ID: ${companyId}`);

  // Try to find existing phase with EXACT name only
  const existingPhase = await findPhaseByName(phaseData.name, companyId);
  
  if (existingPhase) {
    // console.log(`[FixedPhaseCreation] ✅ Reusing existing phase: "${existingPhase.name}" (ID: ${existingPhase.id})`);
    return { phaseId: existingPhase.id, wasCreated: false };
  }

  // Phase doesn't exist, create it with the EXACT name from CSV
  // console.log(`[FixedPhaseCreation] 🆕 Creating new phase with EXACT name: "${phaseData.name}"`);

  try {
    // Ensure category exists first
    // console.log(`[FixedPhaseCreation] Ensuring category exists: "${phaseData.categoryName}"`);
    const categoryId = await ensurePhaseCategory(phaseData.categoryName, companyId);
    // console.log(`[FixedPhaseCreation] Category ID obtained: ${categoryId}`);

    // Get the next position for this company
    // console.log(`[FixedPhaseCreation] Getting next position for company: ${companyId}`);
    const { data: maxPosition, error: positionError } = await supabase
      .from('company_phases')
      .select('position')
      .eq('company_id', companyId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (positionError) {
      console.error('[FixedPhaseCreation] Error getting max position:', positionError);
      // Continue with position 1 as fallback
    }

    const nextPosition = (maxPosition?.position || 0) + 1;
    // console.log(`[FixedPhaseCreation] Next position will be: ${nextPosition}`);

    // Create new phase with EXACT name from CSV
    // console.log(`[FixedPhaseCreation] Inserting phase with EXACT data:`, { company_id: companyId, name: phaseData.name, description: phaseData.description, position: nextPosition, category_id: categoryId, is_active: true });

    const { data: newPhase, error: createError } = await supabase
      .from('company_phases')
      .insert({
        company_id: companyId,
        name: phaseData.name, // EXACT name from CSV - no modifications
        description: phaseData.description,
        position: nextPosition,
        duration_days: 30, // Default duration
        category_id: categoryId,
        is_active: true
      })
      .select('id')
      .single();

    if (createError) {
      console.error(`[FixedPhaseCreation] ❌ Database error creating phase "${phaseData.name}":`, createError);
      
      // Check if this is a constraint error (duplicate name)
      if (createError.message.includes('already exists') || 
          createError.code === '23505' || 
          createError.message.includes('duplicate') ||
          createError.message.includes('unique')) {
        // console.log(`[FixedPhaseCreation] 🔄 Constraint error detected, attempting recovery...`);
        
        // Try to find the conflicting phase with EXACT name
        const conflictingPhase = await findPhaseByName(phaseData.name, companyId);
        
        if (conflictingPhase) {
          // console.log(`[FixedPhaseCreation] ✅ Recovery successful: found conflicting phase "${conflictingPhase.name}"`);
          return { phaseId: conflictingPhase.id, wasCreated: false };
        }
      }
      
      throw new Error(`Failed to create phase "${phaseData.name}": ${createError.message}`);
    }

    // console.log(`[FixedPhaseCreation] ✅ Successfully created phase with EXACT name: "${phaseData.name}" with ID: ${newPhase.id}`);
    return { phaseId: newPhase.id, wasCreated: true };

  } catch (error) {
    console.error(`[FixedPhaseCreation] ❌ Error in findOrCreatePhase for "${phaseData.name}":`, error);
    
    // Last attempt - try to find any matching phase with EXACT name
    // console.log(`[FixedPhaseCreation] 🚨 Last attempt recovery...`);
    const lastResort = await findPhaseByName(phaseData.name, companyId);
    if (lastResort) {
      // console.log(`[FixedPhaseCreation] ✅ Last attempt recovery successful: "${lastResort.name}"`);
      return { phaseId: lastResort.id, wasCreated: false };
    }
    
    throw error;
  }
}
