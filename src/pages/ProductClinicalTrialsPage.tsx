import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ProductPageHeader } from '@/components/product/layout/ProductPageHeader';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductCompanyGuard } from '@/hooks/useProductCompanyGuard';
import { useProductMarketStatus } from '@/hooks/useProductMarketStatus';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ClinicalTrialsManager } from '@/components/clinical/ClinicalTrialsManager';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { DEVICES_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { InvestorShareFlowWrapper } from '@/components/funnel/InvestorShareFlowWrapper';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProductClinicalTrialsPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint';
  const { data: product, isLoading } = useProductDetails(productId || undefined);
  const { lang } = useTranslation();

  // Auto-scroll to Evidence Requirements when navigating from Genesis
  useEffect(() => {
    if (isGenesisFlow && !isLoading) {
      const timer = setTimeout(() => {
        const el = document.getElementById('genesis-evidence-requirements');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGenesisFlow, isLoading]);
  const { isMenuAccessKeyEnabled, isLoading: isLoadingPlanAccess, planName } = usePlanMenuAccess();
  const marketStatus = useProductMarketStatus(product?.markets);

  // Check if Clinical Trials feature is enabled
  const isFeatureEnabled = isMenuAccessKeyEnabled(DEVICES_MENU_ACCESS.CLINICAL_TRIALS);
  const isRestricted = !isFeatureEnabled;

  // Validate user has access to product's company (auto-switches context if needed)
  const { isValidating } = useProductCompanyGuard(product, isLoading);


  if (!productId) {
    return (
      <div className="px-2 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">{lang('clinicalTrials.productNotFound')}</h1>
          <p className="text-muted-foreground mt-2">
            {lang('clinicalTrials.productNotFoundDescription')}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingPlanAccess) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <InvestorShareFlowWrapper productId={productId}>
      <div className="flex h-full min-h-0 flex-col">
        <ProductPageHeader
          product={product}
          subsection={lang('clinicalTrials.title')}
          marketStatus={marketStatus}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-2 py-2 sm:py-3 lg:py-4">
            <RestrictedFeatureProvider
              isRestricted={isRestricted}
              planName={planName}
              featureName="Clinical Trials"
            >
              {isRestricted && <RestrictedPreviewBanner className="mb-4" />}
              <ClinicalTrialsManager
                productId={productId}
                companyId={product?.company_id || ''}
                companyName={product?.company || ''}
                disabled={isRestricted}
              />
            </RestrictedFeatureProvider>
          </div>
        </div>
      </div>
    </InvestorShareFlowWrapper>
  );
}
