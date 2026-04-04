import React, { useState, useEffect, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { PhaseBudgetService, PhaseBudgetItem } from '@/services/phaseBudgetService';
import { useTemplateSettings } from '@/hooks/useTemplateSettings';
import { getCurrencySymbol } from '@/utils/currencyUtils';

interface PhaseBudgetDisplayProps {
  phaseId: string;
  phaseDuration?: number; // Duration in days for variable cost calculation
  size?: 'sm' | 'md';
  companyId: string;
  refreshTrigger?: number; // Optional trigger to force refresh
}

export const PhaseBudgetDisplay = memo(function PhaseBudgetDisplay({ phaseId, phaseDuration, size = 'sm', companyId, refreshTrigger }: PhaseBudgetDisplayProps) {
  const [budgetItems, setBudgetItems] = useState<PhaseBudgetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { settings } = useTemplateSettings(companyId);

  useEffect(() => {
    const fetchBudgetItems = async () => {
      if (!phaseId) {
        return;
      }
      
      setLoading(true);
      try {
        const items = await PhaseBudgetService.getBudgetItemsByPhase(phaseId);
        setBudgetItems(items);
      } catch {
        // Error fetching budget items
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetItems();
  }, [phaseId, refreshTrigger]);

  const defaultCurrency = settings.default_currency || 'USD';
  const currencySymbol = getCurrencySymbol(defaultCurrency);

  if (loading) {
    return (
      <Badge variant="outline" className={`${size === 'sm' ? 'text-xs' : 'text-sm'} animate-pulse`}>
        <span className="mr-1 font-medium">{currencySymbol}</span>
        Loading...
      </Badge>
    );
  }

  if (budgetItems.length === 0) {
    return (
      <Badge variant="outline" className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        <span className="mr-1 font-medium">{currencySymbol}</span>
        No budget
      </Badge>
    );
  }

  const totals = PhaseBudgetService.calculateTotals(budgetItems, phaseDuration, true);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: defaultCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasActualCosts = totals.actualTotal > 0;
  
  // Check if we have timeline-specific information
  const hasTimelineInfo = budgetItems.some(item => 
    item.timing_type !== 'both' || item.post_launch_cost !== null
  );

  // Show timeline breakdown if available
  if (hasTimelineInfo && (totals.preLaunchTotal > 0 || totals.postLaunchTotal > 0)) {
    return (
      <div className="flex gap-1 flex-wrap">
        {totals.preLaunchTotal > 0 && (
          <Badge variant="secondary" className={size === 'sm' ? 'text-xs' : 'text-sm'}>
            Pre: {formatCurrency(totals.preLaunchTotal)}
          </Badge>
        )}
        {totals.postLaunchTotal > 0 && (
          <Badge variant="outline" className={size === 'sm' ? 'text-xs' : 'text-sm'}>
            Post: {formatCurrency(totals.postLaunchTotal)}
          </Badge>
        )}
        {hasActualCosts && (
          <Badge 
            variant={totals.actualTotal > totals.total ? "destructive" : "default"}
            className={size === 'sm' ? 'text-xs' : 'text-sm'}
          >
            Actual: {formatCurrency(totals.actualTotal)}
          </Badge>
        )}
      </div>
    );
  }

  // Standard budget display
  return (
    <div className="flex gap-2">
      <Badge variant="outline" className={`${size === 'sm' ? 'text-xs' : 'text-sm'} bg-blue-50 text-blue-700 border-blue-200`}>
        <span className="mr-1 font-medium">{currencySymbol}</span>
        Budget: {formatCurrency(totals.total)}
      </Badge>
      
      {hasActualCosts && (
        <Badge 
          variant="outline" 
          className={`${size === 'sm' ? 'text-xs' : 'text-sm'} ${
            totals.actualTotal > totals.total 
              ? 'text-red-600 bg-red-50 border-red-200' 
              : 'text-green-600 bg-green-50 border-green-200'
          }`}
        >
          <span className="mr-1 font-medium">{currencySymbol}</span>
          Actual: {formatCurrency(totals.actualTotal)}
        </Badge>
      )}
    </div>
  );
});