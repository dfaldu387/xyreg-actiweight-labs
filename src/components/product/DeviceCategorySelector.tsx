import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useCompanyDeviceCategories } from '@/hooks/useCompanyDeviceCategories';

import { Building2, ChevronDown, Plus } from 'lucide-react';
import { DeviceCategoryDialog } from './DeviceCategoryDialog';

interface DeviceCategorySelectorProps {
  companyId: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DeviceCategorySelector: React.FC<DeviceCategorySelectorProps> = ({
  companyId,
  value,
  onValueChange,
  placeholder = "Select device category",
  disabled = false,
}) => {
  const { categories, loading, createCategory } = useCompanyDeviceCategories(companyId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedCustomCategory = categories.find(cat => cat.name === value);
  const displayValue = selectedCustomCategory?.name || value || placeholder;

  const handleCategoryCreated = async (categoryData: { name: string; description?: string }) => {
    try {
      await createCategory(categoryData);
      onValueChange(categoryData.name);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        Loading categories...
      </div>
    );
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <span className="truncate">{displayValue}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="z-50 w-[300px] max-h-[300px] overflow-y-auto bg-popover text-popover-foreground border shadow-md">
          {categories.length > 0 ? (
            <>
              <DropdownMenuLabel>Device Categories</DropdownMenuLabel>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => onValueChange(category.name)}
                  className="flex flex-col items-start gap-1 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                  </div>
                  {category.description && (
                    <span className="text-xs text-muted-foreground">{category.description}</span>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <>
              <DropdownMenuLabel>Device Categories</DropdownMenuLabel>
              <div className="px-2 py-2 text-xs text-muted-foreground">No categories yet</div>
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { setMenuOpen(false); setIsCreateDialogOpen(true); }}
            className="flex items-center gap-2 text-primary"
          >
            <Plus className="h-4 w-4" />
            Create New Category
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeviceCategoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        companyId={companyId}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
};