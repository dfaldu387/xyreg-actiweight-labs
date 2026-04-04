import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Clock, 
  Play, 
  Eye, 
  Link,
  Zap,
  GitBranch,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { 
  useEnhancedAutoSequencing, 
  PhaseForAutoSequencing, 
  AutoSequenceUpdate,
  SequenceMode 
} from "@/hooks/useEnhancedAutoSequencing";

interface EnhancedAutoSequenceControlsProps {
  phases: PhaseForAutoSequencing[];
  sequencePhases: boolean;
  onBatchUpdate: (updates: AutoSequenceUpdate[]) => Promise<boolean>;
  onCreateDependency?: (dep: any) => Promise<boolean>;
  dependencies?: any[];
  disabled?: boolean;
  onModeChange?: (mode: SequenceMode) => void;
}

export function EnhancedAutoSequenceControls({
  phases,
  sequencePhases,
  onBatchUpdate,
  onCreateDependency,
  dependencies = [],
  disabled = false,
  onModeChange
}: EnhancedAutoSequenceControlsProps) {
  const {
    isApplying,
    previewData,
    sequenceMode,
    dependencySuggestions,
    setSequenceMode,
    applyAutoSequence,
    showPreview,
    clearPreview,
    createSequentialDependencies
  } = useEnhancedAutoSequencing();

  const handleModeChange = (mode: SequenceMode) => {
    setSequenceMode(mode);
    onModeChange?.(mode);
  };

  const handleApplyNow = async () => {
    await applyAutoSequence(phases, onBatchUpdate, dependencies, sequenceMode);
  };

  const handleShowPreview = () => {
    showPreview(phases, dependencies, sequenceMode);
  };

  const handleCreateDependencies = async () => {
    if (!onCreateDependency) return;
    await createSequentialDependencies(phases, onCreateDependency);
  };

  const phasesWithDates = phases.filter(p => p.startDate && p.endDate);
  const hasOverlapsOrGaps = phasesWithDates.some((phase, index) => {
    if (index === 0) return false;
    const prevPhase = phasesWithDates[index - 1];
    if (!prevPhase.endDate || !phase.startDate) return false;
    
    const dayAfterPrev = new Date(prevPhase.endDate);
    dayAfterPrev.setDate(dayAfterPrev.getDate() + 1);
    
    return phase.startDate.getTime() !== dayAfterPrev.getTime();
  });

  const getModeIcon = (mode: SequenceMode) => {
    switch (mode) {
      case 'simple': return <Zap className="h-4 w-4" />;
      case 'dependency': return <Link className="h-4 w-4" />;
      case 'parallel': return <GitBranch className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getModeDescription = (mode: SequenceMode) => {
    switch (mode) {
      case 'simple': return 'Sequential phases with no gaps or overlaps';
      case 'dependency': return 'Respects dependency constraints and relationships';
      case 'parallel': return 'Identifies phases that can run concurrently';
      default: return 'Auto-sequencing disabled';
    }
  };

  if (!sequencePhases) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Mode Selection */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <h4 className="font-medium text-primary">Smart Auto-Sequence</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Select value={sequenceMode} onValueChange={handleModeChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {getModeIcon(sequenceMode)}
                          <span className="capitalize">{sequenceMode === 'none' ? 'Disabled' : sequenceMode}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>Disabled</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="simple">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span>Simple Sequential</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dependency">
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          <span>Dependency-Based</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="parallel">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          <span>Parallel Phases</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {hasOverlapsOrGaps && (
                    <Badge variant="outline" className="text-warning border-warning/30">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Gaps/Overlaps
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {getModeDescription(sequenceMode)}
                </p>
              </div>
            </div>
            
            {sequenceMode !== 'none' && (
              <div className="flex items-center gap-2">
                {sequenceMode === 'simple' && onCreateDependency && dependencySuggestions.length > 0 && (
                  <Button
                    onClick={handleCreateDependencies}
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Create Dependencies
                  </Button>
                )}
                
                <Button
                  onClick={handleShowPreview}
                  variant="outline"
                  size="sm"
                  disabled={disabled || phases.length === 0}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
                <Button
                  onClick={handleApplyNow}
                  disabled={disabled || isApplying || phases.length === 0}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isApplying ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Apply {sequenceMode === 'simple' ? 'Sequential' : 'Auto-Sequence'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Preview with Dependency Suggestions */}
      {previewData && (
        <Card className="border-secondary/20 bg-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-secondary-foreground">
                {sequenceMode === 'simple' ? 'Sequential' : 'Auto-Sequence'} Preview
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleApplyNow}
                  disabled={isApplying}
                  size="sm"
                  className="bg-success hover:bg-success/90"
                >
                  {isApplying ? (
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Apply Changes
                </Button>
                <Button
                  onClick={clearPreview}
                  variant="outline"
                  size="sm"
                  disabled={isApplying}
                >
                  Cancel
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {previewData.map((preview, index) => (
                <div key={preview.original.id} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-sm">Phase {index + 1}</span>
                    <Badge variant="secondary" className="text-xs">
                      {preview.durationDays} days
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {preview.original.startDate ? format(preview.original.startDate, 'MMM dd, yyyy') : 'No date'} 
                      {preview.original.endDate ? ` - ${format(preview.original.endDate, 'MMM dd, yyyy')}` : ''}
                    </span>
                    <ArrowRight className="h-3 w-3 text-primary" />
                    <span className="text-primary font-medium">
                      {format(preview.updated.startDate, 'MMM dd, yyyy')} - {format(preview.updated.endDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Dependency Suggestions */}
            {dependencySuggestions.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">Suggested Dependencies:</h5>
                  <div className="grid gap-1 text-xs">
                    {dependencySuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                        <span>Phase {suggestion.fromPhaseId} → Phase {suggestion.toPhaseId}</span>
                        {suggestion.lagDays > 0 && (
                          <span className="text-warning">+{suggestion.lagDays}d</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="mt-3 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <strong>Changes:</strong> {getModeDescription(sequenceMode)}
              {dependencySuggestions.length > 0 && (
                <span> • {dependencySuggestions.length} dependency suggestions available</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}