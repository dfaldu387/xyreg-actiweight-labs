import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { ProductActivitiesTab } from "@/components/activities/ProductActivitiesTab";
import { CompanyActivitiesTab } from "@/components/activities/CompanyActivitiesTab";
import { useCompanyId } from "@/hooks/useCompanyId";
import { ConsistentPageHeader } from "@/components/layout/ConsistentPageHeader";
import { buildCompanyBreadcrumbs, buildProductBreadcrumbs } from "@/utils/breadcrumbUtils";
import { useProductDetails } from "@/hooks/useProductDetails";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { isValidUUID } from "@/utils/uuidValidation";
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS, DEVICES_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { RestrictedFeatureProvider } from '@/contexts/RestrictedFeatureContext';
import { RestrictedPreviewBanner } from '@/components/subscription/RestrictedPreviewBanner';
import { useTranslation } from "@/hooks/useTranslation";

export default function Activities() {
  const { companyName, productId } = useParams<{ companyName?: string; productId?: string }>();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const decodedCompanyName = companyName ? decodeURIComponent(companyName) : "";
  const { lang } = useTranslation();

  // Determine if we're in company or product context (needed before restriction check)
  const isCompanyContext = !!companyName && !productId;
  const isProductContext = !!productId;

  // Restriction check - double security pattern (hooks must be called before any conditional returns)
  // Use different menu access key based on context
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();
  const menuAccessKey = isProductContext
    ? DEVICES_MENU_ACCESS.COMPLIANCE_ACTIVITIES
    : PORTFOLIO_MENU_ACCESS.COMPLIANCE_ACTIVITIES;
  const isFeatureEnabled = isMenuAccessKeyEnabled(menuAccessKey);
  const isRestricted = !isFeatureEnabled;

  // Fetch product details when in product context
  const { data: product } = useProductDetails(productId);

  // Show loading while companyId is resolving (only for company context)
  if (isCompanyContext && !isValidUUID(companyId)) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  const handleNavigateToClients = () => {
    navigate('/app/clients');
  };

  const handleNavigateToCompany = () => {
    if (product?.company) {
      navigate(`/app/company/${encodeURIComponent(product.company)}`);
    } else if (companyName) {
      navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}`);
    } else {
      navigate('/app/clients');
    }
  };

  const handleNavigateToProduct = () => {
    if (productId) {
      navigate(`/app/product/${productId}`);
    }
  };

  const getPageTitle = () => {
    if (isProductContext) return lang('activities.page.titleProduct');
    if (isCompanyContext) return lang('activities.page.titleCompany').replace('{{companyName}}', decodedCompanyName);
    return lang('activities.page.titleDefault');
  };
  
  const getPageDescription = () => {
    if (isProductContext) return lang('activities.page.subtitleProduct');
    if (isCompanyContext) return lang('activities.page.subtitleCompany');
    return lang('activities.page.subtitleDefault');
  };

  // Build breadcrumbs based on context
  const getBreadcrumbs = () => {
    if (isProductContext && product) {
      return buildProductBreadcrumbs(
        product.company,
        product.name,
        lang('sidebar.menuItems.activities'),
        handleNavigateToClients,
        handleNavigateToCompany,
        handleNavigateToProduct
      );
    } else if (isCompanyContext) {
      return [
        {
          label: lang('clients.clientCompass'),
          onClick: handleNavigateToClients
        },
        {
          label: decodedCompanyName,
          onClick: handleNavigateToCompany
        },
        {
          label: lang('sidebar.menuItems.complianceInstances'),
          onClick: () => navigate(`/app/company/${encodeURIComponent(decodedCompanyName)}/compliance-instances`)
        },
        {
          label: lang('sidebar.menuItems.activities')
        }
      ];
    }
    return [{ label: lang('sidebar.menuItems.activities') }]; // Fallback
  };

  if (isCompanyContext || isProductContext) {
    return (
      <RestrictedFeatureProvider
        isRestricted={isRestricted}
        planName={planName}
        featureName={lang('sidebar.menuItems.activities')}
      >
        <div className="flex h-full min-h-0 flex-col">
          <ConsistentPageHeader
            breadcrumbs={getBreadcrumbs()}
            title={getPageTitle()}
            subtitle={getPageDescription()}
          />

          {isRestricted && <RestrictedPreviewBanner className="mt-6 !mb-0" />}

          <div className="flex-1 overflow-y-auto">
            <div className="w-full pt-6">
              {isProductContext ? <ProductActivitiesTab disabled={isRestricted} /> : <CompanyActivitiesTab disabled={isRestricted} />}
            </div>
          </div>
        </div>
      </RestrictedFeatureProvider>
    );
  }

  // Fallback to original layout for other contexts
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h1>
          <p className="text-muted-foreground">
            {getPageDescription()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {isProductContext ? <ProductActivitiesTab /> : <CompanyActivitiesTab />}
      </div>
    </div>
  );
}
