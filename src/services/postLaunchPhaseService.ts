import { supabase } from '@/integrations/supabase/client';

export class PostLaunchPhaseService {
  /**
   * Checks if a product has been launched based on phase completion
   * A product is considered launched if all development phases are completed
   */
  static async isProductLaunched(productId: string): Promise<boolean> {
    try {
      const { data: phases, error } = await supabase
        .from('lifecycle_phases')
        .select('status, name')
        .eq('product_id', productId)
        .order('position', { ascending: true });

      if (error) {
        console.error('[PostLaunchPhaseService] Error checking launch status:', error);
        return false;
      }

      if (!phases || phases.length === 0) {
        return false;
      }

      // Check if there's a phase with "Launch" or "Post-Launch" in the name that's completed
      const hasLaunchPhase = phases.some(p =>
        (p.name.toLowerCase().includes('launch') ||
          p.name.toLowerCase().includes('post-launch') ||
          p.name.toLowerCase().includes('post-market')) &&
        p.status === 'Completed'
      );

      // Or if all non-post-market phases are completed
      const developmentPhases = phases.filter(p =>
        !p.name.toLowerCase().includes('post-market') &&
        !p.name.toLowerCase().includes('post-launch')
      );

      const allDevelopmentPhasesCompleted = developmentPhases.length > 0 &&
        developmentPhases.every(p => p.status === 'Completed');

      return hasLaunchPhase || allDevelopmentPhasesCompleted;
    } catch (error) {
      console.error('[PostLaunchPhaseService] Unexpected error checking launch status:', error);
      return false;
    }
  }

  /**
   * Checks if a Post-Launch or Post-Market phase already exists for the product
   */
  static async hasPostLaunchPhase(productId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('lifecycle_phases')
        .select('id, name')
        .eq('product_id', productId);

      if (error) {
        console.error('[PostLaunchPhaseService] Error checking for post-launch phase:', error);
        return false;
      }

      if (!data || data.length === 0) return false;

      // Check for any existing post-launch or post-market phase
      return data.some(p => {
        const name = p.name.toLowerCase();
        return name.includes('post-launch') ||
               name.includes('post-market') ||
               name.includes('post market') ||
               name.includes('surveillance') ||
               name.includes('pms');
      });
    } catch (error) {
      console.error('[PostLaunchPhaseService] Unexpected error checking for post-launch phase:', error);
      return false;
    }
  }

  /**
   * Finds or creates a company phase for Post-Launch
   */
  static async getOrCreatePostLaunchCompanyPhase(companyId: string): Promise<string | null> {
    try {
      // Check if Post-Launch company phase exists
      const { data: existingPhase, error: fetchError } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId)
        .ilike('name', '%post-launch%')
        .limit(1)
        .single();

      if (existingPhase) {
        return existingPhase.id;
      }

      // Get the highest position from existing company phases
      const { data: maxPosition, error: maxPosError } = await supabase
        .from('company_phases')
        .select('position')
        .eq('company_id', companyId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = maxPosition && maxPosition.length > 0
        ? (maxPosition[0].position || 0) + 1
        : 0;

      // Create new Post-Launch company phase
      const { data: newCompanyPhase, error: createError } = await supabase
        .from('company_phases')
        .insert([{
          company_id: companyId,
          name: 'Post-Launch',
          description: 'Post-launch activities and ongoing product management',
          position: nextPosition,
          duration_days: 365, // Default to 1 year
        }])
        .select('id')
        .single();

      if (createError) {
        console.error('[PostLaunchPhaseService] Error creating company phase:', createError);
        return null;
      }

      return newCompanyPhase.id;
    } catch (error) {
      console.error('[PostLaunchPhaseService] Error in getOrCreatePostLaunchCompanyPhase:', error);
      return null;
    }
  }

  /**
   * Creates a Post-Launch phase for the product
   */
  static async createPostLaunchPhase(productId: string, companyId: string): Promise<string | null> {
    try {
      // First, get or create the company phase
      const companyPhaseId = await this.getOrCreatePostLaunchCompanyPhase(companyId);

      if (!companyPhaseId) {
        console.error('[PostLaunchPhaseService] Failed to get or create company phase');
        return null;
      }

      // Get category_id from the company phase so it's not "Uncategorized"
      const { data: companyPhase } = await supabase
        .from('company_phases')
        .select('category_id')
        .eq('id', companyPhaseId)
        .single();

      // Get the product's launch date to use as phase start
      const { data: product } = await supabase
        .from('products')
        .select('actual_launch_date, projected_launch_date')
        .eq('id', productId)
        .single();

      const launchDate = product?.actual_launch_date || product?.projected_launch_date;
      const phaseStartDate = launchDate ? new Date(launchDate) : new Date();
      const phaseEndDate = new Date(phaseStartDate);
      phaseEndDate.setFullYear(phaseEndDate.getFullYear() + 1);

      // Get the highest position number from existing phases
      const { data: existingPhases, error: fetchError } = await supabase
        .from('lifecycle_phases')
        .select('position')
        .eq('product_id', productId)
        .order('position', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('[PostLaunchPhaseService] Error fetching existing phases:', fetchError);
        return null;
      }

      const nextPosition = existingPhases && existingPhases.length > 0
        ? (existingPhases[0].position || 0) + 1
        : 0;

      // Create the Post-Launch phase
      const { data: newPhase, error: createError } = await supabase
        .from('lifecycle_phases')
        .insert([{
          product_id: productId,
          phase_id: companyPhaseId,
          name: 'Post-Launch',
          status: 'In Progress',
          position: nextPosition,
          start_date: phaseStartDate.toISOString(),
          end_date: phaseEndDate.toISOString(),
          is_pre_launch: false,
          likelihood_of_success: 100,
          category_id: companyPhase?.category_id || null,
        }])
        .select('id')
        .single();

      if (createError) {
        console.error('[PostLaunchPhaseService] Error creating post-launch phase:', createError);
        return null;
      }

      return newPhase.id;
    } catch (error) {
      console.error('[PostLaunchPhaseService] Unexpected error creating post-launch phase:', error);
      return null;
    }
  }

  /**
   * Ensures a Post-Launch phase exists for launched products
   * This should be called when viewing a product's milestones
   */
  static async ensurePostLaunchPhase(productId: string, companyId: string): Promise<void> {
    try {
      const isLaunched = await this.isProductLaunched(productId);

      if (!isLaunched) {
        return;
      }

      const hasPhase = await this.hasPostLaunchPhase(productId);

      if (hasPhase) {

        return;
      }


      await this.createPostLaunchPhase(productId, companyId);
    } catch (error) {
      console.error('[PostLaunchPhaseService] Error in ensurePostLaunchPhase:', error);
    }
  }
}
