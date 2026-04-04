import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ModelManagementService } from "@/services/modelManagementService";
import { toast } from "sonner";

interface ModelSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onContinue: (data: {
    type: 'standalone' | 'model-variant';
    modelId?: string;
    variantDisplayName?: string;
    createNewModel?: {
      name: string;
      description?: string;
      model_code?: string;
    };
  }) => void;
}

export function ModelSelectionDialog({
  open,
  onOpenChange,
  companyId,
  onContinue
}: ModelSelectionDialogProps) {
  const [productType, setProductType] = useState<'standalone' | 'model-variant'>('standalone');
  const [modelOption, setModelOption] = useState<'existing' | 'new'>('existing');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [variantDisplayName, setVariantDisplayName] = useState('');
  
  // New model fields
  const [newModelName, setNewModelName] = useState('');
  const [newModelDescription, setNewModelDescription] = useState('');
  const [newModelCode, setNewModelCode] = useState('');

  // Fetch existing models
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models-with-variants', companyId],
    queryFn: () => ModelManagementService.getModelsWithVariants(companyId),
    enabled: open && productType === 'model-variant'
  });

  const handleContinue = () => {
    if (productType === 'standalone') {
      onContinue({ type: 'standalone' });
      return;
    }

    // Model variant
    if (modelOption === 'existing') {
      if (!selectedModelId) {
        toast.error('Please select a model');
        return;
      }
      if (!variantDisplayName.trim()) {
        toast.error('Please enter a variant name');
        return;
      }
      onContinue({
        type: 'model-variant',
        modelId: selectedModelId,
        variantDisplayName: variantDisplayName.trim()
      });
    } else {
      // Create new model
      if (!newModelName.trim()) {
        toast.error('Please enter a model name');
        return;
      }
      if (!variantDisplayName.trim()) {
        toast.error('Please enter a variant name');
        return;
      }
      onContinue({
        type: 'model-variant',
        variantDisplayName: variantDisplayName.trim(),
        createNewModel: {
          name: newModelName.trim(),
          description: newModelDescription.trim() || undefined,
          model_code: newModelCode.trim() || undefined
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Product Type Selection</DialogTitle>
          <DialogDescription>
            Is this a standalone product or part of a model family with variants?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Type Selection */}
          <RadioGroup value={productType} onValueChange={(value: any) => setProductType(value)}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="standalone" id="standalone" className="mt-1" />
              <Label htmlFor="standalone" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Standalone Product</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  A unique device that doesn't have variations (sizes, configurations, etc.)
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="model-variant" id="model-variant" className="mt-1" />
              <Label htmlFor="model-variant" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="h-4 w-4" />
                  <span className="font-medium">Part of Model Family</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  One variant of a device model (e.g., different sizes, markets, or configurations sharing the same Basic UDI-DI)
                </p>
              </Label>
            </div>
          </RadioGroup>

          {/* Model Variant Options */}
          {productType === 'model-variant' && (
            <>
              <Separator />
              
              <RadioGroup value={modelOption} onValueChange={(value: any) => setModelOption(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing">Add to existing model</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">Create new model</Label>
                </div>
              </RadioGroup>

              {modelOption === 'existing' && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="model-select">Select Model</Label>
                    <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                      <SelectTrigger id="model-select">
                        <SelectValue placeholder="Choose a model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading ? (
                          <SelectItem value="loading" disabled>Loading models...</SelectItem>
                        ) : models.length === 0 ? (
                          <SelectItem value="empty" disabled>No models available</SelectItem>
                        ) : (
                          models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name} ({model.variant_count} variants)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="variant-name">Variant Display Name</Label>
                    <Input
                      id="variant-name"
                      placeholder="e.g., Large Size, EU Version, v2.0"
                      value={variantDisplayName}
                      onChange={(e) => setVariantDisplayName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Short name for this variant. Full name will be "{selectedModelId && models.find(m => m.id === selectedModelId)?.name} - {variantDisplayName || 'Variant Name'}"
                    </p>
                  </div>
                </div>
              )}

              {modelOption === 'new' && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="new-model-name">Model Name *</Label>
                    <Input
                      id="new-model-name"
                      placeholder="e.g., NOX-T3s Sleep Monitor"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-model-code">Model Code (Optional)</Label>
                    <Input
                      id="new-model-code"
                      placeholder="e.g., NT3S"
                      value={newModelCode}
                      onChange={(e) => setNewModelCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-model-description">Model Description (Optional)</Label>
                    <Textarea
                      id="new-model-description"
                      placeholder="Description of the model family..."
                      value={newModelDescription}
                      onChange={(e) => setNewModelDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="variant-name-new">First Variant Display Name *</Label>
                    <Input
                      id="variant-name-new"
                      placeholder="e.g., Standard, Large Size, EU Version"
                      value={variantDisplayName}
                      onChange={(e) => setVariantDisplayName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Full name will be "{newModelName || 'Model Name'} - {variantDisplayName || 'Variant Name'}"
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
