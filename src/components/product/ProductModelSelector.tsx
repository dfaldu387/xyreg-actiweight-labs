import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Tag, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CompanyProductModelsService } from '@/services/companyProductModelsService';
import { ProductModelCreateDialog } from './ProductModelCreateDialog';

interface ProductModelSelectorProps {
  companyId: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProductModelSelector({
  companyId,
  value,
  onValueChange,
  placeholder = 'Select product model',
  disabled,
  className,
}: ProductModelSelectorProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['company-product-models', companyId],
    queryFn: () => CompanyProductModelsService.getDistinctModels(companyId),
    enabled: !!companyId,
    staleTime: 60 * 1000,
  });

  const selectedLabel = useMemo(() => {
    // Check if we have a valid value to display
    if (value && value.trim().length > 0) {
      return value;
    }
    
    // If no value is set, check if there's a model in the list that could be the default
    // This handles cases where the database field is null but we should show a model
    if (models.length === 1) {
      return models[0].name;
    }
    
    return undefined;
  }, [value, models]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className} disabled={disabled || isLoading}>
            <Tag className="h-4 w-4 mr-2" />
            {selectedLabel || placeholder}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-50 w-64 bg-popover">
          <DropdownMenuLabel>Product Models</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading && (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          )}
          {!isLoading && models.length === 0 && (
            <DropdownMenuItem disabled>No models yet</DropdownMenuItem>
          )}
          {!isLoading && models.map((m) => (
            <DropdownMenuItem key={m.name} onClick={() => onValueChange?.(m.name)}>
              {m.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenCreate(true)} className="text-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create New Product Model
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductModelCreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreate={async (name) => {
          await CompanyProductModelsService.createModel(companyId, { name });
          onValueChange?.(name);
          await queryClient.invalidateQueries({ queryKey: ['company-product-models', companyId] });
        }}
      />
    </>
  );
}
