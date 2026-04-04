import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAddBundleMember } from '@/hooks/useProductBundleGroups';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BundleMemberConfig } from '@/types/productBundle';

interface AddBundleMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundleId: string;
  companyId: string;
  existingMemberIds: string[];
}

export function AddBundleMemberDialog({
  open,
  onOpenChange,
  bundleId,
  companyId,
  existingMemberIds,
}: AddBundleMemberDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<BundleMemberConfig['relationship_type']>('component');
  const [multiplier, setMultiplier] = useState('1');
  const addMemberMutation = useAddBundleMember();

  // Fetch available products
  const { data: products } = useQuery({
    queryKey: ['company-products', companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name');
      return data || [];
    },
    enabled: open,
  });

  // Filter out products already in the bundle
  const availableProducts = products?.filter(p => !existingMemberIds.includes(p.id)) || [];

  const handleAdd = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    const multiplierValue = parseInt(multiplier);
    if (isNaN(multiplierValue) || multiplierValue < 1) {
      toast.error('Multiplier must be a positive number');
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        bundleId,
        memberConfig: {
          product_id: selectedProductId,
          relationship_type: relationshipType,
          multiplier: multiplierValue,
          is_primary: false,
        },
      });

      toast.success('Member added successfully');
      onOpenChange(false);
      setSelectedProductId('');
      setRelationshipType('component');
      setMultiplier('1');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bundle Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-select">Product *</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product-select">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No available products
                  </div>
                ) : (
                  availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship-type">Relationship Type *</Label>
            <Select
              value={relationshipType}
              onValueChange={(value) => setRelationshipType(value as BundleMemberConfig['relationship_type'])}
            >
              <SelectTrigger id="relationship-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="component">Component</SelectItem>
                <SelectItem value="accessory">Accessory</SelectItem>
                <SelectItem value="consumable">Consumable</SelectItem>
                <SelectItem value="required">Required</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
                <SelectItem value="replacement_part">Replacement Part</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="multiplier">Multiplier</Label>
            <Input
              id="multiplier"
              type="number"
              min="1"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addMemberMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={addMemberMutation.isPending || availableProducts.length === 0}
          >
            {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
