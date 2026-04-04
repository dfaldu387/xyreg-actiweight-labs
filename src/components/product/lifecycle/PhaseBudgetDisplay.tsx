import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTemplateSettings } from '@/hooks/useTemplateSettings';
import { getCurrencySymbol } from '@/utils/currencyUtils';

interface PhaseBudgetDisplayProps {
  phaseId: string;
  estimated_budget?: number;
  is_pre_launch?: boolean;
  cost_category?: 'development' | 'regulatory' | 'clinical' | 'operational';
  budget_currency?: string;
  onBudgetUpdate?: (phaseId: string, budgetData: {
    estimated_budget: number;
    is_pre_launch: boolean;
    cost_category: string;
    budget_currency: string;
  }) => void;
  isEditable?: boolean;
  companyId: string;
}

const COST_CATEGORIES = [
  { value: 'development', label: 'Development' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'operational', label: 'Operational' }
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF' },
  { value: 'CAD', label: 'CAD' }
];

export function PhaseBudgetDisplay({
  phaseId,
  estimated_budget = 0,
  is_pre_launch = true,
  cost_category = 'development',
  budget_currency,
  onBudgetUpdate,
  isEditable = true,
  companyId
}: PhaseBudgetDisplayProps) {
  const { settings } = useTemplateSettings(companyId);
  const defaultCurrency = settings.default_currency || 'USD';
  const effectiveCurrency = budget_currency || defaultCurrency;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    estimated_budget: estimated_budget || 0,
    is_pre_launch: is_pre_launch ?? true,
    cost_category: cost_category || 'development',
    budget_currency: effectiveCurrency
  });

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  };

  const handleSave = () => {
    if (onBudgetUpdate) {
      onBudgetUpdate(phaseId, formData);
      toast.success('Budget updated successfully');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      estimated_budget: estimated_budget || 0,
      is_pre_launch: is_pre_launch ?? true,
      cost_category: cost_category || 'development',
      budget_currency: effectiveCurrency
    });
    setIsEditing(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'development': return 'bg-blue-100 text-blue-800';
      case 'regulatory': return 'bg-green-100 text-green-800';
      case 'clinical': return 'bg-purple-100 text-purple-800';
      case 'operational': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Budget</span>
          </div>
          {isEditable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-sm font-semibold">
            {formatCurrency(estimated_budget, effectiveCurrency)}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={getCategoryColor(cost_category)}>
              {COST_CATEGORIES.find(c => c.value === cost_category)?.label}
            </Badge>
            
            {is_pre_launch && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800">
                Pre-launch
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Budget</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleSave}>
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancel}>
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`budget-${phaseId}`} className="text-xs">Amount</Label>
          <Input
            id={`budget-${phaseId}`}
            type="number"
            value={formData.estimated_budget}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              estimated_budget: Number(e.target.value) || 0 
            }))}
            className="h-8 text-xs"
            min="0"
            step="1000"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`currency-${phaseId}`} className="text-xs">Currency</Label>
          <Select
            value={formData.budget_currency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, budget_currency: value }))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(currency => (
                <SelectItem key={currency.value} value={currency.value} className="text-xs">
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor={`category-${phaseId}`} className="text-xs">Cost Category</Label>
          <Select
            value={formData.cost_category}
            onValueChange={(value: 'development' | 'regulatory' | 'clinical' | 'operational') => 
              setFormData(prev => ({ ...prev, cost_category: value }))
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COST_CATEGORIES.map(category => (
                <SelectItem key={category.value} value={category.value} className="text-xs">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor={`prelaunch-${phaseId}`} className="text-xs">Pre-launch phase</Label>
          <Switch
            id={`prelaunch-${phaseId}`}
            checked={formData.is_pre_launch}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_pre_launch: checked }))}
          />
        </div>
      </div>
    </div>
  );
}