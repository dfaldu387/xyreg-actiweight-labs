import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { ContinuousPhaseComponent } from '@/services/enhanced-rnpv/interfaces';

interface ContinuousPhaseIndicatorProps {
  phaseName: string;
  preLaunchComponent?: ContinuousPhaseComponent | null;
  postLaunchComponent?: ContinuousPhaseComponent | null;
  totalCost: number;
}

export function ContinuousPhaseIndicator({
  phaseName,
  preLaunchComponent,
  postLaunchComponent,
  totalCost
}: ContinuousPhaseIndicatorProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            {phaseName}
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              Continuous
            </Badge>
          </CardTitle>
          <div className="text-sm font-medium text-muted-foreground">
            Total: {formatCurrency(totalCost)}
          </div>
        </div>
        <CardDescription>
          This phase spans both pre-launch development and post-launch operations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pre-Launch Component */}
          {preLaunchComponent && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Pre-Launch Development
              </div>
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Investment Cost:</span>
                  <span className="font-medium">{formatCurrency(preLaunchComponent.cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Present Value:</span>
                  <span className="font-medium">{formatCurrency(preLaunchComponent.presentValueCost)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Period:</span>
                  <span>Months {preLaunchComponent.periodStartMonth} - {preLaunchComponent.periodEndMonth}</span>
                </div>
              </div>
            </div>
          )}

          {/* Post-Launch Component */}
          {postLaunchComponent && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Post-Launch Operations
              </div>
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recurring Cost:</span>
                  <span className="font-medium">{formatCurrency(postLaunchComponent.cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Present Value:</span>
                  <span className="font-medium">{formatCurrency(postLaunchComponent.presentValueCost)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Frequency:</span>
                  <span className="capitalize">{postLaunchComponent.frequency || 'yearly'}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Period:</span>
                  <span>Months {postLaunchComponent.periodStartMonth} - {postLaunchComponent.periodEndMonth}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Insights */}
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-800 mb-2">
            <Clock className="h-4 w-4" />
            Continuous Phase Impact
          </div>
          <p className="text-sm text-orange-700">
            This phase requires both upfront development investment and ongoing operational costs. 
            The rNPV model accounts for different risk profiles and timing of these cost components.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}