import { supabase } from "@/integrations/supabase/client";

export interface ArchitectureDecision {
  id: string;
  company_id: string;
  product_id: string;
  diagram_id?: string;
  decision_id: string;
  title: string;
  description: string;
  alternatives_considered?: string;
  rationale: string;
  implications?: string;
  decision_date?: string;
  decided_by?: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'deprecated';
  metadata?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDecisionData {
  company_id: string;
  product_id: string;
  diagram_id?: string;
  decision_id: string;
  title: string;
  description: string;
  alternatives_considered?: string;
  rationale: string;
  implications?: string;
  decision_date?: string;
  decided_by?: string;
  status?: ArchitectureDecision['status'];
  metadata?: any;
}

export interface UpdateDecisionData {
  title?: string;
  description?: string;
  alternatives_considered?: string;
  rationale?: string;
  implications?: string;
  decision_date?: string;
  decided_by?: string;
  status?: ArchitectureDecision['status'];
  metadata?: any;
}

export class ArchitectureDecisionsService {
  static async getByProduct(productId: string): Promise<ArchitectureDecision[]> {
    const { data, error } = await supabase
      .from('architecture_decisions')
      .select('*')
      .eq('product_id', productId)
      .order('decision_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ArchitectureDecision[];
  }

  static async getByDiagram(diagramId: string): Promise<ArchitectureDecision[]> {
    const { data, error } = await supabase
      .from('architecture_decisions')
      .select('*')
      .eq('diagram_id', diagramId)
      .order('decision_date', { ascending: false });

    if (error) throw error;
    return (data || []) as ArchitectureDecision[];
  }

  static async getById(id: string): Promise<ArchitectureDecision | null> {
    const { data, error } = await supabase
      .from('architecture_decisions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as ArchitectureDecision;
  }

  static async create(input: CreateDecisionData): Promise<ArchitectureDecision> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('architecture_decisions')
      .insert({
        ...input,
        created_by: user?.id,
        status: input.status || 'proposed'
      })
      .select()
      .single();

    if (error) throw error;
    return data as ArchitectureDecision;
  }

  static async update(id: string, updates: UpdateDecisionData): Promise<ArchitectureDecision> {
    const { data, error } = await supabase
      .from('architecture_decisions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ArchitectureDecision;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('architecture_decisions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getNextDecisionId(productId: string): Promise<string> {
    const { data } = await supabase
      .from('architecture_decisions')
      .select('decision_id')
      .eq('product_id', productId)
      .order('decision_id', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return 'DEC-001';

    const lastId = data[0].decision_id;
    const match = lastId.match(/DEC-(\d+)/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      return `DEC-${num.toString().padStart(3, '0')}`;
    }
    return 'DEC-001';
  }
}
