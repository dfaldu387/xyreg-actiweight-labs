import React from 'react';
import { Search, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type ViewMode = 'grid' | 'table';
export type SortOption = 'updated' | 'viability' | 'name';

interface PortfolioFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  deviceClassFilter: string;
  onDeviceClassChange: (value: string) => void;
  phaseFilter: string;
  onPhaseChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function PortfolioFilters({
  searchQuery,
  onSearchChange,
  deviceClassFilter,
  onDeviceClassChange,
  phaseFilter,
  onPhaseChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: PortfolioFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card rounded-lg border border-border/50 p-3">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-[180px] h-9 text-sm"
          />
        </div>

        {/* Device Class Filter */}
        <Select value={deviceClassFilter} onValueChange={onDeviceClassChange}>
          <SelectTrigger className="w-[120px] h-9 text-sm">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="I">Class I</SelectItem>
            <SelectItem value="IIa">Class IIa</SelectItem>
            <SelectItem value="IIb">Class IIb</SelectItem>
            <SelectItem value="III">Class III</SelectItem>
          </SelectContent>
        </Select>

        {/* Phase Filter */}
        <Select value={phaseFilter} onValueChange={onPhaseChange}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            <SelectItem value="concept">Concept</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="verification">V&V</SelectItem>
            <SelectItem value="production">Production</SelectItem>
            <SelectItem value="market">Market</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="viability">Viability Score</SelectItem>
            <SelectItem value="name">Company Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Toggle */}
      <ToggleGroup 
        type="single" 
        value={viewMode} 
        onValueChange={(v) => v && onViewModeChange(v as ViewMode)}
        className="border border-border rounded-md"
      >
        <ToggleGroupItem value="grid" aria-label="Grid view" className="h-9 w-9 p-0">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view" className="h-9 w-9 p-0">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
