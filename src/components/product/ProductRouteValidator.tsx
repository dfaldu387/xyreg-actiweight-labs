import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Validates that product routes have valid UUID product IDs
 * Redirects to products list if invalid
 */
export function ProductRouteValidator() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only validate routes that include /product/ in the path
    if (!location.pathname.includes('/product/')) {
      return;
    }

    // Extract productId from params
    const productId = params.productId;

    // If no productId, skip validation
    if (!productId) {
      return;
    }

    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // Check if productId is a valid UUID
    if (!uuidRegex.test(productId)) {
      console.error('[ProductRouteValidator] Invalid product ID detected:', {
        productId,
        pathname: location.pathname,
        timestamp: new Date().toISOString()
      });

      // Show error message
      toast.error('Invalid product URL', {
        description: 'Please select a product from the list'
      });

      // Redirect to app root (which will show products list)
      navigate('/app', { replace: true });
    }
  }, [params.productId, location.pathname, navigate]);

  return null; // This component doesn't render anything
}
