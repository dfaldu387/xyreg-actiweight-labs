import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyDeviceCategories } from "@/hooks/useCompanyDeviceCategories";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Monitor, Search, Loader2, AlertTriangle } from "lucide-react";
import { ItemExclusionScope } from "@/hooks/useInheritanceExclusion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InheritanceExclusionPopoverProps {
  companyId: string;
  currentProductId: string;
  itemId: string;
  exclusionScope: ItemExclusionScope;
  onScopeChange: (itemId: string, scope: ItemExclusionScope) => void | Promise<void>;
  totalProducts?: number;
  summaryText?: string;
  /** When set, only these product IDs can be selected (parent constraint for child items) */
  allowedProductIds?: string[];
  /** Product IDs excluded by parent — these devices are disabled in the popover */
  parentExcludedProductIds?: string[];
  /** When true, initial state (no scope data) defaults to only current device included (1/N).
   *  When false (default), initial state defaults to all devices included (N/N). */
  defaultCurrentDeviceOnly?: boolean;
  /** When set, only show these product IDs in the popover (family members only) */
  familyProductIds?: string[];
  /** When set, checkboxes are auto-checked for these product IDs (devices with matching values).
   *  Checking a new device and clicking Apply will copy the current device's value to it. */
  valueMatchingProductIds?: string[];
}

export function InheritanceExclusionPopover({
  companyId,
  currentProductId,
  itemId,
  exclusionScope,
  onScopeChange,
  totalProducts,
  summaryText,
  allowedProductIds,
  parentExcludedProductIds,
  defaultCurrentDeviceOnly = false,
  familyProductIds,
  valueMatchingProductIds,
}: InheritanceExclusionPopoverProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  // Snapshots captured before showing warning (survive popover close)
  const [pendingApplyScope, setPendingApplyScope] = useState<ItemExclusionScope | null>(null);
  const [pendingNewDeviceNames, setPendingNewDeviceNames] = useState<string[]>([]);
  const [pendingNewCategoryNames, setPendingNewCategoryNames] = useState<string[]>([]);

  // Detect when family-products data is being refetched (value recalculation after Apply)
  const familyProductsFetching = useIsFetching({ queryKey: ['family-products-scope-sync'] });
  const isRecalculating = !!valueMatchingProductIds && familyProductsFetching > 0;

  // Draft state — local copy that only gets committed on Apply
  const [draftScope, setDraftScope] = useState<ItemExclusionScope>(exclusionScope);

  // Fetch all products
  const { data: allProducts = [] } = useQuery({
    queryKey: ["company-products-with-category", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, device_category")
        .eq("company_id", companyId)
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; device_category: string | null }[];
    },
    enabled: !!companyId,
  });

  // When familyProductIds is provided, only show family members
  const products = useMemo(() => {
    if (!familyProductIds) return allProducts;
    const familySet = new Set(familyProductIds);
    return allProducts.filter(p => familySet.has(p.id));
  }, [allProducts, familyProductIds]);

  const { categories, loading: categoriesLoading } = useCompanyDeviceCategories(companyId);

  // When value matching is provided, derive excluded IDs from non-matching products
  const valueMatchExcludedIds = useMemo(() => {
    if (!valueMatchingProductIds) return undefined;
    const matchSet = new Set(valueMatchingProductIds);
    return products.filter(p => !matchSet.has(p.id)).map(p => p.id);
  }, [valueMatchingProductIds, products]);

  // Compute the effective initial scope: value-matching overrides exclusion scope
  const effectiveInitialScope = useMemo((): ItemExclusionScope => {
    if (valueMatchExcludedIds) {
      return { excludedProductIds: valueMatchExcludedIds, excludedCategories: [] };
    }
    return exclusionScope;
  }, [valueMatchExcludedIds, exclusionScope]);

  // Reset draft when popover opens or external scope changes while closed
  useEffect(() => {
    if (!isOpen) {
      setDraftScope(effectiveInitialScope);
    }
  }, [effectiveInitialScope, isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraftScope(effectiveInitialScope);
      setCategoryFilter("");
      setSearchQuery("");
    }
    setIsOpen(open);
  };

  // When no scope is set (initial state) and defaultCurrentDeviceOnly is true,
  // treat all other products as excluded (only current device included).
  // Otherwise, default to all devices included.
  const isInitialScope = !exclusionScope.excludedProductIds && !exclusionScope.excludedCategories && !exclusionScope.isManualGroup;
  const defaultExcludedIds = useMemo(() => {
    if (!isInitialScope || !defaultCurrentDeviceOnly) return undefined;
    return products.filter(p => p.id !== currentProductId).map(p => p.id);
  }, [isInitialScope, defaultCurrentDeviceOnly, products, currentProductId]);

  // Set of valid product IDs for filtering stale exclusion entries
  const productIdSet = useMemo(() => new Set(products.map(p => p.id)), [products]);

  // Use draft for UI — filter to only IDs in current product list
  const draftExcludedIds = useMemo(() => {
    const raw = draftScope.excludedProductIds ?? defaultExcludedIds ?? [];
    return raw.filter(id => productIdSet.has(id));
  }, [draftScope.excludedProductIds, defaultExcludedIds, productIdSet]);
  const draftExcludedCats = draftScope.excludedCategories || [];

  // Use committed scope for badge — when value matching is active, use it as source of truth
  const committedExcludedIds = useMemo(() => {
    if (valueMatchExcludedIds) {
      return valueMatchExcludedIds.filter(id => productIdSet.has(id));
    }
    const raw = exclusionScope.excludedProductIds ?? defaultExcludedIds ?? [];
    return raw.filter(id => productIdSet.has(id));
  }, [valueMatchExcludedIds, exclusionScope.excludedProductIds, defaultExcludedIds, productIdSet]);
  const committedExcludedCats = valueMatchExcludedIds ? [] : (exclusionScope.excludedCategories || []);

  const getCategoryProductIds = useMemo(() => {
    return (catName: string) => {
      const normalized = catName.trim().toLowerCase();
      return products
        .filter(p => (p.device_category || '').trim().toLowerCase() === normalized)
        .map(p => p.id);
    };
  }, [products]);

  // Filter products by category
  const displayProducts = useMemo(() => {
    let list = categoryFilter
      ? products.filter(p => p.device_category === categoryFilter)
      : products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.id === currentProductId) return -1;
      if (b.id === currentProductId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, categoryFilter, currentProductId, searchQuery]);

  const effectiveTotal = parentExcludedProductIds
    ? products.filter(p => !parentExcludedProductIds.includes(p.id)).length
    : products.length;
  const maxAllowed = allowedProductIds ? allowedProductIds.length : effectiveTotal;
  const activeCount = allowedProductIds
    ? allowedProductIds.filter(id => !committedExcludedIds.includes(id)).length
    : parentExcludedProductIds
      ? products.filter(p => !parentExcludedProductIds.includes(p.id) && !committedExcludedIds.includes(p.id)).length
      : products.length - committedExcludedIds.length;
  const hasExclusions = committedExcludedIds.length > 0 || committedExcludedCats.length > 0;

  // Check if draft differs from committed scope
  const hasPendingChanges = useMemo(() => {
    const sortedDraftIds = [...draftExcludedIds].sort();
    const sortedCommittedIds = [...committedExcludedIds].sort();
    if (sortedDraftIds.length !== sortedCommittedIds.length) return true;
    if (sortedDraftIds.some((id, i) => id !== sortedCommittedIds[i])) return true;
    const sortedDraftCats = [...draftExcludedCats].sort();
    const sortedCommittedCats = [...committedExcludedCats].sort();
    if (sortedDraftCats.length !== sortedCommittedCats.length) return true;
    if (sortedDraftCats.some((c, i) => c !== sortedCommittedCats[i])) return true;
    return false;
  }, [draftExcludedIds, committedExcludedIds, draftExcludedCats, committedExcludedCats]);

  // Detect newly included devices (were excluded, now included in draft)
  const newlyIncludedProducts = useMemo(() => {
    return committedExcludedIds.filter(id => !draftExcludedIds.includes(id));
  }, [committedExcludedIds, draftExcludedIds]);

  // Detect newly included categories (were excluded, now included in draft)
  const newlyIncludedCategories = useMemo(() => {
    return committedExcludedCats.filter(c =>
      !draftExcludedCats.some(dc => dc.trim().toLowerCase() === c.trim().toLowerCase())
    );
  }, [committedExcludedCats, draftExcludedCats]);

  const hasNewInclusions = newlyIncludedProducts.length > 0 || newlyIncludedCategories.length > 0;

  // At least one device must be selected
  const draftIncludedCount = products.length - draftExcludedIds.length;
  const noneSelected = draftIncludedCount < 1;

  // Names of newly included devices for the warning message
  const newlyIncludedProductNames = useMemo(() => {
    return newlyIncludedProducts
      .map(id => products.find(p => p.id === id)?.name)
      .filter(Boolean) as string[];
  }, [newlyIncludedProducts, products]);

  // --- Draft handlers (local only, no DB call) ---

  const handleProductToggle = (productId: string, included: boolean) => {
    const newExcluded = included
      ? draftExcludedIds.filter(id => id !== productId)
      : [...draftExcludedIds, productId];
    setDraftScope({ ...draftScope, excludedProductIds: newExcluded });
  };

  const handleSelectAll = () => {
    // When parent constraint active, only select allowed products
    if (allowedProductIds) {
      const disallowedIds = products.filter(p => !allowedProductIds.includes(p.id)).map(p => p.id);
      setDraftScope({ ...draftScope, excludedProductIds: disallowedIds });
    } else if (parentExcludedProductIds) {
      // Keep parent-excluded devices excluded
      setDraftScope({ ...draftScope, excludedProductIds: [...parentExcludedProductIds] });
    } else {
      setDraftScope({ ...draftScope, excludedProductIds: [] });
    }
  };

  const handleDeselectAll = () => {
    setDraftScope({
      ...draftScope,
      excludedProductIds: products.map(p => p.id),
    });
  };

  const handleCategoryExclude = (catName: string, exclude: boolean) => {
    const normalized = catName.trim().toLowerCase();
    const catProductIds = getCategoryProductIds(catName);

    let newExcludedCats = [...draftExcludedCats];
    let newExcludedIds = [...draftExcludedIds];

    if (exclude) {
      if (!newExcludedCats.some(c => c.trim().toLowerCase() === normalized)) {
        newExcludedCats.push(catName);
      }
      catProductIds.forEach(id => {
        if (!newExcludedIds.includes(id)) newExcludedIds.push(id);
      });
    } else {
      newExcludedCats = newExcludedCats.filter(c => c.trim().toLowerCase() !== normalized);
      newExcludedIds = newExcludedIds.filter(id => !catProductIds.includes(id));
    }

    setDraftScope({
      excludedProductIds: newExcludedIds,
      excludedCategories: newExcludedCats,
    });
  };

  // --- Apply: commit draft to parent + DB ---

  const doApply = useCallback(async (scopeOverride?: ItemExclusionScope) => {
    // Close popover immediately so badge spinner is visible during processing
    const source = scopeOverride || draftScope;
    const scopeToApply: ItemExclusionScope = { ...source, isManualGroup: true };

    const wasExcluded = committedExcludedIds.includes(currentProductId);
    const nowIncluded = !(scopeToApply.excludedProductIds || []).includes(currentProductId);
    const currentDeviceAdded = wasExcluded && nowIncluded;

    setIsOpen(false);
    setPendingApplyScope(null);
    setIsLoading(true);

    try {
      await onScopeChange(itemId, scopeToApply);

      if (currentDeviceAdded) {
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  }, [onScopeChange, itemId, draftScope, currentProductId, products]);

  const handleApply = useCallback(() => {
    if (hasNewInclusions) {
      // Snapshot everything before the warning dialog opens
      // (the popover may close and reset draftScope + computed values)
      setPendingApplyScope({ ...draftScope });
      setPendingNewDeviceNames([...newlyIncludedProductNames]);
      setPendingNewCategoryNames([...newlyIncludedCategories]);
      setShowOverwriteWarning(true);
    } else {
      doApply();
    }
  }, [hasNewInclusions, doApply, draftScope, newlyIncludedProductNames, newlyIncludedCategories]);

  // Badge styling
  const isEffectivelyRestricted = hasExclusions || (defaultCurrentDeviceOnly && isInitialScope);
  const badgeClass = isEffectivelyRestricted
    ? "cursor-pointer hover:bg-amber-100 border-amber-300 bg-amber-50 text-amber-700"
    : "cursor-pointer hover:bg-green-100 border-green-300 bg-green-50 text-green-700";

  const label = summaryText || (hasExclusions
    ? `${activeCount}/${maxAllowed}`
    : (defaultCurrentDeviceOnly && isInitialScope)
      ? `1/${maxAllowed}`
      : `${maxAllowed}/${maxAllowed}`);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Badge variant="outline" className={`text-xs ${isLoading ? 'cursor-wait border-blue-300 bg-blue-50 text-blue-700' : badgeClass}`}>
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isRecalculating ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {label}
            </span>
          ) : label}
        </Badge>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3 space-y-3 relative"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center rounded-md">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Device Applicability</h4>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleSelectAll}>
              All
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleDeselectAll}>
              None
            </Button>
          </div>
        </div>

        {/* Category filter */}
        {categoriesLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading categories...</span>
          </div>
        ) : categories.length > 0 ? (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Filter by category</Label>
              <Select value={categoryFilter || "__all__"} onValueChange={v => setCategoryFilter(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category-level exclusion toggles */}
            {!categoryFilter && (
              <div className="space-y-1 border-b pb-2">
                <Label className="text-xs text-muted-foreground">Exclude entire category</Label>
                {categories.map(cat => {
                  const catProductIds = getCategoryProductIds(cat.name);
                  const isAllIncluded = catProductIds.length > 0 && catProductIds.every(id => !draftExcludedIds.includes(id));
                  return (
                    <label key={cat.id} className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-accent/50 cursor-pointer text-xs">
                      <Checkbox
                        checked={isAllIncluded}
                        onCheckedChange={(checked) => handleCategoryExclude(cat.name, checked !== true)}
                      />
                      <span>{cat.name}</span>
                      <span className="text-muted-foreground ml-auto">
                        ({catProductIds.length})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </>
        ) : null}

        {/* Recalculating indicator after Apply */}
        {isRecalculating && (
          <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-blue-50 border border-blue-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            <span className="text-xs text-blue-700">Updating device values...</span>
          </div>
        )}

        {/* Device checkboxes */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Devices</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs pl-7"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto border rounded-md p-1.5 space-y-0.5">
            {displayProducts.map(product => {
              const isIncluded = !draftExcludedIds.includes(product.id);
              const isDisabledByParent = (allowedProductIds && !allowedProductIds.includes(product.id))
                || (parentExcludedProductIds && parentExcludedProductIds.includes(product.id));
              return (
                <label
                  key={product.id}
                  className={`flex items-center gap-2 py-0.5 px-1 rounded text-xs ${isDisabledByParent ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer'}`}
                >
                  <Checkbox
                    checked={isIncluded && !isDisabledByParent}
                    disabled={!!isDisabledByParent}
                    onCheckedChange={(checked) => handleProductToggle(product.id, !!checked)}
                  />
                  <Monitor className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {product.name}
                    {product.id === currentProductId && (
                      <span className="text-muted-foreground ml-1">(current)</span>
                    )}
                  </span>
                  {product.device_category && (
                    <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                      {product.device_category}
                    </Badge>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Validation: at least one device must be selected */}
        {noneSelected && (
          <p className="text-xs text-destructive">At least one device must be selected.</p>
        )}

        {/* Apply button */}
        <Button
          size="sm"
          className="w-full h-7 text-xs"
          disabled={!hasPendingChanges || isLoading || noneSelected}
          onClick={handleApply}
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Apply
        </Button>
      </PopoverContent>

      {/* Overwrite warning when newly including devices/categories */}
      <AlertDialog open={showOverwriteWarning} onOpenChange={setShowOverwriteWarning}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Scope Change Warning
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  Adding new devices to this field's scope will overwrite their current values
                  with the scope value from the current device.
                </p>
                {pendingNewDeviceNames.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground text-sm mb-1">Newly added devices:</p>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {pendingNewDeviceNames.map(name => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {pendingNewCategoryNames.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground text-sm mb-1">Newly added categories:</p>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {pendingNewCategoryNames.map(cat => (
                        <li key={cat}>{cat}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-sm">
                  Are you sure you want to continue?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setPendingApplyScope(null); setPendingNewDeviceNames([]); setPendingNewCategoryNames([]); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.stopPropagation(); doApply(pendingApplyScope || undefined); }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Popover>
  );
}
