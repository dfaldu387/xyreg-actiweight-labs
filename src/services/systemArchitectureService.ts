import { supabase } from "@/integrations/supabase/client";

export interface SystemArchitectureDiagram {
  id: string;
  company_id: string;
  product_id: string;
  name: string;
  description?: string;
  version: string;
  diagram_data: any;
  metadata?: any;
  is_template: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  system_boundary?: {
    scope: string;
    inclusions: string[];
    exclusions: string[];
  };
  architecture_purpose?: string;
  design_rationale?: string;
  category?: string;
}

export interface CreateDiagramData {
  company_id: string;
  product_id: string;
  name: string;
  description?: string;
  version?: string;
  diagram_data?: any;
  metadata?: any;
  is_template?: boolean;
  system_boundary?: SystemArchitectureDiagram['system_boundary'];
  architecture_purpose?: string;
  design_rationale?: string;
  category?: string;
}

export interface UpdateDiagramData {
  name?: string;
  description?: string;
  version?: string;
  diagram_data?: any;
  metadata?: any;
  system_boundary?: SystemArchitectureDiagram['system_boundary'];
  architecture_purpose?: string;
  design_rationale?: string;
  category?: string;
}

export class SystemArchitectureService {
  static async getDiagrams(productId: string): Promise<SystemArchitectureDiagram[]> {
    const { data, error } = await supabase
      .from('system_architecture_diagrams')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as SystemArchitectureDiagram[];
  }

  static async getDiagram(id: string): Promise<SystemArchitectureDiagram | null> {
    const { data, error } = await supabase
      .from('system_architecture_diagrams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as SystemArchitectureDiagram;
  }

  static async createDiagram(diagramData: CreateDiagramData): Promise<SystemArchitectureDiagram> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const payload = {
      ...diagramData,
      version: diagramData.version || '1.0',
      diagram_data: diagramData.diagram_data || { nodes: [], edges: [] },
      is_template: diagramData.is_template || false,
      created_by: user.user.id,
    };

    const { data, error } = await supabase
      .from('system_architecture_diagrams')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as SystemArchitectureDiagram;
  }

  static async updateDiagram(id: string, updates: UpdateDiagramData): Promise<SystemArchitectureDiagram> {
    const { data, error } = await supabase
      .from('system_architecture_diagrams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SystemArchitectureDiagram;
  }

  static async deleteDiagram(id: string): Promise<void> {
    const { error } = await supabase
      .from('system_architecture_diagrams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async saveDiagramData(id: string, diagramData: any): Promise<void> {
    const { error } = await supabase
      .from('system_architecture_diagrams')
      .update({ 
        diagram_data: diagramData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  }

  static async getTemplates(): Promise<SystemArchitectureDiagram[]> {
    const { data, error } = await supabase
      .from('system_architecture_diagrams')
      .select('*')
      .eq('is_template', true)
      .order('name');

    if (error) throw error;
    return (data || []) as SystemArchitectureDiagram[];
  }
}