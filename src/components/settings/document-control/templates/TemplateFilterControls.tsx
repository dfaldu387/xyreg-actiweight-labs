import React from 'react';
import { Search, Filter, Building, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TemplateFilters, TEMPLATE_CATEGORIES } from '@/types/templateManagement';
import { useTranslation } from '@/hooks/useTranslation';

interface TemplateFilterControlsProps {
  filters: TemplateFilters;
  onFiltersChange: (filters: TemplateFilters) => void;
}

export function TemplateFilterControls({
  filters,
  onFiltersChange
}: TemplateFilterControlsProps) {
  const { lang } = useTranslation();

  return (
    <div className="space-y-4 mb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={lang('templates.filters.searchPlaceholder')}
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{lang('templates.filters.label')}:</span>
        </div>

        {/* Template Scope Filter */}
        <Select value={filters.scope || 'all'} onValueChange={(value) =>
          onFiltersChange({ ...filters, scope: value === 'all' ? undefined : value as any })
        }>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={lang('templates.filters.scope')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('templates.filters.allScopes')}</SelectItem>
            <SelectItem value="company-wide">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                {lang('templates.filters.companyWide')}
              </div>
            </SelectItem>
            <SelectItem value="product-specific">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {lang('templates.filters.productSpecific')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Document Type Filter */}
        <Select value={filters.documentType || 'all'} onValueChange={(value) =>
          onFiltersChange({ ...filters, documentType: value === 'all' ? undefined : value as any })
        }>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={lang('templates.filters.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('templates.filters.allTypes')}</SelectItem>
            <SelectItem value="SOP">SOP</SelectItem>
            <SelectItem value="Form">{lang('templates.filters.form')}</SelectItem>
            <SelectItem value="List">{lang('templates.filters.list')}</SelectItem>
            <SelectItem value="Certificate">{lang('templates.filters.certificate')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Template Category Filter */}
        <Select value={filters.category || 'all'} onValueChange={(value) =>
          onFiltersChange({ ...filters, category: value === 'all' ? undefined : value as any })
        }>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={lang('templates.filters.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{lang('templates.filters.allCategories')}</SelectItem>
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
              <SelectItem key={key} value={key}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(filters.search || filters.scope || filters.category || filters.documentType) && (
          <button
            onClick={() => onFiltersChange({})}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {lang('templates.filters.clearFilters')}
          </button>
        )}
      </div>
    </div>
  );
}