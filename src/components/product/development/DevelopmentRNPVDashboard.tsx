import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RNPVInputForm } from './RNPVInputForm';
import { RNPVTimelineChart } from './RNPVTimelineChart';
import { RNPVInputService, RNPVInputData } from '@/services/rnpvInputService';
import { DevelopmentRNPVService, DevelopmentRNPVInputs, DevelopmentRNPVResult } from '@/services/developmentRNPVService';
import { supabase } from '@/integrations/supabase/client';
import { Settings, BarChart3 } from 'lucide-react';

interface DevelopmentRNPVDashboardProps {
  productId: string;
  companyId: string;
}

export function DevelopmentRNPVDashboard({ productId, companyId }: DevelopmentRNPVDashboardProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);
  const [activeTab, setActiveTab] = useState('inputs');
  const [inputs, setInputs] = useState<RNPVInputData | null>(null);
  const [results, setResults] = useState<DevelopmentRNPVResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('[DevelopmentRNPVDashboard] Starting loadSavedInputs', { productId, user });
    loadSavedInputs();
  }, [productId, user]); // Add user to dependencies

  const loadSavedInputs = async () => {
    console.log('[DevelopmentRNPVDashboard] loadSavedInputs called');
    const savedInputs = await RNPVInputService.loadInputs(productId);
    console.log('[DevelopmentRNPVDashboard] savedInputs result:', savedInputs);
    if (savedInputs) {
      console.log('[DevelopmentRNPVDashboard] Using saved inputs');
      setInputs(savedInputs);
    } else if (user) {
      console.log('[DevelopmentRNPVDashboard] Creating default inputs with real budget data');
      // Use async version to load real development costs from milestones
      const defaultInputs = await RNPVInputService.getDefaultInputs(productId, companyId, user.id);
      setInputs(defaultInputs);
    } else {
      console.log('[DevelopmentRNPVDashboard] No user found, waiting...');
    }
  };

  const handleInputsChange = async (newInputs: RNPVInputData) => {
    setInputs(newInputs);
    await RNPVInputService.saveInputs(newInputs);
  };

  const handleRecalculate = async () => {
    if (!inputs) return;
    
    setIsLoading(true);
    try {
      // Convert RNPVInputData to DevelopmentRNPVInputs
      const developmentInputs: DevelopmentRNPVInputs = {
        productId: inputs.productId,
        productName: '', // Will be filled by service
        targetMarkets: inputs.targetMarkets,
        totalAddressableMarket: inputs.totalAddressableMarket,
        expectedMarketShare: inputs.expectedMarketShare,
        launchYear: inputs.launchYear,
        productLifespan: inputs.productLifespan,
        averageSellingPrice: inputs.averageSellingPrice,
        annualPriceChange: inputs.annualPriceChange,
        annualVolumeGrowth: inputs.annualVolumeGrowth,
        unitCost: inputs.unitCost,
        annualCostChange: inputs.annualCostChange,
        fixedCosts: inputs.fixedCosts,
        totalDevelopmentCosts: 0, // Will be calculated from phase budgets
        developmentTimelineMonths: 24, // Default
        discountRate: inputs.discountRate,
        taxRate: inputs.taxRate,
        // Risk assessment now based on milestone LoA instead of manual inputs
        marketRisk: 0, // Will be overridden by LoA calculation
        competitiveRisk: 0, // Will be overridden by LoA calculation
        technicalRisk: 0, // Will be overridden by LoA calculation
        regulatoryRisk: 0 // Will be overridden by LoA calculation
      };

      const milestones = await DevelopmentRNPVService.getMilestoneData(productId);
      const analysisResults = await DevelopmentRNPVService.calculateDevelopmentRNPV(developmentInputs, milestones);
      
      setResults(analysisResults);
      setActiveTab('results');
    } catch (error) {
      console.error('Error calculating rNPV:', error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log('[DevelopmentRNPVDashboard] Render state:', { inputs: !!inputs, user: !!user, activeTab, isLoading });

  if (!inputs) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div>Loading rNPV analysis...</div>
            <div className="text-xs text-muted-foreground mt-2">
              Debug: user={!!user}, productId={productId}, companyId={companyId}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inputs" className="gap-2">
            <Settings className="h-4 w-4" />
            Input Parameters
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analysis Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inputs">
          <RNPVInputForm
            productId={productId}
            companyId={companyId}
            initialInputs={inputs}
            onInputsChange={handleInputsChange}
            onRecalculate={handleRecalculate}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>rNPV Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${results.scenarios.likely.rnpv.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Most Likely rNPV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        ${results.portfolioSummary.expectedRNPV.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Expected rNPV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(results.milestoneImpact.totalLoA * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Technical LoA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(results.scenarios.likely.commercialRiskFactor * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Commercial LoA</div>
                    </div>
                  </div>
                  
                  {/* Risk Breakdown */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Risk Disaggregation</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Technical/Regulatory Risk: </span>
                        <span className="font-medium">{(results.milestoneImpact.totalLoA * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Commercial Success Risk: </span>
                        <span className="font-medium">{(results.scenarios.likely.commercialRiskFactor * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Combined Risk Adjustment: </span>
                        <span className="font-medium">{(results.scenarios.likely.finalRiskAdjustment * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Standard NPV: </span>
                        <span className="font-medium">${results.scenarios.likely.npv.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline Chart */}
                  <RNPVTimelineChart 
                    results={results} 
                    currency="USD"
                    currencySymbol="$"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Run the analysis to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}