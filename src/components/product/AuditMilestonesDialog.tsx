
import { Button } from "@/components/ui/button";
import { ClipboardList, FilePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ProductPhase } from "@/types/client";

interface AuditMilestonesDialogProps {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  phaseName?: string;
  onAudit: () => void;
  onDesignReview: () => void;
}

export function AuditMilestonesDialog({
  open,
  onOpenChange,
  phaseName,
  onAudit,
  onDesignReview,
}: AuditMilestonesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Milestone for "{phaseName}"</DialogTitle>
          <DialogDescription>
            Choose to schedule a phase milestone (like an Audit or Design Review) for this phase.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Button className="w-full" variant="outline" onClick={onAudit}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Schedule Audit
          </Button>
          <Button className="w-full" variant="outline" onClick={onDesignReview}>
            <FilePlus className="h-4 w-4 mr-2" />
            Schedule Design Review
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full mt-2">Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
