import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "./KPICard";
import { InteractiveFilter } from "./InteractiveFilter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { DollarSign, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Mock data - replace with real data integration
const mockRNPVData = [
  { month: "Jan 24", value: 42000000, baseline: 40000000 },
  { month: "Feb 24", value: 44500000, baseline: 40500000 },
  { month: "Mar 24", value: 43200000, baseline: 41000000 },
  { month: "Apr 24", value: 45800000, baseline: 41500000 },
  { month: "May 24", value: 47200000, baseline: 42000000 },
  { month: "Jun 24", value: 46100000, baseline: 42500000 },
  { month: "Jul 24", value: 48900000, baseline: 43000000 },
  { month: "Aug 24", value: 52400000, baseline: 43500000 },
];

// Filter options factory - uses lang function for translations
const getFilterOptions = (lang: (key: string) => string) => ({
  categories: [
    { id: "1", label: lang('executiveKPI.filters.categories.diagnostics'), value: "diagnostics" },
    { id: "2", label: lang('executiveKPI.filters.categories.surgicalTools'), value: "surgical" },
    { id: "3", label: lang('executiveKPI.filters.categories.monitoring'), value: "monitoring" },
  ],
  platforms: [
    { id: "1", label: lang('executiveKPI.filters.platforms.alpha'), value: "alpha" },
    { id: "2", label: lang('executiveKPI.filters.platforms.beta'), value: "beta" },
    { id: "3", label: lang('executiveKPI.filters.platforms.legacy'), value: "legacy" },
  ],
  modules: [
    { id: "1", label: lang('executiveKPI.filters.modules.softwareA'), value: "sw-a" },
    { id: "2", label: lang('executiveKPI.filters.modules.hardwareB'), value: "hw-b" },
    { id: "3", label: lang('executiveKPI.filters.modules.aiEnhancement'), value: "ai-enh" },
  ],
  phases: [
    { id: "1", label: lang('executiveKPI.filters.phases.vv'), value: "vv" },
    { id: "2", label: lang('executiveKPI.filters.phases.designTransfer'), value: "dt" },
    { id: "3", label: lang('executiveKPI.filters.phases.marketAuthorization'), value: "ma" },
  ],
});

export function PortfolioFinancialHealth() {
  const { lang } = useTranslation();
  const filterOptions = getFilterOptions(lang);
  const [selectedFilters, setSelectedFilters] = useState<{
    category?: string;
    platform?: string;
    module?: string;
    phase?: string;
  }>({});

  const handleFilterChange = (filterType: string, value: string | undefined) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters({});
  };

  // Calculate current metrics (mock calculations)
  const currentRNPV = 52400000;
  const riskAdjustment = -8200000;
  const portfolioRisk = 15.6;
  const totalProjects = 23;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lang('executiveKPI.portfolioFinancialHealth')}</h2>
        <div className="text-sm text-muted-foreground">
          {lang('executiveKPI.leadingIndicators')}
        </div>
      </div>

      {/* Interactive Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{lang('executiveKPI.portfolioAnalysisControls')}</CardTitle>
        </CardHeader>
        <CardContent>
          <InteractiveFilter
            categories={filterOptions.categories}
            platforms={filterOptions.platforms}
            modules={filterOptions.modules}
            phases={filterOptions.phases}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />
        </CardContent>
      </Card>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={lang('executiveKPI.riskAdjustedNPV')}
          value={`$${(currentRNPV / 1000000).toFixed(1)}M`}
          subtitle={lang('executiveKPI.currentPortfolioValue')}
          trend={{
            direction: "up",
            percentage: 12.4,
            label: lang('executiveKPI.vsLastQuarter')
          }}
          status="success"
          icon={<DollarSign className="h-4 w-4" />}
          tooltipContent={{
            formula: "rNPV = Σ[CF × Ptech × Preg × Pcomm] / (1 + r)^n",
            description: "Net present value adjusted for technical success probability (Ptech), regulatory approval probability (Preg), and commercial success probability (Pcomm)"
          }}
        />

        <KPICard
          title={lang('executiveKPI.riskAdjustment')}
          value={`$${(Math.abs(riskAdjustment) / 1000000).toFixed(1)}M`}
          subtitle={lang('executiveKPI.valueAtRisk')}
          trend={{
            direction: "down",
            percentage: -3.2,
            label: lang('executiveKPI.riskReduced')
          }}
          status="warning"
          icon={<AlertTriangle className="h-4 w-4" />}
          tooltipContent={{
            formula: "Risk Value = NPV × (1 - Success Probability)",
            description: "Total portfolio value at risk based on probability-weighted factors"
          }}
        />

        <KPICard
          title={lang('executiveKPI.portfolioRiskScore')}
          value={`${portfolioRisk}%`}
          subtitle={lang('executiveKPI.aggregateRiskLevel')}
          trend={{
            direction: "up",
            percentage: 2.1,
            label: lang('executiveKPI.monitoringClosely')
          }}
          status="warning"
          icon={<Target className="h-4 w-4" />}
          tooltipContent={{
            formula: "(Value at Risk / Total Value) × 100",
            description: "Percentage of portfolio value exposed to identified risks"
          }}
        />

        {/* Total Projects: Count of all non-archived projects (regardless of health status) */}
        <KPICard
          title={lang('executiveKPI.totalProjects')}
          value={totalProjects}
          subtitle={lang('executiveKPI.currentlyActive')}
          trend={{
            direction: "up",
            percentage: 4.5,
            label: lang('executiveKPI.newAdditions')
          }}
          status="success"
          icon={<TrendingUp className="h-4 w-4" />}
          tooltipContent={{
            formula: "Count of active (non-archived) projects",
            description: "Number of R&D projects currently in development pipeline"
          }}
        />
      </div>

      {/* rNPV Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('executiveKPI.riskAdjustedNPVTrendAnalysis')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('executiveKPI.trendDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRNPVData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  formatter={(value) => [`$${(Number(value) / 1000000).toFixed(1)}M`, "rNPV"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="baseline"
                  stackId="1"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted) / 0.3)"
                  name="Baseline NPV"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stackId="2"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.3)"
                  name="Risk-Adjusted NPV"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}