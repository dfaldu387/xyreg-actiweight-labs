
import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useProductNavigation } from '@/hooks/useProductNavigation';
import { useProductDetails } from '@/hooks/useProductDetails';

export function ProductNavigationTracker() {
  const { productId } = useParams();
  const location = useLocation();
  const { trackProductView } = useProductNavigation();
  const { data: product } = useProductDetails(productId);

  useEffect(() => {
    if (product && productId) {
      // Track this product view
      trackProductView(productId, product.name, product.company || 'Unknown Company');
    }
  }, [product, productId, trackProductView]);

  return null; // This component doesn't render anything
}
