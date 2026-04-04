import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedPhaseRepairService } from '@/services/enhancedPhaseRepairService';
import { UnifiedPhaseUpdateService } from '@/services/unifiedPhaseUpdateService';
import { detectProductType, ProductType } from '@/utils/productTypeDetection';
import { toast } from 'sonner';

export interface UnmappedProduct {
  id: string;
  name: string;
  issue: string;
}

export interface ProductPhaseInfo {
  id: string;
  name: string;
  status: string;
  progress: number;
  description?: string;
  class?: string;
  image?: string;
  targetDate?: string;
  currentPhase?: string;
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  base_product_name?: string;
  product_platform?: string;
  device_type?: string;
}

export interface PhaseProduct {
  id: string;
  name: string;
  status: "On Track" | "At Risk" | "Needs Attention";
  progress: number;
  phase: string;
  phaseId: string | null;
  company: string;
  description?: string;
  class?: string;
  image?: string;
  targetDate?: string;
  isMoveBlocked?: boolean;
  project_types?: string[];
  is_line_extension?: boolean;
  parent_product_id?: string;
  base_product_name?: string;
  product_platform?: string;
  device_type?: string;
}

export interface PhaseInfo {
  id: string;
  name: string;
  description?: string;
  position: number;
}

export function useCompanyProductPhases(companyId: string, selectedFilter: string = 'all') {
  const [activePhases, setActivePhases] = useState<PhaseInfo[]>([]);
  const [rawProductsByPhase, setRawProductsByPhase] = useState<Record<string, ProductPhaseInfo[]>>({});
  const [unmappedProducts, setUnmappedProducts] = useState<UnmappedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for bulk operation completion events to refresh data
  useEffect(() => {
    const handleBulkOperationComplete = (event: CustomEvent) => {
      if (event.detail?.companyId === companyId) {
        
        loadData();
      }
    };

    window.addEventListener('bulk-operation-complete', handleBulkOperationComplete as EventListener);
    return () => {
      window.removeEventListener('bulk-operation-complete', handleBulkOperationComplete as EventListener);
    };
  }, [companyId]);

  // Load phases and products data - only depends on companyId to avoid infinite loops
  const loadData = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);
      

      // Load active phases - fix the relationship to use company_phases instead of phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          position,
          company_phases!inner(id, name, description)
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        throw new Error(`Failed to load phases: ${phasesError.message}`);
      }

      const phases: PhaseInfo[] = (phasesData || []).map((cp, index) => ({
        id: cp.company_phases.id,
        name: cp.company_phases.name,
        description: cp.company_phases.description,
        position: cp.position || index + 1  // Use actual position or fallback to index + 1
      }));

      setActivePhases(phases);

      // Load all products for this company with enhanced data including fields for product type detection
      const { data: productsData, error: productsError } = await supabase
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
          current_lifecycle_phase,
          project_types,
          is_line_extension,
          parent_product_id,
          product_platform,
          device_type,
          base_product:products!parent_product_id(name),
          lifecycle_phases(id, phase_id, is_current_phase, name, category_id, sub_section_id)
        `)
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (productsError) {
        throw new Error(`Failed to load products: ${productsError.message}`);
      }

      // Organize products by phase and identify unmapped ones (without filtering)
      const phaseProductMap: Record<string, ProductPhaseInfo[]> = {};
      const unmapped: UnmappedProduct[] = [];

      // Initialize phase arrays
      phases.forEach(phase => {
        phaseProductMap[phase.name] = [];
      });

      (productsData || []).forEach(product => {
        const currentPhaseRecord = product.lifecycle_phases?.find(lp => lp.is_current_phase);
        
        if (!currentPhaseRecord) {
          // For products with no current phase, check if they're legacy products
          const projectTypes = Array.isArray(product.project_types) 
            ? (product.project_types as string[])
            : typeof product.project_types === 'string'
            ? [product.project_types]
            : undefined;

          const tempInfo: ProductPhaseInfo = {
            id: product.id,
            name: product.name,
            status: product.status || 'On Track',
            progress: product.progress || Math.floor(Math.random() * 40) + 30,
            description: product.description,
            class: product.class,
            image: product.image,
            targetDate: product.projected_launch_date,
            currentPhase: undefined,
            project_types: projectTypes,
            is_line_extension: product.is_line_extension,
            parent_product_id: product.parent_product_id,
            base_product_name: product.base_product?.name || null,
            product_platform: product.product_platform,
            device_type: product.device_type
          };

          const productType = detectProductType(tempInfo);
          if (productType === 'legacy_product') {
            // Legacy products should go to Post-Market Surveillance (position 11)
            const postMarketPhase = phases.find(p => p.position === 11) ||
              phases.find(p => p.name.toLowerCase().includes('post-market'));
            if (postMarketPhase && phaseProductMap[postMarketPhase.name]) {
              phaseProductMap[postMarketPhase.name].push({ 
                ...tempInfo, 
                currentPhase: postMarketPhase.name 
              });
            } else {
              // Fallback to unmapped if Post-Market Surveillance not found
              unmapped.push({
                id: product.id,
                name: product.name,
                issue: 'Legacy product - Post-Market Surveillance phase not configured'
              });
            }
          } else {
            // Non-legacy products without current phase remain unmapped
            unmapped.push({
              id: product.id,
              name: product.name,
              issue: 'No current lifecycle phase assigned'
            });
          }
        } else {
          // Check if the current phase is valid (exists in active phases) using phase_id
          const validPhase = phases.find(p => p.id === currentPhaseRecord.phase_id);
          
          if (!validPhase) {
            unmapped.push({
              id: product.id,
              name: product.name,
              issue: `Invalid phase reference: ${currentPhaseRecord.name}`
            });
          } else {
            // Product is properly mapped - now with enhanced data including product type fields
            // Safely cast project_types from Json to string[]
            const projectTypes = Array.isArray(product.project_types) 
              ? product.project_types as string[]
              : typeof product.project_types === 'string'
              ? [product.project_types]
              : undefined;

            const productInfo: ProductPhaseInfo = {
              id: product.id,
              name: product.name,
              status: product.status || 'On Track',
              progress: product.progress || Math.floor(Math.random() * 40) + 30,
              description: product.description,
              class: product.class,
              image: product.image,
              targetDate: product.projected_launch_date,
              currentPhase: validPhase.name,
              project_types: projectTypes,
              is_line_extension: product.is_line_extension,
              parent_product_id: product.parent_product_id,
              base_product_name: product.base_product?.name || null,
              product_platform: product.product_platform,
              device_type: product.device_type
            };

            // Override phase placement for Legacy Device products
            // They should always appear in Post-Market Surveillance (position 11)
            const productType = detectProductType(productInfo);
            if (productType === 'legacy_product') {
              const postMarketPhase = phases.find(p => p.position === 11);
              const phaseName = postMarketPhase?.name || validPhase.name;
              
              if (phaseProductMap[phaseName]) {
                phaseProductMap[phaseName].push(productInfo);
              }
            } else {
              // Regular products use their assigned phase
              if (phaseProductMap[validPhase.name]) {
                phaseProductMap[validPhase.name].push(productInfo);
              }
            }
          }
        }
      });

      // Store raw data without filtering
      setRawProductsByPhase(phaseProductMap);
      setUnmappedProducts(unmapped);

      

    } catch (error) {
      console.error('[useCompanyProductPhases] Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]); // Only depends on companyId

  // Load data on mount and when companyId changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filtering to raw data - memoized to avoid recalculation
  const productsByPhase = useMemo(() => {
    const filterProductsByType = (products: ProductPhaseInfo[]) => {
      if (selectedFilter === 'all') {
        return products;
      }

      return products.filter(product => {
        const productType = detectProductType(product);
        return productType === selectedFilter;
      });
    };

    const filteredPhaseProductMap: Record<string, ProductPhaseInfo[]> = {};
    Object.keys(rawProductsByPhase).forEach(phaseName => {
      filteredPhaseProductMap[phaseName] = filterProductsByType(rawProductsByPhase[phaseName]);
    });

    return filteredPhaseProductMap;
  }, [rawProductsByPhase, selectedFilter]);

  // Move product between phases
  const moveProduct = useCallback(async (productId: string, fromPhase: string, toPhase: string) => {
    try {
      

      // Find the target phase ID
      const targetPhase = activePhases.find(p => p.name === toPhase);
      if (!targetPhase) {
        throw new Error(`Target phase "${toPhase}" not found`);
      }

      // Use the unified service to update the phase
      const result = await UnifiedPhaseUpdateService.moveProductToPhase(productId, targetPhase.id, companyId);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      // Reload data to reflect changes in database
      await loadData();

      
    } catch (error) {
      console.error('[useCompanyProductPhases] Error moving product:', error);
      throw error;
    }
  }, [activePhases, companyId, loadData]);

  // Repair single product
  const repairProduct = useCallback(async (productId: string) => {
    try {
      
      
      const loadingToast = toast.loading('Repairing product...');
      
      const result = await EnhancedPhaseRepairService.repairSingleProductById(productId, companyId);
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(`Product repaired successfully`);
        // Reload data to reflect changes
        await loadData();
      } else {
        const errorMsg = result.errors.join(', ');
        toast.error(`Repair failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('[useCompanyProductPhases] Error repairing product:', error);
      toast.error('Failed to repair product');
      throw error;
    }
  }, [companyId, loadData]);

  // Repair all products
  const repairAllProducts = useCallback(async () => {
    try {
      
      
      const loadingToast = toast.loading('Repairing all products...');
      
      const result = await EnhancedPhaseRepairService.repairAllProductPhases(companyId);
      
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(`Successfully repaired ${result.repairedProducts} products`);
        // Reload data to reflect changes
        await loadData();
      } else {
        const errorMsg = result.errors.join(', ');
        toast.error(`Repair failed: ${errorMsg}`);
        console.error('[useCompanyProductPhases] Repair errors:', result.errors);
      }
    } catch (error) {
      console.error('[useCompanyProductPhases] Error repairing all products:', error);
      toast.error('Failed to repair products');
    }
  }, [companyId, loadData]);

  return {
    activePhases,
    productsByPhase,
    unmappedProducts,
    isLoading,
    error,
    moveProduct,
    repairProduct,
    repairAllProducts,
    refreshData: loadData
  };
}
