import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';

interface RiskRadarChartProps {
  regulatoryScore: number;
  clinicalScore: number;
  reimbursementScore: number;
  technicalScore: number;
}

export function RiskRadarChart({
  regulatoryScore,
  clinicalScore,
  reimbursementScore,
  technicalScore,
}: RiskRadarChartProps) {
  const { lang } = useTranslation();

  const data = [
    {
      category: lang('viability.regulatory'),
      userScore: regulatoryScore,
      benchmark: 65,
    },
    {
      category: lang('viability.clinical'),
      userScore: clinicalScore,
      benchmark: 60,
    },
    {
      category: lang('viability.reimbursement'),
      userScore: reimbursementScore,
      benchmark: 55,
    },
    {
      category: lang('viability.technical'),
      userScore: technicalScore,
      benchmark: 70,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name={lang('viability.yourScore')}
          dataKey="userScore"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar
          name={lang('viability.industryBenchmark')}
          dataKey="benchmark"
          stroke="hsl(var(--muted-foreground))"
          fill="hsl(var(--muted-foreground))"
          fillOpacity={0.1}
          strokeWidth={2}
          strokeDasharray="5 5"
        />
        <Legend
          wrapperStyle={{
            paddingTop: '20px',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
