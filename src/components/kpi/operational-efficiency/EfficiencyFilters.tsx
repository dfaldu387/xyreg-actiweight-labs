import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { EfficiencyFilters as FiltersType } from "@/types/operationalEfficiency";

interface EfficiencyFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

const datePresets = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom Range' },
];

const productLines = [
  { value: 'all', label: 'All Product Lines' },
  { value: 'cardiac-devices', label: 'Cardiac Devices' },
  { value: 'orthopedic-implants', label: 'Orthopedic Implants' },
  { value: 'diagnostic-equipment', label: 'Diagnostic Equipment' },
  { value: 'surgical-instruments', label: 'Surgical Instruments' },
];

const facilities = [
  { value: 'all', label: 'All Facilities' },
  { value: 'facility-boston', label: 'Boston Manufacturing' },
  { value: 'facility-dublin', label: 'Dublin Assembly' },
  { value: 'facility-singapore', label: 'Singapore Production' },
  { value: 'facility-mexico', label: 'Mexico Operations' },
];

export function EfficiencyFilters({ filters, onFiltersChange }: EfficiencyFiltersProps) {
  const handleDatePresetChange = (preset: string) => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (preset) {
      case 'last7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'custom':
        return; // Don't change dates for custom
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    onFiltersChange({
      ...filters,
      dateRange: {
        start,
        end,
        preset: preset as any
      }
    });
  };

  const handleProductLineChange = (productLine: string) => {
    onFiltersChange({
      ...filters,
      productLine: productLine === 'all' ? undefined : productLine
    });
  };

  const handleFacilityChange = (facility: string) => {
    onFiltersChange({
      ...filters,
      facility: facility === 'all' ? undefined : facility
    });
  };

  const handleCustomDateChange = (field: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: date,
        preset: 'custom'
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex gap-2">
              {datePresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={filters.dateRange.preset === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDatePresetChange(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange.preset === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {format(filters.dateRange.start, 'MMM dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.start}
                    onSelect={(date) => handleCustomDateChange('start', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-sm text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {format(filters.dateRange.end, 'MMM dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.end}
                    onSelect={(date) => handleCustomDateChange('end', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Product Line Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Line</label>
            <Select 
              value={filters.productLine || 'all'} 
              onValueChange={handleProductLineChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select product line" />
              </SelectTrigger>
              <SelectContent>
                {productLines.map((line) => (
                  <SelectItem key={line.value} value={line.value}>
                    {line.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Facility Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Facility</label>
            <Select 
              value={filters.facility || 'all'} 
              onValueChange={handleFacilityChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.value} value={facility.value}>
                    {facility.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}