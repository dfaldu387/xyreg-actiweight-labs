
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { X, ChevronDown, Plus } from 'lucide-react';
import { type PhaseCategory } from '@/services/categoryService';

interface MultiCategorySelectorProps {
  categories: PhaseCategory[];
  selectedCategoryIds: string[];
  onCategoryChange: (categoryIds: string[]) => void;
  onCreateCategory?: (name: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiCategorySelector({
  categories,
  selectedCategoryIds,
  onCategoryChange,
  onCreateCategory,
  placeholder = "Select categories...",
  disabled = false
}: MultiCategorySelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const selectedCategories = categories.filter(cat => selectedCategoryIds.includes(cat.id));

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !onCreateCategory) return;
    
    await onCreateCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsCreating(false);
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      onCategoryChange([...selectedCategoryIds, categoryId]);
    } else {
      onCategoryChange(selectedCategoryIds.filter(id => id !== categoryId));
    }
  };

  const removeCategoryById = (categoryId: string) => {
    onCategoryChange(selectedCategoryIds.filter(id => id !== categoryId));
  };

  const clearAll = () => {
    onCategoryChange([]);
  };

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-between text-left font-normal"
          >
            <span className="truncate">
              {selectedCategories.length === 0 
                ? placeholder 
                : `${selectedCategories.length} categories selected`
              }
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Categories</Label>
              {selectedCategoryIds.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAll}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No categories available</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(category.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            
            {onCreateCategory && (
              <div className="pt-2 border-t">
                {isCreating ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateCategory();
                        if (e.key === 'Escape') {
                          setIsCreating(false);
                          setNewCategoryName('');
                        }
                      }}
                      autoFocus
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="h-8"
                    >
                      Add
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreating(true)}
                    className="w-full justify-start h-8 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Category
                  </Button>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected categories display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="text-xs px-2 py-1 flex items-center gap-1"
            >
              {category.name}
              {!disabled && (
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeCategoryById(category.id)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
