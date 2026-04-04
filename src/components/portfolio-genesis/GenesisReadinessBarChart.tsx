import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DeviceGenesisMetrics } from '@/hooks/usePortfolioGenesisMetrics';
import { useTranslation } from '@/hooks/useTranslation';

interface GenesisReadinessBarChartProps {
  devices: DeviceGenesisMetrics[];
}

export function GenesisReadinessBarChart({ devices }: GenesisReadinessBarChartProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  const sortedDevices = [...devices].sort((a, b) => b.readinessPercentage - a.readinessPercentage);

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'hsl(var(--chart-2))'; // emerald
    if (percentage >= 50) return 'hsl(var(--chart-4))'; // amber
    return 'hsl(var(--destructive))'; // red
  };

  const handleBarClick = (data: any) => {
    if (data?.productId) {
      navigate(`/app/product/${data.productId}/business-case?tab=venture-blueprint`);
    }
  };

  const chartData = sortedDevices.map(d => ({
    name: d.productName.length > 20 ? d.productName.slice(0, 20) + '...' : d.productName,
    fullName: d.productName,
    readiness: d.readinessPercentage,
    productId: d.productId,
    deviceClass: d.deviceClass,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{lang('portfolioGenesis.investorReadinessByDevice')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              onClick={(e) => e?.activePayload?.[0]?.payload && handleBarClick(e.activePayload[0].payload)}
            >
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {lang('portfolioGenesis.readiness')}: <span className="font-semibold">{data.readiness}%</span>
                        </p>
                        {data.deviceClass && (
                          <Badge variant="outline" className="mt-1">{data.deviceClass}</Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">{lang('portfolioGenesis.clickToViewGenesis')}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="readiness" 
                cursor="pointer"
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.readiness)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
