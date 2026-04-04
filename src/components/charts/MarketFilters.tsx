import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, RotateCcw, Filter } from 'lucide-react';
import type { MarketFilters } from './VariantFilters';

interface MarketFiltersProps {
  filters: MarketFilters;
  availableMarkets: string[];
  onFiltersChange: (filters: MarketFilters) => void;
  className?: string;
}

const getMarketDisplayName = (marketCode: string) => {
  const marketMap: { [key: string]: string } = {
    'EU': '🇪🇺 European Union',
    'US': '🇺🇸 United States', 
    'USA': '🇺🇸 United States',
    'CA': '🇨🇦 Canada',
    'UK': '🇬🇧 United Kingdom',
    'JP': '🇯🇵 Japan',
    'CN': '🇨🇳 China',
    'AU': '🇦🇺 Australia',
    'BR': '🇧🇷 Brazil',
    'IN': '🇮🇳 India',
    'KR': '🇰🇷 South Korea',
    'MX': '🇲🇽 Mexico'
  };
  
  return marketMap[marketCode.toUpperCase()] || `🌍 ${marketCode.toUpperCase()}`;
};

export function MarketFilters({ filters, availableMarkets, onFiltersChange, className = '' }: MarketFiltersProps) {
  const toggleMarket = (marketCode: string) => {
    onFiltersChange({
      ...filters,
      [marketCode]: !filters[marketCode]
    });
  };

  const clearAll = () => {
    const clearedFilters: MarketFilters = {};
    availableMarkets.forEach(market => {
      clearedFilters[market] = false;
    });
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const activeMarketsCount = Object.values(filters).filter(Boolean).length;

  if (!availableMarkets.length) {
    return null;
  }

  return (
    <Card className={`shadow-lg border-0 bg-gradient-to-br from-background to-muted/20 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Target Markets</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {activeMarketsCount} selected
                </Badge>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all h-8 px-3"
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Clear All
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Filter products by target markets. Select markets to see products available in those regions.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3 max-h-48 overflow-y-auto">
        <div className="grid grid-cols-1 gap-1.5">
          {availableMarkets.map((marketCode) => {
            const isActive = filters[marketCode] || false;
            
            return (
              <Button
                key={marketCode}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMarket(marketCode)}
                className={`
                  text-xs font-medium transition-all duration-300 transform justify-start h-7
                  ${isActive 
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 shadow-md scale-105' 
                    : 'hover:bg-muted/70 hover:scale-102 hover:shadow-sm'
                  }
                `}
              >
                {getMarketDisplayName(marketCode)}
              </Button>
            );
          })}
        </div>
        
        {hasActiveFilters && (
          <div className="pt-3 mt-4 border-t">
            <div className="space-y-2">
              <h5 className="font-medium text-xs text-muted-foreground">Selected Markets:</h5>
              <div className="flex flex-wrap gap-1">
                {Object.entries(filters)
                  .filter(([_, isSelected]) => isSelected)
                  .map(([marketCode, _]) => (
                    <Badge
                      key={marketCode}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors h-5"
                      onClick={() => toggleMarket(marketCode)}
                    >
                      {getMarketDisplayName(marketCode)} ×
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}