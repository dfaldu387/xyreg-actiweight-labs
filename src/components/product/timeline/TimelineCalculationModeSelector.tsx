import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Calculator, Info } from "lucide-react";

export type TimelineCalculationMode = 'forward' | 'backward';

interface TimelineCalculationModeSelectorProps {
  mode: TimelineCalculationMode;
  onModeChange: (mode: TimelineCalculationMode) => void;
  projectStartDate?: Date;
  projectedLaunchDate?: Date;
  disabled?: boolean;
}

export function TimelineCalculationModeSelector({ 
  mode, 
  onModeChange, 
  projectStartDate,
  projectedLaunchDate,
  disabled = false 
}: TimelineCalculationModeSelectorProps) {
  
  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Card className={`${disabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Timeline Calculation Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Mode selector buttons */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'forward' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('forward')}
              disabled={disabled}
              className="flex-1 text-xs"
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Forward Planning
            </Button>
            <Button
              variant={mode === 'backward' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('backward')}
              disabled={disabled}
              className="flex-1 text-xs"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Backward Planning
            </Button>
          </div>

          {/* Date display */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Project Start:</span>
              <Badge variant="outline" className="text-xs">
                {formatDate(projectStartDate)}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Launch Date:</span>
              <Badge variant="outline" className="text-xs">
                {formatDate(projectedLaunchDate)}
              </Badge>
            </div>
          </div>

          {/* Mode description */}
          <div className="text-xs text-muted-foreground">
            {mode === 'forward' ? (
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 text-blue-500" />
                <div>
                  <div className="text-blue-700 font-medium mb-1">Forward Planning Mode</div>
                  <div>Launch date is calculated from project start + phase durations</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 text-green-500" />
                <div>
                  <div className="text-green-700 font-medium mb-1">Backward Planning Mode</div>
                  <div>Phase dates work backward from fixed launch date</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}