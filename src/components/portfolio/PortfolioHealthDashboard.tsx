import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { PortfolioOverview } from "./PortfolioOverview";
import { ProjectDeepDive } from "./ProjectDeepDive";
import { QMSHealthView } from "./QMSHealthView";
import { AdvancedFinancialView } from "./AdvancedFinancialView";

interface PortfolioHealthDashboardProps {
  onSwitchView: () => void;
}

const VALID_TABS = ['portfolio', 'project-health', 'qms', 'financial'] as const;
type PortfolioTab = typeof VALID_TABS[number];

export function PortfolioHealthDashboard({ onSwitchView }: PortfolioHealthDashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useTranslation();

  // Get tab from URL or default to 'portfolio'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{lang('portfolioHealth.title')}</h1>
          <p className="text-muted-foreground">
            {lang('portfolioHealth.subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onSwitchView}
          className="gap-2"
        >
          {lang('portfolioHealth.option1')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="portfolio" className="text-sm">
            {lang('portfolioHealth.tabs.rdPortfolio')}
          </TabsTrigger>
          <TabsTrigger value="project-health" className="text-sm">
            Project Health
          </TabsTrigger>
          <TabsTrigger value="qms" className="text-sm">
            {lang('portfolioHealth.tabs.qmsOperational')}
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-sm">
            {lang('portfolioHealth.tabs.advancedFinancial')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="space-y-8">
            <PortfolioOverview />
          </div>
        </TabsContent>

        <TabsContent value="project-health" className="space-y-6">
          <ProjectDeepDive />
        </TabsContent>

        <TabsContent value="qms" className="space-y-6">
          <QMSHealthView />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <AdvancedFinancialView />
        </TabsContent>
      </Tabs>
    </div>
  );
}