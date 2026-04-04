import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { createModelFromFamily } from '@/services/productFamilyService';
import type { ProductWithFamily } from '@/services/productFamilyService';

interface CreateModelFromFamilyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithFamily[];
  companyId: string;
  familyKey: string;
  companyName: string;
}

export function CreateModelFromFamilyDialog({
  isOpen,
  onClose,
  products,
  companyId,
  familyKey,
  companyName,
}: CreateModelFromFamilyDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createModelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId) throw new Error('Please select a template product');
      
      return createModelFromFamily({
        templateProductId: selectedProductId,
        familyKey,
        companyId,
      });
    },
    onSuccess: (modelId) => {
      toast.success('Model created successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['product-family-products', companyId, familyKey] });
      queryClient.invalidateQueries({ queryKey: ['company-product-models', companyId] });
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
      
      onClose();
      
      // Navigate to the first product in the model (since we don't have a dedicated model page yet)
      // User can see the model and all variants through the product's model view
      navigate(`/app/company/${encodeURIComponent(companyName)}/product/${selectedProductId}`);
    },
    onError: (error: any) => {
      console.error('Error creating model:', error);
      toast.error(error.message || 'Failed to create model');
    },
  });

  const handleCreate = () => {
    createModelMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Create Product Model
          </DialogTitle>
          <DialogDescription>
            Convert this product family into a Model. Select one product to use as the template - 
            all products in this family will become variants of the model.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Template Product</Label>
            <RadioGroup value={selectedProductId} onValueChange={setSelectedProductId}>
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem value={product.id} id={product.id} className="mt-1" />
                    <Label
                      htmlFor={product.id}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="font-medium">{product.name}</div>
                      {product.variant_tags && Object.keys(product.variant_tags).length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {Object.entries(product.variant_tags)
                            .map(([dim, val]) => `${dim}: ${val}`)
                            .join(' • ')}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">What happens when you create a model?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>A product model record will be created based on the template product</li>
              <li>All {products.length} products in this family will be linked to the model</li>
              <li>Products become variants of the model</li>
              <li>You can manage variants and inheritance through the product pages</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedProductId || createModelMutation.isPending}
          >
            {createModelMutation.isPending ? 'Creating...' : 'Create Model'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
