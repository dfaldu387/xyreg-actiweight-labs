
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CannibalizationImpact } from "@/services/cannibalizationImpactService";

interface CannibalizationImpactDisplayProps {
  impacts: CannibalizationImpact[];
  currency: string;
}

export function CannibalizationImpactDisplay({
  impacts,
  currency
}: CannibalizationImpactDisplayProps) {
  if (impacts.length === 0) {
    return null;
  }

  const totalImpact = impacts.reduce((sum, impact) => sum + impact.totalEstimatedLoss, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value));
  };

  return (
    <Card className="border-l-4 border-red-500 bg-red-50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-red-900">
          <TrendingDown className="h-5 w-5" />
          Cannibalization Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-100 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-900">Revenue Loss from New Product Launches</span>
          </div>
          <p className="text-sm text-red-700">
            This product is expected to lose revenue due to cannibalization from new product launches.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Total NPV Impact:</span>
            <span className="text-lg font-semibold text-red-600">
              -{currency}{formatCurrency(totalImpact)}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Combined negative impact from {impacts.length} product launch{impacts.length > 1 ? 'es' : ''}
          </div>
        </div>

        {/* Individual Impacts */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Impact Breakdown:</h4>
          
          {impacts.map((impact, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-gray-900">{impact.impactingProductName}</span>
                  <span className="text-sm text-gray-500">({impact.marketCode})</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  -{currency}{formatCurrency(impact.totalEstimatedLoss)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Time to Max Impact:</span>
                  <div>{impact.monthsToReachRoof} months</div>
                </div>
                <div>
                  <span className="font-medium">Max Cannibalization:</span>
                  <div>{impact.totalCannibalizationPercentage}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Source Product NPV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
