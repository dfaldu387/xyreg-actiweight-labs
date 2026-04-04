
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { CannibalizationImpactService, BidirectionalCannibalizationData } from '@/services/cannibalizationImpactService';
import { getCurrencySymbol } from '@/utils/currencyUtils';
import { Separator } from "@/components/ui/separator";

interface BidirectionalCannibalizationDisplayProps {
  productId: string;
  currency: string;
  isLoading?: boolean;
}

export function BidirectionalCannibalizationDisplay({
  productId,
  currency,
  isLoading = false
}: BidirectionalCannibalizationDisplayProps) {
  const [cannibalizationData, setCannibalizationData] = useState<BidirectionalCannibalizationData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const cannibalizationService = new CannibalizationImpactService();
  const currencySymbol = getCurrencySymbol(currency);

  useEffect(() => {
    const loadCannibalizationData = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        const data = await cannibalizationService.getBidirectionalCannibalizationData(productId);
        setCannibalizationData(data);
      } catch (error) {
        console.error('Error loading cannibalization data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCannibalizationData();
  }, [productId]);

  if (loading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Cannibalization Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading cannibalization data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!cannibalizationData) {
    return null;
  }

  const { thisProductCannibalizes, thisProductIsCannibalized, netPortfolioImpact } = cannibalizationData;

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${Math.abs(amount).toLocaleString()}`;
  };

  const hasAnyImpacts = thisProductCannibalizes.length > 0 || thisProductIsCannibalized.length > 0;

  if (!hasAnyImpacts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Cannibalization Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No cannibalization impacts detected for this product.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Cannibalization Impact Analysis
        </CardTitle>
        {netPortfolioImpact !== 0 && (
          <div className={`text-sm font-medium ${netPortfolioImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
            Net Portfolio Impact: {netPortfolioImpact > 0 ? '+' : ''}{formatCurrency(netPortfolioImpact)}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Products This Product Cannibalizes */}
        {thisProductCannibalizes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-green-700">This Product Cannibalizes ({thisProductCannibalizes.length})</h4>
            </div>
            
            <div className="space-y-3">
              {thisProductCannibalizes.map((impact, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-green-800">{impact.affectedProductName}</div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {impact.marketCode}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Impact</div>
                      <div className="font-medium">{impact.totalCannibalizationPercentage}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Timeline</div>
                      <div className="font-medium">{impact.monthsToReachRoof} months</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Monthly Loss</div>
                      <div className="font-medium text-green-600">+{formatCurrency(impact.estimatedMonthlyLoss)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Impact</div>
                      <div className="font-medium text-green-600">+{formatCurrency(impact.totalEstimatedLoss)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {thisProductCannibalizes.length > 0 && thisProductIsCannibalized.length > 0 && <Separator />}

        {/* Products That Cannibalize This Product */}
        {thisProductIsCannibalized.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <h4 className="font-medium text-red-700">This Product Is Cannibalized By ({thisProductIsCannibalized.length})</h4>
            </div>
            
            <div className="space-y-3">
              {thisProductIsCannibalized.map((impact, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-md border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-red-800">{impact.impactingProductName}</div>
                    <Badge variant="outline" className="text-red-700 border-red-300">
                      {impact.marketCode}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Volume Drop</div>
                      <div className="font-medium text-red-600">-{impact.totalCannibalizationPercentage}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Timeline</div>
                      <div className="font-medium">{impact.monthsToReachRoof} months</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Monthly Loss</div>
                      <div className="font-medium text-red-600">-{formatCurrency(impact.estimatedMonthlyLoss)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Loss</div>
                      <div className="font-medium text-red-600">-{formatCurrency(impact.totalEstimatedLoss)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-red-600">
                    ⚠️ This product's NPV will be reduced due to market share loss
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {netPortfolioImpact !== 0 && (
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="font-medium">Portfolio Net Impact</div>
              <div className={`font-bold ${netPortfolioImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netPortfolioImpact > 0 ? '+' : ''}{formatCurrency(netPortfolioImpact)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {netPortfolioImpact > 0 
                ? 'This product generates more value than it cannibalizes' 
                : 'This product loses more value than it generates through cannibalization'
              }
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
