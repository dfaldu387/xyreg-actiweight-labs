import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InteractiveFilter } from "@/components/kpi/InteractiveFilter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Calculator, PieChart, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "@/hooks/useTranslation";

// Mock rNPV data
const mockRNPVData = [
  { month: "Jan 24", value: 42000000, baseline: 40000000, risk_adj: -2000000 },
  { month: "Feb 24", value: 44500000, baseline: 40500000, risk_adj: -4000000 },
  { month: "Mar 24", value: 43200000, baseline: 41000000, risk_adj: -2200000 },
  { month: "Apr 24", value: 45800000, baseline: 41500000, risk_adj: -4300000 },
  { month: "May 24", value: 47200000, baseline: 42000000, risk_adj: -5200000 },
  { month: "Jun 24", value: 46100000, baseline: 42500000, risk_adj: -3600000 },
  { month: "Jul 24", value: 48900000, baseline: 43000000, risk_adj: -5900000 },
  { month: "Aug 24", value: 52400000, baseline: 43500000, risk_adj: -8900000 },
];

const mockFilterOptions = {
  categories: [
    { id: "1", label: "Surgical Tools", value: "surgical" },
    { id: "2", label: "Diagnostics", value: "diagnostics" },
    { id: "3", label: "Monitoring Systems", value: "monitoring" },
  ],
  platforms: [
    { id: "1", label: "Alpha Platform", value: "alpha" },
    { id: "2", label: "Beta Platform", value: "beta" },
    { id: "3", label: "Gamma Platform", value: "gamma" },
  ],
  modules: [
    { id: "1", label: "AI Enhancement Module", value: "ai" },
    { id: "2", label: "Core Hardware V2", value: "hw-v2" },
    { id: "3", label: "Software Suite Pro", value: "sw-pro" },
  ],
  phases: [
    { id: "1", label: "V&V Phase", value: "vv" },
    { id: "2", label: "Design Transfer", value: "dt" },
    { id: "3", label: "Market Authorization", value: "ma" },
  ],
};

export function AdvancedFinancialView() {
  const { lang } = useTranslation();
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

  // Calculate current financial metrics
  const currentRNPV = mockRNPVData[mockRNPVData.length - 1].value;
  const riskAdjustment = mockRNPVData[mockRNPVData.length - 1].risk_adj;
  const totalPortfolioValue = currentRNPV + Math.abs(riskAdjustment);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{lang('portfolioHealth.financial.title')}</h2>
        <div className="text-sm text-muted-foreground">
          {lang('portfolioHealth.financial.subtitle')}
        </div>
      </div>

      {/* Financial Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">{lang('portfolioHealth.financial.currentRnpv')}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="top">
                      <div className="space-y-2">
                        <p className="text-xs font-mono bg-muted p-2 rounded">{lang('portfolioHealth.financial.rnpvFormula')}</p>
                        <p className="text-sm text-muted-foreground">{lang('portfolioHealth.financial.rnpvDescription')}</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-2xl font-bold text-success">
                  ${(currentRNPV / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">{lang('portfolioHealth.financial.riskAdjustment')}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="top">
                      <div className="space-y-2">
                        <p className="text-xs font-mono bg-muted p-2 rounded">{lang('portfolioHealth.financial.riskAdjFormula')}</p>
                        <p className="text-sm text-muted-foreground">{lang('portfolioHealth.financial.riskAdjDescription')}</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-2xl font-bold text-destructive">
                  ${(Math.abs(riskAdjustment) / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">{lang('portfolioHealth.financial.portfolioValue')}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="top">
                      <div className="space-y-2">
                        <p className="text-xs font-mono bg-muted p-2 rounded">{lang('portfolioHealth.financial.portfolioFormula')}</p>
                        <p className="text-sm text-muted-foreground">{lang('portfolioHealth.financial.portfolioDescription')}</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-2xl font-bold text-primary">
                  ${(totalPortfolioValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <Calculator className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">{lang('portfolioHealth.financial.riskRatio')}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="top">
                      <div className="space-y-2">
                        <p className="text-xs font-mono bg-muted p-2 rounded">{lang('portfolioHealth.financial.riskRatioFormula')}</p>
                        <p className="text-sm text-muted-foreground">{lang('portfolioHealth.financial.riskRatioDescription')}</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-2xl font-bold text-warning">
                  {((Math.abs(riskAdjustment) / totalPortfolioValue) * 100).toFixed(1)}%
                </p>
              </div>
              <PieChart className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Filtering */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('portfolioHealth.financial.analysisControls')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('portfolioHealth.financial.analysisControlsDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <InteractiveFilter
            categories={mockFilterOptions.categories}
            platforms={mockFilterOptions.platforms}
            modules={mockFilterOptions.modules}
            phases={mockFilterOptions.phases}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />
        </CardContent>
      </Card>

      {/* Interactive rNPV Graph */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('portfolioHealth.financial.interactiveRnpv')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('portfolioHealth.financial.interactiveRnpvDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockRNPVData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
                <Tooltip
                  formatter={(value, name) => [
                    `$${(Number(value) / 1000000).toFixed(1)}M`,
                    name === "value" ? lang('portfolioHealth.financial.chartRiskAdjNpv') :
                    name === "baseline" ? lang('portfolioHealth.financial.chartBaselineNpv') :
                    lang('portfolioHealth.financial.chartRiskAdj')
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="baseline"
                  stackId="1"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted) / 0.3)"
                  name="baseline"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stackId="2"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.3)"
                  name="value"
                />
                <Line
                  type="monotone"
                  dataKey="risk_adj"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="risk_adj"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Financial Scenario Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>{lang('portfolioHealth.financial.scenarioAnalysis')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {lang('portfolioHealth.financial.scenarioDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-success/5">
              <h4 className="font-medium text-success">{lang('portfolioHealth.financial.bestCase')}</h4>
              <p className="text-2xl font-bold text-success">${((currentRNPV * 1.15) / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-muted-foreground">{lang('portfolioHealth.financial.bestCaseDesc')}</p>
            </div>

            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium">{lang('portfolioHealth.financial.currentTrajectory')}</h4>
              <p className="text-2xl font-bold">${(currentRNPV / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-muted-foreground">{lang('portfolioHealth.financial.baselineProjection')}</p>
            </div>

            <div className="p-4 border rounded-lg bg-destructive/5">
              <h4 className="font-medium text-destructive">{lang('portfolioHealth.financial.worstCase')}</h4>
              <p className="text-2xl font-bold text-destructive">${((currentRNPV * 0.75) / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-muted-foreground">{lang('portfolioHealth.financial.worstCaseDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}