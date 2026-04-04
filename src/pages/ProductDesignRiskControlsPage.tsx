import React, { useState } from "react"; // v2
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useProductDetails } from "@/hooks/useProductDetails";
import { ProductPageHeader } from "@/components/product/layout/ProductPageHeader";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { useProductCompanyGuard } from "@/hooks/useProductCompanyGuard";
import { toast } from "sonner";
import { DesignRiskControlsContainer } from "@/components/product/design-risk-controls/DesignRiskControlsContainer";
import { InvestorShareFlowWrapper } from "@/components/funnel/InvestorShareFlowWrapper";

export default function ProductDesignRiskControlsPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: product, isLoading: isLoadingProduct, error: productError, refetch } = useProductDetails(productId);


  // Calculate market status for badges (MUST be called before any conditional returns)
  const marketStatus = useProductMarketStatus(product?.markets);

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, isLoadingProduct);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
      toast.success('Design & Risk Controls refreshed');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh design & risk controls');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleArchive = () => {
    toast.info('Archive functionality not yet implemented');
  };

  // Show loading state while product is loading
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading design & risk controls...</p>
        </div>
      </div>
    );
  }

  // Handle product errors
  if (productError) {
    const errorMessage = productError instanceof Error ? productError.message :
                        typeof productError === 'string' ? productError :
                        'Failed to load product information';

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Product</h2>
          <p className="text-muted-foreground">{errorMessage}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle missing product
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-muted-foreground">The requested product could not be found or you may not have access to it.</p>
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <InvestorShareFlowWrapper productId={productId!}>
      <div className="flex h-full min-h-0 flex-col">
        <ProductPageHeader
          product={product}
          subsection="Design & Risk Controls"
          marketStatus={marketStatus}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4">
            <DesignRiskControlsContainer 
              productId={productId!} 
              companyId={product.company_id!}
              initialTab={searchParams.get('tab') || undefined}
            />
          </div>
        </div>
      </div>
    </InvestorShareFlowWrapper>
  );
}