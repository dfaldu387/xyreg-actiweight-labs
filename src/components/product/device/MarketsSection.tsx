
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Info, CalendarIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { marketData, ProductMarket, REAUDIT_TIMELINE_OPTIONS, getFutureDate } from "@/utils/marketRiskClassMapping";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MarketsSectionProps {
  markets: ProductMarket[];
  onMarketsChange: (markets: ProductMarket[]) => void;
  isLoading?: boolean;
}

export function MarketsSection({
  markets = [],
  onMarketsChange,
  isLoading = false
}: MarketsSectionProps) {
  // Initialize markets if empty
  const currentMarkets = markets.length > 0 
    ? markets 
    : marketData.map(market => ({ code: market.code, selected: false } as ProductMarket));

  const handleMarketToggle = (code: string, checked: boolean) => {
    const updatedMarkets = currentMarkets.map(market => 
      market.code === code ? { ...market, selected: checked } : market
    );
    onMarketsChange(updatedMarkets);
  };

  const handleRegulatoryStatusChange = (code: string, regulatoryStatus: string) => {
    const updatedMarkets = currentMarkets.map(market => 
      market.code === code ? { ...market, regulatoryStatus } : market
    );
    onMarketsChange(updatedMarkets);
  };

  const handleReauditTimelineOptionChange = (code: string, timelineOption: string) => {
    let reauditTimeline: Date | string | undefined;
    const isCustom = timelineOption === "custom";
    
    if (!isCustom) {
      // Find the selected timeline option
      const option = REAUDIT_TIMELINE_OPTIONS.find(opt => opt.value === timelineOption);
      if (option) {
        reauditTimeline = getFutureDate(option.days);
      }
    }
    
    const updatedMarkets = currentMarkets.map(market => 
      market.code === code ? { 
        ...market, 
        customReauditTimeline: isCustom,
        reauditTimeline: isCustom ? market.reauditTimeline : reauditTimeline 
      } : market
    );
    
    onMarketsChange(updatedMarkets);
  };

  const handleCustomReauditTimelineChange = (code: string, date: Date | undefined) => {
    if (!date) return;
    
    const updatedMarkets = currentMarkets.map(market => 
      market.code === code ? { ...market, reauditTimeline: date } : market
    );
    onMarketsChange(updatedMarkets);
  };

  // Helper function to get timeline option from date
  const getTimelineOptionFromDate = (market: ProductMarket): string => {
    if (market.customReauditTimeline) return "custom";
    if (!market.reauditTimeline) return "";
    
    // Try to match with standard options
    const today = new Date();
    const reauditDate = new Date(market.reauditTimeline);
    const diffDays = Math.round((reauditDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Allow small variations (±30 days) to match standard options
    for (const option of REAUDIT_TIMELINE_OPTIONS) {
      if (option.value === "custom") continue;
      if (Math.abs(diffDays - option.days) <= 30) {
        return option.value;
      }
    }
    
    return "custom";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground mb-4">
          Select the target markets for your medical device, their regulatory status, and when re-audits are required. 
          This information helps track compliance requirements across different regions.
        </p>
        
        <div className="grid gap-6">
          {marketData.map((market) => {
            const currentMarket = currentMarkets.find(m => m.code === market.code) || 
              { code: market.code, selected: false };
              
            // Get timeline option for dropdown
            const timelineOption = currentMarket.reauditTimeline ? 
              getTimelineOptionFromDate(currentMarket) : "";
              
            return (
              <div key={market.code} className="border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`market-${market.code}`} 
                      checked={currentMarket.selected}
                      onCheckedChange={(checked) => handleMarketToggle(market.code, checked === true)}
                      disabled={isLoading}
                    />
                    <Label htmlFor={`market-${market.code}`} className="font-medium">
                      {market.name}
                    </Label>
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p>Select regulatory status and re-audit timeline for this market.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {currentMarket.selected && (
                  <div className="mt-4 ml-6 space-y-4">
                    
                    {/* Regulatory Status */}
                    <div>
                      <Label htmlFor={`regulatory-status-${market.code}`} className="text-sm font-medium">
                        Regulatory Status
                      </Label>
                      <Select 
                        value={currentMarket.regulatoryStatus || ""}
                        onValueChange={(value) => handleRegulatoryStatusChange(market.code, value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger id={`regulatory-status-${market.code}`} className="mt-1">
                          <SelectValue placeholder="Select regulatory status" />
                        </SelectTrigger>
                        <SelectContent>
                          {market.regulatoryStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Re-audit Timeline */}
                    <div>
                      <Label htmlFor={`reaudit-timeline-${market.code}`} className="text-sm font-medium">
                        Re-audit Timeline
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                        {/* Timeline Option Selection */}
                        <Select 
                          value={timelineOption}
                          onValueChange={(value) => handleReauditTimelineOptionChange(market.code, value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger id={`reaudit-timeline-${market.code}`}>
                            <SelectValue placeholder="Select timeline" />
                          </SelectTrigger>
                          <SelectContent>
                            {REAUDIT_TIMELINE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Custom Date Picker - Show only when "custom" is selected */}
                        {currentMarket.customReauditTimeline && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "justify-start text-left font-normal",
                                  !currentMarket.reauditTimeline && "text-muted-foreground"
                                )}
                                disabled={isLoading}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentMarket.reauditTimeline ? 
                                  format(new Date(currentMarket.reauditTimeline), "PPP") : 
                                  "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={currentMarket.reauditTimeline ? new Date(currentMarket.reauditTimeline) : undefined}
                                onSelect={(date) => handleCustomReauditTimelineChange(market.code, date)}
                                initialFocus
                                disabled={(date) => date < new Date()}
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                    
                    {/* Display selected info */}
                    {(currentMarket.regulatoryStatus || currentMarket.reauditTimeline) && (
                      <div className="mt-2 bg-muted p-3 rounded-md text-xs">
                        <p className="font-medium mb-1">Selected Configuration:</p>
                        {currentMarket.regulatoryStatus && (
                          <p>
                            <span className="font-medium">Status:</span> {
                              market.regulatoryStatuses.find(rs => rs.value === currentMarket.regulatoryStatus)?.label || 
                              currentMarket.regulatoryStatus
                            }
                          </p>
                        )}
                        {currentMarket.reauditTimeline && (
                          <p>
                            <span className="font-medium">Re-audit Due:</span> {
                              format(new Date(currentMarket.reauditTimeline), "PPP")
                            }
                          </p>
                        )}
                        <p className="text-muted-foreground mt-2 italic">
                          Risk classification is set in the Regulatory tab
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
