
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProductPhase } from "@/types/client";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ProductPhaseCardProps {
  phase: ProductPhase;
  onClick?: (phase: ProductPhase) => void;
  isActive?: boolean;
}

export function ProductPhaseCard({ phase, onClick, isActive }: ProductPhaseCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-500";
      case "In Progress":
        return "text-blue-500";
      case "Not Started":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "Not Started":
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isActive && "ring-2 ring-primary"
      )}
      onClick={() => onClick?.(phase)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">{phase.name}</h3>
          {phase.isCurrentPhase && (
            <Badge variant="default" className="text-xs">
              Current
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <span className={getStatusColor(phase.status)}>
            {getStatusIcon(phase.status)}
          </span>
          <span>{phase.status}</span>
        </div>
        
        {phase.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {phase.description}
          </p>
        )}
        
        {phase.deadline && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              Due: {new Date(phase.deadline).toLocaleDateString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
