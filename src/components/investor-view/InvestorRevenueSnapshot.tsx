import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, DollarSign, Percent, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/marketCurrencyUtils';

interface InvestorRevenueSnapshotProps {
  npvData?: {
    npv: number;
    marketInputData?: Record<string, any>;
  } | null;
  currency?: string;
}

interface ProjectionPoint {
  year: number;
  revenue: number;
}

export function InvestorRevenueSnapshot({ npvData, currency = 'USD' }: InvestorRevenueSnapshotProps) {
  // Calculate summary metrics from NPV data
  const metrics = useMemo(() => {
    if (!npvData?.marketInputData) {
      return null;
    }

    const marketKeys = Object.keys(npvData.marketInputData);
    if (marketKeys.length === 0) return null;

    const firstMarket = npvData.marketInputData[marketKeys[0]];
    if (!firstMarket) return null;

    const monthlyUnits = firstMarket.monthlySalesForecast || 0;
    const unitPrice = firstMarket.initialUnitPrice || 0;
    const annualGrowth = firstMarket.annualSalesForecastChange || 0;
    const cogsPerUnit = firstMarket.initialVariableCost || 0;
    const forecastYears = Math.floor((firstMarket.forecastDuration || 60) / 12);
    const developmentCosts = firstMarket.rndWorkCosts || 0;

    // Calculate projections
    const annualUnits = monthlyUnits * 12;
    const projections: ProjectionPoint[] = [];
    let cumulativeCashFlow = -developmentCosts;
    let peakRevenue = 0;
    let breakEvenYear: number | null = null;

    for (let year = 1; year <= forecastYears; year++) {
      const growthMultiplier = Math.pow(1 + annualGrowth / 100, year - 1);
      const yearlyUnits = annualUnits * growthMultiplier;
      const yearlyRevenue = yearlyUnits * unitPrice;
      const yearlyCogs = yearlyUnits * cogsPerUnit;
      const yearlyProfit = yearlyRevenue - yearlyCogs;

      projections.push({
        year,
        revenue: yearlyRevenue,
      });

      cumulativeCashFlow += yearlyProfit;

      if (yearlyRevenue > peakRevenue) {
        peakRevenue = yearlyRevenue;
      }

      if (breakEvenYear === null && cumulativeCashFlow >= 0) {
        breakEvenYear = year;
      }
    }

    const grossMargin = unitPrice > 0 ? ((unitPrice - cogsPerUnit) / unitPrice) * 100 : 0;

    return {
      npv: npvData.npv,
      peakRevenue,
      grossMargin,
      breakEvenYear,
      projections,
    };
  }, [npvData]);

  if (!metrics) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Revenue Projection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              5-Year NPV
            </div>
            <p className={`text-lg font-bold ${metrics.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.npv, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Peak Revenue
            </div>
            <p className="text-lg font-bold">
              {formatCurrency(metrics.peakRevenue, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Percent className="h-3 w-3" />
              Gross Margin
            </div>
            <p className="text-lg font-bold">
              {metrics.grossMargin.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Break-even
            </div>
            <p className="text-lg font-bold">
              {metrics.breakEvenYear ? `Year ${metrics.breakEvenYear}` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Mini Chart */}
        {metrics.projections.length > 0 && (
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.projections}>
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <Badge variant="outline" className="w-full justify-center text-xs">
          Based on {metrics.projections.length}-year forecast
        </Badge>
      </CardContent>
    </Card>
  );
}
