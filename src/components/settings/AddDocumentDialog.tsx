
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentPhasesSelector } from "./DocumentPhasesSelector";
import { toast } from "sonner";

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (documentName: string, documentType: string, phases: string[]) => void;
  availablePhases: string[];
}

const AddDocumentDialog = ({
  open,
  onOpenChange,
  onAdd,
  availablePhases = []
}: AddDocumentDialogProps) => {
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("Standard");
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const handleAdd = async () => {
    setValidationError(null);
    
    if (!documentName.trim()) {
      setValidationError("Document name cannot be empty");
      return;
    }
    
    if (availablePhases.length > 0 && selectedPhases.length === 0) {
      setValidationError("Please select at least one phase for this document");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Pass the document name, type and selected phases to the parent component
      await onAdd(documentName.trim(), documentType, selectedPhases);
      resetForm();
      toast.success(`Added document "${documentName}" to ${selectedPhases.length} phase(s)`);
    } catch (error) {
      console.error("Error adding document:", error);
      toast.error("Failed to add document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDocumentName("");
    setDocumentType("Standard");
    setSelectedPhases([]);
    setValidationError(null);
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Mock functions for onSave and onCancel as placeholders
  const handleSave = async () => {
    return true;
  };

  const handleCancel = () => {
    // No-op, using the dialog's own close mechanisms
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isSubmitting) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="document-name" className="text-sm font-medium">
              Document Name
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="document-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="document-type" className="text-sm font-medium">
              Document Type
            </Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" className="mt-1">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Regulatory">Regulatory</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Clinical">Clinical</SelectItem>
                <SelectItem value="Quality">Quality</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Associated Phases
              {availablePhases.length > 0 && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="mt-1">
              <DocumentPhasesSelector
                availablePhases={availablePhases}
                selectedPhases={selectedPhases}
                onChange={setSelectedPhases}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={isSubmitting}
              />
            </div>
            {availablePhases.length === 0 && (
              <p className="text-xs text-amber-500">
                No phases available. Please add phases in company settings first.
              </p>
            )}
            {availablePhases.length > 0 && selectedPhases.length === 0 && (
              <p className="text-xs text-amber-500">
                Please select at least one phase for this document.
              </p>
            )}
          </div>
          {validationError && (
            <div className="p-2 bg-destructive/10 rounded-md text-sm text-destructive">
              {validationError}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            disabled={!documentName.trim() || 
                     (availablePhases.length > 0 && selectedPhases.length === 0) || 
                     isSubmitting}
          >
            Add Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentDialog;
