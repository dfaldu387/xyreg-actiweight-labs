import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  GitBranch, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Zap,
  Target,
  Copy,
  Save,
  Play,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { 
  RNPVScenario, 
  RNPVCalculationResult, 
  WhatIfScenarioOptions, 
  MarketExtension 
} from '@/services/enhanced-rnpv/interfaces';
import { RNPVCalculationEngine } from '@/services/enhanced-rnpv/calculationEngine';
import { RNPVScenarioService } from '@/services/enhanced-rnpv/scenarioService';
import { useToast } from '@/hooks/use-toast';

interface ScenarioAnalysisPanelProps {
  productId: string;
  companyId: string;
  scenarios: RNPVScenario[];
  marketExtensions: MarketExtension[];
  onScenariosChange: (scenarios: RNPVScenario[]) => void;
  onCalculationComplete: (results: RNPVCalculationResult[]) => void;
}

export function ScenarioAnalysisPanel({
  productId,
  companyId,
  scenarios,
  marketExtensions,
  onScenariosChange,
  onCalculationComplete
}: ScenarioAnalysisPanelProps) {
  const [activeScenario, setActiveScenario] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResults, setCalculationResults] = useState<Record<string, RNPVCalculationResult[]>>({});
  const [whatIfOptions, setWhatIfOptions] = useState<WhatIfScenarioOptions>({
    adjustLoA: {},
    toggleMarkets: [],
    adjustDiscountRate: undefined,
    adjustRevenueForecast: {},
    adjustCosts: {}
  });
  const [activeTab, setActiveTab] = useState('scenarios');
  const { toast } = useToast();

  const calculationEngine = new RNPVCalculationEngine();
  const baselineScenario = scenarios.find(s => s.isBaseline);

  useEffect(() => {
    if (scenarios.length > 0 && !activeScenario) {
      setActiveScenario(baselineScenario?.id || scenarios[0].id);
    }
  }, [scenarios, activeScenario, baselineScenario]);

  const handleRunCalculation = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    setIsCalculating(true);
    try {
      const results = await calculationEngine.calculateCompleteRNPV(scenario, marketExtensions);
      
      // Save results to database
      await RNPVScenarioService.saveCalculationResults(results);
      
      // Update local state
      setCalculationResults(prev => ({ ...prev, [scenarioId]: results }));
      onCalculationComplete(results);

      toast({
        title: "Calculation Complete",
        description: `rNPV analysis completed for "${scenario.scenarioName}"`,
      });
    } catch (error) {
      console.error('Calculation failed:', error);
      toast({
        title: "Calculation Failed",
        description: "Failed to complete rNPV calculation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCreateScenario = async (name: string, description?: string) => {
    if (!baselineScenario) {
      toast({
        title: "No Baseline Scenario",
        description: "Create a baseline scenario first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newScenario = await RNPVScenarioService.cloneScenario(
        baselineScenario.id,
        name,
        description
      );
      
      onScenariosChange([...scenarios, newScenario]);
      setActiveScenario(newScenario.id);
      
      toast({
        title: "Scenario Created",
        description: `"${name}" scenario has been created.`,
      });
    } catch (error) {
      console.error('Failed to create scenario:', error);
      toast({
        title: "Error",
        description: "Failed to create scenario. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleWhatIfAnalysis = async () => {
    if (!baselineScenario) return;

    setIsCalculating(true);
    try {
      const result = await calculationEngine.performWhatIfAnalysis(
        baselineScenario,
        marketExtensions,
        whatIfOptions
      );

      toast({
        title: "What-If Analysis Complete",
        description: `Impact: ${result.deltaRNPV > 0 ? '+' : ''}$${(result.deltaRNPV / 1000000).toFixed(1)}M (${result.deltaPercentage.toFixed(1)}%)`,
      });
    } catch (error) {
      console.error('What-if analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to complete what-if analysis.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const getScenarioRNPV = (scenarioId: string): number => {
    const results = calculationResults[scenarioId];
    return results?.find(r => r.calculationType === 'total_portfolio')?.rnpvValue || 0;
  };

  const getScenarioStatus = (scenario: RNPVScenario): 'calculated' | 'needs_calculation' | 'baseline' => {
    if (scenario.isBaseline) return 'baseline';
    if (calculationResults[scenario.id]) return 'calculated';
    return 'needs_calculation';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'baseline': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'calculated': return 'bg-green-100 text-green-800 border-green-300';
      case 'needs_calculation': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Scenario Analysis & What-If Modeling
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Compare scenarios and perform sensitivity analysis on key parameters
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleCreateScenario(`Scenario ${scenarios.length + 1}`)}
              disabled={!baselineScenario}
            >
              <Copy className="h-4 w-4 mr-2" />
              Clone Scenario
            </Button>
            {activeScenario && (
              <Button
                onClick={() => handleRunCalculation(activeScenario)}
                disabled={isCalculating}
                className="flex items-center gap-2"
              >
                {isCalculating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Calculate
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="whatif">What-If Analysis</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="space-y-4">
              {scenarios.map((scenario) => {
                const status = getScenarioStatus(scenario);
                const rnpv = getScenarioRNPV(scenario.id);
                
                return (
                  <Card 
                    key={scenario.id} 
                    className={`cursor-pointer transition-colors ${
                      activeScenario === scenario.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setActiveScenario(scenario.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{scenario.scenarioName}</h4>
                              <Badge className={getStatusColor(status)}>
                                {status === 'baseline' ? 'Baseline' : 
                                 status === 'calculated' ? 'Calculated' : 'Needs Calculation'}
                              </Badge>
                            </div>
                            {scenario.scenarioDescription && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {scenario.scenarioDescription}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                              <span>{scenario.activeMarkets.length} markets</span>
                              <span>
                                {Object.keys(scenario.loaAdjustments).length} LoA adjustments
                              </span>
                              {rnpv !== 0 && (
                                <span className="flex items-center gap-1 font-medium">
                                  <DollarSign className="h-3 w-3" />
                                  {rnpv > 0 ? '+' : ''}${(rnpv / 1000000).toFixed(1)}M rNPV
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {status === 'needs_calculation' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRunCalculation(scenario.id);
                              }}
                              disabled={isCalculating}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open scenario configuration
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {scenarios.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Scenarios Created</p>
                  <p className="mb-4">Create scenarios to compare different strategic options</p>
                  <Button onClick={() => handleCreateScenario('Baseline Scenario')}>
                    Create Baseline Scenario
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="whatif" className="space-y-6">
            {!baselineScenario ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">No baseline scenario available</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Create and calculate a baseline scenario to enable what-if analysis
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Market Selection</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {marketExtensions.map((market) => (
                        <div key={market.id} className="flex items-center justify-between">
                          <span className="text-sm">{market.marketName}</span>
                          <Switch
                            checked={!whatIfOptions.toggleMarkets.includes(market.marketCode)}
                            onCheckedChange={(checked) => {
                              const newToggleMarkets = checked
                                ? whatIfOptions.toggleMarkets.filter(m => m !== market.marketCode)
                                : [...whatIfOptions.toggleMarkets, market.marketCode];
                              setWhatIfOptions(prev => ({ ...prev, toggleMarkets: newToggleMarkets }));
                            }}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Financial Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Discount Rate Adjustment (%)</Label>
                        <div className="space-y-2">
                          <Slider
                            value={[whatIfOptions.adjustDiscountRate || baselineScenario.coreProjectConfig.discountRate * 100]}
                            onValueChange={([value]) => setWhatIfOptions(prev => ({ ...prev, adjustDiscountRate: value / 100 }))}
                            max={20}
                            min={5}
                            step={0.5}
                          />
                          <div className="text-center text-sm">
                            {((whatIfOptions.adjustDiscountRate || baselineScenario.coreProjectConfig.discountRate) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={handleWhatIfAnalysis} 
                    disabled={isCalculating}
                    className="flex items-center gap-2"
                  >
                    {isCalculating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Run What-If Analysis
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Scenario</th>
                        <th className="text-right py-2">rNPV</th>
                        <th className="text-right py-2">Markets</th>
                        <th className="text-right py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarios.map((scenario) => {
                        const rnpv = getScenarioRNPV(scenario.id);
                        const status = getScenarioStatus(scenario);
                        
                        return (
                          <tr key={scenario.id} className="border-b">
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{scenario.scenarioName}</span>
                                {scenario.isBaseline && <Badge variant="secondary">Baseline</Badge>}
                              </div>
                            </td>
                            <td className="text-right py-2 font-mono">
                              {rnpv !== 0 ? (
                                <span className={rnpv > 0 ? 'text-green-600' : 'text-red-600'}>
                                  ${(rnpv / 1000000).toFixed(1)}M
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="text-right py-2">{scenario.activeMarkets.length}</td>
                            <td className="text-right py-2">
                              <Badge className={getStatusColor(status)}>
                                {status === 'baseline' ? 'Baseline' : 
                                 status === 'calculated' ? 'Calculated' : 'Pending'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}