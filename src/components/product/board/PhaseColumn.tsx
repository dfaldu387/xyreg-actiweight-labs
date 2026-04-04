import React from "react";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { PhaseProduct } from "@/hooks/useCompanyProductPhases";
import { cleanPhaseName } from "@/utils/phaseNumbering";

interface LifecyclePhaseConfig {
  id: string;
  name: string;
  description?: string;
  isLocked?: boolean;
}

interface PhaseColumnProps {
  phase: LifecyclePhaseConfig & { position?: number };
  products: PhaseProduct[];
  droppableId: string;
}

export function PhaseColumn({
  phase,
  products,
  droppableId,
}: PhaseColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const displayName = cleanPhaseName(phase.name);

  return (
    <div
      key={phase.id}
      className={cn(
        "min-w-[280px] w-[340px] max-w-[90vw] rounded-xl bg-muted/60 border p-2 flex flex-col",
        phase.isLocked && "bg-gray-100 border-dashed border-gray-300 opacity-80"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      data-droppable-id={droppableId}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="space-y-1">
          <h4 className="text-base font-semibold flex gap-2 items-center">
            {displayName}
            {phase.isLocked && (
              <span className="ml-1 text-xs px-1 rounded bg-secondary/40 text-muted-foreground border border-gray-200">
                Locked
              </span>
            )}
          </h4>
        </div>
        <span className="text-xs text-muted-foreground bg-gray-100 px-2 rounded">
          {products.length}
        </span>
      </div>

      <div className="space-y-3 min-h-[60px]">
        {products.length === 0 && (
          <div className="text-xs text-muted-foreground italic p-2 text-center">
            No products
          </div>
        )}
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isBlocked={false}
            isMoving={false}
            onDragStart={() => {}}
            onDragEnd={() => {}}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
