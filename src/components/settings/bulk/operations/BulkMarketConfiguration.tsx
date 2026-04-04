import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { HierarchicalNode } from "@/services/hierarchicalBulkService";
import { HierarchicalMarketService } from "@/services/hierarchicalMarketService";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { EnhancedMarketsSection } from "@/components/product/device/EnhancedMarketsSection";

interface BulkMarketConfigurationProps {
  selectedNodes: HierarchicalNode[];
  onExecute: (markets: EnhancedProductMarket[]) => void;
  isExecuting: boolean;
  companyId: string;
}

export function BulkMarketConfiguration({ 
  selectedNodes, 
  onExecute, 
  isExecuting, 
  companyId 
}: BulkMarketConfigurationProps) {
  const [markets, setMarkets] = useState<EnhancedProductMarket[]>([]);
  const [companyDefaultMarkets, setCompanyDefaultMarkets] = useState<EnhancedProductMarket[]>([]);
  
  useEffect(() => {
    loadCompanyDefaultMarkets();
  }, [companyId]);
  
  const loadCompanyDefaultMarkets = async () => {
    try {
      const defaultMarkets = await HierarchicalMarketService.getCompanyMarkets(companyId);
      setCompanyDefaultMarkets(defaultMarkets);
      setMarkets(defaultMarkets); // Start with company defaults
    } catch (error) {
      console.error('Failed to load company default markets:', error);
    }
  };
  
  const handleExecute = () => {
    onExecute(markets);
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Configure Target Markets</h3>
        <p className="text-sm text-muted-foreground">
          Set target markets for {selectedNodes.length} selected items. 
          These markets will override any inherited settings.
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        <EnhancedMarketsSection
          markets={markets}
          onMarketsChange={setMarkets}
          isLoading={false}
          companyId={companyId}
        />
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setMarkets(companyDefaultMarkets)}
        >
          Use Company Defaults
        </Button>
        
        <Button
          onClick={handleExecute}
          disabled={isExecuting || markets.length === 0}
        >
          {isExecuting ? 'Applying...' : `Apply to ${selectedNodes.length} Items`}
        </Button>
      </div>
    </div>
  );
}