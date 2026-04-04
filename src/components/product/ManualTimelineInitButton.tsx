import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ProductPhaseDependencyService } from '@/services/productPhaseDependencyService';

interface ManualTimelineInitButtonProps {
  productId: string;
  companyId?: string;
  onInitialized?: () => void;
}

export function ManualTimelineInitButton({ productId, companyId, onInitialized }: ManualTimelineInitButtonProps) {
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitializeTimeline = async () => {
    if (!productId) {
      toast.error('No product ID available');
      return;
    }

    if (!companyId) {
      toast.error('No company ID available');
      return;
    }

    setIsInitializing(true);
    try {
      // Use Full Replace logic - sync phases from company settings
      const { PhaseSynchronizationService } = await import('@/services/phaseSynchronizationService');

      // Full replace: Delete all existing phases and sync fresh from company
      const syncResult = await PhaseSynchronizationService.syncProductWithCompanyPhases(productId, companyId);

      if (!syncResult.success) {
        toast.error(`Failed to sync phases: ${syncResult.errors.join(', ')}`);
        return;
      }

      // Then, copy dependencies from active phases
      const depResult = await ProductPhaseDependencyService.initializeFromActiveCompanyPhases(
        productId,
        companyId,
        true // Replace existing dependencies
      );

      // Subtract 1 from count because "No Phase" is synced but filtered out from display
      const displayCount = Math.max(0, syncResult.syncedCount - 1);

      if (depResult.success) {
        toast.success(`Timeline initialized! Synced ${displayCount} phases and ${depResult.initializedCount || 0} dependencies from company settings.`);
        onInitialized?.();
      } else {
        // Phases synced but dependencies may have failed - still consider it a success
        toast.success(`Timeline initialized! Synced ${displayCount} phases from company settings.`);
        onInitialized?.();
      }
    } catch (error) {
      toast.error('Failed to initialize timeline');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleInitializeTimeline}
      disabled={isInitializing}
      className="flex items-center gap-2"
    >
      {isInitializing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      {isInitializing ? 'Initializing...' : 'Initialize Timeline'}
    </Button>
  );
}