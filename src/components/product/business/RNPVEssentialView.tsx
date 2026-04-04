import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, PieChart, Target, Calendar, Download, Loader2 } from "lucide-react";
import { HelpTooltip } from "@/components/product/device/sections/HelpTooltip";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatNumberWithCommas, parseFormattedNumber } from "@/utils/currencyUtils";

interface RNPVEssentialViewProps {
  portfolioResults: {
    rnpv: number;
    roi: number;
    totalCosts: number;
    totalRevenue: number;
    riskAdjustment: number;
    marketCount: number;
  };
  chartData: Array<{
    month: number;
    cumulativeCashFlow: number;
    phase?: string;
    year?: number;
  }>;
  breakeven: {
    month: number | null;
    years: number | null;
    display: string;
  };
  launchDate?: Date | null;
  currency?: string;
  // Essential inputs
  essentialInputs?: {
    monthlySales: number;
    unitPrice: number;
    developmentCosts: number;
    discountRate: number;
  };
  onEssentialInputChange?: (field: string, value: number) => void;
  budgetSource?: 'milestones' | 'saved' | 'manual';
  onGetFromBudget?: () => void;
  isLoadingBudget?: boolean;
}

export function RNPVEssentialView({ 
  portfolioResults, 
  chartData, 
  breakeven,
  launchDate,
  currency = 'USD',
  essentialInputs,
  onEssentialInputChange,
  budgetSource = 'manual',
  onGetFromBudget,
  isLoadingBudget = false
}: RNPVEssentialViewProps) {
  
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate peak annual revenue from chart data
  const peakRevenue = useMemo(() => {
    if (chartData.length === 0) return 0;
    
    // Group by year and sum
    const yearlyRevenues: Record<number, number> = {};
    chartData.forEach(d => {
      const year = d.year || Math.ceil(d.month / 12);
      if (d.cumulativeCashFlow > 0) {
        const prevMonth = chartData.find(p => p.month === d.month - 1);
        const monthlyRevenue = prevMonth 
          ? d.cumulativeCashFlow - prevMonth.cumulativeCashFlow 
          : d.cumulativeCashFlow;
        yearlyRevenues[year] = (yearlyRevenues[year] || 0) + Math.max(0, monthlyRevenue);
      }
    });
    
    return Math.max(...Object.values(yearlyRevenues), 0);
  }, [chartData]);

  const grossMargin = useMemo(() => {
    if (portfolioResults.totalRevenue <= 0) return 0;
    return ((portfolioResults.totalRevenue - portfolioResults.totalCosts) / portfolioResults.totalRevenue) * 100;
  }, [portfolioResults]);

  const launchMonth = useMemo(() => {
    const idx = chartData.findIndex(d => d.phase === 'revenue');
    return idx > 0 ? idx : null;
  }, [chartData]);

  const formattedChartData = useMemo(() => {
    return chartData.map(d => ({
      ...d,
      displayMonth: d.month,
      value: d.cumulativeCashFlow,
    }));
  }, [chartData]);

  const kpis = [
    {
      label: '5-Year NPV',
      value: formatCurrency(portfolioResults.rnpv),
      icon: DollarSign,
      color: portfolioResults.rnpv >= 0 ? 'text-green-600' : 'text-red-600',
      tooltip: 'Risk-adjusted Net Present Value of the project'
    },
    {
      label: 'Peak Revenue',
      value: formatCurrency(peakRevenue),
      icon: TrendingUp,
      color: 'text-blue-600',
      tooltip: 'Highest annual revenue projected'
    },
    {
      label: 'Gross Margin',
      value: formatPercentage(Math.max(0, grossMargin)),
      icon: PieChart,
      color: grossMargin >= 50 ? 'text-green-600' : 'text-orange-600',
      tooltip: 'Revenue minus costs as percentage of revenue'
    },
    {
      label: 'Total Investment',
      value: formatCurrency(portfolioResults.totalCosts),
      icon: Target,
      color: 'text-muted-foreground',
      tooltip: 'Total development and operational costs'
    },
    {
      label: 'Break-even',
      value: breakeven.display,
      icon: Calendar,
      color: breakeven.month ? 'text-blue-600' : 'text-orange-600',
      tooltip: 'Time to recover initial investment'
    },
  ];

  const handleInputChange = (field: string, rawValue: string) => {
    const numValue = parseFormattedNumber(rawValue);
    onEssentialInputChange?.(field, numValue);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-card/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <HelpTooltip content={kpi.tooltip} />
              </div>
              <div className={`text-lg font-bold ${kpi.color}`}>
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Essential Inputs Form */}
      {essentialInputs && onEssentialInputChange && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Inputs</CardTitle>
            <CardDescription>
              Key parameters for revenue and cost projections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Monthly Sales */}
              <div className="space-y-2">
                <Label htmlFor="monthlySales" className="text-sm">Monthly Units</Label>
                <Input
                  id="monthlySales"
                  type="text"
                  value={formatNumberWithCommas(essentialInputs.monthlySales)}
                  onChange={(e) => handleInputChange('monthlySales', e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Unit Price */}
              <div className="space-y-2">
                <Label htmlFor="unitPrice" className="text-sm">Unit Price ($)</Label>
                <Input
                  id="unitPrice"
                  type="text"
                  value={formatNumberWithCommas(essentialInputs.unitPrice)}
                  onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Development Costs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="developmentCosts" className="text-sm">Dev Costs ($)</Label>
                  {budgetSource === 'milestones' && (
                    <Badge variant="default" className="text-xs px-1.5 py-0">Budget</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="developmentCosts"
                    type="text"
                    value={formatNumberWithCommas(essentialInputs.developmentCosts)}
                    onChange={(e) => handleInputChange('developmentCosts', e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                  {onGetFromBudget && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={onGetFromBudget}
                      disabled={isLoadingBudget}
                      title="Get from Budget"
                    >
                      {isLoadingBudget ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Discount Rate */}
              <div className="space-y-2">
                <Label htmlFor="discountRate" className="text-sm">Discount Rate (%)</Label>
                <Input
                  id="discountRate"
                  type="number"
                  step="0.5"
                  value={essentialInputs.discountRate}
                  onChange={(e) => onEssentialInputChange('discountRate', parseFloat(e.target.value) || 0)}
                  placeholder="10"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lifecycle Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Product Lifecycle Cash Flow
            <Badge variant="secondary" className="ml-2">Essential View</Badge>
          </CardTitle>
          <CardDescription>
            Cumulative cash flow from development through commercialization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formattedChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedChartData}>
                  <defs>
                    <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="displayMonth" 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(month) => {
                      const year = Math.ceil(month / 12);
                      return month % 12 === 1 ? `Y${year}` : '';
                    }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                      if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toString();
                    }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Cumulative Cash Flow']}
                    labelFormatter={(month) => `Month ${month}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  
                  {launchMonth && (
                    <ReferenceLine 
                      x={launchMonth} 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      label={{ 
                        value: '🚀 Launch', 
                        position: 'top',
                        fontSize: 12,
                        fill: 'hsl(var(--primary))'
                      }}
                    />
                  )}
                  
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorPositive)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No cash flow data available. Enter revenue and cost projections to see the lifecycle chart.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground mb-1">Total Projected Revenue</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(portfolioResults.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {portfolioResults.marketCount} market{portfolioResults.marketCount !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground mb-1">Return on Investment</div>
            <div className={`text-2xl font-bold ${portfolioResults.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(portfolioResults.roi)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Risk-adjusted ({formatPercentage(portfolioResults.riskAdjustment)} risk factor)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
