import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { PhaseValueInflection } from '@/types/valueEvolution';
import { format } from 'date-fns';

interface PhaseInflectionMarkersProps {
  inflectionPoints: PhaseValueInflection[];
  currentDate: Date;
  currency: string;
}

export function PhaseInflectionMarkers({
  inflectionPoints,
  currentDate,
  currency,
}: PhaseInflectionMarkersProps) {
  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${currency === 'USD' ? '$' : '€'}${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${currency === 'USD' ? '$' : '€'}${(value / 1000).toFixed(0)}K`;
    }
    return `${currency === 'USD' ? '$' : '€'}${value.toFixed(0)}`;
  };

  const sortedInflections = [...inflectionPoints].sort((a, b) => a.phaseOrder - b.phaseOrder);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Phase Milestones
      </h4>
      
      <div className="space-y-2">
        {sortedInflections.map((inflection, index) => {
          const isComplete = inflection.isComplete;
          const isCurrent = !isComplete && 
            inflection.completionDate && 
            currentDate < inflection.completionDate &&
            (index === 0 || sortedInflections[index - 1].isComplete);
          
          return (
            <div
              key={inflection.phaseId}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isComplete 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : isCurrent 
                    ? 'bg-yellow-500/10 border border-yellow-500/20' 
                    : 'bg-muted/30 border border-border/50'
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              
              {/* Phase Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {inflection.milestoneLabel}
                  </span>
                  {isComplete && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                      Retired
                    </Badge>
                  )}
                </div>
                {inflection.completionDate && (
                  <span className="text-xs text-muted-foreground">
                    {format(inflection.completionDate, 'MMM yyyy')}
                  </span>
                )}
              </div>
              
              {/* Value Jump */}
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-muted-foreground">
                  LoS: {inflection.preLoS}% → {inflection.postLoS}%
                </div>
                {inflection.valueJump > 0 && (
                  <div className="text-xs text-green-600 font-medium">
                    +{formatValue(inflection.valueJump)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
