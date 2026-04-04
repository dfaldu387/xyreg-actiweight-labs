import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketFilters } from './MarketFilters';
import { EnhancedSunburstNode } from '@/services/portfolioSunburstService';
import { 
  Zap, 
  Battery, 
  Palette, 
  Power,
  RotateCcw,
  Filter,
  Settings
} from 'lucide-react';
import { useVariationDimensions } from '@/hooks/useVariationDimensions';
import { useCompanyInfo } from '@/hooks/useCompanyInfo';

export interface VariantFilters {
  [dimensionId: string]: string[];
}

export interface MarketFilters {
  [marketCode: string]: boolean;
}

export interface CombinedFilters {
  variants: VariantFilters;
  markets: MarketFilters;
}

interface VariantFiltersProps {
  filters: VariantFilters;
  onFiltersChange: (filters: VariantFilters) => void;
  marketFilters?: MarketFilters;
  onMarketFiltersChange?: (filters: MarketFilters) => void;
  availableMarkets?: string[];
  className?: string;
  onHighlightInHierarchy?: (selectedPaths: string[][]) => void;
  portfolioData?: EnhancedSunburstNode;
}

const getIconForDimension = (dimensionName: string) => {
  const name = dimensionName.toLowerCase();
  if (name.includes('tech') || name.includes('level')) return Zap;
  if (name.includes('recharg') || name.includes('battery')) return Battery;
  if (name.includes('color') || name.includes('colour')) return Palette;
  if (name.includes('power') || name.includes('watt')) return Power;
  return Settings;
};

const getColorForDimension = (dimensionName: string) => {
  const name = dimensionName.toLowerCase();
  if (name.includes('tech') || name.includes('level')) 
    return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
  if (name.includes('recharg') || name.includes('battery')) 
    return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
  if (name.includes('color') || name.includes('colour')) 
    return 'bg-rose-100 text-rose-800 hover:bg-rose-200';
  if (name.includes('power') || name.includes('watt')) 
    return 'bg-sky-100 text-sky-800 hover:bg-sky-200';
  return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
};

// Helper function to extract product paths from sunburst data
const extractProductPaths = (node: EnhancedSunburstNode, currentPath: string[] = []): string[][] => {
  const paths: string[][] = [];
  
  // If this is a leaf node (has productId), it's a product
  if (node.productId) {
    paths.push([...currentPath, node.name]);
    return paths;
  }
  
  // If this node has children, traverse them
  if (node.children) {
    for (const child of node.children) {
      const childPaths = extractProductPaths(child, [...currentPath, node.name]);
      paths.push(...childPaths);
    }
  }
  
  return paths;
};

export function VariantFilters({ 
  filters, 
  onFiltersChange, 
  marketFilters = {}, 
  onMarketFiltersChange, 
  availableMarkets = [],
  className = '',
  onHighlightInHierarchy,
  portfolioData
}: VariantFiltersProps) {
  const { data: companyInfo } = useCompanyInfo();
  const { dimensions, optionsByDimension, loading } = useVariationDimensions(companyInfo?.id);

  const toggleOption = (dimensionId: string, optionId: string) => {
    const currentOptions = filters[dimensionId] || [];
    const newOptions = currentOptions.includes(optionId)
      ? currentOptions.filter(o => o !== optionId)
      : [...currentOptions, optionId];
    
    onFiltersChange({
      ...filters,
      [dimensionId]: newOptions
    });
  };

  const clearCategory = (dimensionId: string) => {
    onFiltersChange({
      ...filters,
      [dimensionId]: []
    });
  };

  const clearAll = () => {
    const clearedFilters: VariantFilters = {};
    dimensions.forEach(dim => {
      clearedFilters[dim.id] = [];
    });
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const totalActiveFilters = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
  const hasActiveMarketFilters = Object.values(marketFilters).some(Boolean);
  const hasAnyActiveFilters = hasActiveFilters || hasActiveMarketFilters;
  
  // Always show button when handler is provided and there are any filters active
  const shouldShowButton = onHighlightInHierarchy && (hasActiveFilters || hasActiveMarketFilters);

  if (loading) {
    return (
      <Card className={`h-fit shadow-lg border-0 bg-gradient-to-br from-background to-muted/20 ${className}`}>
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!dimensions.length) {
    return (
      <div className={className}>
        <Card className={`h-fit shadow-lg border-0 bg-gradient-to-br from-background to-muted/20`}>
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold">Variant Filters</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              No variant dimensions configured yet.
            </p>
          </CardHeader>
        </Card>

        {/* Always show hierarchy button even when no variant dimensions */}
        {onHighlightInHierarchy && (
          <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
            <Button
              onClick={() => {
                const activeMarkets = Object.keys(marketFilters).filter(key => marketFilters[key]);

                let selectedPaths: string[][] = [];
                if (portfolioData && activeMarkets.length > 0) {
                  // Extract actual product paths from filtered data
                  selectedPaths = extractProductPaths(portfolioData);
                } else if (activeMarkets.length > 0) {
                  selectedPaths.push(['filtered-devices']);
                } else {
                  selectedPaths.push(['no-filters-active']);
                }

                onHighlightInHierarchy(selectedPaths);
              }}
              variant="outline"
              size="sm"
              className="w-full text-sm bg-primary/10 hover:bg-primary/20 border-primary/30"
              disabled={!hasActiveMarketFilters}
            >
              <Filter className="h-4 w-4 mr-2" />
              Highlight in Hierarchy
              {hasActiveMarketFilters && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {Object.keys(marketFilters).filter(key => marketFilters[key]).length} markets
                </Badge>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {hasActiveMarketFilters 
                ? "Check filtered devices in hierarchy for bulk operations"
                : "Select market filters above to highlight specific devices in hierarchy"
              }
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Filters */}
      {availableMarkets.length > 0 && onMarketFiltersChange && (
        <MarketFilters
          filters={marketFilters}
          availableMarkets={availableMarkets}
          onFiltersChange={onMarketFiltersChange}
          className="h-fit"
        />
      )}

      {/* Variant Filters */}
      <Card className={`shadow-lg border-0 bg-gradient-to-br from-background to-muted/20 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Filter className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Variant Filters</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {totalActiveFilters} active
                </Badge>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all h-8 px-3"
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Clear All
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Filter products by variant attributes. Toggle options to refine your portfolio view.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {dimensions.map((dimension, index) => {
          const Icon = getIconForDimension(dimension.name);
          const color = getColorForDimension(dimension.name);
          const activeOptions = filters[dimension.id] || [];
          const options = optionsByDimension[dimension.id] || [];
          
          return (
            <div key={dimension.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <h4 className="font-medium text-xs">{dimension.name}</h4>
                  {activeOptions.length > 0 && (
                    <Badge variant="outline" className="text-xs h-4 px-1">
                      {activeOptions.length}
                    </Badge>
                  )}
                </div>
                {activeOptions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearCategory(dimension.id)}
                    className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {options.map((option) => {
                  const isActive = activeOptions.includes(option.id);
                  
                  return (
                    <Button
                      key={option.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleOption(dimension.id, option.id)}
                      className={`
                        text-xs font-medium transition-all duration-300 transform h-7
                        ${isActive 
                          ? `${color} border-current shadow-md scale-105` 
                          : 'hover:bg-muted/70 hover:scale-102 hover:shadow-sm'
                        }
                      `}
                    >
                      {option.name}
                    </Button>
                  );
                })}
              </div>
              
              {index !== dimensions.length - 1 && <Separator className="mt-4 opacity-50" />}
            </div>
          );
        })}
        
        {hasActiveFilters && (
          <div className="pt-3 mt-4 border-t">
            <div className="space-y-2">
              <h5 className="font-medium text-xs text-muted-foreground">Active Filters:</h5>
              <div className="flex flex-wrap gap-1">
                {Object.entries(filters).flatMap(([dimensionId, optionIds]) => {
                  const dimension = dimensions.find(d => d.id === dimensionId);
                  const dimensionOptions = optionsByDimension[dimensionId] || [];
                  
                  return optionIds.map((optionId) => {
                    const option = dimensionOptions.find(o => o.id === optionId);
                    
                    return (
                      <Badge
                        key={`${dimensionId}-${optionId}`}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors h-5"
                        onClick={() => toggleOption(dimensionId, optionId)}
                      >
                        {option?.name || optionId} ×
                      </Badge>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      </Card>

      {/* Highlight in Hierarchy Button - Always show when handler is provided */}
      {onHighlightInHierarchy && (
        <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <Button
            onClick={() => {
              // Get currently filtered products count for better UX
              const activeMarkets = Object.keys(marketFilters).filter(key => marketFilters[key]);
              const activeVariantCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

              let selectedPaths: string[][] = [];

              if (portfolioData && (activeMarkets.length > 0 || activeVariantCount > 0)) {
                // Extract actual product paths from filtered data
                selectedPaths = extractProductPaths(portfolioData);
              } else if (activeMarkets.length > 0 || activeVariantCount > 0) {
                selectedPaths.push(['filtered-devices']);
              } else {
                selectedPaths.push(['no-filters-active']);
              }

              onHighlightInHierarchy(selectedPaths);
            }}
            variant="outline"
            size="sm"
            className="w-full text-sm bg-primary/10 hover:bg-primary/20 border-primary/30"
            disabled={!hasActiveFilters && !hasActiveMarketFilters}
          >
            <Filter className="h-4 w-4 mr-2" />
            Highlight in Hierarchy
            {hasActiveMarketFilters && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {Object.keys(marketFilters).filter(key => marketFilters[key]).length} markets
              </Badge>
            )}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {Object.values(filters).reduce((sum, arr) => sum + arr.length, 0)} variants
              </Badge>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {hasActiveFilters || hasActiveMarketFilters 
              ? "Check filtered devices in hierarchy for bulk operations"
              : "Select filters above to highlight specific devices in hierarchy"
            }
          </p>
        </div>
      )}
    </div>
  );
}