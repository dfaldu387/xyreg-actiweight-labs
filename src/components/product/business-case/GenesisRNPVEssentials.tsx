import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SaveStatusIndicator } from '@/components/ui/save-status-indicator';
import { ChevronDown, ChevronUp, Info, Loader2, Calendar, TrendingUp, DollarSign, CheckCircle2, Download, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { debounce } from '@/utils/debounce';
import { useProductDetails } from '@/hooks/useProductDetails';
import { NPVPersistenceService } from '@/services/npvPersistenceService';
import { BudgetIntegrationService, PhaseBudgetData } from '@/services/enhanced-rnpv/budgetIntegrationService';
import { EnhancedProductMarket } from '@/utils/enhancedMarketRiskClassMapping';
import { GenesisStepNotice } from './GenesisStepNotice';
import { RNPVAnalysis } from '@/components/product/business/RNPVAnalysis';
import { formatCurrency } from '@/utils/marketCurrencyUtils';
import { RNPVExcelExportService } from '@/services/rnpvExcelExportService';
import { XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { format, addMonths } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { useGenesisRestrictions } from '@/hooks/useGenesisRestrictions';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface GenesisRNPVEssentialsProps {
  productId: string;
  markets?: EnhancedProductMarket[];
}

interface EssentialInputs {
  launchDate: string;
  forecastDurationYears: number;
  monthlyUnits: number;
  unitPrice: number;
  annualGrowthPercent: number;
  cogsPerUnit: number;
  developmentCosts: number;
  discountRate: number;
}

interface CombinedChartDataPoint {
  label: string;
  phase?: string;
  cost?: number;
  revenue?: number;
  cumulative: number;
  type: 'dev' | 'launch' | 'revenue';
  isLaunch?: boolean;
}

const DEFAULT_INPUTS: EssentialInputs = {
  launchDate: '',
  forecastDurationYears: 5,
  monthlyUnits: 0,
  unitPrice: 0,
  annualGrowthPercent: 0,
  cogsPerUnit: 0,
  developmentCosts: 0,
  discountRate: 10,
};

// Simple NPV calculation for preview
function calculateSimpleNPV(inputs: EssentialInputs): {
  npv: number;
  peakRevenue: number;
  grossMargin: number;
  breakEvenYear: number | null;
  yearlyData: Array<{ year: number; revenue: number; profit: number; cumulative: number }>;
} {
  const {
    forecastDurationYears,
    monthlyUnits,
    unitPrice,
    annualGrowthPercent,
    cogsPerUnit,
    developmentCosts,
    discountRate,
  } = inputs;

  const annualUnits = monthlyUnits * 12;
  let cumulativeCashFlow = -developmentCosts;
  let npv = -developmentCosts;
  let peakRevenue = 0;
  let breakEvenYear: number | null = null;
  const yearlyData: Array<{ year: number; revenue: number; profit: number; cumulative: number }> = [];

  // Add year 0 with initial investment
  yearlyData.push({
    year: 0,
    revenue: 0,
    profit: -developmentCosts,
    cumulative: -developmentCosts,
  });

  for (let year = 1; year <= forecastDurationYears; year++) {
    const growthMultiplier = Math.pow(1 + annualGrowthPercent / 100, year - 1);
    const yearlyUnits = annualUnits * growthMultiplier;
    const yearlyRevenue = yearlyUnits * unitPrice;
    const yearlyCogs = yearlyUnits * cogsPerUnit;
    const yearlyProfit = yearlyRevenue - yearlyCogs;
    
    // Discount factor
    const discountFactor = Math.pow(1 + discountRate / 100, year);
    npv += yearlyProfit / discountFactor;
    
    cumulativeCashFlow += yearlyProfit;
    
    if (yearlyRevenue > peakRevenue) {
      peakRevenue = yearlyRevenue;
    }
    
    if (breakEvenYear === null && cumulativeCashFlow >= 0) {
      breakEvenYear = year;
    }

    yearlyData.push({
      year,
      revenue: yearlyRevenue,
      profit: yearlyProfit,
      cumulative: cumulativeCashFlow,
    });
  }

  const grossMargin = unitPrice > 0 ? ((unitPrice - cogsPerUnit) / unitPrice) * 100 : 0;

  return { npv, peakRevenue, grossMargin, breakEvenYear, yearlyData };
}

export function GenesisRNPVEssentials({ productId, markets = [] }: GenesisRNPVEssentialsProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: product } = useProductDetails(productId);
  const { isGenesis } = useGenesisRestrictions();
  const [inputs, setInputs] = useState<EssentialInputs>(DEFAULT_INPUTS);
  const [isLoading, setIsLoading] = useState(true);
  const [devCostsSource, setDevCostsSource] = useState<'milestones' | 'saved' | 'manual'>('manual');
  const [phaseBreakdown, setPhaseBreakdown] = useState<PhaseBudgetData[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedInputs = useRef<EssentialInputs | null>(null);
  const isInitialLoad = useRef(true);
  const formRef = useRef<HTMLDivElement>(null);
  const loadSucceededRef = useRef(false);
  const activeMarketCodeRef = useRef<string>('PRIMARY');
  const saveDataRef = useRef<(data: EssentialInputs) => Promise<void>>();

  const persistenceService = new NPVPersistenceService();
  const returnTo = searchParams.get('returnTo');

  // Auto-scroll to form fields when coming from Genesis
  useEffect(() => {
    if (returnTo === 'genesis' && !isLoading && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [returnTo, isLoading]);

  // Function to fetch development costs from budget
  const fetchDevCostsFromBudget = async () => {
    try {
      const effectiveLaunchDate = product?.actual_launch_date 
        ? new Date(product.actual_launch_date)
        : product?.projected_launch_date 
          ? new Date(product.projected_launch_date)
          : undefined;
      
      const budgetSummary = await BudgetIntegrationService.getProductPhaseBudgetSummary(productId, effectiveLaunchDate);
      // Use totalBudget to match what SetDatesDialog shows, not just pre-launch costs
      const devCosts = budgetSummary.totalBudget || 0;
      
      // Store the phase breakdown for timeline visualization
      setPhaseBreakdown(budgetSummary.phaseBreakdown || []);
      
      // Always update with fetched value (even if 0)
      setInputs(prev => ({ ...prev, developmentCosts: devCosts }));
      setDevCostsSource('milestones');
      
      // Inform user what was fetched
      if (devCosts > 0) {
        toast.success(`Loaded ${formatCurrency(devCosts, 'USD')} from budget milestones`);
      } else {
        toast.info('No budget costs found in milestones. Development costs set to $0.');
      }
      
      return devCosts;
    } catch {
      toast.error('Failed to fetch budget data');
      return 0;
    }
  };

  // Load phase breakdown on mount for timeline visualization
  useEffect(() => {
    const loadPhaseBreakdown = async () => {
      try {
        const effectiveLaunchDate = product?.actual_launch_date 
          ? new Date(product.actual_launch_date)
          : product?.projected_launch_date 
            ? new Date(product.projected_launch_date)
            : undefined;
        
        const budgetSummary = await BudgetIntegrationService.getProductPhaseBudgetSummary(productId, effectiveLaunchDate);
        setPhaseBreakdown(budgetSummary.phaseBreakdown || []);
      } catch {
        // Error loading phase breakdown
      }
    };

    if (productId) {
      loadPhaseBreakdown();
    }
  }, [productId, product?.actual_launch_date, product?.projected_launch_date]);

  // Load existing data (without auto-loading dev costs)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load saved NPV analysis
        const savedAnalysis = await persistenceService.loadNPVAnalysis(productId);
        
        if (savedAnalysis && savedAnalysis.marketInputData) {
          // Determine which market code to load from
          const selectedMarkets = markets.filter(m => m.selected);
          const preferredCode = selectedMarkets.length > 0 ? selectedMarkets[0].code : 'PRIMARY';
          const marketKeys = Object.keys(savedAnalysis.marketInputData);
          // Try preferred market code first, then fall back to first available
          const targetKey = marketKeys.includes(preferredCode) ? preferredCode : marketKeys[0];
          const firstMarketData = targetKey ? savedAnalysis.marketInputData[targetKey] : null;

          if (firstMarketData) {
            activeMarketCodeRef.current = targetKey;
            loadSucceededRef.current = true;
            const rawLaunchDate = firstMarketData.marketLaunchDate || product?.projected_launch_date || '';
            // Ensure launch date is in YYYY-MM-DD format for the date input
            const launchDate = (() => {
              if (!rawLaunchDate) return '';
              const str = typeof rawLaunchDate === 'string' ? rawLaunchDate : new Date(rawLaunchDate).toISOString().split('T')[0];
              if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
              const parsed = new Date(str);
              return isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
            })();

            // Only use saved dev costs if they exist
            const savedDevCosts = firstMarketData.rndWorkCosts || 0;
            if (savedDevCosts > 0) {
              setDevCostsSource('saved');
            }

            const loadedInputs = {
              launchDate,
              forecastDurationYears: Math.floor((firstMarketData.forecastDuration || 60) / 12),
              monthlyUnits: firstMarketData.monthlySalesForecast || 0,
              unitPrice: firstMarketData.initialUnitPrice || 0,
              annualGrowthPercent: firstMarketData.annualSalesForecastChange || 0,
              cogsPerUnit: firstMarketData.initialVariableCost || 0,
              developmentCosts: savedDevCosts,
              discountRate: firstMarketData.discountRate || 10,
            };
            setInputs(loadedInputs);
            lastSavedInputs.current = loadedInputs;
          }
        } else {
          // Set defaults without auto-loading dev costs
          setInputs(prev => ({
            ...prev,
            launchDate: product?.projected_launch_date || '',
          }));
        }
      } catch {
        // Error loading data
      } finally {
        setIsLoading(false);
        // Mark initial load as complete after a short delay to prevent immediate auto-save
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 100);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId, product?.projected_launch_date, product?.actual_launch_date]);

  // Calculate NPV preview
  const npvPreview = useMemo(() => calculateSimpleNPV(inputs), [inputs]);

  // Build combined chart data with development phases + revenue projections
  const combinedChartData = useMemo((): CombinedChartDataPoint[] => {
    const data: CombinedChartDataPoint[] = [];
    const launchDate = inputs.launchDate ? new Date(inputs.launchDate) : null;
    
    // Sort phases by start date
    const sortedPhases = [...phaseBreakdown]
      .filter(p => p.startDate && p.totalBudget > 0)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    
    let cumulativeCost = 0;
    
    // Add development phases if we have phase data with dates
    if (sortedPhases.length > 0) {
      sortedPhases.forEach((phase) => {
        cumulativeCost -= phase.totalBudget;
        const phaseDate = new Date(phase.startDate!);
        data.push({
          label: format(phaseDate, 'MMM yyyy'),
          phase: phase.phaseName,
          cost: -phase.totalBudget,
          cumulative: cumulativeCost,
          type: 'dev',
        });
      });
      
      // Add launch marker if we have a launch date
      if (launchDate) {
        data.push({
          label: format(launchDate, 'MMM yyyy'),
          phase: 'Market Launch',
          cumulative: cumulativeCost,
          type: 'launch',
          isLaunch: true,
        });
      }
    } else if (inputs.developmentCosts > 0) {
      // Fallback: show dev costs as single point at "Dev" if no phase breakdown
      cumulativeCost = -inputs.developmentCosts;
      data.push({
        label: 'Dev',
        phase: 'Development',
        cost: -inputs.developmentCosts,
        cumulative: cumulativeCost,
        type: 'dev',
      });
      
      if (launchDate) {
        data.push({
          label: format(launchDate, 'MMM yyyy'),
          phase: 'Market Launch',
          cumulative: cumulativeCost,
          type: 'launch',
          isLaunch: true,
        });
      }
    }

    // Add post-launch revenue years
    const annualUnits = inputs.monthlyUnits * 12;
    for (let year = 1; year <= inputs.forecastDurationYears; year++) {
      const growthMultiplier = Math.pow(1 + inputs.annualGrowthPercent / 100, year - 1);
      const yearlyUnits = annualUnits * growthMultiplier;
      const yearlyRevenue = yearlyUnits * inputs.unitPrice;
      const yearlyCogs = yearlyUnits * inputs.cogsPerUnit;
      const yearlyProfit = yearlyRevenue - yearlyCogs;
      
      cumulativeCost += yearlyProfit;
      
      // Use actual year labels if we have launch date, otherwise generic Y1, Y2
      const yearLabel = launchDate 
        ? format(addMonths(launchDate, year * 12), 'yyyy')
        : `Y${year}`;
      
      data.push({
        label: yearLabel,
        revenue: yearlyRevenue,
        cumulative: cumulativeCost,
        type: 'revenue',
      });
    }
    
    return data;
  }, [inputs, phaseBreakdown]);

  // Find the launch index for reference line
  const launchIndex = combinedChartData.findIndex(d => d.isLaunch);

  const handleInputChange = (field: keyof EssentialInputs, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Auto-save function
  const saveData = useCallback(async (dataToSave: EssentialInputs) => {
    // If initial load didn't find existing data, only save if user entered something meaningful
    if (!loadSucceededRef.current) {
      const hasAnyInput =
        dataToSave.monthlyUnits > 0 ||
        dataToSave.unitPrice > 0 ||
        dataToSave.cogsPerUnit > 0 ||
        dataToSave.developmentCosts > 0 ||
        dataToSave.launchDate.length > 0;
      if (!hasAnyInput) return;
    }

    setSaveStatus('saving');
    try {
      // Use the same market code that was loaded to avoid data fragmentation
      const selectedMarkets = markets.filter(m => m.selected);
      const marketCode = activeMarketCodeRef.current ||
        (selectedMarkets.length > 0 ? selectedMarkets[0].code : 'PRIMARY');

      // Convert to full market input format for persistence
      const marketInputData = {
        [marketCode]: {
          marketLaunchDate: dataToSave.launchDate,
          forecastDuration: dataToSave.forecastDurationYears * 12,
          monthlySalesForecast: dataToSave.monthlyUnits,
          initialUnitPrice: dataToSave.unitPrice,
          annualSalesForecastChange: dataToSave.annualGrowthPercent,
          annualUnitPriceChange: 0,
          initialVariableCost: dataToSave.cogsPerUnit,
          rndWorkCosts: dataToSave.developmentCosts,
          rndMaterialMachineCosts: 0,
          rndPatentCosts: 0,
          totalMarketingBudget: 0,
          discountRate: dataToSave.discountRate,
          patentExpiry: new Date().getFullYear() + 16,
          postPatentDeclineRate: 30,
          cannibalizedRevenue: 0,
        },
      };

      // Build a complete NPVCalculationResult for persistence
      const totalRevenue = dataToSave.monthlyUnits * 12 * dataToSave.unitPrice * dataToSave.forecastDurationYears;
      const totalCosts = dataToSave.monthlyUnits * 12 * dataToSave.cogsPerUnit * dataToSave.forecastDurationYears;

      // Calculate NPV for persistence
      let npv = -dataToSave.developmentCosts;
      const annualUnits = dataToSave.monthlyUnits * 12;
      for (let year = 1; year <= dataToSave.forecastDurationYears; year++) {
        const growthMultiplier = Math.pow(1 + dataToSave.annualGrowthPercent / 100, year - 1);
        const yearlyUnits = annualUnits * growthMultiplier;
        const yearlyProfit = (yearlyUnits * dataToSave.unitPrice) - (yearlyUnits * dataToSave.cogsPerUnit);
        const discountFactor = Math.pow(1 + dataToSave.discountRate / 100, year);
        npv += yearlyProfit / discountFactor;
      }

      const calculationResult = {
        npv,
        totalRevenue,
        totalCosts,
        totalRndCosts: dataToSave.developmentCosts,
        totalCannibalizationLoss: 0,
        monthlyNetCashFlow: [],
        cumulativeNPV: [],
        monthlyResults: [],
        irr: 0,
        paybackPeriodMonths: -1,
        npvBreakEvenMonths: -1,
        totalProjectedRevenue: totalRevenue,
        totalProjectedProfit: totalRevenue - totalCosts - dataToSave.developmentCosts,
        averageAnnualProfitMargin: dataToSave.unitPrice > 0 ? ((dataToSave.unitPrice - dataToSave.cogsPerUnit) / dataToSave.unitPrice) * 100 : 0,
        marketName: marketCode,
        currency: 'USD',
      };

      const success = await persistenceService.saveMarketCalculation(
        productId,
        marketCode,
        marketInputData[marketCode] as any,
        calculationResult,
        'Base Case'
      );

      if (!success) {
        throw new Error('Failed to persist data');
      }

      // Mark load as succeeded since we now have saved data
      loadSucceededRef.current = true;
      activeMarketCodeRef.current = marketCode;

      // Invalidate queries so Genesis sidebar updates
      queryClient.invalidateQueries({ queryKey: ['funnel-npv-analysis', productId] });

      lastSavedInputs.current = dataToSave;
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
    } catch {
      setSaveStatus('error');
      toast.error('Failed to save revenue forecast');
    }
  }, [markets, productId, queryClient]);

  // Keep ref updated with latest saveData function
  useEffect(() => {
    saveDataRef.current = saveData;
  }, [saveData]);

  // Debounced auto-save (900ms delay) - stable reference using ref
  const debouncedSave = useMemo(
    () => debounce((data: EssentialInputs) => {
      if (saveDataRef.current) {
        saveDataRef.current(data);
      }
    }, 900),
    [] // Empty deps - debounce instance is stable, it calls through ref
  );

  // Trigger auto-save when inputs change
  useEffect(() => {
    // Skip auto-save during initial load
    if (isInitialLoad.current) {
      return;
    }

    // Check if data has actually changed
    if (lastSavedInputs.current && JSON.stringify(inputs) === JSON.stringify(lastSavedInputs.current)) {
      return;
    }

    setHasUnsavedChanges(true);
    debouncedSave(inputs);
  }, [inputs, debouncedSave]);

  // Field validation for visual feedback (yellow = needs input, green = filled)
  const fieldStatus = [
    { key: 'launchDate', label: 'Launch Date', filled: /^\d{4}-\d{2}-\d{2}$/.test(inputs.launchDate) },
    { key: 'forecastDurationYears', label: 'Forecast Duration', filled: inputs.forecastDurationYears > 0 },
    { key: 'monthlyUnits', label: 'Monthly Units', filled: inputs.monthlyUnits > 0 },
    { key: 'unitPrice', label: 'Unit Price', filled: inputs.unitPrice > 0 },
    { key: 'cogsPerUnit', label: 'COGS per Unit', filled: inputs.cogsPerUnit > 0 },
    { key: 'developmentCosts', label: 'Development Costs', filled: inputs.developmentCosts > 0 },
    { key: 'discountRate', label: 'Discount Rate', filled: inputs.discountRate > 0 },
    { key: 'annualGrowthPercent', label: 'Annual Growth %', filled: true }, // Optional
  ];

  const filledCount = fieldStatus.filter(f => f.filled).length;
  const totalFields = fieldStatus.length;
  const missingFields = fieldStatus.filter(f => !f.filled);

  const isFieldFilled = Object.fromEntries(fieldStatus.map(f => [f.key, f.filled])) as Record<string, boolean>;

  const getFieldBorderClass = (isFilled: boolean) => {
    return isFilled 
      ? 'border-2 border-green-500 focus-visible:ring-green-500' 
      : 'border-2 border-yellow-500 focus-visible:ring-yellow-500';
  };

  // Check if essential fields are filled (for completion tracking)
  // Step is complete only when ALL 8 fields are filled
  const isComplete =
    /^\d{4}-\d{2}-\d{2}$/.test(inputs.launchDate) &&
    inputs.forecastDurationYears > 0 &&
    inputs.monthlyUnits > 0 &&
    inputs.unitPrice > 0 &&
    inputs.cogsPerUnit > 0 &&
    inputs.developmentCosts > 0 &&
    inputs.discountRate > 0 &&
    inputs.annualGrowthPercent >= 0; // Growth can be 0 but must be set (default is 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Function to navigate to advanced rNPV page (non-genesis mode)
  const handleShowAdvanced = () => {
    // Navigate to the rNPV tab without mode=genesis to show the advanced chart
    navigate(`/app/product/${productId}/business-case?tab=rnpv`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
        {/* Genesis Step Notice - only show in Genesis mode */}
        {searchParams.get('mode') === 'genesis' && (
          <GenesisStepNotice
            stepNumber={21}
            stepName="Revenue Forecast"
          />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base lg:text-xl font-bold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
              <span className="truncate">Revenue Forecast</span>
            </h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Essential financial projections for investor presentations
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <SaveStatusIndicator
              status={saveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
              className="text-[10px]"
            />
            <Badge variant={isComplete ? "default" : "secondary"} className="gap-0.5 text-[10px] px-1.5 py-0.5">
              {isComplete ? (
                <>
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Complete
                </>
              ) : (
                'In Progress'
              )}
            </Badge>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card className="bg-muted/30">
          <CardContent className="py-2.5 px-3 sm:px-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-xs font-medium">Field Completion</span>
              <span className="text-[10px] sm:text-xs font-bold text-primary">{filledCount}/{totalFields} fields complete</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(filledCount / totalFields) * 100}%` }}
              />
            </div>
            {missingFields.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[9px] text-muted-foreground">Needs input:</span>
                {missingFields.map(field => (
                  <Badge
                    key={field.key}
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 border-yellow-500 text-yellow-600 dark:text-yellow-400"
                  >
                    {field.label}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Essential Inputs Form - Full width layout */}
        <div ref={formRef} className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Left Column - Inputs */}
          <div className="space-y-4 sm:space-y-6">
            {/* Timeline Section */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  When do you expect to launch?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-3 sm:px-6 pb-3">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="launchDate" className="text-xs">Launch Date</Label>
                    <Input
                      id="launchDate"
                      type="date"
                      value={inputs.launchDate}
                      onChange={(e) => handleInputChange('launchDate', e.target.value)}
                      className={`text-sm h-9 ${getFieldBorderClass(isFieldFilled.launchDate)}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="forecastDuration" className="text-xs">Forecast Duration (years)</Label>
                    <Input
                      id="forecastDuration"
                      type="number"
                      min={1}
                      max={20}
                      value={inputs.forecastDurationYears}
                      onChange={(e) => handleInputChange('forecastDurationYears', parseInt(e.target.value) || 5)}
                      className={`text-sm h-9 ${getFieldBorderClass(isFieldFilled.forecastDurationYears)}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Section */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  What are your sales expectations?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-3 sm:px-6 pb-3">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="monthlyUnits" className="text-xs">Monthly Units</Label>
                    <Input
                      id="monthlyUnits"
                      type="text"
                      inputMode="numeric"
                      value={inputs.monthlyUnits ? inputs.monthlyUnits.toLocaleString().replace(/,/g, ' ') : ''}
                      placeholder="e.g., 500"
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[\s,]/g, '');
                        handleInputChange('monthlyUnits', parseInt(rawValue) || 0);
                      }}
                      className={`text-sm h-9 ${getFieldBorderClass(isFieldFilled.monthlyUnits)}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="unitPrice" className="text-xs">Unit Price ($)</Label>
                    <Input
                      id="unitPrice"
                      type="text"
                      inputMode="decimal"
                      value={inputs.unitPrice ? inputs.unitPrice.toLocaleString().replace(/,/g, ' ') : ''}
                      placeholder="e.g., 2 000"
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[\s,]/g, '');
                        handleInputChange('unitPrice', parseFloat(rawValue) || 0);
                      }}
                      className={`text-sm h-9 ${getFieldBorderClass(isFieldFilled.unitPrice)}`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="annualGrowth" className="text-xs">Annual Growth (%)</Label>
                  <Input
                    id="annualGrowth"
                    type="number"
                    min={-100}
                    max={200}
                    value={inputs.annualGrowthPercent || ''}
                    placeholder="e.g., 15"
                    onChange={(e) => handleInputChange('annualGrowthPercent', parseFloat(e.target.value) || 0)}
                    className="text-sm h-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Costs Section */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  What are your costs?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-3 sm:px-6 pb-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cogsPerUnit" className="text-xs">COGS per Unit ($)</Label>
                  <Input
                    id="cogsPerUnit"
                    type="text"
                    inputMode="decimal"
                    value={inputs.cogsPerUnit ? inputs.cogsPerUnit.toLocaleString().replace(/,/g, ' ') : ''}
                    placeholder="e.g., 800"
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[\s,]/g, '');
                      handleInputChange('cogsPerUnit', parseFloat(rawValue) || 0);
                    }}
                    className={`text-sm h-9 ${getFieldBorderClass(isFieldFilled.cogsPerUnit)}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="developmentCosts" className="text-xs">Development Costs ($)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-5 text-[10px] px-2"
                        onClick={fetchDevCostsFromBudget}
                      >
                        Get from Budget
                      </Button>
                    </div>
                    {inputs.developmentCosts > 0 && devCostsSource !== 'manual' && (
                      <Badge variant="outline" className="text-[10px] w-fit">
                        {devCostsSource === 'milestones' ? 'From Budget' : 'Previously Saved'}
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="developmentCosts"
                    type="text"
                    inputMode="numeric"
                    value={inputs.developmentCosts ? inputs.developmentCosts.toLocaleString().replace(/,/g, ' ') : ''}
                    placeholder="e.g., 1 500 000"
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[\s,]/g, '');
                      handleInputChange('developmentCosts', parseFloat(rawValue) || 0);
                      setDevCostsSource('manual');
                    }}
                    className={`text-sm h-9 ${getFieldBorderClass(isFieldFilled.developmentCosts)}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discountRate" className="text-xs">Discount Rate (%)</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={inputs.discountRate}
                    onChange={(e) => handleInputChange('discountRate', parseFloat(e.target.value) || 10)}
                    className={`text-sm h-9 ${getFieldBorderClass(isFieldFilled.discountRate)}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4 sm:space-y-6">
            {/* NPV Preview Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">5-Year NPV</p>
                    <p className={`text-sm sm:text-base font-bold ${npvPreview.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(npvPreview.npv, 'USD')}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">Peak Revenue</p>
                    <p className="text-sm sm:text-base font-bold">
                      {formatCurrency(npvPreview.peakRevenue, 'USD')}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">Gross Margin</p>
                    <p className="text-sm sm:text-base font-bold">
                      {npvPreview.grossMargin.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">Break-even</p>
                    <p className="text-sm sm:text-base font-bold">
                      {npvPreview.breakEvenYear ? `Year ${npvPreview.breakEvenYear}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Projection Chart with Development Timeline */}
            {combinedChartData.length > 1 && (
              <Card>
                <CardHeader className="pb-1 pt-3 px-3 sm:px-6">
                  <CardTitle className="text-xs flex flex-wrap items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span>Product Lifecycle Cash Flow</span>
                    <Badge variant="secondary" className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      Essential
                    </Badge>
                    {phaseBreakdown.length > 0 && (
                      <Badge variant="outline" className="text-[9px]">
                        With Timeline
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-1 sm:px-4 pb-3">
                  <div className="h-[160px] sm:h-[200px] lg:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={combinedChartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDevCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="label"
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                          angle={-45}
                          textAnchor="end"
                          height={45}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={(v) => {
                            const absVal = Math.abs(v);
                            if (absVal >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                            if (absVal >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                            return `$${v}`;
                          }}
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          width={50}
                        />
                        {/* Zero reference line for break-even */}
                        <ReferenceLine 
                          y={0} 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeDasharray="3 3"
                          strokeWidth={1}
                        />
                        {/* Launch marker vertical line */}
                        {launchIndex >= 0 && (
                          <ReferenceLine 
                            x={combinedChartData[launchIndex]?.label}
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            label={{ 
                              value: '🚀 Launch', 
                              position: 'top',
                              fill: 'hsl(var(--primary))',
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          />
                        )}
                        <ChartTooltip 
                          formatter={(value: number, name: string) => {
                            const formattedValue = formatCurrency(Math.abs(value), 'USD');
                            if (name === 'cost') return [`-${formattedValue}`, 'Development Cost'];
                            if (name === 'revenue') return [formattedValue, 'Annual Revenue'];
                            return [value >= 0 ? formattedValue : `-${formattedValue}`, 'Cumulative Cash'];
                          }}
                          labelFormatter={(label, payload) => {
                            const dataPoint = payload?.[0]?.payload as CombinedChartDataPoint;
                            if (dataPoint?.phase) {
                              return `${dataPoint.phase} (${label})`;
                            }
                            return label;
                          }}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        {/* Development costs (negative) */}
                        <Area
                          type="monotone"
                          dataKey="cost"
                          stroke="hsl(0 84% 60%)"
                          fill="url(#colorDevCost)"
                          strokeWidth={2}
                          name="cost"
                          connectNulls={false}
                        />
                        {/* Revenue */}
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          fill="url(#colorRevenue)"
                          strokeWidth={2}
                          name="revenue"
                          connectNulls={false}
                        />
                        {/* Cumulative cash flow */}
                        <Area
                          type="monotone"
                          dataKey="cumulative"
                          stroke="hsl(142 76% 36%)"
                          fill="url(#colorCumulative)"
                          strokeWidth={2}
                          name="cumulative"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-[9px]">
                    {phaseBreakdown.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                        <span className="text-muted-foreground">Dev Costs</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Revenue</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
                      <span className="text-muted-foreground">Cumulative</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Alert */}
            <Alert className="py-2 px-3">
              <Info className="h-3 w-3" />
              <AlertDescription className="text-[10px] sm:text-xs leading-tight">
                This simplified forecast uses smart defaults for advanced parameters.
                Use "Show Advanced Options" for full control.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Export Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] sm:text-xs h-8 gap-1.5"
                        onClick={async () => {
                          try {
                            await RNPVExcelExportService.exportEssentialToExcel({
                              productName: product?.name || 'Product',
                              marketCode: markets.find(m => m.selected)?.code || 'PRIMARY',
                              currency: 'USD',
                              inputs: {
                                launchDate: inputs.launchDate,
                                forecastDurationYears: inputs.forecastDurationYears,
                                monthlyUnits: inputs.monthlyUnits,
                                unitPrice: inputs.unitPrice,
                                annualGrowthPercent: inputs.annualGrowthPercent,
                                cogsPerUnit: inputs.cogsPerUnit,
                                developmentCosts: inputs.developmentCosts,
                                discountRate: inputs.discountRate,
                              },
                              results: {
                                npv: npvPreview.npv,
                                peakRevenue: npvPreview.peakRevenue,
                                grossMargin: npvPreview.grossMargin,
                                breakEvenYear: npvPreview.breakEvenYear,
                                yearlyData: npvPreview.yearlyData,
                              },
                            });
                            toast.success('rNPV model exported to Excel');
                          } catch (error) {
                            toast.error('Failed to export rNPV data');
                          }
                        }}
                        disabled={isGenesis || inputs.monthlyUnits === 0 || inputs.unitPrice === 0}
                      >
                        {isGenesis ? <Lock className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                        Export to Excel
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isGenesis && (
                    <TooltipContent>Upgrade to HelixOS to export data</TooltipContent>
                  )}
                </Tooltip>

                {/* Advanced Toggle - Navigate to full Advanced rNPV page */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full justify-between text-[10px] sm:text-xs h-8"
                        onClick={handleShowAdvanced}
                        disabled={isGenesis}
                      >
                        <span className="flex items-center gap-1">
                          {isGenesis ? <Lock className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          Show Advanced Options
                        </span>
                        <Badge variant="secondary" className="text-[9px] px-1.5">
                          24+ fields
                        </Badge>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isGenesis && (
                    <TooltipContent>Upgrade to HelixOS to access advanced options</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
  );
}
