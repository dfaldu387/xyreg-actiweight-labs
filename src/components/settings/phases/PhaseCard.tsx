
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Minus,
  GripVertical
} from "lucide-react";
import { ConsolidatedPhase } from "@/services/consolidatedPhaseService";

interface PhaseCardProps {
  phase: ConsolidatedPhase;
  index: number;
  totalPhases: number;
  onEdit: () => void;
  onDelete: () => Promise<boolean>;
  onMoveUp: () => Promise<void>;
  onMoveDown: () => Promise<void>;
  onRemove: () => Promise<boolean>;
  onManageDocuments: () => void;
}

export function PhaseCard({
  phase,
  index,
  totalPhases,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRemove,
  onManageDocuments
}: PhaseCardProps) {
  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              {phase.name}
            </CardTitle>
            {phase.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {phase.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {index + 1}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {phase.category && (
          <Badge variant="secondary" className="text-xs mb-3">
            {phase.category.name}
          </Badge>
        )}
        
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageDocuments}
            className="h-7 px-2"
          >
            <FileText className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={index === 0}
            className="h-7 px-2"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={index === totalPhases - 1}
            className="h-7 px-2"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
