import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, X, ChevronDown } from 'lucide-react';
import { PhaseBudgetService } from '@/services/phaseBudgetService';

interface BudgetItemFormProps {
  category: 'fixed' | 'variable' | 'other';
  onSubmit: (itemName: string, cost: number) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  productId?: string;
}

export function BudgetItemForm({ category, onSubmit, onCancel, isSubmitting = false, productId }: BudgetItemFormProps) {
  const [itemName, setItemName] = useState('');
  const [cost, setCost] = useState('');
  const [previousItems, setPreviousItems] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (productId) {
      const fetchPreviousItems = async () => {
        try {
          const items = await PhaseBudgetService.getPreviouslyUsedItems(productId, category);
          setPreviousItems(items);
        } catch {
          // Failed to fetch previous items
        }
      };
      fetchPreviousItems();
    }
  }, [productId, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim() || !cost.trim()) {
      return;
    }

    const costNumber = parseFloat(cost);
    if (isNaN(costNumber) || costNumber < 0) {
      return;
    }

    onSubmit(itemName.trim(), costNumber);
    setItemName('');
    setCost('');
  };

  const categoryLabels = {
    fixed: 'Fixed Cost',
    variable: 'Variable Cost (per day)',
    other: 'Other Cost'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Add {categoryLabels[category]}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="item-name" className="text-xs">Item Name</Label>
          <div className="relative">
            <Input
              id="item-name"
              type="text"
              placeholder="Enter item name or select from dropdown"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="h-8 text-sm pr-8"
              required
            />
            {previousItems.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            )}
            {showDropdown && previousItems.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                {previousItems.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setItemName(item);
                      setShowDropdown(false);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="cost" className="text-xs">Cost (USD)</Label>
          <Input
            id="cost"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="h-8 text-sm"
            required
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="submit" 
          size="sm" 
          className="h-7 px-3 text-xs"
          disabled={isSubmitting || !itemName.trim() || !cost.trim()}
        >
          <PlusCircle className="h-3 w-3 mr-1" />
          Add Item
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onCancel}
          className="h-7 px-3 text-xs"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}