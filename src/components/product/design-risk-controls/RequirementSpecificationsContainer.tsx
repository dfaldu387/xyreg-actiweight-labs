import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { UserNeedsModule } from "./user-needs/UserNeedsModule";
import { SystemRequirementsModule } from "./system-requirements/SystemRequirementsModule";
import { SoftwareRequirementsModule } from "./software-requirements/SoftwareRequirementsModule";
import { HardwareRequirementsModule } from "./hardware-requirements/HardwareRequirementsModule";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface RequirementSpecificationsContainerProps {
  productId: string;
  companyId: string;
  initialSubTab?: string;
}

// Sub-tab configuration with menu access keys
const createSubTabConfig = (lang: (key: string) => string) => [
  {
    value: 'user-needs',
    label: lang('designRiskControls.subTabs.userNeeds'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS_USER_NEEDS,
  },
  {
    value: 'system-requirements',
    label: lang('designRiskControls.subTabs.systemRequirements'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS_SYSTEM,
  },
  {
    value: 'software-requirements',
    label: lang('designRiskControls.subTabs.softwareRequirements'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS_SOFTWARE,
  },
  {
    value: 'hardware-requirements',
    label: lang('designRiskControls.subTabs.hardwareRequirements'),
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_REQUIREMENTS_HARDWARE,
  },
];

export function RequirementSpecificationsContainer({
  productId,
  companyId,
  initialSubTab
}: RequirementSpecificationsContainerProps) {
  const { lang } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();

  // Create sub-tab config with translations
  const SUB_TAB_CONFIG = createSubTabConfig(lang);

  // Derive activeSubTab directly from URL — single source of truth, no race conditions
  const validSubTabs = ['user-needs', 'system-requirements', 'software-requirements', 'hardware-requirements'];
  const subTabFromUrl = searchParams.get('subTab');
  const activeSubTab = subTabFromUrl && validSubTabs.includes(subTabFromUrl)
    ? subTabFromUrl
    : initialSubTab && validSubTabs.includes(initialSubTab)
      ? initialSubTab
      : 'user-needs';

  // Ensure subTab is always reflected in URL
  useEffect(() => {
    const currentSubTab = searchParams.get('subTab');
    if (currentSubTab !== activeSubTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('subTab', activeSubTab);
      setSearchParams(newParams, { replace: true });
    }
  }, [activeSubTab, searchParams, setSearchParams]);

  // Check if a sub-tab is enabled based on plan's menu_access
  const isSubTabEnabled = (menuAccessKey: string): boolean => {
    return isMenuAccessKeyEnabled(menuAccessKey);
  };

  // Helper to get sub-tab config by value
  const getSubTabConfig = (subTabValue: string) => SUB_TAB_CONFIG.find(t => t.value === subTabValue);

  // Render sub-tab content - applies preview mode restrictions if sub-tab is disabled
  const renderSubTabContent = (subTabValue: string, content: React.ReactNode) => {
    const subTabConfig = getSubTabConfig(subTabValue);
    if (!subTabConfig) return content;

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

    const isFeatureEnabled = isSubTabEnabled(subTabConfig.menuAccessKey);
    const isRestricted = !isFeatureEnabled;

    if (isRestricted) {
      const contentWithDisabled = React.isValidElement(content)
        ? React.cloneElement(content as React.ReactElement<any>, { disabled: isRestricted })
        : content;

      return (
        <RestrictedFeatureProvider
          isRestricted={isRestricted}
          planName={planName}
          featureName={subTabConfig.label}
        >
          {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
          {contentWithDisabled}
        </RestrictedFeatureProvider>
      );
    }

    return content;
  };

  // Update URL when sub-tab changes (URL is the single source of truth)
  const handleSubTabChange = (newSubTab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subTab', newSubTab);
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="space-y-6">
      <TooltipProvider>
        <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="w-full">
          <div className="overflow-x-auto w-full bg-muted rounded-md">
          <TabsList className="inline-flex w-full justify-between gap-2 p-1 bg-transparent xl:grid xl:grid-cols-4">
            {SUB_TAB_CONFIG.map((subTab) => {
              // While loading plan access, show tabs in a neutral/loading state
              if (isLoadingPlanAccess) {
                return (
                  <div
                    key={subTab.value}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground/50"
                  >
                    <span className="truncate opacity-50">{subTab.label}</span>
                  </div>
                );
              }

              const enabled = isSubTabEnabled(subTab.menuAccessKey);

              if (!enabled) {
                return (
                  <Tooltip key={subTab.value}>
                    <TooltipTrigger asChild>
                      <TabsTrigger value={subTab.value} className={cn("flex items-center gap-1.5", activeSubTab === subTab.value && "bg-background")}>
                        <Lock className="h-3 w-3 text-slate-500" />
                        <span>{subTab.label}</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                          {planName
                            ? lang('designRiskControls.lockedTab.withPlan').replace('{planName}', planName)
                            : lang('designRiskControls.lockedTab.generic')}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <TabsTrigger key={subTab.value} value={subTab.value}>
                  {subTab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          </div>

          <TabsContent value="user-needs" className="space-y-6">
            {renderSubTabContent('user-needs',
              <UserNeedsModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="system-requirements" className="space-y-6">
            {renderSubTabContent('system-requirements',
              <SystemRequirementsModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="software-requirements" className="space-y-6">
            {renderSubTabContent('software-requirements',
              <SoftwareRequirementsModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="hardware-requirements" className="space-y-6">
            {renderSubTabContent('hardware-requirements',
              <HardwareRequirementsModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    </div>
  );
}