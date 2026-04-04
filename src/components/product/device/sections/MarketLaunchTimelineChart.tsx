
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NPVCalculationResult } from '@/services/npvCalculationService';

interface MarketLaunchData {
  marketCode: string;
  marketName: string;
  launchDate: Date;
  color: string;
}

interface MarketLaunchTimelineChartProps {
  marketLaunches: MarketLaunchData[];
  selectedCurrency: string;
  currencySymbol: string;
  marketCalculations?: Record<string, NPVCalculationResult>;
}

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

export function MarketLaunchTimelineChart({ 
  marketLaunches, 
  selectedCurrency, 
  currencySymbol,
  marketCalculations = {}
}: MarketLaunchTimelineChartProps) {
  const timelineData = useMemo(() => {
    if (!marketLaunches.length) return [];

    // Sort launches by date
    const sortedLaunches = [...marketLaunches].sort((a, b) => 
      new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime()
    );

    // Find earliest date considering development phases
    let earliestDate = new Date(sortedLaunches[0].launchDate);
    
    // Check if we have NPV data with development phases
    for (const launch of sortedLaunches) {
      const marketCalc = marketCalculations[launch.marketCode];
      if (marketCalc) {
        // Get market input data to check development phase
        const devPhaseMonths = 12; // Default if not available
        
        // Calculate development start date based on launch date minus development phase
        const launchDate = new Date(launch.launchDate);
        const devStartDate = new Date(launchDate);
        devStartDate.setMonth(launchDate.getMonth() - devPhaseMonths);
        
        // Update earliest date if this development start is earlier
        if (devStartDate < earliestDate) {
          earliestDate = new Date(devStartDate);
        }
      }
    }
    
    // Move back 3 months from earliest date for better visualization
    earliestDate.setMonth(earliestDate.getMonth() - 3);
    
    // Create timeline spanning from earliest date to 24 months after last launch
    const lastLaunch = new Date(sortedLaunches[sortedLaunches.length - 1].launchDate);
    const endDate = new Date(lastLaunch);
    endDate.setMonth(endDate.getMonth() + 24);

    const data = [];
    const currentDate = new Date(earliestDate);

    let monthCounter = 0;
    while (currentDate <= endDate) {
      const monthData: any = {
        month: monthCounter,
        date: new Date(currentDate),
        dateLabel: currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }),
        cumulativeRevenue: 0,
        developmentInvestment: 0,
        totalDevInvestment: 0,
      };

      // Calculate development investment and cumulative revenue
      let totalRevenue = 0;
      let totalDevInvestment = 0;
      
      sortedLaunches.forEach(launch => {
        const launchDate = new Date(launch.launchDate);
        const isInRevenuePhase = currentDate >= launchDate;
        
        const marketCalc = marketCalculations[launch.marketCode];
        if (marketCalc && marketCalc.monthlyResults) {
          if (isInRevenuePhase) {
            // Market has launched, add its revenue
            const monthsSinceLaunch = Math.max(0, 
              (currentDate.getFullYear() - launchDate.getFullYear()) * 12 + 
              (currentDate.getMonth() - launchDate.getMonth())
            );
            
            if (monthsSinceLaunch < marketCalc.monthlyResults.length) {
              const monthData = marketCalc.monthlyResults[monthsSinceLaunch];
              totalRevenue += monthData ? monthData.cumulativeCashFlow : 0;
            }
          } else {
            // In development phase
            // Calculate months into development
            const monthsBeforeLaunch = Math.max(0, 
              (launchDate.getFullYear() - currentDate.getFullYear()) * 12 + 
              (launchDate.getMonth() - currentDate.getMonth())
            );
            
            const devPhaseMonths = 12; // Default if not specified
            
            if (monthsBeforeLaunch <= devPhaseMonths) {
              // Find the corresponding pre-revenue month in results
              const devPhaseIndex = devPhaseMonths - monthsBeforeLaunch;
              if (devPhaseIndex >= 0 && devPhaseIndex < marketCalc.monthlyResults.length) {
                const monthData = marketCalc.monthlyResults[devPhaseIndex];
                if (monthData && monthData.rndCosts > 0) {
                  totalDevInvestment += monthData.rndCosts;
                }
              }
            }
          }
        } else {
          // Fallback model if no NPV data
          if (isInRevenuePhase) {
            const monthsSinceLaunch = Math.max(0, 
              (currentDate.getFullYear() - launchDate.getFullYear()) * 12 + 
              (currentDate.getMonth() - launchDate.getMonth())
            );
            totalRevenue += monthsSinceLaunch * 10000 * (1 + Math.random() * 0.5);
          } else {
            // Simple linear development investment
            const monthsBeforeLaunch = Math.max(0, 
              (launchDate.getFullYear() - currentDate.getFullYear()) * 12 + 
              (launchDate.getMonth() - currentDate.getMonth())
            );
            if (monthsBeforeLaunch <= 12) {
              totalDevInvestment += (15000 / 12) * (12 - monthsBeforeLaunch);
            }
          }
        }
      });

      monthData.cumulativeRevenue = totalRevenue;
      monthData.developmentInvestment = totalDevInvestment;
      monthData.totalDevInvestment = totalDevInvestment;
      
      data.push(monthData);
      
      currentDate.setMonth(currentDate.getMonth() + 1);
      monthCounter++;
    }

    return data;
  }, [marketLaunches, marketCalculations]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const launchesThisMonth = marketLaunches.filter(launch => {
        const launchDate = new Date(launch.launchDate);
        return launchDate.getFullYear() === data.date.getFullYear() && 
               launchDate.getMonth() === data.date.getMonth();
      });

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
          <p className="font-medium text-sm">{data.dateLabel}</p>
          {launchesThisMonth.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-green-600 mb-1">Market Launches:</p>
              {launchesThisMonth.map(launch => (
                <Badge 
                  key={launch.marketCode} 
                  variant="outline" 
                  className="text-xs mr-1 mb-1"
                  style={{ borderColor: launch.color, color: launch.color }}
                >
                  {launch.marketName}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="mt-2 space-y-1">
            <p className="text-blue-600 font-semibold text-xs">
              Revenue: {currencySymbol}{formatCurrency(payload[0].value)}
            </p>
            
            {data.developmentInvestment > 0 && (
              <p className="text-purple-600 font-semibold text-xs">
                R&D Investment: {currencySymbol}{formatCurrency(data.developmentInvestment)}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!marketLaunches.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Market Launch Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No market launch dates configured</p>
            <p className="text-sm">Add launch dates in the Markets section to see the timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Market Launch Timeline & Revenue Impact</CardTitle>
        <p className="text-sm text-muted-foreground">
          Timeline showing market launches, development phases and revenue impact in {selectedCurrency}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {marketLaunches.map(launch => (
            <Badge 
              key={launch.marketCode} 
              variant="outline"
              className="text-xs"
              style={{ borderColor: launch.color, color: launch.color }}
            >
              {launch.marketName} - {new Date(launch.launchDate).toLocaleDateString()}
            </Badge>
          ))}
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
              
              {/* Development investment bars */}
              <Line
                type="monotone"
                dataKey="totalDevInvestment"
                name="R&D Investment"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              
              {/* Launch date reference lines */}
              {marketLaunches.map(launch => {
                const launchMonth = timelineData.findIndex(d => {
                  const dataDate = new Date(d.date);
                  const launchDate = new Date(launch.launchDate);
                  return dataDate.getFullYear() === launchDate.getFullYear() && 
                         dataDate.getMonth() === launchDate.getMonth();
                });
                
                if (launchMonth >= 0) {
                  return (
                    <ReferenceLine 
                      key={launch.marketCode}
                      x={timelineData[launchMonth].dateLabel}
                      stroke={launch.color}
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{ 
                        value: launch.marketCode,
                        position: 'top',
                        fill: launch.color,
                        fontSize: 10
                      }}
                    />
                  );
                }
                return null;
              })}
              
              <Line 
                type="monotone" 
                dataKey="cumulativeRevenue" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
