import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings2, Loader2 } from 'lucide-react';
import { useListColumnPreferences, useSaveListColumnPreferences } from '@/hooks/useListColumnPreferences';
import type { ListModuleType, ListViewType } from '@/types/listColumnPreferences';

export interface ColumnDefinition {
  key: string;
  label: string;
  required?: boolean; // Can't be hidden (e.g., Name)
}

interface ColumnVisibilitySettingsProps {
  companyId: string;
  productId?: string | null;
  module: ListModuleType;
  viewKey?: ListViewType;
  columns: ColumnDefinition[];
  hiddenColumns: string[];
  onHiddenColumnsChange: (hidden: string[]) => void;
}

export function ColumnVisibilitySettings({
  companyId,
  productId = null,
  module,
  viewKey = 'list',
  columns,
  hiddenColumns,
  onHiddenColumnsChange,
}: ColumnVisibilitySettingsProps) {
  const saveMutation = useSaveListColumnPreferences(companyId, productId, module, viewKey);

  const toggleColumn = (columnKey: string) => {
    const newHidden = hiddenColumns.includes(columnKey)
      ? hiddenColumns.filter(c => c !== columnKey)
      : [...hiddenColumns, columnKey];

    onHiddenColumnsChange(newHidden);

    // Auto-save to DB
    saveMutation.mutate({ hidden_columns: newHidden });
  };

  const visibleCount = columns.length - hiddenColumns.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 gap-1.5">
          <Settings2 className="h-4 w-4" />
          Columns
          {hiddenColumns.length > 0 && (
            <span className="text-muted-foreground">({visibleCount}/{columns.length})</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[220px] p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold">Show/Hide Columns</p>
          {saveMutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {columns.map(col => (
            <label
              key={col.key}
              className={`flex items-center gap-2 text-sm rounded px-2 py-1.5 cursor-pointer hover:bg-muted/50 ${
                col.required ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <Checkbox
                checked={!hiddenColumns.includes(col.key)}
                disabled={col.required}
                onCheckedChange={() => !col.required && toggleColumn(col.key)}
              />
              <span className="text-xs">{col.label}</span>
              {col.required && <span className="text-[10px] text-muted-foreground ml-auto">Required</span>}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
