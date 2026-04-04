import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PortfolioFinancialHealth } from "./PortfolioFinancialHealth";
import { ProjectHealthMetrics } from "./ProjectHealthMetrics";
import { OperationalHealthMetrics } from "./OperationalHealthMetrics";
import { OperationalEfficiencyDashboard } from "./operational-efficiency/OperationalEfficiencyDashboard";
import { Download, RefreshCw, Settings, Share } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

const VALID_TABS = ['portfolio', 'project-health', 'qms', 'financial'] as const;
type PortfolioTab = typeof VALID_TABS[number];

export function ExecutiveKPIDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { lang } = useTranslation();

  // Sync tab with URL for contextual help
  const urlTab = searchParams.get('portfolioTab') as PortfolioTab | null;
  const activeTab: PortfolioTab = urlTab && VALID_TABS.includes(urlTab) ? urlTab : 'portfolio';

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'portfolio') {
      newParams.delete('portfolioTab'); // Clean URL for default tab
    } else {
      newParams.set('portfolioTab', value);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
    toast.success(lang('companyDashboard.dashboardRefreshed'));
  };

  const handleExport = () => {
    toast.success(lang('companyDashboard.dashboardExported'));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(lang('companyDashboard.linkCopied'));
  };

  return (
    <div className="space-y-6">
      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="portfolio" className="text-sm">
            {lang('executiveKPI.portfolioFinancialHealth')}
          </TabsTrigger>
          <TabsTrigger value="project-health" className="text-sm">
            {lang('executiveKPI.projectHealthMetrics')}
          </TabsTrigger>
          <TabsTrigger value="qms" className="text-sm">
            {lang('executiveKPI.operationalHealth')}
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-sm">
            {lang('executiveKPI.operationalEfficiency')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <PortfolioFinancialHealth />
        </TabsContent>

        <TabsContent value="project-health" className="space-y-6">
          <ProjectHealthMetrics />
        </TabsContent>

        <TabsContent value="qms" className="space-y-6">
          <OperationalHealthMetrics />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <OperationalEfficiencyDashboard />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {lang('executiveKPI.dashboardLastUpdated')}: {new Date().toLocaleString()}
          </div>
          <div className="flex items-center gap-4">
            <span>{lang('executiveKPI.dataRefreshInterval')}</span>
            <span>•</span>
            <span>{lang('executiveKPI.allMetricsLeading')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}