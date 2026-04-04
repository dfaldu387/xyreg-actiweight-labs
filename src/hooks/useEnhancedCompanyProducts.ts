
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EnhancedProduct {
  id: string;
  name: string;
  status: string;
  progress: number;
  phase: string;
  description?: string;
  class?: string;
  image?: string;
  targetDate?: string;
  companyId: string;
  companyName: string;
  isArchived: boolean;
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  product_platform?: string;
}

interface UseEnhancedCompanyProductsOptions {
  platformFilter?: string;
}

export function useEnhancedCompanyProducts(
  companyId?: string, 
  options: UseEnhancedCompanyProductsOptions = {}
) {
  const { platformFilter } = options;
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    fetchProducts();
  }, [companyId, platformFilter]);

  const fetchProducts = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get active company phases first - FIXED: Use company_phases
      const { data: activePhases, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name, company_id)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        console.error("Error fetching active phases:", phasesError);
        throw phasesError;
      }

      // Create a map of phase names for quick lookup
      const phaseNameMap = new Map();
      (activePhases || []).forEach(ap => {
        phaseNameMap.set(ap.company_phases.id, ap.company_phases.name);
      });

      // Get products for this company with enhanced fields
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          status,
          progress,
          description,
          class,
          image,
          projected_launch_date,
          company_id,
          is_archived,
          project_types,
          is_line_extension,
          parent_product_id,
          product_platform,
          companies!inner(name),
          lifecycle_phases!inner(
            phase_id,
            name,
            is_current_phase
          )
        `)
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) {
        console.error("Error fetching products:", productsError);
        throw productsError;
      }

      // Process products
      let enhancedProducts: EnhancedProduct[] = (products || []).map(product => {
        // Find current phase
        const currentPhase = product.lifecycle_phases?.find(lp => lp.is_current_phase);
        const phaseName = currentPhase ? phaseNameMap.get(currentPhase.phase_id) || currentPhase.name : 'No Phase';

        // Safely handle project_types JSONB field
        const safeProjectTypes = (() => {
          if (!product.project_types) return [];
          if (Array.isArray(product.project_types)) {
            return product.project_types.filter(type => typeof type === 'string') as string[];
          }
          return [];
        })();

        return {
          id: product.id,
          name: product.name,
          status: product.status || 'On Track',
          progress: product.progress || 0,
          phase: phaseName,
          description: product.description,
          class: product.class,
          image: product.image,
          targetDate: product.projected_launch_date,
          companyId: product.company_id,
          companyName: product.companies?.name || 'Unknown',
          isArchived: product.is_archived,
          project_types: safeProjectTypes,
          is_line_extension: product.is_line_extension || false,
          parent_product_id: product.parent_product_id,
          product_platform: product.product_platform
        };
      });

      // Enhanced platform filtering logic
      if (platformFilter) {
        console.log('[useEnhancedCompanyProducts] Applying platform filter:', platformFilter);
        
        // Get products that match the platform filter
        const directPlatformMatches = enhancedProducts.filter(product => 
          product.product_platform === platformFilter
        );
        
        // Get base products that are parents of line extensions in this platform
        const baseProductIds = new Set(
          directPlatformMatches
            .map(product => product.parent_product_id)
            .filter(Boolean)
        );
        
        // Include base products
        const baseProducts = enhancedProducts.filter(product => 
          baseProductIds.has(product.id)
        );
        
        // Combine and deduplicate
        const platformProducts = new Map();
        [...directPlatformMatches, ...baseProducts].forEach(product => {
          platformProducts.set(product.id, product);
        });
        
        enhancedProducts = Array.from(platformProducts.values());
        
        console.log('[useEnhancedCompanyProducts] Platform filtered products:', {
          platformFilter,
          directMatches: directPlatformMatches.length,
          baseProducts: baseProducts.length,
          totalFiltered: enhancedProducts.length
        });
      }

      setProducts(enhancedProducts);
      console.log(`Loaded ${enhancedProducts.length} enhanced products for company ${companyId}`);

    } catch (err) {
      console.error('Error in fetchProducts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProducts = async () => {
    await fetchProducts();
  };

  const moveProductToPhase = async (productId: string, phaseName: string) => {
    try {
      // Find the target phase from company_phases
      const { data: targetPhase, error: phaseError } = await supabase
        .from('company_phases')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', phaseName)
        .single();

      if (phaseError) {
        console.error("Error finding target phase:", phaseError);
        throw phaseError;
      }

      // Update the product's lifecycle phase
      const { error: updateError } = await supabase
        .from('lifecycle_phases')
        .update({ 
          is_current_phase: false
        })
        .eq('product_id', productId);

      if (updateError) {
        console.error("Error clearing current phases:", updateError);
        throw updateError;
      }

      // Set new current phase
      const { error: setCurrentError } = await supabase
        .from('lifecycle_phases')
        .update({ 
          is_current_phase: true
        })
        .eq('product_id', productId)
        .eq('phase_id', targetPhase.id);

      if (setCurrentError) {
        console.error("Error setting current phase:", setCurrentError);
        throw setCurrentError;
      }

      // Refresh products
      await fetchProducts();
      toast.success(`Product moved to ${phaseName}`);

    } catch (error) {
      console.error("Error moving product to phase:", error);
      toast.error("Failed to move product");
    }
  };

  return {
    products,
    isLoading,
    error,
    refreshProducts,
    moveProductToPhase
  };
}
