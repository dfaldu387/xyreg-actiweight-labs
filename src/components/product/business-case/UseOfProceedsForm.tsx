import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PieChart, Save, Loader2, AlertTriangle } from "lucide-react";
import { useUseOfProceeds } from "@/hooks/useUseOfProceeds";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface UseOfProceedsFormProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

const CATEGORIES = [
  { key: "rd", color: "bg-blue-500" },
  { key: "regulatory", color: "bg-emerald-500" },
  { key: "team", color: "bg-purple-500" },
  { key: "commercial", color: "bg-amber-500" },
  { key: "operations", color: "bg-slate-500" },
];

export function UseOfProceedsForm({ productId, companyId, disabled }: UseOfProceedsFormProps) {
  const { data, isLoading, save, isSaving } = useUseOfProceeds(productId, companyId);
  const queryClient = useQueryClient();
  const { lang } = useTranslation();
  const [searchParams] = useSearchParams();

  // Check if in Genesis flow
  const isInGenesisFlow = searchParams.get('returnTo') === 'genesis';
  
  const [formData, setFormData] = useState({
    total_raise_amount: "",
    raise_currency: "EUR",
    rd_percent: 0,
    rd_activities: "",
    regulatory_percent: 0,
    regulatory_activities: "",
    team_percent: 0,
    team_activities: "",
    commercial_percent: 0,
    commercial_activities: "",
    operations_percent: 0,
    operations_activities: "",
  });

  // Ref to always have latest form data (avoids stale closure in debounced save)
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if (data) {
      // Don't overwrite local state if user has pending changes (dirty)
      // or if there's a pending auto-save timeout
      if (isDirtyRef.current || autoSaveTimeoutRef.current) {
        return;
      }

      const newFormData = {
        total_raise_amount: data.total_raise_amount?.toString() || "",
        raise_currency: data.raise_currency || "EUR",
        rd_percent: data.rd_percent || 0,
        rd_activities: data.rd_activities || "",
        regulatory_percent: data.regulatory_percent || 0,
        regulatory_activities: data.regulatory_activities || "",
        team_percent: data.team_percent || 0,
        team_activities: data.team_activities || "",
        commercial_percent: data.commercial_percent || 0,
        commercial_activities: data.commercial_activities || "",
        operations_percent: data.operations_percent || 0,
        operations_activities: data.operations_activities || "",
      };

      // Only update if the server data is different from what we last saved
      const serverDataString = JSON.stringify(newFormData);
      if (lastSavedDataRef.current === serverDataString) {
        return;
      }

      setFormData(newFormData);
    }
  }, [data]);

  const totalPercent = useMemo(() => {
    return formData.rd_percent + formData.regulatory_percent + formData.team_percent +
           formData.commercial_percent + formData.operations_percent;
  }, [formData]);

  // Genesis flow completion check - requires at least one allocation > 0
  const hasAnyAllocation = formData.rd_percent > 0 ||
    formData.regulatory_percent > 0 ||
    formData.team_percent > 0 ||
    formData.commercial_percent > 0 ||
    formData.operations_percent > 0;

  // Get Genesis flow border class
  const getGenesisBorderClass = () => {
    if (!isInGenesisFlow) return '';
    if (hasAnyAllocation) return 'border-2 border-emerald-500 bg-emerald-50/30';
    return 'border-2 border-amber-400 bg-amber-50/30';
  };

  // Auto-save with debounce
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const isDirtyRef = useRef(false); // Track if user has pending changes
  const lastSavedDataRef = useRef<string | null>(null); // Track last saved state

  const triggerAutoSave = useCallback(() => {
    // Mark as dirty - user is actively editing
    isDirtyRef.current = true;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Use ref to get the LATEST form data at the time of save (not when debounce started)
      const currentFormData = formDataRef.current;

      try {
        // Store what we're saving so we can compare later
        lastSavedDataRef.current = JSON.stringify(currentFormData);

        await save({
          total_raise_amount: currentFormData.total_raise_amount ? parseFloat(currentFormData.total_raise_amount) : null,
          raise_currency: currentFormData.raise_currency,
          rd_percent: currentFormData.rd_percent,
          rd_activities: currentFormData.rd_activities || null,
          regulatory_percent: currentFormData.regulatory_percent,
          regulatory_activities: currentFormData.regulatory_activities || null,
          team_percent: currentFormData.team_percent,
          team_activities: currentFormData.team_activities || null,
          commercial_percent: currentFormData.commercial_percent,
          commercial_activities: currentFormData.commercial_activities || null,
          operations_percent: currentFormData.operations_percent,
          operations_activities: currentFormData.operations_activities || null,
        });

        // Clear dirty flag after successful save
        isDirtyRef.current = false;

        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ["use-of-proceeds", productId] }); // Main data query
        queryClient.invalidateQueries({ queryKey: ["funnel-use-of-proceeds", productId] }); // Sidebar completion
        queryClient.invalidateQueries({ queryKey: ["funnel-product", productId] }); // Product funnel
      } catch {
        isDirtyRef.current = false;
      }
    }, 800); // Reduced from 1200ms for better responsiveness
  }, [save, queryClient, productId]);

  // Mark initial load complete after first fetch (even if no data exists)
  useEffect(() => {
    if (!isLoading) {
      isInitialLoadRef.current = false;
    }
  }, [isLoading]);

  // Flush pending save and cleanup on unmount
  useEffect(() => {
    return () => {
      // If there's a pending save, execute it immediately before unmounting
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;

        // Save immediately if there are unsaved changes
        if (isDirtyRef.current) {
          const currentFormData = formDataRef.current;

          // Fire and forget - we're unmounting so we can't await
          save({
            total_raise_amount: currentFormData.total_raise_amount ? parseFloat(currentFormData.total_raise_amount) : null,
            raise_currency: currentFormData.raise_currency,
            rd_percent: currentFormData.rd_percent,
            rd_activities: currentFormData.rd_activities || null,
            regulatory_percent: currentFormData.regulatory_percent,
            regulatory_activities: currentFormData.regulatory_activities || null,
            team_percent: currentFormData.team_percent,
            team_activities: currentFormData.team_activities || null,
            commercial_percent: currentFormData.commercial_percent,
            commercial_activities: currentFormData.commercial_activities || null,
            operations_percent: currentFormData.operations_percent,
            operations_activities: currentFormData.operations_activities || null,
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["use-of-proceeds", productId] });
            queryClient.invalidateQueries({ queryKey: ["funnel-use-of-proceeds", productId] });
            queryClient.invalidateQueries({ queryKey: ["funnel-product", productId] });
          }).catch(() => {
            // Silent fail on unmount
          });
        }
      }
    };
  }, [save, queryClient, productId]);

  const handlePercentChange = (key: string, value: number[]) => {
    const updatedFormData = { ...formData, [`${key}_percent`]: value[0] };
    setFormData(updatedFormData);
    if (!isInitialLoadRef.current && !disabled) {
      triggerAutoSave();
    }
  };

  const handleSave = async () => {
    if (totalPercent !== 100) {
      toast.error(lang('useOfProceeds.toast.percentError'));
      return;
    }

    try {
      await save({
        total_raise_amount: formData.total_raise_amount ? parseFloat(formData.total_raise_amount) : null,
        raise_currency: formData.raise_currency,
        rd_percent: formData.rd_percent,
        rd_activities: formData.rd_activities || null,
        regulatory_percent: formData.regulatory_percent,
        regulatory_activities: formData.regulatory_activities || null,
        team_percent: formData.team_percent,
        team_activities: formData.team_activities || null,
        commercial_percent: formData.commercial_percent,
        commercial_activities: formData.commercial_activities || null,
        operations_percent: formData.operations_percent,
        operations_activities: formData.operations_activities || null,
      });
      queryClient.invalidateQueries({ queryKey: ["funnel-use-of-proceeds", productId] });
      toast.success(lang('useOfProceeds.toast.saveSuccess'));
    } catch (error) {
      toast.error(lang('useOfProceeds.toast.saveError'));
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

  const currencySymbol = formData.raise_currency === "EUR" ? "€" : formData.raise_currency === "GBP" ? "£" : "$";
  const raiseAmount = formData.total_raise_amount ? parseFloat(formData.total_raise_amount) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          {lang('useOfProceeds.title')}
        </CardTitle>
        <CardDescription>
          {lang('useOfProceeds.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Raise */}
        <div className="flex items-end gap-4">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label>{lang('useOfProceeds.totalRaise.label')}</Label>
            <div className="flex gap-2">
              <Select
                value={formData.raise_currency}
                onValueChange={(v) => {
                  const updatedFormData = { ...formData, raise_currency: v };
                  setFormData(updatedFormData);
                  if (!isInitialLoadRef.current && !disabled) {
                    triggerAutoSave();
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
                  value={formData.total_raise_amount}
                  onChange={(e) => {
                    const updatedFormData = { ...formData, total_raise_amount: e.target.value };
                    setFormData(updatedFormData);
                    if (!isInitialLoadRef.current && !disabled) {
                      triggerAutoSave();
                    }
                  }}
                  placeholder="2000000"
                  className="pl-8"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-md font-medium ${
            totalPercent === 100 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
          }`}>
            {totalPercent === 100 ? '✓ Total: 100%' : `Total: ${totalPercent}%`}
            {totalPercent !== 100 && <AlertTriangle className="h-4 w-4 inline ml-2" />}
          </div>
        </div>

        {/* Visual Bar */}
        <div className="h-4 rounded-full overflow-hidden flex bg-secondary">
          {CATEGORIES.map((cat) => {
            const percent = formData[`${cat.key}_percent` as keyof typeof formData] as number;
            if (percent === 0) return null;
            return (
              <div
                key={cat.key}
                className={`${cat.color} transition-all`}
                style={{ width: `${percent}%` }}
                title={`${lang(`useOfProceeds.categories.${cat.key}`)}: ${percent}%`}
              />
            );
          })}
        </div>

        {/* Category Sliders */}
        <div className={cn("space-y-6 p-4 rounded-lg", getGenesisBorderClass())}>
          {CATEGORIES.map((cat) => {
            const percentKey = `${cat.key}_percent` as keyof typeof formData;
            const activitiesKey = `${cat.key}_activities` as keyof typeof formData;
            const percent = formData[percentKey] as number;
            const activities = formData[activitiesKey] as string;
            const amount = raiseAmount * (percent / 100);
            const categoryLabel = lang(`useOfProceeds.categories.${cat.key}`);

            return (
              <div key={cat.key} className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <Label className="font-medium">{categoryLabel}</Label>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{percent}%</span>
                    {raiseAmount > 0 && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({currencySymbol}{amount.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
                <Slider
                  value={[percent]}
                  onValueChange={(v) => handlePercentChange(cat.key, v)}
                  max={100}
                  step={5}
                  disabled={disabled}
                />
                <Textarea
                  value={activities}
                  onChange={(e) => {
                    const updatedFormData = { ...formData, [activitiesKey]: e.target.value };
                    setFormData(updatedFormData);
                    if (!isInitialLoadRef.current && !disabled) {
                      triggerAutoSave();
                    }
                  }}
                  placeholder={`Key activities for ${categoryLabel.toLowerCase()}...`}
                  rows={2}
                  disabled={disabled}
                />
              </div>
            );
          })}
        </div>

{/*        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || disabled || totalPercent !== 100}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {lang('useOfProceeds.saveButton')}
          </Button>
        </div>*/}
      </CardContent>
    </Card>
  );
}
