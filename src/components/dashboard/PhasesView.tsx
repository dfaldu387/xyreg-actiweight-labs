
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useCompanyProductPhases, PhaseProduct } from "@/hooks/useCompanyProductPhases";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ProductTypeFilter } from "@/utils/productTypeDetection";
import { DraggableProductCard } from "./DraggableProductCard";
import { CompactPhaseCard } from "./CompactPhaseCard";
import { toast } from "sonner";

interface PhasesViewProps {
  companyId: string;
  selectedFilter?: ProductTypeFilter;
  productCounts?: {
    all: number;
    new_product: number;
    existing_product: number;
    line_extension: number;
  };
}

export function PhasesView({ companyId, selectedFilter = 'all', productCounts }: PhasesViewProps) {
  const navigate = useNavigate();
  const {
    activePhases,
    productsByPhase,
    unmappedProducts,
    isLoading,
    error,
    moveProduct,
    repairProduct,
    repairAllProducts,
    refreshData
  } = useCompanyProductPhases(companyId, selectedFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading phases view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-red-500">Error loading phases</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button onClick={refreshData} variant="outline" className="mt-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleProductClick = (productId: string) => {
    navigate(`/app/product/${productId}/device-information`);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;


    // No destination or same position
    if (!destination || 
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Extract phase names from droppable IDs (they should be phase names)
    const sourcePhase = source.droppableId;
    const destPhase = destination.droppableId;

    // Validate that we're moving between valid phases
    const activePhaseNames = activePhases.map(phase => phase.name);
    
    if (!activePhaseNames.includes(sourcePhase) || !activePhaseNames.includes(destPhase)) {
      console.error('Invalid phase in drag operation:', { sourcePhase, destPhase, activePhaseNames });
      toast.error('Invalid phase in drag operation');
      return;
    }

    try {
      const loadingToast = toast.loading(`Moving product to "${destPhase}"...`);
      
      await moveProduct(draggableId, sourcePhase, destPhase);
      
      toast.dismiss(loadingToast);
      toast.success(`Product moved to "${destPhase}"`);
      
      
      
    } catch (error) {
      console.error('Error in drag operation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to move product';
      toast.error(errorMessage);
    }
  };

  // Transform product data to match ProductCard expectations
  const transformProductForCard = (product: any, phaseName: string): PhaseProduct => {
    
    
    return {
      id: product.id,
      name: product.name,
      status: product.status as "On Track" | "At Risk" | "Needs Attention",
      progress: product.progress || 65,
      phase: phaseName,
      phaseId: null,
      company: companyId,
      description: product.description,
      class: product.class,
      image: product.image,
      targetDate: product.targetDate,
      isMoveBlocked: false,
      // Pass through the product type detection properties
      project_types: product.project_types,
      is_line_extension: product.is_line_extension,
      parent_product_id: product.parent_product_id,
      // Add base product name for existing products
      base_product_name: product.base_product_name,
      // Add product platform for line extensions
      product_platform: product.product_platform
    };
  };

  return (
    <div className="space-y-6">
      {/* Unmapped Products Warning */}
      {unmappedProducts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg text-yellow-800">
                  Products Need Phase Assignment
                </CardTitle>
              </div>
              <Button
                onClick={repairAllProducts}
                variant="outline"
                size="sm"
                className="border-yellow-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Repair All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unmappedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{product.name}</span>
                    <p className="text-sm text-muted-foreground">{product.issue}</p>
                  </div>
                  <Button
                    onClick={() => repairProduct(product.id)}
                    variant="outline"
                    size="sm"
                  >
                    Repair
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Phases Row with Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-4">
          {activePhases.map((phase, index) => {
            const phaseProducts = productsByPhase[phase.name] || [];
            const transformedProducts = phaseProducts.map(product => 
              transformProductForCard(product, phase.name)
            );
            
            // Determine status based on products in this phase
            const getPhaseStatus = () => {
              if (phaseProducts.length === 0) return "not-started";
              
              const completedProducts = phaseProducts.filter(p => p.status === "On Track").length;
              const atRiskProducts = phaseProducts.filter(p => p.status === "At Risk" || p.status === "Needs Attention").length;
              
              if (atRiskProducts > 0) return "at-risk";
              if (completedProducts === phaseProducts.length) return "completed";
              return "in-progress";
            };

            return (
              <CompactPhaseCard
                key={phase.id}
                phase={phase}
                products={transformedProducts}
                status={getPhaseStatus()}
                onProductClick={handleProductClick}
              />
            );
          })}
        </div>
      </DragDropContext>

      {activePhases.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No phases configured</h3>
          <p className="text-muted-foreground">
            Configure lifecycle phases in company settings to use the phases view.
          </p>
        </div>
      )}
    </div>
  );
}
