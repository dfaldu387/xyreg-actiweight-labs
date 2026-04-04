import React from 'react';
import { Link } from 'react-router-dom';
import { Package, PackagePlus, ChevronRight, GitBranch, Archive } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { useReviewerGroupMembership } from '@/hooks/useReviewerGroupMembership';
import { useReviewerProducts } from '@/hooks/useReviewerProducts';
import { detectProductType } from '@/utils/productTypeDetection';

interface SidebarReviewerProductMenuProps {
  currentProductId: string | null;
  expandedMenus: Record<string, boolean>;
  onToggleMenu: (menuName: string) => void;
  onCollapseMenu: (menuName: string) => void;
  isProductActive: (productPath: string) => boolean;
  targetCompanyId: string | null;
}

export function SidebarReviewerProductMenu({
  currentProductId,
  expandedMenus,
  onToggleMenu,
  onCollapseMenu,
  isProductActive,
  targetCompanyId
}: SidebarReviewerProductMenuProps) {
  const { userGroups, isLoading: isLoadingGroups } = useReviewerGroupMembership(targetCompanyId || undefined);
  const { data: reviewerProducts, isLoading: isLoadingProducts } = useReviewerProducts({
    reviewerGroupIds: userGroups,
    enabled: userGroups.length > 0
  });

  const isLoading = isLoadingGroups || isLoadingProducts;
  const products = reviewerProducts || [];

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

  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <SidebarMenuButton 
        tooltip="My Devices" 
        size="lg"
        className="px-3 font-medium text-sm"
      >
        <div className="flex items-center justify-between w-full">
          <Link 
            to="/app/review-panel/products"
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={handleProductClick}
          >
            <div className="text-muted-foreground">
              <Package className="h-5 w-5" />
            </div>
            <span>My Devices</span>
          </Link>
          <button
            onClick={() => onToggleMenu("Products")}
            className="p-1 hover:bg-muted rounded cursor-pointer"
          >
            <ChevronRight className={`size-4 opacity-70 transition-transform ${expandedMenus["Products"] ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </SidebarMenuButton>
      
      {expandedMenus["Products"] && (
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
          ) : products.length === 0 ? (
            <SidebarMenuSubItem className="mb-0.5">
              <SidebarMenuSubButton className="text-sm py-2 pl-2 pr-3">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span>No devices assigned</span>
                </div>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ) : (
            sortedProducts.map((p) => {
              const productType = detectProductType({
                parent_product_id: null,
                udi_suffix: p.model_reference,
                status: p.status
              });
              const path = `/app/product/${p.id}/device-information`;
              const isActiveProduct = isProductActive(path);
              const activeItemClass = isActiveProduct ? "bg-primary/10 font-medium border-l-2 border-primary" : "";
              const bracketClass = isActiveProduct ? "relative before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-primary" : "";

              return (
                <SidebarMenuSubItem key={p.id} className={`mb-0.5 ${bracketClass}`}>
                  <SidebarMenuSubButton 
                    asChild 
                    isActive={isActiveProduct} 
                    className={`text-sm py-2 pl-2 pr-3 ${activeItemClass}`}
                    title={p.name}
                  >
                    <Link to={path} className="flex items-center gap-3 w-full" onClick={handleProductClick}>
                      <div className="-ml-1.5">{getProductTypeIcon(productType)}</div>
                      <span className="truncate">{p.name}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })
          )}
        </SidebarMenuSub>
      )}
    </>
  );
}
