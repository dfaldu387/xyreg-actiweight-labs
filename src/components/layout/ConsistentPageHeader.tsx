
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { useSearchParams } from "react-router-dom";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface ConsistentPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  actions?: React.ReactNode;
  onCreateDocument?: () => void;
  documentStatus?: 'none' | 'draft' | 'approved';
}

// Page name keys for matching - order matters, check longer strings first
const PAGE_NAMES = [
  'Executive Dashboard',
  'Compliance Instances',
  'Xyreg Genesis',
  'Business Case',
  'Commercial Intelligence',
  'Market & Regulatory',
  'Market Analysis',
  'rNPV Analysis',
  'Venture Blueprint',
  'Design & Risk Controls',
  'Portfolio Management',
  'Commercial Strategy',
  'Commercial Performance',
  'Variance Analysis',
  'Pricing Strategy',
  'Mission Control',
  'Document Studio',
  'Product Information',
  'Device Definition',
  'Device Dashboard',
  'Gap Analysis',
  'Settings',
  'Documents',
  'Audits',
  'Activities',
  'Dashboard',
  'Suppliers',
  'Milestones',
  'Document Studio'
] as const;

// Map page names to translation keys
const PAGE_NAME_TRANSLATION_KEYS: Record<string, string> = {
  'Executive Dashboard': 'pageHeader.executiveDashboard',
  'Compliance Instances': 'pageHeader.complianceInstances',
  'Xyreg Genesis': 'pageHeader.xyregGenesis',
  'Business Case': 'pageHeader.businessCase',
  'Commercial Intelligence': 'pageHeader.commercialIntelligence',
  'Market & Regulatory': 'pageHeader.targetMarkets',
  'Market Analysis': 'pageHeader.marketAnalysis',
  'rNPV Analysis': 'pageHeader.rnpvAnalysis',
  'Venture Blueprint': 'pageHeader.ventureBlueprint',
  'Design & Risk Controls': 'pageHeader.designRiskControls',
  'Portfolio Management': 'pageHeader.portfolioManagement',
  'Commercial Strategy': 'pageHeader.commercialStrategy',
  'Commercial Performance': 'pageHeader.commercialPerformance',
  'Variance Analysis': 'pageHeader.varianceAnalysis',
  'Pricing Strategy': 'pageHeader.pricingStrategy',
  'Mission Control': 'pageHeader.missionControl',
  'Document Studio': 'pageHeader.documentStudio',
  'Product Information': 'pageHeader.productInformation',
  'Device Definition': 'pageHeader.deviceDefinition',
  'Device Dashboard': 'pageHeader.deviceStatus',
  'Gap Analysis': 'pageHeader.gapAnalysis',
  'Settings': 'pageHeader.settings',
  'Documents': 'pageHeader.documents',
  'Audits': 'pageHeader.audits',
  'Activities': 'pageHeader.activities',
  'Dashboard': 'pageHeader.dashboard',
  'Suppliers': 'pageHeader.suppliers',
  'Milestones': 'pageHeader.milestones'
};

function parseTitle(title: string): { companyOrProduct: string; pageName: string } | null {
  for (const pageName of PAGE_NAMES) {
    if (title.includes(pageName)) {
      const companyOrProduct = title.replace(pageName, '').trim();
      return { companyOrProduct, pageName };
    }
  }

  return null;
}

export function ConsistentPageHeader({
  breadcrumbs,
  title,
  subtitle,
  actions,
  onCreateDocument,
  documentStatus = 'none'
}: ConsistentPageHeaderProps) {
  const { lang } = useTranslation();
  const { planName, isSubscriptionLoading } = useSubscriptionContext();
  const { companyRoles } = useCompanyRole();
  const isGenesis = !isSubscriptionLoading && (!planName || planName.toLowerCase() === 'genesis');
  const [searchParams] = useSearchParams();
  const isSingleCompany = companyRoles.length <= 1 || isGenesis;
  const isGenesisTab = searchParams.get('tab') === 'genesis';

  // Get translated page name
  const getTranslatedPageName = (pageName: string): string => {
    const translationKey = PAGE_NAME_TRANSLATION_KEYS[pageName];
    return translationKey ? lang(translationKey) : pageName;
  };

  return (
    <div className={`sticky top-0 z-30 border-b bg-background -mt-4 rounded-lg ${isGenesisTab ? 'mr-[280px] lg:mr-[300px] xl:mr-[320px]' : ''}`}>
      <div className="p-6 pt-4">
        {/* Simple Breadcrumb Navigation - hidden for Genesis plan and single company */}
        {(() => {
          const visibleBreadcrumbs = isSingleCompany ? breadcrumbs.slice(1) : breadcrumbs;
          if (visibleBreadcrumbs.length === 0) return null;
          return (
          <div className="mb-4 overflow-x-auto">
            <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
              {visibleBreadcrumbs.map((breadcrumb, index) => (
                  <span key={index} className="flex items-center">
                    {index === visibleBreadcrumbs.length - 1 ? (
                      <span className="font-medium text-primary">
                        {breadcrumb.label}
                      </span>
                    ) : (
                      <button
                        onClick={breadcrumb.onClick}
                        className="hover:text-primary cursor-pointer"
                        {...(breadcrumb.label === 'Client Compass' ? { 'data-tour': 'breadcrumb-client-compass' } : {})}
                      >
                        {breadcrumb.label}
                      </button>
                    )}
                    {index < visibleBreadcrumbs.length - 1 && (
                      <span className="mx-2">›</span>
                    )}
                  </span>
                ))}
            </div>
          </div>
          );
        })()}

        {/* Page Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {(() => {
                if (typeof title === 'string') {
                  const parsedTitle = parseTitle(title);
                  if (parsedTitle) {
                    return (
                      <>
                        <span className="text-foreground">{parsedTitle.companyOrProduct}</span>
                        <span className="ml-2 text-company-brand font-bold">{getTranslatedPageName(parsedTitle.pageName)}</span>
                      </>
                    );
                  }
                  return <span className="text-foreground">{title}</span>;
                } else {
                  return title;
                }
              })()}
            </h1>
            {subtitle && (
              <div className="flex items-center gap-2 text-muted-foreground text-base">
                <span>{subtitle}</span>
                {onCreateDocument && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={onCreateDocument}
                        >
                          <FileEdit className={`h-4 w-4 ${documentStatus === 'approved' ? 'text-green-500' : documentStatus === 'draft' ? 'text-yellow-500' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create Document</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
          {actions && (
            <div className="grid grid-cols-2 xl:flex xl:flex-row gap-2 justify-between shrink-0 [&>*]:col-span-1 overflow-x-auto">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
