import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, RefreshCw, Download, Loader2, ExternalLink, Calculator } from "lucide-react";
import { EnhancedProductMarket } from "@/utils/enhancedMarketRiskClassMapping";
import { getMarketCurrency } from "@/utils/marketCurrencyUtils";
import { formatNumberWithCommas, parseFormattedNumber } from "@/utils/currencyUtils";
import { HelpTooltip } from "@/components/product/device/sections/HelpTooltip";
import { MARKET_ANALYSIS_TOOLTIPS } from "@/data/marketAnalysisTooltips";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSuggestedDiscountRate } from "./InvestmentRealityCheck";

export interface MarketSpecificInputs {
  marketCode: string;
  marketName: string;
  
  // Revenue Model - Unit-based approach
  launchDate: Date | null;
  patentExpiry: number;
  postPatentDeclineRate: number;
  monthlySalesForecast: number;
  initialUnitPrice: number;
  annualSalesForecastChange: number;
  annualUnitPriceChange: number;
  
  // Cost Structure
  developmentCosts: number;
  clinicalTrialCosts: number;
  regulatoryCosts: number;
  manufacturingCosts: number;
  marketingCosts: number;
  operationalCosts: number;
  customerAcquisitionCost: number;
  
  // Risk Assessment
  technicalRisk: number;
  regulatoryRisk: number;
  commercialRisk: number;
  competitiveRisk: number;
  
  // Financial Parameters
  discountRate: number;
  taxRate: number;
  projectLifetime: number;
  
  // Cannibalization Impact
  cannibalizationRate: number;
  affectedProductRevenue: number;
}

interface MarketAnalysisFormProps {
  market: EnhancedProductMarket;
  inputs: MarketSpecificInputs;
  onInputChange: (field: keyof MarketSpecificInputs, value: number | Date | null) => void;
  isUsingRealBudgetData?: boolean;
  realDevelopmentCosts?: number;
  disabled?: boolean;
  budgetSource?: 'milestones' | 'saved' | 'manual';
  onGetFromBudget?: () => void;
  isLoadingBudget?: boolean;
  isPostLaunch?: boolean; // Product has been launched - Technical Risk is "validated"
  // New props for cumulative LoS display
  cumulativeTechnicalLoS?: number; // Calculated from phases
  productId?: string; // For navigation to milestones
  phasesInfo?: {
    completedCount: number;
    remainingCount: number;
    allCompleted: boolean;
  };
}

export function MarketAnalysisForm({ 
  market, 
  inputs, 
  onInputChange, 
  isUsingRealBudgetData = false, 
  realDevelopmentCosts = 0, 
  disabled = false,
  budgetSource = 'manual',
  onGetFromBudget,
  isLoadingBudget = false,
  isPostLaunch = false,
  cumulativeTechnicalLoS,
  productId,
  phasesInfo
}: MarketAnalysisFormProps) {
  const navigate = useNavigate();
  const currency = getMarketCurrency(market.code);
  
  // Collapsible state for sections
  const [isRevenueOpen, setIsRevenueOpen] = useState(true);
  const [isCostOpen, setIsCostOpen] = useState(true);
  const [isRiskOpen, setIsRiskOpen] = useState(false);
  const [isFinancialOpen, setIsFinancialOpen] = useState(false);
  const [isCannibalizationOpen, setIsCannibalizationOpen] = useState(false);
  
  // Track if user has manually overridden milestone data
  const [hasManualOverride, setHasManualOverride] = useState(false);

  const handleInputChange = (field: keyof MarketSpecificInputs, value: string) => {
    const numValue = parseFormattedNumber(value);
    
    // Track manual override for developmentCosts
    if (field === 'developmentCosts' && isUsingRealBudgetData) {
      setHasManualOverride(true);
    }
    
    onInputChange(field, numValue);
  };
  
  const handleReloadFromMilestones = () => {
    if (isUsingRealBudgetData && realDevelopmentCosts) {
      onInputChange('developmentCosts', realDevelopmentCosts);
      setHasManualOverride(false);
    }
  };

  // Fields that should display formatted numbers (currency fields)
  const currencyFields = [
    'initialUnitPrice', 'developmentCosts', 'clinicalTrialCosts', 'regulatoryCosts',
    'manufacturingCosts', 'marketingCosts', 'operationalCosts', 'customerAcquisitionCost', 'affectedProductRevenue'
  ];

  const getDisplayValue = (field: keyof MarketSpecificInputs, value: number): string => {
    if (currencyFields.includes(field)) {
      return formatNumberWithCommas(value);
    }
    return value.toString();
  };

  return (
    <div className={cn("space-y-6", disabled && "opacity-60 pointer-events-none")}>
      {/* Revenue Model Section */}
      <Card>
        <Collapsible open={isRevenueOpen} onOpenChange={setIsRevenueOpen}>
          <CardHeader className="cursor-pointer">
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-base">Revenue Model - {market.name}</CardTitle>
              <ChevronDown className={`h-5 w-5 transition-transform ${isRevenueOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="launchDate">Launch Date</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.launchDate} />
                  </div>
                  <Input
                    id="launchDate"
                    type="date"
                    value={inputs.launchDate ? inputs.launchDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => onInputChange('launchDate', e.target.value ? new Date(e.target.value) : null)}
                    className="w-full"
                  />
                  {inputs.launchDate && new Date(inputs.launchDate) > new Date() && (
                    <p className="text-xs text-muted-foreground">
                      Future launch date - Product not yet launched
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="patentExpiry">Patent Expiry</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.patentExpiry} />
                  </div>
                  <Input
                    id="patentExpiry"
                    type="number"
                    value={inputs.patentExpiry}
                    onChange={(e) => handleInputChange('patentExpiry', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="postPatentDeclineRate">Post-Patent Annual Decline Rate (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.postPatentDeclineRate} />
                  </div>
                  <Input
                    id="postPatentDeclineRate"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="30"
                    value={inputs.postPatentDeclineRate}
                    onChange={(e) => handleInputChange('postPatentDeclineRate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="monthlySalesForecast">Monthly Sales Forecast (Units)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.monthlySalesForecast} />
                  </div>
                  <Input
                    id="monthlySalesForecast"
                    type="number"
                    value={inputs.monthlySalesForecast}
                    onChange={(e) => handleInputChange('monthlySalesForecast', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="initialUnitPrice">Initial Unit Price ({currency.symbol})</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.initialUnitPrice} />
                  </div>
                  <Input
                    id="initialUnitPrice"
                    type="text"
                    value={getDisplayValue('initialUnitPrice', inputs.initialUnitPrice)}
                    onChange={(e) => handleInputChange('initialUnitPrice', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="annualSalesForecastChange">Annual Sales Change (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.annualSalesForecastChange} />
                  </div>
                  <Input
                    id="annualSalesForecastChange"
                    type="text"
                    inputMode="numeric"
                    value={inputs.annualSalesForecastChange === 0 ? '' : inputs.annualSalesForecastChange.toString()}
                    onChange={(e) => handleInputChange('annualSalesForecastChange', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="annualUnitPriceChange">Annual Price Change (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.annualUnitPriceChange} />
                  </div>
                  <Input
                    id="annualUnitPriceChange"
                    type="text"
                    inputMode="numeric"
                    value={inputs.annualUnitPriceChange === 0 ? '' : inputs.annualUnitPriceChange.toString()}
                    onChange={(e) => handleInputChange('annualUnitPriceChange', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Cost Structure Section */}
      <Card>
        <Collapsible open={isCostOpen} onOpenChange={setIsCostOpen}>
          <CardHeader className="cursor-pointer">
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-base">Cost Structure - {market.name}</CardTitle>
              <ChevronDown className={`h-5 w-5 transition-transform ${isCostOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label htmlFor="developmentCosts">Development Costs ({currency.symbol})</Label>
                    {budgetSource && (
                      <Badge 
                        variant={budgetSource === 'milestones' ? 'default' : 'outline'} 
                        className="text-xs"
                      >
                        {budgetSource === 'milestones' ? 'From Budget' : 
                         budgetSource === 'saved' ? 'Saved' : 'Manual'}
                      </Badge>
                    )}
                    <HelpTooltip content={
                      isUsingRealBudgetData 
                        ? "Auto-populated from milestone phase budgets. This reflects the total project budget. Click 'Get from Budget' to refresh."
                        : MARKET_ANALYSIS_TOOLTIPS.developmentCosts
                    } />
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="developmentCosts"
                        type="text"
                        value={getDisplayValue('developmentCosts', inputs.developmentCosts)}
                        onChange={(e) => handleInputChange('developmentCosts', e.target.value)}
                        className={cn(
                          hasManualOverride && budgetSource !== 'manual' && "ring-1 ring-primary"
                        )}
                      />
                      {hasManualOverride && budgetSource !== 'manual' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                          onClick={handleReloadFromMilestones}
                          title="Reload from milestones"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {onGetFromBudget && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onGetFromBudget}
                          disabled={isLoadingBudget}
                          className="whitespace-nowrap"
                        >
                          {isLoadingBudget ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3 mr-1" />
                          )}
                          Get from Budget
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="clinicalTrialCosts">Clinical Trial Costs ({currency.symbol})</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.clinicalTrialCosts} />
                  </div>
                  <Input
                    id="clinicalTrialCosts"
                    type="text"
                    value={getDisplayValue('clinicalTrialCosts', inputs.clinicalTrialCosts)}
                    onChange={(e) => handleInputChange('clinicalTrialCosts', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="regulatoryCosts">Regulatory Costs ({currency.symbol})</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.regulatoryCosts} />
                  </div>
                  <Input
                    id="regulatoryCosts"
                    type="text"
                    value={getDisplayValue('regulatoryCosts', inputs.regulatoryCosts)}
                    onChange={(e) => handleInputChange('regulatoryCosts', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="manufacturingCosts">Manufacturing Costs ({currency.symbol})</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.manufacturingCosts} />
                  </div>
                  <Input
                    id="manufacturingCosts"
                    type="text"
                    value={getDisplayValue('manufacturingCosts', inputs.manufacturingCosts)}
                    onChange={(e) => handleInputChange('manufacturingCosts', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="marketingCosts">Marketing Costs ({currency.symbol})</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.marketingCosts} />
                  </div>
                  <Input
                    id="marketingCosts"
                    type="text"
                    value={getDisplayValue('marketingCosts', inputs.marketingCosts)}
                    onChange={(e) => handleInputChange('marketingCosts', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="operationalCosts">Operational Costs ({currency.symbol})</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.operationalCosts} />
                  </div>
                  <Input
                    id="operationalCosts"
                    type="text"
                    value={getDisplayValue('operationalCosts', inputs.operationalCosts)}
                    onChange={(e) => handleInputChange('operationalCosts', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="customerAcquisitionCost">Customer Acquisition Cost ({currency.symbol})</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.customerAcquisitionCost} />
                  </div>
                  <Input
                    id="customerAcquisitionCost"
                    type="text"
                    value={getDisplayValue('customerAcquisitionCost', inputs.customerAcquisitionCost)}
                    onChange={(e) => handleInputChange('customerAcquisitionCost', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Risk Assessment Section */}
      <Card>
        <Collapsible open={isRiskOpen} onOpenChange={setIsRiskOpen}>
          <CardHeader className="cursor-pointer">
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-base">Risk Assessment - {market.name}</CardTitle>
              <ChevronDown className={`h-5 w-5 transition-transform ${isRiskOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Technical LoS - Read-only calculated display */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground">
                      Technical LoS (from Phases)
                    </Label>
                    <HelpTooltip content="Cumulative Likelihood of Success calculated from phase milestones. Completed phases are treated as 100% (risk retired). Click to edit individual phase LoS values." />
                    <Badge 
                      variant={phasesInfo?.allCompleted ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {phasesInfo?.allCompleted ? (
                        <>✓ Validated</>
                      ) : (
                        <>
                          <Calculator className="h-3 w-3 mr-1" />
                          Calculated
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  {/* Clickable LoS Display */}
                  <button
                    type="button"
                    onClick={() => {
                      if (productId) {
                        navigate(`/app/product/${productId}/milestones?returnTo=business-case`);
                      }
                    }}
                    disabled={!productId}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md border transition-colors text-left",
                      productId 
                        ? "hover:bg-accent hover:border-primary cursor-pointer group" 
                        : "cursor-not-allowed opacity-60",
                      phasesInfo?.allCompleted 
                        ? "bg-success/10 border-success/30" 
                        : "bg-muted/50 border-input"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xl font-bold",
                        phasesInfo?.allCompleted ? "text-success" : 
                        (cumulativeTechnicalLoS || 100) >= 70 ? "text-foreground" :
                        (cumulativeTechnicalLoS || 100) >= 40 ? "text-warning" : "text-destructive"
                      )}>
                        {(cumulativeTechnicalLoS ?? 100).toFixed(1)}%
                      </span>
                      {productId && (
                        <span className="text-xs text-muted-foreground group-hover:text-primary flex items-center gap-1">
                          Edit in Milestones
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </button>
                  
                  {/* Phase breakdown info */}
                  <p className="text-xs text-muted-foreground">
                    {phasesInfo?.allCompleted ? (
                      "All development phases completed - risk retired"
                    ) : phasesInfo ? (
                      `Based on ${phasesInfo.completedCount + phasesInfo.remainingCount} phases (${phasesInfo.completedCount} completed, ${phasesInfo.remainingCount} remaining)`
                    ) : (
                      "Set phase LoS values in the Milestones page"
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="regulatoryRisk">Regulatory Risk (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.regulatoryRisk} />
                  </div>
                  <Input
                    id="regulatoryRisk"
                    type="number"
                    step="1"
                    value={inputs.regulatoryRisk}
                    onChange={(e) => handleInputChange('regulatoryRisk', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="commercialRisk">Commercial Risk (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.commercialRisk} />
                  </div>
                  <Input
                    id="commercialRisk"
                    type="number"
                    step="1"
                    value={inputs.commercialRisk}
                    onChange={(e) => handleInputChange('commercialRisk', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="competitiveRisk">Competitive Risk (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.competitiveRisk} />
                  </div>
                  <Input
                    id="competitiveRisk"
                    type="number"
                    step="1"
                    value={inputs.competitiveRisk}
                    onChange={(e) => handleInputChange('competitiveRisk', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Financial Parameters Section */}
      <Card>
        <Collapsible open={isFinancialOpen} onOpenChange={setIsFinancialOpen}>
          <CardHeader className="cursor-pointer">
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-base">Financial Parameters - {market.name}</CardTitle>
              <ChevronDown className={`h-5 w-5 transition-transform ${isFinancialOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="discountRate">Discount Rate (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.discountRate} />
                    {/* Suggested rate indicator for high-risk projects */}
                    {cumulativeTechnicalLoS !== undefined && cumulativeTechnicalLoS < 40 && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          inputs.discountRate < getSuggestedDiscountRate(cumulativeTechnicalLoS) 
                            ? "border-warning text-warning" 
                            : "text-muted-foreground"
                        )}
                      >
                        Suggested: {getSuggestedDiscountRate(cumulativeTechnicalLoS)}%
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="discountRate"
                    type="number"
                    step="0.1"
                    value={inputs.discountRate}
                    onChange={(e) => handleInputChange('discountRate', e.target.value)}
                    className={cn(
                      cumulativeTechnicalLoS !== undefined && 
                      cumulativeTechnicalLoS < 40 && 
                      inputs.discountRate < getSuggestedDiscountRate(cumulativeTechnicalLoS) &&
                      "ring-1 ring-warning"
                    )}
                  />
                  {cumulativeTechnicalLoS !== undefined && 
                   cumulativeTechnicalLoS < 40 && 
                   inputs.discountRate < getSuggestedDiscountRate(cumulativeTechnicalLoS) && (
                    <p className="text-xs text-warning">
                      High-risk projects require higher hurdle rates
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.taxRate} />
                  </div>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    value={inputs.taxRate}
                    onChange={(e) => handleInputChange('taxRate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="projectLifetime">Project Lifetime (years)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.projectLifetime} />
                  </div>
                  <Input
                    id="projectLifetime"
                    type="number"
                    value={inputs.projectLifetime}
                    onChange={(e) => handleInputChange('projectLifetime', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Cannibalization Impact Section */}
      <Card>
        <Collapsible open={isCannibalizationOpen} onOpenChange={setIsCannibalizationOpen}>
          <CardHeader className="cursor-pointer">
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
              <CardTitle className="text-base">Cannibalization Impact - {market.name}</CardTitle>
              <ChevronDown className={`h-5 w-5 transition-transform ${isCannibalizationOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="cannibalizationRate">Cannibalization Rate (%)</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.cannibalizationRate} />
                  </div>
                  <Input
                    id="cannibalizationRate"
                    type="number"
                    step="0.1"
                    value={inputs.cannibalizationRate}
                    onChange={(e) => handleInputChange('cannibalizationRate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="affectedProductRevenue">Affected Product Revenue ({currency.symbol})</Label>
                    <HelpTooltip content={MARKET_ANALYSIS_TOOLTIPS.affectedProductRevenue} />
                  </div>
                  <Input
                    id="affectedProductRevenue"
                    type="text"
                    value={getDisplayValue('affectedProductRevenue', inputs.affectedProductRevenue)}
                    onChange={(e) => handleInputChange('affectedProductRevenue', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}