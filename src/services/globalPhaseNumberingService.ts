
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class GlobalPhaseNumberingService {
  /**
   * Extract position from phase database ordering instead of numbered format
   */
  static getPhasePosition(phaseName: string, allPhases: Array<{name: string, position: number}>): number {
    const phase = allPhases.find(p => p.name === phaseName);
    return phase?.position || 0;
  }
  
  /**
   * Ensure company phases are standardized with numbers by calling a Supabase RPC.
   */
  static async standardizeCompanyPhases(companyId: string): Promise<boolean> {
    try {
      console.log(`Phase standardization check for company: ${companyId}`);
      
      const { error } = await supabase.rpc('standardize_company_phases', {
        target_company_id: companyId
      });
      
      if (error) {
        // toast.error(`Failed to standardize phases: ${error.message}`);
        console.error("Error standardizing phases:", error);
        return false;
      }
      
      console.log('Phase standardization successful');
      return true;
      
    } catch (error) {
      console.error('Error calling standardizeCompanyPhases RPC:', error);
      toast.error('An unexpected error occurred during phase standardization.');
      return false;
    }
  }

  /**
   * Clean phase name by removing any number prefixes
   */
  static cleanPhaseName(phaseName: string): string {
    return phaseName.replace(/^\(\d+\)\s*|^\d+\.\s*/, '').trim();
  }

  /**
   * Alias for standardizeCompanyPhases to fix a typo in calling code.
   */
  static async standardizeAllCompanyPhases(companyId?: string): Promise<boolean> {
    if (!companyId) {
      const errorMsg = "standardizeAllCompanyPhases called without companyId";
      console.error(errorMsg);
      return false;
    }
    return this.standardizeCompanyPhases(companyId);
  }
}
