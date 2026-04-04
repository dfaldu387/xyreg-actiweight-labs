import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';

export function TrialBanner() {
  const { subscriptionStatus, isLoading } = useFeatureAccess();
  const navigate = useNavigate();

  if (isLoading || !subscriptionStatus?.isTrialing) {
    return null;
  }

  const daysLeft = subscriptionStatus.trialDaysLeft;
  const isEndingSoon = daysLeft <= 7;

  return (
    <Alert className={`${isEndingSoon ? 'border-amber-500 bg-amber-50' : 'border-blue-500 bg-blue-50'} mb-6`}>
      {isEndingSoon ? (
        <Clock className="h-4 w-4 text-amber-600" />
      ) : (
        <Sparkles className="h-4 w-4 text-blue-600" />
      )}
      <AlertDescription className={isEndingSoon ? 'text-amber-800' : 'text-blue-800'}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">
              {isEndingSoon ? 'Trial Ending Soon!' : 'Free Trial Active'}
            </p>
            <p className="text-sm mt-1">
              {daysLeft === 0 
                ? 'Your trial ends today' 
                : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial`}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/app/billing')}
            size="sm"
            className={isEndingSoon 
              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'}
          >
            View Plans
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
