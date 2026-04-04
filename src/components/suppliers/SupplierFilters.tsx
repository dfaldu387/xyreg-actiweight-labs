import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';

interface SupplierFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  criticalityFilter: string;
  onCriticalityFilterChange: (value: string) => void;
  supplierTypeFilter: string;
  onSupplierTypeFilterChange: (value: string) => void;
}

export function SupplierFilters({
  statusFilter,
  onStatusFilterChange,
  criticalityFilter,
  onCriticalityFilterChange,
  supplierTypeFilter,
  onSupplierTypeFilterChange,
}: SupplierFiltersProps) {
  const { lang } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="status-filter">{lang('suppliers.filters.status.label')}</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger id="status-filter">
            <SelectValue placeholder={lang('suppliers.filters.status.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('suppliers.filters.status.all')}</SelectItem>
            <SelectItem value="Approved">{lang('suppliers.filters.status.approved')}</SelectItem>
            <SelectItem value="Probationary">{lang('suppliers.filters.status.probationary')}</SelectItem>
            <SelectItem value="Disqualified">{lang('suppliers.filters.status.disqualified')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="criticality-filter">{lang('suppliers.filters.criticality.label')}</Label>
        <Select value={criticalityFilter} onValueChange={onCriticalityFilterChange}>
          <SelectTrigger id="criticality-filter">
            <SelectValue placeholder={lang('suppliers.filters.criticality.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('suppliers.filters.criticality.all')}</SelectItem>
            <SelectItem value="Critical">{lang('suppliers.filters.criticality.critical')}</SelectItem>
            <SelectItem value="Non-Critical">{lang('suppliers.filters.criticality.nonCritical')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier-type-filter">{lang('suppliers.filters.type.label')}</Label>
        <Select value={supplierTypeFilter} onValueChange={onSupplierTypeFilterChange}>
          <SelectTrigger id="supplier-type-filter">
            <SelectValue placeholder={lang('suppliers.filters.type.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('suppliers.filters.type.all')}</SelectItem>
            <SelectItem value="Component Supplier">{lang('suppliers.filters.type.componentSupplier')}</SelectItem>
            <SelectItem value="Raw Material Supplier">{lang('suppliers.filters.type.rawMaterialSupplier')}</SelectItem>
            <SelectItem value="Service Provider">{lang('suppliers.filters.type.serviceProvider')}</SelectItem>
            <SelectItem value="Consultant">{lang('suppliers.filters.type.consultant')}</SelectItem>
            <SelectItem value="CMO / CDMO">{lang('suppliers.filters.type.cmoCdmo')}</SelectItem>
            <SelectItem value="Other">{lang('suppliers.filters.type.other')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}