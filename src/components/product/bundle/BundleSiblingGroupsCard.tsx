import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Folders, Search, ChevronDown, ChevronRight, Plus, Package, Eye, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { DistributionPattern } from '@/types/siblingGroup';
import { Checkbox } from '@/components/ui/checkbox';

interface SiblingGroup {
  id: string;
  company_id: string;
  basic_udi_di: string;
  name: string;
  description?: string;
  distribution_pattern: DistributionPattern;
  total_percentage: number;
  productCount: number;
  tradeName?: string | null;
  productName?: string | null;
  products?: Array<{
    id: string;
    name: string;
    trade_name?: string;
    description?: string;
    percentage?: number;
    position?: number;
  }>;
}

interface BundleSiblingGroupsCardProps {
  companyId: string;
  currentProductId: string;
  selectedGroupIds: string[];
  onAddGroup: (groups: Array<{
    id: string;
    basicUdiDi: string;
    name: string;
    description?: string;
    productCount: number;
    distributionPattern: DistributionPattern;
    totalPercentage: number;
  }>) => void;
  onRemoveGroup?: (groupId: string) => void;
  isNewBundle?: boolean;
}

const distributionPatternLabels: Record<DistributionPattern, string> = {
  even: 'Even Distribution',
  gaussian_curve: 'Normal Curve',
  empirical_data: 'Custom Distribution',
};

export function BundleSiblingGroupsCard({
  companyId,
  currentProductId,
  selectedGroupIds,
  onAddGroup,
  onRemoveGroup,
  isNewBundle = false,
}: BundleSiblingGroupsCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch all sibling groups for the company
  const { data: siblingGroups = [], isLoading } = useQuery({
    queryKey: ['company-sibling-groups-for-bundle', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sibling_groups')
        .select(`
          id,
          company_id,
          basic_udi_di,
          name,
          description,
          distribution_pattern,
          total_percentage,
          product_sibling_assignments (
            id,
            product_id,
            percentage,
            position,
            products (
              id,
              name,
              trade_name,
              description
            )
          )
        `)
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;

      // Map groups with product counts, first product's trade name, and all products with percentages
      const groups = (data || []).map(group => {
        const assignments = group.product_sibling_assignments || [];
        const firstProduct = assignments[0]?.products;
        const products = assignments
          .map((a: any) => ({
            ...a.products,
            percentage: a.percentage,
            position: a.position
          }))
          .filter((p: any) => p.id)
          .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
        
        return {
          id: group.id,
          company_id: group.company_id,
          basic_udi_di: group.basic_udi_di,
          name: group.name,
          description: group.description,
          distribution_pattern: group.distribution_pattern,
          total_percentage: group.total_percentage,
          productCount: assignments.length,
          tradeName: firstProduct?.trade_name || null,
          productName: firstProduct?.name || null,
          products,
        };
      });

      return groups as SiblingGroup[];
    },
    enabled: !!companyId,
  });

  // Fetch which groups contain the current product
  const { data: currentProductGroups = [] } = useQuery({
    queryKey: ['current-product-groups', currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sibling_assignments')
        .select('sibling_group_id')
        .eq('product_id', currentProductId);
      if (error) throw error;
      return data.map(d => d.sibling_group_id);
    },
    enabled: !!currentProductId,
  });

  // Filter groups based on search only - keep all groups visible
  const filteredGroups = useMemo(() => {
    let groups = siblingGroups;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      groups = groups.filter(
        (g) =>
          g.name.toLowerCase().includes(term) ||
          g.tradeName?.toLowerCase().includes(term) ||
          g.productName?.toLowerCase().includes(term) ||
          g.basic_udi_di.toLowerCase().includes(term) ||
          g.description?.toLowerCase().includes(term)
      );
    }
    
    return groups;
  }, [siblingGroups, searchTerm]);

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

  const handleToggleSelection = (groupId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleSelectAll = () => {
    const availableIds = filteredGroups
      .filter(g => !selectedGroupIds.includes(g.id))
      .map(g => g.id);
    setSelectedIds(availableIds);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleAddSelected = () => {
    const groupsToAdd = siblingGroups
      .filter(g => selectedIds.includes(g.id))
      .map(group => ({
        id: group.id,
        basicUdiDi: group.basic_udi_di,
        name: group.name,
        description: group.description,
        productCount: group.productCount,
        distributionPattern: group.distribution_pattern,
        totalPercentage: group.total_percentage,
      }));
    onAddGroup(groupsToAdd);
    setSelectedIds([]);
  };

  const selectedCount = selectedIds.length;
  const hasSelection = selectedCount > 0;

  return (
    <Card className="border-2 border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Folders className="h-5 w-5 text-primary" />
          <CardTitle>Device Groups</CardTitle>
        </div>
        <CardDescription>
          Add entire variant groups to the bundle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Action Buttons */}
        {hasSelection && (
          <div className="flex items-center justify-between gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? 'group' : 'groups'} selected
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={handleAddSelected}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Bundle
              </Button>
            </div>
          </div>
        )}

        {/* Info text */}
        <div className="text-sm text-muted-foreground">
          {hasSelection 
            ? 'Click "Add to Bundle" to confirm your selection' 
            : 'Check groups to select them, then click "Add to Bundle"'}
        </div>

        {/* Groups List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg">
              {searchTerm ? 'No groups match your search' : 'No sibling device groups available'}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              const isSelected = selectedIds.includes(group.id);
              const isCurrentProductGroup = currentProductGroups.includes(group.id);
              const isAlreadyAdded = selectedGroupIds.includes(group.id);

              return (
                <Card
                  key={group.id}
                  className={`border transition-colors ${
                    isCurrentProductGroup ? 'border-2 border-primary ring-2 ring-primary/20' : ''
                  } ${
                    isAlreadyAdded 
                      ? 'opacity-50 bg-muted/50' 
                      : isSelected
                      ? 'bg-primary/10 border-primary/50 shadow-sm'
                      : 'hover:bg-accent/50 cursor-pointer'
                  }`}
                >
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleGroup(group.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <Checkbox
                            checked={isAlreadyAdded || isSelected}
                            disabled={isAlreadyAdded}
                            onCheckedChange={() => !isAlreadyAdded && handleToggleSelection(group.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div 
                            onClick={() => !isAlreadyAdded && handleToggleSelection(group.id)}
                            className="flex items-start gap-2 flex-1 min-w-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                <div className="flex flex-col gap-0.5">
                                  <h4 className="font-semibold text-sm">
                                    {group.name}
                                  </h4>
                                  <span className="text-xs text-muted-foreground">
                                    {group.tradeName || group.productName}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {group.productCount} {group.productCount === 1 ? 'variant' : 'variants'}
                                </Badge>
                                {isAlreadyAdded && (
                                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    In Bundle
                                  </Badge>
                                )}
                                {isCurrentProductGroup && !isAlreadyAdded && (
                                  <Badge variant="default" className="text-xs flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    Contains Current Product
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground ml-7">
                                Basic UDI-DI: {group.basic_udi_di}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <CollapsibleContent className="ml-7 space-y-2">
                          {group.description && (
                            <p className="text-xs text-muted-foreground">
                              {group.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs mb-2">
                            <div>
                              <span className="text-muted-foreground">Pattern: </span>
                              <span className="font-medium">
                                {distributionPatternLabels[group.distribution_pattern]}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total: </span>
                              <span className="font-medium">{group.total_percentage}%</span>
                            </div>
                          </div>
                          
                          {/* Show underlying products with distribution percentages */}
                          {group.products && group.products.length > 0 && (
                            <div className="space-y-1.5 border-t pt-2">
                              <div className="text-xs font-semibold text-muted-foreground mb-1">
                                Products in this group ({distributionPatternLabels[group.distribution_pattern]}):
                              </div>
                              {group.products.map((product) => (
                                <div key={product.id} className="flex items-start gap-2 text-xs pl-2 py-1 rounded hover:bg-accent/50">
                                  <Package className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium">
                                        {product.trade_name || product.name}
                                      </div>
                                      {product.percentage != null && (
                                        <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                          {product.percentage}%
                                        </span>
                                      )}
                                    </div>
                                    {product.trade_name && (
                                      <div className="text-muted-foreground">
                                        ({product.name})
                                      </div>
                                    )}
                                    {product.description && (
                                      <div className="text-muted-foreground truncate">
                                        {product.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CollapsibleContent>
                      </div>
                    </CardContent>
                  </Collapsible>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
