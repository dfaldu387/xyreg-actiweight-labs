import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useSubscription } from '@/hooks/useSubscription';
import { useCompanyRole } from '@/context/CompanyRoleContext';

export function ExpirationWarningBanner() {
  const { subscriptionStatus, isLoading } = useFeatureAccess();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  if (isLoading || !subscriptionStatus) {
    return null;
  }

  // Show warning if subscription will expire in 5 days or less
  const shouldShowWarning = subscriptionStatus.canAccess &&
    subscriptionStatus.trialDaysLeft > 0 &&
    subscriptionStatus.trialDaysLeft <= 5;

  if (!shouldShowWarning) {
    return null;
  }

  const expirationDate = subscription?.subscription_end
    ? format(new Date(subscription.subscription_end), 'PPP')
    : 'soon';

  return (
    <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950 mb-4 mt-4">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-start  gap-2">
            <div>
              <Calendar className="h-4 w-4 mt-2" />
            </div>
            <div>
              <p className="font-semibold">Subscription Expiring Soon</p>
              <p className="text-sm">
                Your subscription will expire on {expirationDate} ({subscriptionStatus.trialDaysLeft} {subscriptionStatus.trialDaysLeft === 1 ? 'day' : 'days'} remaining)
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/app/company/${activeCompanyRole?.companyName}/pricing`)}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            Renew Now
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
