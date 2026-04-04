import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Info, Loader2 } from 'lucide-react';
import { AIContextSourcesPanel } from './AIContextSourcesPanel';

interface AIExplainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (additionalInstructions: string, outputLanguage: string) => void;
  isLoading?: boolean;
  fieldName: string;
  fieldDescription?: string;
  productId: string;
  companyId?: string;
  /** @deprecated Use productId instead. Kept for backward compat but ignored. */
  deviceContext?: any;
}

export function AIExplainerDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  fieldName,
  fieldDescription,
  productId,
  companyId,
}: AIExplainerDialogProps) {
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const handleConfirm = () => {
    onConfirm(additionalPrompt, outputLanguage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI-Assisted Generation
          </DialogTitle>
          <DialogDescription>
            Generate a suggestion for <strong>{fieldName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[80vh] overflow-y-auto">
          {/* How it works section */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              How it works
            </h4>
            <p className="text-sm text-muted-foreground">
              The AI will analyze your device information and generate a regulatory-compliant
              suggestion for {fieldName}. The more context you provide, the better the suggestion.
            </p>
            {fieldDescription && (
              <p className="text-xs text-muted-foreground italic">
                {fieldDescription}
              </p>
            )}
          </div>

          {/* Sectioned context sources via shared panel */}
          <AIContextSourcesPanel
            productId={productId}
            companyId={companyId}
            mode="select"
            onSelectionChange={setSelectedKeys}
            showPrompt
            onPromptChange={setAdditionalPrompt}
            showLanguage
            onLanguageChange={setOutputLanguage}
          />

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <strong>Note:</strong> AI-generated content should be reviewed and validated
            by qualified personnel before use in regulatory submissions.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || selectedKeys.length === 0}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Suggestion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
