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
import { GitBranch, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CreateFamilyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Array<{ id: string; name: string; basic_udi_di?: string | null }>;
  refetch?: () => Promise<void>;
}

export function CreateFamilyDialog({ isOpen, onClose, products, refetch }: CreateFamilyDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // Sort alphabetically; first becomes technical root (never exposed to user)
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
  const rootProduct = sorted[0];

  const handleCreate = async () => {
    if (!rootProduct) return;

    setIsCreating(true);
    try {
      const rootId = rootProduct.id;
      const otherIds = sorted.filter(p => p.id !== rootId).map(p => p.id);

      // Set root device
      const { error: rootError } = await supabase
        .from('products')
        .update({ is_master_device: true })
        .eq('id', rootId);

      if (rootError) throw rootError;

      // Link other members to root
      const updateData: Record<string, any> = {
        parent_product_id: rootId,
        parent_relationship_type: 'variant',
      };

      if (rootProduct.basic_udi_di) {
        updateData.basic_udi_di = rootProduct.basic_udi_di;
      }

      if (otherIds.length > 0) {
        const { error: memberError } = await supabase
          .from('products')
          .update(updateData)
          .in('id', otherIds);

        if (memberError) throw memberError;
      }

      toast.success(`Product family created with ${sorted.length} devices`);

      await queryClient.resetQueries({ queryKey: ['sidebarCompanyProducts'] });
      await queryClient.resetQueries({ queryKey: ['products-basic-udi'] });
      await queryClient.invalidateQueries({ queryKey: ['simpleClients'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      if (refetch) await refetch();

      onClose();
    } catch (error) {
      console.error('Error creating product family:', error);
      toast.error('Failed to create product family');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Create Product Family
          </DialogTitle>
          <DialogDescription>
            These devices will be grouped as <strong>equal peers</strong> in a product family.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          {sorted.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm">{product.name}</span>
            </div>
          ))}
        </div>

        <div className="text-sm text-muted-foreground border-t pt-3">
          <span>Family members: <strong>{sorted.length}</strong></span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isCreating || sorted.length < 2}>
            {isCreating ? 'Creating...' : 'Create Family'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
