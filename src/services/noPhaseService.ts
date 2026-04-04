import { supabase } from "@/integrations/supabase/client";

const NO_PHASE_NAME = "No Phase";
const NO_PHASE_DESCRIPTION = "Documents not assigned to any specific phase";

export interface NoPhaseInfo {
  id: string;
  name: string;
  description: string;
}

/**
 * Service to manage the "No Phase" system phase for company documents
 */
export class NoPhaseService {
  /**
   * Get or create the "No Phase" entry for a company
   * This ensures every company has a "No Phase" option in company_phases
   */
  static async getOrCreateNoPhase(companyId: string): Promise<NoPhaseInfo | null> {
    try {
      console.log('[NoPhaseService] Getting or creating No Phase for company:', companyId);

      // First, check if "No Phase" already exists for this company
      const { data: existingPhase, error: findError } = await supabase
        .from('company_phases')
        .select('id, name, description')
        .eq('company_id', companyId)
        .eq('name', NO_PHASE_NAME)
        .maybeSingle();

      if (findError) {
        console.error('[NoPhaseService] Error finding No Phase:', findError);
        throw findError;
      }

      if (existingPhase) {
        console.log('[NoPhaseService] Found existing No Phase:', existingPhase.id);
        return {
          id: existingPhase.id,
          name: existingPhase.name,
          description: existingPhase.description || NO_PHASE_DESCRIPTION
        };
      }

      // Create "No Phase" if it doesn't exist
      console.log('[NoPhaseService] Creating No Phase for company:', companyId);

      const { data: newPhase, error: createError } = await supabase
        .from('company_phases')
        .insert({
          company_id: companyId,
          name: NO_PHASE_NAME,
          description: NO_PHASE_DESCRIPTION,
          position: -1, // Position before all other phases
          duration_days: 0,
          is_active: true
        })
        .select('id, name, description')
        .single();

      if (createError) {
        console.error('[NoPhaseService] Error creating No Phase:', createError);
        throw createError;
      }

      console.log('[NoPhaseService] Created No Phase:', newPhase.id);

      // Also add to company_chosen_phases so it appears in active phases
      const { error: chosenError } = await supabase
        .from('company_chosen_phases')
        .insert({
          company_id: companyId,
          phase_id: newPhase.id,
          position: -1 // Position before all other phases
        });

      if (chosenError) {
        console.error('[NoPhaseService] Error adding No Phase to chosen phases:', chosenError);
        // Don't throw - the phase was created successfully
      }

      return {
        id: newPhase.id,
        name: newPhase.name,
        description: newPhase.description || NO_PHASE_DESCRIPTION
      };
    } catch (error) {
      console.error('[NoPhaseService] Error in getOrCreateNoPhase:', error);
      return null;
    }
  }

  /**
   * Get the No Phase ID for a company (creates if doesn't exist)
   */
  static async getNoPhaseId(companyId: string): Promise<string | null> {
    const noPhase = await this.getOrCreateNoPhase(companyId);
    return noPhase?.id || null;
  }

  /**
   * Check if a phase ID is the "No Phase"
   */
  static async isNoPhase(phaseId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('company_phases')
        .select('name')
        .eq('id', phaseId)
        .single();

      if (error || !data) return false;
      return data.name === NO_PHASE_NAME;
    } catch {
      return false;
    }
  }

  /**
   * Get the No Phase name constant
   */
  static getNoPhaseNameConstant(): string {
    return NO_PHASE_NAME;
  }

  /**
   * Get statistics about No Phase across all companies
   */
  static async getNoPhaseStats(): Promise<{
    totalCompanies: number;
    companiesWithNoPhase: number;
    companiesWithoutNoPhase: { id: string; name: string }[];
    companiesWithoutChosenPhase: { id: string; name: string }[];
  }> {
    try {
      // Get all companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (companiesError) {
        console.error('[NoPhaseService] Error fetching companies:', companiesError);
        throw companiesError;
      }

      if (!companies || companies.length === 0) {
        return {
          totalCompanies: 0,
          companiesWithNoPhase: 0,
          companiesWithoutNoPhase: [],
          companiesWithoutChosenPhase: []
        };
      }

      // Get all No Phase entries from company_phases
      const { data: noPhases, error: noPhasesError } = await supabase
        .from('company_phases')
        .select('id, company_id')
        .eq('name', NO_PHASE_NAME);

      if (noPhasesError) {
        console.error('[NoPhaseService] Error fetching No Phase entries:', noPhasesError);
        throw noPhasesError;
      }

      const noPhaseMap = new Map<string, string>(); // company_id -> phase_id
      (noPhases || []).forEach(p => noPhaseMap.set(p.company_id, p.id));
      const companiesWithoutNoPhase = companies.filter(c => !noPhaseMap.has(c.id));

      // Get all company_chosen_phases entries for "No Phase" phase IDs
      const noPhaseIds = Array.from(noPhaseMap.values());
      let chosenPhaseCompanyIds = new Set<string>();
      if (noPhaseIds.length > 0) {
        const { data: chosenPhases } = await supabase
          .from('company_chosen_phases')
          .select('company_id, phase_id')
          .in('phase_id', noPhaseIds);
        chosenPhaseCompanyIds = new Set((chosenPhases || []).map(cp => cp.company_id));
      }

      // Companies that have No Phase in company_phases but NOT in company_chosen_phases
      const companiesWithoutChosenPhase = companies.filter(c => noPhaseMap.has(c.id) && !chosenPhaseCompanyIds.has(c.id));

      return {
        totalCompanies: companies.length,
        companiesWithNoPhase: noPhaseMap.size,
        companiesWithoutNoPhase,
        companiesWithoutChosenPhase
      };
    } catch (error) {
      console.error('[NoPhaseService] Error in getNoPhaseStats:', error);
      throw error;
    }
  }

  /**
   * Initialize No Phase for all companies that don't have it
   * Returns the number of companies that were updated
   */
  /**
   * Fix companies that have No Phase in company_phases but not in company_chosen_phases
   */
  static async fixMissingChosenPhases(
    onProgress?: (current: number, total: number, companyName: string) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const stats = await this.getNoPhaseStats();
      const { companiesWithoutChosenPhase } = stats;

      if (companiesWithoutChosenPhase.length === 0) {
        return { success: 0, failed: 0, errors: [] };
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < companiesWithoutChosenPhase.length; i++) {
        const company = companiesWithoutChosenPhase[i];
        if (onProgress) {
          onProgress(i + 1, companiesWithoutChosenPhase.length, company.name);
        }

        try {
          // Get the No Phase ID for this company
          const { data: noPhase } = await supabase
            .from('company_phases')
            .select('id')
            .eq('company_id', company.id)
            .eq('name', NO_PHASE_NAME)
            .maybeSingle();

          if (!noPhase) {
            failed++;
            errors.push(`No Phase entry not found for ${company.name}`);
            continue;
          }

          const { error } = await supabase
            .from('company_chosen_phases')
            .insert({
              company_id: company.id,
              phase_id: noPhase.id,
              position: -1
            });

          if (error) {
            // Ignore duplicate constraint
            if (error.code === '23505') {
              success++;
            } else {
              failed++;
              errors.push(`Error for ${company.name}: ${error.message}`);
            }
          } else {
            success++;
          }
        } catch (error) {
          failed++;
          errors.push(`Error for ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success, failed, errors };
    } catch (error) {
      console.error('[NoPhaseService] Error in fixMissingChosenPhases:', error);
      throw error;
    }
  }

  /**
   * Initialize No Phase for all companies that don't have it
   * Returns the number of companies that were updated
   */
  static async initializeNoPhaseForAllCompanies(
    onProgress?: (current: number, total: number, companyName: string) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const stats = await this.getNoPhaseStats();
      const { companiesWithoutNoPhase } = stats;

      if (companiesWithoutNoPhase.length === 0) {
        return { success: 0, failed: 0, errors: [] };
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < companiesWithoutNoPhase.length; i++) {
        const company = companiesWithoutNoPhase[i];

        if (onProgress) {
          onProgress(i + 1, companiesWithoutNoPhase.length, company.name);
        }

        try {
          const result = await this.getOrCreateNoPhase(company.id);
          if (result) {
            success++;
          } else {
            failed++;
            errors.push(`Failed to create No Phase for ${company.name}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Error for ${company.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { success, failed, errors };
    } catch (error) {
      console.error('[NoPhaseService] Error in initializeNoPhaseForAllCompanies:', error);
      throw error;
    }
  }
}
