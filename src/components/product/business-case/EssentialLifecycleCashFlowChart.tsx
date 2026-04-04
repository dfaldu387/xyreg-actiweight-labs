import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, DollarSign, Clock, Percent } from 'lucide-react';
import { BudgetIntegrationService, PhaseBudgetData } from '@/services/enhanced-rnpv/budgetIntegrationService';
import { formatCurrency } from '@/utils/marketCurrencyUtils';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { format, addMonths } from 'date-fns';

interface MarketInputData {
  marketLaunchDate?: string | Date;
  forecastDuration?: number;
  monthlySalesForecast?: number;
  initialUnitPrice?: number;
  annualSalesForecastChange?: number;
  initialVariableCost?: number;
  rndWorkCosts?: number;
  discountRate?: number;
}

interface EssentialLifecycleCashFlowChartProps {
  productId: string;
  launchDate?: string | Date | null;
  marketInputData?: Record<string, MarketInputData>;
  selectedMarketCode?: string;  // Which market to prioritize
  className?: string;
  showFinancialSummary?: boolean; // Option to show/hide financial figures
}

interface CombinedChartDataPoint {
  label: string;
  phase?: string;
  cost?: number;
  revenue?: number;
  cumulative: number;
  type: 'dev' | 'launch' | 'revenue';
  isLaunch?: boolean;
}

interface FinancialMetrics {
  totalDevCosts: number;
  peakRevenue: number;
  breakEvenYear: number | null;
  grossMargin: number;
  fiveYearNPV: number;
}

export function EssentialLifecycleCashFlowChart({
  productId,
  launchDate,
  marketInputData,
  selectedMarketCode,
  className,
  showFinancialSummary = true // Default to showing financial summary
}: EssentialLifecycleCashFlowChartProps) {
  const [phaseBreakdown, setPhaseBreakdown] = useState<PhaseBudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load phase breakdown on mount
  useEffect(() => {
    const loadPhaseBreakdown = async () => {
      setIsLoading(true);
      try {
        const effectiveLaunchDate = launchDate ? new Date(launchDate) : undefined;
        const budgetSummary = await BudgetIntegrationService.getProductPhaseBudgetSummary(productId, effectiveLaunchDate);
        setPhaseBreakdown(budgetSummary.phaseBreakdown || []);
      } catch {
        // Error loading phase breakdown - chart will still render with manual costs
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      loadPhaseBreakdown();
    }
  }, [productId, launchDate]);

  // Extract inputs from first available market
  const inputs = useMemo(() => {
    if (!marketInputData) {
      return {
        launchDate: launchDate ? (typeof launchDate === 'string' ? launchDate : new Date(launchDate).toISOString().split('T')[0]) : '',
        forecastDurationYears: 5,
        monthlyUnits: 0,
        unitPrice: 0,
        annualGrowthPercent: 0,
        cogsPerUnit: 0,
        developmentCosts: 0,
      };
    }

    const marketKeys = Object.keys(marketInputData);
    // Prioritize the selected market, fall back to first available
    const targetKey = selectedMarketCode && marketKeys.includes(selectedMarketCode) 
      ? selectedMarketCode 
      : marketKeys[0];
    const firstMarketData = targetKey ? marketInputData[targetKey] : null;

    if (!firstMarketData) {
      return {
        launchDate: launchDate ? (typeof launchDate === 'string' ? launchDate : new Date(launchDate).toISOString().split('T')[0]) : '',
        forecastDurationYears: 5,
        monthlyUnits: 0,
        unitPrice: 0,
        annualGrowthPercent: 0,
        cogsPerUnit: 0,
        developmentCosts: 0,
      };
    }

    const rawLaunchDate = firstMarketData.marketLaunchDate || launchDate || '';
    const formattedLaunchDate = (() => {
      if (!rawLaunchDate) return '';
      const str = typeof rawLaunchDate === 'string' ? rawLaunchDate : new Date(rawLaunchDate).toISOString().split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      const parsed = new Date(str);
      return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
    })();

    return {
      launchDate: formattedLaunchDate,
      forecastDurationYears: Math.floor((firstMarketData.forecastDuration || 60) / 12),
      monthlyUnits: firstMarketData.monthlySalesForecast || 0,
      unitPrice: firstMarketData.initialUnitPrice || 0,
      annualGrowthPercent: firstMarketData.annualSalesForecastChange || 0,
      cogsPerUnit: firstMarketData.initialVariableCost || 0,
      developmentCosts: firstMarketData.rndWorkCosts || 0,
    };
  }, [marketInputData, launchDate]);

  // Build combined chart data with development phases + revenue projections
  const combinedChartData = useMemo((): CombinedChartDataPoint[] => {
    const data: CombinedChartDataPoint[] = [];
    const parsedLaunchDate = inputs.launchDate ? new Date(inputs.launchDate) : null;
    
    // Sort phases by start date
    const sortedPhases = [...phaseBreakdown]
      .filter(p => p.startDate && p.totalBudget > 0)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    
    let cumulativeCost = 0;
    
    // Add development phases if we have phase data with dates
    if (sortedPhases.length > 0) {
      sortedPhases.forEach((phase) => {
        cumulativeCost -= phase.totalBudget;
        const phaseDate = new Date(phase.startDate!);
        data.push({
          label: format(phaseDate, 'MMM yyyy'),
          phase: phase.phaseName,
          cost: -phase.totalBudget,
          cumulative: cumulativeCost,
          type: 'dev',
        });
      });
      
      // Add launch marker if we have a launch date
      if (parsedLaunchDate) {
        data.push({
          label: format(parsedLaunchDate, 'MMM yyyy'),
          phase: 'Market Launch',
          cumulative: cumulativeCost,
          type: 'launch',
          isLaunch: true,
        });
      }
    } else if (inputs.developmentCosts > 0) {
      // Fallback: show dev costs as single point at "Dev" if no phase breakdown
      cumulativeCost = -inputs.developmentCosts;
      data.push({
        label: 'Dev',
        phase: 'Development',
        cost: -inputs.developmentCosts,
        cumulative: cumulativeCost,
        type: 'dev',
      });
      
      if (parsedLaunchDate) {
        data.push({
          label: format(parsedLaunchDate, 'MMM yyyy'),
          phase: 'Market Launch',
          cumulative: cumulativeCost,
          type: 'launch',
          isLaunch: true,
        });
      }
    }

    // Add post-launch revenue years
    const annualUnits = inputs.monthlyUnits * 12;
    for (let year = 1; year <= inputs.forecastDurationYears; year++) {
      const growthMultiplier = Math.pow(1 + inputs.annualGrowthPercent / 100, year - 1);
      const yearlyUnits = annualUnits * growthMultiplier;
      const yearlyRevenue = yearlyUnits * inputs.unitPrice;
      const yearlyCogs = yearlyUnits * inputs.cogsPerUnit;
      const yearlyProfit = yearlyRevenue - yearlyCogs;
      
      cumulativeCost += yearlyProfit;
      
      // Use actual year labels if we have launch date, otherwise generic Y1, Y2
      const yearLabel = parsedLaunchDate 
        ? format(addMonths(parsedLaunchDate, year * 12), 'yyyy')
        : `Y${year}`;
      
      data.push({
        label: yearLabel,
        revenue: yearlyRevenue,
        cumulative: cumulativeCost,
        type: 'revenue',
      });
    }
    
    return data;
  }, [inputs, phaseBreakdown]);

  // Calculate financial metrics for summary display
  const financialMetrics = useMemo((): FinancialMetrics => {
    // Total development costs from phases or fallback
    const totalDevCosts = phaseBreakdown.reduce((sum, p) => sum + (p.totalBudget || 0), 0) || inputs.developmentCosts;
    
    // Calculate peak revenue and break-even
    const annualUnits = inputs.monthlyUnits * 12;
    let peakRevenue = 0;
    let cumulativeCash = -totalDevCosts;
    let breakEvenYear: number | null = null;
    
    for (let year = 1; year <= inputs.forecastDurationYears; year++) {
      const growthMultiplier = Math.pow(1 + inputs.annualGrowthPercent / 100, year - 1);
      const yearlyUnits = annualUnits * growthMultiplier;
      const yearlyRevenue = yearlyUnits * inputs.unitPrice;
      const yearlyCogs = yearlyUnits * inputs.cogsPerUnit;
      const yearlyProfit = yearlyRevenue - yearlyCogs;
      
      if (yearlyRevenue > peakRevenue) peakRevenue = yearlyRevenue;
      cumulativeCash += yearlyProfit;
      
      if (breakEvenYear === null && cumulativeCash >= 0) {
        breakEvenYear = year;
      }
    }
    
    // Gross margin
    const grossMargin = inputs.unitPrice > 0 
      ? ((inputs.unitPrice - inputs.cogsPerUnit) / inputs.unitPrice) * 100 
      : 0;
    
    return {
      totalDevCosts,
      peakRevenue,
      breakEvenYear,
      grossMargin,
      fiveYearNPV: cumulativeCash, // Simplified NPV (cumulative cash at end)
    };
  }, [inputs, phaseBreakdown]);

  // Find the launch index for reference line
  const launchIndex = combinedChartData.findIndex(d => d.isLaunch);

  // Get market code for currency formatting
  const currencyCode = selectedMarketCode || 'US';

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Don't render if no data
  if (combinedChartData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No revenue forecast data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-primary" />
          <span>Product Lifecycle Cash Flow</span>
          <Badge variant="outline" className="text-[9px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
            Essential
          </Badge>
          {phaseBreakdown.length > 0 && (
            <Badge variant="outline" className="text-[9px]">
              With Timeline
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-1 sm:px-4 pb-3 space-y-4">
        {/* Financial Summary Grid */}
        {showFinancialSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-2 sm:px-0">
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                Dev Costs
              </div>
              <p className="text-sm sm:text-base font-bold text-red-600">
                {formatCurrency(financialMetrics.totalDevCosts, currencyCode)}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Peak Revenue
              </div>
              <p className="text-sm sm:text-base font-bold">
                {formatCurrency(financialMetrics.peakRevenue, currencyCode)}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Percent className="h-3 w-3" />
                Gross Margin
              </div>
              <p className="text-sm sm:text-base font-bold">
                {financialMetrics.grossMargin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Break-even
              </div>
              <p className="text-sm sm:text-base font-bold">
                {financialMetrics.breakEvenYear ? `Year ${financialMetrics.breakEvenYear}` : 'N/A'}
              </p>
            </div>
          </div>
        )}
        <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDevCostEssential" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorRevenueEssential" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCumulativeEssential" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={45}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => {
                  const absVal = Math.abs(v);
                  if (absVal >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                  if (absVal >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                  return `$${v}`;
                }}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                width={50}
              />
              {/* Zero reference line for break-even */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              {/* Launch marker vertical line */}
              {launchIndex >= 0 && (
                <ReferenceLine 
                  x={combinedChartData[launchIndex]?.label}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ 
                    value: '🚀 Launch', 
                    position: 'top',
                    fill: 'hsl(var(--primary))',
                    fontSize: 11,
                    fontWeight: 600
                  }}
                />
              )}
              <Tooltip 
                formatter={(value: number, name: string) => {
                  const formattedValue = formatCurrency(Math.abs(value), 'USD');
                  if (name === 'cost') return [`-${formattedValue}`, 'Development Cost'];
                  if (name === 'revenue') return [formattedValue, 'Annual Revenue'];
                  return [value >= 0 ? formattedValue : `-${formattedValue}`, 'Cumulative Cash'];
                }}
                labelFormatter={(label, payload) => {
                  const dataPoint = payload?.[0]?.payload as CombinedChartDataPoint;
                  if (dataPoint?.phase) {
                    return `${dataPoint.phase} (${label})`;
                  }
                  return label;
                }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              {/* Development costs (negative) */}
              <Area
                type="monotone"
                dataKey="cost"
                stroke="hsl(0 84% 60%)"
                fill="url(#colorDevCostEssential)"
                strokeWidth={2}
                name="cost"
                connectNulls={false}
              />
              {/* Revenue */}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#colorRevenueEssential)"
                strokeWidth={2}
                name="revenue"
                connectNulls={false}
              />
              {/* Cumulative cash flow */}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(142 76% 36%)"
                fill="url(#colorCumulativeEssential)"
                strokeWidth={2}
                name="cumulative"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs">
          {phaseBreakdown.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
              <span className="text-muted-foreground">Dev Costs</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
            <span className="text-muted-foreground">Cumulative</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
