import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { TraceabilityMatrix } from "./TraceabilityMatrix";
import { TraceabilityVisualizer } from "./visualizer/TraceabilityVisualizer";
import { TraceabilityGapsAnalysis } from "./TraceabilityGapsAnalysis";
import { ImpactAnalysis } from "./ImpactAnalysis";
import { TraceabilitySettings } from "./TraceabilitySettings";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { DEVICES_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { RestrictedFeatureProvider } from "@/contexts/RestrictedFeatureContext";
import { RestrictedPreviewBanner } from "@/components/subscription/RestrictedPreviewBanner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface TraceabilityModuleProps {
  productId: string;
  companyId: string;
  initialSubTab?: string;
}

// Sub-tab configuration with menu access keys
const SUB_TAB_CONFIG = [
  {
    value: 'matrix',
    labelKey: 'traceability.tabs.matrix',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_MATRIX,
  },
  {
    value: 'visual',
    labelKey: 'traceability.tabs.visual',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_MATRIX, // Same access as matrix
  },
  {
    value: 'gaps',
    labelKey: 'traceability.tabs.gapAnalysis',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_GAPS,
  },
  {
    value: 'impact',
    labelKey: 'traceability.tabs.impactAnalysis',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_IMPACT,
  },
  {
    value: 'settings',
    labelKey: 'traceability.tabs.settings',
    menuAccessKey: DEVICES_MENU_ACCESS.DESIGN_RISK_TRACEABILITY_SETTINGS,
  },
];

export function TraceabilityModule({ 
  productId, 
  companyId, 
  initialSubTab 
}: TraceabilityModuleProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useTranslation();

  // Plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();

  // Get initial subTab from URL or prop, default to matrix
  const getInitialSubTab = () => {
    const subTabFromUrl = searchParams.get('subTab');
    const validSubTabs = ['matrix', 'visual', 'gaps', 'impact', 'settings'];
    if (subTabFromUrl && validSubTabs.includes(subTabFromUrl)) {
      return subTabFromUrl;
    }
    return initialSubTab || "matrix";
  };

  const [activeSubTab, setActiveSubTab] = useState(getInitialSubTab);

  // Ensure subTab is in URL (default to matrix if missing)
  useEffect(() => {
    const subTabFromUrl = searchParams.get('subTab');
    const validSubTabs = ['matrix', 'visual', 'gaps', 'impact', 'settings'];
    
    if (!subTabFromUrl || !validSubTabs.includes(subTabFromUrl)) {
      // No subTab in URL or invalid subTab, add default to URL
      const newParams = new URLSearchParams(searchParams);
      newParams.set('subTab', 'matrix');
      setSearchParams(newParams, { replace: true });
    } else if (subTabFromUrl !== activeSubTab) {
      // URL has valid subTab but state is different, sync state
      setActiveSubTab(subTabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when sub-tab changes
  const handleSubTabChange = (newSubTab: string) => {
    setActiveSubTab(newSubTab);
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
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{lang('traceability.title')}</h2>
        <p className="text-muted-foreground mt-1">
          {lang('traceability.description')}
        </p>
      </div>

      <TooltipProvider>
        <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
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
                            ? lang('traceability.featureNotAvailable').replace('{planName}', planName)
                            : lang('traceability.upgradePlan')}
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

          <TabsContent value="matrix" className="space-y-6">
            {renderSubTabContent('matrix',
              <TraceabilityMatrix productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="visual" className="space-y-6">
            {renderSubTabContent('visual',
              <TraceabilityVisualizer productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="gaps" className="space-y-6">
            {renderSubTabContent('gaps',
              <TraceabilityGapsAnalysis productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="impact" className="space-y-6">
            {renderSubTabContent('impact',
              <ImpactAnalysis productId={productId} companyId={companyId} />
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {renderSubTabContent('settings',
              <TraceabilitySettings productId={productId} companyId={companyId} />
            )}
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    </div>
  );
}