import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { RotateCcw, Lock, Unlock } from 'lucide-react';
import { ValueEvolutionControlsProps } from '@/types/valueEvolution';

export function ValueEvolutionControls({
  phases,
  simulatedLoS,
  launchDate,
  ipExpiryDate,
  onPhaseLoSChange,
  onLaunchDateChange,
  onIpExpiryChange,
  onReset,
  currency,
}: ValueEvolutionControlsProps) {
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">What-If Analysis</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phase LoS Sliders */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Phase Success Probability
          </h4>
          
          {sortedPhases.map((phase) => {
            const isComplete = phase.isComplete;
            const currentLoS = simulatedLoS[phase.id] ?? phase.likelihoodOfSuccess;
            
            return (
              <div key={phase.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <Lock className="h-3 w-3 text-green-500" />
                    ) : (
                      <Unlock className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {phase.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono w-12 text-right">
                      {currentLoS.toFixed(0)}%
                    </span>
                    {isComplete && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                        Retired
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Slider
                  value={[currentLoS]}
                  onValueChange={([value]) => onPhaseLoSChange(phase.id, value)}
                  min={0}
                  max={100}
                  step={1}
                  disabled={isComplete}
                  className={isComplete ? 'opacity-50' : ''}
                />
              </div>
            );
          })}
        </div>

        {/* Launch Date Picker */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Launch Date
          </h4>
          <DatePicker
            date={launchDate}
            setDate={(date) => date && onLaunchDateChange(date)}
            placeholder="Select launch date"
          />
          <p className="text-xs text-muted-foreground">
            Moving launch later increases time discounting, reducing current value
          </p>
        </div>

        {/* IP Expiry Picker */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            IP/Patent Expiry
          </h4>
          <DatePicker
            date={ipExpiryDate}
            setDate={(date) => date && onIpExpiryChange(date)}
            placeholder="Select IP expiry date"
            fromDate={launchDate}
          />
          <p className="text-xs text-muted-foreground">
            Shorter IP life reduces revenue runway and peak value
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
