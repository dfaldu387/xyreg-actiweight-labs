import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCompanyProducts } from './useCompanyProducts';

export interface ProductListNavigationInfo {
  currentIndex: number;
  totalProducts: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextProduct: { id: string; name: string } | null;
  previousProduct: { id: string; name: string } | null;
  navigateToNext: () => void;
  navigateToPrevious: () => void;
}

export function useProductListNavigation(
  currentProductId: string | undefined,
  companyId: string | undefined
): ProductListNavigationInfo {
  const navigate = useNavigate();
  const location = useLocation();
  const { products, isLoading } = useCompanyProducts(companyId || '', {
    enabled: !!companyId && !!currentProductId
  });

  const navigationInfo = useMemo(() => {
    if (!currentProductId || !products || products.length === 0 || isLoading) {
      return {
        currentIndex: -1,
        totalProducts: 0,
        hasNext: false,
        hasPrevious: false,
        nextProduct: null,
        previousProduct: null,
      };
    }

    // Filter out archived products for navigation
    const activeProducts = products.filter(p => !p.is_archived);
    const currentIndex = activeProducts.findIndex(p => p.id === currentProductId);
    
    if (currentIndex === -1) {
      return {
        currentIndex: -1,
        totalProducts: activeProducts.length,
        hasNext: false,
        hasPrevious: false,
        nextProduct: null,
        previousProduct: null,
      };
    }

    const hasNext = currentIndex < activeProducts.length - 1;
    const hasPrevious = currentIndex > 0;
    const nextProduct = hasNext ? activeProducts[currentIndex + 1] : null;
    const previousProduct = hasPrevious ? activeProducts[currentIndex - 1] : null;

    return {
      currentIndex,
      totalProducts: activeProducts.length,
      hasNext,
      hasPrevious,
      nextProduct: nextProduct ? { id: nextProduct.id, name: nextProduct.name } : null,
      previousProduct: previousProduct ? { id: previousProduct.id, name: previousProduct.name } : null,
    };
  }, [currentProductId, products, isLoading]);

  const navigateToNext = () => {
    if (navigationInfo.nextProduct) {
      const newPath = location.pathname.replace(
        `/product/${currentProductId}`,
        `/product/${navigationInfo.nextProduct.id}`
      );
      // Preserve current search parameters (including tab)
      navigate(newPath + location.search);
    }
  };

  const navigateToPrevious = () => {
    if (navigationInfo.previousProduct) {
      const newPath = location.pathname.replace(
        `/product/${currentProductId}`,
        `/product/${navigationInfo.previousProduct.id}`
      );
      // Preserve current search parameters (including tab)
      navigate(newPath + location.search);
    }
  };

  return {
    ...navigationInfo,
    navigateToNext,
    navigateToPrevious,
  };
}