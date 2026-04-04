import { supabase } from "@/integrations/supabase/client";

export interface SystemInterface {
  id: string;
  company_id: string;
  product_id: string;
  diagram_id?: string;
  interface_id: string;
  source_subsystem_id?: string;
  destination_subsystem_id?: string;
  interface_type: 'electrical' | 'data' | 'mechanical' | 'user' | 'network' | 'other';
  protocol_specification?: string;
  data_flow_description?: string;
  criticality: 'low' | 'medium' | 'high' | 'safety_critical';
  metadata?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInterfaceData {
  company_id: string;
  product_id: string;
  diagram_id?: string;
  interface_id: string;
  source_subsystem_id?: string;
  destination_subsystem_id?: string;
  interface_type: SystemInterface['interface_type'];
  protocol_specification?: string;
  data_flow_description?: string;
  criticality?: SystemInterface['criticality'];
  metadata?: any;
}

export interface UpdateInterfaceData {
  source_subsystem_id?: string;
  destination_subsystem_id?: string;
  interface_type?: SystemInterface['interface_type'];
  protocol_specification?: string;
  data_flow_description?: string;
  criticality?: SystemInterface['criticality'];
  metadata?: any;
}

export class SystemInterfacesService {
  static async getByProduct(productId: string): Promise<SystemInterface[]> {
    const { data, error } = await supabase
      .from('system_interfaces')
      .select('*')
      .eq('product_id', productId)
      .order('interface_id');

    if (error) throw error;
    return (data || []) as SystemInterface[];
  }

  static async getByDiagram(diagramId: string): Promise<SystemInterface[]> {
    const { data, error } = await supabase
      .from('system_interfaces')
      .select('*')
      .eq('diagram_id', diagramId)
      .order('interface_id');

    if (error) throw error;
    return (data || []) as SystemInterface[];
  }

  static async getBySubsystem(subsystemId: string): Promise<SystemInterface[]> {
    const { data, error } = await supabase
      .from('system_interfaces')
      .select('*')
      .or(`source_subsystem_id.eq.${subsystemId},destination_subsystem_id.eq.${subsystemId}`)
      .order('interface_id');

    if (error) throw error;
    return (data || []) as SystemInterface[];
  }

  static async getById(id: string): Promise<SystemInterface | null> {
    const { data, error } = await supabase
      .from('system_interfaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as SystemInterface;
  }

  static async create(input: CreateInterfaceData): Promise<SystemInterface> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('system_interfaces')
      .insert({
        ...input,
        created_by: user?.id,
        criticality: input.criticality || 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    return data as SystemInterface;
  }

  static async update(id: string, updates: UpdateInterfaceData): Promise<SystemInterface> {
    const { data, error } = await supabase
      .from('system_interfaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SystemInterface;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('system_interfaces')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getNextInterfaceId(productId: string): Promise<string> {
    const { data } = await supabase
      .from('system_interfaces')
      .select('interface_id')
      .eq('product_id', productId)
      .order('interface_id', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return 'IF-001';

    const lastId = data[0].interface_id;
    const match = lastId.match(/IF-(\d+)/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      return `IF-${num.toString().padStart(3, '0')}`;
    }
    return 'IF-001';
  }
}
