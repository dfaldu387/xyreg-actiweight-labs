import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { PhaseProduct } from "@/hooks/useCompanyProductPhases";

interface CompactPhaseCardProps {
  phase: {
    id: string;
    name: string;
    description?: string;
    position?: number;
  };
  products: PhaseProduct[];
  status: "completed" | "in-progress" | "not-started" | "at-risk";
  onClick?: () => void;
  onProductClick?: (productId: string) => void;
  isActive?: boolean;
}

export function CompactPhaseCard({ 
  phase, 
  products, 
  status, 
  onClick, 
  onProductClick,
  isActive 
}: CompactPhaseCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "at-risk":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "in-progress":
        return "border-blue-200 bg-blue-50";
      case "at-risk":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const phaseNumber = phase.position || 1;
  const phaseNumbering = `${phaseNumber}. ${phase.name}`;

  return (
    <Droppable droppableId={phase.name}>
      {(provided, snapshot) => (
        <Card 
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "transition-all duration-200 hover:shadow-md min-h-[300px] flex flex-col",
            getStatusColor(),
            snapshot.isDraggingOver && "ring-2 ring-primary bg-primary/5",
            isActive && "ring-2 ring-primary"
          )}
        >
          <CardContent className="p-3 flex-1 flex flex-col">
            {/* Phase Header */}
            <div className="text-center space-y-1 mb-3 pb-2 border-b border-border/50">
              <div className="flex items-center justify-center mb-1">
                {getStatusIcon()}
              </div>
              
              <div className="space-y-0.5">
                <h3 className="text-xs font-medium leading-tight line-clamp-2">
                  {phaseNumbering}
                </h3>
                
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-4">
                  {products.length}
                </Badge>
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[200px]">
              {products.map((product, index) => (
                <Draggable key={product.id} draggableId={product.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        "p-2 bg-background rounded border text-xs cursor-move transition-all",
                        "hover:shadow-sm hover:bg-accent/50",
                        snapshot.isDragging && "shadow-lg bg-background/95 rotate-2"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!snapshot.isDragging) {
                          onProductClick?.(product.id);
                        }
                      }}
                    >
                      <div className="font-medium line-clamp-1 mb-1">
                        {product.name}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          product.status === "On Track" && "bg-green-500",
                          product.status === "At Risk" && "bg-red-500",
                          product.status === "Needs Attention" && "bg-yellow-500"
                        )} />
                        <span className="text-muted-foreground">
                          {product.progress}%
                        </span>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              
              {products.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-4">
                  No Device
                </div>
              )}
              
              {provided.placeholder}
            </div>
          </CardContent>
        </Card>
      )}
    </Droppable>
  );
}