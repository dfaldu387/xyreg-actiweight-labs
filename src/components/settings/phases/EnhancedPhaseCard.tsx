import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Minus, 
  FileText, 
  GripVertical,
  ArrowRight,
  Link,
  Clock
} from "lucide-react";
import { ConsolidatedPhase } from "@/services/consolidatedPhaseService";
import { usePhaseDependencies } from "@/hooks/usePhaseDependencies";

interface EnhancedPhaseCardProps {
  phase: ConsolidatedPhase;
  index: number;
  totalPhases: number;
  companyId: string;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onManageDocuments: () => void;
  onManageDependencies: () => void;
}

export function EnhancedPhaseCard({
  phase,
  index,
  totalPhases,
  companyId,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRemove,
  onManageDocuments,
  onManageDependencies
}: EnhancedPhaseCardProps) {
  const [showActions, setShowActions] = useState(false);
  
  const { 
    dependencies, 
    getPhaseDependencies,
    getDependencyTypeLabel 
  } = usePhaseDependencies(companyId);

  // Get dependencies for this phase
  const [phaseDependencies, setPhaseDependencies] = React.useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  
  React.useEffect(() => {
    const fetchDependencies = async () => {
      const deps = await getPhaseDependencies(phase.id);
      setPhaseDependencies(deps);
    };
    if (phase.id) {
      fetchDependencies();
    }
  }, [phase.id, getPhaseDependencies]);

  const incomingDeps = phaseDependencies.incoming || [];
  const outgoingDeps = phaseDependencies.outgoing || [];
  const hasDependencies = incomingDeps.length > 0 || outgoingDeps.length > 0;

  const getDependencyColor = (type: string) => {
    switch (type) {
      case 'finish_to_start': return 'bg-blue-100 text-blue-800';
      case 'start_to_start': return 'bg-green-100 text-green-800';
      case 'finish_to_finish': return 'bg-purple-100 text-purple-800';
      case 'start_to_finish': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="group relative transition-all duration-200 hover:shadow-md">
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      </div>

      <CardHeader className="pb-3 pl-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-medium leading-tight">
              {phase.name}
            </CardTitle>
            {phase.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {phase.description}
              </p>
            )}
          </div>
          
          <Popover open={showActions} onOpenChange={setShowActions}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end">
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Phase
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onManageDependencies}>
                  <Link className="h-4 w-4 mr-2" />
                  Dependencies
                </Button>
                <div className="border-t my-1" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start" 
                  onClick={onMoveUp}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Move Up
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start" 
                  onClick={onMoveDown}
                  disabled={index === totalPhases - 1}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Move Down
                </Button>
                <div className="border-t my-1" />
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onRemove}>
                  <Minus className="h-4 w-4 mr-2" />
                  Remove
                </Button>
                {phase.is_deletable && (
                  <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Phase Category */}
          {phase.category && (
            <Badge variant="outline" className="text-xs">
              {phase.category.name}
            </Badge>
          )}

          {/* Dependencies Display */}
          {hasDependencies && (
            <div className="space-y-2">
              {/* Incoming Dependencies */}
              {incomingDeps.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Depends on:</div>
                  {incomingDeps.slice(0, 2).map((dep) => (
                    <div key={dep.id} className="flex items-center gap-1 text-xs">
                      <Badge variant="secondary" className={`text-xs ${getDependencyColor(dep.dependency_type)}`}>
                        {getDependencyTypeLabel(dep.dependency_type)}
                      </Badge>
                      <ArrowRight className="h-3 w-3" />
                      <span className="truncate">{dep.source_phase_name}</span>
                      {dep.lag_days > 0 && (
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 ml-1 mr-1" />
                          <span>+{dep.lag_days}d</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {incomingDeps.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{incomingDeps.length - 2} more dependencies
                    </div>
                  )}
                </div>
              )}

              {/* Outgoing Dependencies */}
              {outgoingDeps.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Controls:</div>
                  {outgoingDeps.slice(0, 2).map((dep) => (
                    <div key={dep.id} className="flex items-center gap-1 text-xs">
                      <span className="truncate">{dep.target_phase_name}</span>
                      <ArrowRight className="h-3 w-3" />
                      <Badge variant="secondary" className={`text-xs ${getDependencyColor(dep.dependency_type)}`}>
                        {getDependencyTypeLabel(dep.dependency_type)}
                      </Badge>
                      {dep.lag_days > 0 && (
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 ml-1 mr-1" />
                          <span>+{dep.lag_days}d</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {outgoingDeps.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{outgoingDeps.length - 2} more dependencies
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {hasDependencies && (
              <Badge variant="outline" className="text-xs">
                <Link className="h-3 w-3 mr-1" />
                {incomingDeps.length + outgoingDeps.length} deps
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}