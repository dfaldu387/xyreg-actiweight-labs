import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingDown, DollarSign, Target, Percent, Info } from "lucide-react";
import { formatCurrency } from "@/utils/marketCurrencyUtils";
import { HelpTooltip } from "@/components/product/device/sections/HelpTooltip";
import { cn } from "@/lib/utils";

export interface InvestmentRealityMetrics {
  standardRNPV: number;
  peakFunding: number;        // Max undiscounted cash outlay (sum of all dev costs)
  maxLossScenario: number;    // Total dev costs if fails (negative number)
  suggestedDiscountRate: number;
  currentDiscountRate: number;
  cumulativeLoS: number;      // 0-100 percentage
  isExistentialRisk: boolean; // Flag if Max Loss > threshold
  peakFundingToRNPVRatio: number;
}

interface InvestmentRealityCheckProps {
  metrics: InvestmentRealityMetrics;
  currency?: string;
  onApplySuggestedRate?: (rate: number) => void;
  className?: string;
}

/**
 * Calculate suggested discount rate based on cumulative LoS
 * High-risk projects (low LoS) require higher hurdle rates
 */
export function getSuggestedDiscountRate(cumulativeLoS: number): number {
  if (cumulativeLoS < 10) return 30;   // Very high risk
  if (cumulativeLoS < 20) return 25;   // High risk
  if (cumulativeLoS < 40) return 18;   // Moderate risk
  if (cumulativeLoS < 60) return 14;   // Low-moderate risk
  return 10;  // Standard WACC
}

/**
 * Calculate investment reality metrics from project data
 */
export function calculateInvestmentMetrics(
  standardRNPV: number,
  peakFunding: number,
  cumulativeLoS: number,
  currentDiscountRate: number
): InvestmentRealityMetrics {
  const maxLossScenario = -Math.abs(peakFunding);
  const suggestedDiscountRate = getSuggestedDiscountRate(cumulativeLoS);
  const peakFundingToRNPVRatio = standardRNPV > 0 ? peakFunding / standardRNPV : Infinity;
  
  // Existential risk: Low LoS AND significant max loss (e.g., >$500k or ratio > 10x)
  const isExistentialRisk = 
    (cumulativeLoS < 15 && Math.abs(maxLossScenario) > 500000) ||
    (peakFundingToRNPVRatio > 10 && Math.abs(maxLossScenario) > 100000);

  return {
    standardRNPV,
    peakFunding,
    maxLossScenario,
    suggestedDiscountRate,
    currentDiscountRate,
    cumulativeLoS,
    isExistentialRisk,
    peakFundingToRNPVRatio
  };
}

export function InvestmentRealityCheck({ 
  metrics, 
  currency = 'USD',
  onApplySuggestedRate,
  className 
}: InvestmentRealityCheckProps) {
  const {
    standardRNPV,
    peakFunding,
    maxLossScenario,
    suggestedDiscountRate,
    currentDiscountRate,
    cumulativeLoS,
    isExistentialRisk,
    peakFundingToRNPVRatio
  } = metrics;

  const showRateWarning = currentDiscountRate < suggestedDiscountRate && cumulativeLoS < 40;
  const showFundingWarning = peakFundingToRNPVRatio > 3 && peakFunding > 0;

  // Risk level styling
  const getRiskLevel = () => {
    if (isExistentialRisk) return { label: 'Existential Risk', color: 'text-destructive', bg: 'bg-destructive/10' };
    if (cumulativeLoS < 20) return { label: 'High Risk', color: 'text-destructive', bg: 'bg-destructive/10' };
    if (cumulativeLoS < 40) return { label: 'Moderate Risk', color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'Standard Risk', color: 'text-muted-foreground', bg: 'bg-muted/30' };
  };

  const riskLevel = getRiskLevel();

  return (
    <Card className={cn("border-2", isExistentialRisk && "border-destructive/50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Investment Reality Check
            <HelpTooltip content="Provides a sober view of project economics by showing actual cash requirements alongside risk-adjusted metrics. Helps prevent the 'Low-Probability Trap' where high-risk projects appear artificially attractive." />
          </CardTitle>
          <Badge variant={isExistentialRisk ? "destructive" : "outline"} className={riskLevel.color}>
            {riskLevel.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Standard rNPV */}
          <div className="text-center p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Standard rNPV</span>
            </div>
            <div className={cn(
              "text-lg font-bold",
              standardRNPV > 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(standardRNPV, currency)}
            </div>
            <p className="text-xs text-muted-foreground">(risk-discounted)</p>
          </div>

          {/* Peak Funding */}
          <div className={cn(
            "text-center p-3 rounded-lg border",
            showFundingWarning ? "bg-warning/10 border-warning/30" : "bg-muted/30"
          )}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Peak Funding</span>
              {showFundingWarning && <AlertTriangle className="h-3 w-3 text-warning" />}
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatCurrency(peakFunding, currency)}
            </div>
            <p className="text-xs text-muted-foreground">(cash required)</p>
          </div>

          {/* Max Loss Scenario */}
          <div className={cn(
            "text-center p-3 rounded-lg border",
            isExistentialRisk ? "bg-destructive/10 border-destructive/30" : "bg-muted/30"
          )}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Max Loss</span>
            </div>
            <div className={cn(
              "text-lg font-bold",
              isExistentialRisk ? "text-destructive" : "text-foreground"
            )}>
              {formatCurrency(maxLossScenario, currency)}
            </div>
            <p className="text-xs text-muted-foreground">(if project fails)</p>
          </div>
        </div>

        {/* Funding Warning */}
        {showFundingWarning && (
          <Alert variant="default" className="border-warning/50 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              <strong>Peak Funding is {peakFundingToRNPVRatio.toFixed(1)}x the rNPV value.</strong>{' '}
              Ensure sufficient capital reserves before proceeding. The project requires{' '}
              <strong>{formatCurrency(peakFunding, currency)}</strong> in actual cash outlays.
            </AlertDescription>
          </Alert>
        )}

        {/* Existential Risk Warning */}
        {isExistentialRisk && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Existential Risk Warning:</strong> This project has a {cumulativeLoS.toFixed(1)}% probability of success 
              with a maximum loss exposure of {formatCurrency(Math.abs(maxLossScenario), currency)}. 
              Carefully evaluate whether the company can survive total project failure before proceeding.
            </AlertDescription>
          </Alert>
        )}

        {/* Discount Rate Recommendation */}
        <div className={cn(
          "p-3 rounded-lg border flex items-center justify-between",
          showRateWarning ? "bg-warning/10 border-warning/30" : "bg-muted/20"
        )}>
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Suggested Discount Rate:</span>
                <Badge variant={showRateWarning ? "outline" : "secondary"} className={showRateWarning ? "border-warning text-warning" : ""}>
                  {suggestedDiscountRate}%
                </Badge>
                <span className="text-sm text-muted-foreground">
                  (current: {currentDiscountRate}%)
                </span>
              </div>
              {showRateWarning && (
                <p className="text-xs text-warning mt-1">
                  High-risk projects require higher hurdle rates to account for opportunity cost
                </p>
              )}
            </div>
          </div>
          {onApplySuggestedRate && showRateWarning && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onApplySuggestedRate(suggestedDiscountRate)}
              className="whitespace-nowrap"
            >
              Apply {suggestedDiscountRate}%
            </Button>
          )}
        </div>

        {/* Phase Commitment Note */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/20 rounded-md">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Note:</strong> Phase 1-2 costs are treated as "committed" (100% probability) 
            in rNPV calculations because you must spend this capital to discover if the project will fail.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
