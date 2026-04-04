import { useMemo, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/utils/marketCurrencyUtils';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, ReferenceLine, Line 
} from 'recharts';
import { format, addMonths, differenceInDays, addDays } from 'date-fns';
import { BudgetIntegrationService, PhaseBudgetData } from '@/services/enhanced-rnpv/budgetIntegrationService';

interface CombinedChartDataPoint {
  label: string;
  timestamp: number; // milliseconds for proper x-axis scaling
  phase?: string;
  cost?: number;
  revenue?: number;
  cumulative: number;
  cumulativeRiskAdjusted?: number;
  cumulativeNPV?: number; // Nominal NPV (time-value discounted without LoS)
  discountRate?: number; // For tooltip display
  type: 'dev' | 'launch' | 'revenue';
  isLaunch?: boolean;
  cumulativeLoS?: number; // LoS: Likelihood of Success
}

interface ProductLifecycleCashFlowChartProps {
  productId: string;
  launchDate?: string | Date | null;
  npvData?: {
    npv: number;
    marketInputData?: Record<string, any>;
  } | null;
  currency?: string;
  variant?: 'compact' | 'full';
  /** Initial zoom level: 1 = full timeline (Essential), 8 = zoomed on dev phases (Advanced) */
  initialZoomLevel?: number;
  className?: string;
}

export function ProductLifecycleCashFlowChart({ 
  productId,
  launchDate,
  npvData, 
  currency = 'USD',
  variant = 'full',
  initialZoomLevel = 8,
  className = ''
}: ProductLifecycleCashFlowChartProps) {
  const [phaseBreakdown, setPhaseBreakdown] = useState<PhaseBudgetData[]>([]);
  const [zoomLevel, setZoomLevel] = useState(initialZoomLevel); // Use prop for initial zoom
  const [zoomOffset, setZoomOffset] = useState(0); // 0 = start, positive = scroll right

  // Load phase breakdown for development timeline
  useEffect(() => {
    const loadPhaseBreakdown = async () => {
      if (!productId) return;
      
      try {
        const effectiveLaunchDate = launchDate ? new Date(launchDate) : undefined;
        const budgetSummary = await BudgetIntegrationService.getProductPhaseBudgetSummary(
          productId, 
          effectiveLaunchDate
        );
        
        if (budgetSummary?.phaseBreakdown) {
          setPhaseBreakdown(budgetSummary.phaseBreakdown);
        }
      } catch {
        // Failed to load phase breakdown - chart will use fallback data
      }
    };

    loadPhaseBreakdown();
  }, [productId, launchDate]);

  // Extract input data including market risks
  const inputData = useMemo(() => {
    if (!npvData?.marketInputData) return null;
    
    const marketKeys = Object.keys(npvData.marketInputData);
    if (marketKeys.length === 0) return null;

    const firstMarket = npvData.marketInputData[marketKeys[0]];
    if (!firstMarket) return null;

    // Extract market-specific risks (used post-launch)
    // These are input as risk percentages (e.g., 20% = 20), convert to success rate
    const regulatoryRisk = firstMarket.regulatoryRisk || 0;
    const commercialRisk = firstMarket.commercialRisk || 0;
    const competitiveRisk = firstMarket.competitiveRisk || 0;
    
    // Post-launch multiplier: (100 - Reg%) × (100 - Comm%) × (100 - Comp%) / 1,000,000
    // e.g., if each risk is 20%, multiplier = 0.8 × 0.8 × 0.8 = 0.512
    const postLaunchSuccessMultiplier = 
      ((100 - regulatoryRisk) / 100) * 
      ((100 - commercialRisk) / 100) * 
      ((100 - competitiveRisk) / 100);

    return {
      monthlyUnits: firstMarket.monthlySalesForecast || 0,
      unitPrice: firstMarket.initialUnitPrice || 0,
      annualGrowth: firstMarket.annualSalesForecastChange || 0,
      cogsPerUnit: firstMarket.initialVariableCost || 0,
      forecastYears: Math.floor((firstMarket.forecastDuration || 60) / 12),
      developmentCosts: firstMarket.rndWorkCosts || 0,
      launchDate: firstMarket.marketLaunchDate || launchDate,
      // Market risks for post-launch rNPV calculation
      regulatoryRisk,
      commercialRisk,
      competitiveRisk,
      postLaunchSuccessMultiplier,
      // Discount rate for NPV calculation
      discountRate: firstMarket.discountRate || 10, // Default 10% annual
    };
  }, [npvData, launchDate]);

  // Calculate cumulative LoS from all development phases
  const cumulativeLoS = useMemo(() => {
    const phasesWithLoS = phaseBreakdown.filter(p => p.likelihoodOfSuccess > 0);
    if (phasesWithLoS.length === 0) return 100;
    
    // Multiply all phase LoS values together
    const cumLoS = phasesWithLoS.reduce((acc, phase) => {
      return acc * (phase.likelihoodOfSuccess / 100);
    }, 1) * 100;
    
    // console.log('[ProductLifecycleCashFlowChart] Phase LoS:', phasesWithLoS.map(p => 
    //   `${p.phaseName}: ${p.likelihoodOfSuccess}%`
    // ), 'Cumulative:', cumLoS.toFixed(1) + '%');
    
    return cumLoS;
  }, [phaseBreakdown]);

  // Helper: Calculate prorated monthly cost for a phase
  const getPhaseMonthlyRate = useCallback((phase: PhaseBudgetData) => {
    const phaseStart = new Date(phase.startDate!).getTime();
    const phaseEnd = phase.endDate 
      ? new Date(phase.endDate).getTime() 
      : phaseStart + (90 * 24 * 60 * 60 * 1000); // 90-day default
    
    const durationDays = (phaseEnd - phaseStart) / (24 * 60 * 60 * 1000);
    const durationMonths = Math.max(1, durationDays / 30.44);
    return phase.totalBudget / durationMonths;
  }, []);

  // Build combined chart data with development phases + revenue projections
  // Uses timestamps for proper time-based x-axis scaling
  const combinedChartData = useMemo((): CombinedChartDataPoint[] => {
    if (!inputData) return [];
    
    const data: CombinedChartDataPoint[] = [];
    const parsedLaunchDate = inputData.launchDate ? new Date(inputData.launchDate) : null;
    
    const formDevCosts = inputData.developmentCosts || 0;
    // Manual override mode: if formDevCosts > 0, spread that total evenly across active phase months
    const useManualDevCost = formDevCosts > 0;
    
    // Get discount rate from input data (default 10% annual = 0.833% monthly)
    const annualDiscountRate = inputData.discountRate || 10;
    const monthlyDiscountRate = annualDiscountRate / 100 / 12;
    
    // COST phases: phases with budgets (for dollar calculations)
    const costPhases = [...phaseBreakdown]
      .filter(p => p.startDate && p.totalBudget > 0)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    
    // LOS phases: ALL phases with dates (for probability calculations)
    const losPhases = [...phaseBreakdown]
      .filter(p => p.startDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    
    // Calculate active phase months for manual spread (only if manual override)
    let manualMonthlyRate = 0;
    if (useManualDevCost && (costPhases.length > 0 || losPhases.length > 0)) {
      // Count unique months where at least one phase is active
      const allPhasesWithDates = [...costPhases, ...losPhases];
      const earliestStart = new Date(Math.min(...allPhasesWithDates.map(p => new Date(p.startDate!).getTime())));
      const allPhaseEnds = allPhasesWithDates.map(p => 
        p.endDate ? new Date(p.endDate).getTime() : new Date(p.startDate!).getTime() + (90 * 24 * 60 * 60 * 1000)
      );
      const latestPhaseEnd = Math.max(...allPhaseEnds);
      const devEndDate = parsedLaunchDate ? Math.min(parsedLaunchDate.getTime(), latestPhaseEnd) : latestPhaseEnd;
      
      // Build phase intervals
      const phaseIntervals = allPhasesWithDates.map(phase => {
        const start = new Date(phase.startDate!).getTime();
        const end = phase.endDate ? new Date(phase.endDate).getTime() : start + (90 * 24 * 60 * 60 * 1000);
        return { start, end };
      });
      
      // Count active months
      let activeMonthCount = 0;
      let checkDate = addMonths(earliestStart, 1);
      while (checkDate.getTime() <= devEndDate) {
        const checkTime = checkDate.getTime();
        const isActive = phaseIntervals.some(({ start, end }) => checkTime > start && checkTime <= end);
        if (isActive) activeMonthCount++;
        checkDate = addMonths(checkDate, 1);
      }
      
      // Calculate even monthly rate
      manualMonthlyRate = activeMonthCount > 0 ? formDevCosts / activeMonthCount : formDevCosts;
    }
    
    let cumulativeCost = 0;
    let cumulativeRiskAdjustedCost = 0; // Track risk-adjusted costs separately
    let cumulativeNPVCost = 0; // Track time-discounted NPV separately (no LoS)
    let runningCumulativeLoS = 1; // Start at 1 (100%) as a multiplier
    let monthIndex = 0; // For discounting
    
    // Determine if we have any phases to process (cost OR los)
    const hasPhases = costPhases.length > 0 || losPhases.length > 0;
    
    // Add development phases as monthly data points
    if (hasPhases) {
      // Use earliest start from either cost or los phases
      const allPhasesWithDates = [...costPhases, ...losPhases];
      const earliestStart = new Date(Math.min(...allPhasesWithDates.map(p => new Date(p.startDate!).getTime())));
      
      // Calculate monthly cost rate for each COST phase (for milestone-based burn)
      const phaseRates = costPhases.map(phase => {
        const phaseStart = new Date(phase.startDate!).getTime();
        const phaseEnd = phase.endDate 
          ? new Date(phase.endDate).getTime() 
          : phaseStart + (90 * 24 * 60 * 60 * 1000);
        const monthlyRate = getPhaseMonthlyRate(phase);
        
        return { phase, startTime: phaseStart, endTime: phaseEnd, monthlyRate };
      });
      
      // Build LoS intervals from ALL phases with dates (for probability tracking)
      const losPhaseIntervals = losPhases.map(phase => {
        const phaseStart = new Date(phase.startDate!).getTime();
        const phaseEnd = phase.endDate 
          ? new Date(phase.endDate).getTime() 
          : phaseStart + (90 * 24 * 60 * 60 * 1000);
        const phaseLoS = (phase.likelihoodOfSuccess || 100) / 100;
        
        return { phase, startTime: phaseStart, endTime: phaseEnd, phaseLoS };
      });
      
      // Determine end of development: launch date or latest phase end (from EITHER cost or LoS phases)
      const allPhaseEnds = [...phaseRates.map(p => p.endTime), ...losPhaseIntervals.map(p => p.endTime)];
      const latestPhaseEnd = allPhaseEnds.length > 0 ? Math.max(...allPhaseEnds) : Date.now();
      const devEndDate = parsedLaunchDate || new Date(latestPhaseEnd);
      
      // Start point at $0
      data.push({
        label: format(earliestStart, 'MMM yyyy'),
        timestamp: earliestStart.getTime(),
        phase: 'Start',
        cost: 0,
        cumulative: 0,
        cumulativeRiskAdjusted: 0,
        cumulativeNPV: 0,
        discountRate: annualDiscountRate,
        cumulativeLoS: 100, // Display as percentage
        type: 'dev',
      });
      
      // Generate monthly data points
      let currentDate = addMonths(earliestStart, 1);
      const processedLoSPhaseEnds = new Set<string>();
      
      while (currentDate <= devEndDate) {
        const currentTime = currentDate.getTime();
        
        // Determine if any phase is active this month (for both milestone and manual modes)
        let activeCostPhaseNames: string[] = [];
        let anyPhaseActive = false;
        
        // Track which phase position each phase belongs to (for commitment rule)
        const phasePositionMap = new Map<string, number>();
        phaseRates.forEach(({ phase }, idx) => {
          phasePositionMap.set(phase.phaseName, idx);
        });

        // Check for active COST phases
        phaseRates.forEach(({ phase, startTime, endTime, monthlyRate }) => {
          if (currentTime > startTime && currentTime <= endTime) {
            activeCostPhaseNames.push(phase.phaseName);
            anyPhaseActive = true;
          }
        });
        
        // Also check LOS phases for activity (they may not have budget but still count as active)
        losPhaseIntervals.forEach(({ phase, startTime, endTime }) => {
          if (currentTime > startTime && currentTime <= endTime) {
            anyPhaseActive = true;
          }
        });
        
        // Calculate monthly cost based on mode
        let monthlyTotalCost = 0;
        if (useManualDevCost) {
          // Manual override: spread evenly across active months only
          if (anyPhaseActive) {
            monthlyTotalCost = manualMonthlyRate;
          }
        } else {
          // Milestone mode: sum prorated monthly costs from active phases
          phaseRates.forEach(({ phase, startTime, endTime, monthlyRate }) => {
            if (currentTime > startTime && currentTime <= endTime) {
              monthlyTotalCost += monthlyRate;
            }
          });
        }
        
        // Track LoS from ALL phases (losPhaseIntervals), not just cost phases
        // completedLoS: phases that have ended by this month
        losPhaseIntervals.forEach(({ phase, startTime, endTime, phaseLoS }) => {
          // Mark phase as completed when it ends
          if (currentTime >= endTime && !processedLoSPhaseEnds.has(phase.phaseName)) {
            runningCumulativeLoS *= phaseLoS;
            processedLoSPhaseEnds.add(phase.phaseName);
          }
        });
        
        // Calculate current LoS for active LoS phases (phases we're currently in)
        let activePhaseLoS = 1;
        let activeLoSPhaseNames: string[] = [];
        losPhaseIntervals.forEach(({ phase, startTime, endTime, phaseLoS }) => {
          // Phase is active if we're between start and end, and it hasn't been processed as completed
          if (currentTime > startTime && currentTime < endTime && !processedLoSPhaseEnds.has(phase.phaseName)) {
            activePhaseLoS *= phaseLoS;
            activeLoSPhaseNames.push(phase.phaseName);
          }
        });
        
        // Effective LoS = completed phases LoS × active phases LoS
        const effectiveLoS = runningCumulativeLoS * activePhaseLoS;
        
        // Accumulate NOMINAL costs (negative values) - what you actually pay
        cumulativeCost -= monthlyTotalCost;
        
        // CURRENT PHASE COMMITMENT RULE:
        // rNPV for costs: Apply the current effective LoS to reflect expected value
        // This shows what the project is "worth" given probability of success
        // Higher LoS = costs are more "real"; Lower LoS = costs are more discounted
        cumulativeRiskAdjustedCost -= monthlyTotalCost * effectiveLoS;
        
        // NPV: Time-value discount only (no probability weighting)
        const discountFactor = 1 / Math.pow(1 + monthlyDiscountRate, monthIndex);
        cumulativeNPVCost -= monthlyTotalCost * discountFactor;
        monthIndex++;
        
        // Combine cost phase names and LoS-only phase names for display
        const allActivePhaseNames = [...new Set([...activeCostPhaseNames, ...activeLoSPhaseNames])];
        
        data.push({
          label: format(currentDate, 'MMM yyyy'),
          timestamp: currentTime,
          phase: allActivePhaseNames.length > 0 ? allActivePhaseNames.join(' + ') : undefined,
          cost: monthlyTotalCost > 0 ? -monthlyTotalCost : undefined,
          cumulative: cumulativeCost,
          cumulativeRiskAdjusted: cumulativeRiskAdjustedCost,
          cumulativeNPV: cumulativeNPVCost,
          discountRate: annualDiscountRate,
          cumulativeLoS: effectiveLoS * 100,
          type: 'dev',
        });
        
        currentDate = addMonths(currentDate, 1);
      }
      
      // Add launch marker
      if (parsedLaunchDate) {
        const existingLaunchPoint = data.find(d => d.timestamp === parsedLaunchDate.getTime());
        if (existingLaunchPoint) {
          existingLaunchPoint.isLaunch = true;
          existingLaunchPoint.type = 'launch';
          existingLaunchPoint.phase = 'Market Launch';
        } else {
          data.push({
            label: format(parsedLaunchDate, 'MMM yyyy'),
            timestamp: parsedLaunchDate.getTime(),
            phase: 'Market Launch',
            cumulative: cumulativeCost,
            cumulativeRiskAdjusted: cumulativeRiskAdjustedCost,
            cumulativeNPV: cumulativeNPVCost,
            discountRate: annualDiscountRate,
            cumulativeLoS: runningCumulativeLoS * 100,
            type: 'launch',
            isLaunch: true,
          });
        }
      }
    } else if (inputData.developmentCosts > 0) {
      // Fallback: single dev cost point
      const fallbackDate = parsedLaunchDate ? addMonths(parsedLaunchDate, -12) : new Date();
      cumulativeCost = -inputData.developmentCosts;
      cumulativeRiskAdjustedCost = -inputData.developmentCosts * (cumulativeLoS / 100);
      cumulativeNPVCost = -inputData.developmentCosts; // No time discount for fallback
      data.push({
        label: 'Dev',
        timestamp: fallbackDate.getTime(),
        phase: 'Development',
        cost: -inputData.developmentCosts,
        cumulative: cumulativeCost,
        cumulativeRiskAdjusted: cumulativeRiskAdjustedCost,
        cumulativeNPV: cumulativeNPVCost,
        discountRate: annualDiscountRate,
        cumulativeLoS: cumulativeLoS,
        type: 'dev',
      });
      
      if (parsedLaunchDate) {
        data.push({
          label: format(parsedLaunchDate, 'MMM yyyy'),
          timestamp: parsedLaunchDate.getTime(),
          phase: 'Market Launch',
          cumulative: cumulativeCost,
          cumulativeRiskAdjusted: cumulativeRiskAdjustedCost,
          cumulativeNPV: cumulativeNPVCost,
          discountRate: annualDiscountRate,
          cumulativeLoS: cumulativeLoS,
          type: 'launch',
          isLaunch: true,
        });
      }
    }

    // POST-LAUNCH RISK MODEL CHANGE:
    // Pre-launch: Revenue × PhaseLoS × (Reg × Comm × Comp) - development probability
    // Post-launch: Revenue × 1.0 × (Reg × Comm × Comp) - only market risks apply
    // Technical Risk (PhaseLoS) is "retired" once launched - the device has been validated
    
    // Risk-adjusted continues from the development phase value
    let cumulativeRiskAdjusted = cumulativeRiskAdjustedCost;
    
    // NPV continues from development phase
    let cumulativeNPV = cumulativeNPVCost;
    
    // Post-launch uses only market risks (Reg × Comm × Comp), NOT PhaseLoS
    const postLaunchMultiplier = inputData.postLaunchSuccessMultiplier;

    // Add post-launch revenue - MONTHLY for smoother chart
    if (parsedLaunchDate && inputData.monthlyUnits > 0) {
      const monthlyRevenue = inputData.monthlyUnits * inputData.unitPrice;
      const monthlyCogs = inputData.monthlyUnits * inputData.cogsPerUnit;
      const monthlyProfit = monthlyRevenue - monthlyCogs;
      const totalMonths = inputData.forecastYears * 12;

      for (let month = 1; month <= totalMonths; month++) {
        // Apply annual growth at year boundaries
        const year = Math.floor((month - 1) / 12);
        const growthMultiplier = Math.pow(1 + inputData.annualGrowth / 100, year);
        const adjustedMonthlyProfit = monthlyProfit * growthMultiplier;
        
        // Nominal: full profit added
        cumulativeCost += adjustedMonthlyProfit;
        
        // Risk-adjusted: POST-LAUNCH uses market risks only (Reg × Comm × Comp)
        // PhaseLoS (Technical/Development risk) is "retired" - device is validated
        cumulativeRiskAdjusted += adjustedMonthlyProfit * postLaunchMultiplier;
        
        // NPV: Time-value discount (from project start, not launch)
        const postLaunchMonthIndex = monthIndex + month;
        const discountFactor = 1 / Math.pow(1 + monthlyDiscountRate, postLaunchMonthIndex);
        cumulativeNPV += adjustedMonthlyProfit * discountFactor;
        
        const monthDate = addMonths(parsedLaunchDate, month);
        
        data.push({
          label: format(monthDate, 'MMM yyyy'),
          timestamp: monthDate.getTime(),
          revenue: monthlyRevenue * growthMultiplier,
          cumulative: cumulativeCost,
          cumulativeRiskAdjusted: cumulativeRiskAdjusted,
          cumulativeNPV: cumulativeNPV,
          discountRate: annualDiscountRate,
          cumulativeLoS: postLaunchMultiplier * 100, // Post-launch: market risks only
          type: 'revenue',
        });
      }
    }
    
    return data;
  }, [inputData, phaseBreakdown, cumulativeLoS, getPhaseMonthlyRate]);

  // Find the launch index for reference line
  const launchIndex = combinedChartData.findIndex(d => d.isLaunch);

  // Calculate zoomed domain for x-axis
  const zoomedDomain = useMemo(() => {
    if (combinedChartData.length < 2) return ['dataMin', 'dataMax'];
    
    const timestamps = combinedChartData.map(d => d.timestamp);
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const fullRange = maxTs - minTs;
    
    if (zoomLevel <= 1) {
      return [minTs, maxTs];
    }
    
    // Calculate visible range based on zoom level
    const visibleRange = fullRange / zoomLevel;
    const maxOffset = fullRange - visibleRange;
    const clampedOffset = Math.min(Math.max(zoomOffset, 0), maxOffset);
    
    return [minTs + clampedOffset, minTs + clampedOffset + visibleRange];
  }, [combinedChartData, zoomLevel, zoomOffset]);

  // Compute dynamic Y-axis domain based on visible data when zoomed
  // Only scale to cumulative lines (not revenue/cost bars) so lines are always readable
  const yDomain = useMemo((): [number, number] | undefined => {
    // Only apply dynamic scaling when zoomed in
    if (zoomLevel <= 1 || !Array.isArray(zoomedDomain)) return undefined;
    
    const [domainStart, domainEnd] = zoomedDomain as [number, number];
    
    // Filter data to visible time window
    const visibleData = combinedChartData.filter(
      d => d.timestamp >= domainStart && d.timestamp <= domainEnd
    );
    
    if (visibleData.length === 0) return undefined;
    
    // Only collect cumulative line values (not revenue/cost bars)
    // This ensures the lines we care about are always readable
    const yValues: number[] = [];
    visibleData.forEach(d => {
      if (d.cumulative !== undefined && d.cumulative !== null) yValues.push(d.cumulative);
      if (d.cumulativeRiskAdjusted !== undefined && d.cumulativeRiskAdjusted !== null) yValues.push(d.cumulativeRiskAdjusted);
    });
    
    if (yValues.length === 0) return undefined;
    
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);
    
    // Always include 0 so break-even line is visible
    if (minY > 0) minY = 0;
    if (maxY < 0) maxY = 0;
    
    // Calculate range and ensure minimum readable range
    let range = maxY - minY;
    const minRange = 2000; // At least $2K visible range for readability
    
    if (range < minRange) {
      const midpoint = (minY + maxY) / 2;
      minY = Math.min(minY, midpoint - minRange / 2);
      maxY = Math.max(maxY, midpoint + minRange / 2);
      // Re-include 0 after adjustment
      if (minY > 0) minY = 0;
      if (maxY < 0) maxY = 0;
      range = maxY - minY;
    }
    
    // Add 20% padding so lines don't touch edges
    const padding = range * 0.20;
    return [minY - padding, maxY + padding];
  }, [combinedChartData, zoomedDomain, zoomLevel]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.5, 32));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newLevel = Math.max(prev / 1.5, 1);
      if (newLevel <= 1) setZoomOffset(0);
      return newLevel;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setZoomOffset(0);
  }, []);

  const handlePanLeft = useCallback(() => {
    if (combinedChartData.length < 2) return;
    const timestamps = combinedChartData.map(d => d.timestamp);
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const fullRange = maxTs - minTs;
    const step = fullRange / (zoomLevel * 4);
    setZoomOffset(prev => Math.max(prev - step, 0));
  }, [combinedChartData, zoomLevel]);

  const handlePanRight = useCallback(() => {
    if (combinedChartData.length < 2) return;
    const timestamps = combinedChartData.map(d => d.timestamp);
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const fullRange = maxTs - minTs;
    const visibleRange = fullRange / zoomLevel;
    const maxOffset = fullRange - visibleRange;
    const step = fullRange / (zoomLevel * 4);
    setZoomOffset(prev => Math.min(prev + step, maxOffset));
  }, [combinedChartData, zoomLevel]);

  if (combinedChartData.length < 2) {
    return null;
  }

  const chartHeight = variant === 'compact' ? 180 : 320;
  const showLegend = variant === 'full';

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>Product Lifecycle Cash Flow</span>
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
              Advanced
            </Badge>
            {phaseBreakdown.length > 0 && (
              <Badge variant="outline" className="text-xs ml-2">
                With Development Timeline
              </Badge>
            )}
          </CardTitle>
          
          {/* Zoom Controls - always visible */}
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs mr-1">
              {zoomLevel.toFixed(1)}x
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePanLeft}
              disabled={zoomLevel <= 1}
              className="h-7 w-7 p-0"
              title="Pan left"
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePanRight}
              disabled={zoomLevel <= 1}
              className="h-7 w-7 p-0"
              title="Pan right"
            >
              →
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 32}
              className="h-7 w-7 p-0"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="h-7 w-7 p-0"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              disabled={zoomLevel <= 1}
              className="h-7 px-2 text-xs"
              title="Reset to 1x"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Phase labels positioned above chart aligned to timeline */}
        {phaseBreakdown.length > 0 && zoomedDomain && Array.isArray(zoomedDomain) && (
          <div className="relative h-5 mb-1" style={{ marginLeft: 65, marginRight: 20 }}>
            {(() => {
              const domainStart = zoomedDomain[0] as number;
              const domainEnd = zoomedDomain[1] as number;
              const domainRange = domainEnd - domainStart;
              
              // Include all phases with dates (not just those with budget for concurrent phases)
              const allPhases = [...phaseBreakdown]
                .filter(p => p.startDate)
                .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
              
              // Calculate visible phases using actual endDate when available
              const visiblePhases: Array<{ phase: typeof allPhases[0]; leftPercent: number; idx: number }> = [];
              
              allPhases.forEach((phase, idx) => {
                const phaseStart = new Date(phase.startDate!).getTime();
                // Use actual endDate if available, otherwise fall back to 90 days
                const phaseEnd = phase.endDate 
                  ? new Date(phase.endDate).getTime() 
                  : phaseStart + (90 * 24 * 60 * 60 * 1000);
                
                const phaseMid = (phaseStart + phaseEnd) / 2;
                
                if (phaseEnd < domainStart || phaseStart > domainEnd) return;
                
                const leftPercent = ((phaseMid - domainStart) / domainRange) * 100;
                
                if (leftPercent < -10 || leftPercent > 110) return;
                
                visiblePhases.push({ phase, leftPercent, idx });
              });
              
              // Check for overlaps - if any two labels are within 8% of each other, hide overlapping ones
              const nonOverlappingPhases = visiblePhases.filter((p1, i) => {
                // Keep this phase if no other phase (with lower index) overlaps with it
                return !visiblePhases.some((p2, j) => 
                  j < i && Math.abs(p1.leftPercent - p2.leftPercent) < 8
                );
              });
              
              return nonOverlappingPhases.map(({ phase, leftPercent, idx }) => (
                <div
                  key={idx}
                  className="absolute text-[9px] text-muted-foreground font-medium whitespace-nowrap cursor-help"
                  style={{ 
                    left: `${Math.max(0, Math.min(100, leftPercent))}%`,
                    transform: 'translateX(-50%)',
                    top: 0
                  }}
                  title={phase.phaseName}
                >
                  {phase.phaseName.length > 12 ? phase.phaseName.substring(0, 10) + '...' : phase.phaseName}
                </div>
              ));
            })()}
          </div>
        )}
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedChartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="colorDevCostInvestor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorRevenueInvestor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCumulativeInvestor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="timestamp"
                type="number"
                domain={zoomedDomain as [number, number]}
                tickFormatter={(ts) => {
                  const date = new Date(ts);
                  // Show more detail when zoomed in
                  if (zoomLevel >= 4) return format(date, 'MMM dd, yyyy');
                  if (zoomLevel >= 2) return format(date, 'MMM yyyy');
                  return format(date, "MMM ''yy");
                }}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                allowDataOverflow={true}
                tickCount={Math.max(6, Math.floor(8 * zoomLevel))}
              />
              <YAxis 
                domain={yDomain}
                allowDataOverflow={zoomLevel > 1}
                tickFormatter={(v) => {
                  const absVal = Math.abs(v);
                  if (absVal >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                  if (absVal >= 1000) return `$${(v / 1000).toFixed(0)}K`;
                  return `$${v}`;
                }}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={65}
              />
              {/* Zero reference line for break-even */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              {/* Phase start vertical lines */}
              {phaseBreakdown
                .filter(p => p.startDate && p.totalBudget > 0)
                .map((phase, idx) => (
                  <ReferenceLine 
                    key={`phase-line-${idx}`}
                    x={new Date(phase.startDate!).getTime()}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                  />
                ))
              }
              {/* Launch marker vertical line */}
              {launchIndex >= 0 && (
                <ReferenceLine 
                  x={combinedChartData[launchIndex]?.timestamp}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ 
                    value: 'Launch', 
                    position: 'insideTop',
                    fill: 'hsl(var(--primary))',
                    fontSize: 12,
                    fontWeight: 600,
                    offset: 10
                  }}
                />
              )}
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const dataPoint = payload[0]?.payload as CombinedChartDataPoint;
                  const timestamp = dataPoint?.timestamp || label;
                  const dateLabel = dataPoint?.label || format(new Date(timestamp as number), 'MMM yyyy');

                  const isPreLaunch = dataPoint?.type === 'dev' || dataPoint?.type === 'launch';
                  const losPercent = dataPoint?.cumulativeLoS;
                  const nominalCumulative = dataPoint?.cumulative;
                  const riskAdjustedCumulative = dataPoint?.cumulativeRiskAdjusted;
                  const npvCumulative = dataPoint?.cumulativeNPV;
                  const discountRate = dataPoint?.discountRate;

                  const formatSigned = (value: number) => {
                    const abs = formatCurrency(Math.abs(value), currency);
                    return value >= 0 ? abs : `-${abs}`;
                  };
                  
                  // Find all phases active at this timestamp
                  const activePhases = phaseBreakdown.filter(phase => {
                    if (!phase.startDate) return false;
                    const phaseStart = new Date(phase.startDate).getTime();
                    const phaseEnd = phase.endDate 
                      ? new Date(phase.endDate).getTime() 
                      : phaseStart + (90 * 24 * 60 * 60 * 1000);
                    return timestamp >= phaseStart && timestamp <= phaseEnd;
                  });
                  
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 text-xs shadow-lg">
                      <div className="font-semibold mb-2">{dateLabel}</div>
                      
                      {/* Show all active phases with their costs */}
                      {activePhases.length > 0 && (
                        <div className="mb-2 border-b border-border pb-2">
                          <div className="text-muted-foreground mb-1">Active Phases:</div>
                          {activePhases.map((phase, idx) => {
                            // Calculate prorated monthly cost
                            const phaseStart = new Date(phase.startDate!).getTime();
                            const phaseEnd = phase.endDate 
                              ? new Date(phase.endDate).getTime() 
                              : phaseStart + (90 * 24 * 60 * 60 * 1000);
                            
                            const durationDays = (phaseEnd - phaseStart) / (24 * 60 * 60 * 1000);
                            const durationMonths = Math.max(1, durationDays / 30.44);
                            const monthlyCost = phase.totalBudget / durationMonths;
                            
                            return (
                              <div key={idx} className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{phase.phaseName}</span>
                                <span className="text-destructive font-medium">
                                  -{formatCurrency(monthlyCost, currency)}/mo
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Always show rNPV values (even if Recharts payload omits some series) */}
                      {(typeof nominalCumulative === 'number' || typeof riskAdjustedCumulative === 'number') && (
                        <div className="mb-2 border-b border-border pb-2">
                          <div className="text-muted-foreground mb-1">rNPV:</div>

                          {typeof nominalCumulative === 'number' && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Nominal cumulative</span>
                              <span className="font-medium">{formatSigned(nominalCumulative)}</span>
                            </div>
                          )}

                          {typeof npvCumulative === 'number' && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                NPV{typeof discountRate === 'number' ? ` (${discountRate}% discount)` : ''}
                              </span>
                              <span className="font-medium">{formatSigned(npvCumulative)}</span>
                            </div>
                          )}

                          {typeof riskAdjustedCumulative === 'number' && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                {isPreLaunch ? 'Pre-launch rNPV' : 'Post-launch rNPV'}
                              </span>
                              <span className="font-medium">{formatSigned(riskAdjustedCumulative)}</span>
                            </div>
                          )}

                          {typeof losPercent === 'number' && (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Effective LoS</span>
                              <span className="font-medium">{losPercent.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Standard tooltip values */}
                      {payload.map((entry: any, idx: number) => {
                        // Avoid duplicating values shown in the rNPV section above
                        if (entry.name === 'cumulative' || entry.name === 'cumulativeRiskAdjusted') return null;

                        const value = entry.value as number;
                        if (value === undefined || value === null) return null;
                        
                        let label = entry.name;
                        let displayValue = formatCurrency(Math.abs(value), currency);
                        let colorClass = 'text-foreground';
                        
                        if (entry.name === 'cost') {
                          label = 'Monthly Dev Cost';
                          displayValue = `-${displayValue}`;
                          colorClass = 'text-destructive';
                        } else if (entry.name === 'revenue') {
                          label = 'Annual Revenue';
                          colorClass = 'text-primary';
                        } else if (entry.name === 'cumulative') {
                          label = 'Cumulative Cash';
                          displayValue = value >= 0 ? displayValue : `-${displayValue}`;
                          colorClass = value >= 0 ? 'text-green-600' : 'text-destructive';
                        } else if (entry.name === 'cumulativeRiskAdjusted') {
                          const losPercent = dataPoint?.cumulativeLoS;
                          label = `Risk-Adjusted rNPV${losPercent ? ` (${losPercent.toFixed(0)}% LoS)` : ''}`;
                          displayValue = value >= 0 ? displayValue : `-${displayValue}`;
                          colorClass = 'text-purple-500';
                        }
                        
                        return (
                          <div key={idx} className="flex justify-between gap-4">
                            <span className="text-muted-foreground">{label}</span>
                            <span className={`font-medium ${colorClass}`}>{displayValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {/* Development costs (negative) */}
              <Area
                type="monotone"
                dataKey="cost"
                stroke="hsl(0 84% 60%)"
                fill="url(#colorDevCostInvestor)"
                strokeWidth={2}
                name="cost"
                connectNulls={false}
              />
              {/* Revenue */}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#colorRevenueInvestor)"
                strokeWidth={2}
                name="revenue"
                connectNulls={false}
              />
              {/* Cumulative cash flow */}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(142 76% 36%)"
                fill="url(#colorCumulativeInvestor)"
                strokeWidth={2}
                name="cumulative"
              />
              {/* Risk-Adjusted rNPV line (purple) - render last to be on top */}
              <Line
                type="monotone"
                dataKey="cumulativeRiskAdjusted"
                stroke="hsl(280 80% 50%)"
                strokeWidth={3}
                dot={{ r: 3, fill: 'hsl(280 80% 50%)', stroke: 'white', strokeWidth: 1 }}
                name="cumulativeRiskAdjusted"
                strokeDasharray="6 4"
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {showLegend && (
          <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs">
            {phaseBreakdown.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(0 84% 60%)' }} />
                <span className="text-muted-foreground">Development Costs</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">Annual Revenue</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142 76% 36%)' }} />
              <span className="text-muted-foreground">Cumulative Cash</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(280 80% 50%)' }} />
              <span className="text-muted-foreground">Risk-Adjusted rNPV</span>
              {cumulativeLoS < 100 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                  {cumulativeLoS.toFixed(0)}% LoS
                </Badge>
              )}
            </div>
            {phaseBreakdown.length > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5" style={{ backgroundColor: 'hsl(var(--muted-foreground))', opacity: 0.5 }} />
                <span className="text-muted-foreground">Phase Start</span>
              </div>
            )}
            {launchIndex >= 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-primary" style={{ borderStyle: 'dashed' }} />
                <span className="text-muted-foreground">Market Launch</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
