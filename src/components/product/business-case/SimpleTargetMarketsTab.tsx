import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Building2, Package, Layers, Grid3x3, User } from 'lucide-react';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';
import { CollapsibleMarketEntry } from '@/components/product/device/CollapsibleMarketEntry';
import { marketData } from '@/utils/marketRiskClassMapping';

interface SimpleTargetMarketsTabProps {
  markets: EnhancedProductMarket[];
  onMarketsChange: (markets: EnhancedProductMarket[]) => void;
  isLoading?: boolean;
  inheritanceInfo?: {
    source: 'individual' | 'model' | 'platform' | 'category' | 'company';
    path: string[];
  };
  hasEudamedData?: boolean;
}


export function SimpleTargetMarketsTab({ markets = [], onMarketsChange, isLoading = false, inheritanceInfo, hasEudamedData = false }: SimpleTargetMarketsTabProps) {
  // Process and initialize market data similar to EnhancedMarketsSection
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
    return allMarkets.map(m => {
        const existing = existingMarketsMap.get(m.code);
        
        if (existing) {
            return { ...m, ...existing };
        }
        return m;
    });
  }, [markets, hasEudamedData]);

  // Handle market changes from CollapsibleMarketEntry
  const handleMarketChange = useCallback((updatedMarket: EnhancedProductMarket) => {
    const updatedMarkets = currentMarkets.map(market => 
      market.code === updatedMarket.code ? updatedMarket : market
    );
    onMarketsChange(updatedMarkets);
  }, [currentMarkets, onMarketsChange]);

  // Calculate completion percentage - 100% if any markets selected, 0% if none
  const selectedCount = currentMarkets.filter(market => market.selected).length;
  const completionPercentage = selectedCount > 0 ? 100 : 0;

  // Get inheritance display info
  const getInheritanceIcon = (source: string) => {
    switch (source) {
      case 'company': return <Building2 className="h-3 w-3" />;
      case 'category': return <Grid3x3 className="h-3 w-3" />;
      case 'platform': return <Layers className="h-3 w-3" />;
      case 'model': return <Package className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getInheritanceLabel = (source: string) => {
    switch (source) {
      case 'company': return 'Company Default';
      case 'category': return 'Category Default';
      case 'platform': return 'Platform Default';
      case 'model': return 'Model Default';
      default: return 'Individual';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Target Markets
          <div className="text-sm font-normal text-muted-foreground">
            {selectedCount} of {currentMarkets.length} selected
          </div>
        </CardTitle>
        <CardDescription>
          Select target markets and configure market-specific requirements, agent information, and regulatory details.
        </CardDescription>
        
        {/* Inheritance Info */}
        {inheritanceInfo && inheritanceInfo.source !== 'individual' && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            {getInheritanceIcon(inheritanceInfo.source)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {getInheritanceLabel(inheritanceInfo.source)}
                </Badge>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Markets inherited from {inheritanceInfo.source} level
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                💡 You can override these markets by making individual selections below
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Markets List - Using full CollapsibleMarketEntry components */}
        <div className="space-y-3">
          {currentMarkets.map((market) => (
            <CollapsibleMarketEntry
              key={market.code}
              market={market}
              onMarketChange={handleMarketChange}
              isLoading={isLoading}
              hasEudamedData={hasEudamedData && market.code === 'EU'}
            />
          ))}
        </div>

        {/* Selected Markets Summary */}
        {selectedCount > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">Selected Markets Summary</h4>
            <div className="flex flex-wrap gap-2">
              {currentMarkets
                .filter(market => market.selected)
                .map(market => (
                  <div key={market.code} className="inline-flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-sm">
                    <span>{market.name}</span>
                    {market.launchDate && (
                      <span className="text-xs text-muted-foreground">
                        (Launch: {new Date(market.launchDate).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}