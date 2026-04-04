import React from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { PhaseColumn } from "./PhaseColumn";
import { EnhancedUnmappedProductColumn } from "./EnhancedUnmappedProductColumn";
import { useCompanyProductPhases, PhaseProduct } from "@/hooks/useCompanyProductPhases";
import { validateExactPhaseMatch } from "@/utils/phaseNameUtils";
import { encodePhaseDroppableId, decodePhaseDroppableId, extractProductId } from "@/utils/droppableIdUtils";
import { toast } from "sonner";

interface EnhancedLifecyclePhaseBoardProps {
  companyId: string;
}

export function EnhancedLifecyclePhaseBoard({ companyId }: EnhancedLifecyclePhaseBoardProps) {
  const {
    activePhases,
    productsByPhase,
    unmappedProducts,
    isLoading,
    error,
    moveProduct,
    repairProduct,
    repairAllProducts
  } = useCompanyProductPhases(companyId);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // No destination or same position
    if (!destination || 
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Don't allow dropping into unmapped column
    if (destination.droppableId === 'unmapped-products') {
      toast.error('Cannot move products to unmapped section');
      return;
    }

    // Extract product ID from draggable ID
    const productId = extractProductId(draggableId);
    if (!productId) {
      console.error('Invalid product ID:', draggableId);
      toast.error('Invalid product ID in drag operation');
      return;
    }

    // Decode phase names from droppable IDs
    const sourcePhase = decodePhaseDroppableId(source.droppableId);
    const destPhase = decodePhaseDroppableId(destination.droppableId);

    if (!sourcePhase || !destPhase) {
      console.error('Failed to decode phases:', {
        sourceDroppableId: source.droppableId,
        destDroppableId: destination.droppableId
      });
      toast.error('Invalid phase in drag operation');
      return;
    }

    // Validate exact phase names
    const activePhaseNames = activePhases.map(phase => phase.name);
    
    if (!validateExactPhaseMatch(destPhase, activePhaseNames)) {
      console.error('Invalid destination phase:', destPhase, 'Available:', activePhaseNames);
      toast.error(`Invalid destination phase: "${destPhase}"`);
      return;
    }

    try {
      const loadingToast = toast.loading(`Moving product to "${destPhase}"...`);
      
      // Use the simplified moveProduct function with optimistic updates
      await moveProduct(productId, sourcePhase, destPhase);
      
      toast.dismiss(loadingToast);
      toast.success(`Product moved to "${destPhase}"`);
       
    } catch (error) {
      console.error('Error in drag operation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to move product';
      toast.error(errorMessage);
    }
  };

  const handleRepairAll = async () => {
    try {
      await repairAllProducts();
    } catch (error) {
      console.error('Error repairing all products:', error);
    }
  };

  const handleRepairProduct = async (productId: string) => {
    try {
      await repairProduct(productId);
    } catch (error) {
      console.error('Error repairing product:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground font-medium">
            Loading phase data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-medium mb-2">
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-sm text-red-600 hover:text-red-800 hover:underline font-medium"
        >
          Refresh page
        </button>
      </div>
    );
  }

  if (activePhases.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-700 font-medium mb-1">
          No active phases configured for this company.
        </p>
        <p className="text-sm text-gray-600">
          Please configure lifecycle phases in company settings.
        </p>
      </div>
    );
  }

  // Convert ProductPhaseInfo to PhaseProduct for the phase columns
  const convertToPhaseProducts = (phaseProducts: any[]): PhaseProduct[] => {
    return phaseProducts.map(product => ({
      id: product.id,
      name: product.name,
      status: product.status as "On Track" | "At Risk" | "Needs Attention",
      progress: 0, // Default progress since ProductPhaseInfo doesn't have it
      phase: product.currentPhase || "",
      phaseId: null, // Will be set based on the phase context
      company: companyId,
      description: product.description,
      class: product.class,
      image: product.image,
      targetDate: product.targetDate,
      // Add product type detection properties
      project_types: product.project_types,
      is_line_extension: product.is_line_extension,
      parent_product_id: product.parent_product_id,
      // Add base product name for existing products
      base_product_name: product.base_product_name
    }));
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Phase Board Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 truncate">
            Lifecycle Phases
          </h3>
          <p className="text-sm text-gray-600 mt-1 truncate">
            Drag products between phases to update their lifecycle status
          </p>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md border flex-shrink-0 ml-4">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="font-medium">{activePhases.length} phases</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-medium">
              {Object.values(productsByPhase).reduce((sum, products) => sum + products.length, 0)} products
            </span>
            {unmappedProducts.length > 0 && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-amber-700 font-semibold">
                  {unmappedProducts.length} need repair
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drag and Drop Board */}
      <div className="w-full max-w-full overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 pb-6 min-w-max">
            {/* Active Phase Columns */}
            {activePhases.map((phase, index) => {
              const phaseProducts = productsByPhase[phase.name] || [];
              const convertedProducts = convertToPhaseProducts(phaseProducts);
              const safeDroppableId = encodePhaseDroppableId(phase.name);
              
              return (
                <PhaseColumn
                  key={phase.id}
                  phase={{
                    id: phase.id,
                    name: phase.name,
                    description: phase.description,
                    position: phase.position || index
                  }}
                  products={convertedProducts}
                  droppableId={safeDroppableId}
                />
              );
            })}

            {/* Unmapped Products Column */}
            <EnhancedUnmappedProductColumn
              unmappedProducts={unmappedProducts}
              onRepairProduct={handleRepairProduct}
              onRepairAll={handleRepairAll}
              loading={isLoading}
            />
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
