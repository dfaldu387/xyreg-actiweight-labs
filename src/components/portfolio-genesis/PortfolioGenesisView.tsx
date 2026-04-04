import React, { useState } from 'react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { usePortfolioGenesisMetrics } from '@/hooks/usePortfolioGenesisMetrics';
import { GenesisPortfolioSummaryCards } from './GenesisPortfolioSummaryCards';
import { GenesisReadinessBarChart } from './GenesisReadinessBarChart';
import { GenesisCompletionHeatmap } from './GenesisCompletionHeatmap';
import { GenesisTableView } from './GenesisTableView';
import { GenesisInvestmentQuadrant } from './GenesisInvestmentQuadrant';
import { GenesisMarketBubbles } from './GenesisMarketBubbles';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Rocket, TrendingUp, ClipboardCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';

export function PortfolioGenesisView() {
  const { lang } = useTranslation();
  const companyId = useCompanyId();
  const { data, isLoading, error } = usePortfolioGenesisMetrics(companyId);
  const [viewMode, setViewMode] = useState<'investor' | 'operations'>('investor');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        {lang('portfolioGenesis.errorLoading')}
      </div>
    );
  }

  if (!data || data.totalDevices === 0) {
    return (
      <div className="text-center py-12">
        <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{lang('portfolioGenesis.noDevicesFound')}</h3>
        <p className="text-muted-foreground">{lang('portfolioGenesis.addDevicesHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GenesisPortfolioSummaryCards
        totalDevices={data.totalDevices}
        averageReadiness={data.averageReadiness}
        investorReadyCount={data.investorReadyCount}
        needsAttentionCount={data.needsAttentionCount}
      />

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'investor' | 'operations')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="investor" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {lang('portfolioGenesis.investorView')}
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            {lang('portfolioGenesis.operationsView')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investor" className="space-y-6 mt-6">
          {/* Investment-focused visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GenesisInvestmentQuadrant devices={data.devices} />
            <GenesisMarketBubbles devices={data.devices} />
          </div>
          
          <GenesisReadinessBarChart devices={data.devices} />
          <GenesisTableView devices={data.devices} />
        </TabsContent>

        <TabsContent value="operations" className="space-y-6 mt-6">
          {/* Operations-focused visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GenesisReadinessBarChart devices={data.devices} />
            <GenesisCompletionHeatmap
              devices={data.devices}
              checklistTotals={data.checklistTotals}
              totalDevices={data.totalDevices}
            />
          </div>
          
          <GenesisTableView devices={data.devices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
