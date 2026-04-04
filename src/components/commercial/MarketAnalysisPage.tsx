import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketIntelligenceDashboard } from '@/components/market-intelligence/MarketIntelligenceDashboard';
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { useTranslation } from '@/hooks/useTranslation';

interface MarketAnalysisPageProps {
  companyId: string;
}

export function MarketAnalysisPage({ companyId }: MarketAnalysisPageProps) {
  const { lang } = useTranslation();
  // Restriction check - double security pattern
  const { isRestricted: contextRestricted } = useRestrictedFeature();
  const { isMenuAccessKeyEnabled } = usePlanMenuAccess();
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_MARKET_ANALYSIS);
  const isRestricted = contextRestricted || !isFeatureEnabled;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="portfolio-analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio-analysis">{lang('marketAnalysis.tabs.portfolioAnalysis')}</TabsTrigger>
          <TabsTrigger value="market-intelligence">{lang('marketAnalysis.tabs.marketIntelligence')}</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio-analysis" className="space-y-6">
          <div className="bg-muted/50 border rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">{lang('marketAnalysis.portfolioAnalysis.title')}</h3>
            <p className="text-muted-foreground">
              {lang('marketAnalysis.portfolioAnalysis.description')}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="market-intelligence" className="space-y-6">
          <MarketIntelligenceDashboard companyId={companyId} disabled={isRestricted} />
        </TabsContent>
      </Tabs>
    </div>
  );
}