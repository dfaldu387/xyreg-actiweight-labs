import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CAPARecord } from '@/types/capa';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPAAgingChartProps {
  capas: CAPARecord[];
}

export function CAPAAgingChart({ capas }: CAPAAgingChartProps) {
  const { lang } = useTranslation();
  const now = new Date();

  // Calculate aging buckets for open CAPAs
  const openCAPAs = capas.filter(c => !['closed', 'rejected'].includes(c.status));

  const agingBuckets = {
    '0-7 days': 0,
    '8-30 days': 0,
    '31-60 days': 0,
    '61-90 days': 0,
    '90+ days': 0,
  };

  openCAPAs.forEach(capa => {
    if (!capa.created_at) return;

    const createdDate = new Date(capa.created_at);
    const daysOpen = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOpen <= 7) {
      agingBuckets['0-7 days']++;
    } else if (daysOpen <= 30) {
      agingBuckets['8-30 days']++;
    } else if (daysOpen <= 60) {
      agingBuckets['31-60 days']++;
    } else if (daysOpen <= 90) {
      agingBuckets['61-90 days']++;
    } else {
      agingBuckets['90+ days']++;
    }
  });

  const chartData = Object.entries(agingBuckets)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  const COLORS = [
    'hsl(142, 76%, 36%)', // Green - 0-7 days
    'hsl(199, 89%, 48%)', // Blue - 8-30 days
    'hsl(38, 92%, 50%)',  // Amber - 31-60 days
    'hsl(25, 95%, 53%)',  // Orange - 61-90 days
    'hsl(0, 84%, 60%)',   // Red - 90+ days
  ];

  if (openCAPAs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {lang('capa.agingDistribution')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {lang('capa.noOpenCapas')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {lang('capa.agingDistribution')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[Object.keys(agingBuckets).indexOf(entry.name)]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                      <div className="font-medium">{data.name}</div>
                      <div>{data.value} CAPA{data.value !== 1 ? 's' : ''}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-center">
          <div>
            <div className="text-lg font-semibold">{openCAPAs.length}</div>
            <div className="text-xs text-muted-foreground">{lang('capa.openCapasLabel')}</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-destructive">
              {agingBuckets['90+ days']}
            </div>
            <div className="text-xs text-muted-foreground">{lang('capa.over90Days')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
