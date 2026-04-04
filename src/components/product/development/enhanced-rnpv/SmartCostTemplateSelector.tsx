import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Settings, DollarSign, Calendar, Zap, TrendingUp, Brain, Globe } from 'lucide-react';
import { CostIntelligenceHelpTooltip } from './CostIntelligenceHelpTooltip';
import { CostTemplate, CostTemplateService, CostTemplateOverride } from '@/services/costTemplateService';
import { SmartCostIntelligence } from '@/services/smartCostIntelligence';
import { CurrencyService } from '@/services/currencyService';
import { toast } from 'sonner';

interface SmartCostTemplateSelectorProps {
  marketCode: string;
  deviceClass: string;
  companyId: string;
  launchDate: Date;
  onCostsSelected: (costs: Record<string, number>) => void;
  initialCosts?: Record<string, number>;
  targetCurrency?: string;
}

const COST_CATEGORY_ICONS: Record<string, string> = {
  regulatory: '⚖️',
  manufacturing: '🏭',
  clinical: '🩺',
  marketing: '📈',
  distribution: '🚚',
  maintenance: '🔧'
};

const COST_CATEGORY_COLORS: Record<string, string> = {
  regulatory: 'bg-red-50 text-red-700 border-red-200',
  manufacturing: 'bg-blue-50 text-blue-700 border-blue-200',
  clinical: 'bg-green-50 text-green-700 border-green-200',
  marketing: 'bg-purple-50 text-purple-700 border-purple-200',
  distribution: 'bg-orange-50 text-orange-700 border-orange-200',
  maintenance: 'bg-gray-50 text-gray-700 border-gray-200'
};

export const SmartCostTemplateSelector: React.FC<SmartCostTemplateSelectorProps> = ({
  marketCode,
  deviceClass,
  companyId,
  launchDate,
  onCostsSelected,
  initialCosts = {},
  targetCurrency = 'USD'
}) => {
  const [templates, setTemplates] = useState<CostTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCosts, setSelectedCosts] = useState<Record<string, number>>(initialCosts);
  const [costScenario, setCostScenario] = useState<'conservative' | 'typical' | 'aggressive'>('typical');
  const [inflationRate, setInflationRate] = useState(0.03);
  const [showSmartAdjustments, setShowSmartAdjustments] = useState(true);
  const [smartCostData, setSmartCostData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadCostTemplates();
  }, [marketCode, deviceClass, costScenario, inflationRate, targetCurrency]);

  const loadCostTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await CostTemplateService.getMarketCostTemplates(marketCode, deviceClass);
      setTemplates(templatesData);
      
      // Calculate smart costs for each template
      const costs: Record<string, number> = {};
      const smartData: Record<string, any> = {};
      
      for (const template of templatesData) {
        const key = template.costSubcategory || template.costCategory;
        
        if (showSmartAdjustments) {
          const smartResult = await CostTemplateService.getSmartCostEstimate(template, {
            deviceClass,
            scenario: costScenario,
            launchDate,
            targetCurrency,
            inflationRate
          });
          
          costs[key] = smartResult.smartCost;
          smartData[key] = smartResult;
        } else {
          costs[key] = initialCosts[key] || template.typicalCost;
        }
      }
      
      setSelectedCosts(costs);
      setSmartCostData(smartData);
      onCostsSelected(costs);
    } catch (error) {
      console.error('Error loading cost templates:', error);
      toast.error('Failed to load cost templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (key: string, value: number) => {
    const newCosts = { ...selectedCosts, [key]: value };
    setSelectedCosts(newCosts);
    onCostsSelected(newCosts);
  };

  const handleScenarioChange = (scenario: 'conservative' | 'typical' | 'aggressive') => {
    setCostScenario(scenario);
    loadCostTemplates();
  };

  const getTotalCost = () => {
    return Object.values(selectedCosts).reduce((sum, cost) => sum + cost, 0);
  };

  const getYearsToLaunch = () => {
    const now = new Date();
    const years = (launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, years);
  };

  const deviceClassInfo = SmartCostIntelligence.getDeviceClassInfo(deviceClass);
  const costScenarios = SmartCostIntelligence.getCostScenarios();
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.costCategory]) {
      acc[template.costCategory] = [];
    }
    acc[template.costCategory].push(template);
    return acc;
  }, {} as Record<string, CostTemplate[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Smart Cost Templates - {marketCode} ({deviceClass})
              <CostIntelligenceHelpTooltip type="smartEstimate" />
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {CurrencyService.formatCurrency(getTotalCost(), targetCurrency)}
              </Badge>
              {getYearsToLaunch() > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  +{getYearsToLaunch().toFixed(1)} years
                </Badge>
              )}
            </div>
          </CardTitle>
          
          {/* Smart Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Cost Scenario
                <CostIntelligenceHelpTooltip type="scenario" />
              </Label>
              <Select value={costScenario} onValueChange={handleScenarioChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costScenarios.map(scenario => (
                    <SelectItem key={scenario.name} value={scenario.name}>
                      <div className="flex flex-col">
                        <span>{scenario.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {scenario.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Inflation Rate (%)
                <CostIntelligenceHelpTooltip type="inflation" />
              </Label>
              <Input
                type="number"
                value={inflationRate * 100}
                onChange={(e) => setInflationRate(parseFloat(e.target.value) / 100 || 0.03)}
                step="0.1"
                min="0"
                max="20"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Target Currency
                <CostIntelligenceHelpTooltip type="currency" />
              </Label>
              <Select value={targetCurrency} onValueChange={loadCostTemplates}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CurrencyService.getSupportedCurrencies().map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency} ({CurrencyService.getCurrencySymbol(currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Device Class Info */}
          {deviceClassInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-blue-900 font-medium mb-1">
                <Info className="h-4 w-4" />
                {deviceClass} Complexity Adjustments
                <CostIntelligenceHelpTooltip type="deviceClass" />
              </div>
              <p className="text-sm text-blue-700">{deviceClassInfo.description}</p>
              <div className="text-xs text-blue-600 mt-1">
                Base multiplier: {deviceClassInfo.baseMultiplier}x | 
                Regulatory: {deviceClassInfo.categoryMultipliers.regulatory}x | 
                Clinical: {deviceClassInfo.categoryMultipliers.clinical}x
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue="by-category" className="w-full">
            <TabsList>
              <TabsTrigger value="by-category" className="flex items-center gap-2">
                <span>By Category</span>
                <CostIntelligenceHelpTooltip type="templates" />
              </TabsTrigger>
              <TabsTrigger value="adjustments" className="flex items-center gap-2">
                <span>Smart Adjustments</span>
                <CostIntelligenceHelpTooltip type="adjustments" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="by-category" className="space-y-6">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{COST_CATEGORY_ICONS[category]}</span>
                    <h3 className="text-lg font-semibold capitalize">{category} Costs</h3>
                    <Badge className={COST_CATEGORY_COLORS[category]}>
                      {categoryTemplates.length} item{categoryTemplates.length !== 1 ? 's' : ''}
                    </Badge>
                    {deviceClassInfo && (
                      <Badge variant="outline">
                        {deviceClassInfo.categoryMultipliers[category] || deviceClassInfo.baseMultiplier}x multiplier
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid gap-4">
                    {categoryTemplates.map(template => {
                      const key = template.costSubcategory || template.costCategory;
                      const currentValue = selectedCosts[key] || template.typicalCost;
                      const smartData = smartCostData[key];
                      
                      return (
                        <Card key={template.id} className="border-l-4 border-l-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label className="font-medium">{template.costSubcategory || template.costCategory}</Label>
                                  {template.justification && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p>{template.justification}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {template.timelineMonths && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {template.timelineMonths}mo
                                    </Badge>
                                  )}
                                  {template.frequency !== 'one_time' && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Zap className="h-3 w-3" />
                                      {template.frequency}
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground">
                                  {template.costDescription}
                                </p>
                                
                                <div className="text-sm space-y-1">
                                  <div className="text-muted-foreground">
                                    Template: {CostTemplateService.getCostRangeLabel(template)}
                                  </div>
                                  {smartData && showSmartAdjustments && (
                                    <div className="text-primary font-medium">
                                      Smart estimate: {CurrencyService.formatCurrency(smartData.smartCost, targetCurrency)}
                                      {smartData.currencyConversion && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          (converted from {template.currency})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2 min-w-[200px]">
                                <Input
                                  type="number"
                                  value={currentValue}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    handleCostChange(key, value);
                                  }}
                                  placeholder="Enter cost"
                                />
                                {smartData && showSmartAdjustments && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCostChange(key, smartData.smartCost)}
                                    className="w-full text-xs"
                                  >
                                    Apply Smart Estimate
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="adjustments" className="space-y-4">
              <div className="grid gap-4">
                {Object.entries(smartCostData).map(([key, data]) => (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">{key} Cost Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Original template cost:</span>
                          <span>{CurrencyService.formatCurrency(data.originalCost, targetCurrency)}</span>
                        </div>
                        <div className="flex justify-between text-blue-600">
                          <span>+ Device class adjustment ({deviceClass}):</span>
                          <span>{((data.adjustments.deviceClass - 1) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-purple-600">
                          <span>+ Scenario adjustment ({costScenario}):</span>
                          <span>{((data.adjustments.scenario - 1) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>+ Inflation adjustment ({getYearsToLaunch().toFixed(1)} years):</span>
                          <span>{(data.adjustments.inflation.totalInflation * 100).toFixed(1)}%</span>
                        </div>
                        {data.currencyConversion && (
                          <div className="flex justify-between text-orange-600">
                            <span>+ Currency conversion:</span>
                            <span>Rate: {data.currencyConversion.exchangeRate.toFixed(4)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-medium">
                          <span>Final smart cost:</span>
                          <span>{CurrencyService.formatCurrency(data.smartCost, targetCurrency)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cost templates available for {marketCode} ({deviceClass})</p>
              <p className="text-sm">You can enter custom costs manually</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};