import React from "react";
import { useNavigate } from "react-router-dom";
import { ModelCard } from "./ModelCard";
import { ModelWithVariants } from "@/services/modelManagementService";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

interface ModelGroupViewProps {
  models: ModelWithVariants[];
  isLoading?: boolean;
  onEditModel?: (modelId: string) => void;
  onAddVariant?: (modelId: string) => void;
}

export function ModelGroupView({
  models,
  isLoading,
  onEditModel,
  onAddVariant
}: ModelGroupViewProps) {
  const navigate = useNavigate();

  const handleProductClick = (productId: string) => {
    navigate(`/app/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Models Found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Models will appear here once you create product families with variants.
          Create your first model by adding a product and selecting "Part of Model Family".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          onEditModel={onEditModel}
          onAddVariant={onAddVariant}
          onProductClick={handleProductClick}
        />
      ))}
    </div>
  );
}
