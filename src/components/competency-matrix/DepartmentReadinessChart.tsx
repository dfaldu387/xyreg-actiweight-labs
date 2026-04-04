import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DepartmentReadiness } from './types';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  data: DepartmentReadiness[];
}

export function DepartmentReadinessChart({ data }: Props) {
  const { lang } = useTranslation();
  const getBarColor = (qualified: number, total: number) => {
    const ratio = total > 0 ? qualified / total : 0;
    if (ratio >= 0.5) return 'hsl(142, 76%, 36%)';   // green
    if (ratio >= 0.25) return 'hsl(45, 93%, 47%)';    // yellow
    return 'hsl(0, 84%, 60%)';                         // red
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{lang('training.competency.readiness.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="areaName" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number, _name: string, props: any) => [
                lang('training.competency.readiness.tooltipQualified', { count: String(value), total: String(props.payload.total) }),
                lang('training.competency.readiness.tooltipLabel')
              ]}
            />
            <Bar dataKey="qualified" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.qualified, entry.total)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
