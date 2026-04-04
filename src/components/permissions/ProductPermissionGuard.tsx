import React from 'react';
import { useProductPermissions } from '@/hooks/useProductPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface ProductPermissionGuardProps {
  productId: string | undefined;
  requiredPermission?: string | string[];
  requiredAccessLevel?: 'read' | 'write' | 'full';
  fallback?: React.ReactNode;
  showMessage?: boolean;
  children: React.ReactNode;
}

/**
 * Component that conditionally renders children based on product-specific permissions
 * 
 * Usage:
 * <ProductPermissionGuard 
 *   productId={productId} 
 *   requiredPermission="product_edit"
 * >
 *   <Button>Edit Product</Button>
 * </ProductPermissionGuard>
 */
export function ProductPermissionGuard({
  productId,
  requiredPermission,
  requiredAccessLevel,
  fallback,
  showMessage = false,
  children,
}: ProductPermissionGuardProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAccessLevel,
    isLoading,
    error,
  } = useProductPermissions(productId);

  // Still loading
  if (isLoading) {
    return fallback || null;
  }

  // Error loading permissions
  if (error) {
    console.error('Permission check error:', error);
    return fallback || null;
  }

  // Check permission
  let hasAccess = true;

  if (requiredPermission) {
    if (Array.isArray(requiredPermission)) {
      hasAccess = hasAnyPermission(requiredPermission);
    } else {
      hasAccess = hasPermission(requiredPermission);
    }
  }

  if (requiredAccessLevel && hasAccess) {
    hasAccess = hasAccessLevel(requiredAccessLevel);
  }

  // No access
  if (!hasAccess) {
    if (showMessage) {
      return (
        <Alert variant="destructive" className="my-4">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this feature for this product.
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Has access
  return <>{children}</>;
}
