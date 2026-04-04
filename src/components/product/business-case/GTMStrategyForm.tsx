import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Route, Save, Loader2, Plus, X, AlertTriangle, Globe, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useGTMStrategy, GTMChannel, Territory } from "@/hooks/useGTMStrategy";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { GenesisStepNotice } from "./GenesisStepNotice";
import { supabase } from "@/integrations/supabase/client";
import { MARKET_CONFIGS, BUYER_TYPE_OPTIONS, getActiveWarnings, MarketCode, getMarketConfig, normalizeMarketCode } from "./StakeholderProfiler/marketConfigurations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GTMStrategyFormProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

const CHANNEL_I18N_KEYS: Record<string, string> = {
  direct: 'gtmStrategy.channels.directSales',
  distribution: 'gtmStrategy.channels.distributionPartners',
  strategic: 'gtmStrategy.channels.strategicPartnerships',
  licensing: 'gtmStrategy.channels.licensingModel',
  other: 'gtmStrategy.channels.other',
};

const DEFAULT_CHANNELS: GTMChannel[] = [
  { id: "direct", name: "Direct Sales", enabled: false },
  { id: "distribution", name: "Distribution Partners", enabled: false },
  { id: "strategic", name: "Strategic Partnerships", enabled: false },
  { id: "licensing", name: "Licensing Model", enabled: false },
  { id: "other", name: "Other", enabled: false },
];

const BUDGET_CYCLE_OPTIONS: Record<string, { value: string; labelKey: string }[]> = {
  USA: [
    { value: 'q4_capex', labelKey: 'gtmStrategy.budgetCycles.q4CapexPlanning' },
    { value: 'annual_jan', labelKey: 'gtmStrategy.budgetCycles.annualJanFiscal' },
    { value: 'annual_oct', labelKey: 'gtmStrategy.budgetCycles.annualOctFiscal' },
  ],
  UK: [
    { value: 'nhs_apr', labelKey: 'gtmStrategy.budgetCycles.nhsYearApril' },
    { value: 'innovation_fund', labelKey: 'gtmStrategy.budgetCycles.innovationFundCycles' },
  ],
  Japan: [
    { value: 'annual_apr', labelKey: 'gtmStrategy.budgetCycles.japaneseFiscalApril' },
  ],
  default: [
    { value: 'annual', labelKey: 'gtmStrategy.budgetCycles.annual' },
    { value: 'quarterly', labelKey: 'gtmStrategy.budgetCycles.quarterly' },
    { value: 'ad_hoc', labelKey: 'gtmStrategy.budgetCycles.adHoc' },
  ],
};

export function GTMStrategyForm({ productId, companyId, disabled }: GTMStrategyFormProps) {
  const { data, isLoading, save, isSaving } = useGTMStrategy(productId, companyId);
  const queryClient = useQueryClient();
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();

  // Check if in Genesis flow
  const isInGenesisFlow = searchParams.get('returnTo') === 'genesis';
  
  const [formData, setFormData] = useState({
    channels: DEFAULT_CHANNELS,
    territory_priority: [] as Territory[],
    buyer_persona: "",
    budget_cycle: "",
    sales_cycle_weeks: "",
    customers_for_1m_arr: "",
    customers_for_5m_arr: "",
    notes: "",
  });

  const [newTerritory, setNewTerritory] = useState({ code: "", name: "", rationale: "" });
  
  // Collapsible accordion state
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  
  const toggleCardExpansion = (marketCode: string) => {
    setExpandedCards(prev =>
      prev.includes(marketCode)
        ? prev.filter(code => code !== marketCode)
        : [...prev, marketCode]
    );
  };

  // Genesis flow completion check - requires channels OR territory configured
  const hasChannelsConfigured = formData.channels.some(c => c.enabled);
  const hasTerritoriesConfigured = formData.territory_priority.length > 0;

  // Get Genesis flow border class for Sales Channels section only
  // Shows green only when channels are configured (not based on territories)
  const getGenesisBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasChannelsConfigured) return 'border-2 border-emerald-500 bg-emerald-50/30';
    return 'border-2 border-amber-400 bg-amber-50/30';
  };

  // Auto-save refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Mark initial load complete after data loads
  useEffect(() => {
    if (!isLoading) {
      isInitialLoadRef.current = false;
    }
  }, [isLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save callback
  const triggerAutoSave = useCallback((updatedFormData: typeof formData) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[GTMStrategy] Auto-saving...', {
          channels: updatedFormData.channels.filter(c => c.enabled),
          territory_priority: updatedFormData.territory_priority,
        });
        await save({
          channels: updatedFormData.channels,
          territory_priority: updatedFormData.territory_priority,
          buyer_persona: updatedFormData.buyer_persona || null,
          budget_cycle: updatedFormData.budget_cycle || null,
          sales_cycle_weeks: updatedFormData.sales_cycle_weeks ? parseInt(updatedFormData.sales_cycle_weeks) : null,
          customers_for_1m_arr: updatedFormData.customers_for_1m_arr ? parseInt(updatedFormData.customers_for_1m_arr) : null,
          customers_for_5m_arr: updatedFormData.customers_for_5m_arr ? parseInt(updatedFormData.customers_for_5m_arr) : null,
          notes: updatedFormData.notes || null,
        });
        console.log('[GTMStrategy] Auto-save complete');
        queryClient.invalidateQueries({ queryKey: ["funnel-gtm-strategy", productId] });
      } catch (error) {
        console.error("[GTMStrategy] Auto-save failed:", error);
      }
    }, 1200);
  }, [save, queryClient, productId]);

  // Fetch product's target markets
  const { data: product } = useQuery({
    queryKey: ['product-markets', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('markets')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const targetMarkets = (product?.markets as any[])?.filter(m => m.selected) || [];

  // Auto-expand first market when territories load
  useEffect(() => {
    if (formData.territory_priority.length > 0 && expandedCards.length === 0) {
      setExpandedCards([formData.territory_priority[0].code]);
    }
  }, [formData.territory_priority, expandedCards.length]);

  useEffect(() => {
    if (data) {
      setFormData({
        channels: data.channels.length > 0 ? data.channels : DEFAULT_CHANNELS,
        territory_priority: data.territory_priority || [],
        buyer_persona: data.buyer_persona || "",
        budget_cycle: data.budget_cycle || "",
        sales_cycle_weeks: data.sales_cycle_weeks?.toString() || "",
        customers_for_1m_arr: data.customers_for_1m_arr?.toString() || "",
        customers_for_5m_arr: data.customers_for_5m_arr?.toString() || "",
        notes: data.notes || "",
      });
    }
  }, [data]);

  // Auto-populate territories from target markets ONLY if no saved data exists
  // Check data.territory_priority directly (not formData) to avoid race conditions
  useEffect(() => {
    const savedTerritories = data?.territory_priority || [];
    const hasSavedTerritories = savedTerritories.length > 0;

    // Only auto-populate if no saved territories AND target markets exist
    if (targetMarkets.length > 0 && !hasSavedTerritories && data !== undefined) {
      const newTerritories: Territory[] = targetMarkets.map((market: any, idx: number) => {
        const config = MARKET_CONFIGS[market.code as MarketCode];
        return {
          code: market.code,
          name: config?.label || market.name || market.code,
          priority: idx + 1,
          rationale: '',
        };
      });
      setFormData(prev => ({ ...prev, territory_priority: newTerritories }));
      // Auto-expand the first one
      if (newTerritories.length > 0) {
        setExpandedCards([newTerritories[0].code]);
      }
    }
  }, [targetMarkets, data]);

  const handleChannelToggle = (channelId: string, enabled: boolean) => {
    const updatedFormData = {
      ...formData,
      channels: formData.channels.map((c) =>
        c.id === channelId ? { ...c, enabled } : c
      ),
    };
    setFormData(updatedFormData);
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(updatedFormData);
    }
  };

  const handleChannelDetails = (channelId: string, details: string) => {
    const updatedFormData = {
      ...formData,
      channels: formData.channels.map((c) =>
        c.id === channelId ? { ...c, details } : c
      ),
    };
    setFormData(updatedFormData);
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(updatedFormData);
    }
  };

  const addTerritory = () => {
    if (!newTerritory.code || !newTerritory.name) return;
    const priority = formData.territory_priority.length + 1;
    const newTerr = { ...newTerritory, priority };
    const updatedFormData = {
      ...formData,
      territory_priority: [...formData.territory_priority, newTerr],
    };
    setFormData(updatedFormData);
    setNewTerritory({ code: "", name: "", rationale: "" });
    // Auto-expand the newly added territory
    setExpandedCards(prev => [...prev, newTerritory.code]);
    // Auto-save
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(updatedFormData);
    }
  };

  const removeTerritory = (code: string) => {
    const updatedTerritories = formData.territory_priority
      .filter((t) => t.code !== code)
      .map((t, i) => ({ ...t, priority: i + 1 }));
    const updatedFormData = {
      ...formData,
      territory_priority: updatedTerritories,
    };
    setFormData(updatedFormData);
    // Remove from expanded cards
    setExpandedCards(prev => prev.filter(c => c !== code));
    // Auto-save
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(updatedFormData);
    }
  };

  const updateTerritoryField = (code: string, field: keyof Territory, value: any) => {
    const updatedFormData = {
      ...formData,
      territory_priority: formData.territory_priority.map((t) =>
        t.code === code ? { ...t, [field]: value } : t
      ),
    };
    setFormData(updatedFormData);
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave(updatedFormData);
    }
  };

  const getBuyerOptions = (code: string) => {
    const normalizedCode = normalizeMarketCode(code);
    return BUYER_TYPE_OPTIONS[normalizedCode || code] || BUYER_TYPE_OPTIONS.default;
  };

  const getBudgetCycleOptions = (code: string) => {
    const normalizedCode = normalizeMarketCode(code);
    return BUDGET_CYCLE_OPTIONS[normalizedCode || code] || BUDGET_CYCLE_OPTIONS.default;
  };

  // Check if a market has data configured
  const getMarketCompletionStatus = (code: string) => {
    const territory = formData.territory_priority.find(t => t.code === code);
    if (!territory) return { hasData: false, completedItems: 0, total: 4 };
    const completedItems = [
      territory.buyerType,
      territory.procurementPath,
      territory.salesCycleWeeks,
      territory.budgetCycle
    ].filter(Boolean).length;
    return { hasData: completedItems > 0, completedItems, total: 4, isComplete: completedItems === 4 };
  };

  const handleSave = async () => {
    try {
      await save({
        channels: formData.channels,
        territory_priority: formData.territory_priority,
        buyer_persona: formData.buyer_persona || null,
        budget_cycle: formData.budget_cycle || null,
        sales_cycle_weeks: formData.sales_cycle_weeks ? parseInt(formData.sales_cycle_weeks) : null,
        customers_for_1m_arr: formData.customers_for_1m_arr ? parseInt(formData.customers_for_1m_arr) : null,
        customers_for_5m_arr: formData.customers_for_5m_arr ? parseInt(formData.customers_for_5m_arr) : null,
        notes: formData.notes || null,
      });
      queryClient.invalidateQueries({ queryKey: ["funnel-gtm-strategy", productId] });
      toast.success(lang('gtmStrategy.toast.saveSuccess'));
    } catch (error) {
      toast.error(lang('gtmStrategy.toast.saveError'));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Genesis Step Notice - internal only */}
      <GenesisStepNotice stepNumber={17} stepName="Go-to-Market Strategy" />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            {lang('gtmStrategy.title')}
          </CardTitle>
          <CardDescription>
            {lang('gtmStrategy.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sales Channels - Genesis border wrapper */}
          <div className={cn("space-y-4 p-4 rounded-lg", getGenesisBorderClass())}>
            {/* Sales Channels */}
              <Label className="text-base font-semibold">{lang('gtmStrategy.salesChannels.title')}</Label>
              <div className="space-y-3">
                {formData.channels.map((channel) => (
                  <div key={channel.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={channel.id}
                        checked={channel.enabled}
                        onCheckedChange={(checked) => handleChannelToggle(channel.id, !!checked)}
                        disabled={disabled}
                      />
                      <Label htmlFor={channel.id} className="cursor-pointer">{CHANNEL_I18N_KEYS[channel.id] ? lang(CHANNEL_I18N_KEYS[channel.id]) : channel.name}</Label>
                    </div>
                    {channel.enabled && (
                      <Input
                        value={channel.details || ""}
                        onChange={(e) => handleChannelDetails(channel.id, e.target.value)}
                        placeholder={lang('gtmStrategy.salesChannels.detailsPlaceholder').replace('{{channel}}', CHANNEL_I18N_KEYS[channel.id] ? lang(CHANNEL_I18N_KEYS[channel.id]).toLowerCase() : channel.name.toLowerCase())}
                        className="ml-7 min-w-44 max-w-[calc(100vw-35rem)]"
                        disabled={disabled}
                      />
                    )}
                  </div>
                ))}
              </div>
          </div>

          {/* Territory Sales Process - Collapsible Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {lang('gtmStrategy.territorySalesProcess.title')}
              </Label>
              
              {/* Add Custom Territory */}
              <div className="flex gap-1 items-center">
                <Input
                  value={newTerritory.code}
                  onChange={(e) => setNewTerritory({ ...newTerritory, code: e.target.value.toUpperCase() })}
                  placeholder={lang('gtmStrategy.territorySalesProcess.codePlaceholder')}
                  className="w-16 h-8 text-xs"
                  disabled={disabled}
                />
                <Input
                  value={newTerritory.name}
                  onChange={(e) => setNewTerritory({ ...newTerritory, name: e.target.value })}
                  placeholder={lang('gtmStrategy.territorySalesProcess.namePlaceholder')}
                  className="w-24 h-8 text-xs"
                  disabled={disabled}
                />
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={addTerritory} 
                  disabled={disabled || !newTerritory.code || !newTerritory.name}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Empty State */}
            {targetMarkets.length === 0 && formData.territory_priority.length === 0 ? (
              <Alert>
                <AlertDescription>
                  {lang('gtmStrategy.territorySalesProcess.emptyState')}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {formData.territory_priority.map((territory) => {
                  const config = getMarketConfig(territory.code);
                  const normalizedCode = normalizeMarketCode(territory.code);
                  const isExpanded = expandedCards.includes(territory.code);
                  const status = getMarketCompletionStatus(territory.code);
                  const warnings = config && normalizedCode
                    ? getActiveWarnings(normalizedCode, {
                        coding_strategy: territory.procurementPath,
                        vbp_status: territory.procurementPath,
                        budget_type: territory.buyerType,
                      })
                    : [];
                  
                  return (
                    <Collapsible key={territory.code} open={isExpanded} onOpenChange={() => toggleCardExpansion(territory.code)}>
                      <div className="border rounded-lg">
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center gap-3">
                              {config && <span className="text-xl">{config.flag}</span>}
                              <span className="font-semibold">{territory.name}</span>
                              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                {lang('gtmStrategy.territorySalesProcess.priority').replace('{{number}}', String(territory.priority))}
                              </span>
                              {status.completedItems > 0 && (
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-xs",
                                    status.isComplete ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                                  )}
                                >
                                  {status.completedItems}/{status.total}
                                </Badge>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-4 border-t">
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTerritory(territory.code)}
                                disabled={disabled}
                              >
                                <X className="h-4 w-4 mr-1" />
                                {lang('gtmStrategy.territorySalesProcess.remove')}
                              </Button>
                            </div>

                            {/* Market Warnings */}
                            {warnings.map((warning, idx) => (
                              <Alert key={idx} variant={warning.type === 'error' ? 'destructive' : 'default'} className="py-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-sm">{warning.message}</AlertDescription>
                              </Alert>
                            ))}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Buyer Type */}
                              <div className="space-y-2">
                                <Label className="text-sm">{config?.buyerLabel || lang('gtmStrategy.territorySalesProcess.buyerTypeFallback')}</Label>
                                <Select 
                                  value={territory.buyerType || ''} 
                                  onValueChange={(v) => updateTerritoryField(territory.code, 'buyerType', v)}
                                  disabled={disabled}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={lang('gtmStrategy.territorySalesProcess.selectBuyerType')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getBuyerOptions(territory.code).map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Procurement Path */}
                              <div className="space-y-2">
                                <Label className="text-sm">{config?.question || lang('gtmStrategy.territorySalesProcess.procurementPathFallback')}</Label>
                                <Select 
                                  value={territory.procurementPath || ''} 
                                  onValueChange={(v) => updateTerritoryField(territory.code, 'procurementPath', v)}
                                  disabled={disabled}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={lang('gtmStrategy.territorySalesProcess.selectPath')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(config?.options || []).map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                        {opt.description && <span className="text-muted-foreground ml-1">- {opt.description}</span>}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Sales Cycle */}
                              <div className="space-y-2">
                                <Label className="text-sm">{lang('gtmStrategy.territorySalesProcess.salesCycleWeeks')}</Label>
                                <Input
                                  type="number"
                                  value={territory.salesCycleWeeks?.toString() || ''}
                                  onChange={(e) => updateTerritoryField(territory.code, 'salesCycleWeeks', parseInt(e.target.value) || undefined)}
                                  placeholder={territory.code === 'USA' ? '12' : territory.code === 'UK' ? '24' : '16'}
                                  disabled={disabled}
                                />
                              </div>
                              
                              {/* Budget Cycle */}
                              <div className="space-y-2">
                                <Label className="text-sm">{lang('gtmStrategy.territorySalesProcess.budgetCycle')}</Label>
                                <Select 
                                  value={territory.budgetCycle || ''} 
                                  onValueChange={(v) => updateTerritoryField(territory.code, 'budgetCycle', v)}
                                  disabled={disabled}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={lang('gtmStrategy.territorySalesProcess.selectCycle')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getBudgetCycleOptions(territory.code).map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{lang(opt.labelKey)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            {/* Rationale */}
                            <div className="space-y-2">
                              <Label className="text-sm">{lang('gtmStrategy.territorySalesProcess.marketRationale')}</Label>
                              <Input
                                value={territory.rationale || ''}
                                onChange={(e) => updateTerritoryField(territory.code, 'rationale', e.target.value)}
                                placeholder={lang('gtmStrategy.territorySalesProcess.marketRationalePlaceholder')}
                                disabled={disabled}
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Concentration */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
            <Label className="text-base font-semibold">{lang('gtmStrategy.customerConcentration.title')}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{lang('gtmStrategy.customerConcentration.customersFor1mArr')}</Label>
                <Input
                  type="number"
                  value={formData.customers_for_1m_arr}
                  onChange={(e) => {
                    const updatedFormData = { ...formData, customers_for_1m_arr: e.target.value };
                    setFormData(updatedFormData);
                    if (!isInitialLoadRef.current && !disabled) {
                      triggerAutoSave(updatedFormData);
                    }
                  }}
                  placeholder="50"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>{lang('gtmStrategy.customerConcentration.customersFor5mArr')}</Label>
                <Input
                  type="number"
                  value={formData.customers_for_5m_arr}
                  onChange={(e) => {
                    const updatedFormData = { ...formData, customers_for_5m_arr: e.target.value };
                    setFormData(updatedFormData);
                    if (!isInitialLoadRef.current && !disabled) {
                      triggerAutoSave(updatedFormData);
                    }
                  }}
                  placeholder="250"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{lang('gtmStrategy.notes.title')}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => {
                const updatedFormData = { ...formData, notes: e.target.value };
                setFormData(updatedFormData);
                if (!isInitialLoadRef.current && !disabled) {
                  triggerAutoSave(updatedFormData);
                }
              }}
              placeholder={lang('gtmStrategy.notes.placeholder')}
              rows={3}
              disabled={disabled}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || disabled}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {lang('gtmStrategy.saveButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
