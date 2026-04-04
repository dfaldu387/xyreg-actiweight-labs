import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DEVICE_CATEGORIES } from '@/data/deviceCategories';
import { toast } from 'sonner';

interface DeviceCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onCategoryCreated: (category: { name: string; description?: string }) => Promise<void> | void;
}

export function DeviceCategoryDialog({
  open,
  onOpenChange,
  companyId,
  onCategoryCreated
}: DeviceCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsCreating(true);
    
    try {
      await onCategoryCreated({
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined
      });
      
      setCategoryName('');
      setCategoryDescription('');
      toast.success('Device category created successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create device category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setCategoryName('');
    setCategoryDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Device Category</DialogTitle>
          <DialogDescription>
            Create a custom device category for your company. This will be available when creating and editing products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name *</Label>
            <Input
              id="category-name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Hearing Aids, Accessories, Tinnitus Solutions"
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Examples: {DEVICE_CATEGORIES.slice(0, 6).map(c => c.label).join(', ')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Description (optional)</Label>
            <Textarea
              id="category-description"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="e.g., Specialized surgical instruments for specific procedures"
              disabled={isCreating}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={isCreating || !categoryName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Category'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}