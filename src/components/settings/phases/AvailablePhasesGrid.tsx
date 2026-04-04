
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Phase } from "./SimplifiedPhaseDataService";

interface AvailablePhasesGridProps {
  availablePhases: Phase[];
  onAddPhase: (phaseId: string, phaseName: string) => Promise<boolean>;
  onCreatePhase: () => void;
}

export function AvailablePhasesGrid({
  availablePhases,
  onAddPhase,
  onCreatePhase
}: AvailablePhasesGridProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Non-Active Phases
              <Badge variant="secondary">{availablePhases.length}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Phases you can add to your active workflow
            </p>
          </div>
          <Button onClick={onCreatePhase} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {availablePhases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">All phases are currently active.</p>
            <Button onClick={onCreatePhase} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create New Phase
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {availablePhases.map((phase) => (
              <Card key={phase.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm mt-4">{phase.name}</h4>
                    <Badge variant="outline" className="text-xs mt-2">
                      {phase.position}
                    </Badge>
                  </div>
                  
                  {phase.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {phase.description}
                    </p>
                  )}
                  
                  <div className="flex gap-1 mb-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold
                         ${phase.is_continuous_process
                           ? 'bg-amber-50 text-amber-700 border-amber-200'
                           : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`
                      }
                    >
                      {phase.is_continuous_process ? 'Concurrent' : 'Linear'}
                    </Badge>
                    {phase.category && (
                      <Badge variant="outline" className="text-xs font-semibold bg-purple-50 text-purple-700 border-purple-200">
                        {phase.category.name}
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => onAddPhase(phase.id, phase.name)}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add to Active
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
