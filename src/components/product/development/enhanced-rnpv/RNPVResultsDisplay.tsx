import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Target 
} from 'lucide-react';
import { RNPVCalculationResult } from '@/services/enhanced-rnpv/interfaces';
import { ContinuousPhaseIndicator } from './ContinuousPhaseIndicator';

interface RNPVResultsDisplayProps {
  results: RNPVCalculationResult[];
  isLoading?: boolean;
}

export function RNPVResultsDisplay({ results, isLoading }: RNPVResultsDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Calculating enhanced rNPV...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No calculation results available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const coreResult = results.find(r => r.calculationType === 'core_project');
  const marketResults = results.filter(r => r.calculationType === 'market_extension');
  const portfolioResult = results.find(r => r.calculationType === 'total_portfolio');

  const continuousPhases = coreResult?.phaseCalculations.filter(p => p.isContinuous) || [];

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {portfolioResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Portfolio rNPV Summary
              </CardTitle>
              <Badge 
                variant={portfolioResult.rnpvValue >= 0 ? "default" : "destructive"}
                className="text-sm px-3 py-1"
              >
                {portfolioResult.rnpvValue >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {formatCurrency(portfolioResult.rnpvValue)}
              </Badge>
            </div>
            <CardDescription>
              Enhanced calculation using {portfolioResult.calculationMetadata.calculationMethod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Investment</div>
                <div className="text-lg font-semibold text-red-600">
                  {formatCurrency(portfolioResult.expectedCostPV)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Expected Revenue</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(portfolioResult.expectedRevenuePV)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Success Probability</div>
                <div className="text-lg font-semibold">
                  {(portfolioResult.cumulativeTechnicalLoA * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Core Project Analysis */}
      {coreResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Core Project Analysis
            </CardTitle>
            <CardDescription>
              Market-agnostic development phases with enhanced continuous phase handling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Development Investment</div>
                  <div className="text-xl font-semibold text-red-600">
                    {formatCurrency(coreResult.expectedCostPV)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Technical Success Rate</div>
                  <div className="text-xl font-semibold">
                    {(coreResult.cumulativeTechnicalLoA * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Continuous Phases Section */}
              {continuousPhases.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Continuous Phases ({continuousPhases.length})
                    </h4>
                    <div className="space-y-3">
                      {continuousPhases.map((phase) => (
                        <ContinuousPhaseIndicator
                          key={phase.phaseId}
                          phaseName={phase.phaseName}
                          preLaunchComponent={phase.preLaunchComponent}
                          postLaunchComponent={phase.postLaunchComponent}
                          totalCost={phase.cost}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Traditional Phases */}
              {coreResult.phaseCalculations.filter(p => !p.isContinuous).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Traditional Development Phases</h4>
                    <div className="space-y-2">
                      {coreResult.phaseCalculations
                        .filter(p => !p.isContinuous)
                        .map((phase) => (
                          <div key={phase.phaseId} className="flex items-center justify-between text-sm">
                            <span>{phase.phaseName}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground">
                                {formatCurrency(phase.expectedCost)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {phase.likelihoodOfApproval}% LoA
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Extensions */}
      {marketResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Extensions ({marketResults.length})
            </CardTitle>
            <CardDescription>
              Revenue potential across target markets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{result.marketCode}</div>
                    <div className="text-sm text-muted-foreground">
                      Success Rate: {(result.cumulativeTechnicalLoA * result.cumulativeCommercialLoA * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${result.rnpvValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(result.rnpvValue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(result.expectedRevenuePV)} revenue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}