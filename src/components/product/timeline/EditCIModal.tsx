import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSelector } from "@/components/common/UserSelector";
import { ReviewerGroupSelector } from "@/components/common/ReviewerGroupSelector";
import { BudgetSection } from "@/components/budget/BudgetSection";
import { BudgetHelpDialog } from "@/components/budget/BudgetHelpDialog";
import { BulkBudgetOperationsDialog } from "@/components/budget/BulkBudgetOperationsDialog";
import { PhaseTimelineService } from "@/services/phaseTimelineService";
import { PhaseBudgetService, PhaseBudgetItem } from "@/services/phaseBudgetService";
import { useReviewerGroups } from "@/hooks/useReviewerGroups";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Save, HelpCircle } from "lucide-react";
import { useTemplateSettings } from "@/hooks/useTemplateSettings";

interface EditCIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  ciData: {
    id: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    isCurrentPhase?: boolean;
    isOverdue?: boolean;
    position?: number;
    likelihood_of_success?: number;
    typical_start_day?: number;
    typical_duration_days?: number;
    assigned_to?: string | null;
    reviewer_group_id?: string | null;
    phase_id?: string;
    
    productId?: string;
    companyId?: string;
  } | null;
}

export function EditCIModal({ isOpen, onClose, onSave, ciData }: EditCIModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [budgetItems, setBudgetItems] = useState<PhaseBudgetItem[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [showBudgetHelp, setShowBudgetHelp] = useState(false);
  const [showBulkBudget, setShowBulkBudget] = useState(false);
  const [hasBudgetChanges, setHasBudgetChanges] = useState(false);
  const { settings } = useTemplateSettings(ciData?.companyId || '');
  const defaultCurrency = settings.default_currency || 'USD';
  const [formData, setFormData] = useState({
    status: ciData?.status || "N/A",
    startDate: ciData?.startDate,
    dueDate: ciData?.endDate,
    durationDays:
      ciData?.typical_duration_days ||
      (ciData?.startDate && ciData?.endDate
        ? Math.ceil((ciData.endDate.getTime() - ciData.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : undefined),
    editorId: "",
    reviewerGroupId: "",
    likelihoodOfSuccess: ciData?.likelihood_of_success || 0,
  });
  const [dateError, setDateError] = useState<string | null>(null);

  // Sync form data with ciData whenever the modal opens or ciData changes
  useEffect(() => {
    if (isOpen && ciData) {
      {
        const calcDuration = (s?: Date, e?: Date) =>
          s && e ? Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) : undefined;
        const initDuration = calcDuration(ciData.startDate, ciData.endDate) ?? ciData.typical_duration_days;
        setFormData({
          status: ciData.status || "N/A",
          startDate: ciData.startDate,
          dueDate: ciData.endDate,
          durationDays: initDuration,
          editorId: ciData.assigned_to || "",
          reviewerGroupId: ciData.reviewer_group_id || "",
          likelihoodOfSuccess: ciData.likelihood_of_success || 0,
        });
        setDateError(null);
        setHasBudgetChanges(false);
      }
      
      // Load budget items
      loadBudgetItems();
    }
  }, [isOpen, ciData]);

  const loadBudgetItems = async () => {
    if (!ciData?.id) return;
    
    setBudgetLoading(true);
    try {
      const items = await PhaseBudgetService.getBudgetItemsByPhase(ciData.id);
      setBudgetItems(items);
    } catch (error) {
      console.error('Error loading budget items:', error);
      toast.error('Failed to load budget items');
    } finally {
      setBudgetLoading(false);
    }
  };

  const { reviewerGroups, isLoading: reviewerGroupsLoading } = useReviewerGroups(ciData?.companyId);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyValidation = (start?: Date, due?: Date) => {
    if (start && due && due < start) {
      setDateError("Due date cannot be before start date");
    } else {
      setDateError(null);
    }
  };

  const handleStartDateChange = (date?: Date) => {
    setFormData((prev) => {
      const next: typeof prev = { ...prev, startDate: date || undefined };
      if (!date) {
        next.durationDays = undefined;
        next.dueDate = undefined;
        applyValidation(next.startDate, next.dueDate);
        return next;
      }
      if (typeof prev.durationDays === "number" && !isNaN(prev.durationDays)) {
        const d = new Date(date);
        d.setDate(d.getDate() + prev.durationDays);
        next.dueDate = d;
      } else if (prev.dueDate) {
        const diff = Math.ceil(
          (prev.dueDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        next.durationDays = diff >= 0 ? diff : undefined;
      }
      applyValidation(next.startDate, next.dueDate);
      return next;
    });
  };

  const handleDueDateChange = (date?: Date) => {
    setFormData((prev) => {
      const next: typeof prev = { ...prev, dueDate: date || undefined };
      if (prev.startDate && date) {
        const diff = Math.ceil(
          (date.getTime() - prev.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        next.durationDays = diff >= 0 ? diff : undefined;
      }
      applyValidation(next.startDate, next.dueDate);
      return next;
    });
  };

  const handleDurationChange = (value?: number) => {
    setFormData((prev) => {
      const next: typeof prev = { ...prev, durationDays: value };
      if (prev.startDate && typeof value === "number" && !isNaN(value)) {
        const d = new Date(prev.startDate);
        d.setDate(d.getDate() + value);
        next.dueDate = d;
      }
      applyValidation(next.startDate, next.dueDate);
      return next;
    });
  };

  const updatePhaseLikelihoodOfSuccess = async (phaseId: string, likelihood: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lifecycle_phases')
        .update({ 
          likelihood_of_success: likelihood,
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId);

      if (error) {
        console.error('Failed to update likelihood:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating likelihood:', error);
      return false;
    }
  };

  const handleAddBudgetItem = async (category: 'fixed' | 'variable' | 'other', itemName: string, cost: number) => {
    if (!ciData?.id) return;
    
    setBudgetLoading(true);
    try {
      await PhaseBudgetService.createBudgetItem({
        phase_id: ciData.id,
        category,
        item_name: itemName,
        cost,
        currency: defaultCurrency
      });
      
      await loadBudgetItems(); // Refresh the list
      toast.success('Budget item added successfully');
      setHasBudgetChanges(true);
    } catch (error: any) {
      console.error('Error adding budget item:', error);
      const message = error?.code === '42501'
        ? 'Permission denied. You need editor or admin access to add budget items.'
        : 'Failed to add budget item';
      toast.error(message);
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleUpdateBudgetItem = async (itemId: string, itemName: string, cost: number, actualCost?: number | null) => {
    try {
      await PhaseBudgetService.updateBudgetItem(itemId, {
        item_name: itemName,
        cost,
        actual_cost: actualCost
      });
      
      await loadBudgetItems(); // Refresh the list
      toast.success('Budget item updated successfully');
      setHasBudgetChanges(true);
    } catch (error) {
      console.error('Error updating budget item:', error);
      toast.error('Failed to update budget item');
      throw error;
    }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    setBudgetLoading(true);
    try {
      await PhaseBudgetService.deleteBudgetItem(itemId);
      await loadBudgetItems(); // Refresh the list
      toast.success('Budget item deleted successfully');
      setHasBudgetChanges(true);
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Failed to delete budget item');
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ciData) return;

    setIsSaving(true);
    try {
      const updates = [];

      // Update status if changed
      if (formData.status !== ciData.status) {
        const statusUpdated = await PhaseTimelineService.updatePhaseStatus(ciData.id, formData.status);
        if (!statusUpdated) {
          throw new Error("Failed to update status");
        }
        updates.push("status");
      }

      // Update dates - use atomic update when both changed to avoid constraint violation
      const startChanged = formData.startDate !== ciData.startDate;
      const endChanged = formData.dueDate !== ciData.endDate;

      if (startChanged && endChanged) {
        // Atomic update of both dates in a single query
        const datesUpdated = await PhaseTimelineService.updatePhaseDates(ciData.id, formData.startDate, formData.dueDate);
        if (!datesUpdated) {
          throw new Error("Failed to update dates");
        }
        updates.push("start date", "due date");
      } else if (startChanged) {
        const startDateUpdated = await PhaseTimelineService.updatePhaseStartDate(ciData.id, formData.startDate);
        if (!startDateUpdated) {
          throw new Error("Failed to update start date");
        }
        updates.push("start date");
      } else if (endChanged) {
        const endDateUpdated = await PhaseTimelineService.updatePhaseEndDate(ciData.id, formData.dueDate);
        if (!endDateUpdated) {
          throw new Error("Failed to update due date");
        }
        updates.push("due date");
      }

      // Update likelihood of success if changed
      if (formData.likelihoodOfSuccess !== ciData.likelihood_of_success) {
        const likelihoodUpdated = await updatePhaseLikelihoodOfSuccess(ciData.id, formData.likelihoodOfSuccess);
        if (!likelihoodUpdated) {
          throw new Error("Failed to update likelihood of success");
        }
        updates.push("likelihood of success");
      }

      // Update assigned user if changed
      if (formData.editorId !== (ciData.assigned_to || "")) {
        // Use phase_id for company_phases table
        const phaseId = ciData.phase_id || ciData.id;
        const assignedToUpdated = await PhaseTimelineService.updatePhaseAssignedTo(phaseId, formData.editorId || null);
        if (!assignedToUpdated) {
          throw new Error("Failed to update assigned user");
        }
        updates.push("assigned user");
      }

      // Update reviewer group if changed
      if (formData.reviewerGroupId !== (ciData.reviewer_group_id || "")) {
        // Use phase_id for company_phases table
        const phaseId = ciData.phase_id || ciData.id;
        const reviewerGroupUpdated = await PhaseTimelineService.updatePhaseReviewerGroup(phaseId, formData.reviewerGroupId || null);
        if (!reviewerGroupUpdated) {
          throw new Error("Failed to update reviewer group");
        }
        updates.push("reviewer group");
      }

      const hasAnyChanges = updates.length > 0 || hasBudgetChanges;
      
      if (hasAnyChanges) {
        if (updates.length > 0 && hasBudgetChanges) {
          toast.success(`Updated budget successfully`);
        } else if (updates.length > 0) {
          toast.success(`Updated successfully`);
        } else if (hasBudgetChanges) {
          toast.success('Budget updated successfully');
        }
        onSave?.();
      } else {
        toast.info("No changes were made");
      }
      onClose();
    } catch (error) {
      console.error("Error saving instance details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (!ciData) return null;

  // Calculate phase duration in days
  const phaseDurationDays = formData.startDate && formData.dueDate 
    ? Math.ceil((formData.dueDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  // Calculate budget totals with phase duration for variable costs
  const groupedItems = PhaseBudgetService.groupByCategory(budgetItems);
  const totals = PhaseBudgetService.calculateTotals(budgetItems, phaseDurationDays);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: defaultCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{ciData.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-medium border-b pb-2">Instance Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Dropdown */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Likelihood of Success */}
              <div className="space-y-2">
                <Label>Likelihood of Success (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.likelihoodOfSuccess}
                  onChange={(e) => handleInputChange('likelihoodOfSuccess', parseInt(e.target.value) || 0)}
                  placeholder="0-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <input
                  type="date"
                  value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                    handleStartDateChange(dateValue);
                  }}
                  className="w-full border border-foreground/15 rounded-md p-2"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <input
                  type="date"
                  value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                    handleDueDateChange(dateValue);
                  }}
                  className="w-full border border-foreground/15 rounded-md p-2"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.durationDays ?? ""}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setFormData((prev) => ({ ...prev, durationDays: undefined }));
                      return;
                    }
                    const v = Math.max(0, parseInt(e.target.value));
                    handleDurationChange(Number.isNaN(v) ? undefined : v);
                  }}
                  placeholder="e.g. 30"
                  disabled={!formData.startDate}
                />
                {!formData.startDate && (
                  <p className="text-xs text-muted-foreground">Set a start date to edit duration</p>
                )}
              </div>
            </div>
            {dateError && (
              <p className="text-sm text-destructive">{dateError}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Editor Selector */}
              <UserSelector
                value={formData.editorId || undefined}
                onValueChange={(value) => handleInputChange('editorId', value || "")}
                companyId={ciData.companyId}
                label="Editor"
                placeholder="Select editor"
                allowClear={true}
              />

              {/* Reviewer Group Selector */}
              <ReviewerGroupSelector
                value={formData.reviewerGroupId || undefined}
                onValueChange={(value) => handleInputChange('reviewerGroupId', value || "")}
                reviewerGroups={reviewerGroups}
                isLoading={reviewerGroupsLoading}
                label="Reviewer Group"
                placeholder="Select reviewer group"
                allowClear={true}
              />
            </div>
          </div>

          {/* Budget Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-medium">Budget</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBudgetHelp(true)}
                className="h-6 w-6 p-0"
                title="View budgeting guidelines for lifecycle phases"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <BudgetSection
                category="fixed"
                items={groupedItems.fixed}
                subTotal={totals.fixed}
                actualSubTotal={totals.actualFixed}
                onAddItem={handleAddBudgetItem}
                onUpdateItem={handleUpdateBudgetItem}
                onDeleteItem={handleDeleteBudgetItem}
                isLoading={budgetLoading}
                companyId={ciData?.companyId || ''}
                productId={ciData?.productId}
                onBulkOperations={() => setShowBulkBudget(true)}
              />
              
              <BudgetSection
                category="variable"
                items={groupedItems.variable}
                subTotal={totals.variable}
                actualSubTotal={totals.actualVariable}
                dailyTotal={totals.variableDaily}
                phaseDurationDays={phaseDurationDays}
                onAddItem={handleAddBudgetItem}
                onUpdateItem={handleUpdateBudgetItem}
                onDeleteItem={handleDeleteBudgetItem}
                isLoading={budgetLoading}
                companyId={ciData?.companyId || ''}
                productId={ciData?.productId}
              />
              
              <BudgetSection
                category="other"
                items={groupedItems.other}
                subTotal={totals.other}
                actualSubTotal={totals.actualOther}
                onAddItem={handleAddBudgetItem}
                onUpdateItem={handleUpdateBudgetItem}
                onDeleteItem={handleDeleteBudgetItem}
                isLoading={budgetLoading}
                companyId={ciData?.companyId || ''}
                productId={ciData?.productId}
              />
              
              {/* Overall Total */}
              <div className="border-t-2 pt-3 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-lg font-semibold">
                  <div className="col-span-4">Total Budget:</div>
                  <div className="col-span-3 text-center font-mono">{formatCurrency(totals.total)}</div>
                  <div className="col-span-3 text-center font-mono">{formatCurrency(totals.actualTotal)}</div>
                  <div className="col-span-2"></div>
                </div>
                {totals.total !== totals.actualTotal && totals.actualTotal > 0 && (
                  <div className="grid grid-cols-12 gap-2 text-sm">
                    <div className="col-span-4 text-muted-foreground">Total Variance:</div>
                    <div className="col-span-3"></div>
                    <div className={`col-span-3 text-center font-mono ${totals.actualTotal > totals.total ? 'text-destructive' : 'text-green-600'}`}>
                      {totals.actualTotal > totals.total ? '+' : ''}{formatCurrency(totals.actualTotal - totals.total)}
                    </div>
                    <div className="col-span-2"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !!dateError}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Budget Help Dialog */}
        <BudgetHelpDialog 
          isOpen={showBudgetHelp} 
          onOpenChange={setShowBudgetHelp}
          currentPhaseName={ciData?.name}
        />
      </DialogContent>
    </Dialog>
  );
}