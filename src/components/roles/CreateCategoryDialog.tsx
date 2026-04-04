import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PermissionCategory } from '@/services/roleManagementService';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCategory: (category: Partial<PermissionCategory>) => Promise<void>;
}

export function CreateCategoryDialog({ open, onOpenChange, onCreateCategory }: CreateCategoryDialogProps) {
  const [categoryData, setCategoryData] = useState({
    category_key: '',
    category_name: '',
    description: '',
    icon_name: 'folder',
    color: '#6366f1',
  });

  const handleCreate = async () => {
    await onCreateCategory(categoryData);
    // Reset form
    setCategoryData({
      category_key: '',
      category_name: '',
      description: '',
      icon_name: 'folder',
      color: '#6366f1',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Add a new permission category to organize your permissions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cat-key">Category Key</Label>
            <Input
              id="cat-key"
              value={categoryData.category_key}
              onChange={(e) => setCategoryData({...categoryData, category_key: e.target.value})}
              placeholder="product-management"
            />
          </div>
          <div>
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              value={categoryData.category_name}
              onChange={(e) => setCategoryData({...categoryData, category_name: e.target.value})}
              placeholder="Product Management"
            />
          </div>
          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={categoryData.description}
              onChange={(e) => setCategoryData({...categoryData, description: e.target.value})}
              placeholder="Permissions related to product management"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
