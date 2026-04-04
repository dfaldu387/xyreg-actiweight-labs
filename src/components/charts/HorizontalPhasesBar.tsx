import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  status?: string;
  progress?: number;
}

interface PhaseData {
  phase: string;
  products: Product[];
  total: number;
}

interface HorizontalPhasesBarProps {
  data: PhaseData[];
  title?: string;
  onProductClick?: (productId: string) => void;
}

export function HorizontalPhasesBar({ data, title, onProductClick }: HorizontalPhasesBarProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "On Track":
        return "bg-green-100 text-green-800 border-green-200";
      case "At Risk":
        return "bg-red-100 text-red-800 border-red-200";
      case "Needs Attention":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const totalProducts = data.reduce((sum, phase) => sum + phase.total, 0);

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold">{title}</h3>
      )}
      
      <div className="flex gap-2 overflow-x-auto pb-4">
        {data.map((phase, index) => {
          const widthPercentage = totalProducts > 0 ? (phase.total / totalProducts) * 100 : 0;
          const minWidth = phase.total > 0 ? Math.max(widthPercentage, 15) : 10; // Minimum 15% width for phases with products, 10% for empty
          
          return (
            <Card 
              key={phase.phase} 
              className="flex-shrink-0 border-2"
              style={{ width: `${minWidth}%`, minWidth: '200px' }}
            >
              <CardContent className="p-4 h-full">
                {/* Phase Header */}
                <div className="mb-4 pb-2 border-b">
                  <h4 className="font-medium text-sm mb-1 truncate" title={phase.phase}>
                    {phase.phase}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {phase.total} product{phase.total !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Products List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {phase.products.length > 0 ? (
                    phase.products.map((product) => (
                      <div
                        key={product.id}
                        className={cn(
                          "p-2 rounded border cursor-pointer hover:shadow-sm transition-shadow",
                          getStatusColor(product.status)
                        )}
                        onClick={() => onProductClick?.(product.id)}
                      >
                        <p className="text-xs font-medium truncate mb-1" title={product.name}>
                          {product.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs h-5">
                            {product.status || 'Unknown'}
                          </Badge>
                          {product.progress !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {product.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-xs text-muted-foreground">No products</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span>On Track</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span>Needs Attention</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
          <span>At Risk</span>
        </div>
      </div>
    </div>
  );
}