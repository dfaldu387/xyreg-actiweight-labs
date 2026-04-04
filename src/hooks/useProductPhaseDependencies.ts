import { useState, useEffect, useCallback } from 'react';
import { ProductPhaseDependencyService, ProductPhaseDependency } from '@/services/productPhaseDependencyService';

export interface UseProductPhaseDependenciesResult {
  dependencies: ProductPhaseDependency[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasProductDependencies: boolean;
  loadDependencies: () => Promise<void>;
  createDependency: (dependency: any) => Promise<any>;
  updateDependency: (id: string, updates: any) => Promise<any>;
  deleteDependency: (id: string) => Promise<any>;
  importCompanyDependencies: () => Promise<any>;
  getDependencyTypeLabel: (type: string) => string;
  getDependencyTypeDescription: (type: string) => string;
}

/**
 * Hook to fetch and manage product-specific phase dependencies
 */
export function useProductPhaseDependencies(productId?: string): UseProductPhaseDependenciesResult {
  const [dependencies, setDependencies] = useState<ProductPhaseDependency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDependencies = useCallback(async () => {
    if (!productId) {
      setDependencies([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ProductPhaseDependencyService.getProductDependencies(productId);
      
      if (result.success) {
        setDependencies(result.dependencies || []);
      } else {
        setError(result.error || 'Failed to load product dependencies');
        setDependencies([]);
      }
    } catch (err) {
      console.error('[useProductPhaseDependencies] Error fetching dependencies:', err);
      setError('Failed to load product dependencies');
      setDependencies([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Fetch dependencies when productId changes
  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  // Listen for dependency updates from other hooks (e.g., auto-copy from phase sync)
  useEffect(() => {
    const handleDependencyUpdate = (event: CustomEvent) => {
      const { productId: updatedProductId } = event.detail;
      if (updatedProductId === productId) {
        fetchDependencies();
      }
    };

    window.addEventListener('productDependenciesUpdated', handleDependencyUpdate as EventListener);
    
    return () => {
      window.removeEventListener('productDependenciesUpdated', handleDependencyUpdate as EventListener);
    };
  }, [productId, fetchDependencies]);

  return {
    dependencies,
    loading,
    error,
    refetch: fetchDependencies,
    hasProductDependencies: dependencies.length > 0,
    loadDependencies: fetchDependencies,
    createDependency: async (dep: any) => ProductPhaseDependencyService.createProductDependency({ ...dep, product_id: productId! }),
    updateDependency: async (id: string, updates: any) => ProductPhaseDependencyService.updateProductDependency(id, updates),
    deleteDependency: async (id: string) => ProductPhaseDependencyService.deleteProductDependency(id),
    importCompanyDependencies: async () => ProductPhaseDependencyService.initializeFromCompanySettings(productId!, productId!, true),
    getDependencyTypeLabel: (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    getDependencyTypeDescription: (type: string) => {
      const descriptions: Record<string, string> = {
        'finish_to_start': 'Target starts when source finishes',
        'start_to_start': 'Target starts when source starts',
        'finish_to_finish': 'Target finishes when source finishes',
        'start_to_finish': 'Target finishes when source starts'
      };
      return descriptions[type] || type;
    }
  };
}