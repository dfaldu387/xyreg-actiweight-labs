import React from 'react';
import { Brain, Check, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIModel } from './types';
import { Button } from '@/components/ui/button';

interface ModelSnapshotCardProps {
  model: AIModel;
  onStatusChange: (status: AIModel['status']) => void;
  onRunTest: () => void;
  isTestRunning: boolean;
}

export function ModelSnapshotCard({ model, onStatusChange, onRunTest, isTestRunning }: ModelSnapshotCardProps) {
  const statusSteps: AIModel['status'][] = ['trained', 'frozen', 'validated'];
  const currentStepIndex = statusSteps.indexOf(model.status);
  const canRunTest = model.status === 'frozen';

  const getStepStyle = (step: AIModel['status'], index: number) => {
    const isComplete = index < currentStepIndex;
    const isCurrent = index === currentStepIndex;
    
    if (isComplete) {
      return 'bg-green-500 text-white border-green-500';
    } else if (isCurrent) {
      return 'bg-indigo-500 text-white border-indigo-500';
    }
    return 'bg-slate-700 text-slate-400 border-slate-600';
  };

  const handleStepClick = (step: AIModel['status'], index: number) => {
    // Only allow progressing to next step
    if (index === currentStepIndex + 1) {
      onStatusChange(step);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 space-y-5">
      {/* Model Info */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-indigo-500/20 rounded-lg">
          <Brain className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-slate-100 font-mono truncate">
            {model.name}
          </h4>
          <p className="text-xs text-slate-400 font-mono mt-1 truncate">
            SHA-256: {model.hash.slice(0, 8)}...{model.hash.slice(-4)}
          </p>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="space-y-3">
        <p className="text-xs text-slate-400 uppercase tracking-wider">Model Status</p>
        <div className="flex items-center justify-between gap-2">
          {statusSteps.map((step, index) => (
            <React.Fragment key={step}>
              <button
                onClick={() => handleStepClick(step, index)}
                disabled={index > currentStepIndex + 1 || isTestRunning}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-sm font-mono transition-all",
                  getStepStyle(step, index),
                  index === currentStepIndex + 1 && !isTestRunning && 'cursor-pointer hover:opacity-80',
                  (index > currentStepIndex + 1 || isTestRunning) && 'cursor-not-allowed opacity-50'
                )}
              >
                {index < currentStepIndex ? (
                  <Check className="h-4 w-4" />
                ) : step === 'frozen' ? (
                  <Lock className="h-4 w-4" />
                ) : null}
                <span className="capitalize">{step}</span>
              </button>
              {index < statusSteps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5",
                  index < currentStepIndex ? 'bg-green-500' : 'bg-slate-600'
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
        {/* Helper text for current step */}
        <p className="text-xs text-slate-500 text-center font-mono">
          {model.status === 'trained' && "Click 'Frozen' to lock this model version"}
          {model.status === 'frozen' && "Model locked — ready for verification"}
          {model.status === 'validated' && "✓ Verification complete"}
        </p>
      </div>

      {/* Run Test Button */}
      <Button
        onClick={onRunTest}
        disabled={!canRunTest || isTestRunning}
        className={cn(
          "w-full font-mono",
          canRunTest && !isTestRunning
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-slate-700 text-slate-400 cursor-not-allowed"
        )}
      >
        {isTestRunning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Running Verification...
          </>
        ) : (
          "Run Test"
        )}
      </Button>

      {!canRunTest && !isTestRunning && (
        <p className="text-xs text-amber-400 text-center font-mono">
          ⚠ Model must be "Frozen" before running tests
        </p>
      )}

      {/* Inline explanation */}
      <div className="mt-2 text-xs text-slate-500 text-center">
        <span>Tests bias across demographics per EU AI Act Article 9</span>
      </div>
    </div>
  );
}
