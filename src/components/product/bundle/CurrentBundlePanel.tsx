import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BundleProduct {
  product: {
    id: string;
    name: string;
    description?: string;
    tradeName?: string;
  };
  relationshipType: 'component' | 'accessory' | 'consumable' | 'required' | 'optional' | 'replacement_part';
  multiplier: number;
  isVariantGroup?: boolean;
  variantCount?: number;
  variantProducts?: Array<{
    id: string;
    name: string;
    trade_name?: string;
    description?: string;
    percentage?: number;
    position?: number;
  }>;
}

interface CurrentBundlePanelProps {
  bundleProducts: BundleProduct[];
  onRemoveProduct: (productId: string) => void;
}

const getRelationshipColor = (type: string) => {
  const colors = {
    component: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accessory: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    consumable: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    required: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    optional: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    replacement_part: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export function CurrentBundlePanel({ bundleProducts, onRemoveProduct }: CurrentBundlePanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (bundleProducts.length === 0) {
    return (
      <Card className="h-fit sticky top-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Current Bundle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No items in bundle yet</p>
            <p className="text-xs mt-1">Select devices or groups to add</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Current Bundle
          </CardTitle>
          <Badge variant="secondary">{bundleProducts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px] pr-4">
          <div className="space-y-2">
            {bundleProducts.map((bp) => {
              const isExpanded = expandedGroups.has(bp.product.id);
              const hasVariants = bp.isVariantGroup && bp.variantProducts && bp.variantProducts.length > 0;

              return (
                <div key={bp.product.id} className="space-y-1">
                  <div className="group relative p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 flex items-start gap-2">
                        {hasVariants && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 mt-0.5"
                            onClick={() => toggleGroup(bp.product.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {bp.product.name}
                            {bp.isVariantGroup && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (Group: {bp.variantCount} variants)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getRelationshipColor(bp.relationshipType)}`}
                            >
                              {bp.relationshipType}
                            </Badge>
                            {bp.multiplier !== 1 && (
                              <span className="text-xs text-muted-foreground">
                                ×{bp.multiplier}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRemoveProduct(bp.product.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded variant products */}
                  {hasVariants && isExpanded && (
                    <div className="ml-8 space-y-1">
                      {bp.variantProducts!.map((variant) => (
                        <div
                          key={variant.id}
                          className="p-2 rounded-md border border-dashed bg-muted/30 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {variant.trade_name || variant.name}
                              </div>
                              {variant.description && (
                                <div className="text-muted-foreground truncate mt-0.5">
                                  {variant.description}
                                </div>
                              )}
                            </div>
                            {variant.percentage !== undefined && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                {variant.percentage}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
