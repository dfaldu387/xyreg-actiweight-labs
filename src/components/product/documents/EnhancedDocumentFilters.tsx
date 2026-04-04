import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search, X, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DocumentUIStatus } from "@/utils/statusUtils";
import { cn } from "@/lib/utils";
import {
  SortByDateOption,
  VALID_STATUS_OPTIONS,
  SORT_OPTIONS_GROUPED,
  SORT_OPTION_LABELS,
} from "@/utils/documentFilterParams";

// Re-export for backwards compatibility
export type { SortByDateOption } from "@/utils/documentFilterParams";

interface EnhancedDocumentFiltersProps {
  statusFilter?: string[];
  onStatusFilterChange?: (status: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  // Phase filter
  phaseFilter?: string[];
  onPhaseFilterChange?: (phase: string) => void;
  filterAvailablePhases?: string[];
  // Author filter
  authorFilter?: string[];
  onAuthorFilterChange?: (authorId: string) => void;
  // Section filter
  sectionFilter?: string[];
  onSectionFilterChange?: (section: string) => void;
  availableSections?: string[];
  // Tag filter
  tagFilter?: string[];
  onTagFilterChange?: (tag: string) => void;
  availableTags?: string[];
  // Ref doc tag filter
  refTagFilter?: string[];
  onRefTagFilterChange?: (tag: string) => void;
  availableRefTags?: string[];
  // Document type filter
  docTypeFilter?: string[];
  onDocTypeFilterChange?: (docType: string) => void;
  availableDocTypes?: string[];
  // Tech applicability filter
  techApplicabilityFilter?: string[];
  onTechApplicabilityFilterChange?: (tech: string) => void;
  availableTechApplicabilities?: string[];
  // Scope filter
  scopeFilter?: string[];
  onScopeFilterChange?: (scope: string) => void;
  availableScopes?: string[];
  // Sort by date
  sortByDate?: SortByDateOption;
  onSortByDateChange?: (sort: SortByDateOption) => void;
  /** Restrict which sort options are shown (e.g. ['updated_newest', 'updated_oldest']) */
  availableSortOptions?: SortByDateOption[];
  clearAllFilters?: () => void;
  availableAuthors?: Array<{ id: string; name: string }>;
  availablePhases?: string[];
  availableStatuses?: string[];
  // Variant exclusion filter
  isVariant?: boolean;
  hideExcluded?: boolean;
  onHideExcludedChange?: (hide: boolean) => void;
}

// Use imported status options from utility
const statusOptions: DocumentUIStatus[] = [...VALID_STATUS_OPTIONS] as DocumentUIStatus[];

type FilterCategory = 'phase' | 'status' | 'author' | 'section' | 'tag' | 'refTag' | 'docType' | 'techApplicability' | 'scope' | 'sort';

interface FilterCategoryConfig {
  key: FilterCategory;
  label: string;
  available: boolean;
}

export function EnhancedDocumentFilters({
  statusFilter = [],
  onStatusFilterChange,
  searchQuery = "",
  onSearchChange,
  phaseFilter = [],
  onPhaseFilterChange,
  filterAvailablePhases = [],
  authorFilter = [],
  onAuthorFilterChange,
  sectionFilter = [],
  onSectionFilterChange,
  availableSections = [],
  tagFilter = [],
  onTagFilterChange,
  availableTags = [],
  refTagFilter = [],
  onRefTagFilterChange,
  availableRefTags = [],
  docTypeFilter = [],
  onDocTypeFilterChange,
  availableDocTypes = [],
  techApplicabilityFilter = [],
  onTechApplicabilityFilterChange,
  availableTechApplicabilities = [],
  scopeFilter = [],
  onScopeFilterChange,
  availableScopes = [],
  sortByDate = 'none',
  onSortByDateChange,
  availableSortOptions,
  clearAllFilters,
  availableAuthors = [],
  availablePhases = [],
  availableStatuses = [],
  isVariant = false,
  hideExcluded = false,
  onHideExcludedChange,
}: EnhancedDocumentFiltersProps) {

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(null);
  const [categorySearch, setCategorySearch] = useState("");

  const hasActiveFilters = statusFilter.length > 0 ||
    phaseFilter.length > 0 ||
    authorFilter.length > 0 ||
    sectionFilter.length > 0 ||
    tagFilter.length > 0 ||
    refTagFilter.length > 0 ||
    docTypeFilter.length > 0 ||
    techApplicabilityFilter.length > 0 ||
    scopeFilter.length > 0 ||
    sortByDate !== 'none' ||
    (searchQuery && searchQuery.length > 0);

  const filterCategories: FilterCategoryConfig[] = [
    { key: 'phase' as FilterCategory, label: 'Core / Phase', available: !!onPhaseFilterChange && filterAvailablePhases.length > 0 },
    { key: 'status' as FilterCategory, label: 'Document status', available: !!onStatusFilterChange },
    { key: 'docType' as FilterCategory, label: 'Document type', available: !!onDocTypeFilterChange && availableDocTypes.length > 0 },
    { key: 'techApplicability' as FilterCategory, label: 'Tech applicability', available: !!onTechApplicabilityFilterChange && availableTechApplicabilities.length > 0 },
    { key: 'scope' as FilterCategory, label: 'Scope', available: !!onScopeFilterChange && availableScopes.length > 0 },
    { key: 'author' as FilterCategory, label: 'Author', available: !!onAuthorFilterChange && availableAuthors.length > 0 },
    { key: 'section' as FilterCategory, label: 'Section', available: !!onSectionFilterChange && availableSections.length > 0 },
    { key: 'tag' as FilterCategory, label: 'Tag', available: !!onTagFilterChange && availableTags.length > 0 },
    { key: 'refTag' as FilterCategory, label: 'Ref Doc Tag', available: !!onRefTagFilterChange && availableRefTags.length > 0 },
    { key: 'sort' as FilterCategory, label: 'Sort by', available: !!onSortByDateChange },
  ].filter(cat => cat.available);

  const getActiveFilterChips = () => {
    const chips: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

    // Phase filters
    phaseFilter.forEach(phase => {
      if (onPhaseFilterChange) {
        chips.push({
          key: `phase-${phase}`,
          label: 'Core / Phase',
          value: phase === '__CORE__' ? 'Core' : phase,
          onRemove: () => onPhaseFilterChange(phase)
        });
      }
    });

    // Status filters
    statusFilter.forEach(status => {
      if (onStatusFilterChange) {
        chips.push({
          key: `status-${status}`,
          label: 'Status',
          value: status,
          onRemove: () => onStatusFilterChange(status)
        });
      }
    });

    // Author filters
    authorFilter.forEach(authorId => {
      const author = availableAuthors.find(a => a.id === authorId);
      if (author && onAuthorFilterChange) {
        chips.push({
          key: `author-${authorId}`,
          label: 'Author',
          value: author.name,
          onRemove: () => onAuthorFilterChange(authorId)
        });
      }
    });

    // Section filters
    sectionFilter.forEach(section => {
      if (onSectionFilterChange) {
        chips.push({
          key: `section-${section}`,
          label: 'Section',
          value: section,
          onRemove: () => onSectionFilterChange(section)
        });
      }
    });

    // Tag filters
    tagFilter.forEach(tag => {
      if (onTagFilterChange) {
        chips.push({
          key: `tag-${tag}`,
          label: 'Tag',
          value: tag,
          onRemove: () => onTagFilterChange(tag)
        });
      }
    });

    // Ref doc tag filters
    refTagFilter.forEach(tag => {
      if (onRefTagFilterChange) {
        chips.push({
          key: `refTag-${tag}`,
          label: 'Ref Doc Tag',
          value: tag,
          onRemove: () => onRefTagFilterChange(tag)
        });
      }
    });

    // Doc type filters
    docTypeFilter.forEach(dt => {
      if (onDocTypeFilterChange) {
        chips.push({
          key: `docType-${dt}`,
          label: 'Doc Type',
          value: dt,
          onRemove: () => onDocTypeFilterChange(dt)
        });
      }
    });

    // Scope filters
    scopeFilter.forEach(scope => {
      if (onScopeFilterChange) {
        chips.push({
          key: `scope-${scope}`,
          label: 'Scope',
          value: scope,
          onRemove: () => onScopeFilterChange(scope)
        });
      }
    });

    // Tech applicability filters
    techApplicabilityFilter.forEach(ta => {
      if (onTechApplicabilityFilterChange) {
        chips.push({
          key: `techApplicability-${ta}`,
          label: 'Tech',
          value: ta,
          onRemove: () => onTechApplicabilityFilterChange(ta)
        });
      }
    });

    // Sort filter
    if (sortByDate !== 'none' && onSortByDateChange) {
      chips.push({
        key: 'sort',
        label: 'Sort by',
        value: SORT_OPTION_LABELS[sortByDate] || sortByDate,
        onRemove: () => onSortByDateChange('none')
      });
    }

    // Hide Excluded chip
    if (hideExcluded && onHideExcludedChange) {
      chips.push({
        key: 'hideExcluded',
        label: 'Variant',
        value: 'Hide Excluded',
        onRemove: () => onHideExcludedChange(false)
      });
    }

    return chips;
  };

  const activeChips = getActiveFilterChips();

  // Filter options based on search
  const filteredPhaseOptions = filterAvailablePhases.filter(p =>
    p.toLowerCase() !== 'no phase' && p.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredStatusOptions = statusOptions.filter(s =>
    s.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAuthors = availableAuthors.filter(a =>
    a.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredTags = availableTags.filter(t =>
    t.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredRefTags = availableRefTags.filter(t =>
    t.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredSections = availableSections.filter(s =>
    s.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredDocTypes = availableDocTypes.filter(dt =>
    dt.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredTechApplicabilities = availableTechApplicabilities.filter(ta =>
    ta.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Use imported sort options from utility, optionally filtered
  // Transform grouped options into a flat list with group header entries (value=null)
  const rawSortOptions = availableSortOptions
    ? SORT_OPTIONS_GROUPED.filter(o => o.value === 'none' || availableSortOptions.includes(o.value as SortByDateOption))
    : SORT_OPTIONS_GROUPED;

  const sortOptions = (() => {
    const result: Array<{ value: string | null; label: string; group?: string }> = [];
    let lastGroup: string | undefined;
    rawSortOptions.forEach(option => {
      if (option.group && option.group !== lastGroup) {
        result.push({ value: null, label: option.group });
        lastGroup = option.group;
      }
      result.push(option);
    });
    return result;
  })();

  const filteredCategories = filterCategories.filter(cat =>
    cat.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleCategorySelect = (category: FilterCategory) => {
    setActiveCategory(category);
    setCategorySearch("");
  };

  const handleBackToCategories = () => {
    setActiveCategory(null);
    setCategorySearch("");
  };

  const renderCategoryOptions = () => {
    if (!activeCategory) {
      // Show filter categories list
      return (
        <div className="space-y-1">
          {isVariant && onHideExcludedChange && (
            <button
              onClick={() => onHideExcludedChange(!hideExcluded)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              <div className={cn(
                "w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center",
                hideExcluded ? "bg-primary border-primary" : "border-input"
              )}>
                {hideExcluded && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <span>Hide Excluded</span>
            </button>
          )}
          {isVariant && onHideExcludedChange && filteredCategories.length > 0 && (
            <hr className="border-border my-1" />
          )}
          {filteredCategories.map((category) => (
            <button
              key={category.key}
              onClick={() => handleCategorySelect(category.key)}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              {category.label}
            </button>
          ))}
          {filteredCategories.length === 0 && !isVariant && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No filters found
            </div>
          )}
        </div>
      );
    }

    // Show options for selected category
    switch (activeCategory) {
      case 'phase':
        const isPhaseChecked = (phase: string) =>
          phaseFilter.length === 0 || phaseFilter.includes(phase);

        const isCoreChecked = phaseFilter.includes('__CORE__');
        return (
          <TooltipProvider delayDuration={300}>
            <div className="space-y-1">
              <button
                onClick={() => onPhaseFilterChange?.('__CORE__')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center",
                  isCoreChecked ? "bg-primary border-primary" : "border-input"
                )}>
                  {isCoreChecked && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <span className="truncate">Core</span>
              </button>
              <hr className="border-border my-1" />
              {filteredPhaseOptions.map((phase) => (
                <Tooltip key={phase}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onPhaseFilterChange?.(phase)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <div className={cn(
                        "w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center",
                        isPhaseChecked(phase) ? "bg-primary border-primary" : "border-input"
                      )}>
                        {isPhaseChecked(phase) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="truncate">{phase}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>{phase}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {phaseFilter.length > 0 && (
                <button
                  onClick={() => onPhaseFilterChange?.('__CLEAR_ALL__')}
                  className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
                >
                  Choose All
                </button>
              )}
            </div>
          </TooltipProvider>
        );

      case 'status':
        const isStatusChecked = (status: string) =>
          statusFilter.length === 0 || statusFilter.includes(status);

        return (
          <div className="space-y-1">
            {filteredStatusOptions.map((status) => (
              <button
                key={status}
                onClick={() => onStatusFilterChange?.(status)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isStatusChecked(status) ? "bg-primary border-primary" : "border-input"
                )}>
                  {isStatusChecked(status) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {status}
              </button>
            ))}
            {statusFilter.length > 0 && (
              <button
                onClick={() => onStatusFilterChange?.('__SHOW_ALL__')}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
              >
                Choose All
              </button>
            )}
          </div>
        );

      case 'author':
        const isAuthorChecked = (authorId: string) =>
          authorFilter.length === 0 || authorFilter.includes(authorId);

        return (
          <div className="space-y-1">
            {filteredAuthors.map((author) => (
              <button
                key={author.id}
                onClick={() => onAuthorFilterChange?.(author.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isAuthorChecked(author.id) ? "bg-primary border-primary" : "border-input"
                )}>
                  {isAuthorChecked(author.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {author.name}
              </button>
            ))}
            {authorFilter.length > 0 && (
              <button
                onClick={() => {
                  authorFilter.forEach(id => onAuthorFilterChange?.(id));
                }}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
              >
                Choose All
              </button>
            )}
          </div>
        );

      case 'section':
        const isSectionChecked = (section: string) =>
          sectionFilter.length === 0 || sectionFilter.includes(section);

        return (
          <TooltipProvider delayDuration={300}>
            <div className="space-y-1">
              {filteredSections.map((section) => (
                <Tooltip key={section}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSectionFilterChange?.(section)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <div className={cn(
                        "w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center",
                        isSectionChecked(section) ? "bg-primary border-primary" : "border-input"
                      )}>
                        {isSectionChecked(section) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="truncate">{section}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>{section}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {sectionFilter.length > 0 && (
                <button
                  onClick={() => onSectionFilterChange?.('__CLEAR_ALL__')}
                  className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
                >
                  Choose All
                </button>
              )}
            </div>
          </TooltipProvider>
        );

      case 'tag':
        const isTagChecked = (tag: string) =>
          tagFilter.length === 0 || tagFilter.includes(tag);

        return (
          <div className="space-y-1">
            {filteredTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagFilterChange?.(tag)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isTagChecked(tag) ? "bg-primary border-primary" : "border-input"
                )}>
                  {isTagChecked(tag) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {tag}
              </button>
            ))}
            {tagFilter.length > 0 && (
              <button
                onClick={() => onTagFilterChange?.('__CLEAR_ALL__')}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
              >
                Choose All
              </button>
            )}
          </div>
        );

      case 'refTag':
        const isRefTagChecked = (tag: string) =>
          refTagFilter.length === 0 || refTagFilter.includes(tag);

        return (
          <div className="space-y-1">
            {filteredRefTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onRefTagFilterChange?.(tag)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isRefTagChecked(tag) ? "bg-primary border-primary" : "border-input"
                )}>
                  {isRefTagChecked(tag) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {tag}
              </button>
            ))}
            {refTagFilter.length > 0 && (
              <button
                onClick={() => onRefTagFilterChange?.('__CLEAR_ALL__')}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
              >
                Choose All
              </button>
            )}
          </div>
        );

      case 'docType':
        const isDocTypeChecked = (dt: string) =>
          docTypeFilter.length === 0 || docTypeFilter.includes(dt);

        return (
          <div className="space-y-1">
            {filteredDocTypes.map((dt) => (
              <button
                key={dt}
                onClick={() => onDocTypeFilterChange?.(dt)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isDocTypeChecked(dt) ? "bg-primary border-primary" : "border-input"
                )}>
                  {isDocTypeChecked(dt) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {dt}
              </button>
            ))}
            {docTypeFilter.length > 0 && (
              <button
                onClick={() => onDocTypeFilterChange?.('__CLEAR_ALL__')}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
              >
                Choose All
              </button>
            )}
          </div>
        );

      case 'techApplicability':
        const isTechChecked = (ta: string) =>
          techApplicabilityFilter.length === 0 || techApplicabilityFilter.includes(ta);

        return (
          <div className="space-y-1">
            {filteredTechApplicabilities.map((ta) => (
              <button
                key={ta}
                onClick={() => onTechApplicabilityFilterChange?.(ta)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isTechChecked(ta) ? "bg-primary border-primary" : "border-input"
                )}>
                  {isTechChecked(ta) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {ta}
              </button>
            ))}
            {techApplicabilityFilter.length > 0 && (
              <button
                onClick={() => onTechApplicabilityFilterChange?.('__CLEAR_ALL__')}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
              >
                Choose All
              </button>
            )}
          </div>
        );

      case 'scope':
        const isScopeChecked = (scope: string) =>
          scopeFilter.length === 0 || scopeFilter.includes(scope);

        const filteredScopes = availableScopes.filter(s =>
          s.toLowerCase().includes(categorySearch.toLowerCase())
        );

        return (
          <div className="space-y-1">
            {filteredScopes.map((scope) => (
              <button
                key={scope}
                onClick={() => onScopeFilterChange?.(scope)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <div className={cn(
                  "w-4 h-4 border rounded flex items-center justify-center",
                  isScopeChecked(scope) ? "bg-primary border-primary" : "border-input"
                )}>
                  {isScopeChecked(scope) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                {scope}
              </button>
            ))}
            {scopeFilter.length > 0 && (
              <button
                onClick={() => onScopeFilterChange?.('__CLEAR_ALL__')}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:underline"
              >
                Choose All
              </button>
            )}
          </div>
        );

      case 'sort':
        return (
          <div className="space-y-1">
            {sortOptions.map((option, index) => {
              // Show group header
              if (option.value === null) {
                return (
                  <React.Fragment key={`group-${index}`}>
                    {index > 0 && <hr className="border-border my-1" />}
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {option.label}
                    </div>
                  </React.Fragment>
                );
              }

              return (
                <button
                  key={option.value}
                  onClick={() => onSortByDateChange?.(option.value as SortByDateOption)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  <div className={cn(
                    "w-4 h-4 border rounded-full flex items-center justify-center",
                    sortByDate === option.value ? "bg-primary border-primary" : "border-input"
                  )}>
                    {sortByDate === option.value && (
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  {option.label}
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Main Filter Popover - rendered first so chips don't shift its position */}
      <Popover open={isFilterOpen} onOpenChange={(open) => {
        setIsFilterOpen(open);
        if (!open) {
          setActiveCategory(null);
          setCategorySearch("");
        }
      }}>
        <PopoverTrigger asChild>
          {activeChips.length === 0 ? (
            <Button variant="outline" className="flex items-center gap-2 bg-background">
              <Filter className="h-4 w-4" />
              <span>Search and filter</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 bg-background">
              <span>Add filter</span>
              <span className="text-lg leading-none">+</span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" side="bottom" avoidCollisions={false} className="w-72 p-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={activeCategory ? categorySearch : (onSearchChange ? searchQuery : categorySearch)}
                onChange={(e) => {
                  if (activeCategory) {
                    setCategorySearch(e.target.value);
                  } else if (onSearchChange) {
                    onSearchChange(e.target.value);
                  } else {
                    setCategorySearch(e.target.value);
                  }
                }}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {activeCategory && (
            <div className="px-3 py-2 border-b flex items-center gap-2">
              <button
                onClick={handleBackToCategories}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
              <span className="text-sm font-medium">
                {filterCategories.find(c => c.key === activeCategory)?.label}
              </span>
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto p-2">
            {renderCategoryOptions()}
          </div>
        </PopoverContent>
      </Popover>

      {/* Search Query Chip */}
      {searchQuery && searchQuery.length > 0 && onSearchChange && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-md text-sm">
          <Search className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Search:</span>
          <span className="font-medium max-w-[150px] truncate">{searchQuery}</span>
          <button
            onClick={() => onSearchChange('')}
            className="ml-0.5 hover:bg-accent rounded p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Active Filter Chips - after trigger so they don't shift it */}
      {activeChips.map((chip) => (
        <div
          key={chip.key}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md text-sm"
        >
          <span className="text-muted-foreground">{chip.label}:</span>
          <span className="font-medium">{chip.value}</span>
          <button
            onClick={chip.onRemove}
            className="ml-0.5 hover:bg-accent rounded p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Clear All button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onSearchChange?.('');
            if (phaseFilter.length > 0) {
              onPhaseFilterChange?.('__CLEAR_ALL__');
            }
            if (statusFilter.length > 0) {
              onStatusFilterChange?.('__SHOW_ALL__');
            }
            if (sectionFilter.length > 0) {
              onSectionFilterChange?.('__CLEAR_ALL__');
            }
            if (tagFilter.length > 0) {
              onTagFilterChange?.('__CLEAR_ALL__');
            }
            if (docTypeFilter.length > 0) {
              onDocTypeFilterChange?.('__CLEAR_ALL__');
            }
            if (techApplicabilityFilter.length > 0) {
              onTechApplicabilityFilterChange?.('__CLEAR_ALL__');
            }
            if (scopeFilter.length > 0) {
              onScopeFilterChange?.('__CLEAR_ALL__');
            }
            if (sortByDate !== 'none') {
              onSortByDateChange?.('none');
            }
            clearAllFilters?.();
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
