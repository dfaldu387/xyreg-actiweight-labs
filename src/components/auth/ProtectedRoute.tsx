
import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { useDevMode } from "@/context/DevModeContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useEffectiveUserRole } from "@/hooks/useEffectiveUserRole";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { useIsInvestor } from "@/hooks/useIsInvestor";
import { PasswordExpirationGate } from "./PasswordExpirationGate";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
  requireCompanyAccess?: boolean;
}

export function ProtectedRoute({ 
  allowedRoles, 
  redirectPath = "/landing",
  requireCompanyAccess = false
}: ProtectedRouteProps) {
  
  const { isDevMode } = useDevMode();
  const { user, userRole, isLoading: authLoading } = useAuth();
  const { companyRoles, activeCompanyRole } = useCompanyRole();
  const { effectiveRole, isAdmin, isLoading: roleLoading } = useEffectiveUserRole();
  const { isInvestor, isLoading: investorLoading } = useIsInvestor();
  const location = useLocation();

  // While checking authentication or role, show loading spinner
  if (authLoading || roleLoading || investorLoading) {
    return <FullPageLoader />;
  }


  // In DevMode, bypass authentication checks
  if (isDevMode) {
    return <Outlet />;
  }

  // Check if user has super_admin role in metadata (for bypass checks below)
  const isSuperAdminEarly = user?.user_metadata?.role === 'super_admin';

  // If user is not authenticated, redirect to landing page with the current location
  // so we can redirect back after login
  if (!user) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  // Check if user has super_admin role in metadata (highest priority)
  const isSuperAdmin = user.user_metadata?.role === 'super_admin';
  
  // If this is a super admin route and user is super admin, grant access immediately
  if (allowedRoles && allowedRoles.includes('super_admin') && isSuperAdmin) {
    return <Outlet />;
  }

  // If this is NOT a super admin route but user is super admin, grant access to everything
  if (isSuperAdmin) {
    return <Outlet />;
  }

  // CRITICAL FIX: Extract URL company to use as fallback instead of companyRoles[0]
  // This prevents redirecting to wrong company during loading states
  const urlCompanyMatch = location.pathname.match(/\/app\/company\/([^\/]+)/);
  const urlCompanyName = urlCompanyMatch ? decodeURIComponent(urlCompanyMatch[1]) : null;
  const urlCompanyRole = urlCompanyName
    ? companyRoles.find(r => r.companyName.toLowerCase() === urlCompanyName.toLowerCase())
    : null;

  // Helper function to get the best company to redirect to
  // Priority: URL company (if user has access) > activeCompanyRole > first company
  const getBestCompanyRedirect = () => {
    if (urlCompanyRole) {
      return `/app/company/${encodeURIComponent(urlCompanyRole.companyName)}`;
    }
    if (activeCompanyRole) {
      return `/app/company/${encodeURIComponent(activeCompanyRole.companyName)}`;
    }
    if (companyRoles.length > 0) {
      return `/app/company/${encodeURIComponent(companyRoles[0].companyName)}`;
    }
    return "/app/access-denied";
  };

  // If roles are specified and user's effective role isn't included, redirect to appropriate dashboard
  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole)) {
    let accessDeniedPath = "/app";

    // Redirect based on their access level - non-admins go to their company dashboards
    if (isAdmin) {
      accessDeniedPath = "/app/clients";
    } else {
      accessDeniedPath = getBestCompanyRedirect();
    }

    return <Navigate to={accessDeniedPath} replace />;
  }

  // AUTHOR ROLE RESTRICTION: Authors can only access review-panel and profile
  const isAuthorRole = activeCompanyRole?.role === 'author' ||
    (companyRoles.length > 0 && companyRoles.every(r => r.role === 'author'));

  if (isAuthorRole && !isSuperAdmin) {
    const currentPath = location.pathname;
    const isReviewPanelRoute = currentPath.includes('/review-panel') ||
                               currentPath === '/app/review-panel' ||
                               currentPath.startsWith('/app/review-panel/');

    // Allow authors to access their profile page
    const isProfileRoute = currentPath === '/app/profile' ||
                           currentPath.startsWith('/app/profile/');

    // If author is trying to access any route other than review-panel or profile, redirect them
    if (!isReviewPanelRoute && !isProfileRoute) {
      return <Navigate to="/app/review-panel" replace />;
    }
  }

  // Company access restriction for non-admin users ONLY
  if (requireCompanyAccess && !isAdmin && !isSuperAdmin) {
    // Check if user has any company access
    if (companyRoles.length === 0) {
      // If user is an investor, redirect to investor dashboard instead of access-denied
      if (isInvestor) {
        return <Navigate to="/investor/dashboard" replace />;
      }
      // Instead of redirecting to access-denied, redirect to clients page
      // This allows users to see available companies or request access
      return <Navigate to="/app/clients" replace />;
    }

    // Check if the current route requires company context
    const currentPath = location.pathname;
    const isCompanyRoute = currentPath.includes('/app/company/');
    const isProductRoute = currentPath.includes('/app/product/');
    const isMissionControlRoute = currentPath === '/app/mission-control';
    const isClientsRoute = currentPath === '/app/clients';
    const isArchivesRoute = currentPath === '/app/archives';
    
    // Block access to admin-only routes for non-admin users
    if (isMissionControlRoute || isClientsRoute || isArchivesRoute) {
      // FIXED: Use getBestCompanyRedirect() instead of companyRoles[0]
      const redirectPath = getBestCompanyRedirect();
      if (redirectPath !== "/app/access-denied") {
        return <Navigate to={redirectPath} replace />;
      }
      // If no company access, redirect to clients page
      return <Navigate to="/app/clients" replace />;
    }
    
    if (isCompanyRoute || isProductRoute) {
      // Extract company name from route
      let routeCompanyName: string | null = null;
      
      if (isCompanyRoute) {
        const match = currentPath.match(/\/app\/company\/([^\/]+)/);
        routeCompanyName = match ? decodeURIComponent(match[1]) : null;
      } else if (isProductRoute) {
        // For product routes, we need to check if the product belongs to an accessible company
        // This would require additional logic to fetch product company info
        // For now, we'll allow access if user has any company access
      }

      // If we can determine the company from the route, check access
      if (routeCompanyName) {
        const hasAccessToCompany = companyRoles.some(role =>
          role.companyName.toLowerCase() === routeCompanyName!.toLowerCase()
        );

        if (!hasAccessToCompany) {
          // FIXED: Use getBestCompanyRedirect() instead of companyRoles[0]
          // Note: For unauthorized company access, we should redirect to their first accessible company
          // but use activeCompanyRole if available
          const redirectPath = activeCompanyRole
            ? `/app/company/${encodeURIComponent(activeCompanyRole.companyName)}`
            : companyRoles.length > 0
              ? `/app/company/${encodeURIComponent(companyRoles[0].companyName)}`
              : "/app/clients";
          return <Navigate to={redirectPath} replace />;
        }
      }
    }
  }

  // console.log(`Access granted: User with effective role '${effectiveRole}' allowed to access route`);
  // User is authenticated and authorized (or no specific roles required)
  // DevMode and super_admin bypass password expiration gate
  if (isDevMode || isSuperAdminEarly) {
    return <Outlet />;
  }

  return (
    <PasswordExpirationGate>
      <Outlet />
    </PasswordExpirationGate>
  );
}
