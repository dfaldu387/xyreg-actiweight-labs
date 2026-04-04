
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhaseInitializationResult {
  success: boolean;
  message: string;
  phasesCreated: number;
  phasesActivated: number;
  error?: string;
}

interface CategoryResult {
  success: boolean;
  categoryId?: string;
  message?: string;
}

export class CompanyPhaseInitializationService {
  /**
   * Ensure a company has all 15 standard design control phases
   */
  static async ensureStandardPhases(companyId: string): Promise<PhaseInitializationResult> {
    try {
      console.log(`[CompanyPhaseInitializationService] Ensuring standard phases for company: ${companyId}`);

      // Step 1: Ensure the system category exists
      const categoryResult = await this.ensureSystemCategory(companyId);
      if (!categoryResult.success) {
        return {
          success: false,
          message: categoryResult.message || 'Failed to create system category',
          phasesCreated: 0,
          phasesActivated: 0
        };
      }

      // Step 2: Check what phases already exist in company_phases
      const { data: existingPhases, error: existingError } = await supabase
        .from('company_phases')
        .select('name, id')
        .eq('company_id', companyId);

      if (existingError) throw existingError;

      const existingPhaseNames = new Set((existingPhases || []).map(p => p.name));
      
      // Step 3: Create missing phases in company_phases
      const standardPhases = this.getStandardPhaseDefinitions();
      const missingPhases = standardPhases.filter(phase => !existingPhaseNames.has(phase.name));
      
      let phasesCreated = 0;
      const createdPhaseIds: string[] = [];
      
      if (missingPhases.length > 0) {
        const { data: createdPhases, error: createError } = await supabase
          .from('company_phases')
          .insert(missingPhases.map(phase => ({
            company_id: companyId,
            name: phase.name,
            description: phase.description,
            position: phase.position,
            category_id: categoryResult.categoryId,
            is_active: true,
            duration_days: 30 // Default duration
          })))
          .select('id, name');

        if (createError) throw createError;
        phasesCreated = createdPhases?.length || 0;
        createdPhaseIds.push(...(createdPhases?.map(p => p.id) || []));
      }

      // Step 4: Ensure all company phases are in company_chosen_phases
      const { data: allCompanyPhases, error: allPhasesError } = await supabase
        .from('company_phases')
        .select('id, name, position')
        .eq('company_id', companyId)
        .order('position');

      if (allPhasesError) throw allPhasesError;

      // Get existing chosen phases
      const { data: existingChosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id')
        .eq('company_id', companyId);

      if (chosenError) throw chosenError;

      const chosenPhaseIds = new Set((existingChosenPhases || []).map(cp => cp.phase_id));
      const missingChosenPhases = (allCompanyPhases || []).filter(phase => !chosenPhaseIds.has(phase.id));

      let phasesActivated = 0;
      if (missingChosenPhases.length > 0) {
        const chosenPhaseInserts = missingChosenPhases.map((phase, index) => ({
          company_id: companyId,
          phase_id: phase.id,
          position: phase.position || (index + 1)
        }));

        const { error: insertError } = await supabase
          .from('company_chosen_phases')
          .insert(chosenPhaseInserts);

        if (insertError) throw insertError;
        phasesActivated = missingChosenPhases.length;
      }

      return {
        success: true,
        message: `Successfully initialized ${phasesCreated} new phases and activated ${phasesActivated} phases`,
        phasesCreated,
        phasesActivated
      };

    } catch (error) {
      console.error('[CompanyPhaseInitializationService] Error:', error);
      return {
        success: false,
        message: 'Failed to initialize company phases',
        phasesCreated: 0,
        phasesActivated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ensure the system category exists
   */
  private static async ensureSystemCategory(companyId: string): Promise<CategoryResult> {
    try {
      // Check if category exists
      const { data: existingCategory, error: categoryFetchError } = await supabase
        .from('phase_categories')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', 'Detailed Design Control Steps')
        .single();

      if (categoryFetchError && categoryFetchError.code !== 'PGRST116') {
        throw categoryFetchError;
      }

      if (existingCategory) {
        return { success: true, categoryId: existingCategory.id };
      }

      // Create the category
      const { data: newCategory, error: categoryCreateError } = await supabase
        .from('phase_categories')
        .insert({
          company_id: companyId,
          name: 'Detailed Design Control Steps',
          position: 1,
          is_system_category: true
        })
        .select('id')
        .single();

      if (categoryCreateError) throw categoryCreateError;

      return { success: true, categoryId: newCategory.id };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create system category: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Activate all system phases for a company
   */
  private static async activateSystemPhases(companyId: string): Promise<number> {
    try {
      // Get all system phases for this company
      const { data: systemPhases, error: phasesError } = await supabase
        .from('phases')
        .select('id, position')
        .eq('company_id', companyId)
        .eq('is_predefined_core_phase', true)
        .order('position');

      if (phasesError) throw phasesError;

      if (!systemPhases || systemPhases.length === 0) {
        return 0;
      }

      // Clear existing chosen phases to avoid conflicts
      await supabase
        .from('company_chosen_phases')
        .delete()
        .eq('company_id', companyId);

      // Add all system phases as active with proper positioning
      const chosenPhaseInserts = systemPhases.map((phase, index) => ({
        company_id: companyId,
        phase_id: phase.id,
        position: index + 1 // Use sequential positioning to avoid conflicts
      }));

      const { error: insertError } = await supabase
        .from('company_chosen_phases')
        .insert(chosenPhaseInserts);

      if (insertError) throw insertError;

      return systemPhases.length;
    } catch (error) {
      console.error('[CompanyPhaseInitializationService] Error activating phases:', error);
      return 0;
    }
  }

  /**
   * Get the standard 15 phase definitions
   */
  private static getStandardPhaseDefinitions() {
    return [
      { name: '(01) Concept & Feasibility', description: 'Initial concept development and feasibility assessment', position: 1 },
      { name: '(02) Design Planning', description: 'Planning and preparation for design activities', position: 2 },
      { name: '(03) Design Input', description: 'Definition of design requirements and inputs', position: 3 },
      { name: '(04) Design Output', description: 'Creation of design outputs and specifications', position: 4 },
      { name: '(05) Verification', description: 'Verification that design outputs meet design inputs', position: 5 },
      { name: '(06) Validation (Design, Clinical, Usability)', description: 'Validation of the design under actual use conditions', position: 6 },
      { name: '(07) Design Transfer', description: 'Transfer of design to manufacturing', position: 7 },
      { name: '(08) Design Change Control', description: 'Management of design changes throughout lifecycle', position: 8 },
      { name: '(09) Risk Management', description: 'Ongoing risk assessment and management', position: 9 },
      { name: '(10) Configuration Management', description: 'Management of design configuration and versions', position: 10 },
      { name: '(11) Technical Documentation', description: 'Creation and maintenance of technical documentation', position: 11 },
      { name: '(12) Clinical Evaluation', description: 'Clinical assessment and evaluation activities', position: 12 },
      { name: '(13) Post-Market Surveillance', description: 'Ongoing monitoring and surveillance activities', position: 13 },
      { name: '(14) Design Review', description: 'Systematic reviews of design at key stages', position: 14 },
      { name: '(15) Design History File', description: 'Compilation and maintenance of design history documentation', position: 15 }
    ];
  }

  /**
   * Validate that a company has proper phase setup
   */
  static async validateCompanyPhases(companyId: string): Promise<{
    isValid: boolean;
    totalPhases: number;
    activePhases: number;
    systemPhases: number;
    issues: string[];
  }> {
    try {
      const { data: phases, error: phasesError } = await supabase
        .from('company_phases')
        .select('id, name')
        .eq('company_id', companyId);

      if (phasesError) throw phasesError;

      const { data: activePhases, error: activeError } = await supabase
        .from('company_chosen_phases')
        .select('phase_id')
        .eq('company_id', companyId);

      if (activeError) throw activeError;

      const totalPhases = phases?.length || 0;
      const activeCount = activePhases?.length || 0;
      const systemPhases = totalPhases; // All company_phases are considered system phases

      const issues: string[] = [];
      if (totalPhases < 15) issues.push(`Only ${totalPhases} phases found, expected 15`);
      if (activeCount === 0) issues.push('No active phases configured');
      if (activeCount !== totalPhases) issues.push(`${totalPhases - activeCount} phases not activated`);

      return {
        isValid: issues.length === 0,
        totalPhases,
        activePhases: activeCount,
        systemPhases,
        issues
      };
    } catch (error) {
      return {
        isValid: false,
        totalPhases: 0,
        activePhases: 0,
        systemPhases: 0,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}
