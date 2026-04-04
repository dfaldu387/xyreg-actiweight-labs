
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDevMode } from "@/context/DevModeContext";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useEffectiveUserRole } from "@/hooks/useEffectiveUserRole";
import { EmptyDashboardState } from "@/components/dashboard/EmptyDashboardState";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { ExpirationWarningBanner } from "@/components/subscription/ExpirationWarningBanner";
import { useIsInvestor } from "@/hooks/useIsInvestor";

export default function Index() {
  const navigate = useNavigate();
  const { isDevMode, primaryCompany } = useDevMode();
  const { user, isLoading: authLoading } = useAuth();
  const { companyRoles, isLoading: rolesLoading, activeCompanyRole } = useCompanyRole();
  const { isAdmin, isLoading: roleLoading } = useEffectiveUserRole();
  const { isExpired, isLoading: subscriptionLoading } = useFeatureAccess();
  const { isInvestor, isLoading: investorLoading } = useIsInvestor();
  
  useEffect(() => {
    // Wait for auth and roles to initialize
    if (authLoading || rolesLoading || roleLoading || subscriptionLoading || investorLoading) return;
    
    // Block access if subscription expired (unless admin)
    if (user && isExpired && !isAdmin) {
      return; // Don't navigate, show expired message in render
    }
    
    console.log("Index page navigation logic:", { 
      isDevMode, 
      primaryCompany: primaryCompany?.name, 
      user: user?.email,
      authLoading,
      rolesLoading,
      roleLoading,
      companyRolesCount: companyRoles.length,
      isAdmin,
      activeCompany: activeCompanyRole?.companyName
    });
    
    // If in DevMode with a primary company selected, redirect to that company's dashboard
    if (isDevMode && primaryCompany) {
      console.log("DevMode with primary company - redirecting to company dashboard");
      navigate(`/app/company/${encodeURIComponent(primaryCompany.name)}`);
      return;
    }
    
    // If authenticated user
    if (user) {
      // Admin users can access mission control
      if (isAdmin) {
        console.log("Admin user authenticated - redirecting to Mission Control");
        navigate('/app/mission-control');
        return;
      }
      
      // Check if user is an investor FIRST - they should go to investor dashboard
      // even if they also have company access
      if (isInvestor) {
        console.log("Investor user - redirecting to investor dashboard");
        navigate('/investor/dashboard');
        return;
      }
      
      // Check if user has a last selected company for direct redirect
      const lastSelectedCompany = (user.user_metadata as any)?.lastSelectedCompany;
      console.log("lastSelectedCompany",lastSelectedCompany)
      // Non-admin users with company access should go to their company dashboard
      if (companyRoles.length > 0) {
        // Temporarily disable auto-redirect to fix user switching issue
        // if (lastSelectedCompany) {
        //   const lastCompanyRole = companyRoles.find(role => 
        //     role.companyName.toLowerCase() === lastSelectedCompany.toLowerCase()
        //   );
        //   if (lastCompanyRole) {
        //     console.log("User has last selected company - redirecting to that company dashboard");
        //     navigate(`/app/company/${encodeURIComponent(lastCompanyRole.companyName)}`);
        //     return;
        //   }
        // }
        
        // Go to clients page to let user choose company
        if (activeCompanyRole) {
          console.log("Non-admin user with active company - redirecting to company dashboard");
          navigate(`/app/company/${encodeURIComponent(activeCompanyRole.companyName)}`);
        } else {
          console.log("Non-admin user with companies but no active - redirecting to first company");
          navigate(`/app/company/${encodeURIComponent(companyRoles[0].companyName)}`);
        }
        return;
      }
      
      // Non-admin users with no company access
      // Check if there's a lastSelectedCompany in metadata as a fallback (already declared above)
      if (lastSelectedCompany) {
        console.log("Non-admin user with no company roles but has lastSelectedCompany in metadata - redirecting to that company");
        navigate(`/app/company/${encodeURIComponent(lastSelectedCompany)}`);
        return;
      }
      
      // If still no access, check if user has any company association via email or other means
      // For now, redirect to clients page to let them see available companies or request access
      console.log("Non-admin user with no company access - redirecting to clients page");
      navigate('/app/clients');
      return;
    }
    
    // If not authenticated and not in DevMode, redirect to landing page
    console.log("No user and not in DevMode - redirecting to landing");
    navigate('/landing');
    
  }, [navigate, primaryCompany, isDevMode, user, authLoading, rolesLoading, roleLoading, companyRoles, activeCompanyRole, isAdmin, isExpired, subscriptionLoading, isInvestor, investorLoading]);

  // Show loading state while auth is initializing
  if (authLoading || rolesLoading || roleLoading || subscriptionLoading || investorLoading) {
    return (
      <div className="container mx-auto py-8 h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show appropriate state based on current context
  return (
    <div className="container mx-auto py-8 h-screen flex flex-col items-center justify-center">
      {user && isExpired && !isAdmin ? (
        <div className="max-w-md w-full">
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDescription>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-destructive">Subscription Expired</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your trial has ended. Please subscribe to a plan to continue using the platform.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/app/billing')}
                  variant="destructive"
                  className="w-full"
                >
                  View Plans
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      ) : isDevMode && !primaryCompany ? (
        <EmptyDashboardState />
      ) : (
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      )}
    </div>
  );
}
