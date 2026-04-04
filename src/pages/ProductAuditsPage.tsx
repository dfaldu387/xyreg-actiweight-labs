
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useProductDetails } from "@/hooks/useProductDetails";
import { ProductPageHeader } from "@/components/product/layout/ProductPageHeader";
import { useProductMarketStatus } from "@/hooks/useProductMarketStatus";
import { ProductAudits } from "@/components/audit/ProductAudits";
import { queryClient } from "@/lib/query-client";
import { toast } from "sonner";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { useTranslation } from "@/hooks/useTranslation";

export default function ProductAuditsPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { lang } = useTranslation();

  const { data: product, isLoading, refetch } = useProductDetails(productId, {
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Check if Audits feature is enabled
  const { isMenuAccessKeyEnabled, isLoading: isLoadingPlanAccess, planName } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(DEVICES_MENU_ACCESS.COMPLIANCE_AUDITS);
  const isRestricted = !isFeatureEnabled;

  // Calculate market status for badges - MUST be called before any conditional returns
  const marketStatus = useProductMarketStatus(product?.markets);

  // Handle page initialization with cache invalidation
  useEffect(() => {
    const initializePage = async () => {
      const fromOtherPage = searchParams.get('from');

      if (fromOtherPage && productId) {
        await queryClient.invalidateQueries({ queryKey: ['productDetails', productId] });
        if (refetch) {
          await refetch();
        }
        toast.success(lang('deviceAudits.page.dataRefreshed'));
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
      toast.success(lang('deviceAudits.page.auditsRefreshed'));
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error(lang('deviceAudits.page.refreshFailed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleArchive = () => {
    toast.info(lang('deviceAudits.page.archiveNotImplemented'));
  };

  if (isLoading || isLoadingPlanAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">{lang('deviceAudits.page.loading')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">{lang('deviceAudits.page.deviceNotFound')}</h2>
          <p className="text-muted-foreground">{lang('deviceAudits.page.deviceNotFoundDescription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProductPageHeader
        product={product}
        subsection={lang('deviceAudits.page.subsection')}
        marketStatus={marketStatus}
      />

      <RestrictedFeatureProvider
        isRestricted={isRestricted}
        planName={planName}
        featureName={lang('deviceAudits.page.featureName')}
      >
        {isRestricted && <RestrictedPreviewBanner className="mt-2 !mb-0" />}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full py-2 sm:py-3 lg:py-4" data-tour="audits">
            <ProductAudits
              productId={product.id}
              companyId={product.company_id}
              disabled={isRestricted}
            />
          </div>
        </div>
      </RestrictedFeatureProvider>
    </div>
  );
}
