import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getActiveWarnings, MarketCode } from './marketConfigurations';
import { UserProfile } from './UserProfilePanel';
import { EconomicBuyerData } from './EconomicBuyerPanel';

interface MarketWarningsProps {
  market: MarketCode | '';
  userProfile: UserProfile;
  economicBuyer: EconomicBuyerData;
}

export function MarketWarnings({ market, userProfile, economicBuyer }: MarketWarningsProps) {
  if (!market) return null;

  const combinedData = {
    ...economicBuyer,
    user_profile: userProfile,
  };

  const warnings = getActiveWarnings(market, combinedData);

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning, index) => (
        <Alert 
          key={index} 
          variant={warning.type === 'error' ? 'destructive' : 'default'}
          className={warning.type === 'error' 
            ? 'border-destructive/50 bg-destructive/10' 
            : 'border-amber-500/50 bg-amber-500/10'
          }
        >
          {warning.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <AlertDescription className={warning.type === 'error' ? 'text-destructive' : 'text-amber-700 dark:text-amber-400'}>
            {warning.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
