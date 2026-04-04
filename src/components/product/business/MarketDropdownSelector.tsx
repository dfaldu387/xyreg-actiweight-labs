import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Globe, Check, PieChart } from 'lucide-react';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';

interface MarketDropdownSelectorProps {
  markets: EnhancedProductMarket[];
  selectedMarketCode: string;
  onSelectMarket: (marketCode: string) => void;
  marketInputs: Record<string, any>;
  marketResults: Record<string, any>;
}

export function MarketDropdownSelector({ 
  markets, 
  selectedMarketCode, 
  onSelectMarket,
  marketInputs,
  marketResults
}: MarketDropdownSelectorProps) {
  const selectedMarket = markets.find(m => m.code === selectedMarketCode);
  const isPortfolioView = selectedMarketCode === 'portfolio-summary';

  const isMarketComplete = (marketCode: string) => {
    const inputs = marketInputs[marketCode];
    const result = marketResults[marketCode];
    return inputs && result && 
           inputs.monthlySalesForecast > 0 && 
           inputs.initialUnitPrice > 0 &&
           result.totalRevenue > 0;
  };

  return (
    <div className="flex items-center gap-3 w-full max-w-md">
      <label className="text-sm font-medium whitespace-nowrap">Select Market:</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-background max-w-sm">
            <div className="flex items-center gap-2">
              {isPortfolioView ? (
                <>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Portfolio Summary</span>
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedMarket?.name || selectedMarket?.code || 'Select a market...'}
                  </span>
                  {selectedMarket && isMarketComplete(selectedMarket.code) && (
                    <Badge variant="default" className="text-xs">
                      Complete
                    </Badge>
                  )}
                </>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[400px] bg-background z-50">
          {/* Portfolio Summary Option */}
          <DropdownMenuItem
            onClick={() => onSelectMarket('portfolio-summary')}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Portfolio Summary</span>
                  {isPortfolioView && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  View aggregated results across all markets
                </div>
              </div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Individual Markets */}
          {markets.map((market) => {
            const isSelected = market.code === selectedMarketCode;
            const isComplete = isMarketComplete(market.code);
            
            return (
              <DropdownMenuItem
                key={market.code}
                onClick={() => onSelectMarket(market.code)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{market.name || market.code}</span>
                      {isComplete && (
                        <Badge variant="default" className="text-xs">
                          Complete
                        </Badge>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {market.code}
                      {market.riskClass && ` • Class ${market.riskClass}`}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
