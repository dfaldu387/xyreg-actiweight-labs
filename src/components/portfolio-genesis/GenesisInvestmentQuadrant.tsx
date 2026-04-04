import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { DeviceGenesisMetrics } from '@/hooks/usePortfolioGenesisMetrics';
import { Target } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface GenesisInvestmentQuadrantProps {
  devices: DeviceGenesisMetrics[];
}

export function GenesisInvestmentQuadrant({ devices }: GenesisInvestmentQuadrantProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  const chartData = devices.map(device => ({
    x: device.readinessPercentage,
    y: device.viabilityScore || 0,
    name: device.productName,
    productId: device.productId,
    phase: device.lifecyclePhase,
    tam: device.tamValue,
  }));

  const getQuadrant = (x: number, y: number) => {
    if (x >= 50 && y >= 50) return { label: lang('portfolioGenesis.highPotential'), color: 'hsl(var(--chart-2))' };
    if (x < 50 && y >= 50) return { label: lang('portfolioGenesis.emerging'), color: 'hsl(var(--chart-4))' };
    if (x >= 50 && y < 50) return { label: lang('portfolioGenesis.needsWork'), color: 'hsl(var(--chart-3))' };
    return { label: lang('portfolioGenesis.lowPriority'), color: 'hsl(var(--muted-foreground))' };
  };

  const handleClick = (data: any) => {
    if (data?.productId) {
      navigate(`/app/product/${data.productId}/business-case?tab=venture-blueprint`);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const quadrant = getQuadrant(data.x, data.y);
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold">{data.name}</p>
          <p className="text-muted-foreground">{lang('portfolioGenesis.readiness')}: {data.x}%</p>
          <p className="text-muted-foreground">{lang('portfolioGenesis.viability')}: {data.y}</p>
          {data.phase && <p className="text-muted-foreground">{lang('portfolioGenesis.phase')}: {data.phase}</p>}
          <p className="mt-1 font-medium" style={{ color: quadrant.color }}>{quadrant.label}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-indigo-600" />
          {lang('portfolioGenesis.investmentPotentialQuadrant')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[320px]">
          {/* Quadrant Labels */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <span className="absolute top-2 left-2 text-xs text-chart-4 opacity-70">⚡ {lang('portfolioGenesis.emerging')}</span>
            <span className="absolute top-2 right-2 text-xs text-chart-2 opacity-70">🚀 {lang('portfolioGenesis.highPotential')}</span>
            <span className="absolute bottom-8 left-2 text-xs text-muted-foreground opacity-70">⏸️ {lang('portfolioGenesis.lowPriority')}</span>
            <span className="absolute bottom-8 right-2 text-xs text-chart-3 opacity-70">📈 {lang('portfolioGenesis.needsWork')}</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis
                type="number"
                dataKey="x"
                name="Readiness"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 11 }}
                label={{ value: lang('portfolioGenesis.investorReadinessPercent'), position: 'bottom', offset: 0, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Viability"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{ value: lang('portfolioGenesis.viabilityScore'), angle: -90, position: 'left', offset: 10, fontSize: 11 }}
              />
              <ZAxis range={[100, 400]} />
              <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                data={chartData} 
                onClick={handleClick}
                cursor="pointer"
              >
                {chartData.map((entry, index) => {
                  const quadrant = getQuadrant(entry.x, entry.y);
                  return <Cell key={index} fill={quadrant.color} />;
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
