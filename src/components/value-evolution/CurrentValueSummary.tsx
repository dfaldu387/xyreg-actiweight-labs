import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Percent } from 'lucide-react';
import { formatCurrency } from '@/utils/marketCurrencyUtils';
import { CurrentValueSummaryProps } from '@/types/valueEvolution';

export function CurrentValueSummary({
  currentValue,
  peakValue,
  cumulativeLoS,
  currentSpend,
  netValueCreated,
  monthsToLaunch,
  currency,
}: CurrentValueSummaryProps) {
  const isPositiveNet = netValueCreated >= 0;
  const valueToSpendRatio = currentSpend > 0 ? (currentValue / currentSpend) : 0;
  
  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${currency === 'USD' ? '$' : '€'}${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${currency === 'USD' ? '$' : '€'}${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value, currency);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Current Asset Value */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Current Asset Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatValue(currentValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Risk-adjusted value today
          </p>
        </CardContent>
      </Card>

      {/* Peak Potential Value */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-green-500" />
            Peak Value at Launch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatValue(peakValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Technical Risk = 0%
          </p>
        </CardContent>
      </Card>

      {/* Cumulative LoS */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Percent className="h-4 w-4 text-orange-500" />
            Cumulative LoS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {cumulativeLoS.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Combined success probability
          </p>
        </CardContent>
      </Card>

      {/* Cumulative Spend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Cumulative Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatValue(currentSpend)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total invested to date
          </p>
        </CardContent>
      </Card>

      {/* Net Value Created */}
      <Card className={isPositiveNet ? 'border-green-500/30' : 'border-red-500/30'}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {isPositiveNet ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            Net Value Created
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositiveNet ? 'text-green-600' : 'text-red-600'}`}>
            {formatValue(netValueCreated)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isPositiveNet ? 'default' : 'destructive'} className="text-xs">
              {valueToSpendRatio.toFixed(2)}x Ratio
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Months to Launch */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Time to Launch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {monthsToLaunch > 0 ? `${monthsToLaunch} mo` : 'Launched'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {monthsToLaunch > 12 
              ? `${(monthsToLaunch / 12).toFixed(1)} years remaining`
              : monthsToLaunch > 0 
                ? 'Within next year'
                : 'Product is live'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
