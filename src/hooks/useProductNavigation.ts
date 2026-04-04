
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface LastViewedProduct {
  productId: string;
  productName: string;
  companyName: string;
  fullPath: string;
  timestamp: number;
}

const STORAGE_KEY = 'recentlyViewedProducts';
const OLD_STORAGE_KEY = 'lastViewedProduct'; // For migration
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RECENT_PRODUCTS = 10;

export function useProductNavigation() {
  const location = useLocation();

  // Store the current product when viewing a product page
  const trackProductView = useCallback((productId: string, productName: string, companyName: string) => {
    const productData: LastViewedProduct = {
      productId,
      productName,
      companyName,
      fullPath: location.pathname + location.search,
      timestamp: Date.now()
    };
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let recentProducts: LastViewedProduct[] = [];
      
      if (stored) {
        try {
          recentProducts = JSON.parse(stored);
          if (!Array.isArray(recentProducts)) {
            recentProducts = [];
          }
        } catch {
          recentProducts = [];
        }
      }
      
      // Remove any existing entry for this product
      recentProducts = recentProducts.filter(p => p.productId !== productId);
      
      // Add the new entry at the beginning
      recentProducts.unshift(productData);
      
      // Keep only the most recent MAX_RECENT_PRODUCTS
      recentProducts = recentProducts.slice(0, MAX_RECENT_PRODUCTS);
      
      // Remove expired entries
      const now = Date.now();
      recentProducts = recentProducts.filter(p => now - p.timestamp <= STORAGE_EXPIRY);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentProducts));
    } catch (error) {
      console.warn('Failed to store product navigation data:', error);
    }
  }, [location.pathname, location.search]);

  // Get recently viewed products, optionally filtered by company
  const getRecentlyViewedProducts = useCallback((companyName?: string): LastViewedProduct[] => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    
    try {
      let stored = localStorage.getItem(STORAGE_KEY);
      let recentProducts: LastViewedProduct[] = [];
      
      // If no new data exists, try to migrate old data
      if (!stored) {
        const oldStored = localStorage.getItem(OLD_STORAGE_KEY);
        if (oldStored) {
          try {
            const oldProduct: LastViewedProduct = JSON.parse(oldStored);
            // Convert old single product to array format
            recentProducts = [oldProduct];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentProducts));
            localStorage.removeItem(OLD_STORAGE_KEY); // Clean up old data
            stored = JSON.stringify(recentProducts);
          } catch (error) {
            console.warn('Failed to migrate old product data:', error);
          }
        }
      }
      
      if (!stored) return [];

      recentProducts = JSON.parse(stored);
      if (!Array.isArray(recentProducts)) return [];
      
      const now = Date.now();
      
      // Filter out expired entries
      recentProducts = recentProducts.filter(p => now - p.timestamp <= STORAGE_EXPIRY);
      
      // If company name is provided, only return products from that company
      if (companyName) {
        recentProducts = recentProducts.filter(p => p.companyName === companyName);
      }
      
      // Update localStorage with cleaned data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentProducts));

      return recentProducts;
    } catch (error) {
      console.warn('Failed to retrieve product navigation data:', error);
      return [];
    }
  }, []);

  // Get the last viewed product for a company (backward compatibility)
  const getLastViewedProduct = useCallback((companyName?: string): LastViewedProduct | null => {
    const recentProducts = getRecentlyViewedProducts(companyName);
    return recentProducts.length > 0 ? recentProducts[0] : null;
  }, [getRecentlyViewedProducts]);

  // Clear stored product data
  const clearProductNavigation = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear product navigation data:', error);
    }
  }, []);

  // Auto-track when on a product page
  useEffect(() => {
    const productMatch = location.pathname.match(/\/app\/product\/([^/]+)/);
    if (productMatch) {
      const productId = productMatch[1];
      // We'll set this from the component that has access to product details
    }
  }, [location.pathname]);

  return {
    trackProductView,
    getLastViewedProduct,
    getRecentlyViewedProducts,
    clearProductNavigation
  };
}
