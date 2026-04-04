import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { BaseProductSelectorShadcn } from './BaseProductSelectorShadcn';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreatePlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  currentProductId?: string;
  onPlatformCreated: (platform: string, baseProductId: string) => void;
}

export function CreatePlatformDialog({
  open,
  onOpenChange,
  companyId,
  currentProductId,
  onPlatformCreated
}: CreatePlatformDialogProps) {
  const [platformName, setPlatformName] = useState('');
  const [selectedBaseProductId, setSelectedBaseProductId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPlatformName('');
      setSelectedBaseProductId('');
      setIsCreating(false);
    } else if (currentProductId) {
      // Auto-select current product when dialog opens
      setSelectedBaseProductId(currentProductId);
    }
  }, [open, currentProductId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsCreating(false);
    };
  }, []);

  const handleCreate = async () => {
    if (isCreating) return; // Prevent multiple submissions
    
    if (!platformName.trim()) {
      toast.error('Platform name is required');
      return;
    }

    if (!selectedBaseProductId) {
      toast.error('Please select a base product for the platform');
      return;
    }

    setIsCreating(true);
    
    try {
      // Use setTimeout to ensure the UI updates before the async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Update the base product with the new platform name
      const { error: updateError } = await supabase
        .from('products')
        .update({ product_platform: platformName.trim() })
        .eq('id', selectedBaseProductId);

      if (updateError) {
        throw updateError;
      }

      // Call the callback to update the form state
      onPlatformCreated(platformName.trim(), selectedBaseProductId);
      
      // Invalidate all related queries to refresh the data immediately
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['product-platforms', companyId]
        }),
        queryClient.invalidateQueries({
          queryKey: ['products']
        }),
        queryClient.invalidateQueries({
          queryKey: ['portfolio-sunburst', companyId]
        }),
        queryClient.invalidateQueries({
          queryKey: ['portfolio-phases', companyId]
        }),
        queryClient.invalidateQueries({
          queryKey: ['company-products', companyId]
        })
      ]);
      
      onOpenChange(false);
      toast.success('Platform created successfully');
    } catch (error) {
      console.error('Error creating platform:', error);
      toast.error('Failed to create platform');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    if (isCreating) return; // Prevent canceling while creating
    setPlatformName('');
    setSelectedBaseProductId('');
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (newOpen === false && isCreating) {
          return; // Prevent closing while creating
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className="sm:max-w-lg z-[9991]"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onInteractOutside={(e) => {
          if (isCreating) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create New Product Platform
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            A platform groups related products together. Select a base product and give your platform a name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform-name">Platform Name</Label>
            <Input
              id="platform-name"
              placeholder="e.g., CardioVision Platform"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating && platformName.trim() && selectedBaseProductId) {
                  handleCreate();
                }
              }}
              disabled={isCreating}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-product">
              Base Product *
            </Label>
            <BaseProductSelectorShadcn
              companyId={companyId}
              selectedProductId={selectedBaseProductId}
              onProductSelect={setSelectedBaseProductId}
              currentProductId={currentProductId}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This product will become the foundation of your new platform
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !platformName.trim() || !selectedBaseProductId}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Creating...
              </span>
            ) : (
              'Create Platform'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}