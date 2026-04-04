import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CalendarDays, CheckCircle, Clock, Circle, DollarSign, Loader2, ChevronDown, ChevronRight, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { PhaseBudgetService, PhaseBudgetItem } from '@/services/phaseBudgetService';
import { getCurrencySymbol } from '@/utils/currencyUtils';
import { BudgetSection } from '@/components/budget/BudgetSection';
import { toast } from 'sonner';
import { useGenesisRestrictions } from '@/hooks/useGenesisRestrictions';

interface Phase {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  is_current_phase?: boolean;
  position?: number;
}

interface SetDatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Project dates
  projectStartDate?: Date;
  designFreezeDate?: string;
  projectedLaunchDate?: string;
  timelineMode: 'forward' | 'backward';
  // Handlers
  onProjectStartDateChange: (date: Date | undefined) => void;
  onDesignFreezeDateChange: (date: Date | undefined) => void;
  onProjectedLaunchDateChange: (date: Date | undefined) => void;
  onTimelineModeChange: (mode: 'forward' | 'backward') => void;
  // Phases for timeline overview
  phases: Phase[];
  // Phase date change handlers
  onPhaseStartDateChange?: (phaseId: string, date: Date | undefined) => Promise<void>;
  onPhaseEndDateChange?: (phaseId: string, date: Date | undefined) => Promise<void>;
  // Optional: default tab to show
  defaultTab?: 'timeline-overview' | 'budget';
  // Currency symbol
  currencySymbol?: string;
  // Required for budget editing
  productId?: string;
  companyId?: string;
  // Genesis timeline confirmation
  timelineConfirmed?: boolean;
  onConfirmTimeline?: () => Promise<void>;
}

interface PhaseBudgetData {
  phaseId: string;
  phaseName: string;
  total: number;
  items: PhaseBudgetItem[];
}

const getStatusIcon = (status?: string, isCurrent?: boolean) => {
  if (isCurrent) {
    return <Clock className="h-4 w-4 text-primary" />;
  }
  switch (status?.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'in progress':
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status?: string, isCurrent?: boolean, lang?: (key: string) => string) => {
  if (isCurrent) {
    return <Badge variant="default" className="text-xs">{lang?.('productMilestones.setDatesDialog.status.current') || 'Current'}</Badge>;
  }
  switch (status?.toLowerCase()) {
    case 'completed':
      return <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">{lang?.('productMilestones.setDatesDialog.status.completed') || 'Completed'}</Badge>;
    case 'in progress':
      return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">{lang?.('productMilestones.setDatesDialog.status.inProgress') || 'In Progress'}</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{lang?.('productMilestones.setDatesDialog.status.notStarted') || 'Not Started'}</Badge>;
  }
};

export function SetDatesDialog({
  open,
  onOpenChange,
  projectStartDate,
  designFreezeDate,
  projectedLaunchDate,
  timelineMode,
  onProjectStartDateChange,
  onDesignFreezeDateChange,
  onProjectedLaunchDateChange,
  onTimelineModeChange,
  phases,
  onPhaseStartDateChange,
  onPhaseEndDateChange,
  defaultTab = 'timeline-overview',
  currencySymbol = '$',
  productId,
  companyId,
  timelineConfirmed,
  onConfirmTimeline
}: SetDatesDialogProps) {
  const { lang } = useTranslation();
  const { isGenesis } = useGenesisRestrictions();
  const [phaseBudgets, setPhaseBudgets] = useState<PhaseBudgetData[]>([]);
  const [simpleCosts, setSimpleCosts] = useState<Record<string, number>>({});
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
  const [budgetItems, setBudgetItems] = useState<PhaseBudgetItem[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const sortedPhases = [...phases].sort((a, b) => (a.position || 0) - (b.position || 0));

  // Fetch budget data when dialog opens
  useEffect(() => {
    if (open && sortedPhases.length > 0) {
      fetchBudgetData();
    }
  }, [open, phases]);

  // Fetch items for expanded phase
  useEffect(() => {
    if (expandedPhaseId) {
      loadBudgetItemsForPhase(expandedPhaseId);
    }
  }, [expandedPhaseId]);

  // Initialize simple costs from phase budgets (for Genesis simplified view)
  useEffect(() => {
    if (phaseBudgets.length > 0) {
      const costs: Record<string, number> = {};
      phaseBudgets.forEach(pb => {
        costs[pb.phaseId] = pb.total;
      });
      setSimpleCosts(costs);
    }
  }, [phaseBudgets]);

  const fetchBudgetData = async () => {
    setBudgetLoading(true);
    try {
      const budgetDataPromises = sortedPhases.map(async (phase) => {
        const items = await PhaseBudgetService.getBudgetItemsByPhase(phase.id);
        const totals = PhaseBudgetService.calculateTotals(items);
        return {
          phaseId: phase.id,
          phaseName: phase.name,
          total: totals.total,
          items
        };
      });
      
      const budgetData = await Promise.all(budgetDataPromises);
      setPhaseBudgets(budgetData);
      setTotalBudget(budgetData.reduce((sum, p) => sum + p.total, 0));
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setBudgetLoading(false);
    }
  };

  const loadBudgetItemsForPhase = async (phaseId: string) => {
    try {
      const items = await PhaseBudgetService.getBudgetItemsByPhase(phaseId);
      setBudgetItems(items);
    } catch (error) {
      console.error('Error loading budget items:', error);
    }
  };

  // Budget CRUD handlers
  const handleAddBudgetItem = async (category: 'fixed' | 'variable' | 'other', itemName: string, cost: number) => {
    if (!expandedPhaseId) return;
    
    setBudgetLoading(true);
    try {
      await PhaseBudgetService.createBudgetItem({
        phase_id: expandedPhaseId,
        category,
        item_name: itemName,
        cost,
        currency: 'USD'
      });
      
      await loadBudgetItemsForPhase(expandedPhaseId);
      await fetchBudgetData();
      toast.success('Budget item added');
    } catch (error) {
      console.error('Error adding budget item:', error);
      toast.error('Failed to add budget item');
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
      
      if (expandedPhaseId) {
        await loadBudgetItemsForPhase(expandedPhaseId);
      }
      await fetchBudgetData();
      toast.success('Budget item updated');
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
      if (expandedPhaseId) {
        await loadBudgetItemsForPhase(expandedPhaseId);
      }
      await fetchBudgetData();
      toast.success('Budget item deleted');
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Failed to delete budget item');
    } finally {
      setBudgetLoading(false);
    }
  };

  // Handler for simplified Genesis budget (single cost per phase)
  const handleSimpleCostChange = async (phaseId: string, cost: number) => {
    setSimpleCosts(prev => ({ ...prev, [phaseId]: cost }));

    // Update the total budget immediately for UI
    const newTotal = Object.entries({ ...simpleCosts, [phaseId]: cost })
      .reduce((sum, [_, val]) => sum + (val || 0), 0);
    setTotalBudget(newTotal);
  };

  const handleSimpleCostSave = async (phaseId: string) => {
    const cost = simpleCosts[phaseId] || 0;

    try {
      // Get existing items for this phase
      const existingItems = await PhaseBudgetService.getBudgetItemsByPhase(phaseId);

      // Find or create a single "Phase Cost" item
      const existingCostItem = existingItems.find(item => item.item_name === 'Phase Cost');

      if (existingCostItem) {
        await PhaseBudgetService.updateBudgetItem(existingCostItem.id, {
          cost
        });
      } else if (cost > 0) {
        await PhaseBudgetService.createBudgetItem({
          phase_id: phaseId,
          category: 'other',
          item_name: 'Phase Cost',
          cost,
          currency: 'USD'
        });
      }

      toast.success(lang('common.saved'));
    } catch (error) {
      console.error('Error saving phase cost:', error);
      toast.error(lang('common.error'));
    }
  };

  const handlePhaseDateChange = async (phaseId: string, type: 'start' | 'end', dateString: string) => {
    const date = dateString ? new Date(dateString) : undefined;
    if (type === 'start' && onPhaseStartDateChange) {
      await onPhaseStartDateChange(phaseId, date);
    } else if (type === 'end' && onPhaseEndDateChange) {
      await onPhaseEndDateChange(phaseId, date);
    }
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate phase duration and grouped items for expanded phase
  const getPhaseData = (phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId);
    const phaseDurationDays = phase?.start_date && phase?.end_date
      ? Math.ceil((new Date(phase.end_date).getTime() - new Date(phase.start_date).getTime()) / (1000 * 60 * 60 * 24))
      : undefined;
    
    const groupedItems = PhaseBudgetService.groupByCategory(budgetItems);
    const totals = PhaseBudgetService.calculateTotals(budgetItems, phaseDurationDays);
    
    return { phaseDurationDays, groupedItems, totals };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {lang('productMilestones.setDatesDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {lang('productMilestones.setDatesDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            {/* <TabsTrigger value="project-dates" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {lang('productMilestones.setDatesDialog.tabs.projectDates')}
            </TabsTrigger> */}
            <TabsTrigger value="timeline-overview" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {lang('productMilestones.setDatesDialog.tabs.timelineOverview')}
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {lang('productMilestones.setDatesDialog.tabs.budget') || 'Budget'}
            </TabsTrigger>
          </TabsList>

          {/* Project Dates Tab */}
          <TabsContent value="project-dates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{lang('productMilestones.setDatesDialog.projectDates.projectStartDate')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={projectStartDate ? projectStartDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                      onProjectStartDateChange(dateValue);
                    }}
                    className="w-full border border-foreground/15 rounded-md p-2 bg-background"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="radio"
                    id="forward-planning"
                    name="timeline-mode"
                    className="h-3 w-3"
                    checked={timelineMode === 'forward'}
                    onChange={() => onTimelineModeChange('forward')}
                  />
                  <label htmlFor="forward-planning" className="text-xs text-muted-foreground cursor-pointer">
                    {lang('productMilestones.setDatesDialog.projectDates.planForward')}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{lang('productMilestones.setDatesDialog.projectDates.designFreezeDate')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={designFreezeDate ? new Date(designFreezeDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                      onDesignFreezeDateChange(dateValue);
                    }}
                    className="w-full border border-foreground/15 rounded-md p-2 bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang('productMilestones.setDatesDialog.projectDates.designFreezeMilestone')}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{lang('productMilestones.setDatesDialog.projectDates.projectedLaunchDate')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={projectedLaunchDate ? new Date(projectedLaunchDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value ? new Date(e.target.value) : undefined;
                      onProjectedLaunchDateChange(dateValue);
                    }}
                    className="w-full border border-foreground/15 rounded-md p-2 bg-background"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="radio"
                    id="backward-planning"
                    name="timeline-mode"
                    className="h-3 w-3"
                    checked={timelineMode === 'backward'}
                    onChange={() => onTimelineModeChange('backward')}
                  />
                  <label htmlFor="backward-planning" className="text-xs text-muted-foreground cursor-pointer">
                    {lang('productMilestones.setDatesDialog.projectDates.planBackward')}
                  </label>
                </div>
                {projectStartDate && projectedLaunchDate && new Date(projectedLaunchDate) < projectStartDate &&
                  <p className="text-xs text-destructive">{lang('productMilestones.setDatesDialog.projectDates.mustBeAfterStart')}</p>
                }
              </div>
            </div>
          </TabsContent>

          {/* Timeline Overview Tab - Now Editable */}
          <TabsContent value="timeline-overview" className="space-y-4">
            {sortedPhases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{lang('productMilestones.setDatesDialog.timelineOverview.noPhasesConfigured')}</p>
                <p className="text-sm">{lang('productMilestones.setDatesDialog.timelineOverview.configurePhasesFirst')}</p>
              </div>
            ) : (
              <>
                {/* Visual Timeline Stepper */}
                <div className="relative py-4">
                  <div className="flex items-center justify-between">
                    {sortedPhases.map((phase, index) => (
                      <div key={phase.id} className="flex flex-col items-center flex-1">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-background",
                          phase.status?.toLowerCase() === 'completed' && "border-emerald-500 bg-emerald-50",
                          phase.is_current_phase && "border-primary bg-primary/10",
                          phase.status?.toLowerCase() === 'in progress' && !phase.is_current_phase && "border-amber-500 bg-amber-50",
                          !phase.status || phase.status?.toLowerCase() === 'not started' && "border-muted-foreground/30"
                        )}>
                          {getStatusIcon(phase.status, phase.is_current_phase)}
                        </div>
                        {index < sortedPhases.length - 1 && (
                          <div className={cn(
                            "absolute h-0.5 top-8 left-0 right-0 -z-10",
                            phase.status?.toLowerCase() === 'completed' ? "bg-emerald-300" : "bg-muted"
                          )} style={{ 
                            left: `${(index / sortedPhases.length) * 100 + 8}%`,
                            width: `${100 / sortedPhases.length - 8}%`
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase Details Cards - Editable */}
                <div className="grid gap-3">
                  {sortedPhases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        phase.is_current_phase && "border-primary bg-primary/5",
                        phase.status?.toLowerCase() === 'completed' && "border-emerald-200 bg-emerald-50/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        {getStatusIcon(phase.status, phase.is_current_phase)}
                        <span className="font-medium">{phase.name}</span>
                        {getStatusBadge(phase.status, phase.is_current_phase, lang)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={cn(
                          "rounded-md p-0.5",
                          phase.start_date ? "bg-emerald-500" : "bg-amber-400"
                        )}>
                          <input
                            type="date"
                            value={formatDateForInput(phase.start_date)}
                            onChange={(e) => handlePhaseDateChange(phase.id, 'start', e.target.value)}
                            className="border-0 rounded px-2 py-1 bg-background text-sm w-36"
                            title={lang('productMilestones.setDatesDialog.timelineOverview.startDate')}
                          />
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className={cn(
                          "rounded-md p-0.5",
                          phase.end_date ? "bg-emerald-500" : "bg-amber-400"
                        )}>
                          <input
                            type="date"
                            value={formatDateForInput(phase.end_date)}
                            onChange={(e) => handlePhaseDateChange(phase.id, 'end', e.target.value)}
                            className="border-0 rounded px-2 py-1 bg-background text-sm w-36"
                            title={lang('productMilestones.setDatesDialog.timelineOverview.endDate')}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </>
            )}
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              {lang('productMilestones.setDatesDialog.budget.description') || 'Click on a phase to set or edit its budget.'}
            </p>

            {budgetLoading && !expandedPhaseId ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading budget data...</span>
              </div>
            ) : sortedPhases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{lang('productMilestones.setDatesDialog.timelineOverview.noPhasesConfigured')}</p>
              </div>
            ) : isGenesis ? (
              /* Simplified Budget View for Genesis */
              <>
                {/* Upsell Banner */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      {lang('productMilestones.setDatesDialog.budget.advancedCostPlanUpsell')}
                    </span>
                  </div>
                </div>

                {/* Total Budget Summary */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {lang('productMilestones.setDatesDialog.budget.totalBudget') || 'Total Project Budget'}
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalBudget)}
                    </span>
                  </div>
                </div>

                {/* Simplified Phase Cost List */}
                <div className="grid gap-2">
                  {sortedPhases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        phase.is_current_phase && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <span className="font-medium">{phase.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">
                          {lang('productMilestones.setDatesDialog.budget.cost')}
                        </Label>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            {currencySymbol}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            value={simpleCosts[phase.id] || ''}
                            onChange={(e) => handleSimpleCostChange(phase.id, parseFloat(e.target.value) || 0)}
                            onBlur={() => handleSimpleCostSave(phase.id)}
                            className="pl-7 h-8 text-right"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Full Budget View for non-Genesis */
              <>
                {/* Total Budget Summary */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {lang('productMilestones.setDatesDialog.budget.totalBudget') || 'Total Project Budget'}
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalBudget)}
                    </span>
                  </div>
                </div>

                {/* Phase Budget List with Expandable Editing */}
                <div className="grid gap-2">
                  {sortedPhases.map((phase, index) => {
                    const budgetData = phaseBudgets.find(b => b.phaseId === phase.id);
                    const phaseBudget = budgetData?.total || 0;
                    const isExpanded = expandedPhaseId === phase.id;
                    const { phaseDurationDays, groupedItems, totals } = isExpanded ? getPhaseData(phase.id) : { phaseDurationDays: undefined, groupedItems: { fixed: [], variable: [], other: [] }, totals: { fixed: 0, variable: 0, other: 0, actualFixed: 0, actualVariable: 0, actualOther: 0, total: 0, actualTotal: 0, variableDaily: 0 } };

                    return (
                      <div key={phase.id} className="border rounded-lg overflow-hidden">
                        {/* Phase Header - Clickable */}
                        <div
                          className={cn(
                            "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                            phase.is_current_phase && "bg-primary/5",
                            isExpanded && "border-b"
                          )}
                          onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            <span className="font-medium">{phase.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold",
                              phaseBudget > 0 ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {formatCurrency(phaseBudget)}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Budget Editor */}
                        {isExpanded && (
                          <div className="p-4 bg-muted/30 space-y-4">
                            <BudgetSection
                              category="fixed"
                              items={groupedItems.fixed}
                              subTotal={totals.fixed}
                              actualSubTotal={totals.actualFixed}
                              onAddItem={handleAddBudgetItem}
                              onUpdateItem={handleUpdateBudgetItem}
                              onDeleteItem={handleDeleteBudgetItem}
                              isLoading={budgetLoading}
                              companyId={companyId || ''}
                              productId={productId}
                              isLocked={true}
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
                              companyId={companyId || ''}
                              productId={productId}
                              isLocked={true}
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
                              companyId={companyId || ''}
                              productId={productId}
                            />

                            {/* Phase Total */}
                            <div className="pt-3 border-t flex justify-between items-center">
                              <span className="text-sm font-medium text-muted-foreground">Phase Total</span>
                              <span className="font-bold">{formatCurrency(totals.total)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
        </div>

        {/* Dialog Footer — Confirm Timeline */}
        {onConfirmTimeline && (
          <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t gap-4">
            <p className="text-xs text-muted-foreground">
              Dates are auto-generated based on your device lifecycle phases. Review and adjust if needed, then confirm.
            </p>
            {timelineConfirmed ? (
              <div className="flex items-center gap-2 text-emerald-600 flex-shrink-0">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Timeline Confirmed</span>
              </div>
            ) : (
              <Button
                onClick={async () => {
                  setIsConfirming(true);
                  try {
                    await onConfirmTimeline();
                    toast.success('Timeline confirmed');
                  } catch (error) {
                    console.error('Error confirming timeline:', error);
                    toast.error('Failed to confirm timeline');
                  } finally {
                    setIsConfirming(false);
                  }
                }}
                disabled={isConfirming || !sortedPhases.every(p => p.start_date && p.end_date)}
                className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
              >
                {isConfirming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Confirm Timeline
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
