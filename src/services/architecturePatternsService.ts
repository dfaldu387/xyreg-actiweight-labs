import { supabase } from "@/integrations/supabase/client";

export interface ArchitecturePattern {
  id: string;
  name: string;
  category: string;
  description: string;
  use_cases?: string;
  regulatory_context?: string;
  template_data?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class ArchitecturePatternsService {
  static async getAll(): Promise<ArchitecturePattern[]> {
    const { data, error } = await supabase
      .from('architecture_patterns')
      .select('*')
      .eq('is_active', true)
      .order('category, name');

    if (error) throw error;
    return data || [];
  }

  static async getByCategory(category: string): Promise<ArchitecturePattern[]> {
    const { data, error } = await supabase
      .from('architecture_patterns')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<ArchitecturePattern | null> {
    const { data, error } = await supabase
      .from('architecture_patterns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('architecture_patterns')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;
    
    const categories = [...new Set(data.map(p => p.category))];
    return categories.sort();
  }
}
