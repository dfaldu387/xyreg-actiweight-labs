import React from "react";
import { Copy } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CopyDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string | undefined;
  onConfirm: () => void;
}

export function CopyDocumentDialog({
  open,
  onOpenChange,
  documentName,
  onConfirm,
}: CopyDocumentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Copy Document</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              A copy of <strong>"{documentName}"</strong> will be created as <strong>"{documentName} (copy)"</strong>.
            </span>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>All metadata (phase, section, tags, description) will be preserved</li>
              <li>Status will be reset to <strong>Not Started</strong></li>
            </ul>
            <span className="block mt-2 text-sm">You can edit the copy after it's created.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            <Copy className="h-4 w-4 mr-2" />
            Create Copy
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
