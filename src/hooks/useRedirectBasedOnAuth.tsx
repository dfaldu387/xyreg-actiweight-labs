import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffectiveUserRole } from '@/hooks/useEffectiveUserRole';

export function useRedirectBasedOnAuth() {
  const { user, userRole } = useAuth();
  const { effectiveRole, isAdmin, isLoading: roleLoading } = useEffectiveUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't run redirect logic while role is still loading
    if (roleLoading) {
      console.log('useRedirectBasedOnAuth: Role still loading, waiting...');
      return;
    }

    const currentPath = location.pathname;

    // Redirect logic based on user role and authentication status
    if (!user) {
      // If not logged in, redirect to the landing page unless already there
      if (currentPath !== "/") {
        console.log("Not authenticated, redirecting to landing page");
        navigate("/");
      }
      return; // Prevent further checks
    }

    // If logged in but trying to access the landing page, redirect to the default app page
    if (currentPath === "/") {
      // Business users should go directly to their company dashboard if they have one
      if (effectiveRole === "admin" || user?.user_metadata?.role === "business") {
        console.log("Business user authenticated, redirecting to company dashboard");
        navigate("/app/documents");
      } else {
        console.log("Authenticated user trying to access landing page, redirecting to /app/documents");
        navigate("/app/documents");
      }
      return;
    }

    // Check for admin-only pages using effective role
    if ((currentPath.startsWith("/app/clients") || currentPath === "/app/mission-control" || currentPath === "/app/archives") && !isAdmin) {
      console.log("Non-admin user trying to access admin-only page, redirecting to company dashboard");
      // Redirect to company dashboard instead of documents
      if (currentPath !== "/app/documents") {
        navigate("/app/documents");
      }
      return;
    }

    // Check for communication page access
    if (currentPath === "/app/expert-matching") {
      console.log("Communication page accessed");
      // Allow access for now as it's coming soon
      return;
    }

    // If the user is logged in and has a role, allow access to /app routes
    if (currentPath.startsWith("/app") && user && (effectiveRole || userRole)) {
      return; // Allow access
    }

    // Fallback: Redirect to landing page if none of the conditions are met
    console.log("No specific condition met, redirecting to landing page");
    navigate("/");

  }, [user, userRole, effectiveRole, isAdmin, roleLoading, navigate, location.pathname]);
}
