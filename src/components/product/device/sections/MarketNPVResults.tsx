
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NPVCalculationResult } from '@/services/npvCalculationService';
import { formatCurrency } from '@/utils/currencyUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

interface MarketNPVResultsProps {
  marketCode: string;
  marketName: string;
  result: NPVCalculationResult;
  selectedCurrency: string;
  currencySymbol: string;
}

export function MarketNPVResults({
  marketCode,
  marketName,
  result,
  selectedCurrency,
  currencySymbol
}: MarketNPVResultsProps) {
  
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Find launch month (when revenue starts)
  const launchMonth = result.monthlyResults.findIndex(month => month.revenue > 0);
  
  // Prepare chart data with phase information
  const chartData = result.monthlyResults.map((month, index) => ({
    month: month.month,
    cumulativeCashFlow: month.cumulativeCashFlow,
    revenue: month.revenue,
    costs: month.costs + month.rndCosts,
    netCashFlow: month.netCashFlow,
    isDevelopmentPhase: index < launchMonth
  }));

  // Calculate min/max values for better Y-axis scaling
  const minCashFlow = Math.min(...chartData.map(d => d.cumulativeCashFlow));
  const maxCashFlow = Math.max(...chartData.map(d => d.cumulativeCashFlow));
  const maxCosts = Math.max(...chartData.map(d => d.costs));
  
  // Ensure development costs are visible by adjusting domain
  const yAxisDomain = [
    Math.min(minCashFlow, -maxCosts * 0.1), // Show negative costs clearly
    Math.max(maxCashFlow, maxCosts * 0.1)
  ];

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{marketName} ({marketCode}) Results</CardTitle>
        <CardDescription className="text-xs">
          NPV Analysis Results with {result.monthlyResults.length} month forecast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500">Net Present Value</div>
            <div className="font-bold text-green-700">
              {currencySymbol}{formatNumber(result.npv)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500">Internal Rate of Return</div>
            <div className="font-bold text-blue-700">
              {formatPercentage(result.irr)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500">Break-Even</div>
            <div className="font-bold text-purple-700">
              {result.paybackPeriodMonths && result.paybackPeriodMonths > 0 
                ? `${result.paybackPeriodMonths} months` 
                : result.breakEvenMonths && result.breakEvenMonths > 0
                  ? `${result.breakEvenMonths} months`
                  : 'Never'}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500">Profit Margin</div>
            <div className="font-bold text-orange-700">
              {formatPercentage(result.averageAnnualProfitMargin)}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500">Total Revenue</div>
            <div className="font-bold">
              {currencySymbol}{formatNumber(result.totalRevenue)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500">Total Costs</div>
            <div className="font-bold">
              {currencySymbol}{formatNumber(result.totalCosts + result.totalRndCosts)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500">R&D Investment</div>
            <div className="font-bold">
              {currencySymbol}{formatNumber(result.totalRndCosts)}
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs text-gray-500">Total Cannibalization Loss</div>
            <div className="font-bold text-red-700">
              {currencySymbol}{formatNumber(result.totalCannibalizationLoss)}
            </div>
          </div>
        </div>

        <div className="h-60 w-full mt-4">
          <div className="mb-2 text-xs text-muted-foreground flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              Cumulative Cash Flow
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500 border-dashed border-t"></div>
              Revenue
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500 border-dashed border-t"></div>
              Total Costs (incl. R&D)
            </span>
            {launchMonth > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-orange-500"></div>
                Launch (Month {launchMonth + 1})
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              
              {/* Development phase background shading */}
              {launchMonth > 0 && (
                <ReferenceArea
                  x1={0}
                  x2={launchMonth}
                  fill="#fef3c7"
                  fillOpacity={0.3}
                  stroke="none"
                />
              )}
              
              {/* Zero reference line */}
              <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1} strokeDasharray="2 2" />
              
              {/* Launch date marker */}
              {launchMonth > 0 && (
                <ReferenceLine
                  x={launchMonth + 1}
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{ value: "Launch", position: "top", fontSize: 10 }}
                />
              )}
              
              <XAxis 
                dataKey="month" 
                label={{ value: 'Month', position: 'insideBottomRight', offset: 0 }}
                stroke="#6b7280"
              />
              <YAxis 
                domain={yAxisDomain}
                tickFormatter={(value) => `${currencySymbol}${formatNumber(value / 1000)}K`}
                stroke="#6b7280"
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${currencySymbol}${formatNumber(value)}`,
                  name
                ]}
                labelFormatter={(label) => `Month ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              
              {/* Costs line - enhanced visibility during development */}
              <Line 
                type="monotone" 
                dataKey="costs" 
                name="Total Costs (incl. R&D)"
                stroke="#ef4444"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
              
              {/* Revenue line */}
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                connectNulls={false}
              />
              
              {/* Cumulative cash flow - main line */}
              <Line 
                type="monotone" 
                dataKey="cumulativeCashFlow" 
                name="Cumulative Cash Flow"
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
