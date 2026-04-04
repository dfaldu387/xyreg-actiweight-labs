import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DevelopmentRNPVResult } from '@/services/developmentRNPVService';

interface RNPVTimelineChartProps {
  results: DevelopmentRNPVResult;
  currency?: string;
  currencySymbol?: string;
}

export function RNPVTimelineChart({ 
  results, 
  currency = 'USD',
  currencySymbol = '$'
}: RNPVTimelineChartProps) {
  
  const timelineData = useMemo(() => {
    if (!results) return [];

    // Create timeline data based on the rNPV results
    const data = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6); // Start 6 months before today
    
    // Generate 36 months of data (3 years)
    for (let month = 0; month < 36; month++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + month);
      
      const monthData = {
        month,
        date: new Date(currentDate),
        dateLabel: currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }),
        // Development phase (first 18 months)
        developmentCosts: month < 18 ? results.scenarios.likely.developmentCosts / 18 : 0,
        // Revenue phase (after month 18)
        monthlyRevenue: month >= 18 ? results.scenarios.likely.totalRevenue / (36 - 18) : 0,
        cumulativeRevenue: month >= 18 ? 
          ((month - 17) * results.scenarios.likely.totalRevenue / (36 - 18)) : 0,
        // Risk-adjusted values
        riskAdjustedRevenue: month >= 18 ? 
          ((month - 17) * results.scenarios.likely.totalRevenue * results.milestoneImpact.totalLoA / (36 - 18)) : 0,
        netCashFlow: 0
      };
      
      // Calculate net cash flow (revenue - development costs)
      monthData.netCashFlow = monthData.monthlyRevenue - monthData.developmentCosts;
      
      data.push(monthData);
    }

    return data;
  }, [results]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
          <p className="font-medium text-sm">{data.dateLabel}</p>
          
          <div className="mt-2 space-y-1">
            {data.developmentCosts > 0 && (
              <p className="text-red-600 font-semibold text-xs">
                Development: -{currencySymbol}{formatCurrency(data.developmentCosts)}
              </p>
            )}
            
            {data.monthlyRevenue > 0 && (
              <p className="text-blue-600 font-semibold text-xs">
                Revenue: {currencySymbol}{formatCurrency(data.monthlyRevenue)}
              </p>
            )}
            
            {data.riskAdjustedRevenue > 0 && (
              <p className="text-green-600 font-semibold text-xs">
                Risk-Adjusted: {currencySymbol}{formatCurrency(data.riskAdjustedRevenue)}
              </p>
            )}
            
            <p className={`font-semibold text-xs ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Net: {data.netCashFlow >= 0 ? '' : '-'}{currencySymbol}{formatCurrency(data.netCashFlow)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const launchMonth = timelineData.findIndex(d => d.monthlyRevenue > 0);
  const launchDate = launchMonth >= 0 ? timelineData[launchMonth].dateLabel : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">rNPV Timeline & Revenue Impact</CardTitle>
        <p className="text-sm text-muted-foreground">
          Timeline showing development phases, market launch and risk-adjusted revenue in {currency}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="text-xs border-red-500 text-red-500">
            Development Phase
          </Badge>
          <Badge variant="outline" className="text-xs border-blue-500 text-blue-500">
            Revenue Phase
          </Badge>
          {launchDate && (
            <Badge variant="outline" className="text-xs border-green-500 text-green-500">
              Launch: {launchDate}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs border-purple-500 text-purple-500">
            Success Rate: {(results.milestoneImpact.totalLoA * 100).toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickLine={{ stroke: '#e0e0e0' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickLine={{ stroke: '#e0e0e0' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
              
              {/* Launch date reference line */}
              {launchDate && (
                <ReferenceLine 
                  x={launchDate}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{ 
                    value: 'Launch',
                    position: 'top',
                    fill: '#10b981',
                    fontSize: 10
                  }}
                />
              )}
              
              {/* Development costs (negative) */}
              <Line
                type="monotone"
                dataKey="developmentCosts"
                name="Development Costs"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
              
              {/* Revenue */}
              <Line 
                type="monotone" 
                dataKey="monthlyRevenue" 
                name="Monthly Revenue"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              
              {/* Risk-adjusted revenue */}
              <Line 
                type="monotone" 
                dataKey="riskAdjustedRevenue" 
                name="Risk-Adjusted Revenue"
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary metrics */}
        <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {currencySymbol}{formatCurrency(results.scenarios.likely.developmentCosts)}
            </div>
            <div className="text-xs text-muted-foreground">Total Dev Costs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {currencySymbol}{formatCurrency(results.scenarios.likely.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">Projected Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {currencySymbol}{formatCurrency(results.scenarios.likely.rnpv)}
            </div>
            <div className="text-xs text-muted-foreground">Risk-Adjusted NPV</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {(results.milestoneImpact.totalLoA * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Success Probability</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}