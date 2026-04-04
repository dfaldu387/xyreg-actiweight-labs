import React from 'react';
import { Control, FieldPath, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SUPPLY_CATEGORIES } from '@/constants/supplyCategories';
import { useTranslation } from '@/hooks/useTranslation';

interface ScopeOfSupplyFieldProps<T extends Record<string, any>> {
  control: Control<T>;
  categoryName: FieldPath<T>;
  customDescriptionName: FieldPath<T>;
}

export function ScopeOfSupplyField<T extends Record<string, any>>({
  control,
  categoryName,
  customDescriptionName,
}: ScopeOfSupplyFieldProps<T>) {
  const { lang } = useTranslation();
  const categoryValue = useWatch({
    control,
    name: categoryName,
  });
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={categoryName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{lang('supplier.scopeOfSupplyCategory')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={lang('supplier.selectSupplyCategory')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-background border shadow-md z-50">
                {SUPPLY_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div>
                      <div className="font-medium">{category.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {category.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={customDescriptionName}
        render={({ field }) => {
          const showCustomField = categoryValue === 'Other';

          if (!showCustomField) return null;

          return (
            <FormItem>
              <FormLabel>{lang('supplier.customDescription')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={lang('supplier.describeCustomSupplyCategory')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
}