import React from 'react';
import { cn } from "@/lib/utils";

type ColorVariant = 'amber' | 'orange';

interface PhaseInfo {
  id: number;
  label: string;
  stepCount: number;
  completedCount: number;
}

interface GenesisPhaseTimelineProps {
  phases: PhaseInfo[];
  activePhase?: number;
  onPhaseClick?: (phaseId: number) => void;
  colorVariant?: ColorVariant;
}

export function GenesisPhaseTimeline({
  phases,
  activePhase,
  onPhaseClick,
  colorVariant = 'amber',
}: GenesisPhaseTimelineProps) {
  const colors = colorVariant === 'orange' ? {
    activeBg: 'bg-orange-100 dark:bg-orange-900/40',
    activeText: 'text-orange-700 dark:text-orange-400',
  } : {
    activeBg: 'bg-amber-100 dark:bg-amber-900/40',
    activeText: 'text-amber-700 dark:text-amber-400',
  };

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {phases.map((phase, index) => (
        <React.Fragment key={phase.id}>
          {/* Phase */}
          <button
            onClick={() => onPhaseClick?.(phase.id)}
            className={cn(
              "flex flex-col items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              activePhase === phase.id 
                ? colors.activeBg
                : "hover:bg-muted/50"
            )}
          >
            <span className={cn(
              "text-xs font-medium",
              activePhase === phase.id 
                ? colors.activeText
                : "text-muted-foreground"
            )}>
              {phase.label}
            </span>
            
            {/* Step dots */}
            <div className="flex items-center gap-1">
              {Array.from({ length: phase.stepCount }).map((_, stepIndex) => (
                <div
                  key={stepIndex}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    stepIndex < phase.completedCount
                      ? "bg-emerald-500"
                      : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            
            <span className="text-[10px] text-muted-foreground">
              {phase.completedCount}/{phase.stepCount}
            </span>
          </button>

          {/* Connector line */}
          {index < phases.length - 1 && (
            <div className="h-px w-8 bg-border" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
