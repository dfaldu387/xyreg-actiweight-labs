import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Tag, Network } from 'lucide-react';
import { ProductDefinitionExportButton } from '@/components/product/device/ProductDefinitionExportButton';
import { ProductDocumentUploadButton } from '@/components/product/device/ProductDocumentUploadButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product } from '@/types/client';


import { ConsistentPageHeader } from '@/components/layout/ConsistentPageHeader';
import { buildProductBreadcrumbs } from '@/utils/breadcrumbUtils';
import { detectProductType, getProductTypeLabel } from '@/utils/productTypeDetection';
import { sanitizeProductName } from '@/utils/productName';
import { useUDIDIVariants } from '@/hooks/useUDIDIVariants';
import { ProductNavigationArrows } from './ProductNavigationArrows';
import { FieldSuggestion } from '@/services/productDefinitionAIService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddVariantDialog } from '@/components/product/variants/AddVariantDialog';
import { VariantDetailsDialog } from '@/components/product/variants/VariantDetailsDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useTranslation } from '@/hooks/useTranslation';
interface ProductPageHeaderProps {
  product: Product;
  subsection?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onSuggestionsGenerated?: (suggestions: FieldSuggestion[]) => void;
  marketStatus?: any;
  displayNameOverride?: string;
  onCreateDocument?: () => void;
}
export function ProductPageHeader({
  product,
  subsection,
  onRefresh,
  isRefreshing = false,
  onSuggestionsGenerated,
  displayNameOverride,
  onCreateDocument
}: ProductPageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useTranslation();

  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };
  const handleNavigateToPortfolio = () => {
    // Product.company is now always a string (the company name)
    const companyName = product.company;
    if (companyName) {
      navigate(`/app/company/${encodeURIComponent(companyName)}/portfolio?view=list`);
    } else {
      navigate('/app/clients');
    }
  };
  const handleNavigateToProduct = () => {
    navigate(`/app/product/${product.id}`);
  };


  const companyName = product.company || '';
  
  // Get current product's family info
  const { data: currentProductData } = useQuery({
    queryKey: ['product-family-info', product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('basic_udi_di, name, trade_name, is_master_device, parent_product_id')
        .eq('id', product.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!product.id
  });

  // Determine family root ID
  const familyRootId = React.useMemo(() => {
    if (!currentProductData) return null;
    if (currentProductData.is_master_device) return product.id;
    if (currentProductData.parent_product_id) return currentProductData.parent_product_id;
    return null;
  }, [currentProductData, product.id]);

  // Fetch all family members via parent-child relationships
  const { data: productVariants, isLoading: isLoadingVariants } = useQuery({
    queryKey: ['product-family-members', familyRootId, product.company_id],
    queryFn: async () => {
      if (!familyRootId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, trade_name, udi_di, basic_udi_di, status, current_lifecycle_phase, updated_at, is_master_device, parent_product_id, parent_relationship_type')
        .eq('company_id', product.company_id)
        .eq('is_archived', false)
        .or(`id.eq.${familyRootId},parent_product_id.eq.${familyRootId}`)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!familyRootId && !!product.company_id,
  });
  // Determine if current product is a variant (has siblings and is not the first/main one)
  const isVariant = React.useMemo(() => {
    if (!productVariants || productVariants.length <= 1) return false;

    // Find the main product (first by creation date or first alphabetically)
    const sortedVariants = [...productVariants].sort((a, b) => {
      // Sort by name alphabetically, or by id if names are equal
      return (a.name || '').localeCompare(b.name || '') || a.id.localeCompare(b.id);
    });

    const mainProductId = sortedVariants[0]?.id;
    return product.id !== mainProductId;
  }, [productVariants, product.id]);

  // Get main product ID for "Back to Device" navigation
  const mainProductId = React.useMemo(() => {
    if (!productVariants || productVariants.length <= 1) return null;

    // Sort variants to find main product (first alphabetically)
    const sortedVariants = [...productVariants].sort((a, b) => {
      return (a.name || '').localeCompare(b.name || '') || a.id.localeCompare(b.id);
    });

    return sortedVariants[0]?.id || null;
  }, [productVariants]);

  // Get main product details for variant banner
  const { data: mainProduct } = useProductDetails(mainProductId || undefined, {
    enabled: !!mainProductId && isVariant
  });

  // State for variant dialogs
  const [isVariantDialogOpen, setIsVariantDialogOpen] = React.useState(false);
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null);
  const [isVariantDetailsDialogOpen, setIsVariantDetailsDialogOpen] = React.useState(false);

  // Always use the current product's name (whether it's main or variant)
  // Priority: displayNameOverride > currentProductData?.name > product.name
  const currentProductName = displayNameOverride || currentProductData?.name || product.name;
  const cleanName = sanitizeProductName(currentProductName);
  
  const { variants } = useUDIDIVariants(product.id);
  const udiSuffix = React.useMemo(() => {
    if (!variants || variants.length === 0) return undefined;
    const digits = String(variants[0]?.generated_udi_di || '').replace(/\D/g, '');
    const last6 = digits.slice(-6);
    return last6 || undefined;
  }, [variants]);
  
  // Display name: use override if provided, otherwise show current product's name (variant or main)
  // For family dashboard, don't add UDI suffix since we're showing alias/basic UDI
  const displayName = displayNameOverride 
    ? cleanName 
    : (udiSuffix ? `${cleanName} (${udiSuffix})` : cleanName);
  
  // Breadcrumb name: append trade name in parentheses if available
  const breadcrumbName = product.trade_name 
    ? `${displayName} | ${product.trade_name}` 
    : displayName;
  const breadcrumbs = buildProductBreadcrumbs(companyName, breadcrumbName, subsection, handleNavigateToClients, handleNavigateToPortfolio, handleNavigateToProduct);

  // Generate subtitle with trade name when available, fallback to product type
  const tradeName = product.trade_name;
  const productType = detectProductType(product);
  const productTypeLabel = getProductTypeLabel(productType);
  const projectType = product.project_types && Array.isArray(product.project_types) && product.project_types.length > 0 ? product.project_types[0] : 'New Device Development (NDD)';

  // Trade name is shown in breadcrumb, so subtitle only shows product type info (not trade name)
  const subtitle = (subsection && subsection !== 'Device Family Overview') ? (productTypeLabel === projectType ? productTypeLabel : `${productTypeLabel} (${projectType})`) : undefined;

  // Replace "Device" with "Variant" in subsection when viewing a variant
  // Also replace "Device Status" with "Device Family Status" when there are multiple variants
  const displaySubsection = React.useMemo(() => {
    if (!subsection) return undefined;
    
    // Count variants (excluding the current product)
    const totalProducts = productVariants?.length || 0;
    
    // Replace Device Status with Device Family Status when viewing a variant (and there is at least one other sibling)
    // or when there are multiple variants in the family.
    if (subsection === 'Device Dashboard' || subsection.includes('Device Dashboard')) {
      if ((isVariant && totalProducts > 1) || totalProducts > 2) {
        return subsection.replace(/Device Dashboard/gi, 'Device Family Dashboard');
      }
      return subsection;
    }
    
    // No longer replace "Device" with "Variant" — all family members are peers
    return subsection;
  }, [subsection, isVariant, productVariants]);

  // Create title with product name and page type when in subsection
  const title = subsection ? (
    <span className="flex items-center gap-2 flex-wrap whitespace-nowrap">
      <span className="text-company-brand">{displaySubsection}</span>
      {productVariants && productVariants.length > 1 && (
        <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
          Product Family
        </Badge>
      )}
    </span>
  ) : (
    <span className="flex items-center gap-2">
      {displayName}
      {productVariants && productVariants.length > 1 && (
        <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
          Product Family
        </Badge>
      )}
    </span>
  );

  // Variant/Device Dashboard Toggle Button Component
  const VariantDashboardButton = () => {
    // Only show button if there are multiple variants
    if (!productVariants || productVariants.length <= 1) {
      return null;
    }

    // Hide on family overview pages - user is already viewing family dashboard
    const isOnFamilyOverviewPage = location.pathname.includes('/device-family/') || 
                                    location.pathname.includes('/product-family/') ||
                                    subsection === 'Device Family Overview';
    if (isOnFamilyOverviewPage) {
      return null;
    }

    const handleNavigateToFamilyDashboard = () => {
      // Navigate to the family dashboard using the master product ID
      // Find the master device: if current product IS master, use its ID
      // If current product is a variant, use its parent_product_id
      const masterProductId = currentProductData?.is_master_device ? product.id : currentProductData?.parent_product_id;
      if (masterProductId) {
        navigate(`/app/device-family/${masterProductId}`);
      }
    };

    return (
      <Button 
        variant="outline" 
        size="default" 
        className="gap-2" 
        onClick={handleNavigateToFamilyDashboard}
        disabled={isLoadingVariants || !familyRootId}
      >
        <Network className="h-4 w-4" />
        {isLoadingVariants ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>{lang('productDashboard.header.variantDashboard')}</span>
        )}
      </Button>
    );
  };

  // Move navigation arrows to header actions instead of inline with title
  const headerActions = <>
    {/* {isVariant && mainProductId && (
      <Button
        variant="outline"
        size="default"
        onClick={() => {
          // Preserve the current route path when navigating back to main device
          const currentPath = location.pathname;
          const pathMatch = currentPath.match(/\/app\/product\/[^\/]+(\/.*)?$/);

          if (pathMatch && pathMatch[1]) {
            // Preserve the subsection path
            navigate(`/app/product/${mainProductId}${pathMatch[1]}${location.search}`);
          } else {
            // Navigate to main device dashboard
            navigate(`/app/product/${mainProductId}${location.search}`);
          }
        }}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Device
      </Button>
    )} */}
    <ProductNavigationArrows
      productId={product.id}
      companyId={product.company_id}
    />
    {/* <VariantDashboardButton /> */}
    {subsection === 'Device Definition' && (
      <>
        <ProductDocumentUploadButton
          companyId={product.company_id}
          onSuggestionsGenerated={onSuggestionsGenerated}
        />
        <ProductDefinitionExportButton
          productId={product.id}
          companyId={product.company_id}
          productName={cleanName}
        />
      </>
    )}


    {onRefresh && <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>}

  </>;
  return (
    <>
      <ConsistentPageHeader breadcrumbs={breadcrumbs} title={title} subtitle={subtitle} actions={headerActions} onCreateDocument={onCreateDocument} />

      {/* Variant Indicator Banner */}
      {/* {isVariant && mainProductId && (
        <div className="border-b bg-blue-50/50 dark:bg-blue-950/20 px-4 sm:px-6 lg:px-8 py-3">
          <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              You are viewing a Variant
            </AlertTitle>
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200 mt-1.5">
              This is a variant of the main device{' '}
              <span className="font-semibold">{mainProduct?.name || 'Device'}</span>.
              {mainProductId && (
                <>
                  {' '}Click{' '}
                  <button
                    onClick={() => {
                      const currentPath = location.pathname;
                      const pathMatch = currentPath.match(/\/app\/product\/[^\/]+(\/.*)?$/);

                      if (pathMatch && pathMatch[1]) {
                        navigate(`/app/product/${mainProductId}${pathMatch[1]}${location.search}`);
                      } else {
                        navigate(`/app/product/${mainProductId}${location.search}`);
                      }
                    }}
                    className="font-semibold underline hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                  >
                    here
                  </button>
                  {' '}to view the main device.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )} */}

      <AddVariantDialog
        open={isVariantDialogOpen}
        onOpenChange={setIsVariantDialogOpen}
        productId={product.id}
        companyId={product.company_id}
      />

      <VariantDetailsDialog
        open={isVariantDetailsDialogOpen}
        onOpenChange={setIsVariantDetailsDialogOpen}
        variant={selectedVariant}
        companyId={product.company_id}
      />
    </>
  );
}