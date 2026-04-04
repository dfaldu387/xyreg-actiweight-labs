
import { supabase } from '@/integrations/supabase/client';

export interface Phase {
  id: string;
  name: string;
  description?: string;
  position: number;
  company_id: string;
}

export async function createPhase(companyId: string, name: string, description?: string): Promise<Phase> {
  try {
    const { data, error } = await supabase
      .from('company_phases')
      .insert({
        company_id: companyId,
        name,
        description,
        position: 0,
        duration_days: 30
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating phase:', error);
    throw error;
  }
}

export async function deletePhase(phaseId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_phases')
      .delete()
      .eq('id', phaseId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting phase:', error);
    return false;
  }
}

export async function getPhasesByCompany(companyId: string): Promise<Phase[]> {
  try {
    const { data, error } = await supabase
      .from('company_phases')
      .select('*')
      .eq('company_id', companyId)
      .order('position');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching phases:', error);
    return [];
  }
}
