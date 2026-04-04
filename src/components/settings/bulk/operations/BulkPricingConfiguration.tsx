import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { HierarchicalNode } from "@/services/hierarchicalBulkService";
import { getMarketCurrency, MARKET_CURRENCIES } from "@/utils/marketCurrencyUtils";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Copy, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface BulkPricingConfigurationProps {
  selectedNodes: HierarchicalNode[];
  onExecute: (pricingData: any) => void;
  isExecuting: boolean;
  companyId: string;
}

interface MarketPrice {
  marketCode: string;
  price: string;
  currency: string;
}

interface PricingStrategy {
  name: string;
  multiplier: number;
  description: string;
}

export function BulkPricingConfiguration({ 
  selectedNodes, 
  onExecute, 
  isExecuting,
  companyId
}: BulkPricingConfigurationProps) {
  const [pricingMode, setPricingMode] = useState('single'); // 'single' or 'market-specific'
  const [basePrice, setBasePrice] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [pricingType, setPricingType] = useState('base');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [applyToAllMarkets, setApplyToAllMarkets] = useState(false);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState('');
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState('');
  
  useEffect(() => {
    loadAvailableMarkets();
  }, [companyId]);
  
  const loadAvailableMarkets = async () => {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('default_markets')
        .eq('id', companyId)
        .single();
      
      if (company?.default_markets) {
        const markets = (company.default_markets as any[]).map(m => m.code);
        setAvailableMarkets(markets);
        setSelectedMarkets(markets); // Default to all markets
        
        // Initialize market prices
        const initialMarketPrices = markets.map(marketCode => ({
          marketCode,
          price: '',
          currency: getMarketCurrency(marketCode).code
        }));
        setMarketPrices(initialMarketPrices);
      }
    } catch (error) {
      console.error('Failed to load markets:', error);
      toast.error('Failed to load available markets');
    }
  };
  
  const getPricingStrategies = (): PricingStrategy[] => [
    { name: 'Premium', multiplier: 1.3, description: '+30% premium pricing' },
    { name: 'Standard', multiplier: 1.0, description: 'Base market price' },
    { name: 'Economy', multiplier: 0.8, description: '-20% competitive pricing' },
    { name: 'Penetration', multiplier: 0.6, description: '-40% market entry' }
  ];
  
  const applyPricingStrategy = (strategy: PricingStrategy) => {
    if (!basePrice || pricingMode !== 'market-specific') return;
    
    const updatedPrices = marketPrices.map(mp => ({
      ...mp,
      price: (parseFloat(basePrice) * strategy.multiplier).toFixed(2)
    }));
    setMarketPrices(updatedPrices);
    toast.success(`Applied ${strategy.name} strategy to all markets`);
  };
  
  const updateMarketPrice = (marketCode: string, price: string) => {
    setMarketPrices(prev => 
      prev.map(mp => 
        mp.marketCode === marketCode 
          ? { ...mp, price }
          : mp
      )
    );
  };
  
  const applyBulkAdjustment = () => {
    if (!bulkAdjustmentValue || !bulkAdjustmentType) return;
    
    const adjustment = parseFloat(bulkAdjustmentValue);
    const updatedPrices = marketPrices.map(mp => {
      if (!mp.price) return mp;
      
      const currentPrice = parseFloat(mp.price);
      let newPrice = currentPrice;
      
      if (bulkAdjustmentType === 'percent') {
        newPrice = currentPrice * (1 + adjustment / 100);
      } else if (bulkAdjustmentType === 'fixed') {
        newPrice = currentPrice + adjustment;
      }
      
      return { ...mp, price: Math.max(0, newPrice).toFixed(2) };
    });
    
    setMarketPrices(updatedPrices);
    setBulkAdjustmentValue('');
    toast.success(`Applied ${adjustment}${bulkAdjustmentType === 'percent' ? '%' : ' unit'} adjustment`);
  };
  
  const copyPriceToAllMarkets = () => {
    if (!basePrice) return;
    
    const updatedPrices = marketPrices.map(mp => ({
      ...mp,
      price: basePrice
    }));
    setMarketPrices(updatedPrices);
    toast.success('Copied base price to all markets');
  };
  
  const handleExecute = () => {
    if (pricingMode === 'single') {
      const pricingData = {
        mode: 'single',
        basePrice: parseFloat(basePrice),
        currency: baseCurrency,
        pricingType,
        applyToAllMarkets
      };
      onExecute(pricingData);
    } else {
      const validMarketPrices = marketPrices.filter(mp => mp.price && parseFloat(mp.price) > 0);
      if (validMarketPrices.length === 0) {
        toast.error('Please set at least one market price');
        return;
      }
      
      const pricingData = {
        mode: 'market-specific',
        pricingType,
        marketPrices: validMarketPrices
      };
      onExecute(pricingData);
    }
  };
  
  const getValidationMessage = () => {
    if (pricingMode === 'single') {
      return !basePrice ? 'Please enter a base price' : '';
    } else {
      const validPrices = marketPrices.filter(mp => mp.price && parseFloat(mp.price) > 0);
      return validPrices.length === 0 ? 'Please set at least one market price' : '';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold">Configure Pricing</h3>
        <p className="text-sm text-muted-foreground">
          Set pricing rules for {selectedNodes.length} selected items across different markets.
        </p>
      </div>
      
      {/* Pricing Mode Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Pricing Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={pricingMode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPricingMode('single')}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Single Price
            </Button>
            <Button
              variant={pricingMode === 'market-specific' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPricingMode('market-specific')}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Market-Specific
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricing-type">Pricing Type</Label>
          <Select value={pricingType} onValueChange={setPricingType}>
            <SelectTrigger>
              <SelectValue placeholder="Select pricing type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base">Base Price</SelectItem>
              <SelectItem value="msrp">MSRP</SelectItem>
              <SelectItem value="cost">Cost Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {pricingMode === 'single' ? (
          /* Single Price Mode */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base-price">Price</Label>
                <Input
                  id="base-price"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MARKET_CURRENCIES).map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="apply-all-markets" 
                checked={applyToAllMarkets}
                onCheckedChange={(checked) => setApplyToAllMarkets(checked === true)}
              />
              <Label htmlFor="apply-all-markets" className="text-sm">
                Apply this price to all company markets
              </Label>
            </div>
          </div>
        ) : (
          /* Market-Specific Mode */
          <div className="space-y-4">
            {/* Base Price for Strategy Application */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strategy-base-price">Base Price (for strategies)</Label>
                <Input
                  id="strategy-base-price"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPriceToAllMarkets}
                    disabled={!basePrice}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy to All
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Pricing Strategies */}
            {basePrice && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Pricing Strategies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {getPricingStrategies().map((strategy) => (
                      <Button
                        key={strategy.name}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPricingStrategy(strategy)}
                        className="flex flex-col items-start p-2 h-auto"
                      >
                        <span className="font-medium">{strategy.name}</span>
                        <span className="text-xs text-muted-foreground">{strategy.description}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Bulk Adjustments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bulk Price Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Select value={bulkAdjustmentType} onValueChange={setBulkAdjustmentType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">
                        <div className="flex items-center gap-2">
                          <Percent className="h-3 w-3" />
                          Percent
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step={bulkAdjustmentType === 'percent' ? '1' : '0.01'}
                    value={bulkAdjustmentValue}
                    onChange={(e) => setBulkAdjustmentValue(e.target.value)}
                    placeholder={bulkAdjustmentType === 'percent' ? '±10' : '±100'}
                    className="w-24"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyBulkAdjustment}
                    disabled={!bulkAdjustmentType || !bulkAdjustmentValue}
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Market-Specific Prices */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Market Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketPrices.map((marketPrice) => {
                    const currency = getMarketCurrency(marketPrice.marketCode);
                    return (
                      <div key={marketPrice.marketCode} className="flex items-center gap-3">
                        <Badge variant="outline" className="w-16 justify-center">
                          {marketPrice.marketCode}
                        </Badge>
                        <Input
                          type="number"
                          step="0.01"
                          value={marketPrice.price}
                          onChange={(e) => updateMarketPrice(marketPrice.marketCode, e.target.value)}
                          placeholder="0.00"
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {currency.symbol}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {getValidationMessage() && (
        <p className="text-sm text-destructive">{getValidationMessage()}</p>
      )}
      
      <Button
        onClick={handleExecute}
        disabled={isExecuting || !!getValidationMessage()}
        className="w-full"
      >
        {isExecuting ? 'Applying...' : `Apply Pricing to ${selectedNodes.length} Items`}
      </Button>
    </div>
  );
}