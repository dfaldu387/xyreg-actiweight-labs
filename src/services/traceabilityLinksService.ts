import { supabase } from '@/integrations/supabase/client';

export interface TraceabilityLink {
  id: string;
  company_id: string;
  product_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_type: string;
  rationale?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTraceabilityLinkData {
  product_id: string;
  company_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_type: string;
  rationale?: string;
}

export type LinkType = 
  | 'derives_from'        // UN → SR, SR → SWR/HWR
  | 'implements_risk_control'  // SR/SWR/HWR → Hazard
  | 'verifies_control'    // Test → Hazard/Requirement
  | 'mitigates'           // Risk Control → Hazard
  | 'traces_to';          // General traceability

export class TraceabilityLinksService {
  static async getByProduct(productId: string): Promise<TraceabilityLink[]> {
    const { data, error } = await supabase
      .from('traceability_links')
      .select('*')
      .eq('product_id', productId);

    if (error) throw error;
    return data || [];
  }

  static async getBySourceOrTarget(
    productId: string,
    type: string,
    id: string
  ): Promise<TraceabilityLink[]> {
    const { data, error } = await supabase
      .from('traceability_links')
      .select('*')
      .eq('product_id', productId)
      .or(`source_type.eq.${type},source_id.eq.${id},target_type.eq.${type},target_id.eq.${id}`);

    if (error) throw error;
    return data || [];
  }

  static async create(input: CreateTraceabilityLinkData): Promise<TraceabilityLink> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('traceability_links')
      .insert({
        ...input,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('traceability_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteBySourceOrTarget(
    productId: string,
    type: string,
    id: string
  ): Promise<void> {
    const { error } = await supabase
      .from('traceability_links')
      .delete()
      .eq('product_id', productId)
      .or(`and(source_type.eq.${type},source_id.eq.${id}),and(target_type.eq.${type},target_id.eq.${id})`);

    if (error) throw error;
  }
}

export const traceabilityLinksService = new TraceabilityLinksService();
