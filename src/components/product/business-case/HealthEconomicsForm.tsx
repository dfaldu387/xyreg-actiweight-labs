import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  PiggyBank,
  Target,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useHealthEconomics, HealthEconomicsData, MarketHeorData, HeorByMarket } from '@/hooks/useHealthEconomics';
import { cn } from '@/lib/utils';

interface HealthEconomicsFormProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

const MODEL_TYPES = [
  { value: 'cost_savings', label: 'Cost Savings', icon: PiggyBank, description: 'Per-procedure cost reduction analysis' },
  { value: 'cost_utility', label: 'Cost-Utility (QALY)', icon: TrendingUp, description: 'Quality-adjusted life year analysis for HTA' },
  { value: 'budget_impact', label: 'Budget Impact', icon: Calculator, description: '3-year budget projection for payers' },
  { value: 'roi', label: 'ROI / Payback', icon: Clock, description: 'Return on investment for capital equipment' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
];

export function HealthEconomicsForm({ productId, companyId, disabled }: HealthEconomicsFormProps) {
  const { data, isLoading, save, isSaving } = useHealthEconomics(productId, companyId);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [searchParams] = useSearchParams();

  // Check if in Genesis flow
  const isInGenesisFlow = searchParams.get('returnTo') === 'genesis';

  // Market selection state
  const [heorMarket, setHeorMarket] = useState("US");
  
  // Per-market HEOR data
  const [heorByMarket, setHeorByMarket] = useState<HeorByMarket>({});
  
  // Helper to get current market's data
  const currentMarketData = heorByMarket[heorMarket] || {
    heor_model_type: null,
    cost_per_procedure_current: null,
    cost_per_procedure_new: null,
    cost_savings_per_procedure: null,
    procedure_volume_annual: null,
    cost_savings_annual: null,
    qaly_gain_estimate: null,
    icer_value: null,
    icer_currency: 'USD',
    willingness_to_pay_threshold: 50000,
    budget_impact_year1: null,
    budget_impact_year2: null,
    budget_impact_year3: null,
    budget_impact_notes: null,
    device_capital_cost: null,
    payback_period_months: null,
    roi_percent: null,
    heor_assumptions: null,
  };

  // Local form state (current market)
  const [formData, setFormData] = useState<Partial<MarketHeorData>>(currentMarketData);

  // Sync local form when market changes
  useEffect(() => {
    setFormData(heorByMarket[heorMarket] || {
      heor_model_type: null,
      cost_per_procedure_current: null,
      cost_per_procedure_new: null,
      cost_savings_per_procedure: null,
      procedure_volume_annual: null,
      cost_savings_annual: null,
      qaly_gain_estimate: null,
      icer_value: null,
      icer_currency: 'USD',
      willingness_to_pay_threshold: 50000,
      budget_impact_year1: null,
      budget_impact_year2: null,
      budget_impact_year3: null,
      budget_impact_notes: null,
      device_capital_cost: null,
      payback_period_months: null,
      roi_percent: null,
      heor_assumptions: null,
    });
  }, [heorMarket, heorByMarket]);

  // Sync with loaded data
  useEffect(() => {
    if (data) {
      // Handle backward compatibility: migrate legacy flat data to per-market structure
      let loadedHeorByMarket: HeorByMarket = {};
      
      if (data.heor_by_market && Object.keys(data.heor_by_market).length > 0) {
        loadedHeorByMarket = data.heor_by_market;
      } else if (data.heor_model_type) {
        // Legacy flat format - migrate to US market
        loadedHeorByMarket = {
          US: {
            heor_model_type: data.heor_model_type,
            cost_per_procedure_current: data.cost_per_procedure_current,
            cost_per_procedure_new: data.cost_per_procedure_new,
            cost_savings_per_procedure: data.cost_savings_per_procedure,
            procedure_volume_annual: data.procedure_volume_annual,
            cost_savings_annual: data.cost_savings_annual,
            qaly_gain_estimate: data.qaly_gain_estimate,
            icer_value: data.icer_value,
            icer_currency: data.icer_currency || 'USD',
            willingness_to_pay_threshold: data.willingness_to_pay_threshold || 50000,
            budget_impact_year1: data.budget_impact_year1,
            budget_impact_year2: data.budget_impact_year2,
            budget_impact_year3: data.budget_impact_year3,
            budget_impact_notes: data.budget_impact_notes,
            device_capital_cost: data.device_capital_cost,
            payback_period_months: data.payback_period_months,
            roi_percent: data.roi_percent,
            heor_assumptions: data.heor_assumptions,
          }
        };
      }
      
      setHeorByMarket(loadedHeorByMarket);
    }
  }, [data]);

  // Get configured markets
  const configuredHeorMarkets = Object.entries(heorByMarket)
    .filter(([_, marketData]) => marketData.heor_model_type)
    .map(([market, marketData]) => ({ market, modelType: marketData.heor_model_type }));

  // Calculated values
  const calculations = useMemo(() => {
    const costCurrent = formData.cost_per_procedure_current || 0;
    const costNew = formData.cost_per_procedure_new || 0;
    const volume = formData.procedure_volume_annual || 0;
    
    const savingsPerProcedure = costCurrent - costNew;
    const annualSavings = savingsPerProcedure * volume;
    
    const capitalCost = formData.device_capital_cost || 0;
    const paybackMonths = annualSavings > 0 ? Math.ceil((capitalCost / annualSavings) * 12) : null;
    const roiPercent = capitalCost > 0 ? ((annualSavings - capitalCost) / capitalCost) * 100 : null;

    const icer = formData.icer_value || 0;
    const threshold = formData.willingness_to_pay_threshold || 50000;
    const icerStatus = icer > 0 && icer <= threshold ? 'favorable' : icer > threshold ? 'unfavorable' : null;

    const totalBudgetImpact = (formData.budget_impact_year1 || 0) + 
                              (formData.budget_impact_year2 || 0) + 
                              (formData.budget_impact_year3 || 0);

    return {
      savingsPerProcedure,
      annualSavings,
      paybackMonths,
      roiPercent,
      icerStatus,
      totalBudgetImpact,
    };
  }, [formData]);

  // Auto-save function - saves per-market data
  const triggerAutoSave = useCallback((updatedFormData: Partial<MarketHeorData>, market: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      const costCurrent = updatedFormData.cost_per_procedure_current || 0;
      const costNew = updatedFormData.cost_per_procedure_new || 0;
      const volume = updatedFormData.procedure_volume_annual || 0;
      const savingsPerProcedure = costCurrent - costNew;
      const annualSavings = savingsPerProcedure * volume;

      // Create updated per-market structure
      const updatedHeorByMarket = {
        ...heorByMarket,
        [market]: {
          ...updatedFormData,
          cost_savings_per_procedure: savingsPerProcedure,
          cost_savings_annual: annualSavings,
        } as MarketHeorData,
      };
      
      setHeorByMarket(updatedHeorByMarket);

      // Save to database
      save({
        heor_by_market: updatedHeorByMarket,
        heor_completed: Object.values(updatedHeorByMarket).some(m => m.heor_model_type),
      });
    }, 500);
  }, [save, heorByMarket]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (field: keyof MarketHeorData, value: any) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    // Auto-save with debounce on every change
    triggerAutoSave(updatedFormData, heorMarket);
  };

  // Parse number input - allows 0 as valid value, returns null for empty
  const parseNumberInput = (value: string, isInteger = false): number | null => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = isInteger ? parseInt(value, 10) : parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const handleBlur = () => {
    triggerAutoSave(formData, heorMarket);
  };

  const handleModelTypeChange = (value: string) => {
    const updatedFormData = { ...formData, heor_model_type: value };
    setFormData(updatedFormData);
    triggerAutoSave(updatedFormData, heorMarket);
  };

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.value === formData.icer_currency)?.symbol || '$';
  };

  // Genesis flow completion checks
  const isCostSavingsComplete = Boolean(
    formData.cost_per_procedure_current &&
    formData.cost_per_procedure_new &&
    formData.procedure_volume_annual
  );

  const isCostUtilityComplete = Boolean(
    formData.qaly_gain_estimate &&
    formData.icer_value &&
    formData.willingness_to_pay_threshold
  );

  const isBudgetImpactComplete = Boolean(
    formData.budget_impact_year1 &&
    formData.budget_impact_year2 &&
    formData.budget_impact_year3 &&
    formData.budget_impact_notes?.trim()
  );

  // Border class helpers for Genesis flow
  const getCostSavingsBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (isCostSavingsComplete) return 'border-2 border-emerald-500 bg-emerald-50/30';
    return 'border-2 border-amber-400 bg-amber-50/30';
  };

  const getCostUtilityBorderClass = () => {
    // No border - only one model needs to be filled
    return '';
  };

  const getBudgetImpactBorderClass = () => {
    // No border - only one model needs to be filled
    return '';
  };

  // Get Genesis flow border class for model type selection buttons
  const getModelTypeBorderClass = (modelValue: string) => {
    if (!isInGenesisFlow) return '';

    switch (modelValue) {
      case 'cost_savings':
        return isCostSavingsComplete
          ? 'border-2 border-emerald-500 bg-emerald-50/30'
          : 'border-2 border-amber-400 bg-amber-50/30';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Market Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Health Economic Model (HEOR)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prove the ROI math to economic buyers. Show cost savings, QALY gains, or budget impact.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
          <Select value={heorMarket} onValueChange={setHeorMarket}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">US</SelectItem>
              <SelectItem value="EU">EU</SelectItem>
              <SelectItem value="UK">UK</SelectItem>
              <SelectItem value="JP">JP</SelectItem>
              <SelectItem value="CA">CA</SelectItem>
              <SelectItem value="AU">AU</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Configured markets badges */}
      {configuredHeorMarkets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {configuredHeorMarkets.map(({ market, modelType }) => (
            <Badge 
              key={market} 
              variant={market === heorMarket ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setHeorMarket(market)}
            >
              {market}: {MODEL_TYPES.find(m => m.value === modelType)?.label || modelType}
            </Badge>
          ))}
        </div>
      )}

      {/* Model Type Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Economic Model Type</CardTitle>
          <CardDescription>
            Choose the model that best demonstrates value to your target payers and buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {MODEL_TYPES.map((model) => {
              const Icon = model.icon;
              const isSelected = formData.heor_model_type === model.value;
              const genesisBorderClass = getModelTypeBorderClass(model.value);
              return (
                <button
                  key={model.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleModelTypeChange(model.value)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all relative",
                    // Base styling
                    !genesisBorderClass && (isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"),
                    // Genesis flow border (yellow/green)
                    genesisBorderClass,
                    // Selected state ring overlay (works with genesis borders)
                    isSelected && "ring-2 ring-primary ring-offset-2",
                    disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("font-medium text-sm", isSelected && "text-primary font-semibold")}>{model.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{model.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cost Savings Model */}
      {formData.heor_model_type === 'cost_savings' && (
        <Card className={getCostSavingsBorderClass()}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-600" />
              Cost Savings Calculator
            </CardTitle>
            <CardDescription>
              Calculate per-procedure savings and annual cost reduction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Current Cost per Procedure</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-9"
                    disabled={disabled}
                    value={formData.cost_per_procedure_current ?? ''}
                    onChange={(e) => handleInputChange('cost_per_procedure_current', parseNumberInput(e.target.value))}
                    onBlur={handleBlur}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Standard of care cost</p>
              </div>
              <div className="space-y-2">
                <Label>New Cost per Procedure</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-9"
                    disabled={disabled}
                    value={formData.cost_per_procedure_new ?? ''}
                    onChange={(e) => handleInputChange('cost_per_procedure_new', parseNumberInput(e.target.value))}
                    onBlur={handleBlur}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Cost with your device</p>
              </div>
              <div className="space-y-2">
                <Label>Annual Procedure Volume</Label>
                <Input
                  type="number"
                  placeholder="0"
                  disabled={disabled}
                  value={formData.procedure_volume_annual ?? ''}
                  onChange={(e) => handleInputChange('procedure_volume_annual', parseNumberInput(e.target.value, true))}
                  onBlur={handleBlur}
                />
                <p className="text-xs text-muted-foreground">At target facility</p>
              </div>
            </div>

            {/* Calculated Results */}
            {(formData.cost_per_procedure_current && formData.cost_per_procedure_new) && (
              <div className="mt-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Savings per Procedure</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ${calculations.savingsPerProcedure.toLocaleString()}
                    </p>
                  </div>
                  {formData.procedure_volume_annual && (
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Savings</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        ${calculations.annualSavings.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QALY / Cost-Utility Model */}
      {formData.heor_model_type === 'cost_utility' && (
        <Card className={getCostUtilityBorderClass()}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Cost-Utility Analysis (QALY/ICER)
            </CardTitle>
            <CardDescription>
              For HTA submissions (NICE, G-BA, etc.) showing value per quality-adjusted life year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>QALY Gain Estimate</Label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0.05"
                  disabled={disabled}
                  value={formData.qaly_gain_estimate ?? ''}
                  onChange={(e) => handleInputChange('qaly_gain_estimate', parseNumberInput(e.target.value))}
                  onBlur={handleBlur}
                />
                <p className="text-xs text-muted-foreground">Quality-adjusted life year improvement (e.g., 0.05)</p>
              </div>
              <div className="space-y-2">
                <Label>ICER Value</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.icer_currency || 'USD'}
                    onValueChange={(v) => {
                      handleInputChange('icer_currency', v);
                      triggerAutoSave({ ...formData, icer_currency: v }, heorMarket);
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="25000"
                    className="flex-1"
                    disabled={disabled}
                    value={formData.icer_value ?? ''}
                    onChange={(e) => handleInputChange('icer_value', parseNumberInput(e.target.value))}
                    onBlur={handleBlur}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Incremental cost-effectiveness ratio per QALY</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Willingness-to-Pay Threshold</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{getCurrencySymbol()}</span>
                <Input
                  type="number"
                  placeholder="50000"
                  className="pl-7"
                  disabled={disabled}
                  value={formData.willingness_to_pay_threshold ?? ''}
                  onChange={(e) => handleInputChange('willingness_to_pay_threshold', parseNumberInput(e.target.value))}
                  onBlur={handleBlur}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Payer's threshold (NICE: £20-30k, US: $50-150k per QALY)
              </p>
            </div>

            {/* ICER Status Indicator */}
            {calculations.icerStatus && (
              <div className={cn(
                "mt-4 p-4 rounded-lg border flex items-center gap-3",
                calculations.icerStatus === 'favorable' 
                  ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                  : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
              )}>
                {calculations.icerStatus === 'favorable' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">Cost-Effective</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-500">
                        ICER ({getCurrencySymbol()}{formData.icer_value?.toLocaleString()}/QALY) is below the threshold
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-400">Above Threshold</p>
                      <p className="text-sm text-amber-600 dark:text-amber-500">
                        ICER exceeds willingness-to-pay - may need additional value arguments
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Budget Impact Model */}
      {formData.heor_model_type === 'budget_impact' && (
        <Card className={getBudgetImpactBorderClass()}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              Budget Impact Analysis
            </CardTitle>
            <CardDescription>
              3-year projection for payer budget planning and formulary decisions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Year 1 Budget Impact</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-9"
                    disabled={disabled}
                    value={formData.budget_impact_year1 ?? ''}
                    onChange={(e) => handleInputChange('budget_impact_year1', parseNumberInput(e.target.value))}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Year 2 Budget Impact</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-9"
                    disabled={disabled}
                    value={formData.budget_impact_year2 ?? ''}
                    onChange={(e) => handleInputChange('budget_impact_year2', parseNumberInput(e.target.value))}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Year 3 Budget Impact</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-9"
                    disabled={disabled}
                    value={formData.budget_impact_year3 ?? ''}
                    onChange={(e) => handleInputChange('budget_impact_year3', parseNumberInput(e.target.value))}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            </div>

            {calculations.totalBudgetImpact !== 0 && (
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                <p className="text-sm text-muted-foreground">3-Year Total Budget Impact</p>
                <p className={cn(
                  "text-2xl font-bold",
                  calculations.totalBudgetImpact < 0 ? "text-emerald-600" : "text-purple-600"
                )}>
                  {calculations.totalBudgetImpact < 0 ? '-' : '+'}${Math.abs(calculations.totalBudgetImpact).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {calculations.totalBudgetImpact < 0 ? 'Net savings' : 'Net cost increase'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Budget Impact Notes</Label>
              <Textarea
                placeholder="Describe assumptions, patient population, market uptake projections..."
                disabled={disabled}
                value={formData.budget_impact_notes || ''}
                onChange={(e) => handleInputChange('budget_impact_notes', e.target.value)}
                onBlur={handleBlur}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ROI / Payback Model */}
      {formData.heor_model_type === 'roi' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              ROI & Payback Calculator
            </CardTitle>
            <CardDescription>
              Return on investment analysis for capital equipment purchases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device Capital Cost</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-9"
                    disabled={disabled}
                    value={formData.device_capital_cost ?? ''}
                    onChange={(e) => handleInputChange('device_capital_cost', parseNumberInput(e.target.value))}
                    onBlur={handleBlur}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Initial purchase price</p>
              </div>
              <div className="space-y-2">
                <Label>Annual Savings Generated</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-9 bg-muted"
                    disabled
                    value={calculations.annualSavings || formData.cost_savings_annual || ''}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  From Cost Savings section - select Cost Savings model first to calculate
                </p>
              </div>
            </div>

            {/* Calculated ROI Results */}
            {(formData.device_capital_cost && calculations.annualSavings > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <p className="text-sm text-muted-foreground">Payback Period</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {calculations.paybackMonths} months
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculations.paybackMonths && calculations.paybackMonths <= 12 
                      ? 'Excellent - under 1 year' 
                      : calculations.paybackMonths && calculations.paybackMonths <= 24 
                        ? 'Good - under 2 years'
                        : 'Consider additional value drivers'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <p className="text-sm text-muted-foreground">First Year ROI</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    (calculations.roiPercent || 0) > 0 ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {calculations.roiPercent?.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Return on investment in year 1
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Assumptions - Always visible when a model is selected */}
      {formData.heor_model_type && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Key Model Assumptions
            </CardTitle>
            <CardDescription>
              Document the assumptions underlying your economic model for transparency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="List key assumptions: patient population, time horizon, comparator, data sources, discount rates..."
              disabled={disabled}
              value={formData.heor_assumptions || ''}
              onChange={(e) => handleInputChange('heor_assumptions', e.target.value)}
              onBlur={handleBlur}
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* No model selected state */}
      {!formData.heor_model_type && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select an Economic Model</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Choose the model type above that best demonstrates value to your target economic buyers and payers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
