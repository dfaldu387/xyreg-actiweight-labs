import { supabase } from '@/integrations/supabase/client';

export interface SoftwareRequirement {
  id: string;
  company_id: string;
  product_id: string;
  requirement_id: string;
  description: string;
  category?: string;
  status: string;
  safety_classification?: string;
  verification_method?: string;
  priority: string;
  acceptance_criteria?: string;
  rationale?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSoftwareRequirementData {
  product_id: string;
  company_id: string;
  requirement_id: string;
  description: string;
  category?: string;
  status?: string;
  safety_classification?: string;
  verification_method?: string;
  priority?: string;
  acceptance_criteria?: string;
  rationale?: string;
}

export class SoftwareRequirementsService {
  static async getByProductId(productId: string): Promise<SoftwareRequirement[]> {
    const { data, error } = await supabase
      .from('software_requirements')
      .select('*')
      .eq('product_id', productId)
      .order('requirement_id');

    if (error) throw error;
    return data || [];
  }

  static async create(input: CreateSoftwareRequirementData): Promise<SoftwareRequirement> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('software_requirements')
      .insert({
        ...input,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<CreateSoftwareRequirementData>): Promise<SoftwareRequirement> {
    const { isObjectBaselined } = await import('./baselineLockService');
    const lockStatus = await isObjectBaselined(id, 'software_requirement');
    if (lockStatus.locked) {
      throw new Error(`BASELINE_LOCKED: This object was baselined in "${lockStatus.reviewTitle}" on ${lockStatus.baselineDate}. Submit a Change Control Request to modify it.`);
    }

    const { data, error } = await supabase
      .from('software_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('software_requirements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const softwareRequirementsService = new SoftwareRequirementsService();
