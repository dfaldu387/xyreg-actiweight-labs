
import { useCallback } from 'react';
import { useSidebarData } from './useSidebarData';

export function useProductCreationContext() {
  const { refreshProducts } = useSidebarData();

  const handleProductCreated = useCallback((productId: string, projectId?: string) => {
    console.log('[useProductCreationContext] Product created, refreshing sidebar data');
    
    // Refresh sidebar products to show the new product
    if (refreshProducts) {
      // Add a small delay to ensure database changes are committed
      setTimeout(() => {
        refreshProducts();
      }, 500);
    }
  }, [refreshProducts]);

  return {
    handleProductCreated,
    refreshProducts
  };
}
