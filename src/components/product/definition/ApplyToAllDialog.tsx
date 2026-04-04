import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface ApplyToAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelName?: string;
  variantCount: number;
  fieldName: string;
  onApply: (option: 'variant-only' | 'all-variants' | 'model') => void;
  isLoading?: boolean;
}

export function ApplyToAllDialog({
  open,
  onOpenChange,
  modelName,
  variantCount,
  fieldName,
  onApply,
  isLoading = false
}: ApplyToAllDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply Changes to All Variants?</DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  You're editing a variant in the "{modelName}" family
                </p>
                <p className="text-xs text-muted-foreground">
                  {variantCount} {variantCount === 1 ? 'variant' : 'other variants'} will be affected
                </p>
              </div>
            </div>
            
            <p className="text-sm">
              Most variants in a product family share the same {fieldName}. 
              Choose where to apply this change:
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => onApply('variant-only')}
            disabled={isLoading}
          >
            <div className="text-left w-full">
              <div className="font-medium">This variant only</div>
              <div className="text-xs text-muted-foreground mt-1">
                Update only this variant's {fieldName}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 border-primary/30"
            onClick={() => onApply('model')}
            disabled={isLoading}
          >
            <div className="text-left w-full">
              <div className="flex items-center gap-2">
                <span className="font-medium">Model (Recommended)</span>
                <Badge variant="secondary" className="text-xs">Best Practice</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Update the model definition. All {variantCount} variants that inherit will reflect this change.
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => onApply('all-variants')}
            disabled={isLoading}
          >
            <div className="text-left w-full">
              <div className="font-medium">All {variantCount + 1} variants (Override all)</div>
              <div className="text-xs text-muted-foreground mt-1">
                Update all variants directly, removing any custom values
              </div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
