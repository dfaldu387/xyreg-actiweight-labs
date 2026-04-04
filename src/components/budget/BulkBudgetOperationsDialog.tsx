import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BulkBudgetService,
  BudgetItemTemplate,
  PhaseBudgetSummary,
  BulkBudgetUpdateData
} from '@/services/bulkBudgetService';
import { useBulkOperationProgress } from '@/hooks/useBulkOperationProgress';
import { BulkOperationStatusTracker } from '@/components/settings/bulk/BulkOperationStatusTracker';
import { toast } from 'sonner';
import { Plus, Save, X, Copy } from 'lucide-react';
import { useTemplateSettings } from '@/hooks/useTemplateSettings';
import { useTranslation } from '@/hooks/useTranslation';

interface BulkBudgetOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  companyId: string;
  onComplete?: () => void;
}

interface BulkEditItem {
  phase_id: string;
  item_name: string;
  category: 'fixed' | 'variable' | 'other';
  cost: string;
  actual_cost: string;
  isNew?: boolean;
}

export function BulkBudgetOperationsDialog({
  isOpen,
  onClose,
  productId,
  companyId,
  onComplete
}: BulkBudgetOperationsDialogProps) {
  const { lang } = useTranslation();
  const [templates, setTemplates] = useState<BudgetItemTemplate[]>([]);
  const [phaseSummaries, setPhaseSummaries] = useState<PhaseBudgetSummary[]>([]);
  const [phases, setPhases] = useState<Array<{ id: string; name: string }>>([]);
  const [bulkEditItems, setBulkEditItems] = useState<BulkEditItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'fixed' | 'variable' | 'other'>('fixed');
  const [newItemCost, setNewItemCost] = useState('');
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [templateCosts, setTemplateCosts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { settings } = useTemplateSettings(companyId);
  const { progress, startOperation, updateProgress, completeOperation, reset } = useBulkOperationProgress();

  const defaultCurrency = settings.default_currency || 'USD';

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      reset();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [templatesData, summariesData, phasesData] = await Promise.all([
        BulkBudgetService.getBudgetItemTemplates(productId),
        BulkBudgetService.getAllBudgetItemsForProduct(productId),
        BulkBudgetService.getProductPhases(productId)
      ]);

      setTemplates(templatesData);
      setPhaseSummaries(summariesData);
      setPhases(phasesData);
      
      // Initialize bulk edit items from existing data
      const editItems: BulkEditItem[] = [];
      summariesData.forEach(summary => {
        summary.items.forEach(item => {
          editItems.push({
            phase_id: summary.phase_id,
            item_name: item.item_name,
            category: item.category,
            cost: item.cost.toString(),
            actual_cost: item.actual_cost?.toString() || '',
            isNew: false
          });
        });
      });
      setBulkEditItems(editItems);
      
      // Initialize template costs
      const templateCostMap: Record<string, string> = {};
      templatesData.forEach(template => {
        const key = `${template.item_name}-${template.category}`;
        templateCostMap[key] = template.sample_cost?.toString() || '0';
      });
      setTemplateCosts(templateCostMap);
      
    } catch {
      toast.error(lang('bulkBudget.errors.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTemplateToPhases = (template: BudgetItemTemplate) => {
    if (selectedPhases.length === 0) {
      toast.error(lang('bulkBudget.errors.selectPhasesFirst'));
      return;
    }

    const templateKey = `${template.item_name}-${template.category}`;
    const cost = templateCosts[templateKey] || template.sample_cost?.toString() || '0';

    const newItems: BulkEditItem[] = [];
    selectedPhases.forEach(phaseId => {
      // Check if item already exists in this phase
      const exists = bulkEditItems.some(item => 
        item.phase_id === phaseId && 
        item.item_name === template.item_name && 
        item.category === template.category
      );

      if (!exists) {
        newItems.push({
          phase_id: phaseId,
          item_name: template.item_name,
          category: template.category,
          cost: cost,
          actual_cost: '',
          isNew: true
        });
      }
    });

    setBulkEditItems(prev => [...prev, ...newItems]);
    toast.success(lang('bulkBudget.success.addedToPhases', { name: template.item_name, count: newItems.length }));
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim() || selectedPhases.length === 0 || !newItemCost.trim()) {
      toast.error(lang('bulkBudget.errors.enterItemDetails'));
      return;
    }

    const newItems: BulkEditItem[] = selectedPhases.map(phaseId => ({
      phase_id: phaseId,
      item_name: newItemName.trim(),
      category: newItemCategory,
      cost: newItemCost,
      actual_cost: '',
      isNew: true
    }));

    setBulkEditItems(prev => [...prev, ...newItems]);
    setNewItemName('');
    setNewItemCost('');
    toast.success(lang('bulkBudget.success.addedToPhases', { name: newItemName, count: selectedPhases.length }));
  };

  const handleUpdateTemplateCost = (template: BudgetItemTemplate, newCost: string) => {
    const templateKey = `${template.item_name}-${template.category}`;
    setTemplateCosts(prev => ({
      ...prev,
      [templateKey]: newCost
    }));
  };

  const handleUpdateBulkItem = (index: number, field: 'cost' | 'actual_cost', value: string) => {
    setBulkEditItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveBulkItem = (index: number) => {
    setBulkEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    const validItems = bulkEditItems.filter(item => {
      const cost = parseFloat(item.cost);
      return !isNaN(cost) && cost >= 0 && item.item_name.trim();
    });

    if (validItems.length === 0) {
      toast.error(lang('bulkBudget.errors.noValidItems'));
      return;
    }

    startOperation(validItems.length);

    try {
      const updates: BulkBudgetUpdateData[] = validItems.map(item => ({
        phase_id: item.phase_id,
        item_name: item.item_name,
        category: item.category,
        cost: parseFloat(item.cost),
        actual_cost: item.actual_cost ? parseFloat(item.actual_cost) : null
      }));

      // Process in batches to show progress
      const batchSize = 10;
      let completed = 0;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        updateProgress({
          currentItem: lang('bulkBudget.progress.savingBatch', { batch: Math.floor(i / batchSize) + 1 }),
          completed: completed
        });

        await BulkBudgetService.bulkUpdateBudgetItems(batch);
        
        completed += batch.length;
        updateProgress({
          completed,
          succeeded: completed
        });
      }

      completeOperation();
      toast.success(lang('bulkBudget.success.updatedItems', { count: validItems.length }));
      
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 1500);

    } catch {
      updateProgress({
        failed: progress.failed + 1,
        errors: [...progress.errors, lang('bulkBudget.errors.failedToSave')]
      });
      toast.error(lang('bulkBudget.errors.failedToSave'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: defaultCurrency,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fixed': return 'bg-blue-100 text-blue-800';
      case 'variable': return 'bg-green-100 text-green-800';
      case 'other': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group bulk edit items by phase
  const itemsByPhase = phases.map(phase => ({
    ...phase,
    items: bulkEditItems.filter(item => item.phase_id === phase.id)
  }));

  if (progress.isRunning) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lang('bulkBudget.title')}</DialogTitle>
          </DialogHeader>
          <BulkOperationStatusTracker
            progress={progress}
            operationType={lang('bulkBudget.operation.type')}
            operationDetails={lang('bulkBudget.operation.details')}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{lang('bulkBudget.title')}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{lang('bulkBudget.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="templates">{lang('bulkBudget.tabs.templates')}</TabsTrigger>
            <TabsTrigger value="edit">{lang('bulkBudget.tabs.bulkEdit')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">{lang('bulkBudget.overview.loading')}</div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {phaseSummaries.map(summary => (
                    <Card key={summary.phase_id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{summary.phase_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="grid grid-cols-3 gap-4 text-sm flex-1">
                            <div>
                              <span className="font-medium">{lang('bulkBudget.categories.fixed')}:</span> {formatCurrency(summary.fixed_total)}
                              {summary.actual_fixed_total > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {lang('bulkBudget.labels.actual')}: {formatCurrency(summary.actual_fixed_total)}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">{lang('bulkBudget.categories.variable')}:</span> {formatCurrency(summary.variable_total)}
                              {summary.actual_variable_total > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {lang('bulkBudget.labels.actual')}: {formatCurrency(summary.actual_variable_total)}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">{lang('bulkBudget.categories.other')}:</span> {formatCurrency(summary.other_total)}
                              {summary.actual_other_total > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {lang('bulkBudget.labels.actual')}: {formatCurrency(summary.actual_other_total)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-6 text-right">
                            <div className="text-sm font-semibold">
                              {lang('bulkBudget.labels.total')}: {formatCurrency(summary.fixed_total + summary.variable_total + summary.other_total)}
                            </div>
                            {(summary.actual_fixed_total > 0 || summary.actual_variable_total > 0 || summary.actual_other_total > 0) && (
                              <div className="text-xs text-muted-foreground">
                                {lang('bulkBudget.labels.actual')}: {formatCurrency(summary.actual_fixed_total + summary.actual_variable_total + summary.actual_other_total)}
                              </div>
                            )}
                          </div>
                        </div>
                        {summary.items.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {lang('bulkBudget.overview.budgetItems', { count: summary.items.length })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>{lang('bulkBudget.templates.selectPhases')}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPhases(phases.map(p => p.id))}
                    disabled={selectedPhases.length === phases.length}
                  >
                    {lang('bulkBudget.templates.selectAllPhases')}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {phases.map(phase => (
                    <div key={phase.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={phase.id}
                        checked={selectedPhases.includes(phase.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPhases(prev => [...prev, phase.id]);
                          } else {
                            setSelectedPhases(prev => prev.filter(id => id !== phase.id));
                          }
                        }}
                      />
                      <Label htmlFor={phase.id} className="text-sm">{phase.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{lang('bulkBudget.templates.availableTemplates')}</Label>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {templates.map((template, index) => {
                      const templateKey = `${template.item_name}-${template.category}`;
                      const currentCost = templateCosts[templateKey] || template.sample_cost?.toString() || '0';
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{template.item_name}</span>
                              <Badge className={getCategoryColor(template.category)}>
                                {template.category}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {lang('bulkBudget.templates.usedInPhases', { count: template.phases.length })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end gap-1">
                              <Label className="text-xs">{lang('bulkBudget.labels.cost')} ({defaultCurrency})</Label>
                              <Input
                                type="number"
                                value={currentCost}
                                onChange={(e) => handleUpdateTemplateCost(template, e.target.value)}
                                className="w-24 h-8 text-sm"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddTemplateToPhases(template)}
                              disabled={selectedPhases.length === 0}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              {lang('bulkBudget.buttons.apply')}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{lang('bulkBudget.templates.addNewItem')}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={lang('bulkBudget.placeholders.itemName')}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder={lang('bulkBudget.placeholders.cost')}
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    className="w-24"
                    min="0"
                    step="0.01"
                  />
                  <Select value={newItemCategory} onValueChange={(value: any) => setNewItemCategory(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">{lang('bulkBudget.categories.fixed')}</SelectItem>
                      <SelectItem value="variable">{lang('bulkBudget.categories.variable')}</SelectItem>
                      <SelectItem value="other">{lang('bulkBudget.categories.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddNewItem}
                    disabled={!newItemName.trim() || !newItemCost.trim() || selectedPhases.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {lang('common.add')}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>{lang('bulkBudget.edit.title')}</Label>
              <Button onClick={handleSaveChanges} disabled={bulkEditItems.length === 0}>
                <Save className="h-4 w-4 mr-1" />
                {lang('bulkBudget.buttons.saveAllChanges')}
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-4">
                {itemsByPhase.map(phase => (
                  <Card key={phase.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{phase.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {phase.items.length === 0 ? (
                        <div className="text-sm text-muted-foreground italic">{lang('bulkBudget.edit.noItems')}</div>
                      ) : (
                        <div className="space-y-2">
                          {phase.items.map((item, itemIndex) => {
                            const globalIndex = bulkEditItems.findIndex(
                              bi => bi.phase_id === item.phase_id && 
                                   bi.item_name === item.item_name && 
                                   bi.category === item.category
                            );
                            
                            return (
                              <div key={`${item.phase_id}-${item.item_name}-${item.category}`} 
                                   className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                                <div className="col-span-3 flex items-center gap-2">
                                  <span className="text-sm font-medium">{item.item_name}</span>
                                  <Badge className={getCategoryColor(item.category)}>
                                    {item.category}
                                  </Badge>
                                  {item.isNew && <Badge variant="secondary">{lang('bulkBudget.badges.new')}</Badge>}
                                </div>
                                <div className="col-span-3">
                                  <Input
                                    type="number"
                                    placeholder={lang('bulkBudget.placeholders.budgetCost')}
                                    value={item.cost}
                                    onChange={(e) => handleUpdateBulkItem(globalIndex, 'cost', e.target.value)}
                                    className="h-8 text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Input
                                    type="number"
                                    placeholder={lang('bulkBudget.placeholders.actualCost')}
                                    value={item.actual_cost}
                                    onChange={(e) => handleUpdateBulkItem(globalIndex, 'actual_cost', e.target.value)}
                                    className="h-8 text-sm"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div className="col-span-3 flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveBulkItem(globalIndex)}
                                    className="h-6 w-6 p-0 text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Save All Changes Footer */}
        {bulkEditItems.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {lang('bulkBudget.footer.pendingChanges', { count: bulkEditItems.length })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {lang('common.cancel')}
              </Button>
              <Button onClick={handleSaveChanges} disabled={bulkEditItems.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                {lang('bulkBudget.buttons.saveAllChanges')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}