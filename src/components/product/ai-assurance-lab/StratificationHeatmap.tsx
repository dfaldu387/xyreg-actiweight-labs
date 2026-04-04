import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BiasMetric } from './types';

interface StratificationHeatmapProps {
  metrics: BiasMetric[];
  isVisible: boolean;
}

export function StratificationHeatmap({ metrics, isVisible }: StratificationHeatmapProps) {
  if (!isVisible) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-slate-700 rounded-lg">
        <p className="text-slate-500 font-mono text-sm">Run verification to reveal metrics</p>
      </div>
    );
  }

  const getCellStyle = (value: number) => {
    if (value >= 95) {
      return 'bg-green-900/50 text-green-300 border-green-700';
    } else if (value < 80) {
      return 'bg-red-900/50 text-red-300 border-red-700';
    }
    return 'bg-slate-800 text-slate-300 border-slate-600';
  };

  const columns = ['Precision', 'Recall', 'F1-Score'];

  // Calculate global status
  const allValues = metrics.flatMap(m => [m.precision, m.recall, m.f1Score]);
  const failingCount = allValues.filter(v => v < 80).length;
  const globalStatus = failingCount === 0 ? 'PASS' : 'FAIL';

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left text-slate-400 border border-slate-700 bg-slate-800/50">
                Demographic
              </th>
              {columns.map(col => (
                <th key={col} className="p-3 text-center text-slate-400 border border-slate-700 bg-slate-800/50">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.demographic}>
                <td className="p-3 text-slate-300 border border-slate-700 bg-slate-800/30 font-medium">
                  {metric.demographic}
                </td>
                <td className={cn("p-3 text-center border transition-colors", getCellStyle(metric.precision))}>
                  <div className="flex items-center justify-center gap-1.5">
                    {metric.precision.toFixed(1)}%
                    {metric.precision < 80 && <AlertTriangle className="h-3.5 w-3.5" />}
                  </div>
                </td>
                <td className={cn("p-3 text-center border transition-colors", getCellStyle(metric.recall))}>
                  <div className="flex items-center justify-center gap-1.5">
                    {metric.recall.toFixed(1)}%
                    {metric.recall < 80 && <AlertTriangle className="h-3.5 w-3.5" />}
                  </div>
                </td>
                <td className={cn("p-3 text-center border transition-colors", getCellStyle(metric.f1Score))}>
                  <div className="flex items-center justify-center gap-1.5">
                    {metric.f1Score.toFixed(1)}%
                    {metric.f1Score < 80 && <AlertTriangle className="h-3.5 w-3.5" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Global Status Footer */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-lg border font-mono",
        globalStatus === 'PASS' 
          ? 'bg-green-900/20 border-green-700 text-green-300' 
          : 'bg-red-900/20 border-red-700 text-red-300'
      )}>
        <div className="flex items-center gap-2">
          {globalStatus === 'PASS' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          <span className="font-semibold">Global EU AI Act Status:</span>
        </div>
        <span className="text-lg font-bold">[{globalStatus}]</span>
      </div>
    </div>
  );
}
