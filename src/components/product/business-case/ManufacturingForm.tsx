import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Factory, Save, Loader2 } from "lucide-react";
import { useManufacturing, CMOPartner } from "@/hooks/useManufacturing";
import { CMOPartnerSelector } from "@/components/product/operations/CMOPartnerSelector";
import { SingleSourceDetectionCard } from "@/components/product/operations/SingleSourceDetectionCard";
import { RNPVCOGSReference } from "@/components/product/operations/RNPVCOGSReference";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

// Extended CMO Partner type for supplier integration
interface CMOPartnerWithSupplier extends CMOPartner {
  supplier_id?: string;
}

interface ManufacturingFormProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

const STAGE_OPTIONS = [
  { value: "prototype_shop", key: "prototypeShop" },
  { value: "university_lab", key: "universityLab" },
  { value: "contract_manufacturer", key: "contractManufacturer" },
  { value: "in_house_pilot", key: "inHousePilot" },
  { value: "commercial_scale", key: "commercialScale" },
];

const MODEL_OPTIONS = [
  { value: "in_house", key: "inHouse" },
  { value: "cmo", key: "cmo" },
  { value: "hybrid", key: "hybrid" },
];

export function ManufacturingForm({ productId, companyId, disabled }: ManufacturingFormProps) {
  const { data, isLoading, save, isSaving } = useManufacturing(productId, companyId);
  const queryClient = useQueryClient();
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();

  // Check if in Genesis flow
  const isInGenesisFlow = searchParams.get('returnTo') === 'genesis';

  const [formData, setFormData] = useState({
    current_stage: "",
    commercial_location: "",
    commercial_model: "",
    cmo_partners: [] as CMOPartner[],
    cogs_at_scale: "",
    cogs_at_scale_currency: "EUR",
    supply_chain_risks: "",
    notes: "",
  });

  const [newPartner, setNewPartner] = useState({ name: "", status: "identified", notes: "" });

  // Genesis flow completion check - requires BOTH stage AND model
  const hasStageAndModel = Boolean(formData.current_stage && formData.commercial_model);

  // Get Genesis flow border class
  const getGenesisBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasStageAndModel) return 'border-2 border-emerald-500 bg-emerald-50/30';
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
        console.log('[Manufacturing] Auto-saving...', {
          current_stage: updatedFormData.current_stage,
          commercial_model: updatedFormData.commercial_model,
        });
        await save({
          current_stage: updatedFormData.current_stage || null,
          commercial_location: updatedFormData.commercial_location || null,
          commercial_model: updatedFormData.commercial_model || null,
          cmo_partners: updatedFormData.cmo_partners,
          cogs_at_scale: updatedFormData.cogs_at_scale ? parseFloat(updatedFormData.cogs_at_scale) : null,
          cogs_at_scale_currency: updatedFormData.cogs_at_scale_currency,
          supply_chain_risks: updatedFormData.supply_chain_risks || null,
          notes: updatedFormData.notes || null,
        });
        console.log('[Manufacturing] Auto-save complete');
        queryClient.invalidateQueries({ queryKey: ["funnel-manufacturing", productId] });
      } catch (error) {
        console.error("[Manufacturing] Auto-save failed:", error);
      }
    }, 1000);
  }, [save, queryClient, productId]);

  useEffect(() => {
    if (data) {
      setFormData({
        current_stage: data.current_stage || "",
        commercial_location: data.commercial_location || "",
        commercial_model: data.commercial_model || "",
        cmo_partners: data.cmo_partners || [],
        cogs_at_scale: data.cogs_at_scale?.toString() || "",
        cogs_at_scale_currency: data.cogs_at_scale_currency || "EUR",
        supply_chain_risks: data.supply_chain_risks || "",
        notes: data.notes || "",
      });
    }
  }, [data]);

  const addPartner = () => {
    if (!newPartner.name) return;
    setFormData({
      ...formData,
      cmo_partners: [...formData.cmo_partners, newPartner],
    });
    setNewPartner({ name: "", status: "identified", notes: "" });
  };

  const removePartner = (index: number) => {
    setFormData({
      ...formData,
      cmo_partners: formData.cmo_partners.filter((_, i) => i !== index),
    });
  };


  const handleSave = async () => {
    try {
      await save({
        current_stage: formData.current_stage || null,
        commercial_location: formData.commercial_location || null,
        commercial_model: formData.commercial_model || null,
        cmo_partners: formData.cmo_partners,
        cogs_at_scale: formData.cogs_at_scale ? parseFloat(formData.cogs_at_scale) : null,
        cogs_at_scale_currency: formData.cogs_at_scale_currency,
        supply_chain_risks: formData.supply_chain_risks || null,
        notes: formData.notes || null,
      });
      queryClient.invalidateQueries({ queryKey: ["funnel-manufacturing", productId] });
      toast.success(lang('manufacturing.toast.saveSuccess'));
    } catch (error) {
      toast.error(lang('manufacturing.toast.saveError'));
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

  const currencySymbol = formData.cogs_at_scale_currency === "EUR" ? "€" : formData.cogs_at_scale_currency === "GBP" ? "£" : "$";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="h-5 w-5 text-primary" />
          {lang('deviceOperations.supplyChainTitle')}
        </CardTitle>
        <CardDescription>
          {lang('manufacturing.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Stage & Model - Genesis border wrapper */}
        <div className={cn("p-4 rounded-lg", getGenesisBorderClass())}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang('manufacturing.currentStage.label')}</Label>
              <Select
                value={formData.current_stage}
                onValueChange={(v) => {
                  const updated = { ...formData, current_stage: v };
                  setFormData(updated);
                  if (!isInitialLoadRef.current && !disabled) {
                    triggerAutoSave(updated);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('manufacturing.currentStage.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{lang(`manufacturing.currentStage.options.${opt.key}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{lang('manufacturing.commercialModel.label')}</Label>
              <Select
                value={formData.commercial_model}
                onValueChange={(v) => {
                  const updated = { ...formData, commercial_model: v };
                  setFormData(updated);
                  if (!isInitialLoadRef.current && !disabled) {
                    triggerAutoSave(updated);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lang('manufacturing.commercialModel.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{lang(`manufacturing.commercialModel.options.${opt.key}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Commercial Location & Early COGS Estimate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{lang('manufacturing.commercialLocation.label')}</Label>
            <Input
              value={formData.commercial_location}
              onChange={(e) => {
                const updated = { ...formData, commercial_location: e.target.value };
                setFormData(updated);
                if (!isInitialLoadRef.current && !disabled) {
                  triggerAutoSave(updated);
                }
              }}
              placeholder={lang('manufacturing.commercialLocation.placeholder')}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>{lang('manufacturing.cogsAtScale.label')}</Label>
            <div className="flex gap-2">
              <Select
                value={formData.cogs_at_scale_currency}
                onValueChange={(v) => {
                  const updated = { ...formData, cogs_at_scale_currency: v };
                  setFormData(updated);
                  if (!isInitialLoadRef.current && !disabled) {
                    triggerAutoSave(updated);
                  }
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  value={formData.cogs_at_scale}
                  onChange={(e) => {
                    const updated = { ...formData, cogs_at_scale: e.target.value };
                    setFormData(updated);
                    if (!isInitialLoadRef.current && !disabled) {
                      triggerAutoSave(updated);
                    }
                  }}
                  placeholder={lang('manufacturing.cogsAtScale.placeholder')}
                  className="pl-8"
                  disabled={disabled}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang('manufacturing.cogsAtScale.hint')}
            </p>
          </div>
        </div>

        {/* rNPV COGS Reference */}
        <RNPVCOGSReference productId={productId} />

        {/* CMO Partners */}
        <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
          <Label className="text-base font-semibold">{lang('manufacturing.cmoPartners.title')}</Label>
          <p className="text-sm text-muted-foreground">
            {lang('manufacturing.cmoPartners.description')}
          </p>
          <CMOPartnerSelector
            companyId={companyId}
            selectedPartners={formData.cmo_partners.map(p => ({
              supplier_id: (p as CMOPartnerWithSupplier).supplier_id || p.name,
              name: p.name,
              status: p.status,
              notes: p.notes,
            }))}
            onPartnersChange={(partners) => setFormData({
              ...formData,
              cmo_partners: partners.map(p => ({
                name: p.name,
                status: p.status,
                notes: p.notes,
                supplier_id: p.supplier_id,
              })) as CMOPartner[],
            })}
            disabled={disabled}
          />
        </div>

        {/* Single Source Components - Auto-detected from BOM */}
        <SingleSourceDetectionCard productId={productId} companyId={companyId} />

        {/* Supply Chain Risks & Notes */}
        <div className="space-y-2">
          <Label>{lang('manufacturing.supplyChainRisks.label')}</Label>
          <Textarea
            value={formData.supply_chain_risks}
            onChange={(e) => setFormData({ ...formData, supply_chain_risks: e.target.value })}
            placeholder={lang('manufacturing.supplyChainRisks.placeholder')}
            rows={2}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>{lang('manufacturing.notes.label')}</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={lang('manufacturing.notes.placeholder')}
            rows={2}
            disabled={disabled}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || disabled}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {lang('manufacturing.saveButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
