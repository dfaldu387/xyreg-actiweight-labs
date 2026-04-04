
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Info, Calendar, FileCheck, Building, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EnhancedProductMarket } from "@/types/client";
import { MarketSpecificForm } from "./MarketSpecificForm";
import { getMarketCurrency, formatCurrency } from "@/utils/marketCurrencyUtils";
import { marketData } from "@/utils/marketRiskClassMapping";
import { getMarketLaunchStatus } from "@/utils/launchStatusUtils";
import { ProductLaunchPhaseService } from '@/services/productLaunchPhaseService';

interface CollapsibleMarketEntryProps {
  market: EnhancedProductMarket;
  onMarketChange: (market: EnhancedProductMarket) => void;
  isLoading?: boolean;
  companyId?: string;
  productId?: string;
  hasEudamedData?: boolean;
  disabledByLimit?: boolean;
  disabled?: boolean;
  autoExpand?: boolean;
  isFirstSelectedMarket?: boolean;
}

// Market Entry Information with bureaucracy steps
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

export function CollapsibleMarketEntry({
  market,
  onMarketChange,
  isLoading = false,
  companyId,
  productId,
  hasEudamedData = false,
  disabledByLimit = false,
  disabled = false,
  autoExpand = false,
  isFirstSelectedMarket = false
}: CollapsibleMarketEntryProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpand && market.selected);
  const marketInfo = getMarketEntryInfo(market.code);
  const marketCurrency = getMarketCurrency(market.code);
  const marketRiskData = marketData.find(m => m.code === market.code);

  // Auto-expand when autoExpand prop changes and market is selected
  useEffect(() => {
    if (autoExpand && market.selected) {
      setIsExpanded(true);
    }
  }, [autoExpand, market.selected]);

  const handleSelectionChange = (checked: boolean) => {
    onMarketChange({ ...market, selected: checked });
  };

  const handleMarketDataChange = (updatedMarket: EnhancedProductMarket) => {
    onMarketChange(updatedMarket);
  };

  const handleLaunchStatusChange = (checked: boolean) => {
    const actualLaunchDate = checked ? (market.actualLaunchDate || new Date().toISOString()) : undefined;
    const updatedMarket = {
      ...market,
      marketLaunchStatus: checked ? 'launched' as const : 'planned' as const,
      actualLaunchDate
    };
    onMarketChange(updatedMarket);

    // Auto-complete development phases when product is first launched
    if (checked && productId && companyId && actualLaunchDate) {
      const dateStr = typeof actualLaunchDate === 'string' ? actualLaunchDate : new Date(actualLaunchDate).toISOString();
      ProductLaunchPhaseService.completePhasesOnLaunch(productId, companyId, dateStr);
    }
  };

  // Get launch status using the imported utility
  const launchStatus = getMarketLaunchStatus(market);
  const isLaunched = launchStatus.isLaunched;

  // EUDAMED data no longer forces launch status - user can override
  const isEUWithEudamed = market.code === 'EU' && hasEudamedData && market.selected;

  return (
    <Card 
      data-market-code={market.code}
      className={`overflow-hidden transition-all duration-300 ease-in-out hover:shadow-md ${isLaunched ? 'bg-green-50 border-green-200 border-2' : ''
      }`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`cursor-pointer hover:bg-muted/50 transition-colors duration-200 ${isLaunched ? 'bg-green-100' : ''
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <Checkbox
                  id={`market-${market.code}`}
                  checked={market.selected}
                  onCheckedChange={handleSelectionChange}
                  disabled={isLoading || disabledByLimit || disabled}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor={`market-${market.code}`}
                      className="font-medium cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {marketInfo?.flag} {market.name}
                    </Label>
                    {disabledByLimit && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                        Limit reached
                      </Badge>
                    )}
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {marketCurrency.symbol} {marketCurrency.code}
                      </Badge>
                      {market.riskClass && (
                        <Badge variant="secondary" className="text-xs">
                          Class {market.riskClass}
                        </Badge>
                      )}
                      {market.regulatoryStatus && (
                        <Badge variant="outline" className="text-xs">
                          {market.regulatoryStatus}
                        </Badge>
                      )}
                      {isLaunched && (
                        <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Launched
                        </Badge>
                      )}
                    </div>
                  </div>
                  {(market.actualLaunchDate || market.selected || isLaunched) && (
                    <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                      {market.actualLaunchDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Launch: {new Date(market.actualLaunchDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {isLaunched && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Launched in Market</span>
                        </div>
                      )}
                      {market.selected && !isLaunched && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span className="text-orange-500">Planning</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {marketInfo && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="h-4 w-4 text-muted-foreground" />
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
                )}

                <div className="transform transition-transform duration-300 ease-in-out">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="transition-all duration-300 ease-in-out data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <CardContent className="pt-0 space-y-6">
            {/* Market Information Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Market Information</h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex">
                    <span className="text-muted-foreground">Currency:</span>
                    <span className="font-medium ml-2">{marketCurrency.symbol} {marketCurrency.name}</span>
                  </div>
                  {market.launchDate && (
                    <div className="flex">
                      <span className="text-muted-foreground">Launch Date:</span>
                      <span className="font-medium ml-2">
                        {new Date(market.launchDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`launch-${market.code}`}
                            checked={isLaunched}
                            onCheckedChange={handleLaunchStatusChange}
                            disabled={isLoading}
                          />
                          <Label htmlFor={`launch-${market.code}`} className="text-sm font-medium cursor-pointer">
                            Launched in Market
                          </Label>
                        </div>
                        {isEUWithEudamed && !isLaunched ? (
                          <p className="text-xs text-orange-600 dark:text-orange-400 ml-6 max-w-md">
                            ⚠ This device has EUDAMED registration data but is not marked as launched.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground ml-6 max-w-md">
                            Check when the device is commercially available in this market.
                            This triggers PMS requirements and enables revenue tracking.
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Alert for regulatory status without launch */}
                  {!isLaunched && market.regulatoryStatus && ['CE_MARKED', 'FDA_APPROVED', 'FDA_CLEARED', 'HEALTH_CANADA_LICENSED', 'TGA_REGISTERED', 'PMDA_APPROVED'].includes(market.regulatoryStatus) && (
                    <Alert className="ml-6 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <AlertDescription className="text-xs text-orange-800 dark:text-orange-200">
                        This market has regulatory approval ({market.regulatoryStatus.replace(/_/g, ' ')}) but is not marked as launched.
                        Consider checking "Launched in Market" if the product is commercially available.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Success indicator when launched */}
                  {isLaunched && (
                    <div className="ml-6 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Market is launched - PMS requirements active</span>
                    </div>
                  )}
                  {market.actualLaunchDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Launch Date:</span>
                      <input
                        type="date"
                        value={market.actualLaunchDate ? new Date(market.actualLaunchDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const updatedMarket = {
                            ...market,
                            actualLaunchDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                          };
                          onMarketChange(updatedMarket);
                        }}
                        disabled={isLoading}
                        className="text-sm font-medium border rounded px-2 py-0.5 bg-background"
                      />
                    </div>
                  )}
                  {market.riskClass && (
                    <div className="flex">
                      <span className="text-muted-foreground">Selected Risk Class:</span>
                      <Badge variant="secondary" className="text-xs ml-2">
                        Class {market.riskClass}
                      </Badge>
                    </div>
                  )}
                  {market.regulatoryStatus && (
                    <div className="flex">
                      <span className="text-muted-foreground">Regulatory Status:</span>
                      <Badge
                        variant={isLaunched ? 'default' : 'outline'}
                        className={`text-xs ml-2 ${isLaunched
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : ''
                          }`}
                      >
                        {market.regulatoryStatus === 'CE_MARKED' && isLaunched ? 'CE Marked (Launched)' :
                          market.regulatoryStatus === 'FDA_APPROVED' && isLaunched ? 'FDA Approved (Launched)' :
                            market.regulatoryStatus === 'TGA_REGISTERED' && isLaunched ? 'TGA Registered (Launched)' :
                              market.regulatoryStatus === 'HEALTH_CANADA_LICENSED' && isLaunched ? 'Health Canada Licensed (Launched)' :
                                market.regulatoryStatus === 'PMDA_APPROVED' && isLaunched ? 'PMDA Approved (Launched)' :
                                  market.regulatoryStatus === 'ANVISA_APPROVED' && isLaunched ? 'ANVISA Approved (Launched)' :
                                    market.regulatoryStatus === 'NMPA_APPROVED' && isLaunched ? 'NMPA Approved (Launched)' :
                                      market.regulatoryStatus === 'CDSCO_APPROVED' && isLaunched ? 'CDSCO Approved (Launched)' :
                                        market.regulatoryStatus === 'KFDA_APPROVED' && isLaunched ? 'KFDA Approved (Launched)' :
                                          market.regulatoryStatus}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {market.selected && (
              <>
                <Separator />
                <div className="animate-fade-in">
                  <MarketSpecificForm
                    market={market}
                    onMarketChange={handleMarketDataChange}
                    isLoading={isLoading}
                    companyId={companyId}
                    isFirstSelectedMarket={isFirstSelectedMarket}
                  />
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
