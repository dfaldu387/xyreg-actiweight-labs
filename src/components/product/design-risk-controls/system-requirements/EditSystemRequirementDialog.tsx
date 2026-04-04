import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Trash2, Sparkles, Loader2, AlertTriangle, Plus, Check, ChevronsUpDown, X } from "lucide-react";
import { RequirementSpecification } from "@/components/product/design-risk-controls/requirement-specifications/types";
import { REQUIREMENT_CATEGORIES } from "@/components/product/design-risk-controls/requirement-specifications/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MultiSelect } from "@/components/settings/document-control/MultiSelect";
import { hazardsService } from "@/services/hazardsService";
import { UserNeedsService } from "@/services/userNeedsService";
import { AIRequirementUserNeedSuggestions } from "@/components/product/design-risk-controls/requirement-specifications/AIRequirementUserNeedSuggestions";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserNeed } from "@/components/product/design-risk-controls/user-needs/types";

interface EditSystemRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: RequirementSpecification | null;
  onSave: (id: string, updates: { description: string; category: string; traces_to: string; linked_risks: string; verification_status: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  productId: string;
  companyId: string;
  productName?: string;
}

export function EditSystemRequirementDialog({
  open,
  onOpenChange,
  requirement,
  onSave,
  onDelete,
  isLoading = false,
  disabled = false,
  productId,
  companyId,
  productName,
}: EditSystemRequirementDialogProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isCreatingDraftHazard, setIsCreatingDraftHazard] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [selectedUserNeeds, setSelectedUserNeeds] = useState<string[]>([]);
  const [userNeedPopoverOpen, setUserNeedPopoverOpen] = useState(false);
  const [userNeedsList, setUserNeedsList] = useState<UserNeed[]>([]);
  const [loadingUserNeeds, setLoadingUserNeeds] = useState(false);

  const { data: hazards = [], isLoading: loadingHazards } = useQuery({
    queryKey: ['hazards-for-edit', productId],
    queryFn: () => hazardsService.getHazardsByProduct(productId),
    enabled: open && !!productId,
  });

  // Load user needs when dialog opens
  useEffect(() => {
    if (!open || !productId) return;
    setLoadingUserNeeds(true);
    UserNeedsService.getUserNeeds(productId)
      .then(setUserNeedsList)
      .catch((e) => console.error('Failed to load user needs:', e))
      .finally(() => setLoadingUserNeeds(false));
  }, [open, productId]);

  const hazardOptions = hazards.map(h => ({
    value: h.hazard_id,
    label: `${h.hazard_id}: ${h.description?.substring(0, 60) || 'No description'}`,
  }));

  // Query for User Needs that this requirement traces to (to warn on delete)
  const tracesToIds = requirement?.traces_to
    ? requirement.traces_to.split(',').map(id => id.trim()).filter(Boolean)
    : [];

  const { data: affectedUserNeeds = [] } = useQuery({
    queryKey: ['affected-uns-for-sysr', requirement?.requirement_id],
    queryFn: async () => {
      return tracesToIds.map(id => ({ user_need_id: id }));
    },
    enabled: !!requirement?.requirement_id && tracesToIds.length > 0,
  });

  const [formData, setFormData] = useState({
    description: '',
    category: '',
    verification_status: 'Not Started',
  });

  // Sync form data when requirement changes
  React.useEffect(() => {
    if (requirement) {
      setFormData({
        description: requirement.description || '',
        category: requirement.category || '',
        verification_status: requirement.verification_status || 'Not Started',
      });
      setSelectedRisks(
        (requirement.linked_risks || '').split(',').map(s => s.trim()).filter(Boolean)
      );
      setSelectedUserNeeds(
        (requirement.traces_to || '').split(',').map(s => s.trim()).filter(Boolean)
      );
      setAiSuggested(false);
    }
  }, [requirement]);

  if (!requirement) return null;

  const handleOpenChange = (newOpen: boolean) => {
    if (disabled && newOpen) return;
    onOpenChange(newOpen);
  };

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
    setUserNeedsList(prev => [...prev, {
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

  const triggerAiSuggestion = async () => {
    if (!formData.description || formData.description.length < 15) return;
    setIsSuggesting(true);
    setAiSuggested(false);
    try {
      const categories = REQUIREMENT_CATEGORIES.map(c => ({
        id: c.id, label: c.label, description: c.description
      }));
      const { data, error } = await supabase.functions.invoke('ai-category-suggester', {
        body: { description: formData.description, categories, context: 'system-requirement' }
      });
      if (!error && data?.categoryId) {
        const validIds = REQUIREMENT_CATEGORIES.map(c => c.id);
        if (validIds.includes(data.categoryId)) {
          setFormData(prev => ({ ...prev, category: data.categoryId }));
          setAiSuggested(true);
        }
      }
    } catch (e) {
      console.error('AI category suggestion error:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!formData.description.trim()) return;
    await onSave(requirement.id, {
      ...formData,
      traces_to: selectedUserNeeds.join(', '),
      linked_risks: selectedRisks.join(', '),
    });
    handleOpenChange(false);
  };

  const handleDelete = async () => {
    if (disabled) return;
    await onDelete(requirement.id);
    setShowDeleteDialog(false);
    handleOpenChange(false);
  };

  const handleCreateNewHazard = async () => {
    if (!requirement) return;
    setIsCreatingDraftHazard(true);
    try {
      await hazardsService.createHazard(routeProductId || productId, requirement.company_id || companyId, {
        description: `Draft - linked from ${requirement.requirement_id}`,
        linked_requirements: requirement.requirement_id,
      }, 'SYS');
      await queryClient.invalidateQueries({ queryKey: ["hazards", routeProductId || productId] });
      sonnerToast.success(`Draft hazard created and linked to ${requirement.requirement_id}`);
      navigate(`/app/product/${routeProductId || productId}/design-risk-controls?tab=risk-management&returnTo=system-requirements`);
    } catch (e) {
      console.error('Failed to create draft hazard:', e);
      sonnerToast.error('Failed to create draft hazard');
    } finally {
      setIsCreatingDraftHazard(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang('systemRequirements.dialog.edit.title')} - {requirement.requirement_id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{lang('systemRequirements.form.description')} *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[100px]"
                required
                disabled={disabled}
              />
            </div>

            {/* Traces to User Need(s) — Popover + Command searchable multi-select with AI */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>{lang('systemRequirements.form.tracesTo')}</Label>
                <AIRequirementUserNeedSuggestions
                  requirementDescription={formData.description}
                  productId={productId}
                  companyId={companyId}
                  productName={productName}
                  existingUserNeeds={userNeedsList.map(un => ({
                    id: un.id,
                    user_need_id: un.user_need_id,
                    description: un.description,
                  }))}
                  selectedIds={selectedUserNeeds}
                  onSelect={handleAISelect}
                  onUserNeedCreated={handleAIUserNeedCreated}
                />
              </div>
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
                        const need = userNeedsList.find(un => un.user_need_id === id);
                        return (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1 text-xs">
                            {id}{need ? `: ${need.description.substring(0, 30)}...` : ''}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeUserNeed(id)}
                              disabled={disabled}
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
                        disabled={disabled}
                      >
                        {selectedUserNeeds.length === 0
                          ? "Select user needs..."
                          : `${selectedUserNeeds.length} selected`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search user needs..." />
                        <CommandList>
                          <CommandEmpty>No user needs found.</CommandEmpty>
                          <CommandGroup>
                            {userNeedsList.map(un => (
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
              <Label className="flex items-center gap-2">
                {lang('systemRequirements.form.category')}
                <button
                  type="button"
                  onClick={triggerAiSuggestion}
                  disabled={isSuggesting || disabled}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  title="AI suggest category"
                >
                  {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {aiSuggested ? 'AI suggested' : 'AI suggest'}
                </button>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => { setFormData({ ...formData, category: value }); setAiSuggested(false); }}
                disabled={disabled}
              >
                <SelectTrigger disabled={disabled}>
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

            {/* Verification Status */}
            <div className="space-y-2">
              <Label htmlFor="verification_status">{lang('systemRequirements.form.verificationStatus')}</Label>
              <Select
                value={formData.verification_status}
                onValueChange={(value) => setFormData({ ...formData, verification_status: value })}
                disabled={disabled}
              >
                <SelectTrigger disabled={disabled}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">{lang('systemRequirements.status.notStarted')}</SelectItem>
                  <SelectItem value="In Progress">{lang('systemRequirements.status.inProgress')}</SelectItem>
                  <SelectItem value="Passed">{lang('systemRequirements.status.verified')}</SelectItem>
                  <SelectItem value="Failed">{lang('systemRequirements.status.failed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Linked Risks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{lang('systemRequirements.form.linkedRisks')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCreateNewHazard}
                  disabled={isCreatingDraftHazard || disabled}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {isCreatingDraftHazard ? 'Creating...' : 'Create New Hazard'}
                </Button>
              </div>
              {loadingHazards ? (
                <div className="h-10 flex items-center px-3 py-2 border rounded-md bg-muted">
                  <span className="text-sm text-muted-foreground">Loading hazards...</span>
                </div>
              ) : (
                <MultiSelect
                  options={hazardOptions}
                  selected={selectedRisks}
                  onChange={setSelectedRisks}
                  placeholder="Select linked risks..."
                />
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => { if (!disabled) setShowDeleteDialog(true); }}
                disabled={disabled || isLoading}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {lang('systemRequirements.dialog.delete.deleteButton') || 'Delete Requirement'}
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={disabled}>
                  {lang('common.cancel')}
                </Button>
                <Button type="submit" disabled={disabled || isLoading}>
                  {isLoading ? lang('common.saving') || 'Saving...' : lang('userNeeds.dialog.edit.saveChanges') || 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {lang('systemRequirements.dialog.delete.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang('systemRequirements.dialog.delete.description').replace('{id}', requirement.requirement_id)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {affectedUserNeeds.length > 0 && (
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">
                The following user needs will lose their reverse traceability link:
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                {affectedUserNeeds.map((un) => (
                  <li key={un.user_need_id} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-orange-600 rounded-full" />
                    {un.user_need_id} → {requirement.requirement_id}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{lang('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lang('common.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
