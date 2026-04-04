
import { supabase } from '@/integrations/supabase/client';

export interface PhaseMapping {
  id: string;
  name: string;
  company_id: string;
  position: number;
}

export async function getCompanyPhaseMapping(companyId: string): Promise<PhaseMapping[]> {
  try {
    const { data, error } = await supabase
      .from('company_chosen_phases')
      .select(`
        position,
        company_phases!inner(id, name, company_id)
      `)
      .eq('company_id', companyId)
      .order('position');

    if (error) throw error;

    return (data || []).map(cp => ({
      id: cp.company_phases.id,
      name: cp.company_phases.name,
      company_id: cp.company_phases.company_id,
      position: cp.position
    }));
  } catch (error) {
    console.error('Error fetching phase mapping:', error);
    throw error;
  }
}

export function findPhaseByName(phases: PhaseMapping[], name: string): PhaseMapping | null {
  return phases.find(phase => phase.name.toLowerCase().includes(name.toLowerCase())) || null;
}

// Aliases for backward compatibility
export const getEnhancedCompanyPhaseMappings = getCompanyPhaseMapping;
export const findEnhancedPhaseByName = findPhaseByName;
