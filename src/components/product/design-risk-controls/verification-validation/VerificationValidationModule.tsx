import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { VVPlanModule } from "./VVPlanModule";
import { TestCasesModule } from "./TestCasesModule";
import { TestExecutionModule } from "./TestExecutionModule";
import { DefectsModule } from "./DefectsModule";
import { VVReportsModule } from "./VVReportsModule";
import { AIAssuranceLabModule } from "../../ai-assurance-lab/AIAssuranceLabModule";
import { ValidationRationalePanel } from "@/components/qmsr/ValidationRationalePanel";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface VerificationValidationModuleProps {
  productId: string;
  companyId: string;
  initialSubTab?: string;
}

// Sub-tab configuration with menu access keys
const SUB_TAB_CONFIG = [
  {
    value: 'vv-plan',
    labelKey: 'verificationValidation.tabs.vvPlan',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_VV_PLAN,
  },
  {
    value: 'test-cases',
    labelKey: 'verificationValidation.tabs.testCases',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_VV_TEST_CASES,
  },
  {
    value: 'test-execution',
    labelKey: 'verificationValidation.tabs.testExecution',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_VV_TEST_EXECUTION,
  },
  {
    value: 'defects',
    labelKey: 'verificationValidation.tabs.defects',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_VV_DEFECTS,
  },
  {
    value: 'reports',
    labelKey: 'verificationValidation.tabs.reports',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_VV_REPORTS,
  },
  {
    value: 'ai-assurance',
    labelKey: 'verificationValidation.tabs.aiAssurance',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_VV_AI_ASSURANCE,
  },
  {
    value: 'qmsr-rationale',
    labelKey: 'verificationValidation.tabs.qmsrRationale',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_VV_PLAN, // Reuse VV Plan access for now
  },
];

export function VerificationValidationModule({ 
  productId, 
  companyId, 
  initialSubTab 
}: VerificationValidationModuleProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useTranslation();

  // Plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();

  // Derive activeSubTab directly from URL — single source of truth, no race conditions
  const validSubTabs = ['vv-plan', 'test-cases', 'test-execution', 'defects', 'reports', 'ai-assurance', 'qmsr-rationale'];
  const subTabFromUrl = searchParams.get('subTab');
  const activeSubTab = subTabFromUrl && validSubTabs.includes(subTabFromUrl) ? subTabFromUrl : initialSubTab || 'vv-plan';

  // Ensure subTab is always reflected in URL
  useEffect(() => {
    const currentSubTab = searchParams.get('subTab');
    if (currentSubTab !== activeSubTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('subTab', activeSubTab);
      setSearchParams(newParams, { replace: true });
    }
  }, [activeSubTab, searchParams, setSearchParams]);

  // Update URL when sub-tab changes (URL is the single source of truth)
  const handleSubTabChange = (newSubTab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subTab', newSubTab);
    setSearchParams(newParams, { replace: true });
  };

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

    const isFeatureEnabled = isSubTabEnabled(subTabConfig.menuAccessKey);
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
          featureName={lang(subTabConfig.labelKey)}
        >
          {isRestricted && <RestrictedPreviewBanner className="mt-4 !mb-0" />}
          {contentWithDisabled}
        </RestrictedFeatureProvider>
      );
    }

    return content;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">{lang('verificationValidation.title')}</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          {lang('verificationValidation.description')}
        </p>
      </div>

      <TooltipProvider>
        <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {SUB_TAB_CONFIG.map((subTab) => {
              // While loading plan access, show tabs in a neutral/loading state
              if (isLoadingPlanAccess) {
                return (
                  <div
                    key={subTab.value}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-muted-foreground/50"
                  >
                    <span className="truncate opacity-50">{lang(subTab.labelKey)}</span>
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
                        <span>{lang(subTab.labelKey)}</span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                          {planName
                            ? lang('verificationValidation.featureNotAvailable').replace('{planName}', planName)
                            : lang('verificationValidation.upgradePlan')}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <TabsTrigger key={subTab.value} value={subTab.value}>
                  {lang(subTab.labelKey)}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="vv-plan" className="space-y-6">
            {renderSubTabContent('vv-plan',
              <VVPlanModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="test-cases" className="space-y-6">
            {renderSubTabContent('test-cases',
              <TestCasesModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="test-execution" className="space-y-6">
            {renderSubTabContent('test-execution',
              <TestExecutionModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="defects" className="space-y-6">
            {renderSubTabContent('defects',
              <DefectsModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {renderSubTabContent('reports',
              <VVReportsModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="ai-assurance" className="space-y-6">
            {renderSubTabContent('ai-assurance',
              <AIAssuranceLabModule productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="qmsr-rationale" className="space-y-6">
            {renderSubTabContent('qmsr-rationale',
              <ValidationRationalePanel productId={productId} companyId={companyId} />
            )}
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    </div>
  );
}