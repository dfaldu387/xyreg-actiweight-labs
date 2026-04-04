import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';
import { getLaunchedMarkets, getLaunchStatusSummary } from '@/utils/launchStatusUtils';
import { format } from 'date-fns';

interface MarketLaunchStatusCardProps {
  markets: EnhancedProductMarket[];
  productId: string;
}

export function MarketLaunchStatusCard({ markets, productId }: MarketLaunchStatusCardProps) {
  const navigate = useNavigate();
  const launchedMarkets = getLaunchedMarkets(markets);
  const summary = getLaunchStatusSummary(markets);
  const plannedMarkets = markets.filter(
    m => m.selected && !launchedMarkets.find(lm => lm.code === m.code)
  );

  const handleNavigateToTargetMarkets = () => {
    navigate(`/app/product/${productId}/device-information`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Market Launch Status</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleNavigateToTargetMarkets}
          className="gap-2"
        >
          Go to Target Markets
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Launched Markets */}
        {launchedMarkets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <h4 className="font-medium text-sm">
                Launched in {summary.launchedMarkets} Market{summary.launchedMarkets !== 1 ? 's' : ''}
              </h4>
            </div>
            <div className="space-y-2 ml-6">
              {launchedMarkets.map((market) => (
                <div 
                  key={market.code}
                  className="flex items-start justify-between p-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {market.code}
                      </span>
                      {market.regulatoryStatus && (
                        <Badge variant="secondary" className="text-xs">
                          {market.regulatoryStatus.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {market.name}
                    </p>
                  </div>
                  {(market.actualLaunchDate || market.launchDate) && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(
                        new Date(market.actualLaunchDate || market.launchDate), 
                        'MMM dd, yyyy'
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planned Markets */}
        {plannedMarkets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <h4 className="font-medium text-sm">
                Planned for {summary.plannedMarkets} Market{summary.plannedMarkets !== 1 ? 's' : ''}
              </h4>
            </div>
            <div className="space-y-2 ml-6">
              {plannedMarkets.map((market) => (
                <div 
                  key={market.code}
                  className="flex items-start justify-between p-2 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {market.code}
                      </span>
                      {market.regulatoryStatus && (
                        <Badge variant="outline" className="text-xs">
                          {market.regulatoryStatus.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {market.name}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Planning
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Markets Selected */}
        {summary.totalMarkets === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No markets selected. Configure markets in Target Markets tab.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
