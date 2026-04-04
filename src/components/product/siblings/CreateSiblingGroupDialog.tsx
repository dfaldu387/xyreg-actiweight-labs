import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSiblingGroup, useAddSiblingToGroup } from '@/hooks/useSiblingGroups';
import { ProductWithBasicUDI } from '@/hooks/useProductsByBasicUDI';
import { DistributionPattern } from '@/types/siblingGroup';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package } from 'lucide-react';

interface CreateSiblingGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  basicUdiDi: string;
  availableProducts: ProductWithBasicUDI[];
  preSelectedProductIds?: string[];
  onSuccess?: () => void;
}

export function CreateSiblingGroupDialog({
  open,
  onOpenChange,
  companyId,
  basicUdiDi,
  availableProducts,
  preSelectedProductIds = [],
  onSuccess,
}: CreateSiblingGroupDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [distributionPattern, setDistributionPattern] = useState<DistributionPattern>('even');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set(preSelectedProductIds));

  const createGroupMutation = useCreateSiblingGroup();
  const addSiblingMutation = useAddSiblingToGroup();

  // Update selected products when preSelectedProductIds changes
  useEffect(() => {
    setSelectedProductIds(new Set(preSelectedProductIds));
  }, [preSelectedProductIds, open]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedProductIds.size === 0) return;

    try {
      // Create the group
      const group = await createGroupMutation.mutateAsync({
        company_id: companyId,
        basic_udi_di: basicUdiDi,
        name: name.trim(),
        description: description.trim() || undefined,
        distribution_pattern: distributionPattern,
        total_percentage: 0,
        position: 0,
      });

      // Add selected products to the group
      const addPromises = Array.from(selectedProductIds).map((productId, index) =>
        addSiblingMutation.mutateAsync({
          siblingId: productId,
          groupId: group.id,
          percentage: 0,
          position: index,
        })
      );

      await Promise.all(addPromises);

      // Reset form
      setName('');
      setDescription('');
      setDistributionPattern('even');
      setSelectedProductIds(new Set());
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Sibling Group</DialogTitle>
          <DialogDescription>
            Create a new sibling group for Basic UDI-DI: <span className="font-mono font-semibold">{basicUdiDi}</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Small Sizes, Large Sizes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this group..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern">Distribution Pattern</Label>
              <Select
                value={distributionPattern}
                onValueChange={(value) => setDistributionPattern(value as DistributionPattern)}
              >
                <SelectTrigger id="pattern">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="even">Even Distribution</SelectItem>
                  <SelectItem value="gaussian_curve">Gaussian Curve</SelectItem>
                  <SelectItem value="empirical_data">Empirical Data</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How products in this group should be distributed for forecasting
              </p>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Select Products for this Group</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {selectedProductIds.size} of {availableProducts.length} products selected
              </p>
              
              <div className="border rounded-md p-2 space-y-1 max-h-[300px] overflow-y-auto">
                {availableProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No ungrouped products available</p>
                  </div>
                ) : (
                  availableProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={`flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedProductIds.has(product.id)
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedProductIds.has(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {product.name}
                        </div>
                        {product.trade_name && (
                          <div className="text-xs text-muted-foreground">
                            {product.trade_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || selectedProductIds.size === 0 || createGroupMutation.isPending}
          >
            {createGroupMutation.isPending ? 'Creating...' : `Create Group with ${selectedProductIds.size} Product${selectedProductIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
