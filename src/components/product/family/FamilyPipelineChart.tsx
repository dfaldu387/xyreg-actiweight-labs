import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductWithBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { useFamilyMetrics, PhaseDistribution } from '@/hooks/useFamilyMetrics';

interface FamilyPipelineChartProps {
  products: ProductWithBasicUDI[];
}

export function FamilyPipelineChart({ products }: FamilyPipelineChartProps) {
  const { groupProductsByPhase } = useFamilyMetrics();
  const distribution = groupProductsByPhase(products);
  const total = products.length;

  const segments: { label: string; count: number; color: string; key: keyof PhaseDistribution }[] = [
    { label: 'Concept', count: distribution.concept, color: 'bg-blue-900', key: 'concept' },
    { label: 'Design & V&V', count: distribution.designVV, color: 'bg-blue-600', key: 'designVV' },
    { label: 'Regulatory', count: distribution.regulatory, color: 'bg-blue-400', key: 'regulatory' },
    { label: 'Launched', count: distribution.launched, color: 'bg-green-500', key: 'launched' },
    { label: 'Retired', count: distribution.retired, color: 'bg-muted', key: 'retired' },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Family Pipeline Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked Bar */}
        <div className="w-full h-12 flex rounded-lg overflow-hidden mb-4">
          {segments.map((segment) => {
            const percentage = total > 0 ? (segment.count / total) * 100 : 0;
            if (segment.count === 0) return null;
            
            return (
              <div
                key={segment.key}
                className={`${segment.color} flex items-center justify-center text-white font-semibold text-sm transition-all hover:opacity-80`}
                style={{ width: `${percentage}%` }}
                title={`${segment.label}: ${segment.count}`}
              >
                {percentage > 10 && segment.count}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded ${segment.color}`}></div>
              <span className="text-sm">
                {segment.label} <span className="font-semibold">({segment.count})</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
