import { supabase } from "@/integrations/supabase/client";
import { LIFECYCLE_PHASES } from "@/types/audit";

export type ProductLifecycleState = 'development' | 'launched' | 'unknown';
export type LaunchStatus = 'pre_launch' | 'launched' | 'discontinued';

export interface ProductLifecycleInfo {
  productId: string;
  productName: string;
  currentPhase: string | null;
  lifecycleState: ProductLifecycleState;
  launchStatus: LaunchStatus;
  actualLaunchDate: string | null;
  isReadyForCommercialTracking: boolean;
  isReadyForRNPVAnalysis: boolean;
}

export class ProductLifecycleService {
  
  /**
   * Development phases - products in these phases should use rNPV analysis
   */
  private static readonly DEVELOPMENT_PHASES = [
    "Concept Development",
    "Design Input", 
    "Design Development",
    "Design Verification",
    "Design Validation",
    "Design Transfer"
  ];

  /**
   * Commercial phases - products in these phases should use commercial performance tracking
   */
  private static readonly COMMERCIAL_PHASES = [
    "Production",
    "Post-Market Surveillance", 
    "End of Life"
  ];

  /**
   * Determine the lifecycle state of a product based on its current phase
   */
  static determineLifecycleState(currentPhase: string | null): ProductLifecycleState {
    if (!currentPhase) {
      return 'unknown';
    }

    if (this.DEVELOPMENT_PHASES.includes(currentPhase)) {
      return 'development';
    }

    if (this.COMMERCIAL_PHASES.includes(currentPhase)) {
      return 'launched';
    }

    return 'unknown';
  }

  /**
   * Get lifecycle information for a single product
   */
  static async getProductLifecycleInfo(productId: string): Promise<ProductLifecycleInfo | null> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          current_lifecycle_phase,
          launch_status,
          actual_launch_date,
          lifecycle_phases(
            id,
            name,
            is_current_phase
          )
        `)
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching product lifecycle info:', error);
        return null;
      }

      // Get current phase from lifecycle_phases or fallback to current_lifecycle_phase
      const currentPhaseRecord = Array.isArray(product.lifecycle_phases) 
        ? product.lifecycle_phases.find(lp => lp.is_current_phase)
        : null;
      
      const currentPhase = currentPhaseRecord?.name || product.current_lifecycle_phase || null;
      const lifecycleState = this.determineLifecycleState(currentPhase);
      // Default to pre_launch if launch_status field doesn't exist yet (before migration)
      const launchStatus = (product.launch_status as LaunchStatus) || 'pre_launch';

      return {
        productId: product.id,
        productName: product.name,
        currentPhase,
        lifecycleState,
        launchStatus,
        actualLaunchDate: product.actual_launch_date || null,
        isReadyForCommercialTracking: this.shouldUseCommercialTrackingForProduct(launchStatus, lifecycleState),
        isReadyForRNPVAnalysis: this.shouldUseRNPVForProduct(launchStatus, lifecycleState)
      };
    } catch (error) {
      console.error('Error in getProductLifecycleInfo:', error);
      return null;
    }
  }

  /**
   * Get lifecycle information for all products in a company
   */
  static async getCompanyProductsLifecycleInfo(companyId: string): Promise<ProductLifecycleInfo[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          current_lifecycle_phase,
          launch_status,
          actual_launch_date,
          lifecycle_phases(
            id,
            name,
            is_current_phase
          )
        `)
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (error) {
        console.error('Error fetching company products lifecycle info:', error);
        return [];
      }

      return products.map(product => {
        // Get current phase from lifecycle_phases or fallback to current_lifecycle_phase
        const currentPhaseRecord = Array.isArray(product.lifecycle_phases) 
          ? product.lifecycle_phases.find(lp => lp.is_current_phase)
          : null;
        
        const currentPhase = currentPhaseRecord?.name || product.current_lifecycle_phase || null;
        const lifecycleState = this.determineLifecycleState(currentPhase);
        // Default to pre_launch if launch_status field doesn't exist yet (before migration)
        const launchStatus = (product.launch_status as LaunchStatus) || 'pre_launch';

        return {
          productId: product.id,
          productName: product.name,
          currentPhase,
          lifecycleState,
          launchStatus,
          actualLaunchDate: product.actual_launch_date || null,
          isReadyForCommercialTracking: this.shouldUseCommercialTrackingForProduct(launchStatus, lifecycleState),
          isReadyForRNPVAnalysis: this.shouldUseRNPVForProduct(launchStatus, lifecycleState)
        };
      });
    } catch (error) {
      console.error('Error in getCompanyProductsLifecycleInfo:', error);
      return [];
    }
  }

  /**
   * Get products filtered by lifecycle state
   */
  static async getProductsByLifecycleState(
    companyId: string, 
    state: ProductLifecycleState
  ): Promise<ProductLifecycleInfo[]> {
    const allProducts = await this.getCompanyProductsLifecycleInfo(companyId);
    return allProducts.filter(product => product.lifecycleState === state);
  }

  /**
   * Check if a product should use rNPV analysis (development phase)
   */
  static async shouldUseRNPVAnalysis(productId: string): Promise<boolean> {
    const lifecycleInfo = await this.getProductLifecycleInfo(productId);
    return lifecycleInfo?.isReadyForRNPVAnalysis ?? false;
  }

  /**
   * Check if a product should use commercial performance tracking (launched phase)
   */
  static async shouldUseCommercialTracking(productId: string): Promise<boolean> {
    const lifecycleInfo = await this.getProductLifecycleInfo(productId);
    return lifecycleInfo?.isReadyForCommercialTracking ?? false;
  }

  /**
   * Determine if a product should use rNPV analysis based on launch status and lifecycle state
   */
  static shouldUseRNPVForProduct(launchStatus: LaunchStatus, lifecycleState: ProductLifecycleState): boolean {
    // Primary: Use launch_status as the main determinant
    if (launchStatus === 'pre_launch') return true;
    if (launchStatus === 'launched' || launchStatus === 'discontinued') return false;
    
    // Fallback: Use lifecycle state for backward compatibility
    return lifecycleState === 'development';
  }

  /**
   * Determine if a product should use commercial tracking based on launch status and lifecycle state
   */
  static shouldUseCommercialTrackingForProduct(launchStatus: LaunchStatus, lifecycleState: ProductLifecycleState): boolean {
    // Primary: Use launch_status as the main determinant
    if (launchStatus === 'launched') return true;
    if (launchStatus === 'pre_launch' || launchStatus === 'discontinued') return false;
    
    // Fallback: Use lifecycle state for backward compatibility
    return lifecycleState === 'launched';
  }

  /**
   * Update product launch status
   */
  static async updateProductLaunchStatus(productId: string, launchStatus: LaunchStatus, actualLaunchDate?: string): Promise<boolean> {
    try {
      const updateData: any = { launch_status: launchStatus };
      
      // Set actual launch date if transitioning to launched and date provided
      if (launchStatus === 'launched' && actualLaunchDate) {
        updateData.actual_launch_date = actualLaunchDate;
      } else if (launchStatus === 'launched' && !actualLaunchDate) {
        // Auto-set launch date to today if not provided
        updateData.actual_launch_date = new Date().toISOString().split('T')[0];
      }

      // When setting to launched, automatically set phase to Post-Market Surveillance
      if (launchStatus === 'launched') {
        updateData.current_lifecycle_phase = 'Post-Market Surveillance';
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        console.error('Error updating product launch status:', error);
        return false;
      }

      // When setting to launched, close all phases and set Post-Market Surveillance as current
      if (launchStatus === 'launched') {
        // Close all existing phases
        const { error: closeError } = await supabase
          .from('lifecycle_phases')
          .update({ 
            is_current_phase: false,
            status: 'Completed',
            end_date: new Date().toISOString().split('T')[0]
          })
          .eq('product_id', productId);

        if (closeError) {
          console.error('Error closing lifecycle phases:', closeError);
        }

        // Create or update Post-Market Surveillance phase as current
        const { data: existingPhase } = await supabase
          .from('lifecycle_phases')
          .select('id')
          .eq('product_id', productId)
          .eq('name', 'Post-Market Surveillance')
          .maybeSingle();

        if (existingPhase) {
          // Update existing phase to be current
          await supabase
            .from('lifecycle_phases')
            .update({ 
              is_current_phase: true,
              status: 'In Progress',
              start_date: updateData.actual_launch_date,
              end_date: null
            })
            .eq('id', existingPhase.id);
        } else {
          // Get the company's Post-Market Surveillance phase
          const { data: product } = await supabase
            .from('products')
            .select('company_id')
            .eq('id', productId)
            .single();

          if (product) {
            const { data: companyPhase } = await supabase
              .from('company_phases')
              .select('id')
              .eq('company_id', product.company_id)
              .eq('name', 'Post-Market Surveillance')
              .maybeSingle();

            // Create new Post-Market Surveillance phase
            await supabase
              .from('lifecycle_phases')
              .insert({
                product_id: productId,
                phase_id: companyPhase?.id,
                name: 'Post-Market Surveillance',
                is_current_phase: true,
                status: 'In Progress',
                start_date: updateData.actual_launch_date
              });
          }
        }
      }

      console.log(`Updated product ${productId} launch status to ${launchStatus}`);
      return true;
    } catch (error) {
      console.error('Error in updateProductLaunchStatus:', error);
      return false;
    }
  }

  /**
   * Get summary statistics for a company's product portfolio
   */
  static async getCompanyPortfolioSummary(companyId: string) {
    const allProducts = await this.getCompanyProductsLifecycleInfo(companyId);
    
    const developmentProducts = allProducts.filter(p => p.lifecycleState === 'development');
    const launchedProducts = allProducts.filter(p => p.lifecycleState === 'launched');
    const unknownProducts = allProducts.filter(p => p.lifecycleState === 'unknown');

    return {
      totalProducts: allProducts.length,
      developmentProducts: {
        count: developmentProducts.length,
        products: developmentProducts
      },
      launchedProducts: {
        count: launchedProducts.length,
        products: launchedProducts
      },
      unknownProducts: {
        count: unknownProducts.length,
        products: unknownProducts
      }
    };
  }
}