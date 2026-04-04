import { supabase } from '@/integrations/supabase/client';

export interface SystemRequirement {
  id: string;
  company_id: string;
  product_id: string;
  requirement_id: string;
  description: string;
  category?: string;
  status: string;
  verification_method?: string;
  priority: string;
  acceptance_criteria?: string;
  rationale?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSystemRequirementData {
  product_id: string;
  company_id: string;
  requirement_id: string;
  description: string;
  category?: string;
  status?: string;
  verification_method?: string;
  priority?: string;
  acceptance_criteria?: string;
  rationale?: string;
}

export class SystemRequirementsService {
  static async getByProductId(productId: string): Promise<SystemRequirement[]> {
    const { data, error } = await supabase
      .from('system_requirements')
      .select('*')
      .eq('product_id', productId)
      .order('requirement_id');

    if (error) throw error;
    return data || [];
  }

  static async create(input: CreateSystemRequirementData): Promise<SystemRequirement> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('system_requirements')
      .insert({
        ...input,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<CreateSystemRequirementData>): Promise<SystemRequirement> {
    const { isObjectBaselined } = await import('./baselineLockService');
    const lockStatus = await isObjectBaselined(id, 'system_requirement');
    if (lockStatus.locked) {
      throw new Error(`BASELINE_LOCKED: This object was baselined in "${lockStatus.reviewTitle}" on ${lockStatus.baselineDate}. Submit a Change Control Request to modify it.`);
    }

    const { data, error } = await supabase
      .from('system_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('system_requirements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const systemRequirementsService = new SystemRequirementsService();
