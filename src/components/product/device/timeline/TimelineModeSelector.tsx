
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, ArrowRight, Lock } from "lucide-react";
import { TimelineConfig } from "@/utils/flexibleTimelineValidation";

interface TimelineModeSelectorProps {
  config: TimelineConfig;
  onModeChange?: (mode: TimelineConfig['mode']) => void;
  efficiencyScore: number;
  disabled?: boolean;
}

export function TimelineModeSelector({ 
  config, 
  onModeChange, 
  efficiencyScore,
  disabled = false 
}: TimelineModeSelectorProps) {
  
  const handleModeChange = (mode: TimelineConfig['mode']) => {
    if (disabled || !onModeChange) return;
    onModeChange(mode);
  };

  return (
    <Card className={`${disabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Timeline Mode
            {disabled && <Lock className="h-3 w-3 text-muted-foreground" />}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Efficiency: {efficiencyScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            variant={config.mode === 'concurrent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('concurrent')}
            disabled={disabled}
            className="flex-1 text-xs"
          >
            <Layers className="h-3 w-3 mr-1" />
            Concurrent
          </Button>
          <Button
            variant={config.mode === 'waterfall' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('waterfall')}
            disabled={disabled}
            className="flex-1 text-xs"
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Waterfall
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {config.mode === 'concurrent' ? (
            'Phases can overlap for faster development'
          ) : (
            'Sequential phase progression'
          )}
          {disabled && (
            <div className="mt-1 text-amber-600">
              Read-only mode - timeline mode cannot be changed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
