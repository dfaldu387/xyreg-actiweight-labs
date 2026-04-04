import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Sparkles } from "lucide-react";
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
import { useTranslation } from "@/hooks/useTranslation";
import { hazardsService } from "@/services/hazardsService";
import { MultiSelect } from "@/components/settings/document-control/MultiSelect";
import type { Hazard } from "@/components/product/design-risk-controls/risk-management/types";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";

const SWR_CATEGORIES = [
  { id: 'Functional', label: 'Functional', description: 'Functional software requirements' },
  { id: 'Interface', label: 'Interface', description: 'Interface and integration requirements' },
  { id: 'Security', label: 'Security', description: 'Cybersecurity requirements' },
  { id: 'Safety', label: 'Safety', description: 'Software safety requirements' },
  { id: 'Usability', label: 'Usability', description: 'User interface and usability requirements' },
  { id: 'Performance', label: 'Performance', description: 'Performance and efficiency requirements' },
  { id: 'Reliability', label: 'Reliability', description: 'Reliability and availability requirements' },
];

interface AddSoftwareRequirementDialogProps {
  productId: string;
  companyId: string;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export function AddSoftwareRequirementDialog({
  productId,
  companyId,
  trigger,
  disabled = false
}: AddSoftwareRequirementDialogProps) {
  const [open, setOpen] = useState(false);
  const { lang } = useTranslation();

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    setOpen(newOpen);
  };
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
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
            categories: SWR_CATEGORIES,
            context: 'software-requirement'
          }
        });
        if (!error && data?.categoryId) {
          const validIds = SWR_CATEGORIES.map(c => c.id);
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
      // Resolve category suffix and lineage from selected SYSR parents (Core-First rule)
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
          verification_status: 'Not Started'
        },
        'software',
        catSuffix,
        lineage
      );
    },
    onSuccess: () => {
      toast.success(lang('softwareRequirements.toast.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'software'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', productId] });
      setOpen(false);
      setDescription("");
      setCategory("");
      setSelectedSysReqs([]);
      setSelectedHazards([]);
      setAiSuggested(false);
      setManualCategorySet(false);
    },
    onError: (error) => {
      toast.error(lang('softwareRequirements.toast.createError'));
      console.error('Create requirement error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!description.trim()) {
      toast.error(lang('common.validation.descriptionRequired'));
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
            {lang('softwareRequirements.addRequirement')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{lang('softwareRequirements.dialog.add.title')}</DialogTitle>
          <DialogDescription>
            {lang('softwareRequirements.dialog.add.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">{lang('softwareRequirements.form.description')} *</Label>
            <Textarea
              id="description"
              placeholder={lang('softwareRequirements.form.descriptionPlaceholder')}
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
            <div className="flex items-center gap-2">
              <Label htmlFor="category">{lang('softwareRequirements.form.category')}</Label>
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
                <SelectValue placeholder={lang('softwareRequirements.form.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {SWR_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{lang('softwareRequirements.form.tracesTo')}</Label>
            <MultiSelect
              options={sysReqOptions}
              selected={selectedSysReqs}
              onChange={setSelectedSysReqs}
              placeholder={loadingSysReqs ? "Loading system requirements..." : "Select system requirements..."}
            />
          </div>

          <div className="space-y-2">
            <Label>{lang('softwareRequirements.form.linkedRisks')}</Label>
            <MultiSelect
              options={hazardOptions}
              selected={selectedHazards}
              onChange={setSelectedHazards}
              placeholder={loadingHazards ? "Loading hazards..." : "Select hazards/risks..."}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {lang('common.cancel')}
            </Button>
            <Button type="submit" disabled={createRequirementMutation.isPending}>
              {createRequirementMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {lang('softwareRequirements.dialog.add.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
