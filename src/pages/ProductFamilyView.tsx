import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { ArrowLeft, Layers, CheckSquare, Tags, Search, Grid3x3, List, Crown, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanyId } from "@/hooks/useCompanyId";
import { getProductsByFamily, computeFamilySummary, getFamilyModel } from "@/services/productFamilyService";
import { PortfolioProductCard } from "@/components/product/portfolio/PortfolioProductCard";
import { PortfolioProductListItem } from "@/components/product/portfolio/PortfolioProductListItem";
import { Skeleton } from "@/components/ui/skeleton";
import { BulkVariantTagEditor } from "@/components/portfolio/BulkVariantTagEditor";
import { CreateModelFromFamilyDialog } from "@/components/product/family/CreateModelFromFamilyDialog";

export default function ProductFamilyView() {
  const { familyKey, companyName } = useParams<{ familyKey: string; companyName: string }>();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { activeCompanyRole } = useCompanyRole();
  
  // Use active company role name as source of truth, fallback to URL param
  const actualCompanyName = activeCompanyRole?.companyName || companyName;
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({});
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBulkTagDialogOpen, setIsBulkTagDialogOpen] = useState(false);
  const [isCreateModelDialogOpen, setIsCreateModelDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: products, isLoading } = useQuery({
    queryKey: ['product-family-products', companyId, familyKey],
    queryFn: () => {
      if (!companyId || !familyKey) throw new Error('Missing required data');
      return getProductsByFamily(companyId, familyKey);
    },
    enabled: !!companyId && !!familyKey,
  });

  const { data: familyModel } = useQuery({
    queryKey: ['family-model', companyId, familyKey],
    queryFn: () => {
      if (!companyId || !familyKey) return null;
      return getFamilyModel(companyId, familyKey);
    },
    enabled: !!companyId && !!familyKey,
  });

  const familySummary = useMemo(() => {
    if (!products || products.length === 0 || !familyKey) return null;
    // Filter out any legacy master products from old system
    const activeProducts = products.filter(p => !p.is_master_product);
    return computeFamilySummary(familyKey, activeProducts);
  }, [products, familyKey]);

  // Extract available filter options from variant summary
  const filterOptions = useMemo(() => {
    if (!familySummary) return {};
    const options: Record<string, string[]> = {};
    
    Object.entries(familySummary.variantSummary).forEach(([dimName, dimData]) => {
      if (dimData.values) {
        options[dimName] = dimData.values;
      } else if (dimData.value) {
        options[dimName] = [dimData.value];
      }
    });
    
    return options;
  }, [familySummary]);

  // Filter products based on selected filters and search query
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    // Filter out any legacy master products
    const activeProducts = products.filter(p => !p.is_master_product);
    
    let result = activeProducts;
    
    // Apply variant filters
    const hasActiveFilters = Object.values(selectedFilters).some(set => set.size > 0);
    if (hasActiveFilters) {
      result = result.filter(product => {
        if (!product.variant_tags) return false;
        
        // Product must match ALL selected filter dimensions
        return Object.entries(selectedFilters).every(([dimName, selectedValues]) => {
          if (selectedValues.size === 0) return true; // No filter for this dimension
          const productValue = product.variant_tags?.[dimName];
          return productValue && selectedValues.has(productValue);
        });
      });
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => {
        const name = product.name?.toLowerCase() || '';
        const tradeName = (() => {
          const tn = product.trade_name || (product as any).eudamed_trade_names;
          if (typeof tn === 'string') return tn.toLowerCase();
          if (Array.isArray(tn)) return tn.join(' ').toLowerCase();
          if (typeof tn === 'object' && tn?.trade_names) return tn.trade_names.toLowerCase();
          return '';
        })();
        
        return name.includes(query) || tradeName.includes(query);
      });
    }
    
    return result;
  }, [products, selectedFilters, searchQuery]);

  const handleFilterChange = (dimensionName: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      if (!newFilters[dimensionName]) {
        newFilters[dimensionName] = new Set();
      }
      
      if (checked) {
        newFilters[dimensionName].add(value);
      } else {
        newFilters[dimensionName].delete(value);
      }
      
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
  };

  const handleProductSelection = (productId: string, selected: boolean) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkTagUpdate = () => {
    setSelectedProductIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!familySummary) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Product family not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasActiveFilters = Object.values(selectedFilters).some(set => set.size > 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/app/company/${encodeURIComponent(actualCompanyName)}/portfolio`)} 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portfolio
        </Button>
        
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Layers className="h-8 w-8 text-primary" />
              {familySummary.familyName}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {!familySummary.isPlaceholder && (
                <Badge variant="outline">
                  Basic UDI-DI: {familySummary.familyKey}
                </Badge>
              )}
              {familySummary.isPlaceholder && (
                <Badge variant="secondary">
                  Development Family
                </Badge>
              )}
              <Badge>
                {familySummary.productCount} Devices
              </Badge>
            </div>
          </div>
          
          {/* Model Actions */}
          <div className="flex gap-2">
            {!familyModel && familySummary.productCount >= 2 && (
              <Button
                variant="default"
                onClick={() => setIsCreateModelDialogOpen(true)}
              >
                <Layers className="h-4 w-4 mr-2" />
                Create Model
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Model Info Card */}
      {familyModel && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{familyModel.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Model with {familyModel.variant_count} variant{familyModel.variant_count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">
                <Layers className="h-3 w-3 mr-1" />
                Product Model
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {Object.keys(filterOptions).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filter Products</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(filterOptions).map(([dimName, values]) => (
                <div key={dimName} className="space-y-2">
                  <Label className="font-semibold">{dimName}</Label>
                  <div className="space-y-2">
                    {values.map(value => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-${dimName}-${value}`}
                          checked={selectedFilters[dimName]?.has(value) || false}
                          onCheckedChange={(checked) => 
                            handleFilterChange(dimName, value, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`filter-${dimName}-${value}`}
                          className="text-sm cursor-pointer"
                        >
                          {value}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Toolbar - Only shown when products are selected */}
      {selectedProductIds.size > 0 && (
        <Card className="border-primary">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {selectedProductIds.size} product{selectedProductIds.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Deselect All
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsBulkTagDialogOpen(true)}
                >
                  <Tags className="h-4 w-4 mr-2" />
                  Bulk Tag
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProductIds(new Set())}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">
            {hasActiveFilters || searchQuery ? `${filteredProducts.length} Matching Devices` : 'All Devices'}
          </h2>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
        
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                {hasActiveFilters || searchQuery
                  ? 'No devices match the selected filters or search query' 
                  : 'No devices in this family'}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(product => (
              <PortfolioProductCard 
                key={product.id} 
                product={product}
                isSelected={selectedProductIds.has(product.id)}
                onSelectionChange={handleProductSelection}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map(product => (
              <PortfolioProductListItem 
                key={product.id} 
                product={product}
                isSelected={selectedProductIds.has(product.id)}
                onSelectionChange={handleProductSelection}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Tag Editor Dialog */}
      {companyId && (
        <BulkVariantTagEditor
          isOpen={isBulkTagDialogOpen}
          onClose={() => setIsBulkTagDialogOpen(false)}
          products={filteredProducts.filter(p => selectedProductIds.has(p.id))}
          companyId={companyId}
          onUpdate={handleBulkTagUpdate}
        />
      )}

      {/* Create Model Dialog */}
      {companyId && familyKey && actualCompanyName && products && (
        <CreateModelFromFamilyDialog
          isOpen={isCreateModelDialogOpen}
          onClose={() => setIsCreateModelDialogOpen(false)}
          products={products.filter(p => !p.is_master_product)}
          companyId={companyId}
          familyKey={familyKey}
          companyName={actualCompanyName}
        />
      )}
    </div>
  );
}
