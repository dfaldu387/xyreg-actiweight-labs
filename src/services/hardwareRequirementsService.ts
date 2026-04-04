import { supabase } from '@/integrations/supabase/client';

export interface HardwareRequirement {
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
  material_specifications?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHardwareRequirementData {
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
  material_specifications?: string;
}

export class HardwareRequirementsService {
  static async getByProductId(productId: string): Promise<HardwareRequirement[]> {
    const { data, error } = await supabase
      .from('hardware_requirements')
      .select('*')
      .eq('product_id', productId)
      .order('requirement_id');

    if (error) throw error;
    return data || [];
  }

  static async create(input: CreateHardwareRequirementData): Promise<HardwareRequirement> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('hardware_requirements')
      .insert({
        ...input,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<CreateHardwareRequirementData>): Promise<HardwareRequirement> {
    const { data, error } = await supabase
      .from('hardware_requirements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('hardware_requirements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const hardwareRequirementsService = new HardwareRequirementsService();
