import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PhaseProgressionProps {
  previousPhase?: string;
  currentPhase?: string;
  nextPhase?: string;
}

export function PhaseProgression({ previousPhase, currentPhase, nextPhase }: PhaseProgressionProps) {
  if (!currentPhase) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      {previousPhase && (
        <>
          <span className="text-muted-foreground">{previousPhase}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </>
      )}
      <span className="font-semibold text-foreground">{currentPhase}</span>
      {nextPhase && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{nextPhase}</span>
        </>
      )}
    </div>
  );
}
