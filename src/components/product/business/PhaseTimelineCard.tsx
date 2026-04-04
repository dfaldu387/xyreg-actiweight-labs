import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/product/device/sections/HelpTooltip";
import { DevelopmentPhase } from '@/services/enhanced-rnpv/interfaces';
import { formatCurrency } from '@/utils/marketCurrencyUtils';
import { Clock, Circle } from 'lucide-react';

interface PhaseTimelineCardProps {
  phases: DevelopmentPhase[];
  currency: string;
  cumulativeTechnicalLoA: number;
}

export function PhaseTimelineCard({ phases, currency, cumulativeTechnicalLoA }: PhaseTimelineCardProps) {
  const sortedPhases = [...phases].sort((a, b) => a.startMonth - b.startMonth);
  const totalDuration = Math.max(...sortedPhases.map(p => p.startMonth + p.duration));
  
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-secondary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Development Phase Timeline</CardTitle>
            <HelpTooltip content="Stage-gated development phases with associated costs and likelihood of success (LoS). Each phase's LoS is multiplied together to calculate cumulative technical risk." />
          </div>
          <Badge variant="secondary" className="text-sm">
            Cumulative LoS: {cumulativeTechnicalLoA.toFixed(1)}%
          </Badge>
        </div>
        <CardDescription>
          Phase-gated milestones with budgets and approval probabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedPhases.map((phase, index) => {
          const isFirstPhase = index === 0;
          
          return (
            <div key={phase.id} className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {isFirstPhase ? (
                      <Clock className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base">{phase.name}</h4>
                      {phase.isMarketAgnostic && (
                        <Badge variant="outline" className="text-xs">Core</Badge>
                      )}
                      {phase.isContinuous && (
                        <Badge variant="secondary" className="text-xs">Continuous</Badge>
                      )}
                    </div>
                    {phase.description && (
                      <p className="text-sm text-muted-foreground mb-2">{phase.description}</p>
                    )}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Duration:</span>{' '}
                        <span className="font-medium">{phase.duration} months</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Budget:</span>{' '}
                        <span className="font-medium">{formatCurrency(phase.costs, currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">LoS:</span>{' '}
                      <Badge 
                        variant={phase.likelihoodOfSuccess >= 70 ? "default" : phase.likelihoodOfSuccess >= 50 ? "secondary" : "destructive"}
                        className="ml-1"
                      >
                        {phase.likelihoodOfSuccess}%
                      </Badge>
                      </div>
                    </div>
                    {phase.isContinuous && (
                      <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                        {phase.preLaunchCosts && phase.preLaunchCosts > 0 && (
                          <div className="text-muted-foreground">
                            Pre-launch: {formatCurrency(phase.preLaunchCosts, currency)}
                          </div>
                        )}
                        {phase.postLaunchCosts && phase.postLaunchCosts > 0 && (
                          <div className="text-muted-foreground">
                            Post-launch ({phase.recurringCostFrequency}): {formatCurrency(phase.postLaunchCosts, currency)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Visual timeline bar */}
              <div className="relative ml-8">
                <div className="absolute -left-6 top-1/2 w-4 h-0.5 bg-border"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground min-w-[60px]">
                    Month {phase.startMonth}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                      style={{ width: `${(phase.duration / totalDuration) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                    Month {phase.startMonth + phase.duration}
                  </span>
                </div>
              </div>
              
              {index < sortedPhases.length - 1 && (
                <div className="ml-8 border-l-2 border-dashed border-border h-4"></div>
              )}
            </div>
          );
        })}
        
        {/* Summary footer */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Development Time:</span>
              <span className="font-semibold">{totalDuration} months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Investment:</span>
              <span className="font-semibold">
                {formatCurrency(sortedPhases.reduce((sum, p) => sum + p.costs, 0), currency)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
