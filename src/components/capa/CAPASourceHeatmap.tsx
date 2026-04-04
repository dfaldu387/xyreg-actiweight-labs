import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CAPARecord, CAPA_SOURCE_LABELS } from '@/types/capa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CAPASourceHeatmapProps {
  capas: CAPARecord[];
}

export function CAPASourceHeatmap({ capas }: CAPASourceHeatmapProps) {
  const { lang } = useTranslation();

  // Aggregate CAPAs by source type
  const sourceData = Object.entries(CAPA_SOURCE_LABELS).map(([source, label]) => {
    const sourceCAPAs = capas.filter(c => c.source_type === source);
    const openCount = sourceCAPAs.filter(c => !['closed', 'rejected'].includes(c.status)).length;
    const closedCount = sourceCAPAs.filter(c => c.status === 'closed').length;
    const criticalCount = sourceCAPAs.filter(c => {
      const risk = (c.severity || 1) * (c.probability || 1);
      return risk >= 15;
    }).length;

    return {
      source,
      label,
      total: sourceCAPAs.length,
      open: openCount,
      closed: closedCount,
      critical: criticalCount,
    };
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

  // Color scale based on critical count
  const getBarColor = (critical: number, total: number) => {
    if (total === 0) return 'hsl(var(--muted))';
    const ratio = critical / total;
    if (ratio >= 0.5) return 'hsl(var(--destructive))';
    if (ratio >= 0.25) return 'hsl(346, 77%, 50%)'; // Orange-red
    if (ratio > 0) return 'hsl(38, 92%, 50%)'; // Amber
    return 'hsl(var(--primary))';
  };

  if (sourceData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {lang('capa.sourcesAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {lang('capa.noDataForAnalysis')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {lang('capa.sourcesAnalysis')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sourceData} layout="vertical" margin={{ left: 80, right: 20 }}>
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12 }}
              width={75}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                      <div className="font-semibold">{data.label}</div>
                      <div className="mt-1 space-y-1">
                        <div>{lang('capa.total')} {data.total}</div>
                        <div className="text-green-600">{lang('capa.closedLabel')} {data.closed}</div>
                        <div className="text-blue-600">{lang('capa.openLabel')} {data.open}</div>
                        <div className="text-red-600">{lang('capa.criticalLabel')} {data.critical}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {sourceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.critical, entry.total)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }} />
            <span>{lang('capa.lowRisk')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>{lang('capa.mediumRisk')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
            <span>{lang('capa.highRisk')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
