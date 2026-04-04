
import { useSimpleClientsFixed } from "@/hooks/useSimpleClientsFixed";
import { useSidebarCompanyProducts } from "@/hooks/useSidebarCompanyProducts";
import { useMemo, useCallback, useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useMissionControl } from "@/context/MissionControlContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
// Note: useCompanyContextPersistence is no longer needed - useCompanyRoles handles everything

export function useSidebarData() {
  // Use useSimpleClientsFixed to share cache with Clients page
  const { clients, isLoading, error } = useSimpleClientsFixed();
  const location = useLocation();
  const params = useParams();
  const [resolvedProductCompany, setResolvedProductCompany] = useState<string | null>(null);
  // Use isReviewer from AuthContext to avoid duplicate API call
  const { user, isReviewer } = useAuth();
  const { isMissionControlOverlay, originalContext, dashboardType, activeCompanyId } = useDashboardContext();
  const { companyRoles, activeCompanyRole } = useCompanyRole();
  const { selectedCompanyName } = useMissionControl();

  // Extract current context from URL, but prioritize original context if in Mission Control overlay
  let currentProductId = params.productId || null;

  // console.log('[useSidebarData] 🔍 Product ID extraction:', {
  //   rawProductId: params.productId,
  //   allParams: params,
  //   pathname: location.pathname,
  //   timestamp: new Date().toISOString()
  // });

  // CRITICAL: Validate product ID is a valid UUID, not a route segment like "milestones"
  if (currentProductId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(currentProductId)) {
      console.error('[useSidebarData] ❌ Invalid product ID detected (not a UUID):', {
        invalidProductId: currentProductId,
        pathname: location.pathname,
        allParams: params
      });
      currentProductId = null; // Clear invalid product ID
    }
  }

  let currentCompany = params.companyName ? decodeURIComponent(params.companyName) : null;

  // Check for supplier routes and set company context
  if (!currentCompany && location.pathname.includes('/app/supplier') && clients.length > 0) {
    // For supplier routes, use the first available company as context
    currentCompany = clients[0]?.name || null;
    // console.log('[useSidebarData] Detected supplier route, using company context:', currentCompany);
  }

  // Check for communication routes and set company context
  // FIXED: Only use activeCompanyRole, don't fall back to companyRoles[0] which can cause wrong company
  if (!currentCompany && location.pathname.startsWith('/app/communications')) {
    if (activeCompanyRole?.companyName) {
      currentCompany = activeCompanyRole.companyName;
    }
    // Removed companyRoles[0] fallback - was causing redirect issues
  }

  // Check for product-family or device-family routes and set company context
  if (!currentCompany && (location.pathname.includes('/product-family/') || location.pathname.includes('/device-family/'))) {
    if (activeCompanyRole?.companyName) {
      currentCompany = activeCompanyRole.companyName;
    }
  }

  // Reset context on global admin routes
  const isGlobalAdminRoute = location.pathname.startsWith('/app/clients') ||
    location.pathname.startsWith('/app/archives');

  if (isGlobalAdminRoute) {
    currentProductId = null;
    currentCompany = null;
  }
  // If in Mission Control overlay mode, use the original context for sidebar
  else if (isMissionControlOverlay && originalContext) {
    currentCompany = originalContext.companyName || currentCompany;
    currentProductId = originalContext.productId || currentProductId;
  }
  // If on GLOBAL mission control page (/app/mission-control) with single company dashboard, use the active company for sidebar
  // BUT: If on company-specific mission control (/app/company/{name}/mission-control), URL company takes precedence
  else if (location.pathname === '/app/mission-control' && dashboardType === 'single-company' && activeCompanyId && !currentCompany) {
    // Find the company name from the activeCompanyId
    const activeCompanyRole = companyRoles.find(role => role.companyId === activeCompanyId);
    if (activeCompanyRole) {
      currentCompany = activeCompanyRole.companyName;
      // console.log('[useSidebarData] Using active company from mission control:', currentCompany);
    }
  }
  // If on GLOBAL mission control page and no company context yet, check mission control context first
  else if (location.pathname === '/app/mission-control' && !currentCompany) {
    if (selectedCompanyName) {
      currentCompany = selectedCompanyName;
      // console.log('[useSidebarData] Using selected company from mission control context:', selectedCompanyName);
    } else if (companyRoles.length === 1) {
      currentCompany = companyRoles[0].companyName;
      // console.log('[useSidebarData] Using single company from mission control:', currentCompany);
    }
  }
  // CRITICAL: If on company-specific route, URL company always takes precedence - log it
  if (params.companyName) {
    // console.log('[useSidebarData] URL company context detected:', {
    //   urlCompany: decodeURIComponent(params.companyName),
    //   finalCurrentCompany: currentCompany,
    //   location: location.pathname
    // });
  }

  // If no product ID in URL params, check returnTo parameter for product context
  if (!currentProductId && location.search) {
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      const productMatch = returnTo.match(/\/product\/([^\/\?]+)/);
      if (productMatch) {
        currentProductId = productMatch[1];
      }
    }
  }

  // Find product owner company if we have a product ID
  const productOwnerCompany = useMemo(() => {
    if (!currentProductId || !clients.length) return null;

    for (const client of clients) {
      if (client.productList && client.productList.some(p => p.id === currentProductId)) {
        return client.name;
      }
    }
    return null;
  }, [currentProductId, clients]);

  // Product-to-company bridging: ONLY for product pages WITHOUT company in URL
  // This helps sidebar show correct products when navigating directly to /app/product/xxx
  useEffect(() => {
    const bridgeProductToCompanyContext = async () => {
      // CRITICAL: Only bridge if URL does NOT have company context
      // If URL has /app/company/xxx, don't interfere - URL is source of truth
      const pathname = window.location.pathname;
      const hasUrlCompany = pathname.match(/\/app\/company\/([^\/]+)/);

      if (hasUrlCompany) {
        // URL has company - don't bridge, let URL be source of truth
        return;
      }

      // Only bridge for product pages
      if (!pathname.includes('/app/product/')) {
        return;
      }

      // Only bridge if we have a product but no active company role yet
      if (!currentProductId || activeCompanyRole) {
        return;
      }

      const companyName = productOwnerCompany || resolvedProductCompany;
      if (!companyName) {
        return;
      }

      // console.log('[useSidebarData] Bridging product to company context:', {
      //   productId: currentProductId,
      //   companyName,
      //   reason: 'Product page without URL company context'
      // });

      // Find matching role and update sessionStorage (don't call switchCompanyRole to avoid redirect)
      const matchingRole = companyRoles.find(role =>
        role.companyName.toLowerCase() === companyName.toLowerCase()
      );

      if (matchingRole) {
        try {
          // Just update sessionStorage - useCompanyRoles will pick it up on next load
          sessionStorage.setItem('xyreg_company_context', JSON.stringify({
            companyId: matchingRole.companyId,
            companyName: matchingRole.companyName,
            productId: currentProductId,
            lastUpdated: Date.now()
          }));
        } catch (error) {
          console.error('[useSidebarData] Error saving context:', error);
        }
      }
    };

    bridgeProductToCompanyContext();
  }, [currentProductId, productOwnerCompany, resolvedProductCompany, activeCompanyRole, companyRoles]);

  // isReviewer is now provided by AuthContext - no need for duplicate fetch
  // Direct database lookup for product company when not found in cached data
  const resolveProductCompany = useCallback(async () => {
    if (!currentProductId || productOwnerCompany || resolvedProductCompany) {
      return; // Already resolved or no product ID
    }

    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          company_id,
          companies!inner(
            id,
            name
          )
        `)
        .eq('id', currentProductId)
        .single();

      if (productError) {
        console.error('[useSidebarData] Error fetching product company:', productError);
        return;
      }

      if (productData?.companies?.name) {
        setResolvedProductCompany(productData.companies.name);
      }
    } catch (error) {
      console.error('[useSidebarData] Error in product company resolution:', error);
    }
  }, [currentProductId, productOwnerCompany]); // Removed resolvedProductCompany to prevent loops

  useEffect(() => {
    resolveProductCompany();
  }, [resolveProductCompany]);

  // Clear resolved company when product changes
  useEffect(() => {
    if (!currentProductId) {
      setResolvedProductCompany(null);
    }
  }, [currentProductId]);

  // Determine which company to fetch products for
  // Also check if we're on a family route and use activeCompanyRole as fallback
  const isFamilyRoute = location.pathname.includes('/product-family/') || location.pathname.includes('/device-family/');
  const targetCompany = currentCompany || productOwnerCompany || resolvedProductCompany ||
    (isFamilyRoute && activeCompanyRole?.companyName ? activeCompanyRole.companyName : null);

  // Find company ID for template settings
  const targetCompanyId = useMemo(() => {
    if (!targetCompany || !clients.length) return null;
    const company = clients.find(c => c.name === targetCompany);
    return company?.id || null;
  }, [targetCompany, clients]);

  // Use the updated hook with real-time capabilities
  const {
    data: productsFromHook,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: hookRefetchProducts
  } = useSidebarCompanyProducts(targetCompany);

  // console.log('[useSidebarData] Sidebar products debug:', {
  //   targetCompany,
  //   productsFromHook,
  //   isLoadingProducts,
  //   error: productsError
  // });

  // Memoize refresh function to prevent unnecessary re-creations
  const refreshProducts = useCallback(() => {
    hookRefetchProducts();
    // Also clear resolved company to force re-resolution if needed
    if (currentProductId && !productOwnerCompany) {
      setResolvedProductCompany(null);
    }
  }, [hookRefetchProducts]); // Removed currentProductId and productOwnerCompany to prevent loops

  const sidebarData = useMemo(() => {
    if (isLoading || error || !clients.length) {
      return [];
    }

    return clients.map(client => ({
      id: client.id,
      name: client.name,
      country: client.country || 'Unknown',
      products: client.products || 0,
      progress: client.progress || 0,
      status: client.status || 'On Track',
      alerts: client.alerts || []
    }));
  }, [clients, isLoading, error]);

  // Use products from the dedicated hook for better real-time updates
  const productsForMenu = useMemo(() => {
    return productsFromHook || [];
  }, [productsFromHook]);

  return {
    sidebarData,
    reviewAssignDocument: isReviewer, // Use cached value from AuthContext
    isLoading,
    error: error || productsError || null,
    // Additional properties that Sidebar.tsx expects
    availableCompanies: clients,
    filteredCompanies: clients, // For now, no filtering
    productsForMenu,
    productOwnerCompany: productOwnerCompany || resolvedProductCompany,
    currentCompany,
    currentProductId,
    targetCompanyId, // Add company ID for template settings
    isLoadingCompanies: isLoading,
    isLoadingProducts,
    refreshProducts // Expose memoized refresh function
  };
}
