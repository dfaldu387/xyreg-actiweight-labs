import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrencySymbol } from '@/utils/currencyUtils';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { MarketNPVInputData } from "@/services/npvPersistenceService";
import { Separator } from "@/components/ui/separator";
import { AffectedProductsSection } from './AffectedProductsSection';
import { AffectedProduct } from '@/types/affectedProducts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarketNPVInputFormProps {
  marketCode: string;
  marketName: string;
  inputData: MarketNPVInputData;
  selectedCurrency: string;
  onInputChange: (data: MarketNPVInputData) => void;
  isLoading: boolean;
  availableProducts?: Array<{ id: string; name: string }>;
}

export function MarketNPVInputForm({
  marketCode,
  marketName,
  inputData,
  selectedCurrency,
  onInputChange,
  isLoading,
  availableProducts = []
}: MarketNPVInputFormProps) {
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    revenue: false,
    costs: false,
    rnd: false,
    timing: false,
    cannibalization: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: string, value: string | number) => {
    let numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    onInputChange({
      ...inputData,
      [field]: numericValue
    });
  };

  // Convert Date object to string for the input field
  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date instanceof Date ? date.toISOString().split('T')[0] : '';
  };

  // Handle date input changes
  const handleDateChange = (field: string, dateString: string) => {
    const newDate = dateString ? new Date(dateString) : undefined;
    onInputChange({
      ...inputData,
      [field]: newDate
    });
  };

  // Handle affected products changes
  const handleAffectedProductsChange = (affectedProducts: AffectedProduct[]) => {
    onInputChange({
      ...inputData,
      affectedProducts
    });
  };

  return (
    <TooltipProvider>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{marketName} ({marketCode})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Settings Section */}
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('basic')}
            >
              <h3 className="text-sm font-medium">Basic Settings</h3>
              {expandedSections.basic ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </div>
            
            {expandedSections.basic && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`market-launch-date-${marketCode}`} className="text-xs">
                    Market Launch Date
                  </Label>
                  <Input 
                    id={`market-launch-date-${marketCode}`}
                    type="date"
                    value={formatDateForInput(inputData.marketLaunchDate)}
                    onChange={(e) => handleDateChange('marketLaunchDate', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`discount-rate-${marketCode}`} className="text-xs">
                    Discount Rate (%)
                  </Label>
                  <Input
                    id={`discount-rate-${marketCode}`}
                    type="number"
                    step="0.1"
                    value={inputData.discountRate || ''}
                    onChange={(e) => handleInputChange('discountRate', e.target.value)}
                    placeholder="8.0"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`forecast-duration-${marketCode}`} className="text-xs">
                    Forecast Duration (Months)
                  </Label>
                  <Input
                    id={`forecast-duration-${marketCode}`}
                    type="number"
                    value={inputData.forecastDuration || ''}
                    onChange={(e) => handleInputChange('forecastDuration', e.target.value)}
                    placeholder="60"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor={`development-phase-${marketCode}`} className="text-xs">
                    Development Phase (Months)
                  </Label>
                  <Input
                    id={`development-phase-${marketCode}`}
                    type="number"
                    value={inputData.developmentPhaseMonths || ''}
                    onChange={(e) => handleInputChange('developmentPhaseMonths', e.target.value)}
                    placeholder="12"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Revenue Section */}
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('revenue')}
            >
              <h3 className="text-sm font-medium">Revenue Projections</h3>
              {expandedSections.revenue ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </div>
            
            {expandedSections.revenue && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`monthly-sales-${marketCode}`} className="text-xs">
                    Monthly Sales Forecast (Units)
                  </Label>
                  <Input
                    id={`monthly-sales-${marketCode}`}
                    type="number"
                    value={inputData.monthlySalesForecast || ''}
                    onChange={(e) => handleInputChange('monthlySalesForecast', e.target.value)}
                    placeholder="100"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`annual-sales-change-${marketCode}`} className="text-xs">
                    Annual Sales Change (%)
                  </Label>
                  <Input
                    id={`annual-sales-change-${marketCode}`}
                    type="number"
                    step="1"
                    value={inputData.annualSalesForecastChange || ''}
                    onChange={(e) => handleInputChange('annualSalesForecastChange', e.target.value)}
                    placeholder="5"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`unit-price-${marketCode}`} className="text-xs">
                    Initial Unit Price ({currencySymbol})
                  </Label>
                  <Input
                    id={`unit-price-${marketCode}`}
                    type="number"
                    value={inputData.initialUnitPrice || ''}
                    onChange={(e) => handleInputChange('initialUnitPrice', e.target.value)}
                    placeholder="1000"
                    disabled={isLoading}
                  />
                </div>

                {/* NEW: Cannibalized Revenue field with tooltip */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Label htmlFor={`cannibalized-revenue-${marketCode}`} className="text-xs">
                      Cannibalized Revenue ({currencySymbol})
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          Enter the estimated revenue lost from existing products due to customers choosing this new product instead. This will be subtracted from the new product's gross revenue to calculate its true incremental impact.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id={`cannibalized-revenue-${marketCode}`}
                    type="number"
                    value={inputData.cannibalizedRevenue || ''}
                    onChange={(e) => handleInputChange('cannibalizedRevenue', e.target.value)}
                    placeholder="0"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`annual-price-change-${marketCode}`} className="text-xs">
                    Annual Price Change (%)
                  </Label>
                  <Input
                    id={`annual-price-change-${marketCode}`}
                    type="number"
                    step="1"
                    value={inputData.annualUnitPriceChange || ''}
                    onChange={(e) => handleInputChange('annualUnitPriceChange', e.target.value)}
                    placeholder="2"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Costs Section */}
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('costs')}
            >
              <h3 className="text-sm font-medium">Production & Operating Costs</h3>
              {expandedSections.costs ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </div>
            
            {expandedSections.costs && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`variable-cost-${marketCode}`} className="text-xs">
                    Initial Variable Cost per Unit ({currencySymbol})
                  </Label>
                  <Input
                    id={`variable-cost-${marketCode}`}
                    type="number"
                    value={inputData.initialVariableCost || ''}
                    onChange={(e) => handleInputChange('initialVariableCost', e.target.value)}
                    placeholder="400"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`annual-variable-cost-change-${marketCode}`} className="text-xs">
                    Annual Variable Cost Change (%)
                  </Label>
                  <Input
                    id={`annual-variable-cost-change-${marketCode}`}
                    type="number"
                    step="1"
                    value={inputData.annualVariableCostChange || ''}
                    onChange={(e) => handleInputChange('annualVariableCostChange', e.target.value)}
                    placeholder="1"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`fixed-costs-${marketCode}`} className="text-xs">
                    Monthly Fixed Costs ({currencySymbol})
                  </Label>
                  <Input
                    id={`fixed-costs-${marketCode}`}
                    type="number"
                    value={inputData.allocatedMonthlyFixedCosts || ''}
                    onChange={(e) => handleInputChange('allocatedMonthlyFixedCosts', e.target.value)}
                    placeholder="15000"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`annual-fixed-cost-change-${marketCode}`} className="text-xs">
                    Annual Fixed Cost Change (%)
                  </Label>
                  <Input
                    id={`annual-fixed-cost-change-${marketCode}`}
                    type="number"
                    step="1"
                    value={inputData.annualFixedCostChange || ''}
                    onChange={(e) => handleInputChange('annualFixedCostChange', e.target.value)}
                    placeholder="2"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor={`marketing-budget-${marketCode}`} className="text-xs">
                    Total Marketing Budget ({currencySymbol})
                  </Label>
                  <Input
                    id={`marketing-budget-${marketCode}`}
                    type="number"
                    value={inputData.totalMarketingBudget || ''}
                    onChange={(e) => handleInputChange('totalMarketingBudget', e.target.value)}
                    placeholder="50000"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`marketing-spread-${marketCode}`} className="text-xs">
                    Marketing Budget Spread (Months)
                  </Label>
                  <Input
                    id={`marketing-spread-${marketCode}`}
                    type="number"
                    value={inputData.marketingSpreadMonths || ''}
                    onChange={(e) => handleInputChange('marketingSpreadMonths', e.target.value)}
                    placeholder="12"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* R&D Costs Section */}
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('rnd')}
            >
              <h3 className="text-sm font-medium">R&D Costs</h3>
              {expandedSections.rnd ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </div>
            
            {expandedSections.rnd && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`rnd-work-costs-${marketCode}`} className="text-xs">
                    R&D Work Costs ({currencySymbol})
                  </Label>
                  <Input
                    id={`rnd-work-costs-${marketCode}`}
                    type="number"
                    value={inputData.rndWorkCosts || ''}
                    onChange={(e) => handleInputChange('rndWorkCosts', e.target.value)}
                    placeholder="100000"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`rnd-material-costs-${marketCode}`} className="text-xs">
                    R&D Material & Machine Costs ({currencySymbol})
                  </Label>
                  <Input
                    id={`rnd-material-costs-${marketCode}`}
                    type="number"
                    value={inputData.rndMaterialMachineCosts || ''}
                    onChange={(e) => handleInputChange('rndMaterialMachineCosts', e.target.value)}
                    placeholder="75000"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`rnd-startup-costs-${marketCode}`} className="text-xs">
                    R&D Startup Production Costs ({currencySymbol})
                  </Label>
                  <Input
                    id={`rnd-startup-costs-${marketCode}`}
                    type="number"
                    value={inputData.rndStartupProductionCosts || ''}
                    onChange={(e) => handleInputChange('rndStartupProductionCosts', e.target.value)}
                    placeholder="50000"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`rnd-patent-costs-${marketCode}`} className="text-xs">
                    R&D Patent Costs ({currencySymbol})
                  </Label>
                  <Input
                    id={`rnd-patent-costs-${marketCode}`}
                    type="number"
                    value={inputData.rndPatentCosts || ''}
                    onChange={(e) => handleInputChange('rndPatentCosts', e.target.value)}
                    placeholder="25000"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Timing Section */}
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('timing')}
            >
              <h3 className="text-sm font-medium">R&D Timing Configuration</h3>
              {expandedSections.timing ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </div>
            
            {expandedSections.timing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`work-spread-${marketCode}`} className="text-xs">
                    Work Costs Spread (Months)
                  </Label>
                  <Input
                    id={`work-spread-${marketCode}`}
                    type="number"
                    value={inputData.rndWorkCostsSpread || ''}
                    onChange={(e) => handleInputChange('rndWorkCostsSpread', e.target.value)}
                    placeholder="12"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`material-spread-${marketCode}`} className="text-xs">
                    Material Costs Spread (Months)
                  </Label>
                  <Input
                    id={`material-spread-${marketCode}`}
                    type="number"
                    value={inputData.rndMaterialMachineSpread || ''}
                    onChange={(e) => handleInputChange('rndMaterialMachineSpread', e.target.value)}
                    placeholder="8"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`startup-spread-${marketCode}`} className="text-xs">
                    Startup Costs Spread (Months)
                  </Label>
                  <Input
                    id={`startup-spread-${marketCode}`}
                    type="number"
                    value={inputData.rndStartupProductionSpread || ''}
                    onChange={(e) => handleInputChange('rndStartupProductionSpread', e.target.value)}
                    placeholder="6"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`patent-spread-${marketCode}`} className="text-xs">
                    Patent Costs Spread (Months)
                  </Label>
                  <Input
                    id={`patent-spread-${marketCode}`}
                    type="number"
                    value={inputData.rndPatentSpread || ''}
                    onChange={(e) => handleInputChange('rndPatentSpread', e.target.value)}
                    placeholder="3"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Cannibalization Section */}
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('cannibalization')}
            >
              <h3 className="text-sm font-medium">Product Cannibalization</h3>
              {expandedSections.cannibalization ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </div>
            
            {expandedSections.cannibalization && (
              <AffectedProductsSection
                availableProducts={availableProducts}
                affectedProducts={inputData.affectedProducts || []}
                onAffectedProductsChange={handleAffectedProductsChange}
                currency={{ symbol: currencySymbol, name: selectedCurrency }}
                isLoading={isLoading}
              />
            )}
          </div>

          <div className="p-3 bg-blue-50 rounded-md text-xs text-blue-700">
            Complete all parameters for accurate NPV calculation. This will consider R&D costs, development phases, variable revenue and cost projections, and cannibalization impacts.
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
