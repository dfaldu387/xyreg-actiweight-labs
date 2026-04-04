import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, DollarSign, BarChart3, PieChart, TrendingUp, Info, RotateCcw, CheckCircle2, AlertCircle, ChevronDown, ExternalLink, Calendar, LayoutGrid, List, Download, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format, addMonths } from 'date-fns';
import { HelpTooltip } from "@/components/product/device/sections/HelpTooltip";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { getMarketCurrency, formatCurrency } from "@/utils/marketCurrencyUtils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { MarketAnalysisForm, MarketSpecificInputs } from './MarketAnalysisForm';
import { MarketResultsView } from './MarketResultsView';
import { MarketDropdownSelector } from './MarketDropdownSelector';
import { PhaseFinancialTimeline } from './PhaseFinancialTimeline';
import { FinancialOverview } from './FinancialOverview';
import { RNPVEssentialView } from './RNPVEssentialView';
import { GenesisRNPVEssentials } from '@/components/product/business-case/GenesisRNPVEssentials';
import { InvestmentRealityCheck, calculateInvestmentMetrics } from './InvestmentRealityCheck';
import { ProductLifecycleCashFlowChart } from '@/components/investor-view/ProductLifecycleCashFlowChart';
import { ProjectCostDistributionPanel } from './cost-distribution/ProjectCostDistributionPanel';
import type { CostDistributionOutput, PhaseOption } from '@/types/costDistribution';
import { ValueEvolutionTab } from '@/components/value-evolution';
import { BudgetIntegrationService, calculateCumulativeLoS, PhaseBudgetData } from '@/services/enhanced-rnpv/budgetIntegrationService';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductLifecycle } from '@/hooks/useProductLifecycle';
import { NPVPersistenceService, MarketNPVInputData } from '@/services/npvPersistenceService';
import { RNPVExcelExportService } from '@/services/rnpvExcelExportService';
import { supabase } from '@/integrations/supabase/client';
import { DevelopmentPhase } from '@/services/enhanced-rnpv/interfaces';
import { ProductLink } from '@/components/product/ProductLink';
import { useTranslation } from '@/hooks/useTranslation';

interface RNPVAnalysisProps {
  markets?: EnhancedProductMarket[];
  productId?: string;
  bundleId?: string;
  isBundleMode?: boolean;
  onExportData?: (data: ExportData) => void;
  disabled?: boolean;
}

export interface ExportData {
  marketResults: Record<string, any>;
  marketInputs: Record<string, any>;
  portfolioResults: any;
  selectedMarkets: EnhancedProductMarket[];
}

interface AffectedProduct {
  id: string;
  name: string;
  currentRevenue: number;
  cannibalizationRate: number;
  selected: boolean;
}

const getDefaultInputsForMarket = (market: EnhancedProductMarket, productProjectedLaunchDate?: string | null): MarketSpecificInputs => {
  // Priority for launch date: 1) market-specific launchDate, 2) product's projected_launch_date, 3) null
  let launchDate: Date | null = null;
  
  if (market.launchDate) {
    launchDate = typeof market.launchDate === 'string' ? new Date(market.launchDate) : market.launchDate;
  } else if (productProjectedLaunchDate) {
    launchDate = new Date(productProjectedLaunchDate);
  }
  
  return {
    marketCode: market.code,
    marketName: market.name || market.code,
    
    // Revenue Model - require user input
    launchDate,
    patentExpiry: new Date().getFullYear() + 16,
    postPatentDeclineRate: 30,
    monthlySalesForecast: 0,
    initialUnitPrice: 0,
    annualSalesForecastChange: 0,
    annualUnitPriceChange: 0,
    
    // Cost Structure - require user input
    developmentCosts: 0,
    clinicalTrialCosts: 0,
    regulatoryCosts: 0,
    manufacturingCosts: 0,
    marketingCosts: 0,
    operationalCosts: 0,
    customerAcquisitionCost: 0,
    
    // Risk Assessment - require user input
    technicalRisk: 0,
    regulatoryRisk: 0,
    commercialRisk: 0,
    competitiveRisk: 0,
    
    // Financial Parameters - industry standard defaults
    discountRate: 10.0,
    taxRate: 25.0,
    projectLifetime: 15,
    
    // Cannibalization Impact - require user input
    cannibalizationRate: 0,
    affectedProductRevenue: 0
  };
};


export function RNPVAnalysis({ markets = [], productId, bundleId, isBundleMode = false, onExportData, disabled = false }: RNPVAnalysisProps) {
  const { data: product } = useProductDetails(productId);
  const { lifecycleInfo } = useProductLifecycle(productId || null);
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const persistenceService = new NPVPersistenceService();
  const [affectedProducts, setAffectedProducts] = useState<AffectedProduct[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentMarketTab, setCurrentMarketTab] = useState<string>('');
  const [activeGraphMarket, setActiveGraphMarket] = useState<string>('all');
  const [realTotalDevelopmentCosts, setRealTotalDevelopmentCosts] = useState<number>(0);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [usingRealBudgetData, setUsingRealBudgetData] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = (searchParams.get('view') === 'essential' ? 'essential' : 'full') as 'full' | 'essential';
  const setViewMode = (mode: 'full' | 'essential') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (mode === 'essential') {
        next.set('view', 'essential');
      } else {
        next.delete('view');
      }
      return next;
    }, { replace: true });
  };
  const [budgetSource, setBudgetSource] = useState<'milestones' | 'saved' | 'manual'>('manual');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  // Timeline View removed - Lifecycle View now includes Risk-Adjusted rNPV
  
  
  // Multi-Factor rNPV state for pre-launch products
  const [developmentPhases, setDevelopmentPhases] = useState<DevelopmentPhase[]>([]);
  const [cumulativeTechnicalLoA, setCumulativeTechnicalLoA] = useState<number>(100);
  const [phaseBudgetData, setPhaseBudgetData] = useState<PhaseBudgetData[]>([]);
  const [phasesInfo, setPhasesInfo] = useState<{
    completedCount: number;
    remainingCount: number;
    allCompleted: boolean;
  }>({ completedCount: 0, remainingCount: 0, allCompleted: true });
  
  // Market-specific inputs - initialize from selected markets
  const [marketInputs, setMarketInputs] = useState<Record<string, MarketSpecificInputs>>({});

  // Detect if user has manually overridden dev costs (differs from milestone data)
  const hasManualDevCostOverride = useMemo(() => {
    const targetMarket = currentMarketTab && currentMarketTab !== 'portfolio-summary' 
      ? currentMarketTab 
      : Object.keys(marketInputs)[0];
    
    if (!targetMarket || !marketInputs[targetMarket]) return false;
    
    const formDevCosts = marketInputs[targetMarket]?.developmentCosts || 0;
    // Manual override if form has a value AND it differs from milestone data
    return formDevCosts > 0 && realTotalDevelopmentCosts > 0 && Math.abs(formDevCosts - realTotalDevelopmentCosts) > 1;
  }, [marketInputs, currentMarketTab, realTotalDevelopmentCosts]);

  // Sync activeGraphMarket with currentMarketTab
  useEffect(() => {
    if (currentMarketTab && currentMarketTab !== 'portfolio-summary') {
      setActiveGraphMarket(currentMarketTab);
    } else if (currentMarketTab === 'portfolio-summary') {
      setActiveGraphMarket('all');
    }
  }, [currentMarketTab]);

  // Determine if this is a pre-launch product based on lifecycle info
  const isPreLaunch = useMemo(() => {
    if (!lifecycleInfo) return false;
    // Pre-launch if ready for rNPV analysis (not launched yet)
    return lifecycleInfo.isReadyForRNPVAnalysis === true;
  }, [lifecycleInfo]);

  // Load development phases for pre-launch products
  useEffect(() => {
    const loadDevelopmentPhases = async () => {
      if (!productId || !isPreLaunch) return;
      
      try {
        // console.log('[RNPVAnalysis] Loading development phases for pre-launch product');
        const phases = await BudgetIntegrationService.convertToRNPVDevelopmentPhases(productId);
        setDevelopmentPhases(phases);
        
        // Calculate cumulative technical LoS (multiply all phase LoS values)
        const cumLoS = phases.reduce((acc, phase) => acc * (phase.likelihoodOfSuccess / 100), 1) * 100;
        setCumulativeTechnicalLoA(cumLoS);
      } catch {
        // Failed to load development phases - will use defaults
      }
    };

    loadDevelopmentPhases();
  }, [productId, isPreLaunch]);

  // Load real budget data from milestones and calculate cumulative LoS
  useEffect(() => {
    const loadRealBudgets = async () => {
      if (!productId) return;
      
      try {
        setLoadingBudgets(true);
        
        // Get effective launch date for accurate cost calculations
        const effectiveLaunchDate = product?.actual_launch_date 
          ? new Date(product.actual_launch_date)
          : product?.projected_launch_date 
            ? new Date(product.projected_launch_date)
            : undefined;
        
        const budgetSummary = await BudgetIntegrationService.getProductPhaseBudgetSummary(productId, effectiveLaunchDate);
        
        // Store phase budget data for LoS calculation
        setPhaseBudgetData(budgetSummary.phaseBreakdown);
        
        // Calculate cumulative LoS with status-aware logic (completed phases = 100%)
        const losResult = calculateCumulativeLoS(budgetSummary.phaseBreakdown);
        setCumulativeTechnicalLoA(losResult.cumulativeLoS);
        setPhasesInfo({
          completedCount: losResult.completedCount,
          remainingCount: losResult.remainingCount,
          allCompleted: losResult.allCompleted
        });
        
        // Use totalBudget (all project costs) to match Genesis Essential behavior
        const totalBudgetAmount = budgetSummary.totalBudget;
        
        if (totalBudgetAmount > 0) {
          setRealTotalDevelopmentCosts(totalBudgetAmount);
          setUsingRealBudgetData(true);
          setBudgetSource('milestones');
        }
      } catch {
        setRealTotalDevelopmentCosts(0);
        setUsingRealBudgetData(false);
      } finally {
        setLoadingBudgets(false);
      }
    };

    loadRealBudgets();
    
    // Subscribe to budget changes for real-time updates
    if (productId) {
      const unsubscribe = BudgetIntegrationService.subscribeToBudgetChanges(productId, loadRealBudgets);
      
      return unsubscribe;
    }
  }, [productId, product?.actual_launch_date, product?.projected_launch_date]);

  // Explicit function to fetch development costs from budget (like Genesis Essential)
  const fetchDevCostsFromBudget = async () => {
    if (!productId) {
      toast.error('No product ID available');
      return;
    }
    
    try {
      setLoadingBudgets(true);
      
      const effectiveLaunchDate = product?.actual_launch_date 
        ? new Date(product.actual_launch_date)
        : product?.projected_launch_date 
          ? new Date(product.projected_launch_date)
          : undefined;
      
      const budgetSummary = await BudgetIntegrationService.getProductPhaseBudgetSummary(productId, effectiveLaunchDate);
      const devCosts = budgetSummary.totalBudget || 0;
      
      setRealTotalDevelopmentCosts(devCosts);
      setBudgetSource('milestones');
      setUsingRealBudgetData(true);
      
      // Update all market inputs with this value
      setMarketInputs(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(code => {
          updated[code] = { ...updated[code], developmentCosts: devCosts };
        });
        return updated;
      });
      
      if (devCosts > 0) {
        toast.success(`Loaded $${devCosts.toLocaleString()} from budget milestones`);
      } else {
        toast.info('No budget data found in milestones');
      }
    } catch {
      toast.error('Failed to fetch budget data');
    } finally {
      setLoadingBudgets(false);
    }
  };

  // Selected markets for calculations
  const selectedMarkets = useMemo(() => {
    return markets?.filter(market => market.selected) || [];
  }, [markets]);

  // Load saved NPV analysis on mount
  useEffect(() => {
    const loadSavedData = async () => {
      if (!productId) return;
      
      try {
        const persistenceService = new NPVPersistenceService();
        const savedAnalysis = await persistenceService.loadNPVAnalysis(productId);
        
        if (savedAnalysis && savedAnalysis.marketInputData) {
          // console.log('[RNPVAnalysis] Loaded saved analysis:', savedAnalysis);
          // Convert saved data back to MarketSpecificInputs format
          const loadedInputs: Record<string, MarketSpecificInputs> = {};
          
          Object.keys(savedAnalysis.marketInputData).forEach(marketCode => {
            const saved = savedAnalysis.marketInputData[marketCode];
            // console.log(`[RNPVAnalysis] ⚠️ LOADING market ${marketCode} - FULL SAVED DATA:`, {
            //   initialUnitPrice: saved.initialUnitPrice,
            //   initialVariableCost: saved.initialVariableCost,
            //   monthlySalesForecast: saved.monthlySalesForecast,
            //   rndWorkCosts: saved.rndWorkCosts,
            //   totalMarketingBudget: saved.totalMarketingBudget,
            //   ALL_SAVED_FIELDS: saved
            // });
            // Fallback to product's projected launch date if saved marketLaunchDate is null
            const effectiveLaunchDate = saved.marketLaunchDate 
              ? new Date(saved.marketLaunchDate)
              : product?.projected_launch_date 
                ? new Date(product.projected_launch_date)
                : product?.actual_launch_date
                  ? new Date(product.actual_launch_date)
                  : null;
            
            loadedInputs[marketCode] = {
              marketCode,
              marketName: marketCode,
              launchDate: effectiveLaunchDate,
              patentExpiry: saved.patentExpiry || (new Date().getFullYear() + 16),
              postPatentDeclineRate: saved.postPatentDeclineRate || 0,
              monthlySalesForecast: saved.monthlySalesForecast,
              initialUnitPrice: saved.initialUnitPrice,
              annualSalesForecastChange: saved.annualSalesForecastChange,
              annualUnitPriceChange: saved.annualUnitPriceChange,
              developmentCosts: saved.rndWorkCosts,
              clinicalTrialCosts: saved.rndMaterialMachineCosts,
              regulatoryCosts: saved.rndPatentCosts,
              manufacturingCosts: saved.initialVariableCost,
              marketingCosts: saved.totalMarketingBudget,
              operationalCosts: saved.operationalCosts || 0,
              customerAcquisitionCost: saved.customerAcquisitionCost || 0,
              technicalRisk: 15,
              regulatoryRisk: 20,
              commercialRisk: 25,
              competitiveRisk: 20,
              discountRate: saved.discountRate,
              taxRate: 21,
              projectLifetime: Math.floor(saved.forecastDuration / 12),
              cannibalizationRate: saved.cannibalizedRevenue,
              affectedProductRevenue: 0
            };
          });
          
          setMarketInputs(loadedInputs);
        }
      } catch (error) {
        console.error('[RNPVAnalysis] Error loading saved data:', error);
      }
    };
    
    loadSavedData();
  }, [productId]);

  // Load saved bundle rNPV data on mount (bundle mode only)
  useEffect(() => {
    if (!isBundleMode || selectedMarkets.length === 0) return;
    
    const loadBundleData = async () => {
      try {
        // console.log('[RNPVAnalysis] Loading saved bundle data for', selectedMarkets.length, 'products');
        const loadedInputs: Record<string, MarketSpecificInputs> = {};
        let loadedCount = 0;
        
        // Load each product's rNPV analysis individually
        for (const market of selectedMarkets) {
          const productIdToLoad = market.code; // In bundle mode, market.code is the product ID
          
          const savedData = await persistenceService.loadNPVAnalysis(productIdToLoad, 'Base Case');
          
          if (savedData && savedData.marketInputData && savedData.marketInputData['BUNDLE']) {
            const bundleMarketData = savedData.marketInputData['BUNDLE'];
            
            // console.log(`[RNPVAnalysis] Loaded data for product ${productIdToLoad}:`, bundleMarketData);
            
            // Fallback to product's projected launch date if saved marketLaunchDate is null
            const effectiveLaunchDate = bundleMarketData.marketLaunchDate 
              ? new Date(bundleMarketData.marketLaunchDate)
              : product?.projected_launch_date 
                ? new Date(product.projected_launch_date)
                : product?.actual_launch_date
                  ? new Date(product.actual_launch_date)
                  : null;
            
            // Convert MarketNPVInputData back to MarketSpecificInputs
            loadedInputs[market.code] = {
              marketCode: market.code,
              marketName: market.name || market.code,
              launchDate: effectiveLaunchDate,
              patentExpiry: bundleMarketData.patentExpiry || (new Date().getFullYear() + 16),
              postPatentDeclineRate: bundleMarketData.postPatentDeclineRate || 0,
              monthlySalesForecast: bundleMarketData.monthlySalesForecast,
              initialUnitPrice: bundleMarketData.initialUnitPrice,
              annualSalesForecastChange: bundleMarketData.annualSalesForecastChange,
              annualUnitPriceChange: bundleMarketData.annualUnitPriceChange,
              developmentCosts: bundleMarketData.rndWorkCosts,
              clinicalTrialCosts: bundleMarketData.rndMaterialMachineCosts,
              regulatoryCosts: bundleMarketData.rndPatentCosts,
              manufacturingCosts: bundleMarketData.initialVariableCost,
              marketingCosts: bundleMarketData.totalMarketingBudget,
              operationalCosts: bundleMarketData.operationalCosts || 0,
              customerAcquisitionCost: bundleMarketData.customerAcquisitionCost || 0,
              technicalRisk: 15, // Default values as these aren't stored
              regulatoryRisk: 20,
              commercialRisk: 25,
              competitiveRisk: 20,
              discountRate: bundleMarketData.discountRate,
              taxRate: 21,
              projectLifetime: Math.floor(bundleMarketData.forecastDuration / 12),
              cannibalizationRate: bundleMarketData.cannibalizedRevenue,
              affectedProductRevenue: 0
            };
            loadedCount++;
          }
        }
        
        if (loadedCount > 0) {
          setMarketInputs(loadedInputs);
          toast.success(`Loaded saved data for ${loadedCount} product${loadedCount > 1 ? 's' : ''}`);
        }
      } catch {
        toast.error('Failed to load saved bundle data');
      }
    };
    
    loadBundleData();
  }, [isBundleMode, selectedMarkets.length]);

  // Initialize market inputs when markets change
  React.useEffect(() => {
    if (selectedMarkets.length > 0) {
      const initialMarketInputs: Record<string, MarketSpecificInputs> = {};
      selectedMarkets.forEach(market => {
        if (!marketInputs[market.code]) {
          const defaults = getDefaultInputsForMarket(market, product?.projected_launch_date);
          // Use real development costs if available and zero out other cost components
          if (realTotalDevelopmentCosts > 0 && usingRealBudgetData) {
            defaults.developmentCosts = realTotalDevelopmentCosts;
            defaults.clinicalTrialCosts = 0;
            defaults.regulatoryCosts = 0;
            defaults.manufacturingCosts = 0;
            defaults.marketingCosts = 0;
            defaults.operationalCosts = 0;
          }
          initialMarketInputs[market.code] = defaults;
        } else {
          // Ensure new fields have default values for existing market data
          const existingInputs = marketInputs[market.code];
          const defaultInputs = getDefaultInputsForMarket(market, product?.projected_launch_date);
          initialMarketInputs[market.code] = {
            ...defaultInputs,
            ...existingInputs,
            // Update development costs with real data if available and zero out other costs
            developmentCosts: realTotalDevelopmentCosts > 0 && usingRealBudgetData ? realTotalDevelopmentCosts : existingInputs.developmentCosts,
            clinicalTrialCosts: usingRealBudgetData ? 0 : existingInputs.clinicalTrialCosts,
            regulatoryCosts: usingRealBudgetData ? 0 : existingInputs.regulatoryCosts,
            manufacturingCosts: usingRealBudgetData ? 0 : existingInputs.manufacturingCosts,
            marketingCosts: usingRealBudgetData ? 0 : existingInputs.marketingCosts,
            operationalCosts: usingRealBudgetData ? 0 : existingInputs.operationalCosts,
            // Explicitly ensure postPatentDeclineRate has a valid value
            postPatentDeclineRate: existingInputs.postPatentDeclineRate ?? defaultInputs.postPatentDeclineRate
          };
        }
      });
      setMarketInputs(initialMarketInputs);
      
      // Set current tab to first market if not set
      if (!currentMarketTab && selectedMarkets.length > 0) {
        setCurrentMarketTab(selectedMarkets[0].code);
        setActiveGraphMarket(selectedMarkets[0].code);
      }
    }
  }, [selectedMarkets, realTotalDevelopmentCosts, usingRealBudgetData, product?.projected_launch_date]);

  // Log launch date changes for lessons learned tracking
  const logLaunchDateChange = async (
    marketCode: string,
    oldDate: Date | null | undefined,
    newDate: Date | null
  ) => {
    if (!productId || !product?.company_id) return;
    
    // Only log if there's actually a change
    if (oldDate?.getTime() === newDate?.getTime()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('product_audit_logs').insert({
        product_id: productId,
        company_id: product.company_id,
        user_id: user?.id,
        action: 'UPDATE',
        entity_type: 'CONFIGURATION',
        entity_name: `Market Launch Date - ${marketCode}`,
        description: `Launch date changed for market ${marketCode}`,
        changes: {
          field: 'launch_date',
          market_code: marketCode,
          old_value: oldDate?.toISOString() || null,
          new_value: newDate?.toISOString() || null
        },
        metadata: {
          source: 'rnpv_analysis',
          change_type: 'launch_date_estimate'
        }
      });
    } catch {
      // Failed to log launch date change - non-critical
    }
  };

  const updateMarketInput = async (marketCode: string, field: keyof MarketSpecificInputs, value: number | Date | null) => {
    // Log launch date changes for audit trail
    if (field === 'launchDate') {
      const previousDate = marketInputs[marketCode]?.launchDate;
      await logLaunchDateChange(marketCode, previousDate, value as Date | null);
    }
    
    setMarketInputs(prev => ({
      ...prev,
      [marketCode]: {
        ...prev[marketCode],
        [field]: value
      }
    }));
  };

  const calculateMarketRNPV = (marketInputs: MarketSpecificInputs) => {
    // Calculate cannibalization impact
    const selectedAffectedProducts = affectedProducts.filter(p => p.selected);
    const totalCannibalizationLoss = selectedAffectedProducts.reduce((total, product) => {
      return total + (product.currentRevenue * product.cannibalizationRate / 100);
    }, 0);
    
    // Development phase calculations
    const totalDevelopmentCosts = marketInputs.developmentCosts + marketInputs.clinicalTrialCosts + marketInputs.regulatoryCosts;
    const totalOperationalCosts = marketInputs.manufacturingCosts + marketInputs.marketingCosts + marketInputs.operationalCosts;
    const developmentPhaseYears = 3; // 3 years before launch for development
    const developmentPhaseMonths = developmentPhaseYears * 12;
    
    const launchYear = marketInputs.launchDate ? marketInputs.launchDate.getFullYear() : new Date().getFullYear() + 1;
    
    // console.log(`[${marketInputs.marketCode}] Calculating rNPV with:`, {
    //   developmentCosts: marketInputs.developmentCosts,
    //   totalDevelopmentCosts,
    //   totalOperationalCosts,
    //   launchDate: marketInputs.launchDate,
    //   launchYear
    // });
    
    // Calculate annual revenues and generate time series data including development phase
    let totalRevenue = 0;
    let totalCosts = totalDevelopmentCosts;
    let totalCannibalizationImpact = 0;
    const monthlyResults = [];
    let cumulativeCashFlow = 0; // Start from zero, will become negative during development
    let cumulativeCosts = 0; // Track cumulative costs for the chart
    
    // Start timeline from development phase
    const startYear = launchYear - developmentPhaseYears;
    const totalProjectYears = developmentPhaseYears + marketInputs.projectLifetime;
    
    for (let year = 1; year <= totalProjectYears; year++) {
      const currentYear = startYear + year - 1;
      let yearlyRevenue = 0;
      let yearlyCannibalizationLoss = 0;
      let yearlyDevelopmentCosts = 0;
      let yearlyOperationalCosts = 0;
      
      // Development phase (before launch)
      if (currentYear < launchYear) {
        // Distribute development costs evenly during development phase
        yearlyDevelopmentCosts = totalDevelopmentCosts / developmentPhaseYears;
      } else {
        // Revenue phase (after launch) - Unit-based calculation
        const yearsFromLaunch = currentYear - launchYear;
        
        // Calculate units sold for this year (with annual growth)
        const currentYearUnits = marketInputs.monthlySalesForecast * 12 * Math.pow(1 + marketInputs.annualSalesForecastChange / 100, yearsFromLaunch);
        
        // Calculate unit price for this year (with annual price changes)
        const currentYearPrice = marketInputs.initialUnitPrice * Math.pow(1 + marketInputs.annualUnitPriceChange / 100, yearsFromLaunch);
        
        if (currentYear <= marketInputs.patentExpiry) {
          // Full revenue during patent protection
          yearlyRevenue = currentYearUnits * currentYearPrice;
        } else {
          // Post-patent decline using configurable decline rate
          const yearsAfterExpiry = currentYear - marketInputs.patentExpiry;
          const retentionRate = (100 - marketInputs.postPatentDeclineRate) / 100;
          yearlyRevenue = currentYearUnits * currentYearPrice * Math.pow(retentionRate, yearsAfterExpiry);
        }
        
        // Calculate cannibalization impact for this year (proportional to revenue)
        const firstYearMaxRevenue = marketInputs.monthlySalesForecast * 12 * marketInputs.initialUnitPrice;
        const revenueRealizationRate = firstYearMaxRevenue > 0 ? yearlyRevenue / firstYearMaxRevenue : 0;
        yearlyCannibalizationLoss = totalCannibalizationLoss * revenueRealizationRate;
        
        // Operational costs during revenue phase
        // CRITICAL: Manufacturing costs are PER UNIT, not lump sum!
        // Other costs (marketing, operational) are annual fixed costs
        const yearlyManufacturingCosts = currentYearUnits * marketInputs.manufacturingCosts; // Cost per unit × units
        const yearlyFixedCosts = marketInputs.marketingCosts + marketInputs.operationalCosts; // Annual fixed costs
        yearlyOperationalCosts = yearlyManufacturingCosts + yearlyFixedCosts;
        
        // console.log(`[${marketInputs.marketCode}] Year ${currentYear} costs:`, {
        //   units: currentYearUnits,
        //   unitManufacturingCost: marketInputs.manufacturingCosts,
        //   totalManufacturingCosts: yearlyManufacturingCosts,
        //   fixedCosts: yearlyFixedCosts,
        //   totalOperationalCosts: yearlyOperationalCosts
        // });
      }
      
      const netCashFlow = yearlyRevenue - yearlyOperationalCosts - yearlyDevelopmentCosts - yearlyCannibalizationLoss;
      const discountedCashFlow = netCashFlow / Math.pow(1 + marketInputs.discountRate / 100, year);
      const discountedCannibalizationLoss = yearlyCannibalizationLoss / Math.pow(1 + marketInputs.discountRate / 100, year);
      
      // Generate monthly data points for chart
      for (let month = 1; month <= 12; month++) {
        const monthlyRevenue = yearlyRevenue / 12;
        const monthlyCosts = yearlyOperationalCosts / 12;
        // Only include development costs during development phase (before launch year)
        const monthlyDevelopmentCosts = currentYear < launchYear ? yearlyDevelopmentCosts / 12 : 0;
        const monthlyTotalCosts = monthlyCosts + monthlyDevelopmentCosts;
        const monthlyNetCashFlow = (netCashFlow / 12);
        cumulativeCashFlow += monthlyNetCashFlow;
        cumulativeCosts -= monthlyDevelopmentCosts; // Subtract to show cash outflow (line goes down)
        
        const globalMonth = (year - 1) * 12 + month;
        
        // Debug log for first few months
        if (globalMonth <= 5) {
          // console.log(`[${marketInputs.marketCode}] Month ${globalMonth}:`, {
          //   monthlyTotalCosts,
          //   cumulativeCosts,
          //   monthlyDevelopmentCosts,
          //   phase: currentYear < launchYear ? 'development' : 'revenue'
          // });
        }
        
        monthlyResults.push({
          month: globalMonth,
          year: currentYear,
          revenue: monthlyRevenue,
          costs: monthlyTotalCosts,
          cumulativeCosts: cumulativeCosts, // Add cumulative costs to results
          developmentCosts: monthlyDevelopmentCosts,
          netCashFlow: monthlyNetCashFlow,
          cumulativeCashFlow: cumulativeCashFlow,
          cannibalizationLoss: yearlyCannibalizationLoss / 12,
          phase: currentYear < launchYear ? 'development' : 'revenue'
        });
        
        // Debug log first few entries
        if (globalMonth <= 3) {
          // console.log(`[${marketInputs.marketCode}] monthlyResults[${globalMonth}]:`, monthlyResults[monthlyResults.length - 1]);
        }
      }
      
      if (currentYear >= launchYear) {
        totalRevenue += discountedCashFlow;
        totalCannibalizationImpact += discountedCannibalizationLoss;
        if (year <= 5) totalCosts += yearlyOperationalCosts / Math.pow(1 + marketInputs.discountRate / 100, year);
      }
    }
    
    const npv = totalRevenue - totalCosts;
    
    // Apply risk adjustment
    const totalRisk = (marketInputs.technicalRisk + marketInputs.regulatoryRisk + marketInputs.commercialRisk + marketInputs.competitiveRisk) / 4;
    const riskMultiplier = (100 - totalRisk) / 100;
    const rnpv = npv * riskMultiplier;
    
    // Calculate risk-adjusted monthly results
    let cumulativeCashFlowRiskAdjusted = 0;
    const riskAdjustedMonthlyResults = monthlyResults.map(month => {
      // Apply risk multiplier to both revenue AND costs
      // This represents the probability-weighted cash flows
      const riskAdjustedRevenue = month.revenue * riskMultiplier;
      const riskAdjustedCosts = month.costs * riskMultiplier;
      
      // Risk-adjusted net cash flow = probability-weighted revenues minus probability-weighted costs
      const riskAdjustedNetCashFlow = riskAdjustedRevenue - riskAdjustedCosts;
      cumulativeCashFlowRiskAdjusted += riskAdjustedNetCashFlow;
      
      return {
        ...month,
        revenueRiskAdjusted: riskAdjustedRevenue,
        costsRiskAdjusted: riskAdjustedCosts,
        netCashFlowRiskAdjusted: riskAdjustedNetCashFlow,
        cumulativeCashFlowRiskAdjusted
      };
    });
    
    return {
      npv,
      rnpv,
      totalRevenue,
      totalCosts,
      riskAdjustment: totalRisk,
      roi: (rnpv / totalCosts) * 100,
      cannibalizationImpact: totalCannibalizationImpact,
      affectedProductsCount: selectedAffectedProducts.length,
      marketCode: marketInputs.marketCode,
      marketName: marketInputs.marketName,
      monthlyResults: riskAdjustedMonthlyResults
    };
  };

  // Calculate results for all markets
  const marketResults = useMemo(() => {
    if (Object.keys(marketInputs).length === 0) return {};
    
    const results: Record<string, any> = {};
    selectedMarkets.forEach(market => {
      if (marketInputs[market.code]) {
        try {
          results[market.code] = calculateMarketRNPV(marketInputs[market.code]);
        } catch {
          // Failed to calculate rNPV for this market - skip
        }
      }
    });
    return results;
  }, [marketInputs, selectedMarkets, affectedProducts]);

  // Overall portfolio results
  const portfolioResults = useMemo(() => {
    const results = Object.values(marketResults);
    if (results.length === 0) return { 
      rnpv: 0, 
      roi: 0, 
      totalCosts: 0, 
      totalRevenue: 0, 
      riskAdjustment: 0,
      cannibalizationImpact: 0,
      affectedProductsCount: 0,
      marketCount: 0
    };

    const validResults = results.filter(r => r && typeof r === 'object');
    if (validResults.length === 0) return { 
      rnpv: 0, 
      roi: 0, 
      totalCosts: 0, 
      totalRevenue: 0, 
      riskAdjustment: 0,
      cannibalizationImpact: 0,
      affectedProductsCount: 0,
      marketCount: 0
    };

    // If a specific market is selected, show only that market's KPIs
    if (activeGraphMarket && activeGraphMarket !== 'all') {
      const marketResult = marketResults[activeGraphMarket];
      if (marketResult) {
        const selectedMarket = selectedMarkets.find(m => m.code === activeGraphMarket);
        return {
          rnpv: marketResult.rnpv || 0,
          roi: marketResult.roi || 0,
          totalCosts: marketResult.totalCosts || 0,
          totalRevenue: marketResult.totalRevenue || 0,
          riskAdjustment: marketResult.riskAdjustment || 0,
          cannibalizationImpact: marketResult.cannibalizationImpact || 0,
          affectedProductsCount: marketResult.affectedProductsCount || 0,
          marketCount: 1,
          marketName: selectedMarket?.name || activeGraphMarket
        };
      }
    }

    // Otherwise show aggregated portfolio metrics
    const safeSum = (values: number[]) => values.filter(v => !isNaN(v) && isFinite(v)).reduce((sum, val) => sum + val, 0);
    const safeAverage = (values: number[]) => {
      const validValues = values.filter(v => !isNaN(v) && isFinite(v));
      return validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
    };

    return {
      rnpv: safeSum(validResults.map((r: any) => r.rnpv || 0)),
      roi: safeAverage(validResults.map((r: any) => r.roi || 0)),
      totalCosts: safeSum(validResults.map((r: any) => r.totalCosts || 0)),
      totalRevenue: safeSum(validResults.map((r: any) => r.totalRevenue || 0)),
      riskAdjustment: safeAverage(validResults.map((r: any) => r.riskAdjustment || 0)),
      cannibalizationImpact: safeSum(validResults.map((r: any) => r.cannibalizationImpact || 0)),
      affectedProductsCount: Math.max(...validResults.map((r: any) => r.affectedProductsCount || 0), 0),
      marketCount: validResults.length,
      marketName: ''
    };
  }, [marketResults, activeGraphMarket, selectedMarkets]);

  const results = portfolioResults;

  // Expose export data when onExportData callback is provided (for bundle mode)
  useEffect(() => {
    if (onExportData && Object.keys(marketResults).length > 0 && Object.keys(marketInputs).length > 0) {
      onExportData({
        marketResults,
        marketInputs,
        portfolioResults,
        selectedMarkets,
      });
    }
  }, [onExportData, marketResults, marketInputs, portfolioResults, selectedMarkets]);

  const handleResetAnalysis = async () => {
    if (!productId) {
      toast.error("No product ID available");
      return;
    }

    try {
      // Delete saved analysis from database
      const { error } = await supabase
        .from('product_npv_analyses')
        .delete()
        .eq('product_id', productId);
      
      if (error) throw error;
      
      // Reset local state to defaults
      setMarketInputs({});
      setAffectedProducts([]);
      toast.success('Analysis reset successfully');
      window.location.reload(); // Reload to clear all state
    } catch (error) {
      console.error('Error resetting analysis:', error);
      toast.error('Failed to reset analysis');
    }
  };

  const handleSave = async (showToast = true) => {
    // Bundle mode: save each product individually
    if (isBundleMode) {
      if (!bundleId) {
        toast.error("Cannot save: Bundle ID is missing");
        return;
      }

      setIsSaving(true);
      setSaveStatus('saving');
      try {
        let savedCount = 0;
        
        // Save each product's rNPV analysis individually
        for (const market of selectedMarkets) {
          const inputs = marketInputs[market.code];
          const result = marketResults[market.code];
          
          if (!inputs || !result) {
            console.warn(`Skipping ${market.name} - missing data`);
            continue;
          }

          // Use market.code as the product ID (in bundle mode, each "market" is actually a product)
          const productIdForSave = market.code;
          const marketCode = 'BUNDLE'; // All bundle products use 'BUNDLE' as the market
          
          // Convert MarketSpecificInputs to MarketNPVInputData format
          const inputDataForSave = {
            marketLaunchDate: inputs.launchDate,
            forecastDuration: inputs.projectLifetime * 12,
            developmentPhaseMonths: 36,
            monthlySalesForecast: inputs.monthlySalesForecast,
            annualSalesForecastChange: inputs.annualSalesForecastChange,
            initialUnitPrice: inputs.initialUnitPrice,
            annualUnitPriceChange: inputs.annualUnitPriceChange,
            initialVariableCost: inputs.manufacturingCosts,
            annualVariableCostChange: 0,
            allocatedMonthlyFixedCosts: 0,
            annualFixedCostChange: 0,
            rndWorkCosts: inputs.developmentCosts,
            rndWorkCostsSpread: 36,
            rndMaterialMachineCosts: inputs.clinicalTrialCosts,
            rndMaterialMachineSpread: 24,
            rndStartupProductionCosts: 0,
            rndStartupProductionSpread: 12,
            rndPatentCosts: inputs.regulatoryCosts,
            rndPatentSpread: 36,
            totalMarketingBudget: inputs.marketingCosts,
            marketingSpreadMonths: 24,
            royaltyRate: 0,
            discountRate: inputs.discountRate,
            patentExpiry: inputs.patentExpiry,
            postPatentDeclineRate: inputs.postPatentDeclineRate,
            cannibalizedRevenue: inputs.cannibalizationRate,
            affectedProducts: affectedProducts.filter(p => p.selected).map(p => ({
              id: p.id,
              productId: p.id,
              name: p.name,
              productName: p.name,
              currentRevenue: p.currentRevenue,
              cannibalizationRate: p.cannibalizationRate,
              monthsToReachRoof: 12,
              totalCannibalizationPercentage: p.cannibalizationRate,
              selected: true
            })),
            operationalCosts: inputs.operationalCosts,
            customerAcquisitionCost: inputs.customerAcquisitionCost,
          };

          const success = await persistenceService.saveMarketCalculation(
            productIdForSave,
            marketCode,
            inputDataForSave,
            result,
            'Base Case' // scenario name
          );

          if (success) {
            savedCount++;
          }
        }

        if (savedCount > 0) {
          setSaveStatus('saved');
          if (showToast) toast.success(`Bundle rNPV saved: ${savedCount} product${savedCount > 1 ? 's' : ''}`);
        } else {
          setSaveStatus('error');
          toast.error("No products were saved");
        }
      } catch (error) {
        console.error("Error saving bundle rNPV analysis:", error);
        setSaveStatus('error');
        toast.error("Failed to save bundle rNPV analysis");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Single product mode: save to product
    if (!productId) {
      toast.error("Cannot save: Product ID is missing");
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const persistenceService = new NPVPersistenceService();
      
      // Save each market's calculation
      for (const marketCode of Object.keys(marketInputs)) {
        const inputData = marketInputs[marketCode];
        const calculationResult = marketResults[marketCode];
        
        if (inputData && calculationResult) {
          // console.log(`[RNPVAnalysis] ⚠️ SAVING market ${marketCode} - FULL INPUT DATA:`, {
          //   initialUnitPrice: inputData.initialUnitPrice,
          //   manufacturingCosts: inputData.manufacturingCosts,
          //   monthlySalesForecast: inputData.monthlySalesForecast,
          //   developmentCosts: inputData.developmentCosts,
          //   clinicalTrialCosts: inputData.clinicalTrialCosts,
          //   regulatoryCosts: inputData.regulatoryCosts,
          //   marketingCosts: inputData.marketingCosts,
          //   operationalCosts: inputData.operationalCosts,
          //   ALL_FIELDS: inputData
          // });
          await persistenceService.saveMarketCalculation(
            productId,
            marketCode,
            {
              marketLaunchDate: inputData.launchDate || undefined,
              forecastDuration: inputData.projectLifetime * 12,
              developmentPhaseMonths: 36, // 3 years
              monthlySalesForecast: inputData.monthlySalesForecast,
              annualSalesForecastChange: inputData.annualSalesForecastChange,
              initialUnitPrice: inputData.initialUnitPrice,
              annualUnitPriceChange: inputData.annualUnitPriceChange,
              initialVariableCost: inputData.manufacturingCosts,
              annualVariableCostChange: 0,
              allocatedMonthlyFixedCosts: 0,
              annualFixedCostChange: 0,
              rndWorkCosts: inputData.developmentCosts,
              rndWorkCostsSpread: 36,
              rndMaterialMachineCosts: inputData.clinicalTrialCosts,
              rndMaterialMachineSpread: 24,
              rndStartupProductionCosts: 0,
              rndStartupProductionSpread: 12,
              rndPatentCosts: inputData.regulatoryCosts,
              rndPatentSpread: 36,
              totalMarketingBudget: inputData.marketingCosts,
              marketingSpreadMonths: 24,
              royaltyRate: 0,
              discountRate: inputData.discountRate,
              patentExpiry: inputData.patentExpiry,
              postPatentDeclineRate: inputData.postPatentDeclineRate,
              cannibalizedRevenue: inputData.cannibalizationRate,
              affectedProducts: affectedProducts.filter(p => p.selected).map(p => ({
                id: p.id,
                productId: p.id,
                name: p.name,
                productName: p.name,
                currentRevenue: p.currentRevenue,
                cannibalizationRate: p.cannibalizationRate,
                monthsToReachRoof: 12,
                totalCannibalizationPercentage: p.cannibalizationRate
              })),
              operationalCosts: inputData.operationalCosts,
              customerAcquisitionCost: inputData.customerAcquisitionCost,
            },
            calculationResult
          );
        }
      }
      
      setSaveStatus('saved');
      if (showToast) toast.success("rNPV analysis saved successfully");
    } catch (error) {
      console.error("Error saving rNPV analysis:", error);
      setSaveStatus('error');
      toast.error("Failed to save rNPV analysis");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save when marketInputs change (with debounce)
  useEffect(() => {
    // Skip auto-save during initial load
    if (isInitialLoadRef.current) {
      return;
    }

    // Skip if no productId (can't save without it)
    if (!productId && !bundleId) {
      return;
    }

    // Skip if no data to save
    if (Object.keys(marketInputs).length === 0) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set status to indicate changes pending
    setSaveStatus('idle');

    // Debounce auto-save by 1.5 seconds
    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Inline save logic to avoid dependency issues
      if (!productId && !isBundleMode) return;

      setIsSaving(true);
      setSaveStatus('saving');

      try {
        const persistenceService = new NPVPersistenceService();

        for (const marketCode of Object.keys(marketInputs)) {
          const inputData = marketInputs[marketCode];
          const calculationResult = marketResults[marketCode];

          if (inputData && calculationResult) {
            await persistenceService.saveMarketCalculation(
              productId!,
              marketCode,
              {
                marketLaunchDate: inputData.launchDate || undefined,
                forecastDuration: inputData.projectLifetime * 12,
                developmentPhaseMonths: 36,
                monthlySalesForecast: inputData.monthlySalesForecast,
                annualSalesForecastChange: inputData.annualSalesForecastChange,
                initialUnitPrice: inputData.initialUnitPrice,
                annualUnitPriceChange: inputData.annualUnitPriceChange,
                initialVariableCost: inputData.manufacturingCosts,
                annualVariableCostChange: 0,
                allocatedMonthlyFixedCosts: 0,
                annualFixedCostChange: 0,
                rndWorkCosts: inputData.developmentCosts,
                rndWorkCostsSpread: 36,
                rndMaterialMachineCosts: inputData.clinicalTrialCosts,
                rndMaterialMachineSpread: 24,
                rndStartupProductionCosts: 0,
                rndStartupProductionSpread: 12,
                rndPatentCosts: inputData.regulatoryCosts,
                rndPatentSpread: 36,
                totalMarketingBudget: inputData.marketingCosts,
                marketingSpreadMonths: 24,
                royaltyRate: 0,
                discountRate: inputData.discountRate,
                patentExpiry: inputData.patentExpiry,
                postPatentDeclineRate: inputData.postPatentDeclineRate,
                cannibalizedRevenue: inputData.cannibalizationRate,
                affectedProducts: [],
                operationalCosts: inputData.operationalCosts,
                customerAcquisitionCost: inputData.customerAcquisitionCost,
              },
              calculationResult
            );
          }
        }

        setSaveStatus('saved');
      } catch (error) {
        console.error("Auto-save error:", error);
        setSaveStatus('error');
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [marketInputs, productId, bundleId, isBundleMode, marketResults]);

  // Mark initial load as complete after data loads
  useEffect(() => {
    if (Object.keys(marketInputs).length > 0 && isInitialLoadRef.current) {
      // Wait a bit for all data to settle
      const timer = setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [marketInputs]);

  const formatCurrencyValue = (value: number | undefined, marketCode?: string) => {
    if (value === undefined || value === null || isNaN(value)) return '$0';
    
    if (marketCode) {
      return formatCurrency(value, marketCode);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) return '0%';
    return `${value.toFixed(0)}%`;
  };

  // Generate portfolio chart data by combining all market results
  const portfolioChartData = useMemo(() => {
    const validMarketResults = Object.values(marketResults).filter(r => r && r.monthlyResults);
    if (validMarketResults.length === 0) return [];

    // Get the maximum number of months across all markets
    const maxMonths = Math.max(...validMarketResults.map(r => r.monthlyResults.length));
    const chartData = [];
    let cumulativeCashFlow = 0; // Track portfolio-wide cumulative cash flow
    let cumulativeCashFlowRiskAdjusted = 0; // Track risk-adjusted cumulative cash flow
    let cumulativeCosts = 0; // Track portfolio-wide cumulative costs
    
    // Track per-market cumulative cash flow
    const marketCumulatives: Record<string, number> = {};
    selectedMarkets.forEach(market => {
      marketCumulatives[market.code] = 0;
    });
    
    // console.log('Portfolio Chart Debug - Valid market results:', validMarketResults.length);
    // console.log('Portfolio Chart Debug - Max months:', maxMonths);

    for (let month = 1; month <= maxMonths; month++) {
      let totalRevenue = 0;
      let totalCosts = 0;
      let totalNetCashFlow = 0;
      let totalNetCashFlowRiskAdjusted = 0;
      let totalDevelopmentCosts = 0;
      let isDevelopmentPhase = false;
      
      const monthDataPoint: any = {
        month,
        revenue: 0,
        costs: 0,
        netCashFlow: 0,
        cumulativeCosts: 0,
        phase: 'revenue'
      };
      
      validMarketResults.forEach(result => {
        const monthData = result.monthlyResults[month - 1];
        if (monthData) {
          totalRevenue += monthData.revenue || 0;
          totalCosts += monthData.costs || 0;
          totalNetCashFlow += monthData.netCashFlow || 0;
          const netCashFlowRiskAdjusted = monthData.netCashFlowRiskAdjusted || 0;
          totalNetCashFlowRiskAdjusted += netCashFlowRiskAdjusted;
          totalDevelopmentCosts += monthData.developmentCosts || 0;
          
          // Update individual market cumulative cash flow
          const marketCode = result.marketCode;
          if (marketCumulatives[marketCode] !== undefined) {
            marketCumulatives[marketCode] += monthData.netCashFlow || 0;
            monthDataPoint[`cumulativeCashFlow_${marketCode}`] = marketCumulatives[marketCode];
          }
          
          // Check if any market is still in development phase
          if (monthData.phase === 'development') {
            isDevelopmentPhase = true;
          }
        }
      });

      // Update cumulative cash flow and costs
      cumulativeCashFlow += totalNetCashFlow;
      cumulativeCashFlowRiskAdjusted += totalNetCashFlowRiskAdjusted;
      cumulativeCosts -= totalDevelopmentCosts;
      
      // Debug logging for first few months
      if (month <= 5) {
        // console.log(`Portfolio Month ${month}: Revenue=${totalRevenue.toFixed(0)}, Costs=${totalCosts.toFixed(0)}, NetCashFlow=${totalNetCashFlow.toFixed(0)}, CumulativeCashFlow=${cumulativeCashFlow.toFixed(0)}, CumulativeCosts=${cumulativeCosts.toFixed(0)}, Phase=${isDevelopmentPhase ? 'development' : 'revenue'}`);
      }

      monthDataPoint.revenue = totalRevenue;
      monthDataPoint.costs = totalCosts;
      monthDataPoint.netCashFlow = totalNetCashFlow;
      monthDataPoint.cumulativeCashFlow = cumulativeCashFlow;
      monthDataPoint.cumulativeCashFlowRiskAdjusted = cumulativeCashFlowRiskAdjusted;
      monthDataPoint.cumulativeCosts = cumulativeCosts;
      monthDataPoint.phase = isDevelopmentPhase ? 'development' : 'revenue';
      
      chartData.push(monthDataPoint);
    }

    return chartData;
  }, [marketResults, selectedMarkets]);

  // Generate market-specific chart data
  const generateMarketChartData = (marketCode: string) => {
    const result = marketResults[marketCode];
    if (!result?.monthlyResults) return [];
    
    return result.monthlyResults.map((monthData: any) => ({
      month: monthData.month,
      revenue: monthData.revenue || 0,
      costs: monthData.costs || 0,
      netCashFlow: monthData.netCashFlow || 0,
      cumulativeCashFlow: monthData.cumulativeCashFlow || 0,
      cumulativeCashFlowRiskAdjusted: monthData.cumulativeCashFlowRiskAdjusted || 0,
      cumulativeCosts: monthData.cumulativeCosts || 0,
      phase: monthData.phase
    }));
  };

  // Get active chart data based on selection
  const activeChartData = useMemo(() => {
    if (activeGraphMarket === 'all') {
      return portfolioChartData;
    }
    return generateMarketChartData(activeGraphMarket);
  }, [activeGraphMarket, portfolioChartData, marketResults]);

  // Calculate breakeven for active chart
  const activeBreakeven = useMemo(() => {
    if (activeChartData.length === 0) return { month: null, years: null, display: 'Not achieved', formattedDate: null };
    
    const breakEventMonth = activeChartData.findIndex(d => d.cumulativeCashFlow >= 0);
    
    if (breakEventMonth === -1) {
      return { month: null, years: null, display: 'Not achieved', formattedDate: null };
    }
    
    if (breakEventMonth === 0) {
      return { month: 1, years: 0.08, display: 'Immediate', formattedDate: null };
    }
    
    const years = (breakEventMonth + 1) / 12;
    const displayYears = years < 1 ? `${breakEventMonth + 1} months` : `${Math.round(years)} years`;
    
    // Calculate the actual breakeven date based on earliest market launch date
    let formattedDate: string | null = null;
    const marketCodes = Object.keys(marketInputs);
    if (marketCodes.length > 0) {
      // Find earliest launch date across all markets
      let earliestLaunchDate: Date | null = null;
      
      marketCodes.forEach(code => {
        const inputs = marketInputs[code];
        if (inputs?.launchDate) {
          if (!earliestLaunchDate || inputs.launchDate < earliestLaunchDate) {
            earliestLaunchDate = inputs.launchDate;
          }
        }
      });
      
      if (earliestLaunchDate) {
        // Find development phase length from chart data (where phase changes from 'development' to 'revenue')
        const launchMonthIndex = activeChartData.findIndex(d => d.phase === 'revenue');
        const developmentMonths = launchMonthIndex > 0 ? launchMonthIndex : 36; // Fallback to 36 if not found
        
        // Month 1 in chart corresponds to start of development (launch date - development months)
        const projectStartDate = addMonths(earliestLaunchDate, -developmentMonths);
        const breakevenDate = addMonths(projectStartDate, breakEventMonth);
        formattedDate = format(breakevenDate, 'MMM yyyy');
      }
    }
    
    return { 
      month: breakEventMonth + 1, 
      years, 
      display: displayYears,
      formattedDate
    };
  }, [activeChartData, marketInputs]);

  // Calculate portfolio breakeven from chart data
  const portfolioBreakeven = useMemo(() => {
    if (portfolioChartData.length === 0) return { month: null, years: null, display: 'Not achieved' };
    
    const breakEventMonth = portfolioChartData.findIndex(d => d.cumulativeCashFlow >= 0);
    
    if (breakEventMonth === -1) {
      return { month: null, years: null, display: 'Not achieved' };
    }
    
    if (breakEventMonth === 0) {
      return { month: 1, years: 0.08, display: 'Immediate' };
    }
    
    const years = (breakEventMonth + 1) / 12;
    const displayYears = years < 1 ? `${breakEventMonth + 1} months` : `${Math.round(years)} years`;
    
    return { 
      month: breakEventMonth + 1, 
      years, 
      display: displayYears 
    };
  }, [portfolioChartData]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatYAxisValue = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Show message if no markets are selected
  if (selectedMarkets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lang('rnpv.title')}</CardTitle>
          <CardDescription>{lang('rnpv.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {lang('rnpv.noMarketsMessage')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {isPreLaunch ? lang('rnpv.titlePreLaunch') : lang('rnpv.title')}
            </h3>
            {isPreLaunch && (
              <Badge variant="secondary">{lang('rnpv.badges.preLaunch')}</Badge>
            )}
            {!isPreLaunch && (
              <Badge variant="outline">{lang('rnpv.badges.postLaunch')}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isPreLaunch
              ? (selectedMarkets.length !== 1
                  ? lang('rnpv.subtitle.preLaunchPlural', { count: selectedMarkets.length })
                  : lang('rnpv.subtitle.preLaunch', { count: selectedMarkets.length }))
              : (selectedMarkets.length !== 1
                  ? lang('rnpv.subtitle.postLaunchPlural', { count: selectedMarkets.length })
                  : lang('rnpv.subtitle.postLaunch', { count: selectedMarkets.length }))
            }
          </p>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {(() => {
            const launchDates = Object.values(marketInputs)
              .map(m => m.launchDate)
              .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
            const earliestLaunchDate = launchDates.length > 0
              ? new Date(Math.min(...launchDates.map(d => d.getTime())))
              : null;

            return earliestLaunchDate ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{lang('rnpv.estimatedFirstLaunch')}</div>
                  <div className="text-sm font-semibold">
                    {earliestLaunchDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ) : null;
          })()}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={viewMode === 'essential' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('essential')}
                className="h-8 px-3 gap-1.5"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Essential
              </Button>
              <Button
                variant={viewMode === 'full' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('full')}
                className="h-8 px-3 gap-1.5"
              >
                <List className="h-3.5 w-3.5" />
                Full Analysis
              </Button>
            </div>
            <Button onClick={handleResetAnalysis} variant="outline" className="flex items-center gap-2" disabled={disabled}>
              <RotateCcw className="h-4 w-4" />
              {lang('rnpv.buttons.resetAnalysis')}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              disabled={disabled || Object.keys(marketResults).length === 0}
              onClick={async () => {
                try {
                  const firstMarketCode = Object.keys(marketResults)[0];
                  if (!firstMarketCode || !marketResults[firstMarketCode] || !marketInputs[firstMarketCode]) {
                    toast.error('No analysis data to export');
                    return;
                  }

                  const inputs = marketInputs[firstMarketCode];
                  const result = marketResults[firstMarketCode];

                  // Build MarketNPVInputData for export
                  const inputData: MarketNPVInputData = {
                    marketLaunchDate: inputs.launchDate || undefined,
                    forecastDuration: inputs.projectLifetime * 12,
                    developmentPhaseMonths: 36,
                    monthlySalesForecast: inputs.monthlySalesForecast,
                    annualSalesForecastChange: inputs.annualSalesForecastChange,
                    initialUnitPrice: inputs.initialUnitPrice,
                    annualUnitPriceChange: inputs.annualUnitPriceChange,
                    initialVariableCost: inputs.manufacturingCosts,
                    annualVariableCostChange: 0,
                    allocatedMonthlyFixedCosts: 0,
                    annualFixedCostChange: 0,
                    rndWorkCosts: inputs.developmentCosts,
                    rndWorkCostsSpread: 36,
                    rndMaterialMachineCosts: inputs.clinicalTrialCosts,
                    rndMaterialMachineSpread: 24,
                    rndStartupProductionCosts: 0,
                    rndStartupProductionSpread: 12,
                    rndPatentCosts: inputs.regulatoryCosts,
                    rndPatentSpread: 36,
                    totalMarketingBudget: inputs.marketingCosts,
                    marketingSpreadMonths: 24,
                    royaltyRate: 0,
                    discountRate: inputs.discountRate,
                    patentExpiry: inputs.patentExpiry,
                    postPatentDeclineRate: inputs.postPatentDeclineRate,
                    cannibalizedRevenue: inputs.cannibalizationRate,
                    affectedProducts: [],
                  };

                  await RNPVExcelExportService.exportToExcel({
                    productName: product?.name || 'Product',
                    marketName: inputs.marketName || firstMarketCode,
                    currency: getMarketCurrency(firstMarketCode).code || 'USD',
                    exportDate: new Date(),
                    inputData,
                    calculationResult: result,
                  });

                  toast.success('rNPV model exported to Excel');
                } catch (error) {
                  console.error('Export error:', error);
                  toast.error('Failed to export rNPV data');
                }
              }}
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving || disabled} className="flex items-center gap-2">
              {saveStatus === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : saveStatus === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? lang('rnpv.buttons.saving') : saveStatus === 'saved' ? 'Saved' : lang('common.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Essential View Mode */}
      {viewMode === 'essential' ? (
        <GenesisRNPVEssentials productId={productId || ''} markets={markets} />
      ) : (
        <>
          {/* Full Analysis View - Nested Tabs for Analysis, Financials, and Timeline */}
          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-5">
              <TabsTrigger value="analysis">{lang('rnpv.tabs.analysis')}</TabsTrigger>
              <TabsTrigger value="costs">Cost Distribution</TabsTrigger>
              <TabsTrigger value="value-evolution">Value Evolution</TabsTrigger>
              <TabsTrigger value="financials">{lang('rnpv.tabs.financials')}</TabsTrigger>
              <TabsTrigger value="timeline">{lang('rnpv.tabs.timeline')}</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-6 mt-6">
          {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            {results.marketName ? lang('rnpv.summary.marketSummary', { market: results.marketName }) : lang('rnpv.summary.portfolioSummary')}
          </CardTitle>
          <CardDescription>
            {results.marketName
              ? lang('rnpv.summary.marketDescription', { market: results.marketName })
              : lang('rnpv.summary.portfolioDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {lang('rnpv.metrics.totalRnpv')}
                  <HelpTooltip
                    content={lang('rnpv.metrics.rnpvTooltip')}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${results.rnpv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyValue(results.rnpv)}
                </div>
                <p className="text-xs text-muted-foreground">{lang('rnpv.metrics.markets', { count: results.marketCount })}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {lang('rnpv.metrics.averageRoi')}
                  <HelpTooltip
                    content={lang('rnpv.metrics.roiTooltip')}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${results.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(results.roi)}
                </div>
                <p className="text-xs text-muted-foreground">{lang('rnpv.metrics.weightedAverage')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {lang('rnpv.metrics.riskFactor')}
                  <HelpTooltip
                    content={lang('rnpv.metrics.riskTooltip')}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-orange-600">
                  {formatPercentage(results.riskAdjustment)}
                </div>
                <p className="text-xs text-muted-foreground">{lang('rnpv.metrics.averageRisk')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  {lang('rnpv.metrics.totalInvestment')}
                  <HelpTooltip
                    content={lang('rnpv.metrics.investmentTooltip')}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {formatCurrencyValue(results.totalCosts)}
                </div>
                <p className="text-xs text-muted-foreground">{lang('rnpv.metrics.requiredInvestment')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {lang('rnpv.metrics.breakevenTime')}
                  <HelpTooltip
                    content={lang('rnpv.metrics.breakevenTooltip')}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${activeBreakeven.month ? 'text-blue-600' : 'text-orange-600'}`}>
                  {activeBreakeven.display}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeBreakeven.month 
                    ? activeBreakeven.formattedDate 
                      ? `${activeBreakeven.formattedDate} (month ${activeBreakeven.month})`
                      : lang('rnpv.metrics.month', { month: activeBreakeven.month })
                    : lang('rnpv.metrics.noPositiveCashFlow')}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Market Selector - Above the chart (for Single Product Mode) */}
      {!isBundleMode && (
        <Card>
          <CardHeader className="pb-3">
            <MarketDropdownSelector
              markets={selectedMarkets}
              selectedMarketCode={currentMarketTab}
              onSelectMarket={setCurrentMarketTab}
              marketInputs={marketInputs}
              marketResults={marketResults}
            />
          </CardHeader>
        </Card>
      )}

      {/* Full-width Lifecycle Chart */}
      {productId && (
        <ProductLifecycleCashFlowChart
          productId={productId}
          launchDate={
            // Use market-specific launch date if a single market is selected
            activeGraphMarket && activeGraphMarket !== 'all' && marketInputs[activeGraphMarket]?.launchDate
              ? marketInputs[activeGraphMarket].launchDate
              : product?.projected_launch_date || product?.actual_launch_date
          }
          npvData={{
            npv: portfolioResults.rnpv,
            // Pass only the selected market's data so the chart uses the correct values
            marketInputData: (() => {
              // Determine which market to use: selected market or first available
              const targetMarket = activeGraphMarket && activeGraphMarket !== 'all' && marketInputs[activeGraphMarket]
                ? activeGraphMarket
                : Object.keys(marketInputs)[0];
              
              if (!targetMarket || !marketInputs[targetMarket]) return {};
              
              const inputs = marketInputs[targetMarket];
              return {
                [targetMarket]: {
                  monthlySalesForecast: inputs.monthlySalesForecast,
                  initialUnitPrice: inputs.initialUnitPrice,
                  annualSalesForecastChange: inputs.annualSalesForecastChange,
                  initialVariableCost: inputs.manufacturingCosts,
                  forecastDuration: inputs.projectLifetime * 12,
                  rndWorkCosts: inputs.developmentCosts,
                  marketLaunchDate: inputs.launchDate,
                  // Risk values for post-launch rNPV calculation
                  regulatoryRisk: inputs.regulatoryRisk,
                  commercialRisk: inputs.commercialRisk,
                  competitiveRisk: inputs.competitiveRisk,
                }
              };
            })()
          }}
          currency="USD"
          variant="full"
        />
      )}

      {/* Full-width Forms Layout */}
      <div className="space-y-6">
        {isBundleMode ? (
          /* Bundle Mode: Dropdown Selector */
          <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{lang('rnpv.bundleMode.selectProduct')}</CardTitle>
                    <Badge variant={(() => {
                      const completedCount = selectedMarkets.filter(market => {
                        const inputs = marketInputs[market.code];
                        const result = marketResults[market.code];
                        return inputs && result &&
                               inputs.monthlySalesForecast > 0 &&
                               inputs.initialUnitPrice > 0 &&
                               result.totalRevenue > 0;
                      }).length;
                      return completedCount === selectedMarkets.length ? "default" : "secondary";
                    })()}>
                      {(() => {
                        const completedCount = selectedMarkets.filter(market => {
                          const inputs = marketInputs[market.code];
                          const result = marketResults[market.code];
                          return inputs && result &&
                                 inputs.monthlySalesForecast > 0 &&
                                 inputs.initialUnitPrice > 0 &&
                                 result.totalRevenue > 0;
                        }).length;
                        return lang('rnpv.badges.complete', { completed: completedCount, total: selectedMarkets.length });
                      })()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Select value={currentMarketTab} onValueChange={setCurrentMarketTab}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder={lang('rnpv.bundleMode.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="portfolio-summary">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-semibold">{lang('rnpv.bundleMode.bundleSummary')}</span>
                          <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                      </SelectItem>
                      {selectedMarkets.map(market => {
                        const hasData = marketInputs[market.code] && 
                                       marketResults[market.code] && 
                                       marketInputs[market.code].monthlySalesForecast > 0 &&
                                       marketInputs[market.code].initialUnitPrice > 0;
                        return (
                          <SelectItem key={market.code} value={market.code}>
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{market.name || market.code}</span>
                              {hasData ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Individual Product Analysis */}
              {selectedMarkets.map(market => (
                currentMarketTab === market.code && (
                  <div key={market.code} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">
                          <ProductLink
                            productId={market.code}
                            showIcon={true}
                            showTooltip={true}
                            className="text-lg font-semibold"
                          >
                            {market.name || market.code}
                          </ProductLink> {lang('rnpv.bundleMode.analysis')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {lang('rnpv.bundleMode.completeProjections')}
                        </p>
                      </div>
                    </div>

                    {/* Market analysis form and results */}
                    {marketInputs[market.code] && (
                      <MarketAnalysisForm
                        market={market}
                        inputs={marketInputs[market.code]}
                        onInputChange={(field, value) => updateMarketInput(market.code, field, value)}
                        isUsingRealBudgetData={usingRealBudgetData}
                        realDevelopmentCosts={realTotalDevelopmentCosts}
                        disabled={disabled}
                        budgetSource={budgetSource}
                        onGetFromBudget={fetchDevCostsFromBudget}
                        isLoadingBudget={loadingBudgets}
                        cumulativeTechnicalLoS={cumulativeTechnicalLoA}
                        productId={market.code}
                        phasesInfo={phasesInfo}
                      />
                    )}

                    {marketResults[market.code] && (
                      <div className="mt-6">
                        <h5 className="text-base font-semibold mb-4">
                          {lang('rnpv.bundleMode.resultsFor')} <ProductLink
                            productId={market.code}
                            showIcon={true}
                            showTooltip={true}
                          >
                            {market.name || market.code}
                          </ProductLink>
                        </h5>
                        <MarketResultsView
                          market={market}
                          result={marketResults[market.code]}
                        />
                      </div>
                    )}
                  </div>
                )
              ))}

              {/* Portfolio Summary */}
              {currentMarketTab === 'portfolio-summary' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold">{lang('rnpv.portfolioAnalysis.summary')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {lang('rnpv.portfolioAnalysis.comparisonDescription')}
                    </p>
                  </div>

                  {/* Market Comparison Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{lang('rnpv.portfolioAnalysis.productComparison')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">{lang('rnpv.table.product')}</th>
                              <th className="text-right p-2">{lang('rnpv.table.rnpv')}</th>
                              <th className="text-right p-2">{lang('rnpv.table.roi')}</th>
                              <th className="text-right p-2">{lang('rnpv.table.risk')}</th>
                              <th className="text-right p-2">{lang('rnpv.table.investment')}</th>
                              <th className="text-center p-2">{lang('rnpv.table.status')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedMarkets.map(market => {
                              const result = marketResults[market.code];
                              const inputs = marketInputs[market.code];
                              // Only show as complete if there's actual data (not just zeros)
                              const hasActualData = inputs && result && 
                                                   inputs.monthlySalesForecast > 0 && 
                                                   inputs.initialUnitPrice > 0 &&
                                                   result.totalRevenue > 0;
                              
                              return (
                                <tr key={market.code} className="border-b">
                                  <td className="p-2 font-medium">{market.name || market.code}</td>
                                  {result ? (
                                    <>
                                      <td className={`text-right p-2 ${result.rnpv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrencyValue(result.rnpv, market.code)}
                                      </td>
                                      <td className={`text-right p-2 ${result.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPercentage(result.roi)}
                                      </td>
                                      <td className="text-right p-2 text-orange-600">
                                        {formatPercentage(result.riskAdjustment)}
                                      </td>
                                      <td className="text-right p-2">
                                        {formatCurrencyValue(result.totalCosts, market.code)}
                                      </td>
                                      <td className="text-center p-2">
                                        {hasActualData ? (
                                          <CheckCircle2 className="h-4 w-4 text-success inline" />
                                        ) : (
                                          <AlertCircle className="h-4 w-4 text-amber-500 inline" />
                                        )}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="text-right p-2 text-muted-foreground">-</td>
                                      <td className="text-right p-2 text-muted-foreground">-</td>
                                      <td className="text-right p-2 text-muted-foreground">-</td>
                                      <td className="text-right p-2 text-muted-foreground">-</td>
                                      <td className="text-center p-2">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground inline" />
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* Single Product Mode: Individual Market Analysis (selector moved above chart) */
            <div className="space-y-4">

              {/* Individual Market Analysis */}
              {selectedMarkets.map(market => (
                currentMarketTab === market.code && (
                  <div key={market.code} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">{lang('rnpv.marketAnalysis.title', { market: market.name || market.code })}</h4>
                <p className="text-sm text-muted-foreground">
                  {lang('rnpv.marketAnalysis.description', { market: market.name || market.code })}
                </p>
              </div>
              <Badge variant="outline">
                {getMarketCurrency(market.code).symbol} {getMarketCurrency(market.code).code}
              </Badge>
            </div>

            {/* Budget Data Source Indicator */}
            {usingRealBudgetData && !hasManualDevCostOverride && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h5 className="font-semibold text-success mb-1">{lang('rnpv.budgetIndicator.usingRealData')}</h5>
                  <p className="text-sm text-muted-foreground">
                    {lang('rnpv.budgetIndicator.realDataDescription', { amount: formatCurrency(realTotalDevelopmentCosts, market.code) })}
                  </p>
                </div>
              </div>
            )}

            {hasManualDevCostOverride && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h5 className="font-semibold text-primary mb-1">Using Manual Development Cost Override</h5>
                  <p className="text-sm text-muted-foreground">
                    Chart uses your manual entry ({formatCurrency(marketInputs[market.code]?.developmentCosts || 0, market.code)}) spread evenly across active development phases. Milestone budget: {formatCurrency(realTotalDevelopmentCosts, market.code)}.
                  </p>
                </div>
              </div>
            )}

            {!usingRealBudgetData && !loadingBudgets && !hasManualDevCostOverride && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h5 className="font-semibold text-warning mb-1">{lang('rnpv.budgetIndicator.manualEntry')}</h5>
                  <p className="text-sm text-muted-foreground">
                    {lang('rnpv.budgetIndicator.manualDescription')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // In bundle mode, market.code is the productId
                    // In normal mode, use the productId prop
                    const targetProductId = isBundleMode ? market.code : productId;
                    navigate(`/app/product/${targetProductId}/milestones?returnTo=business-case`);
                  }}
                  className="flex items-center gap-1.5 text-warning hover:text-warning/80 hover:bg-warning/10 ml-2"
                >
                  <span className="text-xs">{lang('rnpv.buttons.viewMilestones')}</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Market-specific input form */}
            {marketInputs[market.code] && (
              <MarketAnalysisForm
                market={market}
                inputs={marketInputs[market.code]}
                onInputChange={(field, value) => updateMarketInput(market.code, field, value)}
                isUsingRealBudgetData={usingRealBudgetData}
                realDevelopmentCosts={realTotalDevelopmentCosts}
                disabled={disabled}
                budgetSource={budgetSource}
                onGetFromBudget={fetchDevCostsFromBudget}
                isLoadingBudget={loadingBudgets}
                cumulativeTechnicalLoS={cumulativeTechnicalLoA}
                productId={productId}
                phasesInfo={phasesInfo}
              />
            )}

            {/* Market-specific results */}
            {marketResults[market.code] && (
              <div className="mt-6">
                <h5 className="text-base font-semibold mb-4">{lang('rnpv.resultsFor', { market: market.name || market.code })}</h5>
                <MarketResultsView
                  market={market}
                  result={marketResults[market.code]}
                />
              </div>
            )}
                  </div>
                )
              ))}

              {/* Portfolio Summary */}
              {currentMarketTab === 'portfolio-summary' && (
                <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold">Portfolio Summary</h4>
            <p className="text-sm text-muted-foreground">
              Comparison and aggregated view across all selected markets
            </p>
          </div>

          {/* Market Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Market Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Market</th>
                      <th className="text-right p-2">rNPV</th>
                      <th className="text-right p-2">ROI</th>
                      <th className="text-right p-2">Risk</th>
                      <th className="text-right p-2">Investment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMarkets.map(market => {
                      const result = marketResults[market.code];
                      if (!result) return null;
                      
                      return (
                        <tr key={market.code} className="border-b">
                          <td className="p-2 font-medium">{market.name || market.code}</td>
                          <td className={`text-right p-2 ${result.rnpv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrencyValue(result.rnpv, market.code)}
                          </td>
                          <td className={`text-right p-2 ${result.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(result.roi)}
                          </td>
                          <td className="text-right p-2 text-orange-600">
                            {formatPercentage(result.riskAdjustment)}
                          </td>
                          <td className="text-right p-2">
                            {formatCurrencyValue(result.totalCosts, market.code)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
                </div>
              )}
            </div>
          )}
        </div>
        </TabsContent>

        <TabsContent value="value-evolution" className="space-y-6 mt-6">
          {productId && phaseBudgetData.length > 0 ? (
            <ValueEvolutionTab
              productId={productId}
              phases={phaseBudgetData}
              npvData={marketResults}
              marketInputs={marketInputs}
              currency="USD"
              disabled={disabled}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Value Evolution requires project phases with financial data.
                  <br />
                  Please set up milestones and budgets first.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financials" className="space-y-6 mt-6">
          {/* Financial Overview - Only for Pre-Launch Products */}
          {isPreLaunch && developmentPhases.length > 0 ? (
            <div className="space-y-6">
              {/* Investment Reality Check Panel - shows Peak Funding, Max Loss, Suggested Rate */}
              {(() => {
                // Calculate investment reality metrics
                const firstMarket = selectedMarkets[0];
                const firstResult = firstMarket ? marketResults[firstMarket.code] : null;
                const standardRNPV = firstResult?.rnpv || 0;
                const currentDiscountRate = firstMarket && marketInputs[firstMarket.code]?.discountRate || 10;
                
                const metrics = calculateInvestmentMetrics(
                  standardRNPV,
                  realTotalDevelopmentCosts,
                  cumulativeTechnicalLoA,
                  currentDiscountRate
                );
                
                // Handler to apply suggested rate to all markets
                const handleApplySuggestedRate = (rate: number) => {
                  setMarketInputs(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(code => {
                      updated[code] = { ...updated[code], discountRate: rate };
                    });
                    return updated;
                  });
                  toast.success(`Applied ${rate}% discount rate to all markets`);
                };
                
                return (
                  <InvestmentRealityCheck
                    metrics={metrics}
                    currency="USD"
                    onApplySuggestedRate={handleApplySuggestedRate}
                  />
                );
              })()}
              
              <FinancialOverview
                developmentPhases={developmentPhases}
                cumulativeTechnicalLoA={cumulativeTechnicalLoA}
                totalInvestment={realTotalDevelopmentCosts}
                launchDate={product?.projected_launch_date ? new Date(product.projected_launch_date) : null}
                currency="USD"
                productId={productId || ''}
                companyName={product?.company || ''}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isPreLaunch
                    ? lang('rnpv.financialsTab.noPhases')
                    : lang('rnpv.financialsTab.postLaunchMessage')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="costs" className="space-y-6 mt-6">
          {/* Interactive Cost Distribution Editor */}
          {productId && phaseBudgetData.length > 0 ? (
            <ProjectCostDistributionPanel
              productId={productId}
              phases={phaseBudgetData.map((phase): PhaseOption => ({
                id: phase.phaseId,
                name: phase.phaseName,
                months: phase.startDate && phase.endDate 
                  ? Math.max(1, Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))
                  : 3,
                loS: phase.likelihoodOfSuccess || 100,
              }))}
              currency="USD"
              discountRate={(() => {
                const firstMarket = selectedMarkets[0];
                return firstMarket && marketInputs[firstMarket.code]?.discountRate
                  ? marketInputs[firstMarket.code].discountRate
                  : 10;
              })()}
              onDistributionChange={(outputs: CostDistributionOutput[]) => {
                // Calculate total development costs from all distributions
                const totalDevCosts = outputs.reduce((sum, o) => sum + o.totalAmount, 0);
                
                // Update all market inputs with the new development costs
                if (totalDevCosts > 0) {
                  setMarketInputs(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(code => {
                      updated[code] = { ...updated[code], developmentCosts: totalDevCosts };
                    });
                    return updated;
                  });
                }
              }}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {phaseBudgetData.length === 0
                    ? 'No project phases found. Add phases with budget data in the Milestones tab to enable cost distribution.'
                    : 'Cost distribution requires a product context.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6 mt-6">
          {/* Risk-Adjusted Cash Flow Timeline - Only for Pre-Launch Products */}
          {isPreLaunch && developmentPhases.length > 0 ? (
            <PhaseFinancialTimeline
              phases={developmentPhases}
              currency="USD"
              cumulativeTechnicalLoA={cumulativeTechnicalLoA}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isPreLaunch
                    ? lang('rnpv.timelineTab.noPhases')
                    : lang('rnpv.timelineTab.postLaunchMessage')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}