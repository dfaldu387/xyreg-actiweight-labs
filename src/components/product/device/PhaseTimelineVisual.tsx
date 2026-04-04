import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface Phase {
  id: string;
  name: string;
  status: string;
}

interface PhaseTimelineVisualProps {
  phases: Phase[];
  currentPhase: string;
}

export function PhaseTimelineVisual({ phases, currentPhase }: PhaseTimelineVisualProps) {
  const getPhaseStatus = (phase: Phase) => {
    if (phase.name === currentPhase) return 'current';
    if (phase.status === 'Completed') return 'completed';
    return 'upcoming';
  };

  const getPhaseStyles = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-blue-600 text-white border-blue-600';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-gray-100 text-gray-400 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
        Lifecycle Phase
      </h3>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase);
          const isLast = index === phases.length - 1;

          return (
            <React.Fragment key={phase.id}>
              <div className={`
                relative flex items-center gap-2 px-4 py-2 rounded-full border-2 
                whitespace-nowrap transition-all
                ${getPhaseStyles(status)}
              `}>
                {status === 'completed' && (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{phase.name}</span>
                {status === 'current' && (
                  <Badge className="ml-1 bg-blue-700 hover:bg-blue-700 text-white text-xs">
                    ACTIVE
                  </Badge>
                )}
              </div>
              {!isLast && (
                <div className={`
                  h-0.5 w-8 flex-shrink-0
                  ${status === 'completed' ? 'bg-green-300' : 'bg-gray-300'}
                `} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
