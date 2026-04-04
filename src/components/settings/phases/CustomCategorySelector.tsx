
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Tag } from 'lucide-react';
import { type PhaseCategory } from '@/services/categoryService';

interface CustomCategorySelectorProps {
  categories: PhaseCategory[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onCreateCategory: (name: string) => Promise<PhaseCategory | null>;
  disabled?: boolean;
}

export function CustomCategorySelector({
  categories,
  selectedCategoryId,
  onCategoryChange,
  onCreateCategory,
  disabled = false
}: CustomCategorySelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Filter for custom categories only
  const customCategories = categories.filter(cat => !cat.is_system_category);
  
  const selectedCategory = customCategories.find(cat => cat.id === selectedCategoryId);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      const newCategory = await onCreateCategory(newCategoryName.trim());
      if (newCategory) {
        onCategoryChange(newCategory.id);
        setShowCreateDialog(false);
        setNewCategoryName('');
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Custom Category</Label>
      <div className="flex gap-2">
        <Select 
          value={selectedCategoryId} 
          onValueChange={onCategoryChange}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a custom category..." />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white">
            <SelectItem value="no-category">
              <div className="flex items-center gap-2">
                <span>No Category</span>
                <Badge variant="outline" className="text-xs">Optional</Badge>
              </div>
            </SelectItem>
            {customCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3" />
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    Custom
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
          disabled={disabled}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>
      
      {selectedCategory && (
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
          <Tag className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">Selected: {selectedCategory.name}</span>
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
            Custom Category
          </Badge>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Design Controls, Risk Management"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    handleCreateCategory();
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
              <strong>Note:</strong> This will create a new custom category that can be used to organize your phases.
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
