
import { supabase } from '@/integrations/supabase/client';

export interface SimplePhaseMapping {
  id: string;
  name: string;
  company_id: string;
}

export async function getPhaseMapping(companyId: string): Promise<SimplePhaseMapping[]> {
  try {
    const { data, error } = await supabase
      .from('company_chosen_phases')
      .select(`
        company_phases!inner(id, name, company_id)
      `)
      .eq('company_id', companyId);

    if (error) throw error;

    return (data || []).map(cp => ({
      id: cp.company_phases.id,
      name: cp.company_phases.name,
      company_id: cp.company_phases.company_id
    }));
  } catch (error) {
    console.error('Error fetching phase mapping:', error);
    return [];
  }
}

// Add missing exports for compatibility
export async function getCompanyPhaseMappings(companyId: string): Promise<SimplePhaseMapping[]> {
  return getPhaseMapping(companyId);
}

export function findPhaseByName(phases: SimplePhaseMapping[], name: string): SimplePhaseMapping | null {
  return phases.find(phase => phase.name.toLowerCase().includes(name.toLowerCase())) || null;
}

export function getFirstPhase(phases: SimplePhaseMapping[]): SimplePhaseMapping | null {
  return phases.length > 0 ? phases[0] : null;
}
