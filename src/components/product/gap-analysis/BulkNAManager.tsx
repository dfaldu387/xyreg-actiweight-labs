import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { GapAnalysisItem } from "@/types/client";
import { bulkMarkGapItemsNA } from "@/services/gapAnalysisService";

interface BulkNAManagerProps {
  items: GapAnalysisItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

/**
 * Modal for bulk-marking the currently selected (filtered) gap items as N/A
 * with a single shared justification reason. Per-item reasons remain editable
 * after the bulk action.
 */
export function BulkNAManager({ items, open, onOpenChange, onComplete }: BulkNAManagerProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      toast.error("A justification is required to mark items as N/A.");
      return;
    }
    if (items.length === 0) {
      toast.error("No items selected.");
      return;
    }
    setSaving(true);
    const ok = await bulkMarkGapItemsNA(
      items.map((i) => i.id),
      trimmed
    );
    setSaving(false);
    if (ok) {
      toast.success(
        `Marked ${items.length} item${items.length === 1 ? "" : "s"} as N/A.`
      );
      setReason("");
      onOpenChange(false);
      onComplete?.();
    } else {
      toast.error("Failed to mark items as N/A.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Mark {items.length} item{items.length === 1 ? "" : "s"} as N/A
          </DialogTitle>
          <DialogDescription>
            Provide a single shared justification. You can refine the reason on
            each item afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="bulk-na-reason" className="text-sm font-medium">
            Why are these requirements not applicable?{" "}
            <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="bulk-na-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Device is non-implantable, so MDR Annex I §X clauses do not apply."
            className="min-h-[100px]"
            disabled={saving}
          />
          <p className="text-[11px] text-muted-foreground">
            This justification is visible to reviewers, Notified Body and
            auditors.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !reason.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Mark as N/A
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}