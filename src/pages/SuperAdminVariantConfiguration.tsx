import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  VariantFieldConfigMap,
  getDefaultVariantFields,
} from "@/constants/variantFieldDefaults";
import { Layers, Shield, Info, PlusCircle, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompanyOption {
  id: string;
  name: string;
}

export default function SuperAdminVariantConfiguration() {
  const [companies, setCompanies] = React.useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("");
  const [selectedCompanyName, setSelectedCompanyName] = React.useState<string>("");
  const [loadingCompanies, setLoadingCompanies] = React.useState(true);
  const [variantFields, setVariantFields] = React.useState<VariantFieldConfigMap>(getDefaultVariantFields());
  const [loadingVariantFields, setLoadingVariantFields] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'purpose' | 'regulatory'>('overview');
  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = React.useState(false);
  const [newFieldLabel, setNewFieldLabel] = React.useState("");
  const [newFieldTab, setNewFieldTab] = React.useState<'overview' | 'purpose' | 'regulatory'>('overview');
  const [companyVariantFields, setCompanyVariantFields] = React.useState<Record<string, any>>({});
  React.useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const { data, error } = await supabase
          .from("companies")
          .select("id, name,variant_field")
          .eq("is_archived",false)
          .order("name", { ascending: true });

        if (error) throw error;
        setCompanies(data?.map((company: any) => ({ id: company.id, name: company.name })) || []);
        setCompanyVariantFields(data?.reduce((acc: Record<string, VariantFieldConfigMap | null>, company: any) => {
          acc[company.id] = company.variant_field || null;
          return acc;
        }, {}) || {});
      } catch (error) {
        console.error("Failed to load companies", error);
        toast.error("Unable to load companies");
      } finally {
        setLoadingCompanies(false);

        
      }
    };

    fetchCompanies();
  }, []);

  const mergeWithDefaults = React.useCallback((data?: VariantFieldConfigMap | null) => {
    const defaults = getDefaultVariantFields();
    if (!data || Object.keys(data).length === 0) return defaults;

    // Start with defaults, then overlay saved data
    const merged: VariantFieldConfigMap = { ...defaults };
    const defaultCount = Object.keys(defaults).length;

    // Overlay saved data - this preserves saved enabled/disabled states
    Object.entries(data).forEach(([key, value], idx) => {
      const fallbackOrder = value?.order ?? defaults[key]?.order ?? defaultCount + idx + 1;
      merged[key] = {
        enabled: value?.enabled !== undefined ? value.enabled : (defaults[key]?.enabled ?? false),
        required: value?.required !== undefined ? value.required : (defaults[key]?.required ?? false),
        label: value?.label ?? defaults[key]?.label ?? key,
        category: value?.category ?? defaults[key]?.category ?? 'overview',
        order: fallbackOrder,
      };
    });

    // Also include any default fields that weren't in saved data but should be shown
    Object.keys(defaults).forEach(key => {
      if (!merged[key]) {
        merged[key] = defaults[key];
      }
    });

    return merged;
  }, []);

  const loadVariantFields = React.useCallback(async (companyId: string, forceRefresh = false) => {
    if (!companyId) return;
    
    // First, try to use cached data from initial fetch (unless forcing refresh)
    if (!forceRefresh && companyId in companyVariantFields) {
      const cachedData = companyVariantFields[companyId];
      setVariantFields(mergeWithDefaults(cachedData));
      return;
    }

    // If not cached or forcing refresh, fetch from Supabase
    setLoadingVariantFields(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("variant_field")
        .eq("id", companyId)
        .single();

      if (error) throw error;

      const variantFieldData = (data as any)?.variant_field as VariantFieldConfigMap | null;
      setVariantFields(mergeWithDefaults(variantFieldData));
      setCompanyVariantFields(prev => ({
        ...prev,
        [companyId]: variantFieldData,
      }));
    } catch (error) {
      console.error("Failed to load variant configuration", error);
      toast.error("Unable to load variant configuration");
      setVariantFields(getDefaultVariantFields());
    } finally {
      setLoadingVariantFields(false);
    }
  }, [mergeWithDefaults, companyVariantFields]);
  
  React.useEffect(() => {
    if (selectedCompanyId) {
      loadVariantFields(selectedCompanyId);
    }
  }, [selectedCompanyId, loadVariantFields]);

  const handleVariantFieldChange = (fieldKey: string, field: "enabled" | "required", value: boolean) => {
    setVariantFields(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [field]: value
      }
    }));
  };

  const handleEnableAll = () => {
    setVariantFields(prev => {
      const updated: VariantFieldConfigMap = { ...prev };
      Object.keys(prev).forEach(key => {
        updated[key] = { ...updated[key], enabled: true };
      });
      return updated;
    });
  };

  const handleDisableAll = () => {
    setVariantFields(prev => {
      const updated: VariantFieldConfigMap = { ...prev };
      Object.keys(prev).forEach(key => {
        updated[key] = { ...updated[key], enabled: false, required: false };
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedCompanyId) {
      toast.error("Select a company first");
      return;
    }
    setLoadingVariantFields(true);
    try {
      const sanitizedFields = Object.keys(variantFields).reduce((acc, key) => {
        const field = variantFields[key];
        acc[key] = {
          enabled: field.enabled,
          ...(field.category ? { category: field.category } : {}),
          ...(field.label ? { label: field.label } : {}),
          ...(typeof field.order === "number" ? { order: field.order } : {}),
        };
        return acc;
      }, {} as Record<string, { enabled: boolean; category?: 'overview' | 'purpose' | 'regulatory'; label?: string; order?: number }>);

      const updatePayload: Record<string, any> = {
        variant_field: sanitizedFields,
      };

      const { error } = await supabase
        .from("companies")
        .update(updatePayload)
        .eq("id", selectedCompanyId);

      if (error) throw error;

      // Update cached data and reload UI
      setCompanyVariantFields(prev => ({
        ...prev,
        [selectedCompanyId]: sanitizedFields as VariantFieldConfigMap,
      }));

      // Reload to ensure UI reflects saved state (will use updated cache)
      setVariantFields(mergeWithDefaults(sanitizedFields as VariantFieldConfigMap));

      toast.success("Variant configuration saved");
    } catch (error) {
      console.error("Failed to save variant configuration", error);
      toast.error("Unable to save variant configuration");
    } finally {
      setLoadingVariantFields(false);
    }
  };

  const formatLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (char) => char.toUpperCase());

  const renderFieldRow = (fieldKey: string) => {
    const config = variantFields[fieldKey] ?? { enabled: false, required: false };
    const displayLabel = config?.label || formatLabel(fieldKey);
    const isOptional = config?.required === false;
    return (
      <div
        key={fieldKey}
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor={`${fieldKey}-enabled`} className="text-sm font-medium leading-none">
            {displayLabel}
          </Label>
          {isOptional && (
            <Badge variant="outline" className="text-xs mt-1">
              Optional
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Switch
            id={`${fieldKey}-enabled`}
            checked={config?.enabled || false}
            onCheckedChange={(checked) => {
              handleVariantFieldChange(fieldKey, "enabled", checked as boolean);
            }}
          />
          <Label
            htmlFor={`${fieldKey}-enabled`}
            className="text-xs text-muted-foreground cursor-pointer"
          >
            {config?.enabled ? "Enabled" : "Disabled"}
          </Label>
        </div>
      </div>
    );
  };

  const getTabFieldKeys = React.useCallback(
    (tab: 'overview' | 'purpose' | 'regulatory') => {
      return Object.entries(variantFields)
        .filter(([, config]) => (config?.category || 'overview') === tab)
        .sort((a, b) => (a[1]?.order ?? 0) - (b[1]?.order ?? 0))
        .map(([key]) => key);
    },
    [variantFields]
  );

  const selectedCompanyRawFields = selectedCompanyId ? companyVariantFields[selectedCompanyId] : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Super Admin Variant Configuration
          </CardTitle>
          <CardDescription>
            Manage variant field configuration for any company from a single control center.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Company</Label>
              <Select
                value={selectedCompanyId}
                onValueChange={(value) => {
                  const company = companies.find((c) => c.id === value);
                  setSelectedCompanyId(value);
                  setSelectedCompanyName(company?.name || "");
                }}
                disabled={loadingCompanies}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Choose a company"} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCompanyName && (
              <div className="p-3 rounded-lg border bg-muted/40">
                <p className="text-sm text-muted-foreground">Managing variant fields for</p>
                <p className="font-semibold">{selectedCompanyName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="border-2">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Device Variant Field Configuration
            </CardTitle>
            <CardDescription>
              Enable, disable, or set required fields for the selected company&apos;s variants.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => setIsAddFieldDialogOpen(true)} className="w-full lg:w-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Variant Field
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'purpose' | 'regulatory')}>
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="overview" className="text-sm px-4 py-3">
                Overview Tab
              </TabsTrigger>
              <TabsTrigger value="purpose" className="text-sm px-4 py-3">
                Purpose Tab
              </TabsTrigger>
              <TabsTrigger value="regulatory" className="text-sm px-4 py-3">
                Regulatory Tab
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTabFieldKeys('overview').map((fieldKey) => renderFieldRow(fieldKey))}
              </div>
            </TabsContent>

            <TabsContent value="purpose" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTabFieldKeys('purpose').map((fieldKey) => renderFieldRow(fieldKey))}
              </div>
            </TabsContent>

            <TabsContent value="regulatory" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTabFieldKeys('regulatory').map((fieldKey) => renderFieldRow(fieldKey))}
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex items-center justify-between text-sm flex-wrap gap-3">
            <span className="text-muted-foreground">
              {Object.values(variantFields).filter((f) => f.enabled).length} of {Object.keys(variantFields).length} fields enabled
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEnableAll}>
                Enable All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisableAll}>
                Disable All
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border rounded-md px-4 py-3 bg-muted/40 text-sm text-muted-foreground flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Saving will write directly to the selected company&apos;s variant field settings.
            </div>
            <Button onClick={handleSave} size="sm" disabled={!selectedCompanyId || loadingVariantFields}>
              {loadingVariantFields ? "Saving..." : "Save Variant Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddFieldDialogOpen} onOpenChange={setIsAddFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Variant Field</DialogTitle>
            <DialogDescription>Define a custom field to include in the variant configuration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-field-label">Field label</Label>
              <Input
                id="new-field-label"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="e.g. Packaging Type"
              />
            </div>
            <div className="space-y-2">
              <Label>Tab placement</Label>
              <Select value={newFieldTab} onValueChange={(value) => setNewFieldTab(value as 'overview' | 'purpose' | 'regulatory')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="purpose">Purpose</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddFieldDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const trimmed = newFieldLabel.trim();
              if (!trimmed) {
                toast.error("Enter a field label");
                return;
              }
              const baseKey =
                trimmed
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "_")
                  .replace(/^_|_$/g, "") || "custom_field";
              let key = baseKey;
              let counter = 1;
              while (variantFields[key]) {
                key = `${baseKey}_${counter++}`;
              }
              setVariantFields(prev => {
                const nextOrder = Object.keys(prev).length + 1;
                return {
                  ...prev,
                  [key]: { enabled: false, required: false, label: trimmed, category: newFieldTab, order: nextOrder }
                };
              });
              setNewFieldLabel("");
              setNewFieldTab('overview');
              setIsAddFieldDialogOpen(false);
              toast.success("Field added");
            }}
          >
            Add Field
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

