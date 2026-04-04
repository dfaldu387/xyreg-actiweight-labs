import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CheckSquare, Square } from 'lucide-react';

interface DeviceSelectionControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCount: number;
  totalCount: number;
  filteredCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectByRiskClass: (riskClass: string) => void;
  riskClassFilter: string;
  onRiskClassFilterChange: (riskClass: string) => void;
  availableRiskClasses: string[];
}

export function DeviceSelectionControls({
  searchTerm,
  onSearchChange,
  selectedCount,
  totalCount,
  filteredCount,
  onSelectAll,
  onDeselectAll,
  onSelectByRiskClass,
  riskClassFilter,
  onRiskClassFilterChange,
  availableRiskClasses
}: DeviceSelectionControlsProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="device-search" className="sr-only">Search devices</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="device-search"
              type="text"
              placeholder="Search devices by name, model, UDI-DI..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="sm:w-48">
          <Label htmlFor="risk-class-filter" className="sr-only">Filter by risk class</Label>
          <Select value={riskClassFilter} onValueChange={onRiskClassFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Risk Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Classes</SelectItem>
              {availableRiskClasses.map((riskClass) => (
                <SelectItem key={riskClass} value={riskClass}>
                  {riskClass === "class-i" || riskClass === "class_i" ? "Class I" : riskClass === "class-ii" || riskClass === "class_ii" ? "Class II" : riskClass === "class-iia" || riskClass === "class-2a" || riskClass === "class_iia" ? "Class IIa" : riskClass === "class-iib" || riskClass === "class-2b" || riskClass === "class_iib" ? "Class IIb" : riskClass === "class-iii" || riskClass === "class_iii" ? "Class III" : riskClass}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection Stats and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {selectedCount} of {filteredCount} selected
          </Badge>
          
          {filteredCount !== totalCount && (
            <Badge variant="secondary" className="text-sm">
              {filteredCount} of {totalCount} shown
            </Badge>
          )}
          
          {selectedCount > 100 && (
            <Badge variant="destructive" className="text-sm">
              Large selection
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={selectedCount === filteredCount}
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Select All ({filteredCount})
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
          >
            <Square className="h-3 w-3 mr-1" />
            Deselect All
          </Button>
          
          {riskClassFilter === 'all' && availableRiskClasses.length > 0 && (
            <Select onValueChange={onSelectByRiskClass}>
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="Select by Risk Class" />
              </SelectTrigger>
              <SelectContent>
                {availableRiskClasses.map((riskClass) => (
                  <SelectItem key={riskClass} value={riskClass}>
                    Select All {riskClass === "class-i" || riskClass === "class_i" ? "Class I" : riskClass === "class-ii" || riskClass === "class_ii" ? "Class II" : riskClass === "class-iia" || riskClass === "class-2a" || riskClass === "class_iia" ? "Class IIa" : riskClass === "class-iib" || riskClass === "class-2b" || riskClass === "class_iib" ? "Class IIb" : riskClass === "class-iii" || riskClass === "class_iii" ? "Class III" : riskClass}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Warning for large selections */}
      {selectedCount > 500 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>Large Selection Warning:</strong> You're about to import {selectedCount} products. 
            This may take several minutes to complete.
          </p>
        </div>
      )}
    </div>
  );
}