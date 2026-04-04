
import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { ProductCard } from "@/components/product/board/ProductCard";
import { PhaseProduct } from "@/hooks/useCompanyProductPhases";

interface DraggableProductCardProps {
  product: PhaseProduct;
  index: number;
  onProductClick: (productId: string) => void;
}

export function DraggableProductCard({ product, index, onProductClick }: DraggableProductCardProps) {
  return (
    <Draggable key={product.id} draggableId={product.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`transition-transform duration-200 ${
            snapshot.isDragging ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.02]'
          }`}
        >
          <ProductCard
            product={product}
            isBlocked={false}
            isMoving={snapshot.isDragging}
            isDraggable={true}
            isDragging={snapshot.isDragging}
            onDragStart={() => {}}
            onDragEnd={() => {}}
            onClick={() => !snapshot.isDragging && onProductClick(product.id)}
          />
        </div>
      )}
    </Draggable>
  );
}
