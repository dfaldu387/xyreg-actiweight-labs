import React from 'react';
import { BarChart3, BookOpen } from 'lucide-react';
import { StratificationHeatmap } from './StratificationHeatmap';
import { BiasMetric } from './types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BiasMatrixColumnProps {
  metrics: BiasMetric[];
  isVisible: boolean;
}

export function BiasMatrixColumn({ metrics, isVisible }: BiasMatrixColumnProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with Tooltip */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-100 font-mono">Performance & Fairness</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-slate-400 hover:text-slate-200 transition-colors">
                    <BookOpen className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs bg-slate-800 border-slate-700 text-slate-100">
                  <p className="text-sm">
                    <strong>Stratification analysis</strong> shows how your model performs across different patient demographics. 
                    Cells turn <span className="text-amber-400">amber</span> or <span className="text-red-400">red</span> if performance falls below fairness thresholds — required by EU AI Act Article 9.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-slate-400">Stratification analysis results</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <StratificationHeatmap metrics={metrics} isVisible={isVisible} />
      </div>
    </div>
  );
}
