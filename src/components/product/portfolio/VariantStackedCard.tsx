import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VariantSummaryDisplay } from "../variants/VariantSummaryDisplay";
import { VariantGroupSummary } from "@/services/variantGroupService";
import { Badge } from "@/components/ui/badge";
import { Layers, Package } from "lucide-react";

interface Props {
  productName: string;
  variantCount?: number;
  variantSummary: VariantGroupSummary;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  imageUrl?: string;
  basicUdiDi?: string;
  groupedCount?: number;
  ungroupedCount?: number;
  products?: any[];
}

export function VariantStackedCard({
  productName,
  variantCount,
  variantSummary,
  className = "",
  children,
  onClick,
  imageUrl,
  basicUdiDi,
  groupedCount,
  ungroupedCount,
  products = [],
}: Props) {
  const totalCount = variantCount || ((groupedCount || 0) + (ungroupedCount || 0));
  
  // Compute phase overview from all products
  const phaseOverview = React.useMemo(() => {
    const phases: Record<string, number> = {};

    products.forEach(product => {
      // Use phase (from OptimizedProduct) or fall back to current_lifecycle_phase or status
      const phaseName = product.phase || product.current_lifecycle_phase || product.status || 'Unknown';
      phases[phaseName] = (phases[phaseName] || 0) + 1;
    });

    return Object.entries(phases).map(([name, count]) => ({ name, count }));
  }, [products]);
  
  // Format phase names: if only 1 product, show phase name; otherwise show with count in parentheses
  const formatPhaseDisplay = (phaseData: { name: string; count: number }[]) => {
    if (phaseData.length === 0) return null;
    return phaseData.map(({ name, count }) => 
      count > 1 ? `${name} (${count})` : name
    );
  };
  
  const phaseDisplayNames = formatPhaseDisplay(phaseOverview);
  
  return (
    <div className="relative group">
      {/* Simplified stacked effect - cleaner design */}
      <div className="absolute top-1.5 -right-1.5 w-full h-full bg-card border-2 border-border rounded-lg -z-10" />
      <div className="absolute top-3 -right-3 w-full h-full bg-muted/50 border-2 border-border rounded-lg -z-20" />
      
      <Card 
        className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 
                    border-2 rounded-lg overflow-hidden bg-card flex flex-col ${className}`}
        onClick={onClick}
      >
        {/* Product Image Header */}
        {imageUrl ? (
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-background to-muted/30">
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center">
                      <div class="text-center">
                        <svg class="h-16 w-16 text-muted-foreground mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M7.5 4.27v9.46a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4.27a2 2 0 0 1 2-2h1.5a2 2 0 0 1 2 2Z"/>
                          <path d="M20.5 8.27v9.46a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V8.27a2 2 0 0 1 2-2h1.5a2 2 0 0 1 2 2Z"/>
                          <path d="M14 12.27v5.46a2 2 0 0 1-2 2h-1.5a2 2 0 0 1-2-2v-5.46a2 2 0 0 1 2-2H12a2 2 0 0 1 2 2Z"/>
                        </svg>
                        <p class="text-sm text-muted-foreground font-medium">Product Family</p>
                      </div>
                    </div>
                  `;
                }
              }}
            />
            {/* Count badge overlay - top left */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary text-primary-foreground shadow-md font-bold px-3 py-1">
                {totalCount} products
              </Badge>
            </div>
          </div>
        ) : (
          <div className="relative h-48 bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
            <div className="text-center">
              <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Product Family</p>
            </div>
            {/* Count badge overlay */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-primary text-primary-foreground shadow-md font-bold px-3 py-1">
                {totalCount} products
              </Badge>
            </div>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <CardTitle className="text-lg flex items-center gap-2 leading-tight font-bold">
              <Layers className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="line-clamp-2">{productName}</span>
            </CardTitle>
            {basicUdiDi && (
              <p className="text-xs text-muted-foreground font-mono truncate bg-muted/50 px-2 py-1 rounded">
                {basicUdiDi}
              </p>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {/* Variants Section */}
          {Object.keys(variantSummary).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variants</div>
              <VariantSummaryDisplay summary={variantSummary} mode="compact" />
            </div>
          )}
          
          {/* Phase Overview */}
          {phaseDisplayNames && phaseDisplayNames.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phases</div>
              <div className="flex flex-wrap gap-1.5">
                {phaseDisplayNames.map((displayName, idx) => (
                  <Badge key={idx} variant="outline" className="font-normal text-xs">
                    {displayName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Grouped/Ungrouped Count */}
          {(groupedCount !== undefined || ungroupedCount !== undefined) && (
            <div className="flex gap-2 text-xs">
              {groupedCount !== undefined && groupedCount > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {groupedCount} grouped
                </Badge>
              )}
              {ungroupedCount !== undefined && ungroupedCount > 0 && (
                <Badge variant="outline" className="font-normal">
                  {ungroupedCount} ungrouped
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex-1" />
          
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
