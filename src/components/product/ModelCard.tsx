import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Package, Edit, Plus, Star } from "lucide-react";
import { ModelWithVariants } from "@/services/modelManagementService";
import { PortfolioProductCard } from "@/components/product/portfolio/PortfolioProductCard";
import { VariantGroupSummary } from "@/services/variantGroupService";
import { VariantSummaryDisplay } from "@/components/product/variants/VariantSummaryDisplay";
import { cn } from "@/lib/utils";

interface ModelCardProps {
  model: ModelWithVariants | {
    name: string;
    basicUdiDi?: string;
    productCount?: number;
    variantSummary?: VariantGroupSummary;
    products?: any[];
    imageUrl?: string;
    description?: string;
    model_code?: string;
    regulatory_class?: string;
    risk_class?: string;
    is_active?: boolean;
  };
  onEditModel?: (modelId: string) => void;
  onEdit?: () => void; // Alternative to onEditModel for merged cards
  onAddVariant?: (modelId: string) => void;
  onProductClick?: (productId: string) => void;
  defaultExpanded?: boolean;
}

export function ModelCard({
  model,
  onEditModel,
  onEdit,
  onAddVariant,
  onProductClick,
  defaultExpanded = false
}: ModelCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Check if this is a merged product family card (has products array)
  const isMergedFamily = 'products' in model && model.products && model.products.length > 0;
  
  const hasVariants = isMergedFamily 
    ? model.products!.length > 0 
    : 'variants' in model && model.variants && model.variants.length > 0;
  
  const primaryVariant = !isMergedFamily && 'variants' in model
    ? model.variants?.find(v => v.id === model.primary_product_id)
    : undefined;

  return (
    <Card className={cn(
      "transition-all duration-200",
      isExpanded ? "ring-2 ring-primary/20" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-0.5 h-6 w-6 p-0 shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg truncate">{model.name}</CardTitle>
                <Badge variant="secondary" className="shrink-0">
                  <Package className="h-3 w-3 mr-1" />
                  {isMergedFamily 
                    ? `${model.productCount || model.products!.length} variant${(model.productCount || model.products!.length) !== 1 ? 's' : ''}`
                    : `${'variant_count' in model ? model.variant_count || 0 : 0} variant${'variant_count' in model && model.variant_count !== 1 ? 's' : ''}`
                  }
                </Badge>
                {model.is_active === false && (
                  <Badge variant="outline" className="shrink-0">Inactive</Badge>
                )}
                {isMergedFamily && (
                  <Badge variant="default" className="shrink-0">Merged</Badge>
                )}
              </div>

              {model.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {model.description}
                </p>
              )}

              {/* Show variant summary for merged families */}
              {isMergedFamily && model.variantSummary && (
                <div className="mt-2">
                  <VariantSummaryDisplay summary={model.variantSummary} mode="compact" />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                {model.model_code && (
                  <span className="flex items-center gap-1">
                    <strong>Code:</strong> {model.model_code}
                  </span>
                )}
                {(('basicUdiDi' in model && model.basicUdiDi) || ('basic_udi_di' in model && model.basic_udi_di)) && (
                  <span className="flex items-center gap-1">
                    <strong>Basic UDI-DI:</strong> {('basicUdiDi' in model && model.basicUdiDi) || ('basic_udi_di' in model && model.basic_udi_di) || ''}
                  </span>
                )}
                {model.regulatory_class && (
                  <span className="flex items-center gap-1">
                    <strong>Class:</strong> {model.regulatory_class}
                  </span>
                )}
                {model.risk_class && (
                  <span className="flex items-center gap-1">
                    <strong>Risk:</strong> {model.risk_class}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {onAddVariant && 'id' in model && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddVariant(model.id)}
                className="gap-2"
              >
                <Plus className="h-3 w-3" />
                Add Variant
              </Button>
            )}
            {onEditModel && 'id' in model && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditModel(model.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && hasVariants && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              Product Variants
            </div>
            
            {isMergedFamily ? (
              // Show table view for merged family cards
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant Name</TableHead>
                      <TableHead>UDI-DI</TableHead>
                      <TableHead>Variant Tags</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {model.products!.map((product) => (
                      <TableRow 
                        key={product.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onProductClick?.(product.id)}
                      >
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {product.udi_di || <span className="text-muted-foreground">Not set</span>}
                        </TableCell>
                        <TableCell>
                          {product.variant_tags && Object.keys(product.variant_tags).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(product.variant_tags).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {value as string}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">No tags</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                            {product.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              // Show card grid for regular model variants
              <div className="grid gap-3">
                {'variants' in model && model.variants?.map((variant) => (
                  <div
                    key={variant.id}
                    className="relative cursor-pointer"
                    onClick={() => onProductClick?.(variant.id)}
                  >
                    {variant.id === model.primary_product_id && (
                      <div className="absolute -left-2 top-2 z-10">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                    <PortfolioProductCard product={variant} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}

      {isExpanded && !hasVariants && (
        <CardContent className="pt-0">
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No variants added yet</p>
            {onAddVariant && 'id' in model && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddVariant(model.id)}
                className="gap-2 mt-3"
              >
                <Plus className="h-3 w-3" />
                Add First Variant
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
