import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Target,
  DollarSign,
  Percent
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DevelopmentRNPVService, DevelopmentRNPVInputs, DevelopmentRNPVResult } from '@/services/developmentRNPVService';

interface DevelopmentRNPVDashboardProps {
  productId: string;
  productName: string;
  companyId: string;
}

export function DevelopmentRNPVDashboard({ 
  productId, 
  productName,
  companyId 
}: DevelopmentRNPVDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<DevelopmentRNPVResult | null>(null);
  const [inputs, setInputs] = useState<DevelopmentRNPVInputs | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<'best' | 'likely' | 'worst'>('likely');

  useEffect(() => {
    loadRNPVAnalysis();
  }, [productId]);

  const loadRNPVAnalysis = async () => {
    try {
      setLoading(true);
      
      // Get milestone data with LoA
      const milestones = await DevelopmentRNPVService.getMilestoneData(productId);
      
      // Create default inputs (in real app, these would be loaded from user settings)
      const defaultInputs: DevelopmentRNPVInputs = {
        productId,
        productName,
        targetMarkets: ['US', 'EU'],
        totalAddressableMarket: 500000, // 500k potential customers
        expectedMarketShare: 0.05, // 5%
        launchYear: new Date().getFullYear() + 2,
        productLifespan: 8,
        averageSellingPrice: 25000,
        annualPriceChange: 2.5,
        annualVolumeGrowth: 12,
        unitCost: 15000,
        annualCostChange: 3.0,
        fixedCosts: 2000000, // $2M annual fixed costs
        totalDevelopmentCosts: milestones.reduce((sum, m) => sum + (m.estimated_budget || 0), 0) || 15000000,
        developmentTimelineMonths: 36,
        discountRate: 12, // Financial risk - separate from LoA
        taxRate: 25,
        marketRisk: 15,
        competitiveRisk: 20,
        technicalRisk: 10,
        regulatoryRisk: 25
      };

      setInputs(defaultInputs);
      
      // Calculate rNPV with milestone LoA integration
      const rnpvResults = await DevelopmentRNPVService.calculateDevelopmentRNPV(defaultInputs, milestones);
      setResults(rnpvResults);
      
    } catch (error) {
      console.error('Error loading rNPV analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading rNPV analysis...</p>
        </div>
      </div>
    );
  }

  if (!results || !inputs) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load rNPV analysis. Please ensure milestone data is available.
        </AlertDescription>
      </Alert>
    );
  }

  const scenarioResult = results.scenarios[selectedScenario];

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Expected rNPV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(results.portfolioSummary.expectedRNPV)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Probability-weighted average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Combined LoA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(results.milestoneImpact.totalLoA)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {results.milestoneImpact.criticalPath.length} critical milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payback Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scenarioResult.paybackPeriod > 0 ? `${scenarioResult.paybackPeriod}mo` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedScenario} case scenario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${scenarioResult.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scenarioResult.roi.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Risk-adjusted return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Insight Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <CheckCircle2 className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Development Product Analysis</strong><br />
          This analysis separates <strong>Discount Rate</strong> (financial/market risk: {inputs.discountRate}%) from <strong>Likelihood of Success</strong> (technical/regulatory risk: {formatPercent(results.milestoneImpact.totalLoA)}). 
          rNPV = NPV × LoS, ensuring proper risk accounting for development-stage products.
        </AlertDescription>
      </Alert>

      {/* Scenario Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Scenario Analysis
          </CardTitle>
          <CardDescription>
            Monte Carlo simulation with milestone-based risk assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedScenario} onValueChange={(value) => setSelectedScenario(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="best" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Best Case
              </TabsTrigger>
              <TabsTrigger value="likely" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Most Likely
              </TabsTrigger>
              <TabsTrigger value="worst" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Worst Case
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedScenario} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">NPV (Before LoA)</div>
                  <div className="text-xl font-bold">{formatCurrency(scenarioResult.npv)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">rNPV (After LoA)</div>
                  <div className={`text-xl font-bold ${scenarioResult.rnpv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(scenarioResult.rnpv)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Risk Impact</div>
                  <div className="text-xl font-bold text-amber-600">
                    {formatCurrency(scenarioResult.npv - scenarioResult.rnpv)}
                  </div>
                </div>
              </div>

              {/* Cash Flow Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scenarioResult.monthlyProjections.slice(0, 60)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month"
                      tickFormatter={(value) => `M${value}`}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'cumulativeCashFlow' ? 'Cumulative Cash Flow' : 'Net Cash Flow'
                      ]}
                      labelFormatter={(value) => `Month ${value}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeCashFlow"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Critical Milestones & Risk Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Path Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Critical Path Milestones
            </CardTitle>
            <CardDescription>
              Phases with highest risk impact on project success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.milestoneImpact.criticalPath.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{milestone.phaseName}</div>
                    <div className="text-sm text-muted-foreground">
                      Position {milestone.position} • {milestone.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={milestone.likelihood_of_success < 70 ? "destructive" : 
                              milestone.likelihood_of_success < 85 ? "secondary" : "default"}
                    >
                      {milestone.likelihood_of_success}% LoS
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sensitivity Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Sensitivity Analysis
            </CardTitle>
            <CardDescription>
              rNPV impact from 10% parameter changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.sensitivityAnalysis.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{item.parameter}</div>
                  <div className="text-right">
                    <div className={`font-bold ${item.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.impact > 0 ? '+' : ''}{formatCurrency(item.impact)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Interval */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Risk-Adjusted Portfolio Summary
          </CardTitle>
          <CardDescription>
            90% confidence interval based on scenario probabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm font-medium text-red-800 mb-2">Downside Risk</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(results.portfolioSummary.confidenceInterval.lower)}
              </div>
              <div className="text-xs text-red-600 mt-1">5th percentile</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-2">Expected Value</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(results.portfolioSummary.expectedRNPV)}
              </div>
              <div className="text-xs text-blue-600 mt-1">Probability-weighted</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-800 mb-2">Upside Potential</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(results.portfolioSummary.confidenceInterval.upper)}
              </div>
              <div className="text-xs text-green-600 mt-1">95th percentile</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Key Insights:</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Standard deviation: {formatCurrency(results.portfolioSummary.standardDeviation)}</li>
              <li>• Combined milestone LoS: {formatPercent(results.milestoneImpact.totalLoA)}</li>
              <li>• Critical milestones identified: {results.milestoneImpact.criticalPath.length}</li>
              <li>• Development timeline: {inputs.developmentTimelineMonths} months</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}