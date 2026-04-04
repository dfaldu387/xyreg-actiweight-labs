import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  itemName: string;
  affectedItems?: string[];
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  affectedItems = [],
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason("");
    }
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2">
              Warning: This action cannot be undone
            </p>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
            <p className="text-sm font-medium mt-2">
              Item to delete: <span className="font-mono">{itemName}</span>
            </p>
          </div>

          {affectedItems.length > 0 && (
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">
                This will also affect:
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                {affectedItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-orange-600 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="deletion-reason" className="text-sm font-medium">
              Reason for deletion <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="deletion-reason"
              placeholder="Please provide a reason for this deletion (required for audit trail)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}