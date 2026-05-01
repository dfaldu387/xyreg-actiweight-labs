import React, { useState } from 'react';
import { Search, Filter, X, Check, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TemplateFilters } from '@/types/templateManagement';
import { cn } from '@/lib/utils';
import { DEFAULT_SUB_PREFIXES } from '@/types/documentCategories';

interface TemplateFilterBarProps {
  filters: TemplateFilters;
  onFiltersChange: (filters: TemplateFilters) => void;
}

type Category = 'scope' | 'docType' | 'classification' | 'subPrefix';

const SCOPE_OPTIONS: Array<{ value: 'company-wide' | 'product-specific'; label: string }> = [
  { value: 'company-wide', label: 'Company-wide' },
  { value: 'product-specific', label: 'Product-specific' },
];

const TYPE_OPTIONS: string[] = ['SOP', 'Form', 'List', 'Certificate'];

const TIER_OPTIONS: Array<{ value: 'A' | 'B' | 'C'; label: string }> = [
  { value: 'A', label: 'Foundation' },
  { value: 'B', label: 'Pathway' },
  { value: 'C', label: 'Device-specific' },
];

const CATEGORIES: Array<{ key: Category; label: string }> = [
  { key: 'scope', label: 'Scope' },
  { key: 'docType', label: 'Document type' },
  { key: 'classification', label: 'Tier' },
  { key: 'subPrefix', label: 'Sub-prefix' },
];

/**
 * Documents-style "Search and filter" popover for the Template Library.
 * Mirrors EnhancedDocumentFilters: a single trigger button opens a popover
 * with an in-popover search input and a drill-down category list.
 */
export function TemplateFilterBar({ filters, onFiltersChange }: TemplateFilterBarProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categorySearch, setCategorySearch] = useState('');

  const scopes = filters.scopes ?? [];
  const types = filters.documentTypes ?? [];
  const tiers = filters.tiers ?? [];
  const subPrefixes = filters.subPrefixes ?? [];

  const totalActive = scopes.length + types.length + tiers.length + subPrefixes.length;
  const hasAny = totalActive > 0 || !!filters.search;

  const toggle = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const setScopes = (next: typeof scopes) =>
    onFiltersChange({ ...filters, scopes: next.length ? next : undefined });
  const setTypes = (next: typeof types) =>
    onFiltersChange({ ...filters, documentTypes: next.length ? next : undefined });
  const setTiers = (next: typeof tiers) =>
    onFiltersChange({ ...filters, tiers: next.length ? next : undefined });
  const setSubPrefixes = (next: typeof subPrefixes) =>
    onFiltersChange({ ...filters, subPrefixes: next.length ? next : undefined });

  const clearAll = () =>
    onFiltersChange({
      ...filters,
      search: '',
      scopes: undefined,
      documentTypes: undefined,
      tiers: undefined,
      subPrefixes: undefined,
    });

  const filteredCategories = CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const renderCheckRow = (key: string, label: string, checked: boolean, onClick: () => void) => (
    <button
      key={key}
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
    >
      <div
        className={cn(
          'w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center',
          checked ? 'bg-primary border-primary' : 'border-input'
        )}
      >
        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );

  const renderCategoryView = () => {
    if (!activeCategory) {
      return (
        <div className="space-y-1">
          {filteredCategories.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                setActiveCategory(c.key);
                setCategorySearch('');
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              {c.label}
            </button>
          ))}
          {filteredCategories.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No filters found</div>
          )}
        </div>
      );
    }

    if (activeCategory === 'scope') {
      const opts = SCOPE_OPTIONS.filter((o) =>
        o.label.toLowerCase().includes(categorySearch.toLowerCase())
      );
      return (
        <div className="space-y-1">
          {opts.map((o) =>
            renderCheckRow(o.value, o.label, scopes.includes(o.value), () =>
              setScopes(toggle(scopes, o.value))
            )
          )}
        </div>
      );
    }

    if (activeCategory === 'docType') {
      const opts = TYPE_OPTIONS.filter((t) =>
        t.toLowerCase().includes(categorySearch.toLowerCase())
      );
      return (
        <div className="space-y-1">
          {opts.map((t) =>
            renderCheckRow(t, t, types.includes(t), () => setTypes(toggle(types, t)))
          )}
        </div>
      );
    }

    if (activeCategory === 'classification') {
      const opts = TIER_OPTIONS.filter((o) =>
        o.label.toLowerCase().includes(categorySearch.toLowerCase())
      );
      return (
        <div className="space-y-1">
          {opts.map((o) =>
            renderCheckRow(o.value, o.label, tiers.includes(o.value), () =>
              setTiers(toggle(tiers, o.value))
            )
          )}
        </div>
      );
    }

    // subPrefix
    const q = categorySearch.toLowerCase();
    const spOpts = DEFAULT_SUB_PREFIXES.filter(
      (sp) => sp.code.toLowerCase().includes(q) || sp.label.toLowerCase().includes(q)
    );
    return (
      <div className="space-y-1">
        {spOpts.map((sp) =>
          renderCheckRow(
            sp.code,
            `${sp.code} — ${sp.label}`,
            subPrefixes.includes(sp.code),
            () => setSubPrefixes(toggle(subPrefixes, sp.code))
          )
        )}
      </div>
    );
  };

  const activeCategoryLabel = activeCategory
    ? CATEGORIES.find((c) => c.key === activeCategory)?.label
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setActiveCategory(null);
              setCategorySearch('');
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-background">
              <Filter className="h-4 w-4" />
              Search and filter
              {totalActive > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {totalActive}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3 space-y-3">
            {/* In-popover search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeCategory ? 'Search…' : 'Search…'}
                value={activeCategory ? categorySearch : filters.search || ''}
                onChange={(e) => {
                  if (activeCategory) {
                    setCategorySearch(e.target.value);
                  } else {
                    onFiltersChange({ ...filters, search: e.target.value });
                  }
                }}
                className="pl-9 h-9"
              />
            </div>

            {/* Drill-in header */}
            {activeCategory && (
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setCategorySearch('');
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {activeCategoryLabel}
              </button>
            )}

            {renderCategoryView()}
          </PopoverContent>
        </Popover>

        {/* Active filter chips next to the button */}
        {scopes.map((s) => {
          const opt = SCOPE_OPTIONS.find((o) => o.value === s);
          return (
            <Badge key={`scope-${s}`} variant="secondary" className="gap-1 pr-1">
              Scope: {opt?.label ?? s}
              <button
                type="button"
                onClick={() => setScopes(scopes.filter((x) => x !== s))}
                className="rounded hover:bg-background/60 p-0.5"
                aria-label={`Remove ${opt?.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
        {types.map((t) => (
          <Badge key={`type-${t}`} variant="secondary" className="gap-1 pr-1">
            Type: {t}
            <button
              type="button"
              onClick={() => setTypes(types.filter((x) => x !== t))}
              className="rounded hover:bg-background/60 p-0.5"
              aria-label={`Remove ${t} filter`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {tiers.map((tier) => {
          const opt = TIER_OPTIONS.find((o) => o.value === tier);
          return (
            <Badge key={`tier-${tier}`} variant="secondary" className="gap-1 pr-1">
              Tier: {opt?.label ?? tier}
              <button
                type="button"
                onClick={() => setTiers(tiers.filter((x) => x !== tier))}
                className="rounded hover:bg-background/60 p-0.5"
                aria-label={`Remove ${opt?.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
        {subPrefixes.map((sp) => {
          const opt = DEFAULT_SUB_PREFIXES.find((o) => o.code === sp);
          return (
            <Badge key={`sp-${sp}`} variant="secondary" className="gap-1 pr-1">
              Sub-prefix: {opt?.label ?? sp}
              <button
                type="button"
                onClick={() => setSubPrefixes(subPrefixes.filter((x) => x !== sp))}
                className="rounded hover:bg-background/60 p-0.5"
                aria-label={`Remove ${opt?.label ?? sp} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
        {filters.search && (
          <Badge variant="secondary" className="gap-1 pr-1">
            Search: {filters.search}
            <button
              type="button"
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              className="rounded hover:bg-background/60 p-0.5"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {hasAny && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground ml-auto"
          >
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
