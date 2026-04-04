
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { GlobalPhaseNumberingService } from "@/services/globalPhaseNumberingService";

export function useCompanyPhases(companyId: string | undefined) {
  const fetchCompanyPhases = async () => {
    if (!companyId) return [];
    
    try {
      // First ensure the company has the detailed design category
      const { error: categoryError } = await supabase.rpc('ensure_detailed_design_category', {
        company_id_param: companyId
      });
      
      if (categoryError) {
        console.warn("Error ensuring detailed design category:", categoryError);
      }
      
      // Fetch company's chosen phases in the correct order using company_phases
      const { data: chosenPhases, error: chosenError } = await supabase
        .from('company_chosen_phases')
        .select(`
          phase_id,
          position,
          company_phases!inner(id, name, description, company_id)
        `)
        .eq('company_id', companyId)
        .order('position');
      
      if (chosenError) {
        console.error("Error fetching chosen phases:", chosenError);
        throw chosenError;
      }
      
      if (!chosenPhases || chosenPhases.length === 0) {
        console.log("No chosen phases found, ensuring standardized phases");
        
        // Ensure company has standardized numbered phases
        try {
          await GlobalPhaseNumberingService.standardizeCompanyPhases(companyId);
        } catch (err) {
          // If standardization fails due to existing phases, that's ok - just continue
          console.warn("Phase standardization skipped:", err);
        }
        
        // Retry fetching after standardization attempt
        const { data: newChosenPhases, error: newChosenError } = await supabase
          .from('company_chosen_phases')
          .select(`
            phase_id,
            position,
            company_phases!inner(id, name, description, company_id)
          `)
          .eq('company_id', companyId)
          .order('position');
        
        if (!newChosenError && newChosenPhases) {
          return newChosenPhases
            .filter(cp => cp.company_phases && (cp.company_phases as any).company_id === companyId)
            .map(cp => ({
              id: (cp.company_phases as any).id,
              name: (cp.company_phases as any).name,
              description: (cp.company_phases as any).description
            }));
        }
        
        // If still no phases, return empty array instead of throwing
        return [];
      } else {
        // Filter out phases with invalid references and ensure consistency
        const validPhases = chosenPhases
          .filter(cp => cp.company_phases && (cp.company_phases as any).company_id === companyId)
          .map(cp => ({
            id: (cp.company_phases as any).id,
            name: (cp.company_phases as any).name,
            description: (cp.company_phases as any).description
          }));
        
        // Check if phases need numbering update
        const needsNumbering = validPhases.some(phase => 
          !/^\(\d{2}\)\s/.test(phase.name)
        );
        
        if (needsNumbering) {
          console.log("Applying numbering to existing phases");
          await GlobalPhaseNumberingService.standardizeCompanyPhases(companyId);
          
          // Refetch after numbering
          const { data: numberedPhases, error: numberedError } = await supabase
            .from('company_chosen_phases')
            .select(`
              phase_id,
              position,
              company_phases!inner(id, name, description, company_id)
            `)
            .eq('company_id', companyId)
            .order('position');
          
          if (!numberedError && numberedPhases) {
            return numberedPhases
              .filter(cp => cp.company_phases && (cp.company_phases as any).company_id === companyId)
              .map(cp => ({
                id: (cp.company_phases as any).id,
                name: (cp.company_phases as any).name,
                description: (cp.company_phases as any).description
              }));
          }
        }
        
        return validPhases;
      }
    } catch (err) {
      console.error('Error fetching company phases:', err);
      throw err instanceof Error ? err : new Error('Failed to fetch phases');
    }
  };

  const { data: phases = [], isLoading, error, refetch } = useQuery({
    queryKey: ['useCompanyPhases', companyId],
    queryFn: fetchCompanyPhases,
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1, // Reduce retries for performance
  });


  return {
    phases,
    isLoading,
    error: error?.message || null,
    refetch
  };
}
