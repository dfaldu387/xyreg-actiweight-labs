import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  BarChart,
  Eye,
  Zap
} from 'lucide-react';
import { CoreProjectConfiguration } from '@/services/enhanced-rnpv/interfaces';
import { RNPVCalculationEngine } from '@/services/enhanced-rnpv/calculationEngine';
import { TimelineBudgetCalculator } from '@/services/timelineBudgetCalculator';

interface CoreProjectRNPVSummaryProps {
  configuration: CoreProjectConfiguration;
  productId: string;
  companyId: string;
}

interface CoreProjectRNPVCalculation {
  totalInvestment: number;
  presentValueCosts: number;
  riskAdjustedCosts: number;
  cumulativeLoA: number;
  preLaunchCosts: number;
  postLaunchCosts: number;
  phaseBreakdown: Array<{
    name: string;
    cost: number;
    pvCost: number;
    riskAdjustedCost: number;
    loA: number;
    cumulativeLoA: number;
    timing: 'pre-launch' | 'post-launch' | 'continuous';
  }>;
}

export function CoreProjectRNPVSummary({ 
  configuration, 
  productId, 
  companyId 
}: CoreProjectRNPVSummaryProps) {
  const [showCalculations, setShowCalculations] = useState(false);

  // Calculate Core Project rNPV metrics
  const coreProjectCalculation = useMemo((): CoreProjectRNPVCalculation => {
    const { developmentPhases, discountRate, projectTimeline } = configuration;
    
    if (!developmentPhases.length) {
      return {
        totalInvestment: 0,
        presentValueCosts: 0,
        riskAdjustedCosts: 0,
        cumulativeLoA: 1.0,
        preLaunchCosts: 0,
        postLaunchCosts: 0,
        phaseBreakdown: []
      };
    }

    let totalInvestment = 0;
    let presentValueCosts = 0;
    let riskAdjustedCosts = 0;
    let cumulativeLoA = 1.0;
    let preLaunchCosts = 0;
    let postLaunchCosts = 0;
    const phaseBreakdown: CoreProjectRNPVCalculation['phaseBreakdown'] = [];

    // Calculate PV and risk-adjusted costs for each phase
    developmentPhases.forEach((phase, index) => {
      const years = phase.startMonth / 12;
      const pvCost = phase.costs / Math.pow(1 + discountRate, years);
      const loSProbability = phase.likelihoodOfSuccess / 100;
      
      // Risk adjustment: apply cumulative LoS to discrete phases
      const riskAdjustedCost = phase.isContinuous ? pvCost : pvCost * cumulativeLoA;
      
      totalInvestment += phase.costs;
      presentValueCosts += pvCost;
      riskAdjustedCosts += riskAdjustedCost;

      // Determine phase timing
      let timing: 'pre-launch' | 'post-launch' | 'continuous' = 'pre-launch';
      if (phase.isContinuous) {
        timing = 'continuous';
        preLaunchCosts += phase.preLaunchCosts || phase.costs * 0.7;
        postLaunchCosts += phase.postLaunchCosts || phase.costs * 0.3;
      } else {
        const launchMonth = projectTimeline.developmentDurationMonths;
        timing = phase.startMonth < launchMonth ? 'pre-launch' : 'post-launch';
        if (timing === 'pre-launch') {
          preLaunchCosts += phase.costs;
        } else {
          postLaunchCosts += phase.costs;
        }
      }

      phaseBreakdown.push({
        name: phase.name,
        cost: phase.costs,
        pvCost,
        riskAdjustedCost,
        loA: phase.likelihoodOfSuccess,
        cumulativeLoA,
        timing
      });

      // Update cumulative LoS for next phase (only for non-continuous phases)
      if (!phase.isContinuous) {
        cumulativeLoA *= loSProbability;
      }
    });

    return {
      totalInvestment,
      presentValueCosts,
      riskAdjustedCosts,
      cumulativeLoA,
      preLaunchCosts,
      postLaunchCosts,
      phaseBreakdown
    };
  }, [configuration]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Core Project rNPV Pre-Calculation
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Risk-adjusted investment analysis for development platform
            </p>
          </div>
          <Dialog open={showCalculations} onOpenChange={setShowCalculations}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                View Calculations
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Core Project Calculation Details</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Calculation Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(coreProjectCalculation.riskAdjustedCosts)}
                        </div>
                        <div className="text-sm text-muted-foreground">Risk-Adjusted Investment</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {(coreProjectCalculation.cumulativeLoA * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Success Probability</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-muted-foreground">
                          N/A
                        </div>
                        <div className="text-sm text-muted-foreground">ROI</div>
                        <div className="text-xs text-muted-foreground">No revenue</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Phase-by-Phase Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Phase-by-Phase Investment Schedule</h4>
                  <div className="space-y-3">
                    {coreProjectCalculation.phaseBreakdown.map((phase, index) => (
                      <Card key={index} className="border-l-4 border-l-primary/20">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{phase.name}</span>
                              <Badge variant={
                                phase.timing === 'pre-launch' ? 'default' :
                                phase.timing === 'post-launch' ? 'secondary' : 'outline'
                              }>
                                {phase.timing === 'continuous' ? 'Ongoing' : phase.timing}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(phase.cost)}</div>
                              <div className="text-sm text-muted-foreground">
                                PV: {formatCurrency(phase.pvCost)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-muted-foreground">Likelihood of Success: </span>
                              <span className="font-medium">{phase.loA}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Risk-Adjusted: </span>
                              <span className="font-medium">{formatCurrency(phase.riskAdjustedCost)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <Progress value={phase.loA} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Timeline Context */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Timeline & Cost Allocation</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Pre-Launch Investment</span>
                            <span className="font-semibold">{formatCurrency(coreProjectCalculation.preLaunchCosts)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Post-Launch Ongoing</span>
                            <span className="font-semibold">{formatCurrency(coreProjectCalculation.postLaunchCosts)}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between font-semibold">
                            <span>Total Investment</span>
                            <span>{formatCurrency(coreProjectCalculation.totalInvestment)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Present Value</span>
                            <span className="font-semibold">{formatCurrency(coreProjectCalculation.presentValueCosts)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Risk Adjustment</span>
                            <span className="font-semibold text-orange-600">
                              -{formatCurrency(coreProjectCalculation.presentValueCosts - coreProjectCalculation.riskAdjustedCosts)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between font-semibold">
                            <span>Risk-Adjusted PV</span>
                            <span>{formatCurrency(coreProjectCalculation.riskAdjustedCosts)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Key Assumptions */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Key Assumptions & Methodology</h4>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <ul className="space-y-2 text-sm">
                        <li>• <strong>Discount Rate:</strong> {(configuration.discountRate * 100).toFixed(1)}% (applied to future cash flows)</li>
                        <li>• <strong>Risk Adjustment:</strong> Cumulative likelihood of success applied to development phases</li>
                        <li>• <strong>Continuous Phases:</strong> Split between pre-launch setup and post-launch ongoing costs</li>
                        <li>• <strong>Platform Value:</strong> Core development creates option value for multiple market extensions</li>
                        <li>• <strong>Revenue Model:</strong> Core project generates no direct revenue - requires market extensions</li>
                        <li>• <strong>ROI Calculation:</strong> Not applicable - no revenue generated by core project alone</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              -{formatCurrency(coreProjectCalculation.riskAdjustedCosts)}
            </div>
            <div className="text-sm text-muted-foreground">Core rNPV</div>
            <div className="text-xs text-muted-foreground mt-1">Investment Only</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">
              {formatCurrency(coreProjectCalculation.totalInvestment)}
            </div>
            <div className="text-sm text-muted-foreground">Total Investment</div>
            <div className="text-xs text-muted-foreground mt-1">
              {configuration.developmentPhases.length} phases
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {(coreProjectCalculation.cumulativeLoA * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
            <div className="text-xs text-muted-foreground mt-1">Technical LoA</div>
          </div>
          
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Method:</span>
              <span className="font-medium">Timeline-based cost allocation with risk adjustment</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-muted-foreground">Launch:</span>
              <span className="font-medium">
                {configuration.projectTimeline.expectedLaunchDate.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}