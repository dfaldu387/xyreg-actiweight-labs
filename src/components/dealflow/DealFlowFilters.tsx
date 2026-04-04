import React, { useState } from 'react';
import { Filter, X, Lock, Globe, Briefcase, Star, Search, Plus, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DEVICE_CATEGORY_OPTIONS } from '@/types/investor';
import { fundingStageInfo } from '@/data/fundingStageHelp';
import type { MarketplaceFilters, DealCategory, InvestorStatus, TimeFilter } from '@/hooks/useMarketplaceListings';

interface DealFlowFiltersProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
  invitedCount?: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const DEVICE_CLASS_OPTIONS = ['Class I', 'Class IIa', 'Class IIb', 'Class III'];

const MARKET_OPTIONS = [
  { code: 'EU', label: 'EU' },
  { code: 'USA', label: 'US' },
  { code: 'UK', label: 'UK' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'JP', label: 'Japan' },
  { code: 'BR', label: 'Brazil' },
  { code: 'CN', label: 'China' },
];

const STATUS_OPTIONS: { value: InvestorStatus; label: string }[] = [
  { value: 'invested', label: 'Invested' },
  { value: 'interested', label: 'Interested' },
  { value: 'watching', label: 'Watching' },
  { value: 'passed', label: 'Passed' },
];

const TIME_FILTER_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
];

// Filter type definition
type FilterType = 'deviceClass' | 'deviceCategory' | 'developmentPhase' | 'fundingStage' | 'targetMarkets' | 'investorStatus' | 'timeFilter';

interface FilterOption {
  type: FilterType;
  label: string;
  options: { value: string; label: string }[];
  multiSelect?: boolean;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    type: 'deviceClass',
    label: 'Device Class',
    options: DEVICE_CLASS_OPTIONS.map(c => ({ value: c, label: c })),
  },
  {
    type: 'deviceCategory',
    label: 'Category',
    options: DEVICE_CATEGORY_OPTIONS.map(c => ({ value: c, label: c })),
  },
  {
    type: 'fundingStage',
    label: 'Ticket Size',
    options: Object.values(fundingStageInfo).map(s => ({ value: s.key, label: `${s.label} (${s.typicalAmount})` })),
  },
  {
    type: 'targetMarkets',
    label: 'Target Market',
    options: MARKET_OPTIONS.map(m => ({ value: m.code, label: m.label })),
    multiSelect: true,
  },
  {
    type: 'investorStatus',
    label: 'My Status',
    options: STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label })),
  },
  {
    type: 'timeFilter',
    label: 'Recently Added',
    options: TIME_FILTER_OPTIONS.map(t => ({ value: t.value, label: t.label })),
  },
];

// Filter Dropdown Component
function FilterDropdown({
  filterOption,
  filters,
  onFiltersChange,
  onClose,
}: {
  filterOption: FilterOption;
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filteredOptions = filterOption.options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (value: string) => {
    if (filterOption.type === 'targetMarkets') {
      return filters.targetMarkets?.includes(value) || false;
    }
    return filters[filterOption.type] === value;
  };

  const handleSelect = (value: string) => {
    if (filterOption.type === 'targetMarkets') {
      const currentMarkets = filters.targetMarkets || [];
      const newMarkets = currentMarkets.includes(value)
        ? currentMarkets.filter(m => m !== value)
        : [...currentMarkets, value];
      onFiltersChange({
        ...filters,
        targetMarkets: newMarkets.length > 0 ? newMarkets : undefined,
      });
    } else {
      const currentValue = filters[filterOption.type];
      onFiltersChange({
        ...filters,
        [filterOption.type]: currentValue === value ? undefined : value,
      });
      if (!filterOption.multiSelect) {
        onClose();
      }
    }
  };

  return (
    <div className="w-64">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-muted/50"
          />
        </div>
      </div>
      <div className="p-1 max-h-64 overflow-y-auto">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
          <span>←</span> {filterOption.label}
        </div>
        {filteredOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted text-left"
          >
            <div className={`h-4 w-4 border rounded flex items-center justify-center ${isSelected(opt.value) ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
              {isSelected(opt.value) && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <span className="truncate">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Add Filter Button with Dropdown
function AddFilterButton({
  filters,
  onFiltersChange,
}: {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: MarketplaceFilters) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption | null>(null);

  const handleBack = () => {
    setSelectedFilter(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFilter(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" />
          Add filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        {selectedFilter ? (
          <div>
            <button
              onClick={handleBack}
              className="w-full px-3 py-2 text-sm text-left hover:bg-muted border-b flex items-center gap-1"
            >
              <span>←</span> Back
            </button>
            <FilterDropdown
              filterOption={selectedFilter}
              filters={filters}
              onFiltersChange={onFiltersChange}
              onClose={handleClose}
            />
          </div>
        ) : (
          <div className="p-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Search and filter
            </div>
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedFilter(option)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-muted text-left"
              >
                <span>{option.label}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Active Filter Tag
function ActiveFilterTag({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string;
  onRemove: () => void;
}) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1 h-7">
      <span className="text-muted-foreground">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-1 h-4 w-4 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

export function DealFlowFilters({ filters, onFiltersChange, invitedCount = 0, searchQuery, onSearchChange }: DealFlowFiltersProps) {
  // Get active filters for display
  const getActiveFilters = () => {
    const active: { label: string; value: string; onRemove: () => void }[] = [];

    if (filters.deviceClass) {
      active.push({
        label: 'Class',
        value: filters.deviceClass,
        onRemove: () => onFiltersChange({ ...filters, deviceClass: undefined }),
      });
    }
    if (filters.deviceCategory) {
      active.push({
        label: 'Category',
        value: filters.deviceCategory,
        onRemove: () => onFiltersChange({ ...filters, deviceCategory: undefined }),
      });
    }
    if (filters.viabilityScoreMin !== undefined && filters.viabilityScoreMin > 0) {
      active.push({
        label: 'Min Score',
        value: `${filters.viabilityScoreMin}+`,
        onRemove: () => onFiltersChange({ ...filters, viabilityScoreMin: undefined }),
      });
    }
    if (filters.fundingStage) {
      const stage = fundingStageInfo[filters.fundingStage as keyof typeof fundingStageInfo];
      active.push({
        label: 'Ticket',
        value: stage?.label || filters.fundingStage,
        onRemove: () => onFiltersChange({ ...filters, fundingStage: undefined }),
      });
    }
    if (filters.targetMarkets && filters.targetMarkets.length > 0) {
      filters.targetMarkets.forEach(market => {
        const marketOption = MARKET_OPTIONS.find(m => m.code === market);
        active.push({
          label: 'Market',
          value: marketOption?.label || market,
          onRemove: () => {
            const newMarkets = filters.targetMarkets?.filter(m => m !== market);
            onFiltersChange({
              ...filters,
              targetMarkets: newMarkets && newMarkets.length > 0 ? newMarkets : undefined,
            });
          },
        });
      });
    }
    if (filters.investorStatus) {
      const status = STATUS_OPTIONS.find(s => s.value === filters.investorStatus);
      active.push({
        label: 'Status',
        value: status?.label || filters.investorStatus,
        onRemove: () => onFiltersChange({ ...filters, investorStatus: undefined }),
      });
    }
    if (filters.timeFilter) {
      const time = TIME_FILTER_OPTIONS.find(t => t.value === filters.timeFilter);
      active.push({
        label: 'Added',
        value: time?.label || filters.timeFilter,
        onRemove: () => onFiltersChange({ ...filters, timeFilter: undefined }),
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  const clearAllFilters = () => {
    onFiltersChange({ dealCategory: filters.dealCategory });
    onSearchChange('');
  };

  return (
    <div className="space-y-4">
      {/* Deal Category Tabs - Reordered: Public, My Portfolio, Invited, All Deals */}
      <Tabs
        value={filters.dealCategory || 'public'}
        onValueChange={(value) => onFiltersChange({ ...filters, dealCategory: value as DealCategory })}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="portfolio" className="gap-2">
            <Star className="h-4 w-4" />
            My Portfolio
          </TabsTrigger>
          <TabsTrigger value="invited" className="gap-2">
            <Lock className="h-4 w-4" />
            Invited {invitedCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{invitedCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="public" className="gap-2">
            <Globe className="h-4 w-4" />
            Public
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Briefcase className="h-4 w-4" />
            All Deals
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Card */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies, devices, or value propositions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Active Filters and Add Filter Button */}
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, idx) => (
            <ActiveFilterTag
              key={`${filter.label}-${filter.value}-${idx}`}
              label={filter.label}
              value={filter.value}
              onRemove={filter.onRemove}
            />
          ))}

          <AddFilterButton filters={filters} onFiltersChange={onFiltersChange} />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Viability Score Slider */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">
            Min. Viability Score: {filters.viabilityScoreMin || 0}
          </Label>
          <Slider
            value={[filters.viabilityScoreMin || 0]}
            onValueChange={([value]) => onFiltersChange({
              ...filters,
              viabilityScoreMin: value > 0 ? value : undefined
            })}
            max={100}
            step={10}
            className="flex-1 max-w-xs"
          />
        </div>
      </div>
    </div>
  );
}
