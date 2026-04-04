
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Phase {
  id: string;
  name: string;
}

/**
 * Fetches available phases from the database for a specific company
 */
export const fetchPhases = async (companyId?: string): Promise<{
  availablePhases: Phase[];
  phaseOrder: Phase[];
}> => {
  try {
    // If no company ID provided, return empty phases
    if (!companyId) {
      console.log("[fetchPhases] No company ID provided");
      return {
        availablePhases: [],
        phaseOrder: []
      };
    }

    console.log("[fetchPhases] Fetching phases for company:", companyId);
    
    // Fetch chosen phases in correct order with full phase objects
    const { data: chosenPhases, error: chosenError } = await supabase
      .from('company_chosen_phases')
      .select(`
        position,
        company_phases!inner(id, name)
      `)
      .eq('company_id', companyId)
      .order('position', { ascending: true });
      
    if (chosenError) {
      console.error("[fetchPhases] Error fetching chosen phases:", chosenError);
      throw chosenError;
    }
    
    if (chosenPhases && Array.isArray(chosenPhases)) {
      const phaseObjects = chosenPhases
        .filter(cp => cp.company_phases?.id && cp.company_phases?.name)
        .map(cp => ({
          id: cp.company_phases.id,
          name: cp.company_phases.name
        }));
      
      console.log("[fetchPhases] Found phases for company:", phaseObjects);
      
      return {
        availablePhases: phaseObjects,
        phaseOrder: phaseObjects // Use the database order as the authoritative order
      };
    }
    
    return {
      availablePhases: [],
      phaseOrder: []
    };
  } catch (error) {
    console.error('Error fetching phases:', error);
    toast.error('Failed to load phases');
    return {
      availablePhases: [],
      phaseOrder: []
    };
  }
};
