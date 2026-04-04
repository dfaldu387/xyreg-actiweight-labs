
import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyDocumentsStateProps {
  documentCount: number;
  onAddDocumentClick: () => void;
}

export function EmptyDocumentsState({ documentCount, onAddDocumentClick }: EmptyDocumentsStateProps) {
  return (
    <div className="text-center p-12 bg-muted/30 rounded-lg border border-dashed">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {documentCount > 0 
          ? "No documents match your current filter criteria. Try adjusting your filters."
          : "This product doesn't have any documents associated with it yet. Add your first document to begin managing the product documentation."
        }
      </p>
      <Button className="flex items-center gap-2 hidden" onClick={onAddDocumentClick}>
        <Plus className="size-4" />
        <span>{documentCount > 0 ? "Add Document" : "Add First Document"}</span>
      </Button>
    </div>
  );
}
