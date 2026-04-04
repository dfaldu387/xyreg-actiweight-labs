
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { MarketNPVInputForm } from './MarketNPVInputForm';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';
import { getCurrencySymbol } from '@/utils/currencyUtils';
import { CumulativeNPVChart } from './CumulativeNPVChart';
import { MarketLaunchTimelineChart } from './MarketLaunchTimelineChart';
import { useMarketLaunchData } from '@/hooks/useMarketLaunchData';
import { MarketNPVResults } from './MarketNPVResults';
import { MarketNPVInputData, NPVPersistenceService } from '@/services/npvPersistenceService';
import { calculateMarketNPV, NPVCalculationResult } from '@/services/npvCalculationService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { useAutoSave } from '@/hooks/useAutoSave';
import { usePageExitProtection } from '@/hooks/usePageExitProtection';
import { DraftStorage } from '@/utils/draftStorage';
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator';
import { DraftRecoveryNotification } from '@/components/ui/draft-recovery-notification';
import { AffectedProductNPVService } from '@/services/affectedProductNPVService';
import { supabase } from '@/integrations/supabase/client';

import { useCannibalizationTracking } from '@/hooks/useCannibalizationTracking';

interface NPVAnalysisSectionProps {
  markets?: EnhancedProductMarket[];
  totalNPV?: number;
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  onMarketNPVChange?: (marketCode: string, npvData: any) => void;
  productId?: string;
  isLoading?: boolean;
  onSave?: (analysis: any) => void;
  companyId?: string;
}

// Define the type for auto-save data
interface NPVAutoSaveData {
  analysisName: string;
  currentCurrency: string;
  marketInputData: Record<string, MarketNPVInputData>;
  selectedMarkets: string[];
}

export function NPVAnalysisSection({
  markets = [],
  totalNPV = 0,
  selectedCurrency = 'USD',
  onCurrencyChange,
  onMarketNPVChange,
  productId,
  isLoading = false,
  onSave,
  companyId
}: NPVAnalysisSectionProps) {
  const [analysisName, setAnalysisName] = useState('Base Analysis');
  const [currentCurrency, setCurrentCurrency] = useState(selectedCurrency);
  const [selectedMarkets, setSelectedMarkets] = useState<EnhancedProductMarket[]>(
    markets?.filter((market: EnhancedProductMarket) => market.selected) || []
  );
  const [marketInputData, setMarketInputData] = useState<Record<string, MarketNPVInputData>>({});
  const [marketCalculations, setMarketCalculations] = useState<Record<string, NPVCalculationResult>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState('input');
  const [showDraftNotification, setShowDraftNotification] = useState(false);
  const [lastAutoSaveToDB, setLastAutoSaveToDB] = useState<Date | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; name: string }>>([]);

  // Add market launch data hook
  const marketLaunchData = useMarketLaunchData(markets);
  const npvService = new NPVPersistenceService();
  const affectedProductService = new AffectedProductNPVService();

  // Add cannibalization tracking
  useCannibalizationTracking({
    productId,
    marketInputData,
    enabled: !!productId
  });

  // Auto-save functionality
  const autoSaveData: NPVAutoSaveData = {
    analysisName,
    currentCurrency,
    marketInputData,
    selectedMarkets: selectedMarkets.map(m => m.code)
  };

  const validateAutoSaveData = useCallback((data: NPVAutoSaveData) => {
    // Only auto-save if we have some meaningful data
    return data.analysisName?.trim().length > 0 ||
      Object.keys(data.marketInputData).length > 0;
  }, []);

  // Updated auto-save function that always saves to database
  const handleAutoSave = useCallback(async (data: NPVAutoSaveData) => {
    if (!productId) return;

    // Always save to localStorage as backup
    DraftStorage.saveDraft(productId, 'npv_analysis', data);

    // Check if we should save to database
    // Now saving to DB every 15 seconds regardless of calculation status
    const shouldSaveToDb =
      !lastAutoSaveToDB ||
      (new Date().getTime() - lastAutoSaveToDB.getTime() > 15000);

    if (shouldSaveToDb) {
      try {
        await saveToDatabase();
        setLastAutoSaveToDB(new Date());
      } catch (error) {
        console.error("Auto-save to database failed:", error);
      }
    }
  }, [productId, lastAutoSaveToDB]);

  // Save to database function
  const saveToDatabase = async () => {
    if (!productId) return;

    try {
      // Calculate total portfolio NPV
      let totalPortfolioNPV = 0;
      Object.values(marketCalculations).forEach(calc => {
        totalPortfolioNPV += calc.npv;
      });

      // Save to database using NPVPersistenceService
      // Iterate through markets and save each calculation
      for (const market of selectedMarkets) {
        const inputData = marketInputData[market.code];
        const calculation = marketCalculations[market.code];

        if (inputData) {
          // Notice we're saving input data even if calculations don't exist yet
          // Create a placeholder calculation that matches the NPVCalculationResult type if none exists
          const calculationToSave = calculation || {
            npv: 0,
            irr: 0,
            paybackPeriod: 0,
            paybackPeriodMonths: -1,
            npvBreakEvenMonths: -1,
            breakEvenMonths: 0,
            averageAnnualProfitMargin: 0,
            totalRevenue: 0,
            totalCosts: 0,
            totalRndCosts: 0,
            totalCannibalizationLoss: 0,
            monthlyResults: [],
            cumulativeNPV: [],
            monthlyNetCashFlow: [],
            totalProjectedRevenue: 0,
            totalProjectedProfit: 0,
            marketName: market.name || market.code,
            currency: currentCurrency
          };

          await npvService.saveMarketCalculation(
            productId,
            market.code,
            inputData,
            calculationToSave
          );
        }
      }

      // Only clear draft data if we have calculations and it's a full save
      if (Object.keys(marketCalculations).length > 0) {
        DraftStorage.clearDraft(productId, 'npv_analysis');
      }

      return true;
    } catch (error) {
      console.error("Error saving to database:", error);
      return false;
    }
  };

  const { saveStatus, lastSaved, hasUnsavedChanges } = useAutoSave({
    data: autoSaveData,
    onSave: handleAutoSave,
    delay: 15000, // Reduced to 15 seconds (from 30 seconds)
    enabled: !!productId,
    validateData: validateAutoSaveData
  });

  // Page exit protection
  usePageExitProtection({
    hasUnsavedChanges,
    message: 'You have unsaved changes to your NPV analysis. Are you sure you want to leave?'
  });

  // Check for draft data on component mount
  useEffect(() => {
    if (productId && DraftStorage.hasDraft(productId, 'npv_analysis')) {
      setShowDraftNotification(true);
    }
  }, [productId]);

  const handleRestoreDraft = useCallback(() => {
    if (!productId) return;

    const draft = DraftStorage.loadDraft<NPVAutoSaveData>(productId, 'npv_analysis');
    if (draft) {
      setAnalysisName(draft.analysisName || 'Base Analysis');
      setCurrentCurrency(draft.currentCurrency || 'USD');
      setMarketInputData(draft.marketInputData || {});

      if (onCurrencyChange) {
        onCurrencyChange(draft.currentCurrency || 'USD');
      }

      toast.success("Your previously unsaved work has been restored");
    }
    setShowDraftNotification(false);
  }, [productId, onCurrencyChange]);

  const handleDismissDraft = useCallback(() => {
    if (productId) {
      DraftStorage.clearDraft(productId, 'npv_analysis');
    }
    setShowDraftNotification(false);
  }, [productId]);

  // Initialize default input values for each market
  useEffect(() => {
    if (selectedMarkets.length > 0) {
      const initialInputData: Record<string, MarketNPVInputData> = {};

      selectedMarkets.forEach(market => {
        const launchDate = market.launchDate ? new Date(market.launchDate) : new Date();
        initialInputData[market.code] = {
          marketLaunchDate: launchDate, // Fixed: This was missing in the original code
          forecastDuration: 60, // 5 years
          developmentPhaseMonths: 12, // 1 year development
          monthlySalesForecast: 100,
          annualSalesForecastChange: 5,
          initialUnitPrice: 1000,
          annualUnitPriceChange: 2,
          initialVariableCost: 400,
          annualVariableCostChange: 1.5,
          allocatedMonthlyFixedCosts: 15000,
          annualFixedCostChange: 2,
          rndWorkCosts: 150000,
          rndWorkCostsSpread: 12,
          rndMaterialMachineCosts: 100000,
          rndMaterialMachineSpread: 8,
          rndStartupProductionCosts: 75000,
          rndStartupProductionSpread: 6,
          rndPatentCosts: 25000,
          rndPatentSpread: 3,
          totalMarketingBudget: 50000,
          marketingSpreadMonths: 12,
          royaltyRate: 0,
          discountRate: 10,
          patentExpiry: new Date().getFullYear() + 16,
          postPatentDeclineRate: 30,
          cannibalizedRevenue: 0,
          affectedProducts: []
        };
      });

      setMarketInputData(initialInputData);
      console.log('Market input data initialized with launch dates:', initialInputData);
    }
  }, [selectedMarkets]);

  // Load saved analysis if product ID is provided
  useEffect(() => {
    if (productId) {
      loadNPVAnalysis(productId);
    }
  }, [productId]);

  const loadNPVAnalysis = async (productId: string) => {
    try {
      const analysis = await npvService.loadNPVAnalysis(productId);
      if (analysis) {
        setAnalysisName(analysis.selectedCurrency);
        setCurrentCurrency(analysis.selectedCurrency);
        if (onCurrencyChange) onCurrencyChange(analysis.selectedCurrency);
        setMarketInputData(analysis.marketInputData);
        setMarketCalculations(analysis.marketCalculations);

        // Clear any draft data since we loaded saved data
        DraftStorage.clearDraft(productId, 'npv_analysis');

        toast.success("Loaded existing NPV analysis data");
      }
    } catch (error) {
      console.error("Error loading NPV analysis:", error);
    }
  };

  const handleAnalysisNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnalysisName(e.target.value);
  };

  const handleCurrencyChange = (currency: string) => {
    setCurrentCurrency(currency);
    if (onCurrencyChange) {
      onCurrencyChange(currency);
    }
  };

  const handleMarketInputChange = (marketCode: string, data: MarketNPVInputData) => {
    console.log(`Market input change for ${marketCode}:`, data);
    setMarketInputData(prev => ({
      ...prev,
      [marketCode]: data,
    }));
  };

  // Enhanced calculateNPV function with proper cannibalization handling
  const calculateNPV = useCallback(async () => {
    setIsCalculating(true);
    try {
      const calculations: Record<string, NPVCalculationResult> = {};
      let totalPortfolioNPV = 0;
      const affectedProductService = new AffectedProductNPVService();

      for (const market of selectedMarkets) {
        const inputData = marketInputData[market.code];
        if (inputData) {
          // Convert MarketNPVInputData to format expected by calculateMarketNPV
          const revenue: number[] = [];
          const costs: number[] = [];
          const marketingCosts: number[] = [];

          // Generate monthly revenue and costs based on input parameters
          for (let month = 0; month < (inputData.forecastDuration || 60); month++) {
            const yearsElapsed = month / 12;

            // Calculate sales with growth
            const salesVolume = inputData.monthlySalesForecast *
              Math.pow(1 + (inputData.annualSalesForecastChange || 0) / 100, yearsElapsed);

            // Calculate price with changes
            const unitPrice = inputData.initialUnitPrice *
              Math.pow(1 + (inputData.annualUnitPriceChange || 0) / 100, yearsElapsed);

            // Calculate variable cost with changes
            const variableCost = inputData.initialVariableCost *
              Math.pow(1 + (inputData.annualVariableCostChange || 0) / 100, yearsElapsed);

            // Calculate fixed costs with changes
            const fixedCost = inputData.allocatedMonthlyFixedCosts *
              Math.pow(1 + (inputData.annualFixedCostChange || 0) / 100, yearsElapsed);

            // Calculate marketing costs (spread over specified months)
            let monthlyMarketingCost = 0;
            if (month < (inputData.marketingSpreadMonths || 12)) {
              monthlyMarketingCost = (inputData.totalMarketingBudget || 0) / (inputData.marketingSpreadMonths || 12);
            }

            // Monthly revenue and costs
            revenue.push(salesVolume * unitPrice);
            costs.push((salesVolume * variableCost) + fixedCost);
            marketingCosts.push(monthlyMarketingCost);
          }

          // Generate baseline revenue for affected products cannibalization calculation
          const affectedProductsBaselineRevenue: Record<string, number[]> = {};
          if (inputData.affectedProducts) {
            for (const affectedProduct of inputData.affectedProducts) {
              // Generate mock baseline revenue for each affected product
              // In real implementation, this would come from historical data or NPV analyses
              const baselineRevenue = new Array(revenue.length).fill(0).map((_, index) => {
                // Mock baseline: declining revenue pattern for existing products
                const monthlyBaseline = 50000 * Math.pow(0.98, index); // 2% monthly decline
                return monthlyBaseline;
              });
              affectedProductsBaselineRevenue[affectedProduct.productId] = baselineRevenue;

              // Create NPV analysis for affected product
              if (productId) {
                await affectedProductService.createAffectedProductNPVAnalysis(
                  productId,
                  affectedProduct,
                  market.code,
                  baselineRevenue[0], // Use first month as baseline
                  revenue.length
                );
              }
            }
          }

          const npvResult = calculateMarketNPV({
            revenue,
            costs: costs.map((cost, index) => cost + marketingCosts[index]), // Include marketing costs
            discountRate: inputData.discountRate || 10,
            years: (inputData.forecastDuration || 60) / 12,
            marketName: market.name || market.code,
            currency: currentCurrency,
            rndCosts: {
              workCosts: inputData.rndWorkCosts || 0,
              materialMachineCosts: inputData.rndMaterialMachineCosts || 0,
              startupProductionCosts: inputData.rndStartupProductionCosts || 0,
              patentCosts: inputData.rndPatentCosts || 0
            },
            rndTimingMonths: {
              workCostsSpread: inputData.rndWorkCostsSpread || 1,
              materialMachineSpread: inputData.rndMaterialMachineSpread || 1,
              startupProductionSpread: inputData.rndStartupProductionSpread || 1,
              patentSpread: inputData.rndPatentSpread || 1
            },
            developmentPhaseMonths: inputData.developmentPhaseMonths || 0,
            affectedProducts: inputData.affectedProducts || [],
            affectedProductsBaselineRevenue
          });

          calculations[market.code] = npvResult;
          totalPortfolioNPV += npvResult.npv;

          // Notify the parent component about the NPV change
          if (onMarketNPVChange) {
            onMarketNPVChange(market.code, npvResult);
          }
        }
      }

      setMarketCalculations(calculations);
      setCurrentTab('results');

      // Trigger an immediate save since calculation is complete
      await saveToDatabase();
      setLastAutoSaveToDB(new Date());

      toast.success(`NPV Calculation Complete. Total Portfolio NPV: ${getCurrencySymbol(currentCurrency)}${totalPortfolioNPV.toLocaleString()}`);
    } catch (error) {
      console.error("Error calculating NPV:", error);
      toast.error("An error occurred during NPV calculation");
    } finally {
      setIsCalculating(false);
    }
  }, [selectedMarkets, marketInputData, currentCurrency, onMarketNPVChange, productId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!productId) {
        toast.error("Product ID is required to save analysis");
        return;
      }

      const saveSuccessful = await saveToDatabase();

      if (saveSuccessful && onSave) {
        // Calculate total portfolio NPV
        let totalPortfolioNPV = 0;
        Object.values(marketCalculations).forEach(calc => {
          totalPortfolioNPV += calc.npv;
        });

        onSave({
          name: analysisName,
          currency: currentCurrency,
          markets: selectedMarkets,
          marketInputData,
          marketCalculations,
          totalPortfolioNPV
        });
      }

      toast.success("The NPV analysis has been saved successfully");
    } catch (error) {
      console.error("Error saving NPV analysis:", error);
      toast.error("An error occurred while saving the NPV analysis");
    } finally {
      setIsSaving(false);
    }
  };

  // Check if we should show the save button
  const shouldShowSaveButton = () => {
    // In the results tab, we always show save button for users to explicitly save their final work
    if (currentTab === 'results') return true;

    // In the input tab, only show save button if there are unsaved changes
    return hasUnsavedChanges;
  };

  // Load available products for cannibalization
  useEffect(() => {
    const loadAvailableProducts = async () => {
      if (!companyId || !productId) {
        console.log('[NPVAnalysisSection] Missing companyId or productId for loading products');
        return;
      }

      try {
        console.log(`[NPVAnalysisSection] Loading products for company: ${companyId}, excluding product: ${productId}`);

        const { data: products, error } = await supabase
          .from('products')
          .select('id, name')
          .eq('company_id', companyId)
          .eq('is_archived', false)
          .neq('id', productId); // Exclude current product

        if (error) {
          console.error('[NPVAnalysisSection] Error loading products:', error);
          toast.error('Failed to load available products for cannibalization analysis');
          return;
        }

        console.log(`[NPVAnalysisSection] Loaded ${products?.length || 0} products:`, products);
        setAvailableProducts(products || []);

        if (!products || products.length === 0) {
          console.log('[NPVAnalysisSection] No other products found in this company');
        }
      } catch (error) {
        console.error('[NPVAnalysisSection] Error loading available products:', error);
        toast.error('An error occurred while loading products');
      }
    };

    loadAvailableProducts();
  }, [companyId, productId]);

  return (
    <div className="space-y-4">
      {/* Debug component - only shows in development */}
      {/* <ProductSelectionDebug 
        companyId={companyId}
        productId={productId}
        availableProducts={0}
      /> */}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">NPV Analysis</CardTitle>
            <div className="flex items-center gap-4">
              <SaveStatusIndicator
                status={saveStatus}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
              />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {showDraftNotification && (
            <DraftRecoveryNotification
              onRestore={handleRestoreDraft}
              onDismiss={handleDismissDraft}
              draftAge={productId ? DraftStorage.getDraftAge(productId, 'npv_analysis') || undefined : undefined}
            />
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="analysis-name">Analysis Name</Label>
              <Input
                id="analysis-name"
                type="text"
                value={analysisName}
                onChange={handleAnalysisNameChange}
                placeholder="Base Analysis"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={currentCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">Input Data</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              {/* Market Launch Timeline - Input View */}
              {marketLaunchData.length > 0 && (
                <MarketLaunchTimelineChart
                  marketLaunches={marketLaunchData}
                  selectedCurrency={currentCurrency}
                  currencySymbol={getCurrencySymbol(currentCurrency)}
                  marketCalculations={marketCalculations}
                />
              )}

              {/* Market Input Forms */}
              {selectedMarkets.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Market Financial Inputs</h4>
                  {selectedMarkets.map((market) => (
                    <MarketNPVInputForm
                      key={market.code}
                      marketCode={market.code}
                      marketName={market.name || market.code}
                      inputData={marketInputData[market.code] || {
                        marketLaunchDate: new Date(), // Fixed: Added proper default date
                        forecastDuration: 60,
                        developmentPhaseMonths: 12,
                        monthlySalesForecast: 100,
                        annualSalesForecastChange: 5,
                        initialUnitPrice: 1000,
                        annualUnitPriceChange: 2,
                        initialVariableCost: 400,
                        annualVariableCostChange: 1.5,
                        allocatedMonthlyFixedCosts: 15000,
                        annualFixedCostChange: 2,
                        rndWorkCosts: 150000,
                        rndWorkCostsSpread: 12,
                        rndMaterialMachineCosts: 100000,
                        rndMaterialMachineSpread: 8,
                        rndStartupProductionCosts: 75000,
                        rndStartupProductionSpread: 6,
                        rndPatentCosts: 25000,
                        rndPatentSpread: 3,
                        totalMarketingBudget: 50000,
                        marketingSpreadMonths: 12,
                        royaltyRate: 0,
                        discountRate: 10,
                        cannibalizedRevenue: 0,
                        affectedProducts: []
                      } as MarketNPVInputData}
                      selectedCurrency={currentCurrency}
                      onInputChange={(data) => handleMarketInputChange(market.code, data)}
                      isLoading={isCalculating}
                      availableProducts={availableProducts}
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={calculateNPV}
                  disabled={isLoading || isCalculating}
                  className="flex-1"
                >
                  {isCalculating ? (
                    <>
                      Calculating <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    </>
                  ) : (
                    "Calculate NPV"
                  )}
                </Button>

                {shouldShowSaveButton() && (
                  <Button
                    onClick={handleSave}
                    disabled={isLoading || isSaving}
                    variant="outline"
                    className="flex gap-2"
                  >
                    {isSaving ? (
                      <>
                        Saving <Loader2 className="w-4 h-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save
                      </>
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {/* Results display for successful NPV calculation */}
              {Object.keys(marketCalculations).length > 0 ? (
                <>
                  {/* Market Launch Timeline with NPV overlay */}
                  <MarketLaunchTimelineChart
                    marketLaunches={marketLaunchData}
                    selectedCurrency={currentCurrency}
                    currencySymbol={getCurrencySymbol(currentCurrency)}
                    marketCalculations={marketCalculations}
                  />

                  {/* NPV Results per market */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Market NPV Results</h4>
                    <div className="grid gap-4">
                      {selectedMarkets.map((market) => (
                        marketCalculations[market.code] && (
                          <MarketNPVResults
                            key={market.code}
                            marketCode={market.code}
                            marketName={market.name || market.code}
                            result={marketCalculations[market.code]}
                            selectedCurrency={currentCurrency}
                            currencySymbol={getCurrencySymbol(currentCurrency)}
                          />
                        )
                      ))}
                    </div>
                  </div>

                  {/* Portfolio NPV Chart */}
                  <CumulativeNPVChart
                    marketCalculations={marketCalculations}
                    selectedCurrency={currentCurrency}
                    currencySymbol={getCurrencySymbol(currentCurrency)}
                  />

                  <Button onClick={handleSave} disabled={isLoading || isSaving} className="w-full flex gap-2">
                    {isSaving ? (
                      <>
                        Saving <Loader2 className="w-4 h-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Analysis
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No NPV calculations yet. Please enter input data and calculate NPV.</p>
                  <Button onClick={() => setCurrentTab('input')} variant="outline" className="mt-4">
                    Go to Input Data
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
