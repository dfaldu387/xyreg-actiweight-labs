import { supabase } from '@/integrations/supabase/client';

export class CompanyUsageService {
  /**
   * Record that a company was accessed by updating last_accessed_at in user_company_access
   */
  static async recordCompanyAccess(companyId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_company_access')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('company_id', companyId);

      if (error) {
        console.error('[CompanyUsage] Error recording company access:', error);
      }
    } catch (error) {
      console.error('[CompanyUsage] Error recording company access:', error);
    }
  }

  /**
   * Get the most recently accessed company IDs for the current user
   */
  static async getRecentCompanyIds(limit: number = 3): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_company_access')
        .select('company_id')
        .eq('user_id', user.id)
        .not('last_accessed_at', 'is', null)
        .order('last_accessed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[CompanyUsage] Error fetching recent company IDs:', error);
        return [];
      }

      return (data || []).map(row => row.company_id);
    } catch (error) {
      console.error('[CompanyUsage] Error fetching recent company IDs:', error);
      return [];
    }
  }
}
