import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus, Trash2 } from "lucide-react";
import { DatabasePhaseService } from "@/services/databasePhaseService";
import { EnhancedPhaseService } from "@/services/enhancedPhaseService";
import { toast } from "sonner";

interface AvailablePhasesSelectorProps {
  companyId: string;
  selectedPhases: string[];
  onPhasesChange: (phases: string[]) => void;
  onAddPhase?: () => void;
}

export function AvailablePhasesSelector({
  companyId,
  selectedPhases,
  onPhasesChange,
  onAddPhase
}: AvailablePhasesSelectorProps) {
  const [availablePhases, setAvailablePhases] = useState<any[]>([]);
  const [standardTemplate, setStandardTemplate] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAvailablePhases();
  }, [companyId]);

  const loadAvailablePhases = async () => {
    try {
      setLoading(true);
      
      // Get available phases from database
      const phasesData = await DatabasePhaseService.getPhases(companyId);
      setAvailablePhases(phasesData.availablePhases);
      
      // Get standard template for comparison
      const template = EnhancedPhaseService.getStandardPhaseTemplate();
      setStandardTemplate(template);
      
    } catch (error) {
      console.error('Error loading available phases:', error);
      toast.error('Failed to load available phases');
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseToggle = (phaseName: string, checked: boolean) => {
    if (checked) {
      onPhasesChange([...selectedPhases, phaseName]);
    } else {
      onPhasesChange(selectedPhases.filter(phase => phase !== phaseName));
    }
  };

  const handleAddToActive = async (phaseId: string, phaseName: string) => {
    try {
      setUpdating(true);
      await DatabasePhaseService.addPhaseToActive(companyId, phaseId);
      toast.success(`Added "${phaseName}" to active phases`);
      await loadAvailablePhases(); // Refresh the list
    } catch (error) {
      console.error('Error adding phase to active:', error);
      toast.error('Failed to add phase to active phases');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePhase = async (phaseId: string, phaseName: string) => {
    try {
      setUpdating(true);
      await DatabasePhaseService.deletePhase(phaseId); // Fix: remove companyId argument
      toast.success(`Deleted "${phaseName}"`);
      await loadAvailablePhases(); // Refresh the list
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast.error('Failed to delete phase');
    } finally {
      setUpdating(false);
    }
  };

  const getPhaseType = (phaseName: string) => {
    const isStandard = standardTemplate.some(template => template.name === phaseName);
    return isStandard ? 'Standard' : 'Custom';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <LoadingSpinner className="mr-2" />
          Loading available phases...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Available Phases
          {onAddPhase && (
            <Button onClick={onAddPhase} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Phase
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availablePhases.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No available phases. All phases are currently active.
          </p>
        ) : (
          availablePhases.map((phase) => (
            <div
              key={phase.id}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedPhases.includes(phase.name)}
                  onCheckedChange={(checked) => 
                    handlePhaseToggle(phase.name, checked as boolean)
                  }
                />
                <div>
                  <h4 className="font-medium">{phase.name}</h4>
                  {phase.description && (
                    <p className="text-sm text-muted-foreground">
                      {phase.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <Badge 
                      variant={getPhaseType(phase.name) === 'Standard' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {getPhaseType(phase.name)}
                    </Badge>
                    {phase.is_predefined_core_phase && (
                      <Badge variant="outline" className="text-xs">
                        Core Phase
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleAddToActive(phase.id, phase.name)}
                  disabled={updating}
                  size="sm"
                  variant="outline"
                >
                  Add to Active
                </Button>
                
                {!phase.is_predefined_core_phase && (
                  <Button
                    onClick={() => handleDeletePhase(phase.id, phase.name)}
                    disabled={updating}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
        
        {availablePhases.length > 0 && (
          <div className="pt-3 border-t text-sm text-muted-foreground">
            {availablePhases.length} available phases | {selectedPhases.length} selected
          </div>
        )}
      </CardContent>
    </Card>
  );
}
