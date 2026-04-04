
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Globe, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { formatDate } from "@/lib/date";

interface MarketLaunchDateManagerProps {
  marketLaunchDates: Record<string, string>;
  onMarketLaunchDatesChange?: (dates: Record<string, string>) => void;
  primaryLaunchDate?: Date;
  productId?: string;
}

const AVAILABLE_MARKETS = [
  { code: 'US', name: 'United States' },
  { code: 'EU', name: 'European Union' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IN', name: 'India' },
  { code: 'KR', name: 'South Korea' },
  { code: 'UK', name: 'United Kingdom' }
];

export function MarketLaunchDateManager({
  marketLaunchDates,
  onMarketLaunchDatesChange,
  primaryLaunchDate,
  productId
}: MarketLaunchDateManagerProps) {
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [useMonthYearMode, setUseMonthYearMode] = useState<Record<string, boolean>>({});

  const addMarketLaunchDate = () => {
    if (!selectedMarket || marketLaunchDates[selectedMarket]) return;
    
    const updatedDates = {
      ...marketLaunchDates,
      [selectedMarket]: primaryLaunchDate ? primaryLaunchDate.toISOString().split('T')[0] : ''
    };
    
    onMarketLaunchDatesChange?.(updatedDates);
    setSelectedMarket('');
  };

  const updateMarketLaunchDate = (marketCode: string, date: Date | undefined) => {
    if (!date) {
      // Remove the market launch date
      const updatedDates = { ...marketLaunchDates };
      delete updatedDates[marketCode];
      onMarketLaunchDatesChange?.(updatedDates);
    } else {
      // Update the market launch date
      const updatedDates = {
        ...marketLaunchDates,
        [marketCode]: date.toISOString().split('T')[0]
      };
      onMarketLaunchDatesChange?.(updatedDates);
    }
  };

  const removeMarketLaunchDate = (marketCode: string) => {
    const updatedDates = { ...marketLaunchDates };
    delete updatedDates[marketCode];
    onMarketLaunchDatesChange?.(updatedDates);
  };

  const getMarketName = (code: string) => {
    return AVAILABLE_MARKETS.find(m => m.code === code)?.name || code;
  };

  const availableMarketsToAdd = AVAILABLE_MARKETS.filter(
    market => !marketLaunchDates[market.code]
  );

  const sortedMarketEntries = Object.entries(marketLaunchDates).sort(([a], [b]) => 
    getMarketName(a).localeCompare(getMarketName(b))
  );

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Configure specific launch dates for different markets. This helps track regulatory approval timelines and market entry strategies.
      </div>

      {/* Add New Market */}
      {availableMarketsToAdd.length > 0 && (
        <Card className="bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Market Launch Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label>Select Market</Label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose market..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMarketsToAdd.map((market) => (
                      <SelectItem key={market.code} value={market.code}>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {market.name} ({market.code})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={addMarketLaunchDate} 
                disabled={!selectedMarket}
                className="shrink-0"
              >
                Add Market
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Launch Dates List */}
      {sortedMarketEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No market-specific launch dates configured.</p>
          <p className="text-sm">Add markets above to track individual launch timelines.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMarketEntries.map(([marketCode, dateString]) => {
            const date = dateString ? new Date(dateString) : undefined;
            const isOverdue = date && date < new Date() && date.toDateString() !== new Date().toDateString();
            
            return (
              <Card key={marketCode} className={`transition-colors ${isOverdue ? 'bg-red-50 border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{getMarketName(marketCode)}</div>
                        <div className="text-sm text-muted-foreground">Market Code: {marketCode}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUseMonthYearMode(prev => ({
                            ...prev,
                            [marketCode]: !prev[marketCode]
                          }))}
                          className="p-1 h-auto"
                          title={useMonthYearMode[marketCode] ? "Switch to full date picker" : "Switch to month/year picker"}
                        >
                          {useMonthYearMode[marketCode] ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Label className="text-sm whitespace-nowrap">Launch Date:</Label>
                        {useMonthYearMode[marketCode] ? (
                          <MonthYearPicker
                            date={date}
                            setDate={(newDate) => updateMarketLaunchDate(marketCode, newDate)}
                            placeholder="Select month/year"
                          />
                        ) : (
                          <Input
                            type="date"
                            value={date ? date.toISOString().split('T')[0] : ''}
                            onChange={(e) => updateMarketLaunchDate(marketCode, e.target.value ? new Date(e.target.value) : undefined)}
                            className="w-[180px]"
                          />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMarketLaunchDate(marketCode)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {date && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Launch scheduled for {formatDate(date)}
                        {isOverdue && <span className="text-red-500 font-medium">(Past due)</span>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {sortedMarketEntries.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-blue-900 mb-2">Launch Summary</div>
            <div className="text-blue-700">
              {sortedMarketEntries.length} market{sortedMarketEntries.length !== 1 ? 's' : ''} configured
              {primaryLaunchDate && (
                <span className="ml-2">
                  • Primary launch: {formatDate(primaryLaunchDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
