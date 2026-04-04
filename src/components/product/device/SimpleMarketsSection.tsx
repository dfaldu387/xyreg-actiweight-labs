
import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { marketData } from "@/utils/marketRiskClassMapping";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";

interface SimpleMarketsSectionProps {
  markets: EnhancedProductMarket[];
  onMarketsChange: (markets: EnhancedProductMarket[]) => void;
  isLoading?: boolean;
}

// Market Entry Information with simplified bureaucracy steps only
const getMarketEntryInfo = (marketCode: string) => {
  const marketEntryData = {
    'EU': {
      flag: '🇪🇺',
      name: 'European Union (EU)',
      bureaucracy: [
        'Appoint EU Authorized Representative (if non-EU)',
        'Notify a Notified Body (Class IIa+ devices)',
        'Register in EUDAMED',
        'Prepare technical documentation'
      ]
    },
    'USA': {
      flag: '🇺🇸',
      name: 'United States (FDA)',
      bureaucracy: [
        'Appoint US Agent (if foreign)',
        'Submit IDE for trials (if needed)',
        'Register facility with FDA',
        'Submit premarket submission (510(k), PMA, etc.)'
      ]
    },
    'JP': {
      flag: '🇯🇵',
      name: 'Japan (PMDA)',
      bureaucracy: [
        'Appoint Marketing Authorization Holder (MAH)',
        'Local clinical trial often required',
        'J-GMP audit required',
        'Submit to PMDA for evaluation'
      ]
    },
    'CN': {
      flag: '🇨🇳',
      name: 'China (NMPA)',
      bureaucracy: [
        'Appoint China Legal Agent',
        'Translate all documentation into Chinese',
        'Local testing in China',
        'Submit dossier to NMPA'
      ]
    },
    'CA': {
      flag: '🇨🇦',
      name: 'Canada (Health Canada)',
      bureaucracy: [
        'Submit device license (Class II–IV)',
        'Appoint importer (if foreign)',
        'Must meet Canadian Medical Device Regulations (CMDR)'
      ]
    },
    'AU': {
      flag: '🇦🇺',
      name: 'Australia (TGA)',
      bureaucracy: [
        'Appoint Australian Sponsor',
        'Submit to TGA with CE/FDA evidence',
        'Complete ARTG registration'
      ]
    },
    'BR': {
      flag: '🇧🇷',
      name: 'Brazil (ANVISA)',
      bureaucracy: [
        'Appoint Brazilian Registration Holder (BRH)',
        'Translate and submit dossier to ANVISA',
        'GMP audit or certification'
      ]
    },
    'IN': {
      flag: '🇮🇳',
      name: 'India (CDSCO)',
      bureaucracy: [
        'Apply for Import License',
        'Register with CDSCO',
        'Local clinical data may be needed'
      ]
    }
  };

  return marketEntryData[marketCode] || null;
};

// Helper function to convert basic market data to EnhancedProductMarket
const convertToEnhancedMarket = (market: any): EnhancedProductMarket => {
  const marketNames: Record<string, string> = {
    'EU': 'European Union',
    'US': 'United States',
    'USA': 'United States',
    'CA': 'Canada',
    'AU': 'Australia',
    'JP': 'Japan',
    'BR': 'Brazil',
    'CN': 'China',
    'IN': 'India',
    'UK': 'United Kingdom',
    'CH': 'Switzerland',
    'KR': 'South Korea'
  };

  return {
    code: market.code,
    name: market.name || marketNames[market.code] || market.code,
    selected: Boolean(market.selected),
    riskClass: market.riskClass || undefined,
    regulatoryStatus: market.regulatoryStatus || undefined,
    // Include any other properties that might exist
    ...market
  };
};

// Market Entry Info Dialog Component
const MarketEntryInfoDialog = ({ market, marketInfo }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{marketInfo.flag}</span>
            <span>Market Entry Steps - {marketInfo.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Required Bureaucratic Steps:</h4>
            <ul className="list-disc list-inside space-y-1">
              {marketInfo.bureaucracy.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function SimpleMarketsSection({
  markets = [],
  onMarketsChange,
  isLoading = false
}: SimpleMarketsSectionProps) {
  console.log('[SimpleMarketsSection] Props received:', { markets, isLoading });

  // Initialize markets with stable reference using useMemo
  const currentMarkets = useMemo(() => {
    console.log('[SimpleMarketsSection] Processing markets:', markets);
    
    if (!markets || markets.length === 0) {
      console.log('[SimpleMarketsSection] No markets provided, initializing from marketData');
      return marketData.map(market => convertToEnhancedMarket({
        code: market.code,
        name: market.name,
        selected: false
      }));
    }
    
    // Ensure all markets have proper structure
    const processedMarkets = markets.map(market => convertToEnhancedMarket(market));
    console.log('[SimpleMarketsSection] Processed markets:', processedMarkets);
    return processedMarkets;
  }, [markets]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    const selectedMarkets = currentMarkets.filter(m => m.selected).length;
    // Consider having at least 1 market selected as 100% completion
    return selectedMarkets > 0 ? 100 : 0;
  };

  const completionPercentage = calculateCompletion();

  // Stable event handler using useCallback
  const handleMarketToggle = useCallback((code: string, checked: boolean) => {
    console.log('[SimpleMarketsSection] Market toggle:', { code, checked });
    
    try {
      if (!onMarketsChange) {
        console.error('[SimpleMarketsSection] onMarketsChange handler not provided');
        return;
      }

      const updatedMarkets = currentMarkets.map(market => 
        market.code === code 
          ? { ...market, selected: checked }
          : market
      );
      
      console.log('[SimpleMarketsSection] Updated markets:', updatedMarkets);
      onMarketsChange(updatedMarkets);
    } catch (error) {
      console.error('[SimpleMarketsSection] Error in handleMarketToggle:', error);
    }
  }, [currentMarkets, onMarketsChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>4. Target Markets</CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && <div className="w-4 h-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />}
            <span className="text-sm text-muted-foreground">
              {completionPercentage}% completed
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Select the target markets where your medical device will be launched.
          Each market has specific bureaucratic requirements for market entry.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketData.map((market) => {
            const currentMarket = currentMarkets.find(m => m.code === market.code);
            const isSelected = currentMarket?.selected || false;
            const marketEntryInfo = getMarketEntryInfo(market.code);
            
            console.log('[SimpleMarketsSection] Rendering market:', { 
              code: market.code, 
              isSelected, 
              currentMarket 
            });
              
            return (
              <div key={market.code} className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id={`market-${market.code}`} 
                    checked={isSelected}
                    onCheckedChange={(checked) => handleMarketToggle(market.code, checked === true)}
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor={`market-${market.code}`} 
                    className="font-medium cursor-pointer"
                  >
                    {market.name}
                  </Label>
                </div>
                
                {marketEntryInfo && (
                  <MarketEntryInfoDialog market={market} marketInfo={marketEntryInfo} />
                )}
              </div>
            );
          })}
        </div>

        {/* Show selected markets summary */}
        {currentMarkets.some(m => m.selected) && (
          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="font-medium mb-2">Selected Markets:</p>
            <div className="flex flex-wrap gap-2">
              {currentMarkets
                .filter(m => m.selected)
                .map(market => {
                  const marketInfo = marketData.find(md => md.code === market.code);
                  return (
                    <span key={market.code} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {marketInfo?.name || market.name}
                    </span>
                  );
                })
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
