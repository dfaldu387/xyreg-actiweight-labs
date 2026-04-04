import { supabase } from "@/integrations/supabase/client";

export interface SystemSubsystem {
  id: string;
  company_id: string;
  product_id: string;
  diagram_id?: string;
  subsystem_id: string;
  name: string;
  description?: string;
  type: 'hardware' | 'software' | 'mechanical' | 'user_interface' | 'external_service' | 'other';
  responsible_person_id?: string;
  interface_definition?: string;
  status: 'planned' | 'designed' | 'implemented' | 'verified';
  criticality: 'low' | 'medium' | 'high' | 'safety_critical';
  metadata?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubsystemData {
  company_id: string;
  product_id: string;
  diagram_id?: string;
  subsystem_id: string;
  name: string;
  description?: string;
  type: SystemSubsystem['type'];
  responsible_person_id?: string;
  interface_definition?: string;
  status?: SystemSubsystem['status'];
  criticality?: SystemSubsystem['criticality'];
  metadata?: any;
}

export interface UpdateSubsystemData {
  name?: string;
  description?: string;
  type?: SystemSubsystem['type'];
  responsible_person_id?: string;
  interface_definition?: string;
  status?: SystemSubsystem['status'];
  criticality?: SystemSubsystem['criticality'];
  metadata?: any;
}

export class SystemSubsystemsService {
  static async getByProduct(productId: string): Promise<SystemSubsystem[]> {
    const { data, error } = await supabase
      .from('system_subsystems')
      .select('*')
      .eq('product_id', productId)
      .order('subsystem_id');

    if (error) throw error;
    return (data || []) as SystemSubsystem[];
  }

  static async getByDiagram(diagramId: string): Promise<SystemSubsystem[]> {
    const { data, error } = await supabase
      .from('system_subsystems')
      .select('*')
      .eq('diagram_id', diagramId)
      .order('subsystem_id');

    if (error) throw error;
    return (data || []) as SystemSubsystem[];
  }

  static async getById(id: string): Promise<SystemSubsystem | null> {
    const { data, error } = await supabase
      .from('system_subsystems')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as SystemSubsystem;
  }

  static async create(input: CreateSubsystemData): Promise<SystemSubsystem> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('system_subsystems')
      .insert({
        ...input,
        created_by: user?.id,
        status: input.status || 'planned',
        criticality: input.criticality || 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    return data as SystemSubsystem;
  }

  static async update(id: string, updates: UpdateSubsystemData): Promise<SystemSubsystem> {
    const { data, error } = await supabase
      .from('system_subsystems')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SystemSubsystem;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('system_subsystems')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getNextSubsystemId(productId: string): Promise<string> {
    const { data } = await supabase
      .from('system_subsystems')
      .select('subsystem_id')
      .eq('product_id', productId)
      .order('subsystem_id', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return 'SUB-001';

    const lastId = data[0].subsystem_id;
    const match = lastId.match(/SUB-(\d+)/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      return `SUB-${num.toString().padStart(3, '0')}`;
    }
    return 'SUB-001';
  }
}
