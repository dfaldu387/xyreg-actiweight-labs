import React, { useState, useMemo } from 'react';
import { Search, Package, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProductsByBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedProductSelectorProps {
  companyId: string;
  selectedProductIds: string[];
  selectedGroupIds?: string[];
  onSelectionChange: (productIds: string[], groupIds?: string[]) => void;
  excludeProductId?: string;
  label?: string;
  allowGroupSelection?: boolean;
}

interface SiblingGroup {
  id: string;
  basic_udi_di: string;
  name: string;
  distribution_pattern: string;
  product_sibling_assignments: Array<{
    id: string;
    product_id: string;
    percentage: number;
  }>;
}

export function EnhancedProductSelector({
  companyId,
  selectedProductIds,
  selectedGroupIds = [],
  onSelectionChange,
  excludeProductId,
  label = "Select Products",
  allowGroupSelection = true,
}: EnhancedProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { groupedProducts, isLoading: productsLoading } = useProductsByBasicUDI(companyId);

  // Fetch sibling groups
  const { data: siblingGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['sibling-groups-all', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sibling_groups')
        .select(`
          id,
          basic_udi_di,
          name,
          distribution_pattern,
          product_sibling_assignments(id, product_id, percentage)
        `)
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return data as SiblingGroup[];
    },
    enabled: !!companyId && allowGroupSelection,
  });

  // Create a map of basic_udi_di to sibling groups
  const groupsByBasicUDI = useMemo(() => {
    const map = new Map<string, SiblingGroup[]>();
    siblingGroups.forEach(group => {
      if (!map.has(group.basic_udi_di)) {
        map.set(group.basic_udi_di, []);
      }
      map.get(group.basic_udi_di)!.push(group);
    });
    return map;
  }, [siblingGroups]);

  // Filter and organize data
  const filteredData = useMemo(() => {
    if (!groupedProducts) return [];

    const searchLower = searchTerm.toLowerCase();
    const result: Array<{
      basicUDI: string;
      products: Array<any>;
      groups: SiblingGroup[];
    }> = [];

    groupedProducts.forEach((products, basicUDI) => {
      const filteredProducts = products.filter(p => {
        if (p.id === excludeProductId) return false;
        if (!searchTerm) return true;
        return (
          p.name.toLowerCase().includes(searchLower) ||
          p.trade_name?.toLowerCase().includes(searchLower) ||
          p.model_reference?.toLowerCase().includes(searchLower)
        );
      });

      const groups = groupsByBasicUDI.get(basicUDI) || [];
      const filteredGroups = groups.filter(g => {
        if (!searchTerm) return true;
        return g.name.toLowerCase().includes(searchLower);
      });

      if (filteredProducts.length > 0 || filteredGroups.length > 0) {
        result.push({
          basicUDI,
          products: filteredProducts,
          groups: filteredGroups,
        });
      }
    });

    return result;
  }, [groupedProducts, groupsByBasicUDI, searchTerm, excludeProductId]);

  const toggleGroup = (basicUDI: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(basicUDI)) {
        newSet.delete(basicUDI);
      } else {
        newSet.add(basicUDI);
      }
      return newSet;
    });
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = selectedProductIds.includes(productId)
      ? selectedProductIds.filter(id => id !== productId)
      : [...selectedProductIds, productId];
    onSelectionChange(newSelected, selectedGroupIds);
  };

  const toggleGroupSelection = (groupId: string) => {
    if (!allowGroupSelection) return;
    const newSelected = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter(id => id !== groupId)
      : [...selectedGroupIds, groupId];
    onSelectionChange(selectedProductIds, newSelected);
  };

  if (productsLoading || groupsLoading) {
    return <div className="text-sm text-muted-foreground">Loading products...</div>;
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products or groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="p-4 space-y-4">
          {filteredData.map(({ basicUDI, products, groups }) => (
            <div key={basicUDI} className="space-y-2">
              {/* Family Header */}
              <button
                onClick={() => toggleGroup(basicUDI)}
                className="flex items-center gap-2 w-full text-left hover:bg-muted/50 p-2 rounded-md transition-colors"
              >
                {expandedGroups.has(basicUDI) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{basicUDI}</span>
                <Badge variant="secondary" className="ml-auto">
                  {products.length} products
                </Badge>
                {groups.length > 0 && (
                  <Badge variant="outline">
                    {groups.length} groups
                  </Badge>
                )}
              </button>

              {/* Expanded Content */}
              {expandedGroups.has(basicUDI) && (
                <div className="ml-6 space-y-2">
                  {/* Sibling Groups */}
                  {allowGroupSelection && groups.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Sibling Groups</div>
                      {groups.map(group => (
                        <div
                          key={group.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded-md"
                        >
                          <Checkbox
                            checked={selectedGroupIds.includes(group.id)}
                            onCheckedChange={() => toggleGroupSelection(group.id)}
                          />
                          <Users className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{group.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {group.product_sibling_assignments.length} products • {group.distribution_pattern}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Group
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Individual Products */}
                  {products.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Individual Products</div>
                      {products.map(product => (
                        <div
                          key={product.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted/30 rounded-md"
                        >
                          <Checkbox
                            checked={selectedProductIds.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                          <Package className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <div className="text-sm">{product.name}</div>
                            {product.trade_name && (
                              <div className="text-xs text-muted-foreground">{product.trade_name}</div>
                            )}
                          </div>
                          {product.sibling_group_id && (
                            <Badge variant="outline" className="text-xs">In Group</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products or groups found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selection Summary */}
      {(selectedProductIds.length > 0 || selectedGroupIds.length > 0) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Selected:</span>
          {selectedProductIds.length > 0 && (
            <Badge variant="secondary">{selectedProductIds.length} products</Badge>
          )}
          {selectedGroupIds.length > 0 && (
            <Badge variant="secondary">{selectedGroupIds.length} groups</Badge>
          )}
        </div>
      )}
    </div>
  );
}
