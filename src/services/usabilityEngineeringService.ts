import { supabase } from "@/integrations/supabase/client";

export interface IntendedUser {
  profile: string;
  characteristics: string;
  training_level: string;
}

export interface UseEnvironment {
  environment: string;
  conditions: string;
}

export interface UICharacteristic {
  feature: string;
  safety_relevance: 'critical' | 'moderate' | 'low';
  description: string;
  category?: 'displays' | 'controls' | 'alarms' | 'labels' | 'connectors' | 'other';
}

export interface UsabilityEngineeringFile {
  id: string;
  product_id: string;
  company_id: string;
  intended_use: string | null;
  intended_users: IntendedUser[];
  use_environments: UseEnvironment[];
  operating_principle: string | null;
  ui_characteristics: UICharacteristic[];
  formative_plan: string | null;
  summative_plan: string | null;
  ui_specification: string | null;
  accompanying_documents: string | null;
  status: string;
  version: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getUsabilityEngineeringFile(productId: string): Promise<UsabilityEngineeringFile | null> {
  const { data, error } = await supabase
    .from('usability_engineering_files')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching UEF:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    intended_users: (data.intended_users as IntendedUser[]) || [],
    use_environments: (data.use_environments as UseEnvironment[]) || [],
    ui_characteristics: (data.ui_characteristics as UICharacteristic[]) || [],
  };
}

export async function createUsabilityEngineeringFile(
  productId: string,
  companyId: string,
  userId: string
): Promise<UsabilityEngineeringFile> {
  const { data, error } = await supabase
    .from('usability_engineering_files')
    .insert({
      product_id: productId,
      company_id: companyId,
      created_by: userId,
      status: 'draft',
      version: '1.0',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating UEF:', error);
    throw error;
  }

  return {
    ...data,
    intended_users: [],
    use_environments: [],
    ui_characteristics: [],
  };
}

export async function updateUsabilityEngineeringFile(
  id: string,
  updates: Partial<Omit<UsabilityEngineeringFile, 'id' | 'product_id' | 'company_id' | 'created_at' | 'updated_at'>>
): Promise<UsabilityEngineeringFile> {
  const { data, error } = await supabase
    .from('usability_engineering_files')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating UEF:', error);
    throw error;
  }

  return {
    ...data,
    intended_users: (data.intended_users as IntendedUser[]) || [],
    use_environments: (data.use_environments as UseEnvironment[]) || [],
    ui_characteristics: (data.ui_characteristics as UICharacteristic[]) || [],
  };
}

export async function deleteUsabilityEngineeringFile(id: string): Promise<void> {
  const { error } = await supabase
    .from('usability_engineering_files')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting UEF:', error);
    throw error;
  }
}
