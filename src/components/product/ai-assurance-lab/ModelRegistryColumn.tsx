import React from 'react';
import { Cpu, BookOpen } from 'lucide-react';
import { ModelSnapshotCard } from './ModelSnapshotCard';
import { AIModel } from './types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModelRegistryColumnProps {
  model: AIModel;
  onModelStatusChange: (status: AIModel['status']) => void;
  onRunTest: () => void;
  isTestRunning: boolean;
}

export function ModelRegistryColumn({ 
  model, 
  onModelStatusChange, 
  onRunTest, 
  isTestRunning 
}: ModelRegistryColumnProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with Tooltip */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Cpu className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-100 font-mono">Model Versions</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-slate-400 hover:text-slate-200 transition-colors">
                    <BookOpen className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs bg-slate-800 border-slate-700 text-slate-100">
                  <p className="text-sm">
                    <strong>Freeze your model</strong> before testing to ensure reproducibility. 
                    A frozen model has a locked SHA-256 hash, proving the exact version being tested — required by EU AI Act Article 11.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-slate-400">Device Under Test (DUT)</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <ModelSnapshotCard
          model={model}
          onStatusChange={onModelStatusChange}
          onRunTest={onRunTest}
          isTestRunning={isTestRunning}
        />
      </div>
    </div>
  );
}
