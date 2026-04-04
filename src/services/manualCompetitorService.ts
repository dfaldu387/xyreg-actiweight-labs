import { supabase } from '@/integrations/supabase/client';

export interface ManualCompetitor {
  id: string;
  product_id: string;
  company_id: string;
  competitor_company: string;
  product_name?: string | null;
  device_classification?: string | null;
  area_of_focus?: string | null;
  market?: string | null;
  phase?: string | null;
  regulatory_status?: string | null;
  launch_date?: string | null;
  material?: string | null;
  key_features?: any;
  pricing?: any;
  market_share_estimate?: string | null;
  homepage_url?: string | null;
  source_section_id?: string | null;
  metadata?: any;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
}

export const manualCompetitorService = {
  /**
   * Get all manual competitors for a product
   */
  async getProductCompetitors(productId: string): Promise<ManualCompetitor[]> {
    try {
      const { data, error } = await supabase
        .from('product_manual_competitors')
        .select('*')
        .eq('product_id', productId)
        .order('competitor_company', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[manualCompetitorService] Error fetching competitors:', error);
      throw error;
    }
  },

  /**
   * Create a new manual competitor
   */
  async createCompetitor(competitor: Omit<ManualCompetitor, 'id' | 'created_at' | 'updated_at'>): Promise<ManualCompetitor> {
    try {
      const { data, error } = await supabase
        .from('product_manual_competitors')
        .insert(competitor)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[manualCompetitorService] Error creating competitor:', error);
      throw error;
    }
  },

  /**
   * Update a manual competitor
   */
  async updateCompetitor(
    competitorId: string,
    updates: Partial<Omit<ManualCompetitor, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ManualCompetitor> {
    try {
      const { data, error } = await supabase
        .from('product_manual_competitors')
        .update(updates)
        .eq('id', competitorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[manualCompetitorService] Error updating competitor:', error);
      throw error;
    }
  },

  /**
   * Delete a manual competitor
   */
  async deleteCompetitor(competitorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_manual_competitors')
        .delete()
        .eq('id', competitorId);

      if (error) throw error;
    } catch (error) {
      console.error('[manualCompetitorService] Error deleting competitor:', error);
      throw error;
    }
  },

  /**
   * Create competitors from parsed data
   */
  async createCompetitorsFromParsedData(
    productId: string,
    companyId: string,
    sectionId: string,
    competitors: Array<{
      companyName: string;
      productName?: string;
      classification?: string;
      features?: any;
    }>
  ): Promise<ManualCompetitor[]> {
    try {
      const competitorRecords = competitors.map(c => ({
        product_id: productId,
        company_id: companyId,
        source_section_id: sectionId,
        competitor_company: c.companyName,
        product_name: c.productName,
        device_classification: c.classification,
        key_features: c.features
      }));

      const { data, error } = await supabase
        .from('product_manual_competitors')
        .insert(competitorRecords)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[manualCompetitorService] Error creating competitors from parsed data:', error);
      throw error;
    }
  }
};
