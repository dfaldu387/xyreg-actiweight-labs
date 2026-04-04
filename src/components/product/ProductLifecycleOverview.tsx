
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChartProduct } from "@/types/client";
import { cn } from "@/lib/utils";
import { StatusCircles } from "@/components/ui/status-circles";

interface Props {
  products: ChartProduct[];
  companyId?: string;
}

export function ProductLifecycleOverview({ products, companyId }: Props) {
  const [companyPhases, setCompanyPhases] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch company phases to ensure we display them in the correct order
  useEffect(() => {
    const fetchCompanyPhases = async () => {
      if (!companyId) return;
      
      try {
        const { data: companyData } = await supabase
          .from('companies')
          .select('id')
          .eq('name', decodeURIComponent(companyId))
          .maybeSingle();
        
        if (companyData?.id) {
          const { data: phases } = await supabase
            .from('company_chosen_phases')
            .select(`
              position,
              company_phases!inner(id, name)
            `)
            .eq('company_id', companyData.id)
            .order('position');
          
          if (phases) {
            setCompanyPhases(phases.map(p => ({
              id: (p.company_phases as any).id,
              name: (p.company_phases as any).name
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching company phases:", error);
        toast.error("Failed to load company phases");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanyPhases();
  }, [companyId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "rgb(34, 197, 94)"; // green-500
      case "At Risk":
        return "rgb(239, 68, 68)"; // red-500
      case "Needs Attention":
        return "rgb(234, 179, 8)"; // yellow-500
      default:
        return "rgb(148, 163, 184)"; // slate-400
    }
  };

  const getPhaseIndex = (phaseName: string) => {
    return companyPhases.findIndex(phase => phase.name === phaseName);
  };

  // Group products by phase and sort within each phase
  const groupedProducts = companyPhases.map(phase => ({
    phase: phase.name,
    products: products
      .filter(product => product.phase === phase.name)
      .sort((a, b) => {
        // Sort by category, platform, model
        const categoryCompare = (a.name || '').localeCompare(b.name || '');
        if (categoryCompare !== 0) return categoryCompare;
        
        // You can extend this to sort by actual category, platform, model fields if available
        return (a.name || '').localeCompare(b.name || '');
      })
  }));

  console.log("Grouped products:", groupedProducts); // Debugging

  if (isLoading) {
    return (
      <div className="w-full space-y-8 p-6">
        <h2 className="text-2xl font-bold mb-6">Product Lifecycle Overview</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Product Lifecycle Overview</h2>
        <div className="flex gap-2">
          {["On Track", "At Risk", "Needs Attention"].map((status) => (
            <Badge 
              key={status}
              className={cn(
                "bg-background",
                status === "On Track" && "border-green-500 text-green-700",
                status === "At Risk" && "border-red-500 text-red-700",
                status === "Needs Attention" && "border-yellow-500 text-yellow-700"
              )}
              variant="outline"
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* 6 Phases Layout */}
      <div className="grid grid-cols-6 gap-4 min-h-[500px]">
        {groupedProducts.slice(0, 6).map((phaseGroup, phaseIndex) => (
          <div key={phaseGroup.phase} className="space-y-3">
            {/* Phase Header */}
            <div className="bg-muted/50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-center truncate" title={phaseGroup.phase}>
                {phaseGroup.phase}
              </h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {phaseGroup.products.length} products
              </p>
            </div>
            
            {/* Products in Phase */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {phaseGroup.products.map((product) => (
                <Card key={product.id} className="p-2 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    {/* Status Circles */}
                    <StatusCircles 
                      status={product.status || 'Unknown'}
                      progress={product.progress || 0}
                    />
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" title={product.name}>
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground truncate">
                          {product.progress || 0}% • {product.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {/* Empty State */}
              {phaseGroup.products.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-muted-foreground">No products in this phase</p>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Fill remaining columns if less than 6 phases */}
        {Array.from({ length: Math.max(0, 6 - groupedProducts.length) }).map((_, index) => (
          <div key={`empty-${index}`} className="space-y-3">
            <div className="bg-muted/20 rounded-lg p-3 border-2 border-dashed border-muted">
              <h3 className="text-sm text-muted-foreground text-center">
                Phase {groupedProducts.length + index + 1}
              </h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                No phase defined
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
