import { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyRole } from '@/context/CompanyRoleContext';

interface SubscriptionGuardProps {
  children: ReactNode;
  requiredFeature?: string;
  fallback?: ReactNode;
}

export function SubscriptionGuard({ children, requiredFeature, fallback }: SubscriptionGuardProps) {
  const { subscriptionStatus, isLoading, canAccessFeature, isGracePeriod, gracePeriodDaysLeft } = useFeatureAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompanyRole } = useCompanyRole();

  // Always allow access to pricing routes so users can renew
  const isPricingRoute = location.pathname.includes('/pricing');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Grace period warning - show for new users who haven't purchased
  if (isGracePeriod && !isPricingRoute) {
    return (
      <>
        <Alert className="border-primary/20 bg-primary/5">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary">Free Trial Period</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You have {gracePeriodDaysLeft} days left to explore the platform. Subscribe to a plan to continue using all features.
                </p>
              </div>
              <Button
                onClick={() => navigate(`/app/company/${activeCompanyRole?.companyName}/pricing`)}
                variant="default"
              >
                View Plans
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  // Subscription expired - block all access EXCEPT pricing route
  if (subscriptionStatus?.isExpired && !isPricingRoute) {
    return (
      <Alert className="border-destructive bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-destructive">Subscription Expired</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your subscription has ended. Renew your plan to continue using the platform.
              </p>
            </div>
            <Button
              onClick={() => navigate(`/app/company/${activeCompanyRole?.companyName}/pricing`)}
              variant="destructive"
            >
              Renew Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Allow access for active subscriptions (warning banner is shown in ExpirationWarningBanner)

  // Feature access check
  if (requiredFeature && !canAccessFeature(requiredFeature)) {
    if (fallback) return <>{fallback}</>;

    return (
      <Alert className="border-primary/20 bg-primary/5">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Feature Not Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                This feature is not available in your current plan. Upgrade to access it.
              </p>
            </div>
            <Button
              onClick={() => navigate(`/app/company/${activeCompanyRole?.companyName}/pricing`)}
              size="sm"
            >
              Upgrade Plan
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
