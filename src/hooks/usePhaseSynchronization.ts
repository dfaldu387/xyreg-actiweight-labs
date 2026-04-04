
import { useEffect, useCallback } from 'react';
import { queryClient } from '@/lib/query-client';
import { toast } from 'sonner';

interface UsePhaseSynchronizationOptions {
  productId: string;
  onPhaseChange?: (newPhase: string) => void;
  enableLogging?: boolean;
}

export function usePhaseSynchronization({
  productId,
  onPhaseChange,
  enableLogging = false
}: UsePhaseSynchronizationOptions) {
  
  const invalidatePhaseRelatedQueries = useCallback(async () => {
    if (!productId) return;
    
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['productDetails', productId] }),
      queryClient.invalidateQueries({ queryKey: ['companyProductPhases'] }),
      queryClient.invalidateQueries({ queryKey: ['phases', productId] }),
      queryClient.invalidateQueries({ queryKey: ['documents', productId] })
    ]);
  }, [productId, enableLogging]);

  const triggerPhaseSync = useCallback(async (newPhase?: string) => {
    await invalidatePhaseRelatedQueries();
    
    if (newPhase && onPhaseChange) {
      onPhaseChange(newPhase);
    }
    
    if (enableLogging) {
      toast.success('Phase data synchronized');
    }
  }, [invalidatePhaseRelatedQueries, onPhaseChange, enableLogging]);

  // Listen for phase change events across the application
  useEffect(() => {
    const handlePhaseChange = (event: CustomEvent<{ productId: string; newPhase: string }>) => {
      if (event.detail.productId === productId) {
        triggerPhaseSync(event.detail.newPhase);
      }
    };

    window.addEventListener('productPhaseChanged' as any, handlePhaseChange);
    
    return () => {
      window.removeEventListener('productPhaseChanged' as any, handlePhaseChange);
    };
  }, [productId, triggerPhaseSync, enableLogging]);

  return {
    invalidatePhaseRelatedQueries,
    triggerPhaseSync
  };
}
