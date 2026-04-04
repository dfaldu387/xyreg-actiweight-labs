import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Target, 
  DollarSign,
  Info
} from 'lucide-react';
import { BidirectionalCannibalizationData } from '@/services/cannibalizationImpactService';

interface CannibalizationInsightsPanelProps {
  cannibalizationData: BidirectionalCannibalizationData;
  activeMarkets: string[];
}

export function CannibalizationInsightsPanel({
  cannibalizationData,
  activeMarkets
}: CannibalizationInsightsPanelProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const activeMarketImpacts = cannibalizationData.thisProductCannibalizes.filter(
    impact => activeMarkets.includes(impact.marketCode)
  );

  const activeMarketLosses = cannibalizationData.thisProductIsCannibalized.filter(
    impact => activeMarkets.includes(impact.marketCode)
  );

  const hasAnyImpact = activeMarketImpacts.length > 0 || activeMarketLosses.length > 0;

  if (!hasAnyImpact) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-green-800">
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">
              No cannibalization impacts detected for active markets
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Portfolio Cannibalization Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Net Portfolio Impact */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <span className="font-medium">Net Portfolio Impact:</span>
          </div>
          <Badge 
            variant={cannibalizationData.netPortfolioImpact >= 0 ? "default" : "destructive"}
            className="text-sm"
          >
            {cannibalizationData.netPortfolioImpact >= 0 ? '+' : ''}{formatCurrency(cannibalizationData.netPortfolioImpact)}
          </Badge>
        </div>

        {/* This Product Cannibalizes Others */}
        {activeMarketImpacts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
              <TrendingDown className="h-4 w-4" />
              This Product Impacts Others ({activeMarketImpacts.length})
            </div>
            <div className="space-y-2">
              {activeMarketImpacts.map((impact, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div>
                    <span className="font-medium">{impact.affectedProductName}</span>
                    <span className="text-muted-foreground ml-2">in {impact.marketCode}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">
                      -{formatCurrency(impact.totalEstimatedLoss)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {impact.totalCannibalizationPercentage}% over {impact.monthsToReachRoof}mo
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* This Product Is Cannibalized */}
        {activeMarketLosses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-800">
              <TrendingUp className="h-4 w-4" />
              This Product Is Impacted By ({activeMarketLosses.length})
            </div>
            <div className="space-y-2">
              {activeMarketLosses.map((impact, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                  <div>
                    <span className="font-medium">{impact.impactingProductName}</span>
                    <span className="text-muted-foreground ml-2">in {impact.marketCode}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">
                      -{formatCurrency(impact.totalEstimatedLoss)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {impact.totalCannibalizationPercentage}% over {impact.monthsToReachRoof}mo
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">About Cannibalization Impact:</p>
            <p>
              These estimates show how launching this product may affect existing product revenues 
              and how other products might impact this one. The calculations are integrated into 
              your rNPV analysis to provide more accurate portfolio-level valuations.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}