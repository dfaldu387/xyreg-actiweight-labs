
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { NPVCalculationResult } from '@/services/npvCalculationService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CumulativeNPVChartProps {
  marketCalculations: Record<string, NPVCalculationResult>;
  selectedCurrency: string;
  currencySymbol: string;
}

// Colors for different markets
const MARKET_COLORS = {
  'EU': '#3b82f6',
  'US': '#ef4444', 
  'USA': '#ef4444',
  'CA': '#10b981',
  'AU': '#f59e0b',
  'JP': '#8b5cf6',
  'BR': '#06b6d4',
  'CN': '#ec4899',
  'IN': '#84cc16',
  'UK': '#6366f1',
  'CH': '#14b8a6',
  'KR': '#f97316'
};

export function CumulativeNPVChart({ 
  marketCalculations, 
  selectedCurrency, 
  currencySymbol 
}: CumulativeNPVChartProps) {
  const [activeTab, setActiveTab] = React.useState('cumulative');
  
  const combinedData = useMemo(() => {
    const allMarkets = Object.keys(marketCalculations);
    if (allMarkets.length === 0) return [];

    // Find the maximum duration across all markets
    const maxDuration = Math.max(
      ...allMarkets.map(market => marketCalculations[market].monthlyResults.length)
    );

    // Create combined data for each month
    const combined = [];
    for (let month = 0; month < maxDuration; month++) {
      const dataPoint: any = { month };
      
      // Aggregate data by month for each market
      let totalCumulativeNPV = 0;
      let totalRevenue = 0;
      let totalCosts = 0;
      let totalRndCosts = 0;
      
      allMarkets.forEach(market => {
        const monthData = marketCalculations[market].monthlyResults[month];
        if (monthData) {
          // Add data for individual market
          dataPoint[`${market}_npv`] = monthData.cumulativeCashFlow;
          dataPoint[`${market}_revenue`] = monthData.revenue;
          dataPoint[`${market}_costs`] = monthData.costs;
          dataPoint[`${market}_rndCosts`] = monthData.rndCosts;
          
          // Add to totals
          totalCumulativeNPV += monthData.cumulativeCashFlow;
          totalRevenue += monthData.revenue;
          totalCosts += monthData.costs;
          totalRndCosts += monthData.rndCosts;
        }
      });
      
      // Add totals to data point
      dataPoint.cumulativeNPV = totalCumulativeNPV;
      dataPoint.revenue = totalRevenue;
      dataPoint.costs = totalCosts;
      dataPoint.rndCosts = totalRndCosts;
      dataPoint.netCashFlow = totalRevenue - totalCosts - totalRndCosts;
      dataPoint.year = Math.floor(month / 12) + 1;
      dataPoint.monthInYear = ((month % 12) + 1);
      dataPoint.monthLabel = `Y${dataPoint.year}M${dataPoint.monthInYear}`;
      
      combined.push(dataPoint);
    }

    return combined;
  }, [marketCalculations]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sortedMarketData = payload.sort((a: any, b: any) => b.value - a.value);
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm">
          <p className="font-medium">Month {label}</p>
          <p className="text-sm text-gray-600">
            Year {data.year}, Month {data.monthInYear}
          </p>
          <div className="border-t border-gray-100 my-2 pt-2">
            {activeTab === 'cumulative' ? (
              sortedMarketData.map((entry: any) => (
                <div key={entry.dataKey} className="flex justify-between text-sm py-0.5">
                  <span style={{ color: entry.color }}>{entry.name}:</span>
                  <span className="font-medium">{currencySymbol}{formatCurrency(entry.value)}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Revenue:</span>
                  <span className="font-medium">{currencySymbol}{formatCurrency(data.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">Operating Costs:</span>
                  <span className="font-medium">{currencySymbol}{formatCurrency(data.costs)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">R&D Costs:</span>
                  <span className="font-medium">{currencySymbol}{formatCurrency(data.rndCosts)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium pt-1 border-t">
                  <span>Net Cash Flow:</span>
                  <span>{currencySymbol}{formatCurrency(data.netCashFlow)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    let totalNPV = 0;
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalRndCosts = 0;
    let weightedIRR = 0;
    let totalInitialInvestment = 0;
    
    Object.entries(marketCalculations).forEach(([marketCode, result]) => {
      totalNPV += result.npv;
      totalRevenue += result.totalRevenue;
      totalCosts += result.totalCosts;
      totalRndCosts += result.totalRndCosts;
      
      // Calculate weighted IRR based on market NPV contribution
      weightedIRR += result.irr * (result.npv / (totalNPV || 1));
      
      // Estimate initial investment from negative cash flows at start
      const initialMonths = result.monthlyResults.slice(0, 12);
      const initialInvestment = initialMonths.reduce((sum, m) => 
        m.netCashFlow < 0 ? sum + Math.abs(m.netCashFlow) : sum, 0);
      totalInitialInvestment += initialInvestment;
    });
    
    // Find break-even month in combined data
    const breakEvenMonth = combinedData.findIndex(d => d.cumulativeNPV >= 0) + 1;
    
    return {
      totalNPV,
      totalRevenue,
      totalCosts,
      totalRndCosts,
      totalProfit: totalRevenue - totalCosts - totalRndCosts,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts - totalRndCosts) / totalRevenue) * 100 : 0,
      weightedIRR,
      breakEvenMonth: breakEvenMonth || 0,
      totalInitialInvestment
    };
  }, [marketCalculations, combinedData]);

  if (combinedData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Portfolio Financial Analysis</CardTitle>
          <div className="flex gap-2">
            {Object.keys(marketCalculations).map(marketCode => (
              <Badge 
                key={marketCode}
                variant="outline"
                className="text-xs"
                style={{ 
                  borderColor: MARKET_COLORS[marketCode as keyof typeof MARKET_COLORS] || '#6b7280',
                  color: MARKET_COLORS[marketCode as keyof typeof MARKET_COLORS] || '#6b7280'
                }}
              >
                {marketCode}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          <div className="p-2 bg-gray-50 rounded text-center">
            <p className="text-xs text-gray-500">Portfolio NPV</p>
            <p className="font-bold text-green-600">
              {currencySymbol}{formatCurrency(portfolioStats.totalNPV)}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded text-center">
            <p className="text-xs text-gray-500">Portfolio IRR</p>
            <p className="font-bold text-blue-600">
              {portfolioStats.weightedIRR.toFixed(2)}%
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded text-center">
            <p className="text-xs text-gray-500">Break-even</p>
            <p className="font-bold text-purple-600">
              {portfolioStats.breakEvenMonth} months
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded text-center">
            <p className="text-xs text-gray-500">Profit Margin</p>
            <p className="font-bold text-amber-600">
              {portfolioStats.profitMargin.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="cumulative">Cumulative NPV</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow Components</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cumulative" className="mt-0">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickLine={{ stroke: '#e0e0e0' }}
                    label={{ value: 'Month', position: 'insideBottomRight', offset: 0 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickLine={{ stroke: '#e0e0e0' }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                  
                  {/* Total NPV line */}
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeNPV" 
                    name="Total Portfolio NPV"
                    stroke="#000000" 
                    strokeWidth={2}
                    dot={false}
                  />
                  
                  {/* Individual market lines */}
                  {Object.keys(marketCalculations).map(marketCode => (
                    <Line 
                      key={marketCode}
                      type="monotone" 
                      dataKey={`${marketCode}_npv`}
                      name={marketCode}
                      stroke={MARKET_COLORS[marketCode as keyof typeof MARKET_COLORS] || '#6b7280'}
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="cashflow" className="mt-0">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickLine={{ stroke: '#e0e0e0' }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                  
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="costs" 
                    name="Operating Costs"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="rndCosts" 
                    name="R&D Costs"
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                  />
                  
                  <Line 
                    type="monotone" 
                    dataKey="netCashFlow" 
                    name="Net Cash Flow"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
