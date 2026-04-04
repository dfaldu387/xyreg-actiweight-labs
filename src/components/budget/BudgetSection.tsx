import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhaseBudgetItem } from '@/services/phaseBudgetService';
import { BudgetItemForm } from './BudgetItemForm';
import { BudgetItemList } from './BudgetItemList';
import { Plus, Settings, Lock } from 'lucide-react';

interface BudgetSectionProps {
  category: 'fixed' | 'variable' | 'other';
  items: PhaseBudgetItem[];
  subTotal: number;
  actualSubTotal: number;
  dailyTotal?: number; // For variable costs daily rate
  phaseDurationDays?: number; // To show duration context
  onAddItem: (category: 'fixed' | 'variable' | 'other', itemName: string, cost: number) => void;
  onUpdateItem: (itemId: string, itemName: string, cost: number, actualCost?: number | null) => void;
  onDeleteItem: (itemId: string) => void;
  isLoading?: boolean;
  companyId: string;
  productId?: string;
  onBulkOperations?: () => void; // New prop for bulk operations
  isLocked?: boolean; // Lock the section with upgrade notice
}

export function BudgetSection({
  category,
  items,
  subTotal,
  actualSubTotal,
  dailyTotal,
  phaseDurationDays,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  isLoading = false,
  companyId,
  productId,
  onBulkOperations,
  isLocked = false
}: BudgetSectionProps) {
  const [showForm, setShowForm] = useState(false);

  const categoryLabels = {
    fixed: 'Fixed Costs',
    variable: 'Variable Costs (per day)',
    other: 'Other Costs'
  };

  const categoryDescriptions = {
    fixed: 'One-time costs that don\'t vary with project duration',
    variable: 'Recurring costs that scale with project duration',
    other: 'Miscellaneous costs not fitting other categories'
  };

  const handleAddItem = (itemName: string, cost: number) => {
    onAddItem(category, itemName, cost);
    setShowForm(false);
  };

  // Locked overlay for fixed and variable costs
  if (isLocked && (category === 'fixed' || category === 'variable')) {
    return (
      <div className="relative">
        <div className="space-y-3 opacity-40 pointer-events-none select-none">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">{categoryLabels[category]}</h4>
              <p className="text-xs text-muted-foreground">{categoryDescriptions[category]}</p>
            </div>
          </div>
          <div className="h-16 bg-muted/50 rounded-md" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/95 border border-amber-300 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Lock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{categoryLabels[category]} Locked</p>
              <p className="text-xs text-muted-foreground">
                <a href="/app/settings/subscription" className="text-primary hover:underline">Upgrade your plan</a> to unlock this feature
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">{categoryLabels[category]}</h4>
          <p className="text-xs text-muted-foreground">{categoryDescriptions[category]}</p>
          {category === 'variable' && phaseDurationDays && (
            <p className="text-xs text-muted-foreground mt-1">
              Duration: {phaseDurationDays} days
              {dailyTotal !== undefined && ` • Daily rate: $${dailyTotal.toLocaleString()}`}
            </p>
          )}
        </div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={isLoading}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Item
          </Button>
        )}
      </div>

      {showForm && (
        <BudgetItemForm
          category={category}
          onSubmit={handleAddItem}
          onCancel={() => setShowForm(false)}
          isSubmitting={isLoading}
          productId={productId}
        />
      )}

      <BudgetItemList
        items={items}
        onUpdate={onUpdateItem}
        onDelete={onDeleteItem}
        subTotal={subTotal}
        actualSubTotal={actualSubTotal}
        categoryLabel={categoryLabels[category]}
        isUpdating={isLoading}
        showDailyRates={category === 'variable'}
        phaseDurationDays={phaseDurationDays}
        companyId={companyId}
      />
    </div>
  );
}