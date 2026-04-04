import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { DeviceGenesisMetrics } from '@/hooks/usePortfolioGenesisMetrics';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface GenesisMarketBubblesProps {
  devices: DeviceGenesisMetrics[];
}

const PHASE_COLORS: Record<string, string> = {
  'Concept & Planning': 'hsl(var(--chart-2))',
  'Design Inputs': 'hsl(var(--chart-4))',
  'Design & Development': 'hsl(var(--chart-1))',
  'Verification & Validation': 'hsl(var(--chart-3))',
  'Transfer & Production': 'hsl(var(--chart-5))',
  'Market Surveillance': 'hsl(142 76% 36%)',
  'default': 'hsl(var(--muted-foreground))',
};

export function GenesisMarketBubbles({ devices }: GenesisMarketBubblesProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  // Filter devices with TAM values for bubble sizing
  const chartData = devices.map(device => ({
    x: device.readinessPercentage,
    y: device.viabilityScore || 0,
    z: device.tamValue ? Math.sqrt(device.tamValue) : 50, // Square root for better visual scaling
    tam: device.tamValue,
    name: device.productName,
    productId: device.productId,
    phase: device.lifecyclePhase || 'Unknown',
  }));

  const handleClick = (data: any) => {
    if (data?.productId) {
      navigate(`/app/product/${data.productId}/business-case?tab=venture-blueprint`);
    }
  };

  const formatTAM = (value: number | null) => {
    if (!value) return lang('portfolioGenesis.notSet');
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value}M`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-semibold">{data.name}</p>
          <p className="text-muted-foreground">{lang('portfolioGenesis.readiness')}: {data.x}%</p>
          <p className="text-muted-foreground">{lang('portfolioGenesis.viability')}: {data.y}</p>
          <p className="text-muted-foreground">{lang('portfolioGenesis.tam')}: {formatTAM(data.tam)}</p>
          <p className="text-muted-foreground">{lang('portfolioGenesis.phase')}: {data.phase}</p>
        </div>
      );
    }
    return null;
  };

  // Get unique phases for legend
  const uniquePhases = [...new Set(chartData.map(d => d.phase))];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          {lang('portfolioGenesis.marketOpportunityMap')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
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
              <ZAxis 
                type="number" 
                dataKey="z" 
                range={[50, 400]} 
                name="TAM"
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                data={chartData} 
                onClick={handleClick}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={index} 
                    fill={PHASE_COLORS[entry.phase] || PHASE_COLORS.default}
                    fillOpacity={0.7}
                    stroke={PHASE_COLORS[entry.phase] || PHASE_COLORS.default}
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Phase Legend */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {uniquePhases.slice(0, 5).map(phase => (
            <div key={phase} className="flex items-center gap-1.5 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: PHASE_COLORS[phase] || PHASE_COLORS.default }}
              />
              <span className="text-muted-foreground">{phase}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          {lang('portfolioGenesis.bubbleSizeTam')}
        </p>
      </CardContent>
    </Card>
  );
}
