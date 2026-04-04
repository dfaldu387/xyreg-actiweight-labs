import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, AlertTriangle, Info, Calendar, Clock } from "lucide-react";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { getMarketCurrency, formatCurrency } from "@/utils/marketCurrencyUtils";

interface MarketResult {
  npv: number;
  rnpv: number;
  totalRevenue: number;
  totalCosts: number;
  riskAdjustment: number;
  roi: number;
  cannibalizationImpact: number;
  affectedProductsCount: number;
  marketCode: string;
  marketName: string;
  paybackPeriodMonths?: number;
  npvBreakEvenMonths?: number;
  breakEvenMonths?: number; // Legacy field
  monthlyResults: Array<{
    month: number;
    year: number;
    revenue: number;
    costs: number;
    netCashFlow: number;
    cumulativeCashFlow: number;
    cannibalizationLoss: number;
  }>;
}

interface MarketResultsViewProps {
  market: EnhancedProductMarket;
  result: MarketResult;
}

export function MarketResultsView({ market, result }: MarketResultsViewProps) {
  const currency = getMarketCurrency(market.code);

  const formatCurrencyValue = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return `${currency.symbol}0`;
    return formatCurrency(value, market.code);
  };

  const formatPercentage = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format time period display
  const formatTimePeriod = (months: number) => {
    if (months < 0) return 'Never';
    if (months === 0) return 'Immediate';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    } else if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
      return `${years}y ${remainingMonths}m`;
    }
  };

  const chartData = result.monthlyResults?.map(month => ({
    month: month.month,
    year: month.year,
    revenue: month.revenue,
    costs: month.costs,
    cumulativeCashFlow: month.cumulativeCashFlow,
    netCashFlow: month.netCashFlow
  })) || [];

  // Determine payback metrics
  const paybackPeriod = result.paybackPeriodMonths ?? result.breakEvenMonths ?? -1;
  const npvBreakeven = result.npvBreakEvenMonths ?? -1;

  return (
    <div className="space-y-6">
      {/* Market Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              rNPV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${result.rnpv > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrencyValue(result.rnpv)}
            </div>
            <p className="text-xs text-muted-foreground">risk-adjusted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${result.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(result.roi)}
            </div>
            <p className="text-xs text-muted-foreground">return on investment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Risk Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">
              {formatPercentage(result.riskAdjustment)}
            </div>
            <p className="text-xs text-muted-foreground">total risk</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatCurrencyValue(result.totalCosts)}
            </div>
            <p className="text-xs text-muted-foreground">required investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakeven Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cash Payback Period
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Time to recover nominal cash investment (undiscounted). This shows when cumulative cash flow becomes positive, but doesn't account for the time value of money.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${paybackPeriod > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatTimePeriod(paybackPeriod)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paybackPeriod > 0 ? 'nominal recovery' : 'no nominal recovery'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              NPV Breakeven
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Time when cumulative discounted cash flow becomes positive. This accounts for the time value of money and represents true economic breakeven.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${npvBreakeven > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatTimePeriod(npvBreakeven)}
            </div>
            <p className="text-xs text-muted-foreground">
              {npvBreakeven > 0 ? 'economic breakeven' : result.rnpv < 0 ? 'NPV negative' : 'beyond forecast'}
            </p>
            {paybackPeriod > 0 && npvBreakeven < 0 && result.rnpv < 0 && (
              <div className="mt-2 flex items-start gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>Cash recovers but project destroys value due to time value of money</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Total Revenue:</span>
              <span className="font-medium">{formatCurrencyValue(result.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Costs:</span>
              <span className="font-medium">{formatCurrencyValue(result.totalCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Net Profit:</span>
              <span className={`font-medium ${(result.totalRevenue - result.totalCosts) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyValue(result.totalRevenue - result.totalCosts)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cannibalization Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Impact Value:</span>
              <span className="font-medium text-orange-600">{formatCurrencyValue(result.cannibalizationImpact)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Affected Devices:</span>
              <Badge variant="outline">{result.affectedProductsCount}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}