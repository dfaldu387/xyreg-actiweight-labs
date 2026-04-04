
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Filter, Package, PackagePlus, GitBranch, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ProductTypeFilter = 'all' | 'new_product' | 'existing_product' | 'line_extension' | 'legacy_product';

interface ProductTypeFilterProps {
  selectedFilter: ProductTypeFilter;
  onFilterChange: (filter: ProductTypeFilter) => void;
  productCounts: {
    all: number;
    new_product: number;
    existing_product: number;
    line_extension: number;
    legacy_product: number;
  };
}

const FILTER_OPTIONS = [
  {
    id: 'all' as const,
    label: 'All Devices',
    icon: Filter,
    color: 'text-gray-600'
  },
  {
    id: 'new_product' as const,
    label: 'New Product',
    icon: Package,
    color: 'text-blue-600'
  },
  {
    id: 'existing_product' as const,
    label: 'Product Upgrade', 
    icon: PackagePlus,
    color: 'text-green-600'
  },
  {
    id: 'line_extension' as const,
    label: 'Line Extension',
    icon: GitBranch,
    color: 'text-orange-600'
  },
  {
    id: 'legacy_product' as const,
    label: 'Legacy Device',
    icon: Archive,
    color: 'text-gray-600'
  }
];

export function ProductTypeFilter({ 
  selectedFilter, 
  onFilterChange, 
  productCounts 
}: ProductTypeFilterProps) {
  const activeOption = FILTER_OPTIONS.find(option => option.id === selectedFilter);
  const hasActiveFilter = selectedFilter !== 'all';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex gap-2">
          {activeOption && <activeOption.icon className={`h-4 w-4 ${activeOption.color}`} />}
          <span>{activeOption?.label || 'Filter'}</span>
          {hasActiveFilter && (
            <Badge variant="secondary" className="ml-1">
              {productCounts[selectedFilter]}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Product Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FILTER_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={selectedFilter === option.id}
            onCheckedChange={() => onFilterChange(option.id)}
            className="flex items-center gap-2"
          >
            <option.icon className={`h-4 w-4 ${option.color}`} />
            <span className="flex-1">{option.label}</span>
            <Badge variant="outline" className="ml-auto">
              {productCounts[option.id]}
            </Badge>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
