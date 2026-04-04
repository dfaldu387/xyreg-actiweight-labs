import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { addYears, addMonths } from 'date-fns';
import { StepUpValueChart } from './StepUpValueChart';
import { ValueEvolutionControls } from './ValueEvolutionControls';
import { CurrentValueSummary } from './CurrentValueSummary';
import { PhaseInflectionMarkers } from './PhaseInflectionMarkers';
import { generateStepUpCurve } from '@/utils/valueEvolutionCalculators';
import { 
  ValueEvolutionTabProps, 
  PhaseWithLoS, 
  SimulatedValues,
  ValueEvolutionConfig 
} from '@/types/valueEvolution';
import { PhaseBudgetData } from '@/services/enhanced-rnpv/budgetIntegrationService';

export function ValueEvolutionTab({
  productId,
  phases,
  npvData,
  marketInputs,
  currency,
  disabled = false,
}: ValueEvolutionTabProps) {
  // Convert PhaseBudgetData to PhaseWithLoS
  const phasesWithLoS: PhaseWithLoS[] = useMemo(() => {
    return phases.map((phase, index) => ({
      id: phase.phaseId,
      name: phase.phaseName,
      order: index, // Use index as order since PhaseBudgetData doesn't have order property
      startDate: phase.startDate ? new Date(phase.startDate) : null,
      endDate: phase.endDate ? new Date(phase.endDate) : null,
      budget: phase.totalBudget,
      likelihoodOfSuccess: phase.likelihoodOfSuccess ?? 80,
      isComplete: phase.status === 'Completed', // Derive from status field
      milestoneLabel: phase.phaseName,
    }));
  }, [phases]);

  // Get default dates from market inputs or phases
  const getDefaultDates = useCallback(() => {
    // Find earliest start date from phases
    const startDates = phasesWithLoS
      .filter(p => p.startDate)
      .map(p => p.startDate!);
    const projectStartDate = startDates.length > 0 
      ? new Date(Math.min(...startDates.map(d => d.getTime())))
      : new Date();

    // Find launch date from market inputs or use last phase end + 6 months
    let launchDate: Date;
    const firstMarket = Object.values(marketInputs)[0] as any;
    if (firstMarket?.launchDate) {
      launchDate = new Date(firstMarket.launchDate);
    } else {
      const endDates = phasesWithLoS
        .filter(p => p.endDate)
        .map(p => p.endDate!);
      launchDate = endDates.length > 0 
        ? addMonths(new Date(Math.max(...endDates.map(d => d.getTime()))), 3)
        : addYears(new Date(), 3);
    }

    // IP expiry from market inputs or default to launch + 16 years
    const patentExpiry = firstMarket?.patentExpiry ?? (launchDate.getFullYear() + 16);
    const ipExpiryDate = new Date(patentExpiry, 11, 31); // End of expiry year

    return { projectStartDate, launchDate, ipExpiryDate };
  }, [phasesWithLoS, marketInputs]);

  const defaultDates = useMemo(() => getDefaultDates(), [getDefaultDates]);

  // Simulation state
  const [simulatedValues, setSimulatedValues] = useState<SimulatedValues>({
    phaseLoS: {},
    launchDate: null,
    ipExpiryDate: null,
  });

  // Effective values (simulated or default)
  const effectiveLaunchDate = simulatedValues.launchDate ?? defaultDates.launchDate;
  const effectiveIpExpiry = simulatedValues.ipExpiryDate ?? defaultDates.ipExpiryDate;

  // Get effective LoS for each phase
  const effectivePhases = useMemo(() => {
    return phasesWithLoS.map(phase => ({
      ...phase,
      likelihoodOfSuccess: simulatedValues.phaseLoS[phase.id] ?? phase.likelihoodOfSuccess,
    }));
  }, [phasesWithLoS, simulatedValues.phaseLoS]);

  // Calculate future cash flows (UNDISCOUNTED) at launch
  // Value Evolution uses: Current = (FutureCashFlows / (1+r)^t) × LoS
  // So futureCashFlows should be UNDISCOUNTED total profit over the revenue lifetime
  const futureCashFlows = useMemo(() => {
    const firstMarket = Object.values(marketInputs)[0] as any;
    
    if (!firstMarket) {
      // Fallback to npvData if no market inputs
      const firstMarketResult = Object.values(npvData)[0] as any;
      if (firstMarketResult?.npv) {
        // NPV is already discounted, so we need to "undiscount" it
        // This is an approximation
        const avgDiscountYears = 5; // Approximate mid-point of cash flows
        const discountRate = (firstMarket?.discountRate || 10) / 100;
        const undiscounted = firstMarketResult.npv * Math.pow(1 + discountRate, avgDiscountYears);
        console.log('[ValueEvolution] Undiscounting NPV:', { npv: firstMarketResult.npv, undiscounted });
        return undiscounted;
      }
      return 1000000;
    }
    
    // Calculate UNDISCOUNTED total profit from market inputs
    // This gives us the "what it's worth at launch if everything goes right"
    const monthlyUnits = firstMarket.monthlySalesForecast || 0;
    const unitPrice = firstMarket.initialUnitPrice || 0;
    const unitCost = firstMarket.manufacturingCosts || 0;
    const projectLifetime = firstMarket.projectLifetime || 5;
    const annualGrowth = (firstMarket.annualSalesForecastChange || 0) / 100;
    const priceGrowth = (firstMarket.annualUnitPriceChange || 0) / 100;
    const fixedCosts = (firstMarket.marketingCosts || 0) + (firstMarket.operationalCosts || 0);
    const developmentCosts = (firstMarket.developmentCosts || 0) + 
                             (firstMarket.clinicalTrialCosts || 0) + 
                             (firstMarket.regulatoryCosts || 0);
    
    let totalProfit = 0;
    for (let year = 1; year <= projectLifetime; year++) {
      const yearlyUnits = monthlyUnits * 12 * Math.pow(1 + annualGrowth, year - 1);
      const yearlyPrice = unitPrice * Math.pow(1 + priceGrowth, year - 1);
      const yearlyRevenue = yearlyUnits * yearlyPrice;
      const yearlyCosts = (yearlyUnits * unitCost) + fixedCosts;
      totalProfit += yearlyRevenue - yearlyCosts;
    }
    
    // Subtract development costs
    const netProfit = totalProfit - developmentCosts;
    
    console.log('[ValueEvolution] Calculated undiscounted future cash flows:', {
      monthlyUnits,
      unitPrice,
      projectLifetime,
      totalProfit,
      developmentCosts,
      netProfit
    });
    
    return Math.max(netProfit, 0);
  }, [npvData, marketInputs]);

  // Get discount rate from market inputs
  const discountRate = useMemo(() => {
    const firstMarket = Object.values(marketInputs)[0] as any;
    return (firstMarket?.discountRate ?? 10) / 100;
  }, [marketInputs]);

  // Generate the step-up curve
  const evolutionResult = useMemo(() => {
    const config: ValueEvolutionConfig = {
      discountRate,
      ipExpiryDate: effectiveIpExpiry,
      launchDate: effectiveLaunchDate,
      projectStartDate: defaultDates.projectStartDate,
      currentDate: new Date(),
      futureCashFlows,
      phases: effectivePhases,
      declineType: 'linear',
    };

    return generateStepUpCurve(config);
  }, [
    discountRate, 
    effectiveIpExpiry, 
    effectiveLaunchDate, 
    defaultDates.projectStartDate, 
    futureCashFlows, 
    effectivePhases
  ]);

  // Handlers
  const handlePhaseLoSChange = useCallback((phaseId: string, newLoS: number) => {
    setSimulatedValues(prev => ({
      ...prev,
      phaseLoS: {
        ...prev.phaseLoS,
        [phaseId]: newLoS,
      },
    }));
  }, []);

  const handleLaunchDateChange = useCallback((newDate: Date) => {
    setSimulatedValues(prev => ({
      ...prev,
      launchDate: newDate,
    }));
  }, []);

  const handleIpExpiryChange = useCallback((newDate: Date) => {
    setSimulatedValues(prev => ({
      ...prev,
      ipExpiryDate: newDate,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setSimulatedValues({
      phaseLoS: {},
      launchDate: null,
      ipExpiryDate: null,
    });
  }, []);

  // Check if we have valid data
  if (!phasesWithLoS.length || futureCashFlows <= 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Value Evolution requires project phases with budgets and market NPV data.
            <br />
            Please complete the Analysis tab first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Value Evolution
          </CardTitle>
          <CardDescription>
            Track how project asset value evolves through development phases, peaks at launch, 
            and declines toward IP expiry. Adjust parameters to see real-time impact on current value.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Metrics */}
      <CurrentValueSummary
        currentValue={evolutionResult.currentValue}
        peakValue={evolutionResult.peakValue}
        cumulativeLoS={evolutionResult.cumulativeLoS}
        currentSpend={evolutionResult.currentSpend}
        netValueCreated={evolutionResult.netValueCreated}
        monthsToLaunch={evolutionResult.monthsToLaunch}
        currency={currency}
      />

      {/* Main Chart and Controls */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Chart - Takes 3 columns */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Asset Value Timeline</CardTitle>
            <CardDescription>
              Stepped S-curve showing value inflection points at phase completions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StepUpValueChart
              dataPoints={evolutionResult.dataPoints}
              inflectionPoints={evolutionResult.inflectionPoints}
              currentValue={evolutionResult.currentValue}
              peakValue={evolutionResult.peakValue}
              launchDate={effectiveLaunchDate}
              ipExpiryDate={effectiveIpExpiry}
              currentDate={new Date()}
              currency={currency}
            />
          </CardContent>
        </Card>

        {/* Controls - Takes 1 column */}
        <div className="space-y-6">
          <ValueEvolutionControls
            phases={effectivePhases}
            simulatedLoS={simulatedValues.phaseLoS}
            launchDate={effectiveLaunchDate}
            ipExpiryDate={effectiveIpExpiry}
            onPhaseLoSChange={handlePhaseLoSChange}
            onLaunchDateChange={handleLaunchDateChange}
            onIpExpiryChange={handleIpExpiryChange}
            onReset={handleReset}
            currency={currency}
          />

          <PhaseInflectionMarkers
            inflectionPoints={evolutionResult.inflectionPoints}
            currentDate={new Date()}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}
