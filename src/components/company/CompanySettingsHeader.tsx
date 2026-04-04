
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useProductNavigation } from '@/hooks/useProductNavigation';
import { toast } from 'sonner';

interface CompanySettingsHeaderProps {
  companyId: string;
  companyName: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function CompanySettingsHeader({
  companyId,
  companyName,
  activeTab,
  onTabChange
}: CompanySettingsHeaderProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { getLastViewedProduct } = useProductNavigation();
  
  const {
    hasPermission: canEditSettings
  } = usePermission('company', companyId, 'E');

  const handleBack = () => {
    try {
      // First try to use the returnTo parameter
      if (returnTo) {
        let decodedPath;
        try {
          decodedPath = decodeURIComponent(returnTo);
        } catch {
          // Don't throw - try fallback navigation instead
          decodedPath = null;
        }

        // Basic validation - just ensure it's an app route
        if (decodedPath && decodedPath.startsWith('/app/')) {
          // Only normalize URLs that actually contain spaces in path segments
          let normalizedPath = decodedPath;

          // Check if the URL contains spaces that need to be converted to hyphens
          if (decodedPath.includes(' ')) {
            // Only apply normalization to URLs with spaces - preserve already valid URLs like "gap-analysis"
            normalizedPath = decodedPath.replace(/\s+/g, '-');
          }

          try {
            navigate(normalizedPath, { replace: true });
            return;
          } catch {
            // Continue to fallback logic below
          }
        }
      }

      // If no returnTo, check for last viewed product
      const lastProduct = getLastViewedProduct(companyName);

      if (lastProduct && lastProduct.fullPath.includes('/app/product/')) {
        navigate(lastProduct.fullPath, { replace: true });
        return;
      }

      // Fallback to company dashboard
      const fallbackPath = `/app/company/${encodeURIComponent(companyName)}`;
      navigate(fallbackPath, { replace: true });

    } catch {
      toast.error('Navigation failed. Redirecting to company dashboard.');

      // Ultimate fallback
      try {
        const ultimateFallback = `/app/company/${encodeURIComponent(companyName)}`;
        navigate(ultimateFallback, { replace: true });
      } catch {
        toast.error('Unable to navigate. Please refresh the page.');
      }
    }
  };

  // Get navigation context for breadcrumb
  const getNavigationContext = () => {
    if (returnTo) {
      // Try to extract product info from returnTo URL
      const productMatch = decodeURIComponent(returnTo).match(/\/app\/product\/([^/?]+)/);
      if (productMatch) {
        return {
          type: 'product' as const,
          name: 'Product', // We could enhance this to get actual product name
          path: decodeURIComponent(returnTo)
        };
      }
    }

    const lastProduct = getLastViewedProduct(companyName);
    if (lastProduct) {
      return {
        type: 'product' as const,
        name: lastProduct.productName,
        path: lastProduct.fullPath
      };
    }

    return {
      type: 'company' as const,
      name: companyName,
      path: `/app/company/${encodeURIComponent(companyName)}`
    };
  };

  const navigationContext = getNavigationContext();

  return (
    <div className="space-y-2 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="icon" onClick={handleBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            {/* Breadcrumb navigation */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <button
                onClick={handleBack}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {navigationContext.type === 'product' ? (
                  <>
                    <span>{navigationContext.name}</span>
                    <ArrowRight className="h-3 w-3" />
                  </>
                ) : (
                  <span>{navigationContext.name}</span>
                )}
              </button>
              <span>Settings</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold truncate">{companyName} Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Configure company settings, phases, and user permissions
            </p>
          </div>
        </div>
        
        {canEditSettings && (
          <div className="shrink-0">
            {/* Add any settings actions here if needed */}
          </div>
        )}
      </div>
      
      <div className="border-b"></div>
    </div>
  );
}
