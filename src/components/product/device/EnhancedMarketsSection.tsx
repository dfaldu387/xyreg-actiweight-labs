import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Lock } from 'lucide-react';
import { marketData } from "@/utils/marketRiskClassMapping";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { CollapsibleMarketEntry } from "./CollapsibleMarketEntry";
import { getLaunchStatusSummary } from "@/utils/launchStatusUtils";
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from '@/hooks/useTranslation';

interface EnhancedMarketsSectionProps {
  markets: EnhancedProductMarket[];
  onMarketsChange: (markets: EnhancedProductMarket[]) => void;
  isLoading?: boolean;
  companyId?: string;
  hasEudamedData?: boolean;
  disabled?: boolean;
}

export function EnhancedMarketsSection({
  markets = [],
  onMarketsChange,
  isLoading = false,
  companyId,
  hasEudamedData = false,
  disabled = false
}: EnhancedMarketsSectionProps) {
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share';

  // Auto-expand markets when navigating from economic buyer step
  const sectionFromUrl = searchParams.get('section');
  const autoExpandMarkets = sectionFromUrl === 'economic-buyer';
  
  // Get feature limit for target markets from plan
  // Get feature limit for target markets from plan
  const { getFeatureLimit, planName, isLoading: isPlanLoading } = usePlanMenuAccess();
  const marketLimit = getFeatureLimit(DEVICES_MENU_ACCESS.DEVICE_DEFINITION_MARKETS);

  // Only consider limit valid if it's a positive number and plan is loaded
  const hasValidLimit = !isPlanLoading && marketLimit !== null && marketLimit > 0;
  
  // When completely disabled, block all interactions
  const isCompletelyDisabled = disabled;

  const currentMarkets: EnhancedProductMarket[] = useMemo(() => {
    const allMarkets = marketData.map(m => ({ ...m, selected: false, name: m.name } as EnhancedProductMarket));

    if (!markets || markets.length === 0) {
      return allMarkets;
    }

    // Handle old format where markets is an array of strings
    if (typeof markets[0] === 'string') {
      const selectedCodes = new Set(markets as unknown as string[]);
      return allMarkets.map(m => ({ ...m, selected: selectedCodes.has(m.code) }));
    }

    // Handle new object format and merge with all possible markets
    const existingMarketsMap = new Map(markets.map(m => [m.code, m]));
    const result = allMarkets.map(m => {
        const existing = existingMarketsMap.get(m.code);

        if (existing) {
            return { ...m, ...existing };
        }
        return m;
    });

    return result;
  }, [markets, hasEudamedData]);

  const handleMarketChange = (updatedMarket: EnhancedProductMarket) => {
    // Block all market changes when completely disabled
    if (isCompletelyDisabled) return;
    
    console.log('[EnhancedMarketsSection] handleMarketChange called:', {
      marketCode: updatedMarket.code,
      budgetType: updatedMarket.budgetType,
      buyerType: updatedMarket.buyerType,
    });
    
    const updatedMarkets = currentMarkets.map(market => 
      market.code === updatedMarket.code ? updatedMarket : market
    );
    
    console.log('[EnhancedMarketsSection] Calling onMarketsChange with:', 
      updatedMarkets.find(m => m.code === updatedMarket.code)
    );
    
    onMarketsChange(updatedMarkets);
  };

  const launchSummary = useMemo(() => {
    return getLaunchStatusSummary(currentMarkets);
  }, [currentMarkets]);

  // Calculate how many markets are currently selected
  const selectedCount = useMemo(() => {
    return currentMarkets.filter(m => m.selected).length;
  }, [currentMarkets]);

  // Check if limit has been reached (only when we have a valid limit)
  const isLimitReached = hasValidLimit && selectedCount >= marketLimit!;

  // Check if at least one market is selected (for completion status)
  const hasSelectedMarkets = selectedCount > 0;

  // Find the first selected market
  const firstSelectedMarket = useMemo(() => {
    return currentMarkets.find(m => m.selected);
  }, [currentMarkets]);

  return (
    <Card className={isInGenesisFlow ? `transition-colors ${hasSelectedMarkets ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>{lang('risk.markets.title')}</CardTitle>
            <InvestorVisibleBadge />
          </div>
          <div className="flex items-center space-x-2">
            {/* Show limit badge only when we have a valid limit */}
            {hasValidLimit && (
              <Badge
                variant={isLimitReached ? "destructive" : "outline"}
                className={isLimitReached ? "bg-orange-500 hover:bg-orange-600" : ""}
              >
                <Lock className="h-3 w-3 mr-1" />
                {selectedCount}/{marketLimit} {lang('risk.markets.selected')}
              </Badge>
            )}
            {launchSummary.launchedMarkets > 0 && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {launchSummary.launchedMarkets} {lang('risk.markets.launched')}
              </Badge>
            )}
            {launchSummary.plannedMarkets > 0 && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {launchSummary.plannedMarkets} {lang('risk.markets.planned')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={`space-y-4 ${isCompletelyDisabled ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* Show limit warning when limit is reached */}
        {isLimitReached && marketLimit && !isCompletelyDisabled && (
          <Alert className="border-orange-200 bg-orange-50">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {lang('risk.markets.limitReached').replace('{limit}', String(marketLimit)).replace('{plan}', planName || 'current')}
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-3">
          {currentMarkets.map((market) => {
            const isFirstSelectedMarket = firstSelectedMarket?.code === market.code;
            return (
              <CollapsibleMarketEntry
                key={market.code}
                market={market}
                onMarketChange={handleMarketChange}
                isLoading={isLoading}
                companyId={companyId}
                hasEudamedData={hasEudamedData && market.code === 'EU'}
                disabledByLimit={isLimitReached && !market.selected}
                disabled={isCompletelyDisabled}
                autoExpand={autoExpandMarkets}
                isFirstSelectedMarket={isFirstSelectedMarket}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
