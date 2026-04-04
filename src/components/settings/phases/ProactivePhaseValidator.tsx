
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProactivePhaseValidatorProps {
  companyId: string;
  onIssuesDetected?: (count: number) => void;
  // Add prop to control whether auto-repair should run
  enableAutoRepair?: boolean;
}

interface PayloadData {
  id?: string;
  name?: string;
  product_id?: string;
  [key: string]: any;
}

export function ProactivePhaseValidator({ 
  companyId, 
  onIssuesDetected,
  enableAutoRepair = false // Default to false to prevent interference
}: ProactivePhaseValidatorProps) {
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Real-time monitoring of product phase changes
  useEffect(() => {
    if (!companyId || !isMonitoring) return;

    console.log(`[ProactiveValidator] Starting real-time monitoring for company: ${companyId} (auto-repair: ${enableAutoRepair})`);

    // Subscribe to product changes
    const productSubscription = supabase
      .channel('product-phase-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `company_id=eq.${companyId}`
        },
        async (payload) => {
          console.log('[ProactiveValidator] Product change detected:', payload);
          const newData = payload.new as PayloadData;
          
          // Only validate, don't auto-repair unless explicitly enabled
          if (enableAutoRepair) {
            await validateProductPhase(newData?.id, newData?.name);
          } else {
            console.log('[ProactiveValidator] Auto-repair disabled, skipping validation');
          }
        }
      )
      .subscribe();

    // REMOVED: lifecycle_phases subscription had no company filter and triggered for
    // ALL lifecycle_phases changes globally, causing continuous callbacks.
    // The products subscription above handles product changes for this company.

    // Subscribe to phase deletions - this one should always run for safety
    const phaseSubscription = supabase
      .channel('phase-deletions')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'phases',
          filter: `company_id=eq.${companyId}`
        },
        async (payload) => {
          console.log('[ProactiveValidator] Phase deletion detected:', payload);
          const oldData = payload.old as PayloadData;
          // Phase deletions should always trigger orphan checks
          await checkForOrphanedProducts(oldData?.id);
        }
      )
      .subscribe();

    return () => {
      console.log('[ProactiveValidator] Cleaning up subscriptions');
      supabase.removeChannel(productSubscription);
      supabase.removeChannel(phaseSubscription);
    };
  }, [companyId, isMonitoring, enableAutoRepair]);

  // Validate a specific product's phase assignment
  const validateProductPhase = async (productId?: string, productName?: string) => {
    if (!productId || !enableAutoRepair) return;

    try {
      console.log(`[ProactiveValidator] Validating product: ${productId}`);

      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, current_lifecycle_phase, company_id')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('[ProactiveValidator] Error fetching product:', productError);
        return;
      }

      // Get lifecycle phases for this product
      const { data: lifecyclePhases, error: lifecycleError } = await supabase
        .from('lifecycle_phases')
        .select('*')
        .eq('product_id', productId);

      if (lifecycleError) {
        console.error('[ProactiveValidator] Error fetching lifecycle phases:', lifecycleError);
        return;
      }

      const currentPhases = lifecyclePhases?.filter(lp => lp.is_current_phase) || [];
      const hasIssues = currentPhases.length !== 1 || !product.current_lifecycle_phase;

      if (hasIssues) {
        console.warn(`[ProactiveValidator] Issue detected for product ${product.name}:`, {
          currentPhaseCount: currentPhases.length,
          productPhase: product.current_lifecycle_phase
        });

        // Only report issues, don't auto-repair unless explicitly enabled
        if (onIssuesDetected) {
          onIssuesDetected(1);
        }
      }

    } catch (error) {
      console.error('[ProactiveValidator] Error during validation:', error);
    }
  };

  // Check for orphaned products after phase deletion
  const checkForOrphanedProducts = async (deletedPhaseId?: string) => {
    if (!deletedPhaseId) return;

    try {
      console.log(`[ProactiveValidator] Checking for orphaned products after phase deletion: ${deletedPhaseId}`);

      // Find products that might be orphaned
      const { data: orphanedProducts, error } = await supabase
        .from('lifecycle_phases')
        .select(`
          product_id,
          products!inner(name, company_id)
        `)
        .eq('phase_id', deletedPhaseId)
        .eq('products.company_id', companyId);

      if (error) {
        console.error('[ProactiveValidator] Error checking orphaned products:', error);
        return;
      }

      if (orphanedProducts && orphanedProducts.length > 0) {
        console.warn(`[ProactiveValidator] Found ${orphanedProducts.length} orphaned products`);
        
        // Only report the issue, don't auto-repair
        toast.warning(`Detected ${orphanedProducts.length} products with orphaned phase assignments. Please check your phase assignments.`);
        
        if (onIssuesDetected) {
          onIssuesDetected(orphanedProducts.length);
        }
      }

    } catch (error) {
      console.error('[ProactiveValidator] Error checking orphaned products:', error);
    }
  };

  // This component runs in the background and doesn't render anything visible
  return null;
}
