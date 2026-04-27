import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Loader2, Sparkles, Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MultiSelect } from "@/components/settings/document-control/MultiSelect";
import { toast } from "sonner";
import { toast as sonnerToast } from "sonner";
import { requirementSpecificationsService } from "@/services/requirementSpecificationsService";
import { resolveCategory, resolveLineageBase } from "@/utils/traceabilityIdUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { UserNeedsService } from "@/services/userNeedsService";
import { hazardsService } from "@/services/hazardsService";
import { AIRequirementUserNeedSuggestions } from "@/components/product/design-risk-controls/requirement-specifications/AIRequirementUserNeedSuggestions";
import { AIRequirementHazardSuggestions } from "@/components/product/design-risk-controls/requirement-specifications/AIRequirementHazardSuggestions";
import { REQUIREMENT_CATEGORIES } from "@/components/product/design-risk-controls/requirement-specifications/types";
import type { UserNeed } from "@/components/product/design-risk-controls/user-needs/types";
import type { Hazard } from "@/components/product/design-risk-controls/risk-management/types";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AddSystemRequirementDialogProps {
  productId: string;
  companyId: string;
  trigger?: React.ReactNode;
  disabled?: boolean;
  productName?: string;
}

export function AddSystemRequirementDialog({
  productId,
  companyId,
  trigger,
  disabled = false,
  productName,
}: AddSystemRequirementDialogProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    setOpen(newOpen);
  };
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedUserNeeds, setSelectedUserNeeds] = useState<string[]>([]);
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [userNeeds, setUserNeeds] = useState<UserNeed[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loadingUserNeeds, setLoadingUserNeeds] = useState(false);
  const [loadingHazards, setLoadingHazards] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [manualCategorySet, setManualCategorySet] = useState(false);
  const [userNeedPopoverOpen, setUserNeedPopoverOpen] = useState(false);
  const [isCreatingDraftHazard, setIsCreatingDraftHazard] = useState(false);
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
            categories: REQUIREMENT_CATEGORIES.map(c => ({ id: c.id, label: c.label, description: c.description }))
          }
        });

        if (!error && data?.categoryId) {
          setCategory(data.categoryId);
          setAiSuggested(true);
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

  useEffect(() => {
    if (!open) return;
    setLoadingUserNeeds(true);
    setLoadingHazards(true);
    UserNeedsService.getUserNeeds(productId)
      .then(setUserNeeds)
      .catch((e) => console.error('Failed to load user needs:', e))
      .finally(() => setLoadingUserNeeds(false));
    hazardsService.getHazardsByProduct(productId)
      .then(setHazards)
      .catch((e) => console.error('Failed to load hazards:', e))
      .finally(() => setLoadingHazards(false));
  }, [open, productId]);

  const hazardOptions = hazards.map((h) => ({
    label: `${h.hazard_id}: ${h.description.length > 60 ? h.description.slice(0, 60) + '…' : h.description}`,
    value: h.hazard_id,
  }));

  const toggleUserNeed = (userNeedId: string) => {
    if (selectedUserNeeds.includes(userNeedId)) {
      setSelectedUserNeeds(selectedUserNeeds.filter(id => id !== userNeedId));
    } else {
      setSelectedUserNeeds([...selectedUserNeeds, userNeedId]);
    }
  };

  const removeUserNeed = (userNeedId: string) => {
    setSelectedUserNeeds(selectedUserNeeds.filter(id => id !== userNeedId));
  };

  const handleAISelect = (userNeedId: string) => {
    if (!selectedUserNeeds.includes(userNeedId)) {
      setSelectedUserNeeds([...selectedUserNeeds, userNeedId]);
    }
  };

  const handleAIUserNeedCreated = (newNeed: { id: string; user_need_id: string; description: string }) => {
    setUserNeeds(prev => [...prev, {
      id: newNeed.id,
      user_need_id: newNeed.user_need_id,
      description: newNeed.description,
      product_id: productId,
      company_id: companyId,
      linked_requirements: '',
      status: 'Not Met' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    }]);
  };

  const handleCreateNewHazard = async () => {
    setIsCreatingDraftHazard(true);
    try {
      await hazardsService.createHazard(productId, companyId, {
        description: `Draft - new system requirement`,
        linked_requirements: '',
      }, 'SYS');
      await queryClient.invalidateQueries({ queryKey: ["hazards", productId] });
      sonnerToast.success('Draft hazard created');
      const productPath = location.pathname.split('/design-risk-controls')[0];
      navigate(`${productPath}/design-risk-controls?tab=risk-management&returnTo=system-requirements`);
    } catch (e) {
      console.error('Failed to create draft hazard:', e);
      sonnerToast.error('Failed to create draft hazard');
    } finally {
      setIsCreatingDraftHazard(false);
    }
  };

  const createRequirementMutation = useMutation({
    mutationFn: async () => {
      const catSuffix = selectedUserNeeds.length > 0 ? resolveCategory(selectedUserNeeds) : 'C';
      const lineage = selectedUserNeeds.length > 0 ? resolveLineageBase(selectedUserNeeds, catSuffix) : '00';

      return requirementSpecificationsService.create(
        productId,
        companyId,
        {
          description,
          category,
          traces_to: selectedUserNeeds.join(', '),
          linked_risks: selectedHazards.join(', '),
          verification_status: 'Not Started'
        },
        'system',
        catSuffix,
        lineage
      );
    },
    onSuccess: () => {
      toast.success(lang('systemRequirements.toast.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['requirement-specifications', productId, 'system'] });
      queryClient.invalidateQueries({ queryKey: ['linked-reqs-for-user-needs', productId] });
      setOpen(false);
      setDescription("");
      setCategory("");
      setSelectedUserNeeds([]);
      setSelectedHazards([]);
      setAiSuggested(false);
      setManualCategorySet(false);
    },
    onError: (error) => {
      toast.error(lang('systemRequirements.toast.createError'));
      console.error('Create requirement error:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!description.trim()) {
      toast.error(lang('systemRequirements.validation.descriptionRequired'));
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
            {lang('systemRequirements.addRequirement')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lang('systemRequirements.dialog.add.title')}</DialogTitle>
          <DialogDescription>
            {lang('systemRequirements.dialog.add.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{lang('systemRequirements.form.description')} *</Label>
            <Textarea
              id="description"
              placeholder={lang('systemRequirements.form.descriptionPlaceholder')}
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

          {/* Traces to User Need(s) — Popover + Command searchable multi-select with AI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{lang('systemRequirements.form.tracesTo')}</Label>
              <AIRequirementUserNeedSuggestions
                requirementDescription={description}
                productId={productId}
                companyId={companyId}
                productName={productName}
                existingUserNeeds={userNeeds.map(un => ({
                  id: un.id,
                  user_need_id: un.user_need_id,
                  description: un.description,
                }))}
                selectedIds={selectedUserNeeds}
                onSelect={handleAISelect}
                onUserNeedCreated={handleAIUserNeedCreated}
              />
            </div>
            {!loadingUserNeeds && selectedUserNeeds.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No user need linked yet. Click <span className="font-medium">Suggest with AI</span> to find an existing match or draft a new one from this requirement.
              </p>
            )}
            {loadingUserNeeds ? (
              <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm text-muted-foreground">Loading user needs...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Selected user needs as badges */}
                {selectedUserNeeds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUserNeeds.map(id => {
                      const need = userNeeds.find(un => un.user_need_id === id);
                      return (
                        <Badge key={id} variant="secondary" className="flex items-center gap-1 text-xs">
                          {id}{need ? `: ${need.description.substring(0, 30)}...` : ''}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removeUserNeed(id)}
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Searchable dropdown */}
                <Popover open={userNeedPopoverOpen} onOpenChange={setUserNeedPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal text-sm"
                    >
                      {selectedUserNeeds.length === 0
                        ? "Select user needs..."
                        : `${selectedUserNeeds.length} selected`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100] bg-popover" align="start">
                    <Command>
                      <CommandInput placeholder="Search user needs..." />
                      <CommandList>
                        <CommandEmpty>No user needs found.</CommandEmpty>
                        <CommandGroup>
                          {userNeeds.map(un => (
                            <CommandItem
                              key={un.user_need_id}
                              value={`${un.user_need_id} ${un.description}`}
                              onSelect={() => toggleUserNeed(un.user_need_id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUserNeeds.includes(un.user_need_id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <span className="truncate">
                                <span className="font-medium">{un.user_need_id}</span>
                                {': '}
                                {un.description.substring(0, 60)}{un.description.length > 60 ? '...' : ''}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="category">{lang('systemRequirements.form.category')}</Label>
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
                <SelectValue placeholder={lang('systemRequirements.form.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {REQUIREMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked Risks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{lang('systemRequirements.form.linkedRisks')}</Label>
              <div className="flex items-center gap-2">
                <AIRequirementHazardSuggestions
                  requirementDescription={description}
                  requirementType="system"
                  productId={productId}
                  companyId={companyId}
                  productName={productName}
                  existingHazards={hazards.map(h => ({ id: h.id, hazard_id: h.hazard_id, description: h.description }))}
                  selectedIds={selectedHazards}
                  onSelect={(id) => setSelectedHazards(prev => prev.includes(id) ? prev : [...prev, id])}
                  onHazardCreated={(nh) => {
                    setHazards(prev => [...prev, {
                      id: nh.id,
                      hazard_id: nh.hazard_id,
                      product_id: productId,
                      company_id: companyId,
                      description: nh.description,
                      mitigation_measure: '',
                      mitigation_type: 'Information for Safety',
                      residual_risk: 'Medium',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      created_by: null,
                    } as Hazard]);
                    queryClient.invalidateQueries({ queryKey: ["hazards", productId] });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCreateNewHazard}
                  disabled={isCreatingDraftHazard}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {isCreatingDraftHazard ? 'Creating...' : 'Create New Hazard'}
                </Button>
              </div>
            </div>
            {!loadingHazards && selectedHazards.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No risk linked yet. Click <span className="font-medium">Suggest with AI</span> to find a matching hazard or draft a new one from this requirement.
              </p>
            )}
            {loadingHazards ? (
              <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm text-muted-foreground">Loading hazards...</span>
              </div>
            ) : (
              <MultiSelect
                options={hazardOptions}
                selected={selectedHazards}
                onChange={setSelectedHazards}
                placeholder="Select hazards/risks..."
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {lang('common.cancel')}
            </Button>
            <Button type="submit" disabled={createRequirementMutation.isPending}>
              {createRequirementMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {lang('systemRequirements.dialog.add.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
