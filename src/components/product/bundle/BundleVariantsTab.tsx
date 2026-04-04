import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tags, Search, Folders } from 'lucide-react';
import { useCompanyProducts } from '@/hooks/useCompanyProducts';
import { useProductsByBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { BulkVariantTagEditor } from '@/components/portfolio/BulkVariantTagEditor';
import { ProductWithFamily } from '@/services/productFamilyService';
import { VariantTags } from '@/components/ui/variant-tags';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSiblingGroups } from '@/hooks/useSiblingGroups';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';

interface BundleVariantsTabProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function BundleVariantsTab({ productId, companyId, disabled = false }: BundleVariantsTabProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);
  const [showOnlySiblings, setShowOnlySiblings] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Fetch all company products
  const { products: allProducts, isLoading: isLoadingAll } = useCompanyProducts(companyId);

  // Get current product's basic_udi_di directly from query
  const { data: currentProductData } = useQuery({
    queryKey: ['product-basic-udi', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('basic_udi_di')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId
  });

  const currentBasicUDI = currentProductData?.basic_udi_di || null;
  
  const { siblings, isLoading: isLoadingSiblings } = useProductsByBasicUDI(
    companyId, 
    currentBasicUDI || undefined
  );

  // Fetch sibling groups for the current product's Basic UDI-DI
  const { data: siblingGroups } = useSiblingGroups(currentBasicUDI || undefined);

  // Create a map of product ID to groups
  const productToGroupsMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>();
    if (!siblingGroups) return map;

    siblingGroups.forEach(group => {
      group.product_sibling_assignments?.forEach(assignment => {
        if (assignment.product_id) {
          const existing = map.get(assignment.product_id) || [];
          existing.push({ id: group.id, name: group.name });
          map.set(assignment.product_id, existing);
        }
      });
    });
    return map;
  }, [siblingGroups]);

  // Determine which products to show
  const displayProducts = useMemo(() => {
    const productsToShow = (showOnlySiblings ? siblings : allProducts) as any[];
    let filteredProducts = [...productsToShow];

    // Filter by group
    if (selectedGroupFilter !== 'all') {
      filteredProducts = filteredProducts.filter((p: any) => {
        const groups = productToGroupsMap.get(p.id);
        return groups?.some(g => g.id === selectedGroupFilter);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter((p: any) => {
        const description = p.description;
        const tradeName = p.trade_name;
        return p.name.toLowerCase().includes(query) ||
          (description && description.toLowerCase().includes(query)) ||
          (tradeName && tradeName.toLowerCase().includes(query));
      });
    }

    return filteredProducts;
  }, [allProducts, siblings, showOnlySiblings, searchQuery, selectedGroupFilter, productToGroupsMap]);

  // Convert to ProductWithFamily format for BulkVariantTagEditor
  const selectedProducts: ProductWithFamily[] = useMemo(() => {
    return Array.from(selectedProductIds)
      .map(id => {
        const product = allProducts.find(p => p.id === id);
        if (!product) return null;
        const productAny = product as any;
        return {
          id: product.id,
          name: product.name,
          description: productAny.description || null,
          company_id: product.company_id,
          basic_udi_di: productAny.basic_udi_di || null,
          product_family_placeholder: productAny.product_family_placeholder || null,
          variant_tags: productAny.variant_tags || null,
          display_as_variant_group: productAny.display_as_variant_group || false,
          variant_group_summary: productAny.variant_group_summary || null,
          trade_name: productAny.trade_name || null, // Include trade_name
        } as ProductWithFamily;
      })
      .filter((p): p is ProductWithFamily => p !== null);
  }, [selectedProductIds, allProducts]);

  const handleToggleProduct = (productId: string, checked: boolean) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === displayProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(displayProducts.map(p => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const handleOpenBulkEditor = () => {
    if (selectedProductIds.size === 0) return;
    setIsBulkEditorOpen(true);
  };

  const handleBulkEditorClose = () => {
    setIsBulkEditorOpen(false);
  };

  const handleBulkUpdate = () => {
    // Clear selection after update
    setSelectedProductIds(new Set());
  };

  // Convert variant_tags to VariantAttribute format
  const getVariantAttributes = (variantTags: Record<string, string> | null) => {
    if (!variantTags) return [];
    return Object.entries(variantTags).map(([dimensionName, optionName]) => ({
      dimensionName,
      optionName,
      dimensionId: dimensionName, // Using name as ID for simplicity
      optionId: optionName
    }));
  };

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                {lang('bundles.variants.title')}
              </CardTitle>
              <CardDescription>
                {lang('bundles.variants.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang('bundles.variants.searchProducts')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="siblings-only"
                checked={showOnlySiblings}
                onCheckedChange={setShowOnlySiblings}
              />
              <Label htmlFor="siblings-only" className="cursor-pointer whitespace-nowrap">
                {lang('bundles.variants.onlyShowSameUdi')}
              </Label>
            </div>
          </div>

          {/* Group Filter */}
          {siblingGroups && siblingGroups.length > 0 && (
            <div className="flex items-center gap-3">
              <Folders className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{lang('bundles.variants.filterByGroup')}</Label>
              <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder={lang('bundles.variants.allProducts')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang('bundles.variants.allProducts')}</SelectItem>
                  {siblingGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.product_sibling_assignments?.length || 0} {lang('bundles.variants.products')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGroupFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGroupFilter('all')}
                >
                  {lang('bundles.variants.clearFilter')}
                </Button>
              )}
            </div>
          )}

          {/* Selection Controls */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedProductIds.size === displayProducts.length && displayProducts.length > 0
                ? lang('bundles.variants.deselectAll')
                : lang('bundles.variants.selectAll')}
            </Button>
            {selectedProductIds.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleClearSelection}>
                  {lang('bundles.variants.clear')}
                </Button>
                <Button size="sm" onClick={handleOpenBulkEditor}>
                  <Tags className="h-4 w-4 mr-2" />
                  {lang('bundles.variants.tagSelected').replace('{count}', String(selectedProductIds.size))}
                </Button>
              </>
            )}
          </div>

          {/* Products List */}
          <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
            {isLoadingAll || isLoadingSiblings ? (
              <div className="p-8 text-center text-muted-foreground">{lang('bundles.variants.loadingProducts')}</div>
            ) : displayProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {showOnlySiblings && !currentBasicUDI ? (
                  <div>
                    <p>{lang('bundles.variants.noBasicUdiSet')}</p>
                    <p className="text-xs mt-2">{lang('bundles.variants.setBasicUdiHint')}</p>
                  </div>
                ) : searchQuery ? (
                  lang('bundles.variants.noProductsMatch')
                ) : showOnlySiblings ? (
                  <div>
                    <p>{lang('bundles.variants.noProductsSameUdi')}</p>
                    <p className="text-xs mt-2">Basic UDI-DI: {currentBasicUDI}</p>
                  </div>
                ) : (
                  lang('bundles.variants.noProductsFound')
                )}
              </div>
            ) : (
              displayProducts.map((product) => {
                const variantTags = (product as any).variant_tags as Record<string, string> | null;
                const variantAttributes = getVariantAttributes(variantTags);
                const tradeName = (product as any).trade_name;
                const productGroups = productToGroupsMap.get(product.id) || [];

                return (
                  <div
                    key={product.id}
                    className="flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedProductIds.has(product.id)}
                      onCheckedChange={(checked) => handleToggleProduct(product.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => navigate(`/app/product/${product.id}/device-information`)}
                          className="font-medium truncate text-primary hover:underline text-left"
                        >
                          {product.name}
                        </button>
                        {product.id === productId && (
                          <Badge variant="secondary" className="text-xs">{lang('bundles.variants.current')}</Badge>
                        )}
                      </div>
                      {tradeName && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {lang('bundles.variants.tradeName')}: <span className="font-medium">{tradeName}</span>
                        </p>
                      )}
                      {productGroups.length > 0 && (
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Folders className="h-3 w-3 text-muted-foreground" />
                          {productGroups.map(group => (
                            <Badge 
                              key={group.id} 
                              variant="outline" 
                              className="text-xs bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"
                            >
                              {group.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {(product as any).description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {(product as any).description}
                        </p>
                      )}
                      {variantAttributes.length > 0 ? (
                        <VariantTags variants={variantAttributes} size="sm" />
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{lang('bundles.variants.noTags')}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {showOnlySiblings && siblings.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {lang('bundles.variants.showingProducts')
                .replace('{displayed}', String(displayProducts.length))
                .replace('{total}', String(siblings.length))}{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">{currentBasicUDI}</code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Tag Editor Dialog */}
      <BulkVariantTagEditor
        isOpen={isBulkEditorOpen}
        onClose={handleBulkEditorClose}
        products={selectedProducts}
        companyId={companyId}
        onUpdate={handleBulkUpdate}
      />
    </div>
  );
}
