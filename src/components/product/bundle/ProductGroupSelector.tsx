import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  productId: string;
  productName: string;
  variantCount: number;
}

interface ProductGroupSelectorProps {
  companyId: string;
  currentProductId: string;
  selectedGroupIds: string[];
  onAddGroup: (group: ProductGroup) => void;
}

export function ProductGroupSelector({
  companyId,
  currentProductId,
  selectedGroupIds,
  onAddGroup
}: ProductGroupSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all variant groups for the company (sibling groups)
  const { data: variantGroups, isLoading } = useQuery({
    queryKey: ['company-variant-groups', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variant_groups')
        .select(`
          id,
          name,
          description,
          product_id,
          distribution_pattern,
          total_percentage,
          product:products!product_variant_groups_product_id_fkey(
            id,
            name
          )
        `)
        .eq('company_id', companyId)
        .order('product_id', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;

      // Count variants for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group: any) => {
          const { count } = await supabase
            .from('product_variants')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', group.product_id);

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            productId: group.product_id,
            productName: group.product?.name || '',
            variantCount: count || 0,
            distributionPattern: group.distribution_pattern,
            totalPercentage: group.total_percentage
          };
        })
      );

      return groupsWithCounts;
    },
    enabled: !!companyId
  });

  // Filter groups
  const availableGroups = variantGroups?.filter(group => {
    // Exclude already selected groups
    if (selectedGroupIds.includes(group.id)) return false;
    
    // Exclude groups with 0 variants
    if (group.variantCount === 0) return false;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        group.name.toLowerCase().includes(query) ||
        group.productName.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search variant groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[300px] rounded-md border">
        <div className="p-4 space-y-3">
          {availableGroups && availableGroups.length > 0 ? (
            availableGroups.map(group => (
              <div
                key={group.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="font-semibold text-sm">{group.name}</div>
                  </div>
                  
                  <div className="ml-6 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Product: <span className="font-medium">{group.productName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">{group.variantCount}</span> variants • 
                      <span className="capitalize ml-1">{group.distributionPattern?.replace('_', ' ')}</span>
                      {group.totalPercentage && (
                        <span className="ml-1">• {group.totalPercentage}%</span>
                      )}
                    </div>
                    {group.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {group.description}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAddGroup(group)}
                  className="ml-4 flex-shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchQuery
                ? 'No variant groups found matching your search'
                : 'No variant groups available to add'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
