import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Save, Loader2, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useMarketSizing } from "@/hooks/useMarketSizing";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TamSamSomVennDiagram } from "./TamSamSomVennDiagram";
import { useTranslation } from "@/hooks/useTranslation";
import { GenesisStepNotice } from "./GenesisStepNotice";

interface MarketSizingFormProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

// Helper to format large numbers
function formatVolume(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toLocaleString();
}

// Validation indicator component
function ValidationIndicator({
  volumeValue,
  aspValue,
  monetaryValue,
  currencySymbol,
  lang
}: {
  volumeValue: number | null;
  aspValue: number | null;
  monetaryValue: number | null;
  currencySymbol: string;
  lang: (key: string, variables?: Record<string, string | number>) => string;
}) {
  if (!volumeValue || !aspValue || !monetaryValue) return null;

  // Calculate: volume × ASP = estimated market (in millions)
  const estimatedMarket = (volumeValue * aspValue) / 1_000_000;
  const difference = Math.abs(estimatedMarket - monetaryValue);
  const percentDiff = (difference / monetaryValue) * 100;

  const isWithinRange = percentDiff <= 20;

  return (
    <div className={`flex items-center gap-2 text-sm mt-2 p-2 rounded-md ${
      isWithinRange
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    }`}>
      {isWithinRange ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      )}
      <span>
        Volume × ASP = {currencySymbol}{estimatedMarket.toFixed(1)}M
        {isWithinRange
          ? ` ${lang('marketAnalysis.sizing.validation.matches')}`
          : ` ${lang('marketAnalysis.sizing.validation.differsFrom', { value: `${currencySymbol}${monetaryValue}M` })}`}
      </span>
    </div>
  );
}

export function MarketSizingForm({ productId, companyId, disabled }: MarketSizingFormProps) {
  const { lang } = useTranslation();
  const { data, isLoading, save, isSaving } = useMarketSizing(productId, companyId);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isInGenesisFlow = returnTo === 'genesis' || returnTo === 'venture-blueprint' || returnTo === 'investor-share';
  
  const [formData, setFormData] = useState({
    tam_value: "",
    tam_patient_volume: "",
    tam_currency: "USD",
    tam_methodology: "",
    tam_sources: "",
    sam_value: "",
    sam_patient_volume: "",
    sam_methodology: "",
    sam_sources: "",
    som_value: "",
    som_patient_volume: "",
    som_timeline_years: "5",
    som_methodology: "",
    average_selling_price: "",
    lives_impacted_annually: "",
    procedures_enabled_annually: "",
    cost_savings_per_procedure: "",
    clinical_impact_sources: "",
  });

  // Track if data has been modified since last save
  const lastSavedRef = useRef<string>("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (data) {
      const newFormData = {
        tam_value: data.tam_value?.toString() || "",
        tam_patient_volume: data.tam_patient_volume?.toString() || "",
        tam_currency: data.tam_currency || "USD",
        tam_methodology: data.tam_methodology || "",
        tam_sources: data.tam_sources || "",
        sam_value: data.sam_value?.toString() || "",
        sam_patient_volume: data.sam_patient_volume?.toString() || "",
        sam_methodology: data.sam_methodology || "",
        sam_sources: data.sam_sources || "",
        som_value: data.som_value?.toString() || "",
        som_patient_volume: data.som_patient_volume?.toString() || "",
        som_timeline_years: data.som_timeline_years?.toString() || "5",
        som_methodology: data.som_methodology || "",
        average_selling_price: data.average_selling_price?.toString() || "",
        lives_impacted_annually: data.lives_impacted_annually?.toString() || "",
        procedures_enabled_annually: data.procedures_enabled_annually?.toString() || "",
        cost_savings_per_procedure: data.cost_savings_per_procedure?.toString() || "",
        clinical_impact_sources: data.clinical_impact_sources || "",
      };
      setFormData(newFormData);
      // Mark this as initial load to prevent auto-save from triggering
      isInitialLoadRef.current = true;
    }
  }, [data]);

  const buildPayload = useCallback(() => ({
    tam_value: formData.tam_value ? parseFloat(formData.tam_value) : null,
    tam_patient_volume: formData.tam_patient_volume ? parseInt(formData.tam_patient_volume) : null,
    tam_currency: formData.tam_currency,
    tam_methodology: formData.tam_methodology || null,
    tam_sources: formData.tam_sources || null,
    sam_value: formData.sam_value ? parseFloat(formData.sam_value) : null,
    sam_patient_volume: formData.sam_patient_volume ? parseInt(formData.sam_patient_volume) : null,
    sam_methodology: formData.sam_methodology || null,
    sam_sources: formData.sam_sources || null,
    som_value: formData.som_value ? parseFloat(formData.som_value) : null,
    som_patient_volume: formData.som_patient_volume ? parseInt(formData.som_patient_volume) : null,
    som_timeline_years: formData.som_timeline_years ? parseInt(formData.som_timeline_years) : 5,
    som_methodology: formData.som_methodology || null,
    average_selling_price: formData.average_selling_price ? parseFloat(formData.average_selling_price) : null,
    lives_impacted_annually: formData.lives_impacted_annually ? parseInt(formData.lives_impacted_annually) : null,
    procedures_enabled_annually: formData.procedures_enabled_annually ? parseInt(formData.procedures_enabled_annually) : null,
    cost_savings_per_procedure: formData.cost_savings_per_procedure ? parseFloat(formData.cost_savings_per_procedure) : null,
    clinical_impact_sources: formData.clinical_impact_sources || null,
  }), [formData]);

  const handleSave = useCallback(async (showToast = true) => {
    const currentData = JSON.stringify(buildPayload());
    if (currentData === lastSavedRef.current) return; // No changes

    try {
      await save(buildPayload());
      lastSavedRef.current = currentData;
      // Invalidate funnel query for checklist updates
      await queryClient.invalidateQueries({ queryKey: ["funnel-market-sizing", productId] });
      await queryClient.invalidateQueries({ queryKey: ["funnel-product", productId] });
      if (showToast) {
        toast.success(lang('marketAnalysis.sizing.toast.saved'));
      }
    } catch (error) {
      toast.error(lang('marketAnalysis.sizing.toast.saveFailed'));
    }
  }, [buildPayload, save, queryClient, productId, lang]);

  // Auto-save on blur for key fields (TAM/SAM/SOM values)
  const handleBlurAutoSave = useCallback(() => {
    // Clear any pending timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    // Debounce slightly to avoid multiple rapid saves
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave(false); // Save silently (no toast)
    }, 300);
  }, [handleSave]);

  // Auto-save when TAM/SAM/SOM values change (with debounce)
  // This ensures sidebar updates even without blur
  useEffect(() => {
    // Skip initial load to avoid unnecessary saves
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // Clear any pending timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Debounce auto-save to 800ms after typing stops
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave(false); // Save silently
    }, 800);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData.tam_value, formData.sam_value, formData.som_value, handleSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Parse values for validation
  const aspValue = formData.average_selling_price ? parseFloat(formData.average_selling_price) : null;
  const tamVolume = formData.tam_patient_volume ? parseInt(formData.tam_patient_volume) : null;
  const samVolume = formData.sam_patient_volume ? parseInt(formData.sam_patient_volume) : null;
  const somVolume = formData.som_patient_volume ? parseInt(formData.som_patient_volume) : null;
  const tamValue = formData.tam_value ? parseFloat(formData.tam_value) : null;
  const samValue = formData.sam_value ? parseFloat(formData.sam_value) : null;
  const somValue = formData.som_value ? parseFloat(formData.som_value) : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currencySymbol = formData.tam_currency === "EUR" ? "€" : formData.tam_currency === "GBP" ? "£" : "$";

  return (
    <div className="space-y-4">
      {/* Genesis Step Notice - internal only */}
      <GenesisStepNotice stepNumber={7} stepName="Market Analysis (TAM/SAM/SOM)" />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {lang('marketAnalysis.sizing.title')}
          </CardTitle>
          <CardDescription>
            {lang('marketAnalysis.sizing.description')} — changes auto-save when you leave a field
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* TAM/SAM/SOM Venn Diagram Visualization */}
        <TamSamSomVennDiagram
          tamValue={tamValue}
          samValue={samValue}
          somValue={somValue}
          currencySymbol={currencySymbol}
        />

        {/* Currency & ASP Selection Row */}
        <div className="flex items-end gap-4 justify-between flex-wrap">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              {lang('marketAnalysis.sizing.currency')}
            </Label>
            <Select value={formData.tam_currency} onValueChange={(v) => setFormData({ ...formData, tam_currency: v })}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1 max-w-xs">
            <Label className="flex items-center gap-1.5">
              {lang('marketAnalysis.sizing.asp')}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{lang('marketAnalysis.sizing.aspTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                value={formData.average_selling_price}
                onChange={(e) => setFormData({ ...formData, average_selling_price: e.target.value })}
                placeholder="1500"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* TAM */}
        <div className="space-y-4 p-4 rounded-lg bg-secondary/30">
          <h3 className="font-semibold">{lang('marketAnalysis.tam.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              id="genesis-tam-value"
              className={`space-y-2 transition-all ${isInGenesisFlow ? `p-3 rounded-lg transition-colors ${formData.tam_value ? 'border-2 border-emerald-500' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}
            >
              <Label>{lang('marketAnalysis.sizing.marketValueInMillions')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  value={formData.tam_value}
                  onChange={(e) => setFormData({ ...formData, tam_value: e.target.value })}
                  onBlur={handleBlurAutoSave}
                  placeholder="500"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang('marketAnalysis.sizing.patientProcedureVolume')}</Label>
              <Input
                type="number"
                value={formData.tam_patient_volume}
                onChange={(e) => setFormData({ ...formData, tam_patient_volume: e.target.value })}
                placeholder="3500000"
              />
              {tamVolume && (
                <p className="text-xs text-muted-foreground">{formatVolume(tamVolume)} {lang('marketAnalysis.sizing.patientsProcedures')}</p>
              )}
            </div>
          </div>
          <ValidationIndicator
            volumeValue={tamVolume}
            aspValue={aspValue}
            monetaryValue={tamValue}
            currencySymbol={currencySymbol}
            lang={lang}
          />
          <div className="space-y-2">
            <Label>{lang('marketAnalysis.sizing.methodology')}</Label>
            <Textarea
              value={formData.tam_methodology}
              onChange={(e) => setFormData({ ...formData, tam_methodology: e.target.value })}
              placeholder={lang('marketAnalysis.sizing.methodologyPlaceholder')}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>{lang('marketAnalysis.sizing.sourcesCitations')}</Label>
            <Textarea
              value={formData.tam_sources}
              onChange={(e) => setFormData({ ...formData, tam_sources: e.target.value })}
              placeholder={lang('marketAnalysis.sizing.sourcesPlaceholder')}
              rows={2}
            />
          </div>
        </div>

        {/* SAM */}
        <div className="space-y-4 p-4 rounded-lg bg-secondary/30">
          <h3 className="font-semibold">{lang('marketAnalysis.sam.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              id="genesis-sam-value"
              className={`space-y-2 transition-all ${isInGenesisFlow ? `p-3 rounded-lg transition-colors ${formData.sam_value ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}
            >
              <Label>{lang('marketAnalysis.sizing.marketValueInMillions')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  value={formData.sam_value}
                  onChange={(e) => setFormData({ ...formData, sam_value: e.target.value })}
                  onBlur={handleBlurAutoSave}
                  placeholder="150"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang('marketAnalysis.sizing.patientProcedureVolume')}</Label>
              <Input
                type="number"
                value={formData.sam_patient_volume}
                onChange={(e) => setFormData({ ...formData, sam_patient_volume: e.target.value })}
                placeholder="1000000"
              />
              {samVolume && (
                <p className="text-xs text-muted-foreground">{formatVolume(samVolume)} {lang('marketAnalysis.sizing.patientsProcedures')}</p>
              )}
            </div>
          </div>
          <ValidationIndicator
            volumeValue={samVolume}
            aspValue={aspValue}
            monetaryValue={samValue}
            currencySymbol={currencySymbol}
            lang={lang}
          />
          <div className="space-y-2">
            <Label>{lang('marketAnalysis.sizing.samMethodology')}</Label>
            <Textarea
              value={formData.sam_methodology}
              onChange={(e) => setFormData({ ...formData, sam_methodology: e.target.value })}
              placeholder={lang('marketAnalysis.sizing.samMethodologyPlaceholder')}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{lang('marketAnalysis.sizing.sources')}</Label>
            <Textarea
              value={formData.sam_sources}
              onChange={(e) => setFormData({ ...formData, sam_sources: e.target.value })}
              placeholder={lang('marketAnalysis.sizing.samSourcesPlaceholder')}
              rows={2}
            />
          </div>
        </div>

        {/* SOM */}
        <div className="space-y-4 p-4 rounded-lg bg-secondary/30">
          <h3 className="font-semibold">{lang('marketAnalysis.som.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              id="genesis-som-value"
              className={`space-y-2 transition-all ${isInGenesisFlow ? `p-3 rounded-lg transition-colors ${formData.som_value ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30'}` : ''}`}
            >
              <Label>{lang('marketAnalysis.sizing.marketValueInMillions')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  value={formData.som_value}
                  onChange={(e) => setFormData({ ...formData, som_value: e.target.value })}
                  onBlur={handleBlurAutoSave}
                  placeholder="25"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang('marketAnalysis.sizing.patientProcedureVolume')}</Label>
              <Input
                type="number"
                value={formData.som_patient_volume}
                onChange={(e) => setFormData({ ...formData, som_patient_volume: e.target.value })}
                placeholder="150000"
              />
              {somVolume && (
                <p className="text-xs text-muted-foreground">{formatVolume(somVolume)} {lang('marketAnalysis.sizing.patientsProcedures')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{lang('marketAnalysis.sizing.timelineYears')}</Label>
              <Select value={formData.som_timeline_years} onValueChange={(v) => setFormData({ ...formData, som_timeline_years: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 years</SelectItem>
                  <SelectItem value="5">5 years</SelectItem>
                  <SelectItem value="7">7 years</SelectItem>
                  <SelectItem value="10">10 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ValidationIndicator
            volumeValue={somVolume}
            aspValue={aspValue}
            monetaryValue={somValue}
            currencySymbol={currencySymbol}
            lang={lang}
          />
          <div className="space-y-2">
            <Label>{lang('marketAnalysis.sizing.somMethodology')}</Label>
            <Textarea
              value={formData.som_methodology}
              onChange={(e) => setFormData({ ...formData, som_methodology: e.target.value })}
              placeholder={lang('marketAnalysis.sizing.somMethodologyPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        {/* Clinical Impact Metrics */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <h3 className="font-semibold">{lang('marketAnalysis.clinicalImpact.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{lang('marketAnalysis.clinicalImpact.livesImpacted')}</Label>
              <Input
                type="number"
                value={formData.lives_impacted_annually}
                onChange={(e) => setFormData({ ...formData, lives_impacted_annually: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label>{lang('marketAnalysis.clinicalImpact.proceduresEnabled')}</Label>
              <Input
                type="number"
                value={formData.procedures_enabled_annually}
                onChange={(e) => setFormData({ ...formData, procedures_enabled_annually: e.target.value })}
                placeholder="45000"
              />
            </div>
            <div className="space-y-2">
              <Label>{lang('marketAnalysis.clinicalImpact.costSavingsPerProcedure')} ({currencySymbol})</Label>
              <Input
                type="number"
                value={formData.cost_savings_per_procedure}
                onChange={(e) => setFormData({ ...formData, cost_savings_per_procedure: e.target.value })}
                placeholder="500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{lang('marketAnalysis.clinicalImpact.sources')}</Label>
            <Textarea
              value={formData.clinical_impact_sources}
              onChange={(e) => setFormData({ ...formData, clinical_impact_sources: e.target.value })}
              placeholder={lang('marketAnalysis.clinicalImpact.sourcesPlaceholder')}
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
