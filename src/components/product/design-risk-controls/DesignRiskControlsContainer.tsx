import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { useDeviceModuleAccess } from "@/hooks/useDeviceModuleAccess";
import { Card } from "@/components/ui/card";
import { RequirementSpecificationsContainer } from "./RequirementSpecificationsContainer";
import { RiskManagementWithSubTabs } from "./risk-management/RiskManagementWithSubTabs";
import { SystemArchitectureModule } from "./system-architecture/SystemArchitectureModule";
import { VerificationValidationModule } from "./verification-validation/VerificationValidationModule";
import { TraceabilityModule } from "./traceability/TraceabilityModule";
import { UsabilityEngineeringModule } from "./usability-engineering/UsabilityEngineeringModule";
import { DesignRiskDashboard } from "./DesignRiskDashboard";

import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useGenesisRestrictions } from "@/hooks/useGenesisRestrictions";

// Tab configuration with menu access keys and descriptions
const createTabConfig = (lang: (key: string) => string) => [
  {
    value: 'dashboard',
    label: 'Dashboard',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY, // reuse traceability access since dashboard is read-only summary
    description: 'Overview of all design control domains'
  },
  {
    value: 'traceability',
    label: lang('designRiskControls.tabs.traceability'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY,
    description: lang('designRiskControls.tabs.traceabilityDescription')
  },
  {
    value: 'requirement-specifications',
    label: lang('designRiskControls.tabs.requirements'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS,
    description: lang('designRiskControls.tabs.requirementsDescription')
  },
  {
    value: 'usability-engineering',
    label: lang('designRiskControls.tabs.usabilityEngineering'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_UEF,
    description: lang('designRiskControls.tabs.usabilityEngineeringDescription')
  },
  {
    value: 'risk-management',
    label: lang('designRiskControls.tabs.riskManagement'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_MANAGEMENT,
    description: lang('designRiskControls.tabs.riskManagementDescription')
  },
  {
    value: 'verification-validation',
    label: lang('designRiskControls.tabs.verificationValidation'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_VV,
    description: lang('designRiskControls.tabs.verificationValidationDescription')
  },
  {
    value: 'system-architecture',
    label: lang('designRiskControls.tabs.architecture'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_ARCHITECTURE,
    description: lang('designRiskControls.tabs.architectureDescription')
  },
];

interface DesignRiskControlsContainerProps {
  productId: string;
  companyId: string;
  initialTab?: string;
}

export function DesignRiskControlsContainer({
  productId,
  companyId,
  initialTab
}: DesignRiskControlsContainerProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isGenesis } = useGenesisRestrictions();

  // Check if we're in Genesis flow (via URL param OR on Genesis plan)
  const isInGenesisFlow = searchParams.get('returnTo') === 'genesis' || isGenesis;

  // Derive activeTab directly from URL — single source of truth, no race conditions
  const validTabs = ['dashboard', 'traceability', 'requirement-specifications', 'usability-engineering', 'risk-management', 'verification-validation', 'system-architecture'];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : initialTab || 'dashboard';

  // Plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();

  // Create tab config with translations
  const TAB_CONFIG = createTabConfig(lang);
  const { hasAccess: hasDeviceModuleAccess } = useDeviceModuleAccess(productId || null);

  // Check if a tab is enabled based on plan's menu_access
  const isTabEnabled = (menuAccessKey: string): boolean => {
    return isMenuAccessKeyEnabled(menuAccessKey);
  };

  // Helper to get tab config by value
  const getTabConfig = (tabValue: string) => TAB_CONFIG.find(t => t.value === tabValue);

  // Render tab content - applies preview mode restrictions if tab is disabled
  const renderTabContent = (tabValue: string, content: React.ReactNode) => {
    const tabConfig = getTabConfig(tabValue);
    if (!tabConfig) return content;

    // Show loading state while checking plan access
    if (isLoadingPlanAccess) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{lang('common.loading')}</p>
          </div>
        </div>
      );
    }

    const isFeatureEnabled = isTabEnabled(tabConfig.menuAccessKey);
    const isRestricted = !isFeatureEnabled;

    if (isRestricted) {
      // Clone the content element to add disabled prop if it's a React element
      const contentWithDisabled = React.isValidElement(content)
        ? React.cloneElement(content as React.ReactElement<any>, { disabled: isRestricted })
        : content;

      return (
        <RestrictedFeatureProvider
          isRestricted={isRestricted}
          planName={planName}
          featureName={tabConfig.label}
        >
          {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
          {contentWithDisabled}
        </RestrictedFeatureProvider>
      );
    }

    return content;
  };

  // Ensure tab is always reflected in URL
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', activeTab);
      setSearchParams(newParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Update URL when tab changes (URL is the single source of truth)
  const handleTabChange = (newTab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newTab);
    // Handle subTab for tabs that have sub-tabs
    if (newTab === 'requirement-specifications') {
      if (!newParams.get('subTab')) {
        newParams.set('subTab', 'user-needs');
      }
    } else if (newTab === 'verification-validation') {
      if (!newParams.get('subTab')) {
        newParams.set('subTab', 'vv-plan');
      }
    } else if (newTab === 'traceability') {
      if (!newParams.get('subTab')) {
        newParams.set('subTab', 'matrix');
      }
    } else {
      newParams.delete('subTab');
    }
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="space-y-6">
      <TooltipProvider>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto w-full bg-muted rounded-md">
          <TabsList className="inline-flex w-full justify-between gap-2 p-1 bg-transparent xl:grid xl:grid-cols-7">
            {TAB_CONFIG.map((tab) => {
              // While loading plan access, show tabs in a neutral/loading state
              if (isLoadingPlanAccess) {
                return (
                  <div
                    key={tab.value}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground/50"
                  >
                    <span className="truncate opacity-50">{tab.label}</span>
                  </div>
                );
              }

              const enabled = isTabEnabled(tab.menuAccessKey);

              // Check device module access for this sub-tab
              const deviceTabPermMap: Record<string, string> = {
                'requirement-specifications': 'design-risk-controls.requirements',
                'system-architecture': 'design-risk-controls.architecture',
                'risk-management': 'design-risk-controls.risk-mgmt',
                'verification-validation': 'design-risk-controls.vv',
                'usability-engineering': 'design-risk-controls.usability-engineering',
                'traceability': 'design-risk-controls.traceability',
              };
              const devicePermId = deviceTabPermMap[tab.value];
              const hasDeviceAccess = !devicePermId || hasDeviceModuleAccess(devicePermId);

              if (!enabled || !hasDeviceAccess) {
                return (
                  <Tooltip key={tab.value}>
                    <TooltipTrigger asChild>
                      <TabsTrigger value={tab.value} disabled={!hasDeviceAccess} className={cn("flex items-center gap-1.5", activeTab === tab.value && "bg-background", !hasDeviceAccess && "opacity-40 cursor-not-allowed")}>
                        <Lock className="h-3 w-3 text-slate-500" />
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                          {!hasDeviceAccess
                            ? 'Access restricted by your administrator'
                            : planName
                              ? lang('designRiskControls.lockedTab.withPlan').replace('{planName}', planName)
                              : lang('designRiskControls.lockedTab.generic')}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <DesignRiskDashboard productId={productId} companyId={companyId} />
          </TabsContent>

          <TabsContent value="requirement-specifications" className="space-y-6">
            {renderTabContent('requirement-specifications',
              <RequirementSpecificationsContainer 
                productId={productId} 
                companyId={companyId}
                initialSubTab={searchParams.get('subTab') || undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="system-architecture" className="space-y-6">
            {renderTabContent('system-architecture',
              <SystemArchitectureModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="risk-management" className="space-y-6">
            {renderTabContent('risk-management',
              <RiskManagementWithSubTabs productId={productId} companyId={companyId} isInGenesisFlow={isInGenesisFlow} />
            )}
          </TabsContent>

          <TabsContent value="verification-validation" className="space-y-6">
            {renderTabContent('verification-validation',
              <VerificationValidationModule 
                productId={productId} 
                companyId={companyId}
                initialSubTab={searchParams.get('subTab') || undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="usability-engineering" className="space-y-6">
            {renderTabContent('usability-engineering',
              <UsabilityEngineeringModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="traceability" className="space-y-6">
            {renderTabContent('traceability',
              <TraceabilityModule 
                productId={productId} 
                companyId={companyId}
                initialSubTab={searchParams.get('subTab') || undefined}
              />
            )}
          </TabsContent>

        </Tabs>
      </TooltipProvider>
    </div>
  );
}