import React from 'react';
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

interface DividedPhasesBarProps {
  data: PhaseData[];
  title?: string;
  onProductClick?: (productId: string) => void;
}

export function DividedPhasesBar({ data, title, onProductClick }: DividedPhasesBarProps) {
  const totalProducts = data.reduce((sum, phase) => sum + phase.total, 0);
  
  const getPhaseColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold">{title}</h3>
      )}
      
      {/* Main divided bar */}
      <div className="relative">
        <div className="flex h-16 rounded-lg overflow-hidden border border-gray-200">
          {data.map((phase, index) => {
            const widthPercentage = totalProducts > 0 ? (phase.total / totalProducts) * 100 : 0;
            const minWidth = phase.total > 0 ? Math.max(widthPercentage, 8) : 0;
            
            if (minWidth === 0) return null;
            
            return (
              <div
                key={phase.phase}
                className={cn(
                  "flex items-center justify-center text-white font-medium text-sm transition-opacity hover:opacity-80 cursor-pointer relative group",
                  getPhaseColor(index)
                )}
                style={{ width: `${widthPercentage}%` }}
                title={`${phase.phase}: ${phase.total} products`}
              >
                <span className="truncate px-2 text-center">
                  {phase.phase.replace(/^\(\d+\)\s*|^\d+\.\s*/, '')} ({phase.total})
                </span>
                
                {/* Tooltip with product list */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-black text-white text-xs rounded py-2 px-3 max-w-xs">
                    <div className="font-semibold mb-1">{phase.phase}</div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {phase.products.slice(0, 10).map((product) => (
                        <div 
                          key={product.id}
                          className="cursor-pointer hover:text-blue-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductClick?.(product.id);
                          }}
                        >
                          • {product.name}
                        </div>
                      ))}
                      {phase.products.length > 10 && (
                        <div className="text-gray-300">
                          +{phase.products.length - 10} more...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Phase labels below bar */}
      <div className="flex flex-wrap gap-3 text-sm">
        {data.filter(phase => phase.total > 0).map((phase, index) => (
          <div key={phase.phase} className="flex items-center gap-2">
            <div 
              className={cn("w-4 h-4 rounded", getPhaseColor(index))}
            />
            <span className="font-medium">
              {phase.phase.replace(/^\(\d+\)\s*|^\d+\.\s*/, '')}
            </span>
            <span className="text-muted-foreground">
              ({phase.total} product{phase.total !== 1 ? 's' : ''})
            </span>
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {totalProducts === 0 && (
        <div className="flex h-16 rounded-lg border border-dashed border-gray-300 items-center justify-center">
          <p className="text-muted-foreground">No products assigned to phases</p>
        </div>
      )}
    </div>
  );
}