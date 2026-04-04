import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhaseBudgetItem } from '@/services/phaseBudgetService';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { useTemplateSettings } from '@/hooks/useTemplateSettings';
import { getCurrencySymbol } from '@/utils/currencyUtils';

interface BudgetItemListProps {
  items: PhaseBudgetItem[];
  onUpdate: (itemId: string, itemName: string, cost: number, actualCost?: number | null) => void;
  onDelete: (itemId: string) => void;
  subTotal: number;
  actualSubTotal: number;
  categoryLabel: string;
  isUpdating?: boolean;
  showDailyRates?: boolean;
  phaseDurationDays?: number;
  companyId: string;
}

export function BudgetItemList({ 
  items, 
  onUpdate, 
  onDelete, 
  subTotal, 
  actualSubTotal,
  categoryLabel,
  isUpdating = false,
  showDailyRates = false,
  phaseDurationDays,
  companyId
}: BudgetItemListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editActualCost, setEditActualCost] = useState('');
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [lastSavedValues, setLastSavedValues] = useState<Record<string, {name: string, cost: string, actualCost: string}>>({});
  const { settings } = useTemplateSettings(companyId);

  const startEditing = (item: PhaseBudgetItem) => {
    setEditingId(item.id);
    setEditName(item.item_name);
    setEditCost(item.cost.toString());
    setEditActualCost(item.actual_cost?.toString() || '');
    // Store the original values for comparison
    setLastSavedValues(prev => ({
      ...prev,
      [item.id]: {
        name: item.item_name,
        cost: item.cost.toString(),
        actualCost: item.actual_cost?.toString() || ''
      }
    }));
  };

  const stopEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditCost('');
    setEditActualCost('');
  };

  // Auto-save function with debouncing
  const autoSave = useCallback(async (itemId: string, name: string, cost: string, actualCost: string) => {
    if (!name.trim() || !cost.trim()) return;
    
    const costNumber = parseFloat(cost);
    if (isNaN(costNumber) || costNumber < 0) return;

    const actualCostNumber = actualCost.trim() ? parseFloat(actualCost) : null;
    if (actualCostNumber !== null && (isNaN(actualCostNumber) || actualCostNumber < 0)) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      await onUpdate(itemId, name.trim(), costNumber, actualCostNumber);
      // Update last saved values on successful save
      setLastSavedValues(prev => ({
        ...prev,
        [itemId]: { name: name.trim(), cost, actualCost }
      }));
    } catch {
      // Auto-save failed
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [onUpdate]);

  // Check if current values differ from last saved values
  const hasUnsavedChanges = editingId && lastSavedValues[editingId] && (
    editName !== lastSavedValues[editingId].name ||
    editCost !== lastSavedValues[editingId].cost ||
    editActualCost !== lastSavedValues[editingId].actualCost
  );

  // Debounced auto-save effect
  useEffect(() => {
    if (!editingId || !hasUnsavedChanges) return;

    const timeoutId = setTimeout(() => {
      autoSave(editingId, editName, editCost, editActualCost);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [editingId, editName, editCost, editActualCost, autoSave, hasUnsavedChanges]);

  const defaultCurrency = settings.default_currency || 'USD';
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: defaultCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No {categoryLabel.toLowerCase()} items added yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
        <div className="col-span-4">Item</div>
        <div className="col-span-3 text-center">Budget{showDailyRates ? ' (per day)' : ''}</div>
        <div className="col-span-3 text-center">Actual{showDailyRates ? ' (per day)' : ''}</div>
        <div className="col-span-2 text-center">Actions</div>
      </div>

      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded bg-background">
          {editingId === item.id ? (
            <>
              <div className="col-span-4">
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Item name"
                  className="h-7 text-sm"
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  placeholder="Budget cost"
                  min="0"
                  step="0.01"
                  className="h-7 text-sm"
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  value={editActualCost}
                  onChange={(e) => setEditActualCost(e.target.value)}
                  placeholder="Actual cost"
                  min="0"
                  step="0.01"
                  className="h-7 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div className="col-span-4">
                <span className="text-sm font-medium">{item.item_name}</span>
              </div>
              <div className="col-span-3 text-center">
                <span className="text-sm font-mono">
                  {formatCurrency(item.cost)}{showDailyRates ? '/day' : ''}
                </span>
                {showDailyRates && phaseDurationDays && (
                  <div className="text-xs text-muted-foreground">
                    Total: {formatCurrency(item.cost * phaseDurationDays)}
                  </div>
                )}
              </div>
              <div className="col-span-3 text-center">
                {item.actual_cost !== null && item.actual_cost !== undefined ? (
                  <>
                    <span className="text-sm font-mono">
                      {formatCurrency(item.actual_cost)}{showDailyRates ? '/day' : ''}
                    </span>
                    {showDailyRates && phaseDurationDays && (
                      <div className="text-xs text-muted-foreground">
                        Total: {formatCurrency(item.actual_cost * phaseDurationDays)}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Not set</span>
                )}
              </div>
            </>
          )}
          
          <div className="col-span-2 flex gap-1 justify-center">
            {editingId === item.id ? (
              <div className="flex items-center gap-1">
                {updatingItems.has(item.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                ) : hasUnsavedChanges ? (
                  <div className="h-2 w-2 rounded-full bg-yellow-500" title="Unsaved changes" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-green-500" title="Saved" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopEditing}
                  disabled={isUpdating}
                  className="h-6 w-6 p-0"
                  title="Stop editing"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(item)}
                  disabled={isUpdating}
                  className="h-6 w-6 p-0"
                  title="Edit item"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  disabled={isUpdating}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  title="Delete item"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
      
      <div className="border-t pt-2 mt-3 space-y-1">
        <div className="grid grid-cols-12 gap-2 text-sm font-medium">
          <div className="col-span-4">{categoryLabel} Sub-Total:</div>
          <div className="col-span-3 text-center font-mono">{formatCurrency(subTotal)}</div>
          <div className="col-span-3 text-center font-mono">{formatCurrency(actualSubTotal)}</div>
          <div className="col-span-2"></div>
        </div>
        {subTotal !== actualSubTotal && actualSubTotal > 0 && (
          <div className="grid grid-cols-12 gap-2 text-xs">
            <div className="col-span-4 text-muted-foreground">Variance:</div>
            <div className="col-span-3"></div>
            <div className={`col-span-3 text-center font-mono ${actualSubTotal > subTotal ? 'text-destructive' : 'text-green-600'}`}>
              {actualSubTotal > subTotal ? '+' : ''}{formatCurrency(actualSubTotal - subTotal)}
            </div>
            <div className="col-span-2"></div>
          </div>
        )}
      </div>
    </div>
  );
}