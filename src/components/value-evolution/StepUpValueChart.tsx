import React, { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { format } from 'date-fns';
import { StepUpValueChartProps, ValueEvolutionDataPoint } from '@/types/valueEvolution';

interface ChartDataPoint {
  monthIndex: number;
  label: string;
  assetValue: number;
  cumulativeSpend: number;
  phaseName: string;
  isPhaseComplete: boolean;
  isLaunchPoint: boolean;
  cumulativeLoS: number;
}

export function StepUpValueChart({
  dataPoints,
  inflectionPoints,
  currentValue,
  peakValue,
  launchDate,
  ipExpiryDate,
  currentDate,
  currency,
}: StepUpValueChartProps) {
  // Transform data points for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    return dataPoints.map((dp) => ({
      monthIndex: dp.monthIndex,
      label: dp.label,
      assetValue: dp.assetValue,
      cumulativeSpend: dp.cumulativeSpend,
      phaseName: dp.phaseName,
      isPhaseComplete: dp.isPhaseComplete,
      isLaunchPoint: dp.isLaunchPoint,
      cumulativeLoS: dp.cumulativeLoS,
    }));
  }, [dataPoints]);

  // Find launch month index
  const launchMonthIndex = useMemo(() => {
    const launchPoint = dataPoints.find((dp) => dp.isLaunchPoint);
    return launchPoint?.monthIndex ?? 0;
  }, [dataPoints]);

  // Find current month index
  const currentMonthIndex = useMemo(() => {
    const today = currentDate;
    const point = dataPoints.find((dp) => {
      const dpMonth = format(dp.timestamp, 'yyyy-MM');
      const todayMonth = format(today, 'yyyy-MM');
      return dpMonth === todayMonth;
    });
    return point?.monthIndex ?? 0;
  }, [dataPoints, currentDate]);

  // Format currency for axis/tooltip
  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${currency === 'USD' ? '$' : '€'}${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${currency === 'USD' ? '$' : '€'}${(value / 1000).toFixed(0)}K`;
    }
    return `${currency === 'USD' ? '$' : '€'}${value.toFixed(0)}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload as ChartDataPoint;
    if (!data) return null;

    const isPreLaunch = data.monthIndex < launchMonthIndex;
    const isLaunch = data.isLaunchPoint;

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
        <div className="font-semibold mb-2">{data.label}</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Asset Value:</span>
            <span className="font-medium text-primary">{formatValue(data.assetValue)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cumulative Spend:</span>
            <span className="font-medium text-red-500">{formatValue(data.cumulativeSpend)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Phase:</span>
            <span className="font-medium">{data.phaseName}</span>
          </div>
          {isPreLaunch && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Cumulative LoS:</span>
              <span className="font-medium text-orange-500">{data.cumulativeLoS.toFixed(1)}%</span>
            </div>
          )}
          {isLaunch && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-green-500 font-semibold">🎯 Peak Value • Technical Risk: 0%</span>
            </div>
          )}
          {data.isPhaseComplete && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-green-500 font-semibold">✓ Phase Complete - LoS Retired</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    const maxValue = Math.max(peakValue, ...chartData.map((d) => d.cumulativeSpend));
    return [0, Math.ceil(maxValue * 1.1)];
  }, [peakValue, chartData]);

  // X-axis tick formatter - show every 12 months
  const xAxisTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let i = 0; i < chartData.length; i += 12) {
      ticks.push(i);
    }
    return ticks;
  }, [chartData]);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="assetValueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

          <XAxis
            dataKey="monthIndex"
            tickFormatter={(value) => {
              const point = chartData.find((d) => d.monthIndex === value);
              return point?.label?.split(' ')[1] || ''; // Just year
            }}
            ticks={xAxisTicks}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />

          <YAxis
            tickFormatter={formatValue}
            domain={yDomain}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Sunk Cost Overlay - Gray Area (bottom layer) */}
          <Area
            type="monotone"
            dataKey="cumulativeSpend"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            fill="url(#spendGradient)"
            fillOpacity={1}
            name="Cumulative Spend"
          />

          {/* Asset Value Curve - Blue/Teal Area + Line (top layer) */}
          <Area
            type="stepAfter"
            dataKey="assetValue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#assetValueGradient)"
            fillOpacity={1}
            name="Asset Value"
          />

          {/* Today marker - Yellow dashed vertical line */}
          <ReferenceLine
            x={currentMonthIndex}
            stroke="#eab308"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{
              value: 'Today',
              position: 'top',
              fill: '#eab308',
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          {/* Launch marker - Green vertical line */}
          <ReferenceLine
            x={launchMonthIndex}
            stroke="#22c55e"
            strokeWidth={2}
            label={{
              value: 'Launch',
              position: 'top',
              fill: '#22c55e',
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          {/* IP Expiry marker - Red vertical line */}
          <ReferenceLine
            x={chartData.length - 1}
            stroke="#ef4444"
            strokeWidth={2}
            label={{
              value: 'IP Expiry',
              position: 'top',
              fill: '#ef4444',
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          {/* Phase completion dots */}
          {inflectionPoints
            .filter((ip) => ip.isComplete && ip.completionDate)
            .map((ip) => {
              const point = chartData.find(
                (d) => d.phaseName === ip.phaseName && d.isPhaseComplete
              );
              if (!point) return null;

              return (
                <ReferenceDot
                  key={ip.phaseId}
                  x={point.monthIndex}
                  y={point.assetValue}
                  r={6}
                  fill="#22c55e"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
