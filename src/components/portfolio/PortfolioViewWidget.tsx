import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PieChart,
  BarChart3,
  LayoutGrid,
  Columns,
  Clock,
  List,
  Package2,
  Sparkles,
  Network,
  GitBranch,
  Lock
} from "lucide-react";
import { usePlanMenuAccess } from "@/hooks/usePlanMenuAccess";
import { PORTFOLIO_MENU_ACCESS } from "@/constants/menuAccessKeys";
import { useTranslation } from "@/hooks/useTranslation";

type ViewType = "sunburst" | "phases-chart" | "cards" | "phases" | "timeline" | "list" | "relationships" | "hierarchy-graph" | "bundles" | "genesis" | "selector";
type ChartType = "segments" | "phases";

interface PortfolioViewWidgetProps {
  currentView: ViewType;
  chartType: ChartType;
  onViewChange: (view: ViewType) => void;
  onChartTypeChange: (chartType: ChartType) => void;
  productCount?: number;
}

const viewWidgets = [
  {
    id: "genesis",
    view: "genesis" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.genesis.title",
    descriptionKey: "portfolioViewWidget.widgets.genesis.description",
    icon: Sparkles,
    color: "from-indigo-500 to-blue-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_GENESIS
  },
  {
    id: "sunburst",
    view: "sunburst" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.sunburst.title",
    descriptionKey: "portfolioViewWidget.widgets.sunburst.description",
    icon: PieChart,
    color: "from-blue-500 to-purple-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_SUNBURST
  },
  {
    id: "phases-chart",
    view: "phases-chart" as ViewType,
    chartType: "phases" as ChartType,
    titleKey: "portfolioViewWidget.widgets.phasesChart.title",
    descriptionKey: "portfolioViewWidget.widgets.phasesChart.description",
    icon: BarChart3,
    color: "from-green-500 to-blue-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_PHASES_CHART
  },
  {
    id: "cards",
    view: "cards" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.cards.title",
    descriptionKey: "portfolioViewWidget.widgets.cards.description",
    icon: LayoutGrid,
    color: "from-orange-500 to-red-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_CARDS
  },
  {
    id: "phases",
    view: "phases" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.phases.title",
    descriptionKey: "portfolioViewWidget.widgets.phases.description",
    icon: Columns,
    color: "from-purple-500 to-pink-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_PHASES
  },
  {
    id: "timeline",
    view: "timeline" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.timeline.title",
    descriptionKey: "portfolioViewWidget.widgets.timeline.description",
    icon: Clock,
    color: "from-teal-500 to-cyan-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_TIMELINE
  },
  {
    id: "list",
    view: "list" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.list.title",
    descriptionKey: "portfolioViewWidget.widgets.list.description",
    icon: List,
    color: "from-gray-500 to-slate-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_LIST
  },
  {
    id: "relationships",
    view: "relationships" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.relationships.title",
    descriptionKey: "portfolioViewWidget.widgets.relationships.description",
    icon: Network,
    color: "from-emerald-500 to-teal-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_RELATIONSHIPS
  },
  {
    id: "hierarchy-graph",
    view: "hierarchy-graph" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.hierarchyGraph.title",
    descriptionKey: "portfolioViewWidget.widgets.hierarchyGraph.description",
    icon: GitBranch,
    color: "from-rose-500 to-pink-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_HIERARCHY
  },
  {
    id: "bundles",
    view: "bundles" as ViewType,
    chartType: "segments" as ChartType,
    titleKey: "portfolioViewWidget.widgets.bundles.title",
    descriptionKey: "portfolioViewWidget.widgets.bundles.description",
    icon: Package2,
    color: "from-indigo-500 to-blue-600",
    menuAccessKey: PORTFOLIO_MENU_ACCESS.DEVICE_PORTFOLIO_BUNDLES
  },
];

export function PortfolioViewWidget({
  currentView,
  chartType,
  onViewChange,
  onChartTypeChange,
  productCount
}: PortfolioViewWidgetProps) {
  const { lang } = useTranslation();
  const currentWidgetId = currentView;

  // Get plan-based menu access
  const { isMenuAccessKeyEnabled, planName, isLoading: isLoadingPlanAccess } = usePlanMenuAccess();

  // Check if a view is enabled based on plan's menu_access
  const isViewEnabled = (menuAccessKey: string): boolean => {
    return isMenuAccessKeyEnabled(menuAccessKey);
  };

  const handleWidgetSelect = (widget: typeof viewWidgets[0]) => {
    // Don't allow selection of disabled views
    if (!isViewEnabled(widget.menuAccessKey)) {
      return;
    }
    if (widget.chartType) {
      onChartTypeChange(widget.chartType);
    }
    onViewChange(widget.view);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{lang('portfolioViewWidget.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {lang('portfolioViewWidget.description')}
                  {productCount && ` (${productCount} ${lang('portfolioViewWidget.device')})`}
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>

            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {viewWidgets.map((widget) => {
                  const Icon = widget.icon;
                  const isSelected = currentWidgetId === widget.id;

                  // Show loading state while checking access
                  if (isLoadingPlanAccess) {
                    return (
                      <div
                        key={widget.id}
                        className="h-auto p-4 border rounded-md opacity-50"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="p-2 rounded-lg bg-slate-200 animate-pulse">
                            <div className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2 animate-pulse" />
                            <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const enabled = isViewEnabled(widget.menuAccessKey);

                  // Disabled view button with tooltip
                  if (!enabled) {
                    return (
                      <Tooltip key={widget.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-auto p-4 border rounded-md cursor-not-allowed bg-slate-50/50 relative"
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div className="p-2 rounded-lg bg-slate-200 text-slate-400">
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium block text-slate-400">{lang(widget.titleKey)}</span>
                                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  {lang(widget.descriptionKey)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="flex items-start gap-2">
                            <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">
                              {planName
                                ? lang('portfolioViewWidget.notAvailableOnPlan', { planName })
                                : lang('portfolioViewWidget.upgradePlan')}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  // Enabled view button
                  return (
                    <Button
                      key={widget.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-4 justify-start relative overflow-hidden group ${
                        isSelected ? '' : 'hover:shadow-md'
                      }`}
                      onClick={() => handleWidgetSelect(widget)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${widget.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 text-left">
                          <span className="font-medium block">{lang(widget.titleKey)}</span>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {lang(widget.descriptionKey)}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }