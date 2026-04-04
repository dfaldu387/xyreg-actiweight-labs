import React, { useEffect, useRef, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, LogOut, Archive, Settings, HelpCircle, Compass, FileText, ScrollText, Package, Crosshair, BookOpen, ChevronLeft, MessageCircle } from "lucide-react";
import { GlobalHelpSidebar } from "@/components/help/GlobalHelpSidebar";
import { Button } from "@/components/ui/button";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useSidebarData } from "@/hooks/useSidebarData";
import { useProductNavigation } from "@/hooks/useProductNavigation";
import { useDevMode } from "@/context/DevModeContext";
import { useEffectiveUserRole } from "@/hooks/useEffectiveUserRole";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useMissionControl } from "@/context/MissionControlContext";
import { usePendingReviewsCount } from "@/hooks/usePendingReviewsCount";
import { useDashboardContext } from "@/hooks/useDashboardContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { SidebarProductMenu } from "./sidebar/SidebarProductMenu";
import { SidebarReviewerProductMenu } from "./sidebar/SidebarReviewerProductMenu";
import { SidebarContextualMenu } from "./sidebar/SidebarContextualMenu";
import SuperAdminSidebar from "./sidebar/SuperAdminSidebar";
import { useReviewerGroupMembership } from "@/hooks/useReviewerGroupMembership";

// Help Button component to manage its own state
function HelpButton({ state, collapsed }: { state: string; collapsed?: boolean }) {
  const [helpSidebarOpen, setHelpSidebarOpen] = useState(false);
  const isCollapsed = collapsed ?? state === "collapsed";
  
  return (
    <>
      <SidebarMenuButton
        onClick={() => setHelpSidebarOpen(true)}
        tooltip="Help"
        size="lg"
        className={cn("font-medium text-sm", isCollapsed ? "px-0 justify-center" : "px-3")}
      >
        <div className={cn("flex items-center", isCollapsed ? "justify-center w-full" : "gap-3")}>
          <BookOpen className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Help</span>}
        </div>
      </SidebarMenuButton>
      <GlobalHelpSidebar open={helpSidebarOpen} onOpenChange={setHelpSidebarOpen} />
    </>
  );
}

export default function AppSidebar() {
  const {
    user,
    userRole,
    signOut
  } = useAuth();
  const { isDevMode, selectedCompanies } = useDevMode();
  const location = useLocation();
  const { state } = useSidebar();
  // // console.log("location", location.pathname.startsWith('/app/clients'))
  const mountTimeRef = useRef(Date.now());
  const {
    getLastViewedProduct
  } = useProductNavigation();
  const {
    expandedMenus,
    manuallyCollapsedMenus,
    toggleMenuExpansion,
    setAutoExpansion,
    collapseMenu
  } = useSidebarState();
  const {
    availableCompanies,
    filteredCompanies,
    productsForMenu,
    productOwnerCompany,
    currentCompany,
    currentProductId,
    targetCompanyId,
    isLoadingProducts,
    refreshProducts,
    reviewAssignDocument
  } = useSidebarData();

  // Use the effective user role hook to get the correct role from user_company_access
  const { effectiveRole, isAdmin, isLoading: isRoleLoading } = useEffectiveUserRole();
  const { companyRoles } = useCompanyRole();
  const { selectedCompanyId, selectedCompanyName } = useMissionControl();
  const { pendingCount } = usePendingReviewsCount();
  const { isMissionControlOverlay } = useDashboardContext();

  // Check if user is a reviewer (reviewers should not see Product menu)
  // BUT: Admins should always see the regular product menu, not the reviewer menu
  const { isReviewerGroupMember: rawIsReviewerGroupMember } = useReviewerGroupMembership(targetCompanyId || undefined);
  const isReviewerGroupMember = rawIsReviewerGroupMember && !isAdmin;

  // Use Mission Control context when in overlay mode, otherwise use sidebar data
  const effectiveCurrentCompany = isMissionControlOverlay && selectedCompanyName
    ? selectedCompanyName
    : currentCompany;

  // Debug logging for admin privileges
  useEffect(() => {
    // console.log('Sidebar debug info:', { userRole, effectiveRole, isAdmin, currentCompany, hasAdminPrivileges: hasAdminPrivileges(userRole || 'viewer'), effectiveHasAdminPrivileges: isAdmin });
  }, [userRole, effectiveRole, isAdmin, currentCompany]);

  // Removed auto-expansion logic - Products menu should stay closed by default

  // Helper functions
  const isProductActive = (productPath: string) => {
    const productId = productPath.split("/").pop();
    return location.pathname === productPath || productId && location.pathname.includes(`/app/product/${productId}`) || productId && productId === currentProductId;
  };

  // Enhanced helper function to build Company Settings URL with better product context
  const buildCompanySettingsUrl = (companyName: string) => {
    // console.log('[Sidebar] buildCompanySettingsUrl called with:', { companyName, type: typeof companyName, length: companyName?.length, trimmed: companyName?.trim() });

    // Validate company name
    if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
      console.error('[Sidebar] Invalid company name provided:', companyName);
      return '/app/access-denied';
    }

    const trimmedCompanyName = companyName.trim();
    const baseUrl = `/app/company/${encodeURIComponent(trimmedCompanyName)}/settings`;

    // Check if we're currently on a product page to add return context
    const currentPath = location.pathname;
    const isOnProductPage = currentPath.includes('/app/product/');
    // // console.log('[Sidebar] Building company settings URL:', {
    //   companyName: trimmedCompanyName,
    //   baseUrl,
    //   currentPath,
    //   search: location.search,
    //   isOnProductPage
    // });

    if (isOnProductPage) {
      // Single encoding is sufficient - avoid double encoding which corrupts URLs
      const fullUrl = currentPath + location.search;
      const returnPath = encodeURIComponent(fullUrl);
      const finalUrl = `${baseUrl}?returnTo=${returnPath}`;
      // // console.log('[Sidebar] Product page detected, building URL with returnTo:', {
      //   fullUrl,
      //   returnPath,
      //   finalUrl,
      //   decodedTest: decodeURIComponent(returnPath) // Test decoding works
      // });
      return finalUrl;
    }

    // If not on a product page, check if we have a last viewed product for this company
    const lastProduct = getLastViewedProduct(trimmedCompanyName);
    if (lastProduct && lastProduct.fullPath.includes('/app/product/')) {
      const returnPath = encodeURIComponent(lastProduct.fullPath);
      const finalUrl = `${baseUrl}?returnTo=${returnPath}`;
      // // console.log('[Sidebar] Using last viewed product:', {
      //   lastProduct,
      //   returnPath,
      //   finalUrl
      // });
      return finalUrl;
    }

    // If no product context, use current page as return path
    const returnPath = encodeURIComponent(currentPath + location.search);
    const finalUrl = `${baseUrl}?returnTo=${returnPath}`;
    // // console.log('[Sidebar] Using current page as return path:', {
    //   returnPath,
    //   finalUrl
    // });
    return finalUrl;
  };
  const { activeCompanyRole } = useCompanyRole();
  // Don't use currentCompany on bundle routes - let bundle company data take priority
  const isBundleRoute = location.pathname.includes('/app/bundle/');
  const activeCompany = isBundleRoute ? null : (currentCompany || productOwnerCompany);

  // Extract bundleId from URL if on a bundle route
  const bundleIdFromUrl = useMemo(() => {
    const match = location.pathname.match(/\/app\/bundle\/([^\/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  // Fetch bundle company when on a bundle route
  const { data: bundleCompanyData, isLoading: isBundleCompanyLoading } = useQuery({
    queryKey: ['bundle-company', bundleIdFromUrl],
    queryFn: async () => {
      if (!bundleIdFromUrl) return null;
      
      // console.log('[Sidebar] Fetching company for bundle:', bundleIdFromUrl);
      
      // Query product_bundles and join with companies table
      const { data, error } = await supabase
        .from('product_bundles')
        .select(`
          company_id,
          companies!inner (
            name
          )
        `)
        .eq('id', bundleIdFromUrl)
        .single();
      
      if (error) {
        console.error('[Sidebar] Error fetching bundle company:', error);
        return null;
      }
      
      if (!data || !data.companies) {
        console.warn('[Sidebar] No company found for bundle:', bundleIdFromUrl);
        return null;
      }
      
      // console.log('[Sidebar] Found company for bundle:', data.companies.name);
      return data.companies.name;
    },
    enabled: !!bundleIdFromUrl,
  });

  // Enhanced company detection for admin users
  const effectiveActiveCompany = useMemo(() => {
    // // console.log('[Sidebar] effectiveActiveCompany calculation:', {
    //   activeCompany,
    //   productOwnerCompany,
    //   isAdmin,
    //   locationPathname: location.pathname,
    //   filteredCompaniesCount: filteredCompanies.length,
    //   filteredCompaniesNames: filteredCompanies.map(c => c.name),
    //   activeCompanyRole: activeCompanyRole?.companyName,
    //   isMissionControlOverlay,
    //   selectedCompanyName,
    //   effectiveCurrentCompany
    // });

    // Prioritize Mission Control selected company when in overlay mode
    if (isMissionControlOverlay && selectedCompanyName) {
      // console.log('[Sidebar] Using Mission Control selected company:', selectedCompanyName);
      return selectedCompanyName;
    }

    // Show Mission Control selected company when actively selected, even on global route
    if (location.pathname === '/app/mission-control' && selectedCompanyName) {
      // console.log('[Sidebar] Using Mission Control selected company on global route:', selectedCompanyName);
      return selectedCompanyName;
    }

    // Don't show company context on global Mission Control route when no company is selected
    if (location.pathname === '/app/mission-control' && !selectedCompanyName) {
      // console.log('[Sidebar] On global Mission Control route with no company selected - no context shown');
      return null;
    }

    // Don't show company context on other global admin routes
    const isGlobalAdminRoute = location.pathname.startsWith('/app/clients') ||
      location.pathname.startsWith('/app/archives');

    if (isGlobalAdminRoute) {
      // console.log('[Sidebar] On global admin route, not showing company context');
      return null;
    }

    // For Document Studio, use the active company role from context
    if (location.pathname.includes('/app/document-studio')) {
      // 1. Priority: Active company role
      if (activeCompanyRole) {
        // console.log('[Sidebar] Using activeCompanyRole for Document Studio:', activeCompanyRole.companyName);
        return activeCompanyRole.companyName;
      }

      // 2. Fallback: Product owner company
      if (productOwnerCompany) {
        // console.log('[Sidebar] Using productOwnerCompany for Document Studio:', productOwnerCompany);
        return productOwnerCompany;
      }

      // 3. Fallback: Current company from sidebar data
      if (activeCompany) {
        // console.log('[Sidebar] Using activeCompany for Document Studio:', activeCompany);
        return activeCompany;
      }

      // 4. Fallback: First available company
      if (filteredCompanies.length > 0) {
        const fallbackCompany = filteredCompanies[0].name;
        // console.log('[Sidebar] Using fallback company for Document Studio:', fallbackCompany);
        return fallbackCompany;
      }

      return null;
    }

    // PRIORITY 1: For bundle routes, use bundle company (allow fallback while loading)
    if (location.pathname.includes('/app/bundle/')) {
      if (bundleCompanyData) {
        // console.log('[Sidebar] Using bundle company:', bundleCompanyData);
        return bundleCompanyData;
      }
      
      // While loading or if query fails, don't return null immediately
      // This allows the fallback logic below to provide a company context
      if (!isBundleCompanyLoading) {
        console.warn('[Sidebar] Bundle route but no company found for bundle:', bundleIdFromUrl);
      }
      // Fall through to other priority checks instead of returning null
    }

    // PRIORITY 2: If we have an active company, use it
    if (activeCompany) {
      // // console.log('[Sidebar] Using activeCompany:', activeCompany);
      return activeCompany;
    }

    // For admin users, try to get company from URL if on a company route or supplier route
    if (isAdmin) {
      // Check for company routes
      if (location.pathname.includes('/app/company/')) {
        const match = location.pathname.match(/\/app\/company\/([^\/]+)/);
        if (match) {
          const urlCompanyName = decodeURIComponent(match[1]);
          // console.log('[Sidebar] Using company from URL:', urlCompanyName);
          return urlCompanyName;
        }
      }

      // Check for supplier routes - use first company as context
      if (location.pathname.includes('/app/supplier')) {
        if (filteredCompanies.length > 0) {
          const supplierCompany = filteredCompanies[0].name;
          // console.log('[Sidebar] Using first company for supplier context:', supplierCompany);
          return supplierCompany;
        }
      }
    }

    // Fallback to any available company (but NOT on global admin routes or bundle routes)
    const isBundleRouteCheck = location.pathname.includes('/app/bundle/');
    if (filteredCompanies.length > 0 && !isBundleRouteCheck) {
      const fallbackCompany = filteredCompanies[0].name;
      // console.log('[Sidebar] Using fallback company from filteredCompanies:', fallbackCompany);
      return fallbackCompany;
    }

    // console.log('[Sidebar] No company found, returning null');
    return null;
  }, [activeCompany, productOwnerCompany, isAdmin, location.pathname, filteredCompanies, isMissionControlOverlay, selectedCompanyName, effectiveCurrentCompany, bundleCompanyData, bundleIdFromUrl, activeCompanyRole, isBundleCompanyLoading]);

  // Check if we're in single company mode (dev mode with 1 company or regular mode with 1 company)
  const isSingleCompanyMode = (isDevMode && selectedCompanies.length === 1) || (!isDevMode && filteredCompanies.length === 1);
  const singleCompanyName = isDevMode ? selectedCompanies[0]?.name : filteredCompanies[0]?.name;

  // Check if we're on a super admin route
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin');

  // If on super admin route, show the super admin sidebar
  if (isSuperAdminRoute) {
    return <SuperAdminSidebar />;
  }


  const { toggleSidebar } = useSidebar();

  // Regular sidebar for non-super admin routes
  return <Sidebar collapsible="icon">
    <SidebarHeader>
      <div className="flex items-center justify-center px-3 py-4 relative">
        {/* Close/collapse button - visible when sidebar is expanded */}
        {state !== "collapsed" && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="absolute right-2 top-2 h-8 w-8 bg-background hover:bg-muted border shadow-sm z-10"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <Link to="/" className="flex items-center justify-center w-full">
          {state === "collapsed" ? (
            <div className="text-2xl font-bold transform -rotate-90 mt-20 -ml-1.5">
              <span className="text-black">X</span>
              <span className="text-teal-600">YREG</span>
            </div>
          ) : (
            <img
              src="/asset/nav_bar-removebg-preview.png"
              alt="Company Logo"
              className="h-[145px] w-[145px] object-contain transition-all duration-300 ease-in-out"
              onError={e => {
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
          )}
          <span className="text-2xl font-bold hidden">XYREG</span>
        </Link>
      </div>
    </SidebarHeader>

    <SidebarContent>
      {/* Collapse button at top of content - visible when expanded */}
      {state !== "collapsed" && (
        <div className="flex justify-end px-2 py-1 border-b mb-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Close</span>
          </Button>
        </div>
      )}
      <SidebarMenu className={cn("px-2", state === "collapsed" && "mt-[80px]")}>
        {/* Mission Control - Only available to admin users */}
        {isAdmin && (
          <SidebarMenuItem className="mb-1">
            <SidebarMenuButton asChild isActive={location.pathname.includes("/mission-control")} tooltip="Mission Control" size="lg" className={cn("font-medium text-sm", state === "collapsed" ? "px-0 justify-center" : "px-3")}>
              <Link
                to={(() => {
                  // SECURITY FIX: Always preserve company context when navigating to Mission Control

                  // PRIORITY 1: Extract company from current URL if we're on a company route
                  if (location.pathname.includes('/app/company/')) {
                    const match = location.pathname.match(/\/app\/company\/([^\/]+)/);
                    if (match) {
                      const urlCompanyName = decodeURIComponent(match[1]);
                      // console.log('[SECURITY] Using company from current URL for Mission Control:', urlCompanyName);
                      return `/app/company/${encodeURIComponent(urlCompanyName)}/mission-control`;
                    }
                  }

                  // PRIORITY 2: Use Mission Control selected company if available
                  if (selectedCompanyName) {
                    // console.log('[SECURITY] Using selectedCompanyName for Mission Control:', selectedCompanyName);
                    return `/app/company/${encodeURIComponent(selectedCompanyName)}/mission-control`;
                  }

                  // PRIORITY 3: Use effective active company
                  if (effectiveActiveCompany) {
                    // console.log('[SECURITY] Using effectiveActiveCompany for Mission Control:', effectiveActiveCompany);
                    return `/app/company/${encodeURIComponent(effectiveActiveCompany)}/mission-control`;
                  }

                  // PRIORITY 4: Use currentCompany as fallback
                  if (currentCompany) {
                    // console.log('[SECURITY] Using currentCompany for Mission Control:', currentCompany);
                    return `/app/company/${encodeURIComponent(currentCompany)}/mission-control`;
                  }

                  // PRIORITY 5: Default to global Mission Control only if no company context exists
                  // console.log('[SECURITY] No company context found, using global Mission Control');
                  return "/app/mission-control";
                })()}
                onClick={() => {
                  // console.log('[sidebar] Mission Control clicked!', { currentCompany, locationPathname: location.pathname, isAdmin, userRole, effectiveRole, companyRoles: companyRoles.map(r => ({ id: r.companyId, name: r.companyName })) });
                }}
                className={cn("flex items-center", state === "collapsed" ? "justify-center w-full" : "gap-3")}
              >
                <div className="text-muted-foreground relative">
                  <Compass className="h-5 w-5" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full border border-background" />
                  )}
                </div>
                {state !== "collapsed" && <span>Mission Control</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Document Studio - Show when in a company context OR when company is selected in Mission Control */}
        {isAdmin && (effectiveActiveCompany || (location.pathname === '/app/mission-control' && selectedCompanyName) || isBundleRoute) && (
          <SidebarMenuItem className="mb-1">
            <SidebarMenuButton asChild isActive={location.pathname.includes("/document-studio") || location.pathname.includes("/document-composer")} tooltip="Document Studio" size="lg" className={cn("font-medium text-sm", state === "collapsed" ? "px-0 justify-center" : "px-3")}>
              <Link
                to={(() => {
                  let contextCompany = null;

                  // 1. Priority: URL-based company context
                  if (location.pathname.includes('/app/company/')) {
                    const match = location.pathname.match(/\/app\/company\/([^\/]+)/);
                    if (match) {
                      contextCompany = decodeURIComponent(match[1]);
                    }
                  }

                  // 2. Fallback: Current company from sidebar data
                  if (!contextCompany) {
                    contextCompany = currentCompany;
                  }

                  // 3. Fallback: Product owner company
                  if (!contextCompany) {
                    contextCompany = productOwnerCompany;
                  }

                  // 4. Fallback: Active company role
                  if (!contextCompany && activeCompanyRole) {
                    contextCompany = activeCompanyRole.companyName;
                  }

                  // 5. Fallback: Mission Control selected company
                  if (!contextCompany && selectedCompanyName) {
                    contextCompany = selectedCompanyName;
                  }

                  // 6. Fallback: First available company
                  if (!contextCompany && filteredCompanies.length > 0) {
                    contextCompany = filteredCompanies[0].name;
                  }

                  return contextCompany ? `/app/company/${encodeURIComponent(contextCompany)}/document-studio` : "/app/document-studio";
                })()}
                className={cn("flex items-center", state === "collapsed" ? "justify-center w-full" : "gap-3")}>
                <div className="text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                {state !== "collapsed" && <span>Document Studio</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}



        {/* Communication - L1 global item */}
        {!isReviewerGroupMember && (effectiveActiveCompany || activeCompany || activeCompanyRole) && (
          <SidebarMenuItem className="mb-1">
            <SidebarMenuButton
              asChild
              isActive={location.pathname.includes('/communications')}
              tooltip="Communication"
              size="lg"
              className={cn(state === "collapsed" ? "px-0 justify-center font-medium text-sm" : "px-3 font-medium text-sm")}
            >
              <Link
                to={(() => {
                  let contextCompany = activeCompany;
                  if (!contextCompany) {
                    const match = location.pathname.match(/\/app\/company\/([^\/]+)/);
                    if (match) contextCompany = decodeURIComponent(match[1]);
                  }
                  if (!contextCompany && activeCompanyRole) contextCompany = activeCompanyRole.companyName;
                  if (!contextCompany && selectedCompanyName) contextCompany = selectedCompanyName;
                  if (!contextCompany && filteredCompanies.length > 0) contextCompany = filteredCompanies[0].name;
                  return contextCompany ? `/app/company/${encodeURIComponent(contextCompany)}/communications` : "/app";
                })()}
                className={cn("flex items-center", state === "collapsed" ? "justify-center w-full" : "gap-3")}
              >
                <div className="text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                </div>
                {state !== "collapsed" && <span>Communication</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Client Compass - Available to consultant users */}
        {(effectiveRole === "consultant" || userRole === "consultant") && (
          <SidebarMenuItem className="mb-1">
            <SidebarMenuButton asChild isActive={location.pathname === "/app/clients"} tooltip="Client Compass" size="lg" className="px-3 font-medium text-sm">
              <Link to="/app/clients" className={cn("flex items-center", state === "collapsed" ? "justify-center w-full -ml-1.5" : "gap-3")}>
                <div className="text-muted-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <span>Client Compass</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Product Icon - Show in collapsed sidebar when there's an active company */}
        {!isReviewerGroupMember && (activeCompany || currentProductId || effectiveActiveCompany) && state === "collapsed" && (
          <SidebarMenuItem className="mb-1">
            <SidebarMenuButton
              asChild
              tooltip="Products"
              size="lg"
              className="px-0 justify-center"
            >
              <Link
                to={effectiveActiveCompany ? `/app/company/${encodeURIComponent(effectiveActiveCompany)}/portfolio` : '#'}
                className="flex items-center justify-center w-full"
              >
                <div className="text-muted-foreground">
                  <Package className="h-5 w-5" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Single Company Header - Show company name directly in single company mode */}
        {isSingleCompanyMode && singleCompanyName && (
          <SidebarMenuItem className="mb-1">
            <div className="px-3 py-2.5 text-sm font-medium text-company-brand">
              {singleCompanyName}
            </div>
          </SidebarMenuItem>
        )}


        {/* Products Menu - Show when active company or product is selected and sidebar is not collapsed */}
        {!isReviewerGroupMember && (activeCompany || currentProductId || effectiveActiveCompany) && state !== "collapsed" && <SidebarMenuItem className="mb-1">
          <SidebarProductMenu productsForMenu={productsForMenu} currentProduct={null} currentProductId={currentProductId} isLoading={isLoadingProducts} expandedMenus={expandedMenus} onToggleMenu={toggleMenuExpansion} onCollapseMenu={collapseMenu} isProductActive={isProductActive} refreshProducts={refreshProducts} companyId={targetCompanyId} companyName={effectiveActiveCompany} />
        </SidebarMenuItem>}

        {/* Reviewer Products Menu - Show only for reviewer group members */}
        {isReviewerGroupMember && state !== "collapsed" && (
          <SidebarMenuItem className="mb-1">
            <SidebarReviewerProductMenu
              currentProductId={currentProductId}
              expandedMenus={expandedMenus}
              onToggleMenu={toggleMenuExpansion}
              onCollapseMenu={collapseMenu}
              isProductActive={isProductActive}
              targetCompanyId={targetCompanyId}
            />
          </SidebarMenuItem>
        )}

        {/* Contextual Menu Items */}
        <SidebarContextualMenu userRole={effectiveRole || userRole || "viewer"} currentProductId={currentProductId} currentCompany={effectiveCurrentCompany} productOwnerCompany={productOwnerCompany} location={location} onCollapseMenu={collapseMenu} singleCompanyName={singleCompanyName} companies={filteredCompanies.map(c => ({ id: c.id, name: c.name, status: c.status || 'On Track' }))} />
      </SidebarMenu>

      {/* L1 Footer Items - Genesis & Help */}
      <SidebarMenu className="mt-auto px-2 pb-2">
        {/* XyReg Genesis - Show when product is selected */}
        {currentProductId && (
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.search.includes('tab=genesis')}
              tooltip="XyReg Genesis"
              size="lg"
              className={cn("font-medium text-sm", state === "collapsed" ? "px-0 justify-center" : "px-3")}
            >
              <Link
                to={`/app/product/${currentProductId}/business-case?tab=genesis`}
                className={cn("flex items-center", state === "collapsed" ? "justify-center w-full" : "gap-3")}
              >
                <Crosshair className="h-5 w-5 text-amber-500" />
                {state !== "collapsed" && <span>XyReg Genesis</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Help - Always visible */}
        <SidebarMenuItem>
          <HelpButton state={state} collapsed={state === "collapsed"} />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>

    <SidebarFooter>
      {user && <div className="px-4 py-2 space-y-2 border-t border-border/30">
        {/* Selected Company Name - Show below Archives when company is selected */}
        {!(location.pathname.startsWith('/app/clients') || location.pathname.startsWith('/app/profile')) && (
          <>
            {effectiveActiveCompany && (
              <div className={cn(
                "px-3 py-2 text-xl font-semibold text-company-brand bg-muted/50 rounded-md",
                state === "collapsed" && "px-2 py-1 flex items-center justify-center"
              )}>
                {state === "collapsed" ? (
                  <div
                    className="transform -rotate-90 origin-center whitespace-nowrap absolute bottom-40 -ml-2.5"
                    style={{
                      fontSize: effectiveActiveCompany && effectiveActiveCompany.length > 20
                        ? '0.75rem'
                        : effectiveActiveCompany && effectiveActiveCompany.length > 15
                          ? '0.9rem'
                          : '1.25rem'
                    }}
                  >
                    {effectiveActiveCompany}
                  </div>
                ) : (
                  effectiveActiveCompany
                )}
              </div>
            )}

            {isAdmin && effectiveActiveCompany && (
              <>
                <Button asChild variant="ghost" className={cn(
                  "w-full gap-2 text-sm",
                  state === "collapsed" ? "justify-start pl-2 py-2" : "justify-start"
                )}>
                  <Link to={buildCompanySettingsUrl(effectiveActiveCompany)} className={cn("flex items-center", state === "collapsed" ? "justify-center w-full -ml-1.5" : "gap-2")}>
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    {state !== "collapsed" && <span>Settings</span>}
                  </Link>
                </Button>
                <Button asChild variant="ghost" className={cn(
                  "w-full gap-2 text-sm",
                  state === "collapsed" ? "justify-start pl-2 py-2" : "justify-start"
                )}>
                  <Link to={`/app/company/${encodeURIComponent(effectiveActiveCompany)}/audit-log`} className={cn("flex items-center", state === "collapsed" ? "justify-center w-full -ml-1.5" : "gap-2")}>
                    <ScrollText className="h-5 w-5 flex-shrink-0" />
                    {state !== "collapsed" && <span>Audit Log</span>}
                  </Link>
                </Button>
              </>
            )}
          </>
        )}
      </div>}
    </SidebarFooter>
  </Sidebar>;
}