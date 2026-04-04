import { supabase } from '@/integrations/supabase/client';

export class PhaseMigrationHelper {
  /**
   * Clean up phase naming conflicts and finalize Phase 2 migration
   */
  static async finalizePhaseMigration(): Promise<void> {
    try {
      console.log('[PhaseMigration] Starting phase migration finalization...');
      
      // Get all companies and process them individually
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_archived', false);
      
      if (companiesError) {
        console.error('[PhaseMigration] Error fetching companies:', companiesError);
        throw companiesError;
      }
      
      // Process each company to clean up phase naming conflicts
      for (const company of companies || []) {
        await this.cleanupCompanyPhases(company.id);
      }
      
      console.log('[PhaseMigration] Phase migration finalization completed successfully');
    } catch (error) {
      console.error('[PhaseMigration] Failed to finalize migration:', error);
      throw error;
    }
  }
  
  /**
   * Clean up phases for a specific company using the new consolidated structure
   */
  private static async cleanupCompanyPhases(companyId: string): Promise<void> {
    try {
      console.log(`[PhaseMigration] Cleaning up phases for company ${companyId}`);
      
      // Get current active phases for this company from consolidated table
      const { data: phases, error } = await supabase
        .from('company_phases')
        .select('id, name, position')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('position');
      
      if (error) throw error;
      
      const standardNames = [
        '(01) Concept & Feasibility',
        '(02) Design Planning', 
        '(03) Design Input',
        '(04) Design Output',
        '(05) Verification',
        '(06) Validation (Design, Clinical, Usability)',
        '(07) Design Transfer',
        '(08) Design Change Control',
        '(09) Risk Management',
        '(10) Configuration Management',
        '(11) Technical Documentation',
        '(12) Clinical Evaluation',
        '(13) Post-Market Surveillance',
        '(14) Design Review',
        '(15) Design History File'
      ];
      
      // Check if this company needs standardization
      const needsStandardization = (phases || []).some((phase, index) => {
        const expectedName = standardNames[index];
        const expectedPosition = index + 1;
        return phase.name !== expectedName || phase.position !== expectedPosition;
      });
      
      if (!needsStandardization) {
        console.log(`[PhaseMigration] Company ${companyId} already has standardized phases`);
        return;
      }
      
      console.log(`[PhaseMigration] Standardizing ${phases?.length || 0} phases for company ${companyId}`);
      
      // Update phases to match standard naming and positioning
      for (let i = 0; i < Math.min(phases?.length || 0, 15); i++) {
        const phase = phases![i];
        const standardName = standardNames[i];
        const standardPosition = i + 1;
        
        if (phase.name !== standardName || phase.position !== standardPosition) {
          await supabase
            .from('company_phases')
            .update({
              name: standardName,
              position: standardPosition,
              updated_at: new Date().toISOString()
            })
            .eq('id', phase.id);
          
          console.log(`[PhaseMigration] Updated phase ${phase.id}: ${phase.name} -> ${standardName}`);
        }
      }
      
      // If company has fewer than 15 phases, the migration should have already created them
      // This is just cleanup, so we don't create new phases here
      
    } catch (error) {
      console.error(`[PhaseMigration] Error cleaning up phases for company ${companyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Verify migration was successful
   */
  static async verifyMigration(companyId: string): Promise<{
    success: boolean;
    phaseCount: number;
    hasStandardNaming: boolean;
    issues: string[];
  }> {
    try {
      const { data: phases, error } = await supabase
        .from('company_phases')
        .select('id, name, position')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('position');
      
      if (error) throw error;
      
      const issues: string[] = [];
      const phaseCount = phases?.length || 0;
      
      // Check if we have exactly 15 phases
      if (phaseCount !== 15) {
        issues.push(`Expected 15 phases, found ${phaseCount}`);
      }
      
      // Check if phases have standard naming format
      const hasStandardNaming = phases?.every(phase => 
        phase.name.match(/^\(\d{2}\)/) !== null
      ) || false;
      
      if (!hasStandardNaming) {
        issues.push('Phases do not follow standard (01), (02), ... naming format');
      }
      
      // Check for position gaps
      const positions = phases?.map(p => p.position).sort((a, b) => a - b) || [];
      const expectedPositions = Array.from({length: 15}, (_, i) => i + 1);
      const hasCorrectPositions = JSON.stringify(positions) === JSON.stringify(expectedPositions);
      
      if (!hasCorrectPositions) {
        issues.push('Phase positions are not sequential (1-15)');
      }
      
      return {
        success: issues.length === 0,
        phaseCount,
        hasStandardNaming,
        issues
      };
    } catch (error) {
      console.error('[PhaseMigration] Verification failed:', error);
      return {
        success: false,
        phaseCount: 0,
        hasStandardNaming: false,
        issues: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
  
  /**
   * Emergency cleanup function to resolve duplicate naming conflicts
   */
  static async emergencyCleanupDuplicates(): Promise<void> {
    try {
      console.log('[PhaseMigration] Starting emergency duplicate cleanup...');
      
      // Find all companies with duplicate phase names
      const { data: duplicates, error } = await supabase
        .from('company_phases')
        .select('company_id, name, id, created_at')
        .eq('is_active', true)
        .order('company_id, name, created_at');
      
      if (error) throw error;
      
      // Group by company and name to find duplicates
      const duplicateGroups = new Map<string, Array<{id: string, created_at: string}>>();
      
      for (const phase of duplicates || []) {
        const key = `${phase.company_id}:${phase.name}`;
        if (!duplicateGroups.has(key)) {
          duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key)!.push({
          id: phase.id,
          created_at: phase.created_at
        });
      }
      
      // Process duplicates - keep the oldest, remove the rest
      for (const [key, phases] of duplicateGroups) {
        if (phases.length > 1) {
          console.log(`[PhaseMigration] Found ${phases.length} duplicates for ${key}`);
          
          // Sort by created_at and keep the first (oldest)
          phases.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const toDelete = phases.slice(1); // Remove all but the first
          
          for (const phase of toDelete) {
            // First remove from chosen phases
            await supabase
              .from('company_chosen_phases')
              .delete()
              .eq('phase_id', phase.id);
            
            // Then deactivate the phase
            await supabase
              .from('company_phases')
              .update({ is_active: false })
              .eq('id', phase.id);
            
            console.log(`[PhaseMigration] Deactivated duplicate phase ${phase.id}`);
          }
        }
      }
      
      console.log('[PhaseMigration] Emergency duplicate cleanup completed');
    } catch (error) {
      console.error('[PhaseMigration] Emergency cleanup failed:', error);
      throw error;
    }
  }
}
