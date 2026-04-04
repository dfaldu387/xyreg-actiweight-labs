
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  external?: boolean;
}

interface RequestReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  availableReviewers: User[];
  onReviewRequested: (reviewers: string[], note: string) => void;
}

export function RequestReviewDialog({
  open,
  onOpenChange,
  documentId,
  documentName,
  availableReviewers,
  onReviewRequested,
}: RequestReviewDialogProps) {
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedReviewers([]);
      setNote("");
    }
  }, [open]);

  const toggleReviewer = (reviewerId: string) => {
    setSelectedReviewers((prev) =>
      prev.includes(reviewerId)
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const handleSubmit = () => {
    if (selectedReviewers.length === 0) {
      toast.error("Please select at least one reviewer");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call the callback function with selected reviewers and note
      onReviewRequested(selectedReviewers, note);
      
      // Show success message
      toast.success(`Review requested from ${selectedReviewers.length} user(s)`);
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to request review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Document Review</DialogTitle>
          <DialogDescription>
            Select users to review "{documentName}". Any user with access to this document can be assigned a review task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">Add a note (optional)</Label>
            <Textarea
              placeholder="E.g., Please review by Friday..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-1 block">Select Reviewers</Label>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {availableReviewers.length > 0 ? (
                <div className="space-y-2">
                  {availableReviewers.map((reviewer) => (
                    <div
                      key={reviewer.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
                    >
                      <Checkbox
                        id={`reviewer-${reviewer.id}`}
                        checked={selectedReviewers.includes(reviewer.id)}
                        onCheckedChange={() => toggleReviewer(reviewer.id)}
                      />
                      <div className="flex items-center flex-1 space-x-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback>
                            {reviewer.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Label
                            htmlFor={`reviewer-${reviewer.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {reviewer.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {reviewer.email} • {reviewer.role}
                            {reviewer.external && " • External"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No eligible reviewers available
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || selectedReviewers.length === 0}
          >
            Request Review
            {isSubmitting && (
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
