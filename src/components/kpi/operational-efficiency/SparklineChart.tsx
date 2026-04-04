import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: Array<{ period: string; value: number }>;
  color?: string;
  height?: number;
}

export function SparklineChart({ 
  data, 
  color = "hsl(var(--primary))", 
  height = 40 
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-10 w-20 bg-muted rounded opacity-50" />;
  }

  // Determine trend color
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const isUpward = lastValue > firstValue;
  const trendColor = isUpward 
    ? "hsl(var(--success))" 
    : lastValue < firstValue 
      ? "hsl(var(--destructive))" 
      : color;

  return (
    <div className="w-20 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}