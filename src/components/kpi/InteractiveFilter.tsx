import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface InteractiveFilterProps {
  categories: FilterOption[];
  platforms: FilterOption[];
  modules: FilterOption[];
  phases: FilterOption[];
  selectedFilters: {
    category?: string;
    platform?: string;
    module?: string;
    phase?: string;
  };
  onFilterChange: (filterType: string, value: string | undefined) => void;
  onClearAll: () => void;
}

export function InteractiveFilter({
  categories,
  platforms,
  modules,
  phases,
  selectedFilters,
  onFilterChange,
  onClearAll,
}: InteractiveFilterProps) {
  const { lang } = useTranslation();
  const activeFiltersCount = Object.values(selectedFilters).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{lang('executiveKPI.portfolioFilters')}</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            {lang('executiveKPI.clearAll')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          value={selectedFilters.category || "all-categories"}
          onValueChange={(value) => onFilterChange("category", value === "all-categories" ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={lang('executiveKPI.deviceCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">{lang('executiveKPI.allCategories')}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedFilters.platform || "all-platforms"}
          onValueChange={(value) => onFilterChange("platform", value === "all-platforms" ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={lang('executiveKPI.platform')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-platforms">{lang('executiveKPI.allPlatforms')}</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform.id} value={platform.value}>
                {platform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedFilters.module || "all-modules"}
          onValueChange={(value) => onFilterChange("module", value === "all-modules" ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={lang('executiveKPI.moduleVariant')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-modules">{lang('executiveKPI.allModules')}</SelectItem>
            {modules.map((module) => (
              <SelectItem key={module.id} value={module.value}>
                {module.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedFilters.phase || "all-phases"}
          onValueChange={(value) => onFilterChange("phase", value === "all-phases" ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={lang('executiveKPI.developmentPhase')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-phases">{lang('executiveKPI.allPhases')}</SelectItem>
            {phases.map((phase) => (
              <SelectItem key={phase.id} value={phase.value}>
                {phase.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}