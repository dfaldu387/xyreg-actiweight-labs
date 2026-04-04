import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Package, PackagePlus, ChevronRight, ChevronDown, GitBranch, Archive, FileText, Calendar, BarChart3, ArrowLeft, Network } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { Product } from '@/types/client';
import { detectProductType, getProductTypeLabel } from '@/utils/productTypeDetection';
import { useTemplateSettings } from '@/hooks/useTemplateSettings';

import { supabase } from '@/integrations/supabase/client';

interface SidebarProductMenuProps {
  productsForMenu: Product[];
  currentProduct: any;
  currentProductId: string | null;
  isLoading: boolean;
  expandedMenus: Record<string, boolean>;
  onToggleMenu: (menuName: string) => void;
  onCollapseMenu: (menuName: string) => void;
  isProductActive: (productPath: string) => boolean;
  refreshProducts?: () => void;
  companyId?: string | null;
  companyName?: string | null;
}

export function SidebarProductMenu({
  productsForMenu,
  currentProduct,
  currentProductId,
  isLoading,
  expandedMenus,
  onToggleMenu,
  onCollapseMenu,
  isProductActive,
  refreshProducts,
  companyId,
  companyName
}: SidebarProductMenuProps) {
  const location = useLocation();
  const { productId: routeProductId } = useParams<{ productId: string }>();
  
  // Extract productId from URL pathname if useParams doesn't work (sidebar is outside route context)
  const pathProductId = React.useMemo(() => {
    const match = location.pathname.match(/\/product\/([^\/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);
  
  // Use extracted productId from path or from params
  const effectiveProductId = routeProductId || pathProductId;
  
  // Check if we're on a product detail page
  const isProductDetailPage = effectiveProductId !== null && location.pathname.includes(`/product/${effectiveProductId}`);
  
  // Get template settings for product display preferences
  const { settings } = useTemplateSettings(companyId || '');
  const displayMode = settings?.sidebar_product_display_mode || 'hierarchy';
  const groupingField = settings?.sidebar_product_grouping_field || 'category';
  const sortOrder = settings?.sidebar_product_sort_order || 'type_then_name';
  const shouldDisplayHierarchy = displayMode === 'hierarchy';

  // Manage category open state, auto-open the active product's group
  const [openCategories, setOpenCategories] = React.useState<Record<string, boolean>>({});
  
  // Track which products are expanded to show variants
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  
  // Build variant map directly from productsForMenu (no separate hook needed)
  const productVariantsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    if (!productsForMenu) return map;
    
    // Find all true variants (have parent_product_id + type 'variant')
    const variants = productsForMenu.filter(
      (p: any) => p.parent_product_id && p.parent_relationship_type === 'variant'
    );
    // Group by parent
    variants.forEach((v: any) => {
      const list = map.get(v.parent_product_id!) || [];
      list.push(v);
      map.set(v.parent_product_id!, list);
    });
    return map;
  }, [productsForMenu]);
  // Set of product IDs that are true variants — hidden from top-level list
  const variantProductIds = useMemo(() => {
    const ids = new Set<string>();
    productVariantsMap.forEach((variants) => {
      variants.forEach((v: any) => ids.add(v.id));
    });
    return ids;
  }, [productVariantsMap]);

  useEffect(() => {
    if (!currentProductId || !productsForMenu || productsForMenu.length === 0) return;
    const activeProduct = productsForMenu.find(pr => pr.id === currentProductId);
    if (!activeProduct) return;
    
    const groupValue = getGroupingValue(activeProduct, groupingField);
    if (groupValue && groupValue !== 'Other') {
      setOpenCategories(prev => ({ ...prev, [groupValue]: true }));
    }
    
    // Auto-expand parent device if viewing a family member
    if ((activeProduct as any).parent_product_id && (activeProduct as any).parent_relationship_type === 'variant') {
      setExpandedProducts(prev => new Set(prev).add((activeProduct as any).parent_product_id));
    }
    // Auto-expand if current product IS the primary device
    if (productVariantsMap.has(currentProductId)) {
      setExpandedProducts(prev => new Set(prev).add(currentProductId));
    }
  }, [currentProductId, productsForMenu, groupingField, productVariantsMap]);

  const handleProductClick = () => {
    onCollapseMenu("Products");
  };

  const getProductTypeIcon = (productType: string) => {
    switch (productType) {
      case 'new_product':
        return <Package className="h-5 w-5" style={{ color: '#2563eb' }} />;
      case 'existing_product':
        return <PackagePlus className="h-5 w-5" style={{ color: '#16a34a' }} />;
      case 'line_extension':
        return <GitBranch className="h-5 w-5" style={{ color: '#ea580c' }} />;
      case 'legacy_product':
        return <Archive className="h-5 w-5" style={{ color: '#6b7280' }} />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getProductTypeSortOrder = (productType: string): number => {
    switch (productType) {
      case 'new_product': return 1;
      case 'existing_product': return 2;
      case 'line_extension': return 3;
      case 'legacy_product': return 4;
      default: return 5;
    }
  };

  // Build a set of basic_udi_di values that have a primary device
  const basicUdiWithPrimary = useMemo(() => {
    const set = new Set<string>();
    productsForMenu.forEach((p: any) => {
      if (p.is_master_device && p.basic_udi_di && productVariantsMap.has(p.id)) {
        set.add(p.basic_udi_di);
      }
    });
    return set;
  }, [productsForMenu, productVariantsMap]);

  const sortProducts = (products: any[]): any[] => {
    return products.sort((a, b) => {
      // Primary family devices first
      const aIsPrimary = a.is_master_device && productVariantsMap.has(a.id);
      const bIsPrimary = b.is_master_device && productVariantsMap.has(b.id);
      if (aIsPrimary && !bIsPrimary) return -1;
      if (!aIsPrimary && bIsPrimary) return 1;

      // Non-variant siblings (share basic_udi_di with a primary but have no parent_product_id) go to bottom
      const aIsNonVariantSibling = a.basic_udi_di && basicUdiWithPrimary.has(a.basic_udi_di) && !a.parent_product_id && !a.is_master_device;
      const bIsNonVariantSibling = b.basic_udi_di && basicUdiWithPrimary.has(b.basic_udi_di) && !b.parent_product_id && !b.is_master_device;
      if (aIsNonVariantSibling && !bIsNonVariantSibling) return 1;
      if (!aIsNonVariantSibling && bIsNonVariantSibling) return -1;

      switch (sortOrder) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest_first':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest_first':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'type_then_name':
        default:
          const typeOrderA = getProductTypeSortOrder(detectProductType(a));
          const typeOrderB = getProductTypeSortOrder(detectProductType(b));
          if (typeOrderA !== typeOrderB) return typeOrderA - typeOrderB;
          return a.name.localeCompare(b.name);
      }
    });
  };

  // Get grouping value for a product based on the configured field
  const getGroupingValue = (product: any, field: string): string => {
    switch (field) {
      case 'category':
        return product.device_category?.trim() || 'Other';
      case 'platform':
        return product.product_platform?.trim() || 'Other';
      case 'model':
        return product.model_reference?.trim() || 'Other';
      case 'variant':
        return product.udi_suffix ? `Variant ${product.udi_suffix}` : 'Other';
      case 'basic_udi_di':
        return product.basic_udi_di?.trim() || 'Other';
      case 'bundles':
        return product.bundle_name?.trim() || product.bundle_id?.trim() || 'Other';
      case 'stacked_cards':
        // For stacked cards, group by variant families (products with same base name)
        return product.device_category?.trim() || 'Other';
      default:
        return 'Other';
    }
  };

  // Check if any products have meaningful grouping for the selected field
  const hasAnyMeaningfulGrouping = (field: string): boolean => {
    return productsForMenu.some(p => {
      const value = getGroupingValue(p, field);
      return value !== 'Other';
    });
  };

  // Check if product is main device and has variants
  // Check if product is a master device with actual variants (via parent_product_id)
  const isMainDevice = (product: any) => {
    return productVariantsMap.has(product.id);
  };
  
  const hasVariants = (product: any) => {
    return productVariantsMap.has(product.id) && productVariantsMap.get(product.id)!.length > 0;
  };
  
  const getVariants = (product: any) => {
    return productVariantsMap.get(product.id) || [];
  };

  const renderProductItem = (p: any) => {
    const productType = detectProductType(p);
    const path = `/app/product/${p.id}/device-information`;
    const isActiveProduct = isProductActive(path);
    const activeItemClass = isActiveProduct ? "bg-primary/10 font-medium border-l-2 border-primary" : "";
    const bracketClass = isActiveProduct ? "relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-primary" : "";
    const suffix = p.udi_suffix ? ` (${p.udi_suffix})` : '';
    const fullProductName = `${p.name}${suffix}`;
    const productHasVariants = hasVariants(p);
    const isMain = isMainDevice(p);
    const isExpanded = expandedProducts.has(p.id);
    const variants = getVariants(p);

    return (
      <React.Fragment key={p.id}>
        {/* Main product item */}
        <SidebarMenuSubItem className={`mb-0.5 ${bracketClass}`}>
          <div className="flex items-center">
            {/* Expand/collapse button for main devices with variants */}
            {isMain && productHasVariants && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpandedProducts(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(p.id)) {
                      newSet.delete(p.id);
                    } else {
                      newSet.add(p.id);
                    }
                    return newSet;
                  });
                }}
                className="p-1 hover:bg-muted/50 rounded mr-1"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
              </button>
            )}
            
            <SidebarMenuSubButton 
              asChild 
              isActive={isActiveProduct} 
              className={`text-sm py-2 pl-2 pr-3 flex-1 ${activeItemClass}`}
              title={fullProductName}
            >
              <Link to={path} className="flex items-center gap-3 w-full" onClick={handleProductClick}>
                <div className="-ml-1.5 flex items-center gap-1.5">
                  {getProductTypeIcon(productType)}
                  {productHasVariants && (
                    <div title="Has variants">
                      <Network className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                  )}
                </div>
                <span className="truncate">{fullProductName}</span>
              </Link>
            </SidebarMenuSubButton>
          </div>
        </SidebarMenuSubItem>

        {/* Variants list (shown below master device when expanded, indented 10px) */}
        {isMain && isExpanded && variants.length > 0 && (
          <div className="relative border-l border-border" style={{ marginLeft: '10px' }}>
            <div className="space-y-0.5 pl-2">
              {variants.map((variant: any) => {
                const variantPath = `/app/product/${variant.id}/device-information`;
                const isVariantActive = isProductActive(variantPath);
                const variantSuffix = variant.udi_di ? ` (${String(variant.udi_di).slice(-6)})` : '';
                
                return (
                  <div key={variant.id} className="relative">
                    {/* Horizontal branch line */}
                    <div className="absolute -left-3 top-1/2 w-3 h-px bg-border" />
                    
                    <SidebarMenuSubItem className="mb-0.5">
                      <SidebarMenuSubButton 
                        asChild 
                        isActive={isVariantActive} 
                        className={`text-xs py-1.5 pl-2 pr-3 ${isVariantActive ? "bg-primary/10 font-medium" : ""}`}
                        title={variant.name + variantSuffix}
                      >
                        <Link to={variantPath} className="flex items-center gap-2 w-full" onClick={handleProductClick}>
                          <span className="truncate text-xs">{variant.name}{variantSuffix}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </React.Fragment>
    );
  };

  const renderHierarchicalProducts = () => {
    // Filter out true variants from top-level — they appear nested under their master
    const topLevelProducts = productsForMenu.filter(p => !variantProductIds.has(p.id));

    // If no meaningful grouping, show products directly
    if (!hasAnyMeaningfulGrouping(groupingField)) {
      return sortProducts(topLevelProducts).map(renderProductItem);
    }

    // Group products by the selected field
    const groupedProducts = topLevelProducts.reduce((acc: Record<string, any[]>, p: any) => {
      const groupValue = getGroupingValue(p, groupingField);
      (acc[groupValue] ||= []).push(p);
      return acc;
    }, {});

    return Object.entries(groupedProducts)
      .sort(([a], [b]) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return a.localeCompare(b);
      })
      .map(([groupName, items]) => {
        const groupOpen = openCategories[groupName] ?? false;
        const shouldShowDropdown = groupName !== 'Other';

        if (!shouldShowDropdown) {
          // Show products directly for "Other" group
          return sortProducts(items as any[]).map(renderProductItem);
        }

        return (
          <div key={groupName} className="mb-1">
            <SidebarMenuSubItem>
              <button
                type="button"
                className="flex items-center justify-between w-full text-sm py-2 pl-2 pr-3 hover:bg-muted/50 rounded"
                onClick={() => setOpenCategories(prev => ({ ...prev, [groupName]: !groupOpen }))}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    <Package className="h-5 w-5" />
                  </div>
                  <span className="truncate font-medium">{groupName}</span>
                </div>
                <ChevronRight className={`size-4 opacity-70 transition-transform ${groupOpen ? 'rotate-90' : ''}`} />
              </button>
            </SidebarMenuSubItem>

            {groupOpen && (
              <div className="ml-3">
                {sortProducts(items as any[]).map(renderProductItem)}
              </div>
            )}
          </div>
        );
      });
  };

  // Product detail navigation items
  const productDetailNavItems = [
    { path: 'device-information', label: 'Device Information', icon: FileText },
    { path: 'milestones', label: 'Milestones', icon: Calendar },
    { path: 'business-case', label: 'Business Case', icon: BarChart3 },
    { path: 'commercial', label: 'Commercial Intelligence', icon: BarChart3 },
  ];

  // Find the current product from the products list
  const currentDetailProduct = useMemo(() => {
    if (!effectiveProductId) return null;
    return productsForMenu.find(p => p.id === effectiveProductId);
  }, [effectiveProductId, productsForMenu]);

  // Render product detail navigation
  const renderProductDetailNav = () => {
    if (!currentDetailProduct || !companyName) return null;

    return (
      <>
        {/* Back to Products List */}
        <SidebarMenuSubItem className="mb-2">
          <Link 
            to={`/app/company/${encodeURIComponent(companyName)}/portfolio-landing`}
            className="flex items-center gap-3 text-sm py-2 pl-2 pr-3 hover:bg-muted/50 rounded text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Devices</span>
          </Link>
        </SidebarMenuSubItem>

        {/* Product Name Header */}
        <SidebarMenuSubItem className="mb-2">
          <div className="text-sm py-2 pl-2 pr-3 font-semibold text-foreground">
            {currentDetailProduct.name}
          </div>
        </SidebarMenuSubItem>

        {/* Product Navigation */}
        {productDetailNavItems.map(item => {
          const itemPath = `/app/product/${effectiveProductId}/${item.path}`;
          // For business-case, check if current path starts with it (to handle tabs)
          const isActive = item.path === 'business-case' 
            ? location.pathname.startsWith(itemPath)
            : location.pathname === itemPath;
          
          return (
            <SidebarMenuSubItem key={item.path} className="mb-0.5">
              <SidebarMenuSubButton asChild>
                <Link
                  to={itemPath}
                  className={`flex items-center gap-3 text-sm py-2 pl-2 pr-3 ${
                    isActive 
                      ? 'bg-muted text-foreground font-medium' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        })}
      </>
    );
  };

  return (
    <>
      <SidebarMenuButton 
        tooltip="Portfolio Management" 
        size="lg"
        className="px-3 font-medium text-sm"
      >
        <div className="flex items-center justify-between w-full">
          <Link 
            to={companyName ? `/app/company/${encodeURIComponent(companyName)}/portfolio-landing` : '#'}
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={handleProductClick}
          >
            <div className="text-muted-foreground">
              <Package className="h-5 w-5" />
            </div>
            <span>Portfolio Management</span>
          </Link>
          {!isProductDetailPage && (
            <button
              onClick={() => onToggleMenu("Products")}
              className="p-1 hover:bg-muted rounded cursor-pointer"
            >
              <ChevronRight className={`size-4 opacity-70 transition-transform ${expandedMenus["Products"] ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      </SidebarMenuButton>
      
      {/* Show product detail navigation when on a product page */}
      {isProductDetailPage ? (
        <SidebarMenuSub className="ml-5 pl-3 mt-1 mb-2">
          {renderProductDetailNav()}
        </SidebarMenuSub>
      ) : (
        /* Show product list when not on a product detail page */
        expandedMenus["Products"] && (
          <SidebarMenuSub className="ml-5 pl-3 mt-1 mb-2">
            {isLoading ? (
              <SidebarMenuSubItem className="mb-0.5">
                <SidebarMenuSubButton className="text-sm py-2 pl-2 pr-3">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span>Loading devices...</span>
                  </div>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ) : productsForMenu.length === 0 ? (
              <SidebarMenuSubItem className="mb-0.5">
                <SidebarMenuSubButton className="text-sm py-2 pl-2 pr-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span>No devices available</span>
                  </div>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ) : !shouldDisplayHierarchy ? (
              // Flat display
              sortProducts(productsForMenu).map(renderProductItem)
            ) : (
              // Hierarchy display
              renderHierarchicalProducts()
            )}
          </SidebarMenuSub>
        )
      )}
    </>
  );
}