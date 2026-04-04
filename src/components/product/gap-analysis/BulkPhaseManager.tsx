import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, AlertTriangle, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { GapAnalysisItem } from "@/types/client";
import { PhaseSelector } from "./PhaseSelector";
import { supabase } from "@/integrations/supabase/client";
import { calculatePhaseTime } from "@/services/gapAnalysisService";
import { useTranslation } from "@/hooks/useTranslation";

interface BulkPhaseManagerProps {
  items: GapAnalysisItem[];
  companyId?: string;
  onComplete?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BulkPhaseManager({ items, companyId, onComplete, open, onOpenChange }: BulkPhaseManagerProps) {
  const { lang } = useTranslation();
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = open ?? localOpen;
  const setIsOpen = onOpenChange ?? setLocalOpen;
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBulkUpdate = async () => {
    if (selectedPhases.length === 0) {
      toast.error(lang('bulkPhase.selectPhaseError'));
      return;
    }

    if (items.length === 0) {
      toast.error(lang('bulkPhase.noItemsError'));
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[BulkPhaseManager] Starting bulk update for", items.length, "items");
      
      // Get item IDs and product_ids
      const itemIds = items
        .map(item => item.id || item.clauseId)
        .filter((id): id is string => Boolean(id));

      if (itemIds.length === 0) {
        toast.error(lang('bulkPhase.noValidItemsError'));
        return;
      }

      // Fetch product_ids for all items
      const { data: itemsData, error: fetchError } = await supabase
        .from("gap_analysis_items")
        .select("id, product_id")
        .in("id", itemIds);

      if (fetchError) {
        console.error("[BulkPhaseManager] Error fetching items:", fetchError);
        toast.error(lang('bulkPhase.fetchFailed'));
        return;
      }

      // Group items by product_id for efficient phase_time calculation
      const itemsByProduct = new Map<string | null, string[]>();
      (itemsData || []).forEach(item => {
        const productId = item.product_id || null;
        if (!itemsByProduct.has(productId)) {
          itemsByProduct.set(productId, []);
        }
        itemsByProduct.get(productId)!.push(item.id);
      });

      console.log(`[BulkPhaseManager] Updating ${itemIds.length} items with phases:`, selectedPhases);

      // Calculate phase_time for each product group and update items
      const updatePromises = Array.from(itemsByProduct.entries()).map(async ([productId, itemIdsForProduct]) => {
        // Calculate phase_time
        const phaseTime = await calculatePhaseTime(productId, selectedPhases);

        // Update all items for this product with the same phase_time
        const { error: updateError } = await supabase
          .from("gap_analysis_items")
          .update({ 
            applicable_phases: selectedPhases,
            phase_time: phaseTime,
            updated_at: new Date().toISOString()
          })
          .in("id", itemIdsForProduct);

        if (updateError) {
          console.error(`[BulkPhaseManager] Update failed for product ${productId}:`, updateError);
          throw updateError;
        }

        return { productId, count: itemIdsForProduct.length };
      });

      // Wait for all updates to complete
      const results = await Promise.allSettled(updatePromises);
      
      // Analyze results
      const successful = results.filter(result => 
        result.status === 'fulfilled'
      );
      const failed = results.filter(result => 
        result.status === 'rejected'
      );

      console.log(`[BulkPhaseManager] Results - Successful: ${successful.length}, Failed: ${failed.length}`);

      if (failed.length > 0) {
        console.error("[BulkPhaseManager] Failed updates:", failed);
        failed.forEach((failure, index) => {
          if (failure.status === 'rejected') {
            console.error(`[BulkPhaseManager] Update ${index} rejected:`, failure.reason);
          }
        });
      }

      // Calculate total updated items from successful results
      const totalUpdated = successful.reduce((sum, result) => {
        if (result.status === 'fulfilled') {
          return sum + (result.value?.count || 0);
        }
        return sum;
      }, 0);

      if (successful.length === 0) {
        toast.error(lang('bulkPhase.updateAllFailed'));
        return;
      } else if (failed.length > 0) {
        toast.warning(lang('bulkPhase.partialSuccess', { updated: totalUpdated, failed: failed.length }));
      } else {
        toast.success(lang('bulkPhase.updateSuccess', { count: totalUpdated }));
      }

      setIsOpen(false);
      setSelectedPhases([]);
      onComplete?.();
    } catch (error) {
      console.error('[BulkPhaseManager] Error in bulk phase update:', error);
      toast.error(lang('bulkPhase.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for items with existing phases
  const itemsWithPhases = items.filter(item => 
    item.applicablePhases && Array.isArray(item.applicablePhases) && item.applicablePhases.length > 0
  );

return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {lang('bulkPhase.bulkSetPhases')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lang('bulkPhase.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {lang('bulkPhase.dialogDescription', { count: items.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {itemsWithPhases.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {lang('bulkPhase.warningExistingPhases', { count: itemsWithPhases.length })}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{lang('bulkPhase.selectApplicablePhases')}</label>
            <PhaseSelector
              selectedPhases={selectedPhases}
              onPhasesChange={setSelectedPhases}
              companyId={companyId}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {lang('common.cancel')}
          </Button>
          <Button
            onClick={handleBulkUpdate}
            disabled={selectedPhases.length === 0 || isSubmitting}
          >
            {isSubmitting ? lang('bulkPhase.updating') : lang('bulkPhase.updateAllPhases')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}