import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductDefinitionAssistant } from './ai-assistant/ProductDefinitionAssistant';
import { FieldSuggestion } from '@/services/productDefinitionAIService';

interface ProductDocumentUploadButtonProps {
  companyId: string;
  onSuggestionsGenerated?: (suggestions: FieldSuggestion[]) => void;
}

export function ProductDocumentUploadButton({
  companyId,
  onSuggestionsGenerated
}: ProductDocumentUploadButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Upload document to auto-populate fields">
          <Upload className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload from Internal Document</DialogTitle>
          <DialogDescription>
            Upload product documentation to automatically extract and suggest field values
          </DialogDescription>
        </DialogHeader>
        <ProductDefinitionAssistant
          companyId={companyId}
          onSuggestionsGenerated={(suggestions) => {
            onSuggestionsGenerated?.(suggestions);
            // Optionally close dialog after successful upload
            // setOpen(false);
          }}
          className="border-0 shadow-none"
        />
      </DialogContent>
    </Dialog>
  );
}
