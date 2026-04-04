
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useProductDetails } from "@/hooks/useProductDetails";
import { useCompanyProducts } from "@/hooks/useCompanyProducts";
import { useProductCompanyGuard } from "@/hooks/useProductCompanyGuard";
import { ProductDashboardHeader } from "@/components/product/dashboard/ProductDashboardHeader";
import { ProductPhases } from "@/components/product/ProductPhases";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";

export default function ProductLifecycle() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: product, isLoading, refetch } = useProductDetails(productId, {
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const { companyId } = useCompanyProducts(product?.company_id || "");

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, isLoading);

  // Handle page initialization with cache invalidation
  useEffect(() => {
    const initializePage = async () => {
      const fromOtherPage = searchParams.get('from');
      
      if (fromOtherPage && productId) {
        await queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
        if (refetch) {
          await refetch();
        }
        toast.success('Product data refreshed');
      }
    };

    initializePage();
  }, [productId, searchParams, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
      if (refetch) {
        await refetch();
      }
      toast.success('Lifecycle phases refreshed');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh lifecycle phases');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleArchive = () => {
    toast.info('Archive functionality not yet implemented');
  };

  const handleEdit = () => {
    toast.info('Edit functionality not yet implemented');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading lifecycle phases...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-muted-foreground">The requested product could not be found or you may not have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* STICKY HEADER - Stays at top during scroll */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <ProductDashboardHeader
          product={product}
          onArchive={handleArchive}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          subsection="Lifecycle"
        />
      </div>

      {/* MAIN CONTENT AREA - Flows naturally after sticky header */}
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4">
        <ProductPhases 
          phases={product?.lifecyclePhases || []}
          product={product}
        />
      </div>
    </div>
  );
}
