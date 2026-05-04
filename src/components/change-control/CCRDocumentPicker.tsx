import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompanyDocumentMentions } from '@/hooks/useCompanyDocumentMentions';
import { formatSopDisplayId, getSopTier, compareSopDocuments, parseSopNumber } from '@/constants/sopAutoSeedTiers';
import { EnhancedDocumentFilters } from '@/components/product/documents/EnhancedDocumentFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { splitDocPrefix } from '@/utils/templateNameUtils';

interface CCRDocumentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  alreadyLinkedIds: string[];
  onConfirm: (ids: string[]) => void;
}

export function CCRDocumentPicker({
  open,
  onOpenChange,
  companyId,
  alreadyLinkedIds,
  onConfirm,
}: CCRDocumentPickerProps) {
  const items = useCompanyDocumentMentions(companyId, open);
  const [query, setQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string[]>([]);
  const [sectionFilter, setSectionFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<Array<'A' | 'B' | 'C'>>([]);
  const [sortBy, setSortBy] = useState<
    'number_asc' | 'number_desc' | 'ref_asc' | 'ref_desc' | 'name_asc' | 'name_desc'
  >('number_asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const linkedSet = useMemo(() => new Set(alreadyLinkedIds), [alreadyLinkedIds]);

  const availableDocTypes = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.document_type && s.add(i.document_type));
    return Array.from(s).sort();
  }, [items]);

  const availableSections = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.sub_section && s.add(i.sub_section));
    return Array.from(s).sort();
  }, [items]);

  const availableStatuses = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.status && s.add(i.status));
    return Array.from(s).sort();
  }, [items]);

  // Toggle helpers matching EnhancedDocumentFilters' single-value contract,
  // with the __CLEAR_ALL__ / __SHOW_ALL__ sentinels used by the Clear-all button.
  const toggleIn = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) => {
    if (v === '__CLEAR_ALL__' || v === '__SHOW_ALL__') {
      setter([]);
      return;
    }
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  // Prefer a proper document number / SOP key over any auto-generated
  // `DS-<uuid>` placeholder reference, so badges show "SOP-QA-002-FI"
  // instead of the raw fallback id.
  const referenceOf = (i: typeof items[number]) => {
    const ref = i.document_reference || '';
    const num = i.document_number || '';
    if (ref && /^DS-[0-9a-f-]{8,}/i.test(ref)) return num || ref;
    return ref || num;
  };
  // Resolve the canonical SOP key used by number-sort. Some rows store the
  // SOP id only in `document_number` (label is just the human title), so
  // fall back through every source we know of.
  const sopSortKey = (i: typeof items[number]) =>
    parseSopNumber(i.label) ||
    parseSopNumber(i.document_number) ||
    parseSopNumber(i.document_reference) ||
    i.label ||
    i.document_number ||
    '';

  // Strip redundant prefix already shown in the badge (e.g. "SOP-001 ").
  const displayName = (i: typeof items[number]) => {
    const { title } = splitDocPrefix(i.label || '');
    return title || i.label || '';
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) => {
      if (docTypeFilter.length > 0 && !docTypeFilter.includes(i.document_type || '')) return false;
      if (sectionFilter.length > 0 && !sectionFilter.includes(i.sub_section || '')) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(i.status || '')) return false;
      if (tierFilter.length > 0) {
        const t = getSopTier(i.label, i.document_number);
        if (!t || !tierFilter.includes(t)) return false;
      }
      if (!q) return true;
      const displayRef = formatSopDisplayId(referenceOf(i));
      return [i.label, displayName(i), i.document_reference, i.document_number, displayRef, i.document_type, i.sub_section]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
    const refOf = (i: typeof items[number]) =>
      formatSopDisplayId(referenceOf(i)) || '';
    const nameOf = (i: typeof items[number]) => displayName(i).toLowerCase();
    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'number_asc': return compareSopDocuments(sopSortKey(a), sopSortKey(b));
        case 'number_desc': return -compareSopDocuments(sopSortKey(a), sopSortKey(b));
        case 'ref_desc': return refOf(b).localeCompare(refOf(a));
        case 'name_asc': return nameOf(a).localeCompare(nameOf(b));
        case 'name_desc': return nameOf(b).localeCompare(nameOf(a));
        case 'ref_asc':
        default: return refOf(a).localeCompare(refOf(b));
      }
    });
    return sorted;
  }, [items, query, docTypeFilter, sectionFilter, statusFilter, tierFilter, sortBy]);

  // Group by sub_section for the document-control style layout
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((i) => {
      const k = i.sub_section || 'General';
      if (!map.has(k)) map.set(k, [] as any);
      (map.get(k) as any).push(i);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Master select-all over currently filtered, non-linked rows
  const selectableIds = useMemo(
    () => filtered.filter((i) => !linkedSet.has(i.id)).map((i) => i.id),
    [filtered, linkedSet]
  );
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selectableIds.some((id) => selected.has(id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    setSelected(new Set());
    setQuery('');
    setDocTypeFilter([]);
    setSectionFilter([]);
    setStatusFilter([]);
    setTierFilter([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Connect documents</DialogTitle>
        </DialogHeader>

        <EnhancedDocumentFilters
          searchQuery={query}
          onSearchChange={setQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={toggleIn(setStatusFilter)}
          availableStatuses={availableStatuses}
          docTypeFilter={docTypeFilter}
          onDocTypeFilterChange={toggleIn(setDocTypeFilter)}
          availableDocTypes={availableDocTypes}
          sectionFilter={sectionFilter}
          onSectionFilterChange={toggleIn(setSectionFilter)}
          availableSections={availableSections}
          tierFilter={tierFilter}
          onTierFilterChange={(t) => {
            setTierFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
          }}
          clearAllFilters={() => {
            setQuery('');
            setDocTypeFilter([]);
            setSectionFilter([]);
            setStatusFilter([]);
            setTierFilter([]);
          }}
        />

        {/* Master select-all + sort row */}
        <div className="flex items-center justify-between gap-3 px-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={toggleAll}
              disabled={selectableIds.length === 0}
            />
            <span className="text-muted-foreground">
              {allSelected ? 'Deselect all' : 'Select all'}
              {filtered.length > 0 && ` (${selectableIds.length})`}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number_asc">Number (001 → 999)</SelectItem>
                <SelectItem value="number_desc">Number (999 → 001)</SelectItem>
                <SelectItem value="ref_asc">Reference (A→Z)</SelectItem>
                <SelectItem value="ref_desc">Reference (Z→A)</SelectItem>
                <SelectItem value="name_asc">Name (A→Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z→A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="h-[420px] border rounded-md">
          {grouped.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No matching documents.</p>
          ) : (
            grouped.map(([section, docs]) => (
              <div key={section}>
                <div className="sticky top-0 bg-muted/60 backdrop-blur px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  {section}
                </div>
                <div className="divide-y">
                  {docs.map((item) => {
                    const already = linkedSet.has(item.id);
                    const checked = selected.has(item.id) || already;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40 ${
                          already ? 'opacity-60' : ''
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={already}
                          onCheckedChange={() => !already && toggle(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(item.document_reference || item.document_number) && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {formatSopDisplayId(referenceOf(item))}
                              </Badge>
                            )}
                            <span className="text-sm font-medium truncate">{displayName(item)}</span>
                            {already && (
                              <span className="text-xs text-muted-foreground">already linked</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.document_type || 'Document'}
                            {item.status ? ` · ${item.status}` : ''}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            Connect {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
