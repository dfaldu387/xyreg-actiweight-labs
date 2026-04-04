import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyDeviceCategories } from '@/hooks/useCompanyDeviceCategories';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Monitor, Search } from 'lucide-react';

interface GapClauseScopePopoverProps {
  companyId: string;
  currentProductId: string;
  framework: string;
  section: string;
  excludedProductIds: string[];
  onExclusionChange: (framework: string, section: string, excludedIds: string[]) => void;
  isFrameworkShared: boolean;
}

export function GapClauseScopePopover({
  companyId,
  currentProductId,
  framework,
  section,
  excludedProductIds,
  onExclusionChange,
  isFrameworkShared,
}: GapClauseScopePopoverProps) {
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch eagerly so badge counts are correct immediately
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['company-products-for-gap-scope', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, device_category')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name');
      if (error) throw error;
      return data as { id: string; name: string; device_category: string | null }[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { categories } = useCompanyDeviceCategories(companyId);

  const getCategoryProductIds = useMemo(() => {
    return (catName: string) => {
      const normalized = catName.trim().toLowerCase();
      return products
        .filter(p => (p.device_category || '').trim().toLowerCase() === normalized)
        .map(p => p.id);
    };
  }, [products]);

  const displayProducts = useMemo(() => {
    let list = categoryFilter
      ? products.filter(p => p.device_category === categoryFilter)
      : products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.id === currentProductId) return -1;
      if (b.id === currentProductId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, categoryFilter, currentProductId, searchQuery]);

  const activeCount = products.length - excludedProductIds.length;
  const hasExclusions = excludedProductIds.length > 0;

  // When framework sharing is OFF, show a muted "Individual" badge
  if (!isFrameworkShared) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] cursor-default border-muted bg-muted/30 text-muted-foreground"
      >
        Individual
      </Badge>
    );
  }

  const handleToggle = (productId: string, included: boolean) => {
    const newExcluded = included
      ? excludedProductIds.filter(id => id !== productId)
      : [...excludedProductIds, productId];
    onExclusionChange(framework, section, newExcluded);
  };

  const handleSelectAll = () => onExclusionChange(framework, section, []);
  const handleDeselectAll = () => onExclusionChange(framework, section, products.map(p => p.id));

  const handleCategoryToggle = (catName: string, include: boolean) => {
    const catProductIds = getCategoryProductIds(catName);
    let newExcluded = [...excludedProductIds];

    if (include) {
      // Include all products in this category
      newExcluded = newExcluded.filter(id => !catProductIds.includes(id));
    } else {
      // Exclude all products in this category
      catProductIds.forEach(id => {
        if (!newExcluded.includes(id)) newExcluded.push(id);
      });
    }

    onExclusionChange(framework, section, newExcluded);
  };

  // Loading state
  if (isLoadingProducts) {
    return (
      <Badge variant="outline" className="text-[10px] border-muted bg-muted/30 text-muted-foreground">
        Scope: …
      </Badge>
    );
  }

  const badgeClass = hasExclusions
    ? 'cursor-pointer hover:bg-amber-100 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/50'
    : 'cursor-pointer hover:bg-green-100 border-green-300 bg-green-50 text-green-700 dark:bg-green-950/50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/50';

  const label = hasExclusions
    ? `Scope: ${activeCount}/${products.length}`
    : `Scope: All (${products.length})`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>
          {label}
        </Badge>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3 space-y-3"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Device Applicability</h4>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleSelectAll}>
              All
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleDeselectAll}>
              None
            </Button>
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Filter by category</Label>
            <Select value={categoryFilter || '__all__'} onValueChange={v => setCategoryFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Category-level toggles */}
        {categories.length > 0 && !categoryFilter && (
          <div className="space-y-1 border-b pb-2">
            <Label className="text-xs text-muted-foreground">Exclude entire category</Label>
            {categories.map(cat => {
              const catProductIds = getCategoryProductIds(cat.name);
              const isAllIncluded = catProductIds.length > 0 && catProductIds.every(id => !excludedProductIds.includes(id));
              return (
                <label key={cat.id} className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-accent/50 cursor-pointer text-xs">
                  <Checkbox
                    checked={isAllIncluded}
                    onCheckedChange={(checked) => handleCategoryToggle(cat.name, !!checked)}
                  />
                  <span>{cat.name}</span>
                  <span className="text-muted-foreground ml-auto">
                    ({catProductIds.length})
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {/* Device checkboxes with search */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Devices</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs pl-7"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto border rounded-md p-1.5 space-y-0.5">
            {displayProducts.map(product => {
              const isIncluded = !excludedProductIds.includes(product.id);
              return (
                <label
                  key={product.id}
                  className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-accent/50 cursor-pointer text-xs"
                >
                  <Checkbox
                    checked={isIncluded}
                    onCheckedChange={(checked) => handleToggle(product.id, !!checked)}
                  />
                  <Monitor className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {product.name}
                    {product.id === currentProductId && (
                      <span className="text-muted-foreground ml-1">(current)</span>
                    )}
                  </span>
                  {product.device_category && (
                    <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                      {product.device_category}
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
