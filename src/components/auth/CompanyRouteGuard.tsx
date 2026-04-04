import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { FullPageLoader } from "@/components/ui/loading-spinner";

interface CompanyRouteGuardProps {
  children?: React.ReactNode;
  requireCompanyAccess?: boolean;
  redirectTo?: string;
}

export function CompanyRouteGuard({ 
  children, 
  requireCompanyAccess = true,
  redirectTo = "/app/access-denied"
}: CompanyRouteGuardProps) {
  const { user, userRole, isLoading } = useAuth();
  const { companyRoles, activeCompanyRole } = useCompanyRole();

  // Show loading while checking permissions
  if (isLoading) {
    return <FullPageLoader />;
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Admin users can access everything
  if (hasAdminPrivileges(userRole)) {
    return children ? <>{children}</> : <Outlet />;
  }

  // If company access is required, check if user has any company access
  if (requireCompanyAccess) {
    if (companyRoles.length === 0) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // User has company access, allow access
  return children ? <>{children}</> : <Outlet />;
}

// Specialized guard for company-specific routes
export function CompanySpecificRouteGuard({ 
  children, 
  companyName 
}: { 
  children: React.ReactNode; 
  companyName: string; 
}) {
  const { user, userRole, isLoading } = useAuth();
  const { companyRoles } = useCompanyRole();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Admin users can access everything
  if (hasAdminPrivileges(userRole)) {
    return <>{children}</>;
  }

  // Check if user has access to the specific company
  const hasAccessToCompany = companyRoles.some(role => 
    role.companyName.toLowerCase() === companyName.toLowerCase()
  );

  if (!hasAccessToCompany) {
    return <Navigate to="/app/access-denied" replace />;
  }

  return <>{children}</>;
}

// Guard for admin-only routes
export function AdminRouteGuard({ 
  children, 
  redirectTo = "/app/access-denied" 
}: { 
  children: React.ReactNode; 
  redirectTo?: string; 
}) {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!hasAdminPrivileges(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
