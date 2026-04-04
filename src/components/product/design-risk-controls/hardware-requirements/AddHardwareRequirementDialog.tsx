import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { resolveCategory, resolveLineageBase } from "@/utils/traceabilityIdUtils";
import { hazardsService } from "@/services/hazardsService";
import { MultiSelect } from "@/components/settings/document-control/MultiSelect";
import type { Hazard } from "@/components/product/design-risk-controls/risk-management/types";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceComponents } from "@/hooks/useDeviceComponents";

const HWR_CATEGORIES = [
  { id: 'Materials', label: 'Materials', description: 'Material specifications and requirements' },
  { id: 'Electrical', label: 'Electrical', description: 'Electrical safety and performance' },
  { id: 'Mechanical', label: 'Mechanical', description: 'Mechanical properties and performance' },
  { id: 'Safety', label: 'Safety', description: 'Hardware safety requirements' },
  { id: 'Environmental', label: 'Environmental', description: 'Environmental conditions and resistance' },
  { id: 'Performance', label: 'Performance', description: 'Performance and efficiency requirements' },
  { id: 'Biocompatibility', label: 'Biocompatibility', description: 'Biocompatibility requirements' },
];

interface AddHardwareRequirementDialogProps {
  productId: string;
  companyId: string;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export function AddHardwareRequirementDialog({
  productId,
  companyId,
  trigger,
  disabled = false
}: AddHardwareRequirementDialogProps) {
  const { lang } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    setOpen(newOpen);
  };
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [componentId, setComponentId] = useState<string>("");
  const [selectedSysReqs, setSelectedSysReqs] = useState<string[]>([]);
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [sysReqOptions, setSysReqOptions] = useState<{ label: string; value: string }[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loadingSysReqs, setLoadingSysReqs] = useState(false);
  const [loadingHazards, setLoadingHazards] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [manualCategorySet, setManualCategorySet] = useState(false);
  const queryClient = useQueryClient();

  const { data: components = [] } = useDeviceComponents(productId);

  const debouncedDescription = useDebounce(description, 1000);

  // AI category suggestion
  useEffect(() => {
    if (!debouncedDescription || debouncedDescription.length < 15 || manualCategorySet) return;

    const suggest = async () => {
      setAiLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('ai-category-suggester', {
          body: {
            description: debouncedDescription,
            categories: HWR_CATEGORIES,
            context: 'hardware-requirement'
          }
        });
        if (!error && data?.categoryId) {
          const validIds = HWR_CATEGORIES.map(c => c.id);
          if (validIds.includes(data.categoryId)) {
            setCategory(data.categoryId);
            setAiSuggested(true);
          }
        }
      } catch (e) {
        console.error('AI category suggestion failed:', e);
      } finally {
        setAiLoading(false);
      }
    };
    suggest();
  }, [debouncedDescription, manualCategorySet]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setManualCategorySet(true);
    setAiSuggested(false);
  };

  // Load SYSR options and hazards when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingSysReqs(true);
    setLoadingHazards(true);

    requirementSpecificationsService.getByProductAndType(productId, 'system')
      .then((reqs) => {
        setSysReqOptions(reqs.map(r => ({
          label: `${r.requirement_id}: ${r.description.length > 60 ? r.description.slice(0, 60) + '…' : r.description}`,
          value: r.requirement_id,
        })));
      })
      .catch((e) => console.error('Failed to load system requirements:', e))
      .finally(() => setLoadingSysReqs(false));

    hazardsService.getHazardsByProduct(productId)
      .then(setHazards)
      .catch((e) => console.error('Failed to load hazards:', e))
      .finally(() => setLoadingHazards(false));
  }, [open, productId]);

  const hazardOptions = hazards.map((h) => ({
    label: `${h.hazard_id}: ${h.description.length > 60 ? h.description.slice(0, 60) + '…' : h.description}`,
    value: h.hazard_id,
  }));

  const createRequirementMutation = useMutation({
    mutationFn: async () => {
      const catSuffix = selectedSysReqs.length > 0 ? resolveCategory(selectedSysReqs) : 'C';
      const lineage = selectedSysReqs.length > 0 ? resolveLineageBase(selectedSysReqs, catSuffix) : '00';

      return requirementSpecificationsService.create(
        productId,
        companyId,
        {
          description,
          category,
          traces_to: selectedSysReqs.join(', '),
          linked_risks: selectedHazards.join(', '),
          verification_status: 'Not Started',
          component_id: componentId || null,
        },
        'hardware',
        catSuffix,
        lineage
      );
    },
    onSuccess: () => {
      toast.success(lang('hardwareRequirements.toast.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'hardware'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', productId] });
      setOpen(false);
      setDescription("");
      setCategory("");
      setComponentId("");
      setSelectedSysReqs([]);
      setSelectedHazards([]);
      setAiSuggested(false);
      setManualCategorySet(false);
    },
    onError: (error) => {
      toast.error(lang('hardwareRequirements.toast.createError'));
      console.error('Create requirement error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }
    createRequirementMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger || (
          <Button disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            {lang('hardwareRequirements.addRequirement')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{lang('hardwareRequirements.dialog.add.title')}</DialogTitle>
          <DialogDescription>
            {lang('hardwareRequirements.dialog.add.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">{lang('hardwareRequirements.form.description')} *</Label>
            <Textarea
              id="description"
              placeholder={lang('hardwareRequirements.form.descriptionPlaceholder')}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setManualCategorySet(false);
                setAiSuggested(false);
              }}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Linked Component (optional)</Label>
            <Select value={componentId} onValueChange={setComponentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a device component..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {components.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.part_number ? `${c.part_number} — ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="category">{lang('hardwareRequirements.form.category')}</Label>
              {aiLoading && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Suggesting...
                </span>
              )}
              {aiSuggested && !aiLoading && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <Sparkles className="h-3 w-3" />
                  AI suggested
                </span>
              )}
            </div>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder={lang('hardwareRequirements.form.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {HWR_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{lang('hardwareRequirements.form.tracesTo')}</Label>
            <MultiSelect
              options={sysReqOptions}
              selected={selectedSysReqs}
              onChange={setSelectedSysReqs}
              placeholder={loadingSysReqs ? "Loading system requirements..." : "Select system requirements..."}
            />
          </div>

          <div className="space-y-2">
            <Label>{lang('hardwareRequirements.form.linkedRisks')}</Label>
            <MultiSelect
              options={hazardOptions}
              selected={selectedHazards}
              onChange={setSelectedHazards}
              placeholder={loadingHazards ? "Loading hazards..." : "Select hazards/risks..."}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRequirementMutation.isPending}>
              {createRequirementMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {lang('hardwareRequirements.dialog.add.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
