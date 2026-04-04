
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, TrendingDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffectedProductNPVNotificationProps {
  productName: string;
  marketCode: string;
  npvImpact: number;
  currency: string;
  onViewDetails?: () => void;
}

export function AffectedProductNPVNotification({
  productName,
  marketCode,
  npvImpact,
  currency,
  onViewDetails
}: AffectedProductNPVNotificationProps) {
  const formattedImpact = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(npvImpact));

  return (
    <Card className="border-l-4 border-orange-500 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-900">
                Automatic NPV Analysis Created
              </span>
            </div>
            
            <p className="text-sm text-orange-800 mb-3">
              Created cannibalization impact analysis for <strong>{productName}</strong> in {marketCode} market.
              Projected revenue loss: <strong>{currency}{formattedImpact}</strong>
            </p>
            
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Impact Analysis
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
