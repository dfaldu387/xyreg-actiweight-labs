
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { validateExactPhaseMatch } from "@/utils/phaseNameUtils";
import { cleanPhaseName } from "@/utils/phaseNumbering";

interface UnifiedPhaseSelectorProps {
  currentPhase: string;
  availablePhases: Array<{
    id: string;
    name: string;
    description?: string;
    position: number;
  }>;
  onPhaseChange: (newPhase: string) => void;
  disabled?: boolean;
  showIcons?: boolean;
  className?: string;
  showValidation?: boolean;
}

export function UnifiedPhaseSelector({
  currentPhase,
  availablePhases,
  onPhaseChange,
  disabled = false,
  showIcons = true,
  className = "",
  showValidation = true
}: UnifiedPhaseSelectorProps) {
  const getPhaseIcon = (phaseName: string, position: number) => {
    if (!showIcons) return null;
    
    // Enhanced icon logic based on phase name patterns and position
    const lowerName = phaseName.toLowerCase();
    
    if (lowerName.includes('complete') || lowerName.includes('done') || lowerName.includes('finish')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (lowerName.includes('progress') || lowerName.includes('active') || lowerName.includes('develop')) {
      return <Clock className="h-4 w-4 text-blue-600" />;
    }
    if (lowerName.includes('review') || lowerName.includes('validation') || lowerName.includes('verify')) {
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
    
    // Default icon based on phase position
    const phaseNumber = position + 1;
    if (phaseNumber <= 5) return <Clock className="h-4 w-4 text-blue-600" />;
    if (phaseNumber <= 10) return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  // Validate current phase against available phases
  const isCurrentPhaseValid = validateExactPhaseMatch(
    currentPhase, 
    availablePhases.map(p => p.name)
  );

  const currentPhaseData = availablePhases.find(p => p.name === currentPhase);
  const currentDisplayName = cleanPhaseName(currentPhase);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Phase Display */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Current Phase:</span>
          <Badge 
            variant={isCurrentPhaseValid ? "outline" : "destructive"} 
            className="flex items-center gap-2"
          >
            {currentPhaseData && getPhaseIcon(currentPhase, currentPhaseData.position)}
            <span className="text-sm font-medium">{currentDisplayName}</span>
            {!isCurrentPhaseValid && showValidation && (
              <AlertTriangle className="h-3 w-3" />
            )}
          </Badge>
        </div>

        {/* Enhanced Current Phase Info */}
        {currentPhaseData && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md">
            <div className="flex items-center justify-between">
              <span>Position: {currentPhaseData.position + 1} of {availablePhases.length}</span>
            </div>
            {currentPhaseData.description && (
              <div className="mt-1 text-blue-700">
                {currentPhaseData.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Warning */}
      {!isCurrentPhaseValid && showValidation && (
        <div className="text-xs text-destructive bg-red-50 border border-red-200 rounded p-2">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-medium">Phase Validation Error</span>
          </div>
          <div className="mt-1">
            Current phase "{currentPhase}" is not found in available phases for this company.
          </div>
        </div>
      )}
      
      {/* Phase Selector */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
          Select New Phase:
        </label>
        <Select 
          value={currentPhase} 
          onValueChange={onPhaseChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select lifecycle phase" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {availablePhases.map((phase) => {
              const displayName = cleanPhaseName(phase.name);
              const isCurrentlySelected = phase.name === currentPhase;
              
              return (
                <SelectItem key={phase.id} value={phase.name}>
                  <div className="flex items-center gap-2 w-full">
                    {getPhaseIcon(phase.name, phase.position)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{displayName}</span>
                        {isCurrentlySelected && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      {phase.description && (
                        <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                          {phase.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Pos: {phase.position + 1}</span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Phase Statistics */}
      {showValidation && (
        <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded-md">
          <div className="flex justify-between items-center">
            <span>{availablePhases.length} available phases</span>
            <span>
              Current: {currentPhaseData ? `Position ${currentPhaseData.position + 1}` : 'Invalid'}
            </span>
          </div>
          <div className="mt-1 text-center">
            <strong>Clean phase names without numbering prefixes</strong>
          </div>
        </div>
      )}
    </div>
  );
}
